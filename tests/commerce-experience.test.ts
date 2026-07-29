import assert from "node:assert/strict";
import test from "node:test";
import { getCommerceExperience } from "../src/lib/commerce/experience";

function collectCopy(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectCopy);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectCopy);
  }
  return [];
}

test("connected commerce never describes the purchase as a simulation", () => {
  const copy = collectCopy(getCommerceExperience("bilbildin")).join(" ");

  assert.doesNotMatch(
    copy,
    /\bdemo(?:strativ[oa])?\b|\bsimulad[oa]s?\b|sin cobro real/i,
  );
  assert.match(copy, /BilBildin/);
  assert.match(copy, /CRC/);
  assert.match(copy, /pedido/i);
});

test("demo commerce clearly states that it does not create a real order", () => {
  const copy = collectCopy(getCommerceExperience("demo")).join(" ");

  assert.match(copy, /demostrativ[oa]/i);
  assert.match(copy, /no (?:se )?crea (?:ningún )?pedido real/i);
});

test("connected cart and checkout explain the real data flow without demo copy", () => {
  const experience = getCommerceExperience("bilbildin") as ReturnType<
    typeof getCommerceExperience
  > & {
    cart: { emptyDescription: string };
    checkout: { contactPrivacy: string };
  };

  assert.equal(
    experience.cart.emptyDescription,
    "Explorá el catálogo y agregá productos para recorrer la experiencia de compra.",
  );
  assert.equal(
    experience.checkout.contactPrivacy,
    "Usaremos estos datos únicamente para coordinar tu pedido.",
  );
  assert.doesNotMatch(
    `${experience.cart.emptyDescription} ${experience.checkout.contactPrivacy}`,
    /simulaci[oó]n|decompra/i,
  );
});
