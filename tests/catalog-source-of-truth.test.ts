import assert from "node:assert/strict";
import test from "node:test";
import {
  mapBilbildinProduct,
  mapStandaloneBilbildinProduct,
  type BilbildinProductRow,
} from "../src/lib/bilbildin/catalog";
import { products } from "../src/data/products";

/**
 * Bilbildin es la fuente de verdad del catálogo.
 *
 * El bug que originó estas pruebas: FORGE existía en Bilbildin, marcado `visible`, y la
 * tienda no lo mostraba. El catálogo recorría los nueve Origins de `src/data/products.ts`
 * y descartaba en silencio cualquier fila cuyo slug no estuviera en esa lista.
 */

function row(overrides: Partial<BilbildinProductRow> = {}): BilbildinProductRow {
  return {
    id: "14d10531-d6fc-45a9-9c74-1ff15c657010",
    name: "FORGE",
    slug: "vyvo-forge",
    description: null,
    short_description: null,
    price: 22000,
    compare_at_price: null,
    images: null,
    status: "visible",
    category: "Drops",
    tags: null,
    attributes: null,
    featured: true,
    stock_quantity: 10,
    ...overrides,
  };
}

test("un producto sin ficha local igual entra al catálogo", () => {
  const mapped = mapStandaloneBilbildinProduct(row(), 10);

  assert.equal(mapped.slug, "vyvo-forge");
  assert.equal(mapped.name, "FORGE");
  assert.equal(mapped.commerce.purchasable, true);
  assert.deepEqual(mapped.commerce.price, { amountMinor: 2200000, currency: "CRC" });
});

test("la categoría de Bilbildin define la línea del storefront", () => {
  const casos: Array<[string | null, string]> = [
    ["Drops", "VYVO Drops"],
    ["DROPS", "VYVO Drops"],
    ["Personalizables", "VYVO Mini Custom"],
    ["Collectibles", "VYVO Mini"],
    [null, "VYVO Mini"],
  ];

  for (const [category, expected] of casos) {
    const mapped = mapStandaloneBilbildinProduct(row({ category }), 10);
    assert.equal(mapped.lineLabel, expected, `categoría ${category}`);
  }
});

test("el acento visual es estable para el mismo slug", () => {
  const a = mapStandaloneBilbildinProduct(row(), 10).accent;
  const b = mapStandaloneBilbildinProduct(row(), 99).accent;
  assert.equal(a, b);
  assert.ok(["purple", "orange", "green", "white"].includes(a));
});

test("no se le inventa historia de marca a una pieza sin texto escrito", () => {
  const mapped = mapStandaloneBilbildinProduct(row(), 10);
  // Sin `quote` inventada: si nadie la escribió, no aparece.
  assert.equal(mapped.quote, "");
  assert.equal(mapped.included.length, 0);
  assert.match(mapped.shortDescription, /FORGE/);
});

test("el texto de Bilbildin gana cuando existe", () => {
  const mapped = mapStandaloneBilbildinProduct(
    row({
      short_description: "Forjado para durar.",
      description: "FORGE nace del fuego y del oficio.",
    }),
    10,
  );
  assert.equal(mapped.shortDescription, "Forjado para durar.");
  assert.equal(mapped.longDescription, "FORGE nace del fuego y del oficio.");
});

test("los Origins conservan su ficha editorial", () => {
  const core = products.find((product) => product.slug === "vyvo-core");
  assert.ok(core);

  const mapped = mapBilbildinProduct(
    core,
    row({ slug: "vyvo-core", name: "CORE", price: 15000 }),
  );

  // El precio y el stock salen de Bilbildin; el relato, del archivo local.
  assert.deepEqual(mapped.commerce.price, { amountMinor: 1500000, currency: "CRC" });
  assert.equal(mapped.quote, core.quote);
  assert.equal(mapped.originsNumber, core.originsNumber);
});

test("una imagen en base64 nunca entra al catálogo", () => {
  // La foto de FORGE llegaba de Bilbildin como data URI de 198 KB y se colaba entera:
  // al JSON-LD y dos veces al payload RSC, unos 600 KB por visita. Un data URI parsea
  // como URL válida, así que la comprobación de origen no lo detenía.
  const dataUri =
    "data:image/png;base64," + "iVBORw0KGgoAAAANSUhEUgAA".repeat(400);
  const mapped = mapStandaloneBilbildinProduct(row({ images: [dataUri] }), 10);

  assert.equal(mapped.image, "/api/media/vyvo-forge");
  assert.ok(mapped.image.length < 60, "la ruta tiene que ser corta");
  assert.doesNotMatch(JSON.stringify(mapped), /data:image/);

  // Y lo mismo para los productos con ficha editorial.
  const core = products.find((product) => product.slug === "vyvo-core");
  assert.ok(core);
  const conFicha = mapBilbildinProduct(
    core,
    row({ slug: "vyvo-core", images: [dataUri] }),
  );
  assert.equal(conFicha.image, "/api/media/vyvo-core");
});

test("una URL normal de imagen pasa sin tocarse", () => {
  const mapped = mapStandaloneBilbildinProduct(
    row({ images: ["https://cdn.example.com/forge.png"] }),
    10,
  );
  assert.equal(mapped.image, "https://cdn.example.com/forge.png");
});

test("un producto agotado o no visible no queda comprable", () => {
  assert.equal(
    mapStandaloneBilbildinProduct(row({ stock_quantity: 0 }), 10).commerce.purchasable,
    false,
  );
  assert.equal(
    mapStandaloneBilbildinProduct(row({ status: "draft" }), 10).commerce.purchasable,
    false,
  );
  assert.equal(
    mapStandaloneBilbildinProduct(row({ stock_quantity: 0 }), 10).availability,
    "sold_out",
  );
});
