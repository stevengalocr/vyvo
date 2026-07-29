# VYVO Bilbildin Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register VYVO as a pending Bilbildin tenant, seed its nine-product CRC catalog, and make the existing Next.js storefront switch safely from demo data to Bilbildin through Vercel configuration.

**Architecture:** A server-only `StorefrontProvider` selects the current local demo catalog or a cached Bilbildin adapter. The cart remains browser-local, while a same-origin checkout route validates and recreates every order from trusted Bilbildin rows before writing customers, orders, stock movements, and tracking. Activation is fail-closed and controlled by `BILBILDIN_ENABLED`.

**Tech Stack:** Next.js 16.2.11 App Router, React 19.2.8, TypeScript 5.9.2, Zod 4.1.12, `@supabase/supabase-js` 2.111.0, Supabase PostgreSQL, Vercel.

## Global Constraints

- Work directly on `main`; commit each independently reviewable task and push only after all final checks pass.
- Preserve the current VYVO visual system and the navigation `Catálogo`, `Personalizar`, `Drops`.
- Default to `BILBILDIN_ENABLED=false`; the unconfigured deployment must remain a complete demo.
- In live mode, Bilbildin is the single source of catalog, prices, stock, customers, orders, and tracking.
- Currency is `CRC`; database prices are whole colones and UI `Money.amountMinor` is cents (`price * 100`).
- VYVO starts as plan `starter`, account `pending`, domain `vyvocr.com`, owner `vyvocr@gmail.com`.
- The nine seeded products are visible with stock `0`; no real checkout can succeed before admin review and activation.
- SINPE, transfer, and cash are selected at checkout but financial details are coordinated later through `+506 7287 4779`.
- Never commit publishable, anon, secret, or service-role key values.
- Import the privileged Supabase client from `server-only` modules only.
- Every Bilbildin query fixes the configured `business_id`; never accept a tenant ID from the browser.
- Never read or copy private catalog, cost, customer, order, or inventory data from another Bilbildin tenant.
- Keep admin, product editing, cancellation, and tracking updates outside this repository.
- Follow TDD for every behavior change and run browser verification after the production server starts.

---

## File Structure

### New files

- `src/lib/bilbildin/config.ts` — validates feature mode and environment variables.
- `src/lib/bilbildin/client.ts` — creates public and privileged server-only Supabase clients.
- `src/lib/bilbildin/types.ts` — Bilbildin row, order input, order result, and tracking types.
- `src/lib/bilbildin/catalog.ts` — reads and maps Bilbildin catalog/configuration.
- `src/lib/bilbildin/orders.ts` — validates and creates orders; reads confirmation/tracking.
- `src/lib/commerce/store.ts` — selects demo or Bilbildin provider and exposes a storefront snapshot.
- `src/app/api/checkout/route.ts` — same-origin JSON boundary for a real checkout.
- `src/app/checkout/confirmacion/[orderId]/page.tsx` — real order confirmation.
- `src/app/tracking/[orderId]/page.tsx` — read-only tracking timeline.
- `scripts/bilbildin/seed-vyvo.sql` — auditable, idempotent VYVO tenant/catalog seed.
- `tests/bilbildin-config.test.ts` — configuration and fail-closed tests.
- `tests/bilbildin-catalog.test.ts` — catalog mapping and currency/stock tests.
- `tests/bilbildin-seed.test.ts` — seed manifest invariants.
- `tests/bilbildin-orders.test.ts` — trusted totals, payment, tenant, idempotency, and errors.
- `docs/integraciones/VYVO.md` — exact handoff for the Bilbildin team.

### Modified files

