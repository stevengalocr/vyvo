# VYVO Storefront Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mejorar la tienda VYVO existente con una capa cinética moderna, visible y accesible sin cambiar su arquitectura, contenido comercial ni flujos funcionales.

**Architecture:** El movimiento será una mejora progresiva basada primero en CSS, `IntersectionObserver` y transformaciones aceleradas. Un controlador cliente pequeño activará revelados de una sola ejecución sin ocultar contenido cuando JavaScript falle; el hero conservará su componente actual y sumará una secuencia focal coordinada. No se añadirá una dependencia de animación.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript estricto, CSS global, APIs nativas del navegador, Node test runner, Playwright Core.

## Global Constraints

- Conservar la estructura, el contenido y la funcionalidad actual de Landing, Catálogo, Personalizar, Drops, Carrito y Checkout.
- VYVO debe leerse primero como una tienda de figuras, coleccionables, personalizaciones y regalos.
- La fabricación 3D no domina el hero, la navegación ni las decisiones de compra.
- Sora 700/800 permanece como display; Inter 400–700 permanece como interfaz y comercio.
- Blanco cálido domina; negro estructura; cada composición usa un acento principal.
- El logo maestro no recibe glow, degradado, volumen, textura, sombra ni deformación.
- Los objetivos táctiles mantienen un mínimo de 44 px.
- `prefers-reduced-motion: reduce` elimina desplazamiento, parallax y autoplay no esencial.
- Las animaciones de controles duran entre 100 y 280 ms; el hero puede usar entre 500 y 800 ms.
- Animar principalmente `transform`, `opacity` y recortes acotados.
- El contenido permanece visible por defecto y nunca depende de JavaScript para existir.
- No usar scroll hijacking, cursores personalizados, movimiento perpetuo ni `transition: all`.
- No añadir una librería de animación.
- El trabajo se realiza y se verifica en `main`.

---

### Task 1: Motion foundation and one-shot reveal controller

**Files:**
- Create: `src/lib/motion.ts`
- Create: `src/components/motion-controller.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `tests/motion.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `getInitialRevealState(top: number, viewportHeight: number): "visible" | "pending"`
- Produces: `getRevealDelay(index: number): number`
- Produces: `<MotionController />`, mounted once in the root layout.
- Consumes: elements annotated with `data-reveal` and optional `data-reveal-index`.

- [ ] **Step 1: Write failing unit tests for reveal state and stagger caps**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getInitialRevealState, getRevealDelay } from "../src/lib/motion";

test("content already near the viewport remains visible on hydration", () => {
  assert.equal(getInitialRevealState(600, 800), "visible");
  assert.equal(getInitialRevealState(790, 800), "pending");
});

test("reveal stagger is short and capped", () => {
  assert.equal(getRevealDelay(0), 0);
  assert.equal(getRevealDelay(2), 110);
  assert.equal(getRevealDelay(12), 220);
});
```

- [ ] **Step 2: Run the test and confirm the missing module failure**

Run: `npm test`

Expected: FAIL because `src/lib/motion.ts` does not exist.

- [ ] **Step 3: Implement the pure motion helpers**

```ts
export type RevealState = "visible" | "pending";

export function getInitialRevealState(
  top: number,
  viewportHeight: number,
): RevealState {
  return top <= viewportHeight * 0.92 ? "visible" : "pending";
}

export function getRevealDelay(index: number): number {
  return Math.min(Math.max(index, 0) * 55, 220);
}
```

- [ ] **Step 4: Implement the progressive reveal controller**

The client component must:

```tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getInitialRevealState, getRevealDelay } from "@/lib/motion";

