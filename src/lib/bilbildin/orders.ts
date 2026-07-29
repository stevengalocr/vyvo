import "server-only";

import { createPrivateBilbildinClient } from "./client";
import { getPrivateBilbildinConfig } from "./config";
import { parseOrderReference } from "./order-reference";

export async function getOrderFromReference(reference: string) {
  const config = getPrivateBilbildinConfig(process.env);
  const orderId = parseOrderReference(reference, config.secretKey);
  if (!orderId) return null;

  const supabase = createPrivateBilbildinClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total, payment_method, payment_status, created_at, order_items(product_name, product_image, quantity, unit_price, subtotal), order_tracking(status, title, description, location, created_at)",
    )
    .eq("id", orderId)
    .eq("business_id", config.businessId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
