import "server-only";

import { createPrivateBilbildinClient } from "./client";
import { getPrivateBilbildinConfig } from "./config";
import { parseOrderReference } from "./order-reference";
import { ORDER_NUMBER_PATTERN } from "./order-schema";

/**
 * Busca un pedido para consultar su estado.
 *
 * Pide número **y** correo a propósito. El número tiene ocho caracteres hexadecimales
 * por día: no es trivial de adivinar, pero tampoco es un secreto —viaja por WhatsApp,
 * se comparte en capturas, queda en el historial del navegador—. Con solo ese dato,
 * quien enumere números podría leer el nombre, el teléfono y la dirección de otra
 * persona. El correo actúa como segundo factor y no se puede deducir del número.
 *
 * Devuelve el id o `null`, sin distinguir nunca entre “no existe” y “el correo no
 * coincide”: esa diferencia le confirmaría a quien enumera que el número es válido.
 */
export async function findOrderIdForTracking(
  orderNumber: string,
  email: string,
): Promise<string | null> {
  const numero = orderNumber.trim().toUpperCase();
  const correo = email.trim().toLowerCase();
  if (!ORDER_NUMBER_PATTERN.test(numero) || !correo.includes("@")) return null;

  const config = getPrivateBilbildinConfig(process.env);
  const supabase = createPrivateBilbildinClient();

  const { data, error } = await supabase
    .from("orders")
    .select("id, store_customers(email)")
    .eq("order_number", numero)
    .eq("business_id", config.businessId)
    .maybeSingle();

  if (error || !data) return null;

  const customer = data.store_customers as { email?: string } | null;
  const registrado = customer?.email?.trim().toLowerCase();
  if (!registrado || registrado !== correo) return null;

  return data.id as string;
}

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