- `package.json`, `package-lock.json` — pinned Supabase dependency and expanded tests.
- `.env.example` — complete Vercel activation contract with empty secrets.
- `src/types/commerce.ts` — runtime mode/configuration and Bilbildin identifiers.
- `src/data/storefront.ts` — demo provider remains isolated and CRC-ready only through the adapter.
- `src/lib/commerce/cart.ts` — resolves lines against a supplied catalog snapshot.
- `src/components/cart-provider.tsx` — receives catalog/configuration from the server.
- `src/components/checkout-client.tsx` — real payment selection, API submit, recoverable errors.
- `src/components/product-purchase-panel.tsx` — reflects live stock/purchasability.
- `src/app/layout.tsx` — provides the active storefront snapshot to the cart.
- `src/app/page.tsx` — reads the selected provider.
- `src/app/catalogo/page.tsx` — reads live products and mode-aware copy.
- `src/app/colecciones/origins/page.tsx` — reads the selected provider.
- `src/app/producto/[slug]/page.tsx` — resolves live product and metadata.
- `src/app/personalizar/[slug]/page.tsx` — resolves live customizable product.
- `src/app/drops/page.tsx` — resolves ABYSS from the provider.
- `src/app/checkout/page.tsx` — passes runtime checkout mode.
- `src/app/checkout/confirmacion/page.tsx` — preserves the demo confirmation route.
- `scripts/verify-browser.mjs` — checks demo mode plus new route safety.
- `README.md` — Bilbildin and Vercel activation instructions.

---

### Task 1: Configuration boundary and pinned dependency

**Files:**
- Create: `src/lib/bilbildin/config.ts`
- Create: `tests/bilbildin-config.test.ts`
- Modify: `.env.example`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `getBilbildinMode(env): "demo" | "bilbildin"`
- Produces: `getPublicBilbildinConfig(env): { url: string; publishableKey: string; businessId: string }`
- Produces: `getPrivateBilbildinConfig(env): { url: string; secretKey: string; businessId: string }`

- [ ] **Step 1: Write failing configuration tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getBilbildinMode,
  getPrivateBilbildinConfig,
} from "../src/lib/bilbildin/config";

test("Bilbildin is opt-in", () => {
  assert.equal(getBilbildinMode({}), "demo");
  assert.equal(getBilbildinMode({ BILBILDIN_ENABLED: "false" }), "demo");
});

test("live mode fails closed without private configuration", () => {
  assert.throws(
    () => getPrivateBilbildinConfig({ BILBILDIN_ENABLED: "true" }),
    /configuración de Bilbildin incompleta/i,
  );
});

