import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ORDER_NUMBER_PATTERN } from "../src/lib/bilbildin/order-schema";
import {
  createOrderReference,
  parseOrderReference,
} from "../src/lib/bilbildin/order-reference";

const SECRETO = "x".repeat(48);
const ORDER_ID = "424ef6ac-5eba-4f3d-8d95-6b9d672b040f";

test("el patrón acepta el formato real y rechaza intentos de inyección", () => {
  assert.ok(ORDER_NUMBER_PATTERN.test("VYVO-20260809-A1B2C3D4"));

  for (const invalido of [
    "vyvo-20260809-a1b2c3d4", // se normaliza a mayúsculas antes de comparar
    "VYVO-2026089-A1B2C3D4", // fecha corta
    "VYVO-20260809-A1B2C3D", // hash corto
    "VYVO-20260809-A1B2C3D4X", // hash largo
    "VYVO-20260809-A1B2C3D4' OR '1'='1",
    "%' OR order_number LIKE '%",
    "",
  ]) {
    assert.equal(
      ORDER_NUMBER_PATTERN.test(invalido),
      false,
      `debería rechazar: ${invalido}`,
    );
  }
});

test("la consulta exige número y correo, no solo el número", () => {
  const lib = readFileSync("src/lib/bilbildin/orders.ts", "utf8");
  // El número viaja por WhatsApp y queda en capturas: no puede ser la única llave.
  assert.match(lib, /findOrderIdForTracking\(\s*orderNumber: string,\s*email: string,/);
  assert.match(lib, /registrado !== correo/);
  // Siempre acotado al negocio: nunca puede leer pedidos de otro tenant.
  assert.match(lib, /\.eq\("business_id", config\.businessId\)/);
});

test("todos los fallos devuelven el mismo mensaje, para no delatar qué número existe", () => {
  const route = readFileSync("src/app/api/rastreo/route.ts", "utf8");
  const respuestas = [...route.matchAll(/errorResponse\(\s*([A-Z_]+|"[^"]*")/g)].map(
    (m) => m[1],
  );
  const deLookup = respuestas.filter((r) => r === "NO_ENCONTRADO");
  assert.ok(
    deLookup.length >= 4,
    "el esquema inválido, la trampa, el patrón y el no-encontrado comparten mensaje",
  );
  // Y ninguno responde 200 con pistas.
  assert.doesNotMatch(route, /correo no coincide|no existe ese pedido/i);
});

test("el endpoint de consulta protege el mismo perímetro que el resto", () => {
  const route = readFileSync("src/app/api/rastreo/route.ts", "utf8");
  assert.match(route, /getBilbildinMode\(process\.env\) !== "bilbildin"/);
  assert.match(route, /originHost !== host/);
  assert.match(route, /parsed\.data\.website/);
  assert.match(route, /excedeLimite\(ip\)/);
  assert.match(route, /Demasiados intentos[\s\S]*?429/);
});

test("la referencia que devuelve la consulta es la misma que firma el checkout", () => {
  // Una sola forma de leer un pedido: la consulta valida identidad y emite la misma
  // referencia firmada, en vez de abrir un segundo camino con otras reglas.
  const route = readFileSync("src/app/api/rastreo/route.ts", "utf8");
  assert.match(route, /createOrderReference\(orderId, config\.secretKey\)/);

  const referencia = createOrderReference(ORDER_ID, SECRETO);
  assert.equal(parseOrderReference(referencia, SECRETO), ORDER_ID);

  // Una referencia manipulada no abre nada.
  const [id] = referencia.split(".");
  assert.equal(parseOrderReference(`${id}.firmaFalsa`, SECRETO), null);
  assert.equal(parseOrderReference(referencia, "y".repeat(48)), null);
});

test("la confirmación pinta la línea de tiempo y sigue fuera del índice", () => {
  const page = readFileSync("src/app/checkout/confirmacion/page.tsx", "utf8");
  assert.match(page, /order\.order_tracking/);
  assert.match(page, /order-timeline/);
  // Es una pantalla con datos personales: nunca indexable.
  assert.match(page, /robots:\s*\{\s*index: false/);
});

test("/rastreo es pública, indexable y está enlazada", () => {
  const page = readFileSync("src/app/rastreo/page.tsx", "utf8");
  assert.match(page, /canonical: "\/rastreo"/);
  assert.doesNotMatch(page, /index: false/);

  assert.match(readFileSync("src/app/sitemap.ts", "utf8"), /"\/rastreo"/);
  assert.match(readFileSync("src/components/footer.tsx", "utf8"), /"\/rastreo"/);
});
