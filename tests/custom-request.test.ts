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
import { checkoutRequestSchema } from "../src/lib/bilbildin/order-schema";

const validRequest = {
  customer: {
    name: "María Solano",
    email: "maria@example.com",
    phone: "+506 8888 8888",
  },
  shippingAddress: {
    address: "Del parque 100 m norte",
    city: "San José",
    province: "San José",
    postalCode: "10101",
    country: "CR",
  },
  brief: {
    idea: "Quiero una figura de mi perro Rocco, un schnauzer gris, sentado y con su pañuelo azul.",
  },
};

test("un encargo mínimo válido pasa el esquema", () => {
  assert.equal(customRequestSchema.safeParse(validRequest).success, true);
});

test("la idea exige una descripción real, no una palabra suelta", () => {
  assert.equal(
    customRequestSchema.safeParse({ ...validRequest, brief: { idea: "un perro" } })
      .success,
    false,
  );
  assert.equal(
    customRequestSchema.safeParse({
      ...validRequest,
      brief: { idea: "x".repeat(IDEA_MIN) },
    }).success,
    true,
  );
  assert.equal(
    customRequestSchema.safeParse({
      ...validRequest,
      brief: { idea: "x".repeat(IDEA_MAX + 1) },
    }).success,
    false,
  );
});

test("el encargo no acepta método de pago desde el cliente", () => {
  // El pago lo fija el servidor en efectivo: no hay precio que cobrar todavía.
  assert.equal(
    customRequestSchema.safeParse({ ...validRequest, paymentMethod: "sinpe" })
      .success,
    false,
    "el esquema es strict",
  );
});

test("la dirección se valida como en una compra", () => {
  for (const shippingAddress of [
    { ...validRequest.shippingAddress, postalCode: "123" },
    { ...validRequest.shippingAddress, country: "US" },
    { ...validRequest.shippingAddress, address: "abc" },
  ]) {
    assert.equal(
      customRequestSchema.safeParse({ ...validRequest, shippingAddress }).success,
      false,
    );
  }
});

test("el campo trampa se acepta vacío y se rechaza lleno", () => {
  assert.equal(
    customRequestSchema.safeParse({ ...validRequest, website: "" }).success,
    true,
  );
  assert.equal(
    customRequestSchema.safeParse({ ...validRequest, website: "http://spam" }).success,
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

test("la configuración del pedido admite la idea completa y las fotos", () => {
  // El brief viaja dentro del pedido: la idea larga y hasta 5 URLs firmadas tienen
  // que caber sin que el esquema del checkout las rechace.
  const details = [
    { label: "Idea del cliente", value: "x".repeat(1800) },
    ...Array.from({ length: MAX_REFERENCE_IMAGES }, (_, index) => ({
      label: `Referencia ${index + 1}`,
      value: `https://example.supabase.co/storage/v1/object/sign/a/${index}?token=${"t".repeat(120)}`,
    })),
  ];

  const parsed = checkoutRequestSchema.safeParse({
    customer: validRequest.customer,
    shippingAddress: validRequest.shippingAddress,
    paymentMethod: "cash",
    idempotencyKey: "424ef6ac-5eba-4f3d-8d95-6b9d672b040f",
    items: [
      {
        productId: "14d10531-d6fc-45a9-9c74-1ff15c657001",
        quantity: 1,
        configuration: {
          id: "cfg-424ef6ac-5eba-4f3d-8d95-6b9d672b040f",
          label: "Encargo personalizado",
          details,
        },
      },
    ],
  });

  assert.equal(parsed.success, true);
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
  assert.equal(
    detectImageType(new Uint8Array([0x4d, 0x5a, 0x90, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
    null,
  );
  assert.equal(detectImageType(new Uint8Array([0xff, 0xd8])), null);
  assert.equal(ACCEPTED_IMAGE_TYPES.length, 3);
});

test("la única migración nueva es el bucket, y es privado", () => {
  const sql = readFileSync(
    "supabase/migrations/202608090001_create_vyvo_reference_bucket.sql",
    "utf8",
  );

  // Aditiva: no altera ni borra nada del esquema de BilBildin.
  assert.match(sql, /insert into storage\.buckets/);
  assert.doesNotMatch(sql, /alter table/i);
  assert.doesNotMatch(sql, /drop\s+(table|function|column)/i);
  assert.doesNotMatch(sql, /create (table|function)/i);

  // Privado: son fotos de personas y mascotas reales.
  assert.match(sql, /'vyvo-custom-references',\s*\n\s*false/);
  assert.match(sql, /5242880/);
});

test("el endpoint de encargos protege el mismo perímetro que el checkout", () => {
  const route = readFileSync("src/app/api/encargos/route.ts", "utf8");
  assert.match(route, /getBilbildinMode\(process\.env\) !== "bilbildin"/);
  assert.match(route, /originHost !== host/);
  assert.match(route, /parsed\.data\.website/);
  // La llave de idempotencia la genera el servidor, no llega del navegador.
  assert.match(route, /const idempotencyKey = crypto\.randomUUID\(\)/);
  assert.doesNotMatch(route, /form\.get\("idempotencyKey"\)/);
});

test("el producto de encargo queda fuera del catálogo público", () => {
  const provider = readFileSync("src/lib/bilbildin/provider.ts", "utf8");
  // El catálogo recorre los Origins locales, así que un slug ajeno nunca se lista.
  assert.match(provider, /products\.flatMap/);
  assert.match(provider, /CUSTOM_ORDER_SLUG/);

  const localProducts = readFileSync("src/data/products.ts", "utf8");
  assert.doesNotMatch(localProducts, /vyvo-encargo-personalizado/);
});

test("el encargo se registra en efectivo y sin precio propio", () => {
  const lib = readFileSync("src/lib/bilbildin/custom-requests.ts", "utf8");
  assert.match(lib, /payment_method: "cash"/);
  assert.match(lib, /create_storefront_order_idempotent/);
  assert.match(lib, /Encargo sin cotizar/);
  // No inventa montos: el precio lo pone el producto de encargo en Bilbildin.
  assert.doesNotMatch(lib, /amountMinor|unit_price|subtotal/);
});
