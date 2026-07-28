import assert from "node:assert/strict";
import test from "node:test";
import { products } from "../src/data/products";
import {
  storeConfiguration,
  storefrontProducts,
} from "../src/data/storefront";
import {
  calculateCartTotals,
  normalizeCartItems,
  resolveCartLines,
} from "../src/lib/commerce/cart";

test("Origins contains exactly nine unique concepts", () => {
  assert.equal(products.length, 9);
  assert.equal(new Set(products.map((product) => product.slug)).size, 9);
  assert.equal(new Set(products.map((product) => product.sku)).size, 9);
});

test("Origins 007 is intentionally absent", () => {
  assert.equal(
    products.some((product) => product.originsNumber === "007"),
    false,
  );
});

test("storefront records expose a complete demo purchase model", () => {
  assert.equal(storefrontProducts.length, products.length);
  assert.equal(storeConfiguration.mode, "demo");
  assert.equal(storeConfiguration.checkoutEnabled, true);
  assert.equal(storeConfiguration.cartEnabled, true);
  assert.equal(storeConfiguration.inventoryProvider, "external_pending");

  for (const product of storefrontProducts) {
    assert.equal(product.commerce.stage, "preview");
    assert.equal(product.commerce.purchasable, true);
    assert.equal(product.commerce.price?.currency, "USD");
    assert.equal(product.commerce.currency, "USD");
    assert.equal(product.commerce.inventory.source, "external");
    assert.equal(product.commerce.inventory.availableQuantity, null);
    assert.equal(product.commerce.fulfillment.leadTimeDays, null);
    assert.equal(product.commerce.variants.length, 1);
    assert.equal(product.commerce.variants[0]?.purchasable, true);
  }
});

test("every external inventory reference maps to a unique product SKU", () => {
  const externalSkus = storefrontProducts.map(
    (product) => product.commerce.inventory.externalSku,
  );
  assert.equal(new Set(externalSkus).size, storefrontProducts.length);
  assert.deepEqual(externalSkus, products.map((product) => product.sku));
});

test("cart normalizes persisted data and calculates demo totals", () => {
  const core = storefrontProducts[0];
  assert.ok(core);
  const variant = core.commerce.variants[0];
  assert.ok(variant);

  const items = normalizeCartItems([
    { slug: core.slug, variantId: variant.id, quantity: 2 },
    { slug: "invalid", variantId: "invalid", quantity: 99 },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0]?.quantity, 2);

  const lines = resolveCartLines(items);
  const totals = calculateCartTotals(lines);
  assert.equal(lines.length, 1);
  assert.equal(
    totals.subtotal.amountMinor,
    (variant.price?.amountMinor ?? 0) * 2,
  );
  assert.equal(totals.shipping.amountMinor, 0);
  assert.equal(totals.total.amountMinor, totals.subtotal.amountMinor);
});

test("configured products keep a safe local brief in the cart", () => {
  const shift = storefrontProducts.find((product) => product.slug === "vyvo-shift");
  assert.ok(shift);
  const variant = shift.commerce.variants[0];
  assert.ok(variant);

  const items = normalizeCartItems([
    {
      slug: shift.slug,
      variantId: variant.id,
      quantity: 1,
      configuration: {
        id: "cfg-12345678",
        label: "SHIFT · VECTOR",
        details: [
          { label: "Paleta principal", value: "Negro + violeta" },
          { label: "Nombre corto", value: "VECTOR" },
        ],
      },
    },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0]?.id, "cfg-12345678");
  assert.equal(items[0]?.configuration?.label, "SHIFT · VECTOR");
  assert.equal(items[0]?.configuration?.details.length, 2);
  assert.equal(
    resolveCartLines(items)[0]?.configuration?.details[0]?.value,
    "Negro + violeta",
  );
});
