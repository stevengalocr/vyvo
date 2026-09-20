export type OrderErrorKind = "availability" | "request" | "retryable" | "internal";

/**
 * BilBildin devuelve ocho códigos. Acá estaban tres, y el resto caía en
 * «internal»: un comprador con una pieza dada de baja (`invalid_product`) o que
 * pedía más del tope (`purchase_limit_exceeded`) leía «no pudimos confirmar el
 * pedido», que no le dice qué hacer. Los dos se arreglan igual que un agotado:
 * revisando el carrito.
 *
 * `invalid_request` tampoco es una falla interna: es un dato que falta o los
 * términos sin aceptar. Decirle «intentá nuevamente» lo manda a repetir el mismo
 * rechazo. Y `internal_error` es el único que el comprador no puede arreglar:
 * ahí lo útil es decirle a quién escribir.
 */
export function classifyOrderError(message: string): OrderErrorKind {
  if (
    /store_not_active|product_unavailable|insufficient_stock|invalid_product|purchase_limit_exceeded/i.test(
      message,
    )
  ) {
    return "availability";
  }
  if (/invalid_request|invalid_checkout_payload/i.test(message)) {
    return "request";
  }
  if (/timeout|temporarily|connection/i.test(message)) {
    return "retryable";
  }
  return "internal";
}
