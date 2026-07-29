import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const seedPath = new URL(
  "../scripts/bilbildin/seed-vyvo.sql",
  import.meta.url,
);

test("VYVO seed is tenant-scoped, pending and idempotent", () => {
  const sql = readFileSync(seedPath, "utf8");

  assert.match(sql, /14d10531-d6fc-45a9-9c74-1ff15c657099/i);
  assert.match(sql, /vyvocr@gmail\.com/i);
  assert.match(sql, /vyvocr\.com/i);
  assert.match(sql, /'starter'/i);
  assert.match(sql, /'pending'/i);
  assert.match(sql, /on conflict \(id\) do update/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
});

test("VYVO seed contains the complete CRC catalog without public secrets", () => {
  const sql = readFileSync(seedPath, "utf8");
  const productIds = sql.match(
    /14d10531-d6fc-45a9-9c74-1ff15c6570(?:01|02|03|04|05|06|08|09|10)/gi,
  );

  assert.equal(new Set(productIds).size, 9);
  for (const name of [
    "CORE",
    "RUSH",
    "WILD",
    "ECHO",
    "SHIFT",
    "NOVA",
    "ARENA",
    "NEXO",
    "ABYSS",
  ]) {
    assert.match(sql, new RegExp(`'${name}'`));
  }

  assert.match(sql, /"currency": "CRC"/);
  assert.match(sql, /"payment_methods": \["sinpe", "transfer", "cash"\]/);
  assert.match(sql, /\b15000\b/);
  assert.match(sql, /\b25000\b/);
  assert.match(sql, /\b7000\b/);
  assert.match(sql, /\b8000\b/);
  assert.doesNotMatch(sql, /service_role|secret_key|anon_key|publishable_key/i);
});