test("new Supabase keys take priority over legacy keys", () => {
  const config = getPrivateBilbildinConfig({
    BILBILDIN_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://wgicaiphzwppnshagxve.supabase.co",
    NEXT_PUBLIC_BUSINESS_ID: "14d10531-d6fc-45a9-9c74-1ff15c657099",
    SUPABASE_SECRET_KEY: "sb_secret_preferred",
    SUPABASE_SERVICE_ROLE_KEY: "legacy",
  });
  assert.equal(config.secretKey, "sb_secret_preferred");
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test tests/bilbildin-config.test.ts`  
Expected: FAIL because `src/lib/bilbildin/config.ts` does not exist.

- [ ] **Step 3: Install the exact Supabase SDK**

Run: `npm install @supabase/supabase-js@2.111.0 --save-exact`  
Expected: dependency and lockfile both record `2.111.0`.

- [ ] **Step 4: Implement strict configuration parsing**

```ts
import { z } from "zod";

type RuntimeEnv = Record<string, string | undefined>;

const uuid = z.string().uuid();
const url = z.string().url();

export function getBilbildinMode(env: RuntimeEnv = process.env) {
  return env.BILBILDIN_ENABLED === "true" ? "bilbildin" : "demo";
}

export function getPublicBilbildinConfig(env: RuntimeEnv = process.env) {
  const result = z.object({
    url,
    publishableKey: z.string().min(20),
    businessId: uuid,
  }).safeParse({
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    businessId: env.NEXT_PUBLIC_BUSINESS_ID,
  });
  if (!result.success) {
    throw new Error("Configuración pública de Bilbildin incompleta.");
  }
  return result.data;
}

export function getPrivateBilbildinConfig(env: RuntimeEnv = process.env) {
  const publicConfig = getPublicBilbildinConfig(env);
  const secretKey =
    env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey || secretKey.length < 20) {
    throw new Error("Configuración privada de Bilbildin incompleta.");
  }
  return { ...publicConfig, secretKey };
}
```

- [ ] **Step 5: Expand `.env.example` without values**

```bash
NEXT_PUBLIC_SITE_URL=https://vyvocr.com
BILBILDIN_ENABLED=false
NEXT_PUBLIC_SUPABASE_URL=https://wgicaiphzwppnshagxve.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_BUSINESS_ID=
SUPABASE_SECRET_KEY=
```

- [ ] **Step 6: Run tests and commit**

Run: `npx tsx --test tests/bilbildin-config.test.ts`  
Expected: PASS.

```bash
git add package.json package-lock.json .env.example src/lib/bilbildin/config.ts tests/bilbildin-config.test.ts
git commit -m "Add Bilbildin configuration boundary"
```

---

### Task 2: Auditable VYVO tenant and catalog seed

**Files:**
- Create: `scripts/bilbildin/seed-vyvo.sql`
- Create: `tests/bilbildin-seed.test.ts`
- Modify: `docs/superpowers/specs/2026-07-29-vyvo-bilbildin-integration-design.md`

**Interfaces:**
- Produces: one `public.businesses` row identified by `owner_email = 'vyvocr@gmail.com'`
- Produces: nine `public.products` rows with existing VYVO UUIDs and stock zero
- Produces: the real `business_id` returned by Supabase

- [ ] **Step 1: Write failing seed invariant tests**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync("scripts/bilbildin/seed-vyvo.sql", "utf8");

test("seed is pending, CRC, zero-stock, and contains nine fixed products", () => {
  assert.match(sql, /vyvocr@gmail\.com/);
  assert.match(sql, /'pending'/);
  assert.match(sql, /"currency": "CRC"/);
  assert.equal((sql.match(/14d10531-d6fc-45a9-9c74-1ff15c6570(01|02|03|04|05|06|08|09|10)/g) ?? []).length, 9);
  assert.equal((sql.match(/stock_quantity[^,\n]*0/g) ?? []).length >= 9, true);
});

test("seed never contains a Supabase key", () => {
  assert.doesNotMatch(sql, /eyJ[A-Za-z0-9_-]{20}/);
  assert.doesNotMatch(sql, /sb_secret_/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test tests/bilbildin-seed.test.ts`  
Expected: FAIL because the SQL file does not exist.

- [ ] **Step 3: Create a transaction-safe, duplicate-safe data seed**

The SQL must:

1. lock on `hashtext('bilbildin:vyvo:seed:v1')`;
2. abort if a different business already owns `vyvocr.com`;
3. insert or update only the row with `owner_email = 'vyvocr@gmail.com'`;
4. preserve `account_status = 'pending'`;
5. upsert the nine fixed product UUIDs only when they belong to VYVO;
6. set stock to zero and never delete rows;
7. return business ID and product count.

Use the exact prices/costs from the approved specification and the exact local
product descriptions/images from `src/data/products.ts`.

- [ ] **Step 4: Run the seed invariant tests**

Run: `npx tsx --test tests/bilbildin-seed.test.ts`  
Expected: PASS.

- [ ] **Step 5: Execute the SQL once against Supabase project `wgicaiphzwppnshagxve`**

Use Supabase `execute_sql` with the reviewed file contents.  
Expected result: one pending VYVO business and nine products.

- [ ] **Step 6: Verify only VYVO rows**

Run a read-only query filtered by the returned business ID:

```sql
select
  b.id,
  b.name,
  b.owner_email,
  b.plan_type,
  b.account_status,
  b.custom_domain,
  count(p.id) as product_count,
  min(p.stock_quantity) as min_stock,
  max(p.stock_quantity) as max_stock
from public.businesses b
left join public.products p on p.business_id = b.id
where b.owner_email = 'vyvocr@gmail.com'
group by b.id;
```

Expected: `starter`, `pending`, `vyvocr.com`, `product_count = 9`,
`min_stock = 0`, `max_stock = 0`.

- [ ] **Step 7: Write the returned business ID into the spec and commit**

```bash
git add scripts/bilbildin/seed-vyvo.sql tests/bilbildin-seed.test.ts docs/superpowers/specs/2026-07-29-vyvo-bilbildin-integration-design.md
git commit -m "Seed pending VYVO tenant in Bilbildin"
```

---

### Task 3: Bilbildin types, clients, and catalog mapping

**Files:**
- Create: `src/lib/bilbildin/types.ts`
- Create: `src/lib/bilbildin/client.ts`
- Create: `src/lib/bilbildin/catalog.ts`
- Create: `src/lib/commerce/store.ts`
- Create: `tests/bilbildin-catalog.test.ts`
- Modify: `src/types/commerce.ts`
- Modify: `src/data/storefront.ts`

**Interfaces:**
- Produces: `StorefrontSnapshot`
- Produces: `mapBilbildinProduct(row, variants): StorefrontProduct`
- Produces: `getStorefrontSnapshot(): Promise<StorefrontSnapshot>`
- Produces: `getStorefrontProductBySlug(slug): Promise<StorefrontProduct | null>`

- [ ] **Step 1: Write failing catalog mapping tests**

```ts
test("maps whole-colon prices to minor units and zero stock to sold out", () => {
  const product = mapBilbildinProduct({
    id: "14d10531-d6fc-45a9-9c74-1ff15c657001",
    business_id: BUSINESS_ID,
    name: "CORE",
    slug: "vyvo-core",
    description: "Descripción",
    short_description: "Resumen",
    price: 15000,
    compare_at_price: null,
    images: ["https://vyvocr.com/products/core/concept-primary.png"],
    status: "visible",
    category: "Coleccionables",
    tags: ["Articulado"],
    attributes: { sku: "VYV-MINI-CORE-001", origins_number: "001" },
    featured: true,
    stock_quantity: 0,
  }, []);
  assert.equal(product.commerce.price?.amountMinor, 1_500_000);
  assert.equal(product.commerce.currency, "CRC");
  assert.equal(product.commerce.purchasable, false);
  assert.equal(product.commerce.inventory.status, "unavailable");
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test tests/bilbildin-catalog.test.ts`  
Expected: FAIL because the mapping module does not exist.

- [ ] **Step 3: Define Bilbildin row and runtime contracts**

```ts
export type StorefrontMode = "demo" | "bilbildin";
export type StorefrontSnapshot = {
  mode: StorefrontMode;
  products: StorefrontProduct[];
  configuration: {
    currency: string;
    checkoutEnabled: boolean;
    paymentMethods: Array<"sinpe" | "transfer" | "cash">;
    paymentCoordinationMode: "post_order_whatsapp" | "configured";
    whatsapp: string;
  };
};
```

- [ ] **Step 4: Implement server-only clients**

`client.ts` starts with:

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
```

Disable persisted sessions and token refresh for both server data clients.
Create the privileged client only through `getPrivateBilbildinConfig`.

- [ ] **Step 5: Implement the mapper and cached reads**

- Select explicit public columns; never select `cost_price`.
- Filter products by configured business ID and `visible`.
- Join `product_variants`.
- Read `businesses.theme_config` for currency/payment display.
- Cache the live snapshot for 60 seconds.
- Fall back to local editorial metadata by fixed UUID/slug only for display
  fields missing from Bilbildin, never for price or stock.
- Throw a controlled integration error in live mode; do not silently return the
  demo catalog.

- [ ] **Step 6: Implement provider selection**

```ts
export async function getStorefrontSnapshot() {
  return getBilbildinMode() === "bilbildin"
    ? getBilbildinSnapshot()
    : getDemoStorefrontSnapshot();
}
```

- [ ] **Step 7: Run tests and commit**

Run: `npx tsx --test tests/bilbildin-catalog.test.ts tests/products.test.ts`  
Expected: PASS.

```bash
git add src/lib/bilbildin src/lib/commerce/store.ts src/types/commerce.ts src/data/storefront.ts tests/bilbildin-catalog.test.ts
git commit -m "Add Bilbildin catalog provider"
```

---

### Task 4: Make pages and cart consume the active snapshot

**Files:**
- Modify: `src/lib/commerce/cart.ts`
- Modify: `src/components/cart-provider.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/catalogo/page.tsx`
- Modify: `src/app/colecciones/origins/page.tsx`
- Modify: `src/app/producto/[slug]/page.tsx`
- Modify: `src/app/personalizar/[slug]/page.tsx`
- Modify: `src/app/drops/page.tsx`
- Modify: `tests/products.test.ts`

**Interfaces:**
- Consumes: `StorefrontSnapshot`
- Produces: `normalizeCartItems(value, products)`
- Produces: `resolveCartLines(items, products)`
- Produces: `<CartProvider snapshot={snapshot}>`

- [ ] **Step 1: Add failing cart reconciliation tests**

```ts
test("cart removes items absent from the active catalog", () => {
  const items = normalizeCartItems(
    [{ slug: "missing", variantId: "base", quantity: 1 }],
    storefrontProducts,
  );
  assert.deepEqual(items, []);
});

test("cart uses live CRC price from the supplied snapshot", () => {
  const core = structuredClone(storefrontProducts[0]);
  core.commerce.price = { amountMinor: 1_500_000, currency: "CRC" };
  core.commerce.variants[0].price = core.commerce.price;
  const lines = resolveCartLines(
    [{ id: "core", slug: core.slug, variantId: core.commerce.variants[0].id, quantity: 1 }],
    [core],
  );
  assert.equal(lines[0].unitPrice.currency, "CRC");
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`  
Expected: FAIL because cart helpers do not accept a catalog.

- [ ] **Step 3: Refactor pure cart helpers**

Build a `Map<string, StorefrontProduct>` from the supplied products. Remove
invalid/hidden/unpurchasable variants during normalization. Calculate totals in
the line currency and reject mixed currencies.

- [ ] **Step 4: Pass the snapshot through layout and context**

Make `RootLayout` async, call `getStorefrontSnapshot()`, and pass it to
`CartProvider`. Expose `mode` and `configuration` through `useCart`.

- [ ] **Step 5: Convert server pages to provider reads**

Replace direct imports of `storefrontProducts` and `getStorefrontProduct` with
`await getStorefrontSnapshot()` or `await getStorefrontProductBySlug(slug)`.
Keep dynamic product paths enabled so catalog additions do not require a build.

- [ ] **Step 6: Make copy mode-aware**

Demo pages retain “demostrativo” language. Bilbildin mode removes demo labels
and reports stock truthfully.

- [ ] **Step 7: Run tests/build and commit**

Run: `npm run typecheck && npm test && npm run build`  
Expected: PASS.

```bash
git add src/lib/commerce/cart.ts src/components/cart-provider.tsx src/app tests/products.test.ts
git commit -m "Connect storefront pages to active catalog"
```

---

### Task 5: Trusted order service and checkout route

**Files:**
- Create: `src/lib/bilbildin/orders.ts`
- Create: `src/app/api/checkout/route.ts`
- Create: `tests/bilbildin-orders.test.ts`
- Modify: `src/lib/validation.ts`

**Interfaces:**
- Consumes: `CheckoutRequest`
- Produces: `createBilbildinOrder(input, idempotencyKey): Promise<{ orderId: string; orderNumber: string }>`
- Produces: `POST /api/checkout`

- [ ] **Step 1: Write failing order tests**

Cover:

- browser totals ignored;
- tenant ID never accepted from input;
- inactive business rejected;
- hidden product rejected;
- stock zero rejected;
- unsupported payment rejected;
- configuration details bounded and serialized into order notes;
- same idempotency key produces the same order number;
- no secret or cost returned.

Deterministic order number test:

```ts
test("order number is stable for the same business and idempotency key", () => {
  assert.equal(
    createOrderNumber(BUSINESS_ID, "7fe44b6c-ff6b-4ee4-987d-92edfe93341d"),
    createOrderNumber(BUSINESS_ID, "7fe44b6c-ff6b-4ee4-987d-92edfe93341d"),
  );
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx --test tests/bilbildin-orders.test.ts`  
Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement the Zod request schema**

Limits:

- 1–20 lines;
- quantity 1–8;
- names 1–80;
- email valid and at most 254;
- phone at most 24;
- address at most 140;
- notes/configuration snapshot at most 1,000;
- payment enum `sinpe | transfer | cash`;
- UUID idempotency key;
- empty honeypot.

- [ ] **Step 4: Implement trusted server reconciliation**

Use a dependency-injected repository for unit tests. The production repository:

1. loads the business by configured ID;
2. validates `account_status = active`;
3. validates payment against `enabled_payment_methods`;
4. loads all product/variant rows with `business_id`;
5. calculates unit prices and costs from rows;
6. returns a price-conflict response when displayed totals changed;
7. upserts the customer;
8. inserts the order with deterministic unique `order_number`;
9. inserts lines;
10. invokes `decrement_stock` for each product;
11. records inventory movements and initial tracking;
12. on duplicate `order_number`, returns the existing same-tenant order.

- [ ] **Step 5: Implement the route boundary**

Reject:

- non-JSON content;
- `Content-Length > 32 KiB`;
- Origin not equal to `NEXT_PUBLIC_SITE_URL` or the current request origin;
- live checkout while mode is demo.

Return structured codes such as `STORE_INACTIVE`, `PRICE_CHANGED`,
`OUT_OF_STOCK`, and `ORDER_FAILED`; never return raw Supabase messages.

- [ ] **Step 6: Run tests and commit**

Run: `npx tsx --test tests/bilbildin-orders.test.ts`  
Expected: PASS.

```bash
git add src/lib/bilbildin/orders.ts src/app/api/checkout/route.ts src/lib/validation.ts tests/bilbildin-orders.test.ts
git commit -m "Add trusted Bilbildin checkout service"
```

---

### Task 6: Live checkout user experience

**Files:**
- Modify: `src/components/checkout-client.tsx`
- Modify: `src/app/checkout/page.tsx`
- Modify: `src/components/cart-page-client.tsx`
- Modify: `src/components/product-purchase-panel.tsx`
- Modify: `src/app/globals.css`
- Modify: `scripts/verify-browser.mjs`

**Interfaces:**
- Consumes: `useCart().mode`, `configuration.paymentMethods`
- Consumes: `POST /api/checkout`
- Produces: recoverable checkout states `idle | submitting | price_changed | error | complete`

- [ ] **Step 1: Extend browser assertions before implementation**

Add demo assertions that still expect the demo confirmation. Add live-mode
structural assertions for:

- payment radio group names;
- live submit label;
- disabled purchase when stock is zero;
- recoverable error region with `role="alert"`;
- no banking/SINPE account number in rendered HTML.

- [ ] **Step 2: Implement payment selection**

Render only the three configured methods. Copy:

- “SINPE Móvil — coordinamos los datos por WhatsApp”
- “Transferencia — coordinamos los datos por WhatsApp”
- “Efectivo contra entrega”

Do not render account numbers, titular names, IBAN, or payment URLs.

- [ ] **Step 3: Submit real orders without clearing early**

Generate one `crypto.randomUUID()` per checkout attempt, keep it stable across
network retries, send JSON to `/api/checkout`, and clear the cart only after a
successful `{ orderId }`.

- [ ] **Step 4: Handle expected errors**

- `PRICE_CHANGED`: update the visible total and require a second confirmation.
- `OUT_OF_STOCK`: keep the cart and link back to it.
- `STORE_INACTIVE`: explain that orders are not yet enabled.
- Network/server failure: keep all form values and allow retry.

- [ ] **Step 5: Preserve demo flow**

When mode is demo, keep the current no-persistence flow and
`/checkout/confirmacion?pedido=VYVO-DEMO-*`.

- [ ] **Step 6: Verify and commit**

Run: `npm run lint && npm run typecheck && npm test`  
Expected: PASS.

```bash
git add src/components src/app/checkout src/app/globals.css scripts/verify-browser.mjs
git commit -m "Connect checkout UI to Bilbildin orders"
```

---

### Task 7: Real confirmation and tracking

**Files:**
- Create: `src/app/checkout/confirmacion/[orderId]/page.tsx`
- Create: `src/app/tracking/[orderId]/page.tsx`
- Modify: `src/lib/bilbildin/orders.ts`
- Modify: `src/app/globals.css`
- Modify: `tests/bilbildin-orders.test.ts`

**Interfaces:**
- Produces: `getBilbildinOrder(orderId): Promise<OrderDetail | null>`
- Produces: private, non-indexed confirmation and tracking pages

- [ ] **Step 1: Add failing order read tests**

Verify the repository always receives both `orderId` and configured
`businessId`, sorts tracking ascending, and returns `null` for a missing or
cross-tenant order.

- [ ] **Step 2: Implement explicit private selects**

Never use `select("*")`. Select only customer-safe order, item, and tracking
fields. Do not select email, phone, `total_cost`, or `unit_cost`.

- [ ] **Step 3: Build the confirmation page**

Display order number, item snapshot, CRC total, payment method/status,
WhatsApp-coordination copy, and link to `/tracking/[orderId]`.

- [ ] **Step 4: Build the tracking timeline**

Render events chronologically with title, optional description/location, and
Costa Rica-localized timestamp. Mark current status and terminal states.

- [ ] **Step 5: Fail without leaking UUID existence**

Both missing and cross-tenant reads call `notFound()`. Add `robots:
{ index: false, follow: false }`.

- [ ] **Step 6: Run tests/build and commit**

Run: `npm run typecheck && npm test && npm run build`  
Expected: PASS.

```bash
git add src/app/checkout/confirmacion src/app/tracking src/lib/bilbildin/orders.ts src/app/globals.css tests/bilbildin-orders.test.ts
git commit -m "Add Bilbildin confirmation and tracking"
```

---

### Task 8: Handoff documentation and Vercel readiness

**Files:**
- Create: `docs/integraciones/VYVO.md`
- Modify: `README.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: real VYVO `business_id`
- Produces: secret-free Bilbildin team handoff

- [ ] **Step 1: Write the exact handoff**

Include:

- VYVO identity, owner, starter plan, domain, CRC, WhatsApp;
- real `business_id`;
- nine-product SKU/price/cost/stock table;
- payment coordination behavior;
- product image base URL;
- exact Vercel variable names, with no values for keys;
- admin actions: create auth user, review catalog, configure stock, approve
  account, assign renewal, verify payment configuration;
- end-to-end test checklist;
- VYVO commit SHA written after the final implementation commit.

- [ ] **Step 2: Document the activation order**

```text
1. Create owner auth user for vyvocr@gmail.com
2. Review VYVO products and stock
3. Add Supabase keys/business ID to Vercel
4. Keep BILBILDIN_ENABLED=false and deploy
5. Approve VYVO in Bilbildin admin
6. Set BILBILDIN_ENABLED=true and redeploy
7. Run circular order/tracking verification
```

- [ ] **Step 3: Add README operational guidance**

Document demo/live mode, key rotation, Vercel environment scoping, 60-second
catalog cache, and the rule that preview deployments must not receive
production secret keys unless explicitly approved.

- [ ] **Step 4: Verify no secrets and commit**

Run:

```powershell
rg -n "eyJ[A-Za-z0-9_-]{20}|sb_secret_|SUPABASE_SERVICE_ROLE_KEY=.+" . -g "!node_modules/**" -g "!.next/**"
```

Expected: no secret values.

```bash
git add docs/integraciones/VYVO.md README.md .env.example
git commit -m "Document VYVO Bilbildin activation"
```

---

### Task 9: Security, database, and browser verification

**Files:**
- Modify: `scripts/verify-browser.mjs`
- Modify: code only if verification finds an issue

**Interfaces:**
- Produces: evidence that demo mode is stable before credentials
- Produces: evidence that the pending Bilbildin tenant cannot accept orders

- [ ] **Step 1: Run the full local suite**

Run: `npm run check`  
Expected: lint, typecheck, all tests, and production build PASS.

- [ ] **Step 2: Start the production build**

Run: `npm run start`  
Expected: `http://localhost:3000` returns 200 with demo mode.

- [ ] **Step 3: Run browser verification**

Run: `npm run verify:browser`  
Expected: `failureCount: 0`, full demo purchase passes desktop/mobile, no console
errors, no broken links, no dead buttons, no reduced-motion pending reveals.

- [ ] **Step 4: Run Supabase advisors**

Run security and performance advisors for project `wgicaiphzwppnshagxve`.
Do not change unrelated shared-project findings. Record any issue directly
related to VYVO inserts or the existing stock function in the handoff.

- [ ] **Step 5: Verify pending tenant behavior**

With live variables supplied only to a controlled local/preview environment,
confirm:

- catalog returns nine zero-stock products in CRC;
- purchase controls are disabled;
- direct checkout returns `STORE_INACTIVE`;
- no order/customer/inventory row is created.

- [ ] **Step 6: Review current diff and commit any verification fix**

Run: `git diff --check && git status --short`.

If a fix was required:

```bash
git add scripts/verify-browser.mjs src/app/api/checkout/route.ts src/lib/bilbildin tests
git commit -m "Harden VYVO Bilbildin integration"
```

---

### Task 10: Vercel, GitHub handoff, and final main synchronization

**Files:**
- Modify: `docs/integraciones/VYVO.md` only to replace the final commit SHA

**Interfaces:**
- Produces: deployed demo storefront on `vyvocr.com`
- Produces: `main` synchronized to `origin/main`
- Produces: Bilbildin team document in `stevengalocr/bilbildin` when repository access is available

- [ ] **Step 1: Inspect or link the exact Vercel project**

Resolve the VYVO Vercel project and confirm `vyvocr.com` belongs to it. Do not
create a duplicate project.

- [ ] **Step 2: Configure non-secret production variables**

Set:

```bash
NEXT_PUBLIC_SITE_URL=https://vyvocr.com
BILBILDIN_ENABLED=false
NEXT_PUBLIC_SUPABASE_URL=https://wgicaiphzwppnshagxve.supabase.co
```

Set `NEXT_PUBLIC_BUSINESS_ID` to the exact UUID returned and verified in Task 2.
Do not add a private key until the Bilbildin team supplies/approves it.

- [ ] **Step 3: Deploy production in demo mode**

Deploy the tested commit to production, verify `https://vyvocr.com`, and scan
deployment errors. The storefront must remain demo until activation.

- [ ] **Step 4: Record final commit and commit the handoff**

Replace the handoff’s commit field with `git rev-parse HEAD`, then:

```bash
git add docs/integraciones/VYVO.md
git commit -m "Finalize VYVO Bilbildin handoff"
```

- [ ] **Step 5: Push VYVO main**

Run: `git push origin main`  
Expected: local `HEAD` equals `origin/main`.

- [ ] **Step 6: Publish the handoff to Bilbildin**

Use GitHub repository access to create:

`docs/integraciones/VYVO.md` in `stevengalocr/bilbildin` on `main`.

If the private repository is still unavailable, stop this external write only,
report the exact access blocker, and leave the committed VYVO copy ready. Do
not bypass authentication or expose the document elsewhere.

- [ ] **Step 7: Final evidence**

Run:

```bash
npm run check
npm run verify:browser
git status --short
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
```

Expected: all checks PASS, clean `main`, matching SHAs, server/deployment healthy.
