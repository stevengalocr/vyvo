import { z } from "zod";
import type { CartConfiguration } from "@/types/commerce";

/**
 * El contrato con la puerta `create_storefront_order_idempotent(uuid, uuid, jsonb)`,
 * que desde el 19 de septiembre de 2026 delega en `crear_pedido` de BilBildin
 * (`bilbildin/supabase/migrations/20260919_puertas_viejas_delegan.sql`).
 *
 * Vive en un solo módulo porque lo usan dos rutas —el checkout y los encargos— y
 * dos copias del mismo payload son dos oportunidades de que una quede vieja. Es
 * también lo que la prueba `tests/bilbildin-order-payload.test.ts` fija: si la
 * forma cambia, esa prueba se pone roja antes que producción.
 *
 * Del carrito **solo viaja qué y cuánto**: precio, costo y nombre salen de la base.
 * `accepted_terms` viaja como `true` cuando la persona marcó la casilla; la versión
 * de términos la pone el servidor de BilBildin (`terms_version`), nunca el navegador.
 * Si el negocio configura `terms_url` y este campo no llega, `crear_pedido` rechaza
 * con `invalid_request` — por eso no es opcional.
 */

export const STOREFRONT_ORDER_RPC = "create_storefront_order_idempotent" as const;

export type StorefrontOrderPaymentMethod = "sinpe" | "transfer" | "cash";

export type StorefrontOrderInput = {
  customer: { name: string; email: string; phone: string };
  shippingAddress: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: "CR";
  };
  paymentMethod: StorefrontOrderPaymentMethod;
  acceptedTerms: true;
  items: Array<{
    productId: string;
    quantity: number;
    configuration?: CartConfiguration;
  }>;
};

export type StorefrontOrderPayload = {
  customer: { name: string; email: string; phone: string };
  shipping_address: {
    address: string;
    city: string;
    province: string;
    postal_code: string;
    country: "CR";
  };
  payment_method: StorefrontOrderPaymentMethod;
  accepted_terms: true;
  items: Array<{
    product_id: string;
    quantity: number;
    configuration?: CartConfiguration;
  }>;
};

export function buildStorefrontOrderPayload(
  input: StorefrontOrderInput,
): StorefrontOrderPayload {
  return {
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
    },
    shipping_address: {
      address: input.shippingAddress.address,
      city: input.shippingAddress.city,
      province: input.shippingAddress.province,
      postal_code: input.shippingAddress.postalCode,
      country: input.shippingAddress.country,
    },
    payment_method: input.paymentMethod,
    accepted_terms: input.acceptedTerms,
    items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      ...(item.configuration ? { configuration: item.configuration } : {}),
    })),
  };
}

/** Los parámetros con nombre que recibe la puerta. */
export function buildStorefrontOrderRpcArgs(
  businessId: string,
  idempotencyKey: string,
  payload: StorefrontOrderPayload,
) {
  return {
    p_business_id: businessId,
    p_idempotency_key: idempotencyKey,
    p_payload: payload,
  };
}

/** Lo que `crear_pedido` devuelve cuando el pedido entró. */
export const storefrontOrderResultSchema = z.object({
  orderId: z.uuid(),
  orderNumber: z.string().min(8).max(40),
  status: z.literal("pending"),
  total: z.union([z.string(), z.number()]),
  currency: z.literal("CRC"),
});

export type StorefrontOrderResult = z.infer<typeof storefrontOrderResultSchema>;
