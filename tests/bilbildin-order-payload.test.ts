import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AVAILABILITY_CODES,
  BILBILDIN_ORDER_CODES,
  INTERNAL_CODES,
  REQUEST_CODES,
  RETRYABLE_CODES,
  classifyOrderError,
} from "../src/lib/bilbildin/order-errors";
import {
  STOREFRONT_ORDER_RPC,
  buildStorefrontOrderPayload,
  buildStorefrontOrderRpcArgs,
  storefrontOrderResultSchema,
} from "../src/lib/bilbildin/order-payload";

/**
 * El contrato con la puerta de BilBildin, fijado en una prueba.
 *
 * VYVO no tiene una base de pruebas contra la que llamar a `crear_pedido`; lo que
 * sí puede garantizar es que **la forma** de lo que manda y de lo que espera no
 * cambie sin que alguien se entere. Si esta prueba se pone roja, o cambió el
 * payload de VYVO o cambió el contrato del CORE, y en los dos casos hay que mirar
 * `bilbildin/docs/integraciones/CONTRATO-DE-ALINEACION.md` antes de arreglarla.
 */

const input = {
  customer: { name: "María Solano", email: "maria@example.com", phone: "+506 8888 8888" },
  shippingAddress: {
    address: "Del parque 100 m norte",
    city: "San José",
    province: "San José",
    postalCode: "10101",
    country: "CR" as const,
  },
  paymentMethod: "sinpe" as const,
  acceptedTerms: true as const,
  items: [
    { productId: "14d10531-d6fc-45a9-9c74-1ff15c657001", quantity: 2 },
    {
      productId: "14d10531-d6fc-45a9-9c74-1ff15c657005",
      quantity: 1,
      configuration: {
        id: "cfg-424ef6ac-5eba-4f3d-8d95-6b9d672b040f",
        label: "Encargo personalizado",
        details: [{ label: "Idea del cliente", value: "Un perro schnauzer gris." }],
      },
    },
  ],
};

test("la puerta es la que delega en crear_pedido desde el 2026-09-19", () => {
  assert.equal(STOREFRONT_ORDER_RPC, "create_storefront_order_idempotent");
});

test("el payload lleva exactamente lo que la puerta espera, en snake_case", () => {
  const payload = buildStorefrontOrderPayload(input);

  assert.deepEqual(Object.keys(payload).sort(), [
    "accepted_terms",
    "customer",
    "items",
    "payment_method",
    "shipping_address",
  ]);
  assert.deepEqual(payload.customer, input.customer);
  assert.deepEqual(payload.shipping_address, {
    address: "Del parque 100 m norte",
    city: "San José",
    province: "San José",
    postal_code: "10101",
    country: "CR",
  });
  assert.equal(payload.payment_method, "sinpe");
  assert.equal(payload.accepted_terms, true);
});

test("del carrito solo viaja qué y cuánto: nunca precio, costo ni nombre", () => {
  const payload = buildStorefrontOrderPayload(input);

  assert.deepEqual(payload.items[0], {
    product_id: "14d10531-d6fc-45a9-9c74-1ff15c657001",
    quantity: 2,
  });
  assert.deepEqual(Object.keys(payload.items[1]).sort(), [
    "configuration",
    "product_id",
    "quantity",
  ]);
  assert.doesNotMatch(
    JSON.stringify(payload),
    /price|cost|unit_|subtotal|total|product_name|business_id/i,
  );
});

test("los parámetros de la puerta llevan el negocio y la llave del intento", () => {
  const args = buildStorefrontOrderRpcArgs(
    "14d10531-d6fc-45a9-9c74-1ff15c657099",
    "424ef6ac-5eba-4f3d-8d95-6b9d672b040f",
    buildStorefrontOrderPayload(input),
  );
  assert.deepEqual(Object.keys(args).sort(), [
    "p_business_id",
    "p_idempotency_key",
    "p_payload",
  ]);
  assert.equal(args.p_business_id, "14d10531-d6fc-45a9-9c74-1ff15c657099");
  assert.equal(args.p_idempotency_key, "424ef6ac-5eba-4f3d-8d95-6b9d672b040f");
});

test("la respuesta de crear_pedido se acepta tal cual la devuelve el CORE", () => {
  // La forma exacta de `20260919_crear_pedido.sql`: orderId, orderNumber, status,
  // total (numeric, que PostgREST puede serializar como texto) y currency.
  const ok = storefrontOrderResultSchema.safeParse({
    orderId: "b56d5c9f-a498-4f4a-9690-44c64f240745",
    orderNumber: "VYVO-20260929-A1B2C3D4",
    status: "pending",
    total: "15000.00",
    currency: "CRC",
  });
  assert.equal(ok.success, true);

  for (const roto of [
    null,
    {},
    { orderId: "no-es-uuid", orderNumber: "VYVO-20260929-A1B2C3D4", status: "pending", total: 1, currency: "CRC" },
    { orderId: "b56d5c9f-a498-4f4a-9690-44c64f240745", orderNumber: "VYVO-20260929-A1B2C3D4", status: "paid", total: 1, currency: "CRC" },
    { code: "insufficient_stock", error: "Hay menos unidades." },
  ]) {
    assert.equal(storefrontOrderResultSchema.safeParse(roto).success, false);
  }
});

test("las dos rutas que crean pedidos usan el mismo módulo, no una copia", () => {
  for (const archivo of [
    "src/app/api/orders/route.ts",
    "src/lib/bilbildin/custom-requests.ts",
  ]) {
    const fuente = readFileSync(archivo, "utf8");
    assert.match(fuente, /buildStorefrontOrderPayload/, archivo);
    assert.match(fuente, /STOREFRONT_ORDER_RPC/, archivo);
    assert.match(fuente, /storefrontOrderResultSchema/, archivo);
    // Ninguna arma el payload a mano ni nombra la puerta con una cadena suelta.
    assert.doesNotMatch(fuente, /shipping_address:/, archivo);
    assert.doesNotMatch(fuente, /"create_storefront_order_idempotent"/, archivo);
  }
});

test("los ocho códigos de crear_pedido están nombrados, uno por uno", () => {
  assert.deepEqual([...BILBILDIN_ORDER_CODES], [
    "store_not_active",
    "product_unavailable",
    "insufficient_stock",
    "invalid_product",
    "temporarily_unavailable",
    "purchase_limit_exceeded",
    "invalid_request",
    "internal_error",
  ]);

  // Cada código cae en exactamente una familia; ninguno queda sin traducir.
  const familias: Array<readonly string[]> = [
    AVAILABILITY_CODES,
    REQUEST_CODES,
    RETRYABLE_CODES,
    INTERNAL_CODES,
  ];
  for (const code of BILBILDIN_ORDER_CODES) {
    const veces = familias.filter((f) => f.includes(code)).length;
    assert.equal(veces, 1, code);
  }
});

test("la puerta lanza el código y VYVO lo lee del mensaje, con o sin detalle", () => {
  // `raise exception '%', code using detail = ...`: el mensaje es el código a
  // secas, pero un cliente puede envolverlo. Ninguna de las dos formas lo pierde.
  assert.equal(classifyOrderError("insufficient_stock"), "availability");
  assert.equal(classifyOrderError("Error: PURCHASE_LIMIT_EXCEEDED"), "availability");
  assert.equal(classifyOrderError("temporarily_unavailable"), "retryable");
  assert.equal(classifyOrderError("invalid_request"), "request");
  assert.equal(classifyOrderError("internal_error"), "internal");
  // La prosa que no es un código sigue siendo fallo nuestro, no del comprador.
  assert.equal(classifyOrderError("permission denied for function"), "internal");
});