export function MotionController() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const nodes = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal-state", "visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    for (const node of nodes) {
      const index = Number(node.dataset.revealIndex ?? "0");
      node.style.setProperty("--reveal-delay", `${getRevealDelay(index)}ms`);
      const state = getInitialRevealState(
        node.getBoundingClientRect().top,
        window.innerHeight,
      );
      node.setAttribute("data-reveal-state", state);
      if (state === "pending") observer.observe(node);
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
```

Mount `<MotionController />` after the app shell in `src/app/layout.tsx`.

- [ ] **Step 5: Add motion tokens and progressive CSS**

Add exact-property transitions and:

```css
:root {
  --motion-out: cubic-bezier(0.16, 1, 0.3, 1);
  --motion-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --motion-fast: 160ms;
  --motion-ui: 240ms;
  --motion-scene: 720ms;
}

[data-reveal] {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: no-preference) {
  [data-reveal][data-reveal-state="pending"] {
    opacity: 0;
    transform: translate3d(0, 28px, 0);
  }

  [data-reveal][data-reveal-state="visible"] {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    transition:
      opacity var(--motion-scene) var(--motion-out) var(--reveal-delay, 0ms),
      transform var(--motion-scene) var(--motion-out) var(--reveal-delay, 0ms);
  }
}
```

- [ ] **Step 6: Make the test script include every unit test and verify**

Change:

```json
"test": "tsx --test tests/*.test.ts"
```

Run: `npm run lint && npm run typecheck && npm test`

Expected: all commands PASS.

- [ ] **Step 7: Commit the foundation**

```bash
git add package.json src/app/layout.tsx src/app/globals.css src/components/motion-controller.tsx src/lib/motion.ts tests/motion.test.ts
git commit -m "Add progressive storefront motion foundation"
```

---

### Task 2: Author the hero focal sequence

**Files:**
- Modify: `src/components/hero-showcase.tsx`
- Modify: `src/app/globals.css`
- Modify: `scripts/verify-browser.mjs`

**Interfaces:**
- Consumes: existing `HeroShowcase` product rotation, pause and visibility behavior.
- Produces: `data-hero-state`, keyed focus content and decorative brand layers with `aria-hidden="true"`.

- [ ] **Step 1: Extend browser verification with hero motion assertions**

Inside the home verification, collect:

```js
const heroMotion = await page.locator(".hero").evaluate((hero) => ({
  state: hero.getAttribute("data-hero-state"),
  decorativeLayers: hero.querySelectorAll('[aria-hidden="true"].hero__kinetic-layer').length,
  focusKey: hero.querySelector(".hero-focus__content")?.getAttribute("data-focus-key"),
}));
```

Assert `heroMotion.state`, two decorative layers and a focus key are present.

- [ ] **Step 2: Run browser verification and confirm the new assertions fail**

Run the existing production server and then: `npm run verify:browser`

Expected: FAIL because the hero has no kinetic layers or focus key.

- [ ] **Step 3: Add semantic state and decorative hero layers**

Update the hero root and visual composition:

```tsx
<section
  className="hero"
  ref={heroRef}
  aria-labelledby="hero-title"
  data-hero-state={focusProduct ? "product" : "family"}
>
  <div className="hero__kinetic-layer hero__kinetic-layer--one" aria-hidden="true" />
  <div className="hero__kinetic-layer hero__kinetic-layer--two" aria-hidden="true" />
```

Wrap the changing focus content:

```tsx
<div
  className="hero-focus__content"
  data-focus-key={focusProduct?.slug ?? "family"}
  key={focusProduct?.slug ?? "family"}
>
  {/* preserve existing focus content and link */}
</div>
```

- [ ] **Step 4: Implement the coordinated hero entrance and scroll depth**

Use CSS for:

- line-based copy entrance;
- clip-path image reveal;
- two low-opacity V-derived layers;
- focus-card content transition on product change;
- image depth on fine-pointer hover;
- scroll-linked depth only inside `@supports (animation-timeline: view())`;
- no changes to layout dimensions or CTA placement.

The focal entrance uses `var(--motion-scene)` and `var(--motion-out)`. The
focus transition remains below 300 ms.

- [ ] **Step 5: Verify autoplay, manual controls and reduced motion**

Run: `npm run verify:browser`

Expected: hero carousel changes manually, no console errors, mobile reduced
motion shows a stable composition and all existing route checks pass.

- [ ] **Step 6: Commit the hero sequence**

```bash
git add src/components/hero-showcase.tsx src/app/globals.css scripts/verify-browser.mjs
git commit -m "Enhance VYVO hero with kinetic product focus"
```

---

### Task 3: Add commercial motion to landing and product cards

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/product-card.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `[data-reveal]` from Task 1.
- Produces: one-shot section reveals and fine-pointer card depth with unchanged links and product data.

- [ ] **Step 1: Add reveal annotations to meaningful landing groups**

Annotate only:

- the three intent cards;
- line cards as one group;
- the Origins heading and first six product cards;
- the idea → figure visual;
- ABYSS content;
- unboxing tiers;
- the four process steps.

Use `data-reveal` and `data-reveal-index={index}`. Do not annotate FAQ answers,
checkout-like content or every section wrapper.

- [ ] **Step 2: Add product-card motion hooks without changing navigation**

Add `data-reveal` to the article and preserve both existing product links,
badges, status, descriptor and price. Add a decorative accent surface:

```tsx
<span className="product-card__accent" aria-hidden="true" />
```

- [ ] **Step 3: Implement purposeful card and section motion**

CSS must:

- gate hover depth with `@media (hover: hover) and (pointer: fine)`;
- use `translate3d`, image scale no greater than `1.045` and a subtle shadow;
- reveal the accent surface with `clip-path`;
- keep text and price stationary and readable;
- use 30–55 ms stagger increments capped by Task 1;
- use `:active` scale feedback between `0.97` and `0.985`;
- leave touch navigation immediate.

- [ ] **Step 4: Run static and browser checks**

Run: `npm run lint && npm run typecheck && npm test && npm run verify:browser`

Expected: all PASS; Catálogo navigation, product links and purchase flow remain functional.

- [ ] **Step 5: Commit landing and card polish**

```bash
git add src/app/page.tsx src/components/product-card.tsx src/app/globals.css
git commit -m "Add commercial motion to landing product discovery"
```

---

### Task 4: Refine Catálogo as a responsive product-discovery surface

**Files:**
- Modify: `src/components/product-filters.tsx`
- Modify: `src/app/catalogo/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `scripts/verify-browser.mjs`

**Interfaces:**
- Consumes: existing search, segment, sort and reset state.
- Produces: stable animated results feedback and visual selection states.

- [ ] **Step 1: Add runtime assertions for filter feedback**

After selecting Personalizables, assert:

```js
const activeSegmentPressed = await page
  .getByRole("button", { name: "Personalizables" })
  .getAttribute("aria-pressed");
const resultAnnouncement = await page
  .locator(".catalog-results-heading [aria-live='polite']")
  .textContent();
```

Require `"true"` and text containing `3`.

- [ ] **Step 2: Add motion annotations to catalog hierarchy**

Annotate the page-hero copy, commercial assurance list, toolbar and results
heading with `data-reveal`. Preserve current metadata and copy.

- [ ] **Step 3: Add interruptible selection and result transitions**

Use CSS transitions for segment background, border, color and transform. Add:

- `:active` press feedback;
- visible focus state;
- a short opacity/translate response on result count;
- stable grid dimensions;
- no first-tap hover trap on mobile;
- no animation of width, height or grid layout.

- [ ] **Step 4: Verify search, sorting, filters and empty state**

Run: `npm run verify:browser`

Expected: NEXO search returns one card, Personalizables returns three, clear
filters works, assertions pass and no horizontal overflow appears.

- [ ] **Step 5: Commit catalog refinement**

```bash
git add src/app/catalogo/page.tsx src/components/product-filters.tsx src/app/globals.css scripts/verify-browser.mjs
git commit -m "Refine catalog discovery interactions"
```

---

### Task 5: Improve Personalizar without making it feel technical

**Files:**
- Modify: `src/app/personalizar/page.tsx`
- Modify: `src/components/customization-builder.tsx`
- Modify: `src/app/globals.css`
- Modify: `scripts/verify-browser.mjs`

**Interfaces:**
- Consumes: current SHIFT, ARENA and NEXO routes and builder steps.
- Produces: clear direction-aware step transitions and expressive path cards.

- [ ] **Step 1: Add builder state assertions**

In the customization journey, collect the active step before and after
`Continuar` and assert it changes from `1` to `2` while the expected fields
remain accessible by label.

- [ ] **Step 2: Annotate the three routes and process sequence**

Add one-shot reveal attributes to route cards and process items. Keep the
current copy, privacy language and CTA destinations.

- [ ] **Step 3: Add direction-aware builder state**

Track `"forward" | "backward"` when changing steps and expose:

```tsx
<fieldset
  className="customization-builder__panel"
  data-step-direction={direction}
  key={`${product.slug}-${step}`}
>
```

The panel transition uses opacity and a maximum horizontal movement of 18 px.
Back reverses direction. Reduced motion removes positional movement.

- [ ] **Step 4: Improve path-card and preview feedback**

Use fine-pointer image depth, accent reveal and button press feedback. The
visual treatment must communicate character and gift creation, not machinery.
Do not alter form labels, validation, cart serialization or privacy constraints.

- [ ] **Step 5: Verify all three personalization paths**

Run: `npm run lint && npm run typecheck && npm test && npm run verify:browser`

Expected: all PASS; configured SHIFT reaches cart with its name and palette;
ARENA and NEXO routes load without errors.

- [ ] **Step 6: Commit personalization motion**

```bash
git add src/app/personalizar/page.tsx src/components/customization-builder.tsx src/app/globals.css scripts/verify-browser.mjs
git commit -m "Improve personalization flow motion"
```

---

### Task 6: Give Drops a stronger but controlled product reveal

**Files:**
- Modify: `src/app/drops/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `scripts/verify-browser.mjs`

**Interfaces:**
- Consumes: existing ABYSS purchase panel, status strip and waitlist.
- Produces: a distinctive hero reveal and stable anchored navigation.

- [ ] **Step 1: Add drop hero and anchor assertions**

Assert the drop hero contains a decorative depth layer with
`aria-hidden="true"`, while `#comprar` and `#alerta` still exist and the
purchase button remains visible.

- [ ] **Step 2: Add the ABYSS depth layer and reveal annotations**

Add:

```tsx
<span className="drops-hero__depth" aria-hidden="true" />
```

Annotate the purchase copy, rule cards and alert copy with one-shot reveal
attributes. Preserve all transparency language about concept, price and date.

- [ ] **Step 3: Implement the controlled Drops scene**

CSS must:

- reveal ABYSS with a bounded clip path;
- use Graphite plus Purple or Orange, never equal-strength three-accent color;
- give the edition mark an entrance but no infinite loop;
- add scroll depth only when supported and motion is allowed;
- keep anchors, CTA positions and product information stable.

- [ ] **Step 4: Verify purchase and waitlist journeys**

Run: `npm run verify:browser`

Expected: ABYSS can be added to cart, `#alerta` is reached, waitlist returns
202, success copy appears and no failed responses occur.

- [ ] **Step 5: Commit Drops motion**

```bash
git add src/app/drops/page.tsx src/app/globals.css scripts/verify-browser.mjs
git commit -m "Add controlled motion to VYVO Drops"
```

---

### Task 7: Polish interaction feedback across purchase and checkout

**Files:**
- Modify: `src/components/cart-page-client.tsx`
- Modify: `src/components/checkout-client.tsx`
- Modify: `src/components/product-purchase-panel.tsx`
- Modify: `src/components/waitlist-form.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing cart, form, checkout and waitlist state.
- Produces: explicit state attributes/classes for short, interruptible feedback.

- [ ] **Step 1: Expose existing state through semantic data attributes**

Use existing state only:

```tsx
data-submit-state={status}
data-checkout-step={step}
data-cart-empty={items.length === 0 ? "true" : "false"}
```

Do not add fake loading delays or change validation.

- [ ] **Step 2: Add compact feedback transitions**

Implement:

- button press scale at 100–160 ms;
- disabled state with no movement;
- form success/error opacity and transform under 240 ms;
- checkout step color/scale transition under 240 ms;
- quantity changes without layout movement;
- visible focus and reduced-motion fallbacks.

- [ ] **Step 3: Verify the complete desktop and mobile purchase journey**

Run: `npm run verify:browser`

Expected: product → cart → checkout → confirmation passes on desktop and
mobile reduced-motion contexts with no console errors or failed responses.

- [ ] **Step 4: Commit commerce polish**

```bash
git add src/components/cart-page-client.tsx src/components/checkout-client.tsx src/components/product-purchase-panel.tsx src/components/waitlist-form.tsx src/app/globals.css
git commit -m "Polish storefront purchase feedback"
```

---

### Task 8: Final accessibility, performance and visual verification

**Files:**
- Modify: `scripts/verify-browser.mjs`
- Modify: `src/app/globals.css`
- Modify: `README.md`

**Interfaces:**
- Consumes: all prior motion hooks and browser journeys.
- Produces: final verification report and documented motion architecture.

- [ ] **Step 1: Add reduced-motion and interaction-integrity checks**

In the mobile reduced-motion context, assert:

```js
const reducedMotionState = await page.evaluate(() => ({
  preference: matchMedia("(prefers-reduced-motion: reduce)").matches,
  pendingReveals: document.querySelectorAll(
    '[data-reveal-state="pending"]',
  ).length,
}));
```

Require `preference === true` and `pendingReveals === 0`.

- [ ] **Step 2: Run the Impeccable mechanical detector once**

Run:

```bash
node C:\Users\steve_1xcg4d1\.codex\skills\impeccable\scripts\detect.mjs --json src/app/globals.css src/app/page.tsx src/app/catalogo/page.tsx src/app/personalizar/page.tsx src/app/drops/page.tsx src/components/hero-showcase.tsx src/components/product-card.tsx src/components/product-filters.tsx src/components/customization-builder.tsx src/components/cart-page-client.tsx src/components/checkout-client.tsx
```

Fix actionable findings in one batch without changing the approved visual
direction.

- [ ] **Step 3: Run the complete static and production checks**

Run: `npm run check`

Expected: lint, typecheck, unit tests and production build PASS.

- [ ] **Step 4: Start the production server and run bounded visual QA**

Run: `npm run start`

Then run: `npm run verify:browser`

Inspect together:

- `artifacts/vyvo-home-desktop.png`
- `artifacts/vyvo-catalogo-desktop.png`
- `artifacts/vyvo-personalizar-desktop.png`
- `artifacts/vyvo-drops-desktop.png`
- their corresponding mobile screenshots.

Perform one batched correction pass if needed, then one confirmation run.

- [ ] **Step 5: Document the motion architecture**

Add a README section stating:

- progressive enhancement and no animation dependency;
- one-shot reveal controller;
- reduced-motion behavior;
- hero focal sequence;
- browser verification command.

- [ ] **Step 6: Commit final verification changes**

```bash
git add README.md scripts/verify-browser.mjs src/app/globals.css
git commit -m "Verify and document VYVO storefront motion"
```

- [ ] **Step 7: Confirm branch and repository state**

Run:

```bash
git branch --show-current
git status --short
git log -8 --oneline
```

Expected: branch `main`, clean working tree and all motion commits present.

- [ ] **Step 8: Publish the verified main branch**

Run:

```bash
git push origin main
```

Expected: `origin/main` advances to the final verified motion commit.
