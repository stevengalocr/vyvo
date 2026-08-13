import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getBilbildinMode,
  getPrivateBilbildinConfig,
} from "@/lib/bilbildin/config";
import { createOrderReference } from "@/lib/bilbildin/order-reference";
import { findOrderIdForTracking } from "@/lib/bilbildin/orders";
import { ORDER_NUMBER_PATTERN } from "@/lib/bilbildin/order-schema";

export const runtime = "nodejs";

const lookupSchema = z
  .object({
    orderNumber: z.string().trim().min(8).max(40),
    email: z.email().max(254),
    website: z.string().max(0).optional(),
  })
  .strict();

/**
 * Freno de fuerza bruta por IP.
 *
 * Es memoria del proceso: en serverless cada instancia lleva su propia cuenta, así que
 * no es una defensa fuerte —está anotado como pendiente de centralizar en el documento
 * de requerimientos—. Aun así encarece el intento más obvio, que es probar números
 * seguidos desde un mismo lugar, y cuesta veinte líneas.
 */
const INTENTOS_MAX = 8;
const VENTANA_MS = 10 * 60 * 1000;
const intentos = new Map<string, { conteo: number; desde: number }>();

function excedeLimite(ip: string) {
  const ahora = Date.now();
  const previo = intentos.get(ip);

  if (!previo || ahora - previo.desde > VENTANA_MS) {
    intentos.set(ip, { conteo: 1, desde: ahora });
    return false;
  }
  previo.conteo += 1;

  // Purga oportunista: sin esto el mapa crece sin techo mientras viva la instancia.
  if (intentos.size > 5000) {
    for (const [clave, valor] of intentos) {
      if (ahora - valor.desde > VENTANA_MS) intentos.delete(clave);
    }
  }

  return previo.conteo > INTENTOS_MAX;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/** Un solo mensaje para todos los fallos: distinguirlos delata qué número existe. */
const NO_ENCONTRADO =
  "No encontramos un pedido con esos datos. Revisá el número y el correo con el que lo hiciste.";

export async function POST(request: Request) {
  if (getBilbildinMode(process.env) !== "bilbildin") {
    return errorResponse("La consulta de pedidos todavía no está activa.", 404);
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

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "desconocida";
  if (excedeLimite(ip)) {
    return errorResponse(
      "Demasiados intentos. Esperá unos minutos y volvé a probar.",
      429,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("La consulta no tiene un formato válido.", 400);
  }

  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) return errorResponse(NO_ENCONTRADO, 404);
  if (parsed.data.website) return errorResponse(NO_ENCONTRADO, 404);

  const numero = parsed.data.orderNumber.trim().toUpperCase();
  if (!ORDER_NUMBER_PATTERN.test(numero)) {
    return errorResponse(NO_ENCONTRADO, 404);
  }

  const orderId = await findOrderIdForTracking(numero, parsed.data.email).catch(
    () => null,
  );
  if (!orderId) return errorResponse(NO_ENCONTRADO, 404);

  // Se devuelve la misma referencia firmada que emite el checkout, así la pantalla de
  // estado es una sola y no hay dos formas distintas de leer un pedido.
  const config = getPrivateBilbildinConfig(process.env);
  return NextResponse.json(
    { reference: createOrderReference(orderId, config.secretKey) },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
