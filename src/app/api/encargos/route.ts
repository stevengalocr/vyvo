import { NextResponse } from "next/server";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { CUSTOM_ORDER_SLUG, getCustomOrderProduct } from "@/lib/bilbildin/provider";
import { createOrderReference } from "@/lib/bilbildin/order-reference";
import { getPrivateBilbildinConfig } from "@/lib/bilbildin/config";
import {
  customRequestSchema,
  MAX_IMAGE_BYTES,
  MAX_REFERENCE_IMAGES,
} from "@/lib/bilbildin/custom-request-schema";
import {
  CustomProductMissingError,
  ReferenceImageError,
  createCustomOrder,
  referenceFolder,
  uploadReferenceImages,
} from "@/lib/bilbildin/custom-requests";
import { classifyOrderError } from "@/lib/bilbildin/order-errors";

export const runtime = "nodejs";

/**
 * Encargos personalizados.
 *
 * Espeja la postura de seguridad de /api/orders — mismo control de origen, mismo campo
 * trampa, mismo bloqueo en modo demo — pero acepta multipart porque el cliente puede
 * adjuntar fotos, y arma el pedido contra el producto de encargo en ₡0.
 */

// El JSON del brief pesa poco; el grueso son hasta 5 imágenes de 5 MB.
const MAX_BODY_BYTES = MAX_REFERENCE_IMAGES * MAX_IMAGE_BYTES + 100_000;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

const IMAGE_ERRORS: Record<string, string> = {
  too_many_images: `Podés adjuntar hasta ${MAX_REFERENCE_IMAGES} imágenes.`,
  image_too_large: "Cada imagen debe pesar menos de 5 MB.",
  unsupported_image: "Solo aceptamos imágenes JPG, PNG o WEBP.",
  upload_failed: "No pudimos guardar las imágenes. Intentá nuevamente.",
};

/**
 * Chequeo de estado. Existe porque la única forma de saber si los encargos estaban
 * habilitados era mandar uno de verdad, y no tiene sentido crear un pedido ficticio
 * solo para comprobar configuración.
 *
 * No expone nada sensible: ni el id del producto ni datos de clientes. Solo si el
 * flujo puede operar y, si no, por qué.
 */
export async function GET() {
  if (getBilbildinMode(process.env) !== "bilbildin") {
    return NextResponse.json(
      {
        listo: false,
        motivo: "BILBILDIN_ENABLED no está en true.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  const product = await getCustomOrderProduct().catch(() => null);
  if (!product) {
    return NextResponse.json(
      {
        listo: false,
        motivo: `No se encontró un producto visible cuyo slug empiece por "${CUSTOM_ORDER_SLUG}".`,
        sugerencia:
          "Creá el producto en Bilbildin con ese slug, precio ₡0, stock alto y estado visible.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      listo: product.stock > 0,
      producto: { nombre: product.name, slug: product.slug, stock: product.stock },
      ...(product.stock > 0
        ? {}
        : { motivo: "El producto de encargo se quedó sin stock. Reponelo." }),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (getBilbildinMode(process.env) !== "bilbildin") {
    return errorResponse("Los encargos todavía no están activos.", 404);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("El encargo no tiene un formato válido.", 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return errorResponse("El encargo no tiene un formato válido.", 400);
  }

  const parsed = customRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Revisá los datos del encargo e intentá de nuevo.", 400);
  }
  if (parsed.data.website) {
    return errorResponse("No fue posible procesar el encargo.", 400);
  }

  const files = form
    .getAll("references")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > MAX_REFERENCE_IMAGES) {
    return errorResponse(IMAGE_ERRORS.too_many_images, 400);
  }

  // La llave de idempotencia la genera el servidor: si el cliente reintenta el envío,
  // vuelve a subir las fotos pero crea un pedido nuevo, que es preferible a que un
  // valor manipulado desde el navegador colisione con el pedido de otra persona.
  const idempotencyKey = crypto.randomUUID();

  // Las imágenes se suben antes de crear el pedido para no dejar encargos apuntando a
  // archivos que nunca llegaron. Si falla la subida, no hay pedido.
  let images;
  try {
    images = await uploadReferenceImages(files, referenceFolder());
  } catch (error) {
    if (error instanceof ReferenceImageError) {
      return errorResponse(
        IMAGE_ERRORS[error.message] ?? IMAGE_ERRORS.upload_failed,
        400,
      );
    }
    return errorResponse(IMAGE_ERRORS.upload_failed, 502);
  }

  try {
    const result = await createCustomOrder(parsed.data, images, idempotencyKey);
    const config = getPrivateBilbildinConfig(process.env);
    return NextResponse.json(
      {
        reference: createOrderReference(result.orderId, config.secretKey),
        orderNumber: result.orderNumber,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof CustomProductMissingError) {
      // Falta crear el producto de encargo en Bilbildin. Es configuración, no un fallo
      // del cliente: no tiene sentido pedirle que reintente.
      return errorResponse(
        "Los encargos todavía no están habilitados. Escribinos y lo coordinamos.",
        503,
      );
    }
    const message = error instanceof Error ? error.message : "";
    const kind = classifyOrderError(message);
    if (kind === "availability") {
      return errorResponse(
        "No pudimos registrar el encargo en este momento. Intentá más tarde.",
        409,
      );
    }
    if (kind === "retryable") {
      return errorResponse(
        "El servicio está tardando más de lo esperado. Intentá nuevamente.",
        503,
      );
    }
    return errorResponse("No pudimos registrar el encargo. Intentá nuevamente.", 500);
  }
}
