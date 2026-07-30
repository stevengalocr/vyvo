import assert from "node:assert/strict";
import test from "node:test";
import { products } from "../src/data/products";
import {
  mapBilbildinProduct,
  type BilbildinProductRow,
} from "../src/lib/bilbildin/catalog";

const core = products.find((product) => product.slug === "vyvo-core");

function makeRow(
  overrides: Partial<BilbildinProductRow> = {},
): BilbildinProductRow {
  assert.ok(core);

  return {
    id: core.id,
    name: "CORE",
    slug: "vyvo-core",
    description: null,
    short_description: null,
    price: 15000,
    compare_at_price: null,
    images: [],
    status: "visible",
    category: "Collectibles",
    tags: [],
    attributes: { sku: "VYV-MINI-CORE-001" },
    featured: false,
    stock_quantity: 10,
    ...overrides,
  };
}

test("Bilbildin catalog mapping keeps VYVO storytelling and replaces commerce data", () => {
  assert.ok(core);

  const mapped = mapBilbildinProduct(core, {
    id: core.id,
    name: "CORE",
    slug: "vyvo-core",
    description: "Descripción administrada",
    short_description: "Resumen administrado",
    price: "15000.00",
    compare_at_price: null,
    images: ["https://vyvocr.com/products/core/concept-primary.png"],
    status: "visible",
    category: "Collectibles",
    tags: ["Articulado"],
    attributes: {
      sku: "VYV-MINI-CORE-001",
      sales_model: "standard",
      display_order: 1,
    },
    featured: true,
    stock_quantity: 4,
  });

  assert.equal(mapped.descriptor, core.descriptor);
  assert.equal(mapped.longDescription, "Descripción administrada");
  assert.equal(mapped.shortDescription, "Resumen administrado");
  assert.equal(mapped.image, "/products/core/concept-primary.png");
  assert.deepEqual(mapped.commerce.price, {
    amountMinor: 1_500_000,
    currency: "CRC",
  });
  assert.equal(mapped.commerce.inventory.availableQuantity, 4);
  assert.equal(mapped.commerce.inventory.status, "available");
  assert.equal(mapped.commerce.purchasable, true);
  assert.doesNotMatch(JSON.stringify(mapped), /cost_price/i);
});

test("zero stock is visible but cannot be purchased", () => {
  assert.ok(core);

  const mapped = mapBilbildinProduct(core, {
    id: core.id,
    name: "CORE",
    slug: "vyvo-core",
    description: null,
    short_description: null,
    price: 15000,
    compare_at_price: null,
    images: [],
    status: "visible",
    category: null,
    tags: [],
    attributes: { sku: "VYV-MINI-CORE-001" },
    featured: false,
    stock_quantity: 0,
  });

  assert.equal(mapped.commerce.stage, "coming_soon");
  assert.equal(mapped.commerce.purchasable, false);
  assert.equal(mapped.commerce.inventory.status, "unavailable");
});

test("Bilbildin mapping never invents a lead time", () => {
  assert.ok(core);

  const mapped = mapBilbildinProduct(
    core,
    makeRow({
      attributes: {
        sku: "VYV-MINI-CORE-001",
        sales_model: "standard",
      },
    }),
  );

  assert.equal(mapped.commerce.fulfillment.leadTimeDays, null);
});

test("Bilbildin mapping accepts only a validated lead time attribute", () => {
  assert.ok(core);

  const valid = mapBilbildinProduct(
    core,
    makeRow({
      attributes: {
        sku: "VYV-MINI-CORE-001",
        sales_model: "standard",
        lead_time_days: { min: 4, max: 8 },
      },
    }),
  );
  const invalid = mapBilbildinProduct(
    core,
    makeRow({
      attributes: {
        sku: "VYV-MINI-CORE-001",
        sales_model: "standard",
        lead_time_days: { min: 8, max: 4 },
      },
    }),
  );

  assert.deepEqual(valid.commerce.fulfillment.leadTimeDays, {
    min: 4,
    max: 8,
  });
  assert.equal(invalid.commerce.fulfillment.leadTimeDays, null);
});
