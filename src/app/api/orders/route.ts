import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createPrivateBilbildinClient,
} from "@/lib/bilbildin/client";
import {
  getBilbildinMode,
  getPrivateBilbildinConfig,
} from "@/lib/bilbildin/config";
import {
  createOrderReference,
} from "@/lib/bilbildin/order-reference";
import {
  checkoutRequestSchema,
} from "@/lib/bilbildin/order-schema";
import { classifyOrderError } from "@/lib/bilbildin/order-errors";
import { LEGAL_WHATSAPP } from "@/lib/legal";

export const runtime = "nodejs";

const rpcResultSchema = z.object({
  orderId: z.uuid(),
  orderNumber: z.string().min(8).max(40),
  status: z.literal("pending"),
  total: z.union([z.string(), z.number()]),
  currency: z.literal("CRC"),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function POST(request: Request) {
  if (getBilbildinMode(process.env) !== "bilbildin") {
    return errorResponse("La creación de pedidos todavía no está activa.", 404);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 50_000) {
    return errorResponse("La solicitud excede el tamaño permitido.", 413);
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  if (!originHost || !host || originHost !== host) {
    return errorResponse("Origen de solicitud no permitido.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("El pedido no tiene un formato válido.", 400);
  }

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Revisá los datos del pedido e intentá de nuevo.", 400);
  }
  if (parsed.data.website) {
    return errorResponse("No fue posible procesar el pedido.", 400);
  }

  const config = getPrivateBilbildinConfig(process.env);
  const supabase = createPrivateBilbildinClient();
  const payload = {
    customer: parsed.data.customer,
    shipping_address: {
      address: parsed.data.shippingAddress.address,
      city: parsed.data.shippingAddress.city,
      province: parsed.data.shippingAddress.province,
      postal_code: parsed.data.shippingAddress.postalCode,
      country: parsed.data.shippingAddress.country,
    },
    payment_method: parsed.data.paymentMethod,
    items: parsed.data.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      ...(item.configuration
        ? { configuration: item.configuration }
        : {}),
    })),
  };
  const { data, error } = await supabase.rpc(
    "create_storefront_order_idempotent",
    {
      p_business_id: config.businessId,
      p_idempotency_key: parsed.data.idempotencyKey,
      p_payload: payload,
    },
  );

  if (error) {
    const kind = classifyOrderError(error.message);
    if (kind === "availability") {
      return errorResponse(
        "La disponibilidad cambió. Revisá tu carrito e intentá de nuevo.",
        409,
      );
    }
    if (kind === "retryable") {
      return errorResponse(
        "El servicio está tardando más de lo esperado. Intentá nuevamente.",
        503,
      );
    }
    if (kind === "request") {
      return errorResponse(
        "Falta un dato o hay uno mal escrito. Revisá el formulario y volvé a enviarlo.",
        400,
      );
    }
    return errorResponse(
      `No pudimos registrar tu pedido y no se te cobró nada. Escribinos por WhatsApp al ${LEGAL_WHATSAPP} y lo resolvemos.`,
      500,
    );
  }

  const result = rpcResultSchema.safeParse(data);
  if (!result.success) {
    return errorResponse("Bilbildin devolvió una respuesta inesperada.", 502);
  }

  return NextResponse.json(
    {
      reference: createOrderReference(
        result.data.orderId,
        config.secretKey,
      ),
      orderNumber: result.data.orderNumber,
    },
    {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
