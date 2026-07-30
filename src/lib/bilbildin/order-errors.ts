export type OrderErrorKind = "availability" | "retryable" | "internal";

export function classifyOrderError(message: string): OrderErrorKind {
  if (
    /store_not_active|product_unavailable|insufficient_stock/i.test(message)
  ) {
    return "availability";
  }
  if (/timeout|temporarily|connection/i.test(message)) {
    return "retryable";
  }
  return "internal";
}
