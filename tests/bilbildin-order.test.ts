import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkoutRequestSchema } from "../src/lib/bilbildin/order-schema";
import {
  createOrderReference,
  parseOrderReference,
} from "../src/lib/bilbildin/order-reference";
import { classifyOrderError } from "../src/lib/bilbildin/order-errors";

const validCheckout = {
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
  paymentMethod: "sinpe",
  idempotencyKey: "424ef6ac-5eba-4f3d-8d95-6b9d672b040f",
  items: [
    {
      productId: "14d10531-d6fc-45a9-9c74-1ff15c657001",
      quantity: 1,
    },
  ],
};

test("checkout accepts only customer choices, never client prices or costs", () => {
  assert.equal(checkoutRequestSchema.parse(validCheckout).items.length, 1);
  assert.throws(() =>
    checkoutRequestSchema.parse({
      ...validCheckout,
      items: [{ ...validCheckout.items[0], unitPrice: 1 }],
    }),
  );
  assert.throws(() =>
    checkoutRequestSchema.parse({
      ...validCheckout,
      paymentMethod: "card",
    }),
  );
});

test("order references are signed and reject tampering", () => {
  const id = "b56d5c9f-a498-4f4a-9690-44c64f240745";
  const secret = "test-secret-with-more-than-thirty-two-characters";
  const reference = createOrderReference(id, secret);

  assert.equal(parseOrderReference(reference, secret), id);
  assert.equal(
    parseOrderReference(reference.replace("b56d", "a56d"), secret),
    null,
  );
});

test("database order function is transactional, scoped and service-only", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/202607290001_create_vyvo_storefront_order.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(sql, /create or replace function public\.create_storefront_order/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /set search_path = ''/i);
  assert.match(sql, /p_business_id uuid/i);
  assert.match(sql, /business_id = v_business_id/i);
  assert.match(sql, /for update/i);
  assert.match(sql, /account_status = 'active'/i);
  assert.match(sql, /grant execute.*service_role/is);
  assert.match(sql, /revoke all.*public/is);
});

test("public storefront status check exposes only an active boolean", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/202607290002_add_storefront_status_check.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(sql, /returns boolean/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /set search_path = ''/i);
  assert.match(sql, /account_status = 'active'/i);
  assert.match(sql, /plan_status = 'active'/i);
  assert.match(sql, /grant execute.*anon/is);
  assert.doesNotMatch(sql, /owner_email|theme_config|custom_domain/i);
});

test("order retries are serialized and return the original result", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/202607290003_add_storefront_order_idempotency.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(sql, /primary key \(business_id, idempotency_key\)/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
  assert.match(sql, /create_storefront_order\(p_business_id, p_payload\)/i);
  assert.match(sql, /grant execute.*service_role/is);
  assert.match(sql, /revoke all.*anon/is);
});

test("order errors are classified without exposing provider details", () => {
  assert.equal(classifyOrderError("insufficient_stock"), "availability");
  assert.equal(classifyOrderError("store_not_active"), "availability");
  assert.equal(classifyOrderError("connection timeout"), "retryable");
  assert.equal(classifyOrderError("database detail"), "internal");
});
