import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ACCEPTED_IMAGE_TYPES,
  IDEA_MAX,
  IDEA_MIN,
  MAX_REFERENCE_IMAGES,
  customRequestSchema,
  detectImageType,
} from "../src/lib/bilbildin/custom-request-schema";

const validRequest = {
  customer: {
    name: "María Solano",
    email: "maria@example.com",
    phone: "+506 8888 8888",
  },
  brief: {
    idea: "Quiero una figura de mi perro Rocco, un schnauzer gris, sentado y con su pañuelo azul.",
  },
};

test("un encargo mínimo válido pasa el esquema", () => {
  const parsed = customRequestSchema.safeParse(validRequest);
  assert.equal(parsed.success, true);
});

test("la idea exige una descripción real, no una palabra suelta", () => {
  const tooShort = customRequestSchema.safeParse({
    ...validRequest,
    brief: { idea: "un perro" },
  });
  assert.equal(tooShort.success, false);

  const atLimit = customRequestSchema.safeParse({
    ...validRequest,
    brief: { idea: "x".repeat(IDEA_MIN) },
  });
  assert.equal(atLimit.success, true);

  const tooLong = customRequestSchema.safeParse({
    ...validRequest,
    brief: { idea: "x".repeat(IDEA_MAX + 1) },
  });
  assert.equal(tooLong.success, false);
});

test("el encargo no pide dirección ni método de pago: no hay compra todavía", () => {
  const withShipping = customRequestSchema.safeParse({
    ...validRequest,
    shippingAddress: { address: "Del parque 100 m norte" },
  });
  assert.equal(withShipping.success, false, "el esquema es strict");

  const parsed = customRequestSchema.parse(validRequest);
  assert.equal("paymentMethod" in parsed, false);
});

test("el campo trampa se acepta vacío y se rechaza lleno", () => {
  assert.equal(
    customRequestSchema.safeParse({ ...validRequest, website: "" }).success,
    true,
  );
  assert.equal(
    customRequestSchema.safeParse({ ...validRequest, website: "http://spam" })
      .success,
    false,
  );
});

test("el contacto se valida antes de aceptar el encargo", () => {
  for (const customer of [
    { ...validRequest.customer, email: "no-es-un-correo" },
    { ...validRequest.customer, name: "M" },
    { ...validRequest.customer, phone: "123" },
  ]) {
    assert.equal(
      customRequestSchema.safeParse({ ...validRequest, customer }).success,
      false,
    );
  }
});

test("el tipo de imagen sale de la firma binaria, no del nombre ni del Content-Type", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
  ]);
  const webp = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
  ]);
  assert.equal(detectImageType(jpeg), "image/jpeg");
  assert.equal(detectImageType(png), "image/png");
  assert.equal(detectImageType(webp), "image/webp");

  // Un ejecutable renombrado a .jpg no pasa.
  const notAnImage = new Uint8Array([0x4d, 0x5a, 0x90, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(detectImageType(notAnImage), null);
  assert.equal(detectImageType(new Uint8Array([0xff, 0xd8])), null);

  for (const type of ACCEPTED_IMAGE_TYPES) {
    assert.equal(typeof type, "string");
  }
});

test("la migración de encargos no toca estructuras existentes de Bilbildin", () => {
  const sql = readFileSync(
    "supabase/migrations/202608090001_create_vyvo_custom_request.sql",
    "utf8",
  );

  // Aditiva: crea lo suyo y no altera ni borra nada de BilBildin.
  assert.match(sql, /create table if not exists public\.storefront_custom_requests/);
  assert.doesNotMatch(sql, /alter table public\.orders/i);
  assert.doesNotMatch(sql, /drop\s+(table|function|column)/i);

  // Misma postura de seguridad que create_storefront_order.
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /enable row level security/);
  assert.match(
    sql,
    /revoke all on function public\.create_storefront_custom_request\(uuid, jsonb\)\s*\nfrom public, anon, authenticated;/,
  );
  assert.match(sql, /grant execute on function[\s\S]*?to service_role;/);

  // El bucket de referencias es privado: son fotos de gente real.
  assert.match(sql, /'vyvo-custom-references'[\s\S]*?false/);
});

test("el endpoint de encargos exige el mismo origen y rechaza el modo demo", () => {
  const route = readFileSync("src/app/api/encargos/route.ts", "utf8");
  assert.match(route, /getBilbildinMode\(process\.env\) !== "bilbildin"/);
  assert.match(route, /originHost !== host/);
  assert.match(route, /parsed\.data\.website/);
  assert.ok(MAX_REFERENCE_IMAGES >= 1);
});
