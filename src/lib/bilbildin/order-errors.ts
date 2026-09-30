export type OrderErrorKind = "availability" | "request" | "retryable" | "internal";

/**
 * Los ocho códigos que devuelve `crear_pedido` de BilBildin
 * (`bilbildin/lib/errores-pedido.ts`), nombrados uno por uno. La puerta
 * `create_storefront_order_idempotent` los **lanza** y acá llegan en
 * `error.message`; nada de esto adivina por prosa.
 *
 * Antes había tres, y el resto caía en «internal»: un comprador con una pieza
 * dada de baja (`invalid_product`) o que pedía más del tope
 * (`purchase_limit_exceeded`) leía «no pudimos confirmar el pedido», que no le
 * dice qué hacer. Los dos se arreglan igual que un agotado: revisando el carrito.
 *
 * `invalid_request` tampoco es una falla interna: es un dato que falta o los
 * términos sin aceptar. Decirle «intentá nuevamente» lo manda a repetir el mismo
 * rechazo. `temporarily_unavailable` es el único en el que reintentar sí sirve.
 * Y `internal_error` es el único que el comprador no puede arreglar: ahí lo útil
 * es decirle a quién escribir.
 */
export const AVAILABILITY_CODES = [
  "store_not_active",
  "product_unavailable",
  "insufficient_stock",
  "invalid_product",
  "purchase_limit_exceeded",
] as const;

export const REQUEST_CODES = [
  "invalid_request",
  // Nombre propio de la puerta de VYVO cuando el JSON ni siquiera tiene forma.
  "invalid_checkout_payload",
] as const;

export const RETRYABLE_CODES = ["temporarily_unavailable"] as const;

export const INTERNAL_CODES = ["internal_error"] as const;

/** Los ocho de BilBildin, en el orden de `CODIGOS_PEDIDO` del CORE. */
export const BILBILDIN_ORDER_CODES = [
  "store_not_active",
  "product_unavailable",
  "insufficient_stock",
  "invalid_product",
  "temporarily_unavailable",
  "purchase_limit_exceeded",
  "invalid_request",
  "internal_error",
] as const;

function matches(message: string, codes: readonly string[]) {
  const normalized = message.toLowerCase();
  return codes.some((code) => normalized.includes(code));
}

export function classifyOrderError(message: string): OrderErrorKind {
  if (matches(message, AVAILABILITY_CODES)) return "availability";
  if (matches(message, REQUEST_CODES)) return "request";
  if (matches(message, RETRYABLE_CODES)) return "retryable";
  // Un fallo de transporte (la base no contestó) también se reintenta.
  if (/timeout|temporarily|connection/i.test(message)) return "retryable";
  // `internal_error` y cualquier cosa que no se reconozca: fallo nuestro.
  return "internal";
}
