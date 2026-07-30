# VYVO Storefront Production Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar la tienda pública VYVO para que el recorrido landing → catálogo → producto → carrito → checkout sea coherente, accesible, responsive y comercialmente verdadero, con BilBildin como motor administrativo invisible.

**Architecture:** El storefront seguirá obteniendo catálogo y disponibilidad desde BilBildin mediante el adaptador de servidor existente. La interfaz conservará el mundo visual VYVO y añadirá una capa de movimiento basada en perfiles de acento, mientras el contenido público se desacopla del nombre del motor administrativo y de cualquier dato operativo no verificado.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, CSS, Zod 4, Supabase JS 2.109, Node test runner mediante `tsx`, Playwright Core y Vercel.

## Global Constraints

- Trabajar y confirmar directamente sobre `main`.
- Navegación pública: únicamente **Catálogo**, **Personalizar** y **Drops**.
- VYVO Club y la sección “Líneas VYVO” permanecen fuera de alcance.
- VYVOCR es la experiencia pública; BilBildin no se menciona en copy dirigido al cliente.
- BilBildin sigue siendo la fuente de verdad para precio, stock, estado, categoría, SKU y pedidos.
- No inventar plazos, materiales, certificaciones, accesorios, disponibilidad ni tarifas.
- Moneda pública: CRC.
- Colores oficiales: `#111111`, `#6F2CFF`, `#FF5A1F`, `#79C943`, `#FAFAF7`, `#ECEAE7`.
- No aplicar efectos al logotipo ni usar gradientes decorativos.
- Mantener contraste AA, foco visible, objetivos táctiles de 44 × 44 px y soporte para `prefers-reduced-motion`.
- No agregar nuevas dependencias de runtime.
- No crear pedidos comerciales falsos durante la verificación.

## Mapa de archivos

### Nuevos

- `src/lib/hero/motion-profile.ts`: contrato puro que asigna a cada acento un perfil de movimiento y una señal CSS estable.
- `src/app/storefront-refinement.css`: estilos de refinamiento comercial, responsive y movimiento cargados después de `globals.css`.
- `scripts/verify-public-actions.mjs`: invariantes renderizadas de copy,
  acciones reales, orden de compra y accesibilidad del checkout.
- `scripts/verify-responsive.mjs`: matriz de seis viewports y cuatro perfiles
  de movimiento.
- `docs/integraciones/BILBILDIN_REQUERIMIENTOS_VYVO.md`: mejoras no bloqueantes solicitables al equipo del motor.

### Modificados

- `src/lib/bilbildin/catalog.ts`: eliminar plazos locales y aceptar únicamente plazos verificables en atributos.
- `src/lib/commerce/experience.ts`: copy VYVO sin nombres internos ni estados contradictorios.
- `src/types/commerce.ts`: conservar el contrato nullable de fulfillment; no ampliar la superficie pública sin necesidad.
- `src/app/layout.tsx`: cargar la hoja de refinamiento después de los estilos base.
- `src/app/page.tsx`: simplificar la landing y retirar el formulario de novedades no persistente.
- `src/app/drops/page.tsx`: presentar ABYSS según disponibilidad real y retirar el lanzamiento ficticio.
- `src/components/hero-showcase.tsx`: aplicar perfiles, continuidad de selección y anuncios accesibles.
- `src/components/product-filters.tsx`: resultados y transiciones coherentes.
- `src/components/product-card.tsx`: foco, estado y sombra por acento.
- `src/app/producto/[slug]/page.tsx`: reorganizar la ficha para priorizar precio y CTA en móvil.
- `src/components/product-purchase-panel.tsx`: copy comercial, estados y feedback de carrito.
- `src/components/cart-page-client.tsx`: claridad de cantidades y resumen.
- `src/components/checkout-client.tsx`: nombres de campo, ayudas y errores accesibles.
- `src/app/api/orders/route.ts`: conservar fail-closed y normalizar respuestas públicas.
- `src/lib/validation.ts`: retirar el esquema de waitlist si queda sin consumidores.
- `scripts/verify-browser.mjs`: reflejar rutas y acciones reales; no enviar formularios ficticios.
- `package.json`: registrar `verify:content` y `verify:responsive`.
- `README.md`: arquitectura, estado, pruebas y checklist reales.
- `docs/integraciones/VYVO.md`: separar estado actual de solicitudes futuras.

### Eliminados

- `src/components/waitlist-form.tsx`: el formulario no persiste datos y no debe presentarse como una acción real.
- `src/app/api/waitlist/route.ts`: endpoint de demostración sin persistencia.

---

### Task 1: Verdad comercial y contrato BilBildin

**Files:**
- Modify: `tests/bilbildin-catalog.test.ts`
- Modify: `tests/commerce-experience.test.ts`
- Modify: `src/lib/bilbildin/catalog.ts`
- Modify: `src/lib/commerce/experience.ts`

**Interfaces:**
- Consumes: `BilbildinProductRow.attributes: Record<string, unknown> | null`.
- Produces: `mapBilbildinProduct(product, row): StorefrontProduct` con `commerce.fulfillment.leadTimeDays` nulo salvo que exista un objeto válido `lead_time_days`.
- Produces: `getCommerceExperience("bilbildin")` con lenguaje enteramente VYVO.

- [x] **Step 1: Escribir pruebas fallidas para copy y plazo verificable**

Agregar a `tests/bilbildin-catalog.test.ts`:

```ts
import type { BilbildinProductRow } from "../src/lib/bilbildin/catalog";

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

test("Bilbildin mapping never invents a lead time", () => {
  assert.ok(core);
  const mapped = mapBilbildinProduct(core, makeRow({
    attributes: { sku: "VYV-MINI-CORE-001", sales_model: "standard" },
  }));
  assert.equal(mapped.commerce.fulfillment.leadTimeDays, null);
});

test("Bilbildin mapping accepts a validated lead time attribute", () => {
  assert.ok(core);
  const mapped = mapBilbildinProduct(core, makeRow({
    attributes: {
      sku: "VYV-MINI-CORE-001",
      sales_model: "standard",
      lead_time_days: { min: 4, max: 8 },
    },
  }));
  assert.deepEqual(mapped.commerce.fulfillment.leadTimeDays, { min: 4, max: 8 });
});
```

Actualizar `tests/commerce-experience.test.ts` para exigir:

```ts
const copy = JSON.stringify(getCommerceExperience("bilbildin"));
assert.doesNotMatch(copy, /BilBildin/i);
assert.doesNotMatch(copy, /cuando exista inventario/i);
assert.match(copy, /disponible|pedido|por coordinar/i);
```

- [x] **Step 2: Ejecutar las pruebas y confirmar el fallo**

Run:

```bash
npx tsx --test tests/bilbildin-catalog.test.ts tests/commerce-experience.test.ts
```

Expected: FAIL porque el adaptador asigna `3–7`/`5–12` días y el copy conectado nombra BilBildin.

- [x] **Step 3: Implementar un parser conservador de plazo**

En `src/lib/bilbildin/catalog.ts`, añadir:

```ts
function asLeadTimeDays(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const { min, max } = value as { min?: unknown; max?: unknown };
  if (
    typeof min !== "number" ||
    typeof max !== "number" ||
    !Number.isInteger(min) ||
    !Number.isInteger(max) ||
    min < 0 ||
    max < min ||
    max > 365
  ) {
    return null;
  }
  return { min, max };
}
```

Reemplazar el plazo hardcodeado por:

```ts
leadTimeDays: asLeadTimeDays(attributes.lead_time_days),
```

Reescribir el modo conectado en `experience.ts` con mensajes como:

```ts
catalog: {
  intro: "Explorá la colección, compará cada pieza y elegí la que mejor conecta con tu historia.",
  checkoutBenefit: "Pedido protegido y disponibilidad verificada",
},
product: {
  sourceStatus: "Precio y disponibilidad verificados para tu pedido.",
  availableStatus: "Disponible para pedido",
  unavailableStatus: "Agotado por el momento",
  availableDetails: "Disponibilidad confirmada",
  unavailableDetails: "Este producto no puede agregarse al carrito ahora",
  security: "Tu pedido se registra de forma segura. VYVO coordina directamente el pago y la entrega.",
  priceSuffix: "",
},
```

- [x] **Step 4: Ejecutar pruebas**

Run:

```bash
npx tsx --test tests/bilbildin-catalog.test.ts tests/commerce-experience.test.ts
```

Expected: PASS.

- [x] **Step 5: Confirmar**

```bash
git add tests/bilbildin-catalog.test.ts tests/commerce-experience.test.ts src/lib/bilbildin/catalog.ts src/lib/commerce/experience.ts
git commit -m "Align storefront truth with VYVO commerce"
```

---

### Task 2: Landing y Drops sin acciones ficticias

**Files:**
- Create: `scripts/verify-public-actions.mjs`
- Modify: `package.json`
- Modify: `src/app/page.tsx`
- Modify: `src/app/drops/page.tsx`
- Modify: `src/lib/validation.ts`
- Delete: `src/components/waitlist-form.tsx`
- Delete: `src/app/api/waitlist/route.ts`

**Interfaces:**
- Consumes: `StorefrontProduct.commerce.purchasable`.
- Produces: landing con hero, ruta de compra, productos, personalización, prueba local compacta, FAQ y CTA.
- Produces: Drops con CTA de compra cuando ABYSS sea comprable y estado agotado cuando no lo sea.

- [x] **Step 1: Crear prueba de invariantes públicas**

Crear `scripts/verify-public-actions.mjs` con Playwright y validar la interfaz
renderizada: lenguaje público, ausencia de waitlist, compra real en Drops,
un único enlace por tarjeta, orden de compra móvil y campos/foco de checkout.

Añadir `verify:content` al `package.json`.

- [x] **Step 2: Confirmar el fallo**

Run:

`npm run verify:content`

Expected: FAIL por el “Próximo drop” y los dos formularios de novedades.

- [x] **Step 3: Simplificar la landing**

En `src/app/page.tsx`:

- Retirar `WaitlistForm`.
- Retirar los bloques extensos `detail-section`, `unboxing-section` y el proceso de cuatro pasos.
- Mantener una prueba local compacta con título, dos párrafos cortos y tres garantías honestas: diseño local, acabado humano y revisión antes de entrega.
- Cambiar “Origins 010 · Próximo drop” por un estado derivado del producto o retirar ese bloque si duplica Drops.
- Conservar la personalización, el catálogo destacado, FAQ y CTA final.
- Hacer que el CTA final tenga únicamente enlaces reales a `/catalogo` y `/personalizar`.

- [x] **Step 4: Hacer Drops dependiente de disponibilidad real**

En `src/app/drops/page.tsx`:

```tsx
{abyss.commerce.purchasable ? (
  <ProductPurchasePanel product={abyss} mode={mode} />
) : (
  <div className="drop-unavailable" role="status">
    <strong>ABYSS está agotado por el momento.</strong>
    <p>Volvé al catálogo para descubrir otras piezas disponibles.</p>
    <Link href="/catalogo" className="button button--light">
      Explorar catálogo <Icon name="arrow" />
    </Link>
  </div>
)}
```

Retirar el bloque `#alerta`, `WaitlistForm` y cualquier copy de lanzamiento futuro cuando exista inventario.

- [x] **Step 5: Eliminar la waitlist demostrativa**

Eliminar:

- `src/components/waitlist-form.tsx`.
- `src/app/api/waitlist/route.ts`.
- `waitlistSchema`, `WaitlistInput` y `waitlistResponse` cuando no tengan consumidores.

Retirar estilos huérfanos en la tarea de CSS.

- [x] **Step 6: Ejecutar pruebas**

Run:

```bash
npm test
```

Expected: PASS y el total de pruebas aumenta con las dos invariantes nuevas.

- [x] **Step 7: Confirmar**

```bash
git add package.json scripts/verify-public-actions.mjs src/app/page.tsx src/app/drops/page.tsx src/lib/validation.ts src/components/waitlist-form.tsx src/app/api/waitlist/route.ts
git commit -m "Focus VYVO landing on real purchase actions"
```

---

### Task 3: Hero cinético con perfiles de personaje

**Files:**
- Create: `src/lib/hero/motion-profile.ts`
- Modify: `tests/hero-showcase.test.ts`
- Modify: `src/components/hero-showcase.tsx`
- Create: `src/app/storefront-refinement.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `getHeroMotionProfile(accent: Product["accent"]): HeroMotionProfile`.
- Produces: `<section data-motion-profile="...">` y stage con clave por familia/producto.
- Consumes: `StorefrontProduct.accent`, `showcase.direction`, `prefersReducedMotion`.

- [x] **Step 1: Escribir prueba de perfiles**

Agregar a `tests/hero-showcase.test.ts`:

```ts
test("every VYVO accent receives a distinct motion profile", () => {
  assert.equal(getHeroMotionProfile("purple").id, "signal");
  assert.equal(getHeroMotionProfile("orange").id, "rush");
  assert.equal(getHeroMotionProfile("green").id, "ground");
  assert.equal(getHeroMotionProfile("white").id, "graphite");
  assert.equal(new Set(["purple", "orange", "green", "white"]
    .map((accent) => getHeroMotionProfile(accent as Product["accent"]).id)).size, 4);
});
```

- [x] **Step 2: Confirmar el fallo**

Run:

```bash
npx tsx --test tests/hero-showcase.test.ts
```

Expected: FAIL porque `motion-profile.ts` no existe.

- [x] **Step 3: Crear el contrato puro**

Crear `src/lib/hero/motion-profile.ts`:

```ts
import type { Product } from "@/types/product";

export type HeroMotionProfile = {
  id: "signal" | "rush" | "ground" | "graphite";
  axis: "center" | "forward" | "grounded" | "contrast";
};

const profiles: Record<Product["accent"], HeroMotionProfile> = {
  purple: { id: "signal", axis: "center" },
  orange: { id: "rush", axis: "forward" },
  green: { id: "ground", axis: "grounded" },
  white: { id: "graphite", axis: "contrast" },
};

export function getHeroMotionProfile(accent: Product["accent"]) {
  return profiles[accent];
}
```

- [x] **Step 4: Conectar perfil, clave y anuncio**

En `hero-showcase.tsx`:

- Calcular el perfil desde `stageAccent`.
- Añadir `data-motion-profile={profile.id}` y `data-motion-axis={profile.axis}` al hero.
- Usar una clave estable `selectedProduct?.slug ?? "family"` en el medio del stage para que el cambio de protagonista tenga una fase de entrada coherente.
- Mantener la tarjeta automática mientras `selectedIndex === null`.
- Pausar el ciclo con movimiento reducido, pestaña oculta o hero fuera del viewport.
- Corregir el anuncio accesible para que el contador del carrito no sea confundido con la selección.

- [x] **Step 5: Definir la capa visual inicial**

Crear `storefront-refinement.css` con variables sin gradientes:

```css
.hero {
  --stage-shadow: rgb(111 44 255 / 18%);
  --stage-enter-x: 0px;
  --stage-enter-y: 10px;
}

.hero[data-motion-profile="rush"] {
  --stage-shadow: rgb(255 90 31 / 18%);
  --stage-enter-x: 18px;
  --stage-enter-y: 4px;
}

.hero[data-motion-profile="ground"] {
  --stage-shadow: rgb(121 201 67 / 17%);
  --stage-enter-x: 0px;
  --stage-enter-y: 16px;
}

.hero[data-motion-profile="graphite"] {
  --stage-shadow: rgb(41 39 46 / 16%);
  --stage-enter-x: -8px;
  --stage-enter-y: 8px;
}
```

Importar después de `globals.css` en `src/app/layout.tsx`:

```ts
import "./globals.css";
import "./storefront-refinement.css";
```

- [x] **Step 6: Ejecutar pruebas**

Run:

```bash
npx tsx --test tests/hero-showcase.test.ts tests/motion.test.ts
```

Expected: PASS.

- [x] **Step 7: Confirmar**

```bash
git add src/lib/hero/motion-profile.ts tests/hero-showcase.test.ts src/components/hero-showcase.tsx src/app/storefront-refinement.css src/app/layout.tsx
git commit -m "Add character-led VYVO hero motion"
```

---

### Task 4: Catálogo y ficha orientados a conversión

**Files:**
- Modify: `src/components/product-filters.tsx`
- Modify: `src/components/product-card.tsx`
- Modify: `src/app/producto/[slug]/page.tsx`
- Modify: `src/components/product-purchase-panel.tsx`
- Modify: `src/app/storefront-refinement.css`
- Modify: `scripts/verify-public-actions.mjs`

**Interfaces:**
- Consumes: `StorefrontProduct.commerce.purchasable`, `inventory.status`, `price`, `accent`.
- Produces: estructura `.pdp-primary-media`, `.pdp-commerce`, `.pdp-secondary-media`.
- Produces: resultados de catálogo anunciados mediante `aria-live="polite"`.

- [x] **Step 1: Ampliar invariantes de contenido**

Agregar una aserción de navegador que compare los límites renderizados de
`.purchase-panel` y `.pdp-secondary-media` a 390 px.

- [x] **Step 2: Confirmar el fallo**

Run:

`npm run verify:content`

Expected: FAIL porque las clases y el orden nuevo no existen.

- [x] **Step 3: Reestructurar la ficha**

En `src/app/producto/[slug]/page.tsx`:

- Separar la imagen principal de las tres vistas pendientes.
- Colocar el bloque con nombre, precio, disponibilidad y `ProductPurchasePanel` en `.pdp-commerce`.
- Renderizar las vistas pendientes después en `.pdp-secondary-media`.
- Mantener en escritorio dos columnas mediante áreas CSS; en móvil usar el orden del DOM.
- Cambiar “Lo que podría incluir” por “Contenido previsto” y conservar la advertencia de confirmación.

- [x] **Step 4: Afinar compra y tarjetas**

En `product-purchase-panel.tsx`:

- `aria-live="polite"` para “Agregado al carrito”.
- CTA deshabilitado con explicación visible cuando no sea comprable.
- Precio y disponibilidad sin referencias internas.

En `product-card.tsx`:

- Mantener un único destino de producto.
- Añadir `data-product-accent={product.accent}`.
- Asegurar foco visible del enlace principal.

En `product-filters.tsx`:

- Mantener búsqueda, orden y categorías actuales.
- No mostrar segmentos cuyo resultado potencial sea cero.
- Conservar botón “Limpiar filtros” únicamente cuando haya filtros activos.
- Anunciar “N productos” después del cambio sin mover el foco.

- [x] **Step 5: Estilos de conversión y responsive**

En `storefront-refinement.css`:

- Corregir el hero entre `901px` y `1150px`.
- Crear áreas desktop para ficha.
- En móvil, asegurar que `.pdp-commerce` aparezca antes de `.pdp-secondary-media`.
- Aplicar sombra de acento en hover/focus bajo `@media (hover: hover) and (pointer: fine)`.
- Evitar `transition: all`; usar propiedades explícitas.
- No producir overflow horizontal.

- [x] **Step 6: Ejecutar pruebas y build**

Run:

```bash
npm run typecheck
npm test
npm run build
```

Expected: PASS.

- [x] **Step 7: Confirmar**

```bash
git add src/components/product-filters.tsx src/components/product-card.tsx src/app/producto/[slug]/page.tsx src/components/product-purchase-panel.tsx src/app/storefront-refinement.css scripts/verify-public-actions.mjs
git commit -m "Prioritize purchase decisions across catalog"
```

---

### Task 5: Carrito y checkout accesibles

**Files:**
- Modify: `tests/bilbildin-order.test.ts`
- Modify: `src/components/cart-page-client.tsx`
- Modify: `src/components/checkout-client.tsx`
- Modify: `src/app/api/orders/route.ts`
- Modify: `src/app/storefront-refinement.css`

**Interfaces:**
- Consumes: `checkoutRequestSchema`.
- Produces: campos con `name`, `id`, ayudas asociadas y errores públicos consistentes.
- Preserva: cuerpo de pedido sin precio/costo de cliente y referencia firmada.

- [x] **Step 1: Añadir pruebas de contrato del pedido**

Agregar a `tests/bilbildin-order.test.ts`:

```ts
test("checkout accepts only the three coordinated payment methods", () => {
  for (const paymentMethod of ["sinpe", "transfer", "cash"]) {
    assert.equal(
      checkoutRequestSchema.safeParse({ ...validCheckout, paymentMethod }).success,
      true,
    );
  }
  assert.equal(
    checkoutRequestSchema.safeParse({
      ...validCheckout,
      paymentMethod: "card",
    }).success,
    false,
  );
});

test("checkout rejects invalid Costa Rica delivery data", () => {
  assert.equal(
    checkoutRequestSchema.safeParse({
      ...validCheckout,
      shippingAddress: {
        ...validCheckout.shippingAddress,
        postalCode: "1010",
      },
    }).success,
    false,
  );
});
```

- [x] **Step 2: Ejecutar prueba**

Run:

```bash
npx tsx --test tests/bilbildin-order.test.ts
```

Expected: PASS si el contrato ya es correcto; la prueba actúa como guardia antes de tocar UI.

- [x] **Step 3: Afinar formulario y feedback**

En `checkout-client.tsx`:

- Asignar `id` y `name` a todos los campos.
- Asociar textos de ayuda con `aria-describedby`.
- Mantener labels visibles.
- En cada cambio de paso, enfocar el `legend` usando `tabIndex={-1}` y una referencia.
- Preservar valores al editar.
- Mantener el error de envío con `role="alert"`.
- No mostrar plazo estimado en modo conectado.

En `cart-page-client.tsx`:

- Asegurar nombres accesibles completos para aumentar, reducir y eliminar.
- Deshabilitar reducción en cantidad 1 o explicar que eliminar es la acción correspondiente.
- Anunciar cambios de cantidad y total sin mover el foco.

- [x] **Step 4: Normalizar errores públicos**

En `src/app/api/orders/route.ts`, conservar códigos actuales y mapear:

```ts
const unavailable =
  /store_not_active|product_unavailable|insufficient_stock/i.test(error.message);
const retryable = /timeout|temporarily|connection/i.test(error.message);
```

Responder `409` para disponibilidad, `503` para fallo temporal y `500` para el resto, siempre con `Cache-Control: no-store` y sin incluir `error.message`.

- [x] **Step 5: Completar estilos**

En `storefront-refinement.css`:

- Foco de `legend` sin contorno visual cuando el enfoque sea programático.
- Errores próximos al campo.
- Barra de acciones móvil sin tapar contenido.
- Controles de cantidad de al menos 44 px.
- Resumen legible a 375 px.

- [x] **Step 6: Ejecutar verificación local**

Run:

```bash
npm run lint
npm run typecheck
npm test
```

Expected: PASS.

- [x] **Step 7: Confirmar**

```bash
git add tests/bilbildin-order.test.ts src/components/cart-page-client.tsx src/components/checkout-client.tsx src/app/api/orders/route.ts src/app/storefront-refinement.css
git commit -m "Harden VYVO cart and checkout usability"
```

---

### Task 6: Auditoría visual, responsive y acciones reales

**Files:**
- Modify: `scripts/verify-browser.mjs`
- Create: `scripts/verify-responsive.mjs`
- Modify: `src/app/storefront-refinement.css`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: servidor local en `http://localhost:3000`.
- Produces: JSON con resultados desktop/mobile, integridad de enlaces, flujo de compra seguro y cero errores de consola.

- [x] **Step 1: Actualizar el verificador**

En `scripts/verify-browser.mjs`:

- Eliminar el envío a `/api/waitlist`.
- Comprobar que no existe `WaitlistForm`, `#alerta` ni copy de lanzamiento ficticio.
- Añadir tamaños `375×812`, `768×1024`, `1024×768`, `1280×800` y mantener `390×844`, `1440×900`.
- Comprobar `.pdp-commerce` antes de `.pdp-secondary-media` en móvil.
- Validar cuatro `data-motion-profile`.
- Validar `prefers-reduced-motion`.
- Recorrer landing, catálogo, los nueve productos, personalización, Drops, carrito, checkout, legales y redirección `/club`.
- Llegar al paso de revisión del checkout sin confirmar un pedido real.
- Exigir cero enlaces rotos, botones sin nombre, formularios sin submit, overflow horizontal, errores de consola o respuestas 4xx/5xx inesperadas.

- [x] **Step 2: Ejecutar el servidor**

Run:

```bash
npm run dev
```

Expected: servidor disponible en `http://localhost:3000`.

- [x] **Step 3: Ejecutar el verificador**

Run:

```bash
npm run verify:browser
```

Expected: `failureCount: 0`.

- [x] **Step 4: Corregir hallazgos en una sola pasada**

Aplicar en `storefront-refinement.css` y, únicamente si existe CSS muerto relacionado con waitlist o club, retirarlo de `globals.css`. Corregir juntos:

- overflow;
- recorte del hero;
- orden PDP;
- foco;
- touch targets;
- movimiento reducido;
- contraste;
- estados de filtros y carrito.

- [x] **Step 5: Confirmar con una segunda y última pasada**

Run:

```bash
npm run verify:browser
```

Expected: `failureCount: 0` sin cambios adicionales.

- [x] **Step 6: Confirmar**

```bash
git add scripts/verify-browser.mjs src/app/storefront-refinement.css src/app/globals.css
git commit -m "Verify responsive VYVO purchase journeys"
```

---

### Task 7: Documentación, verificación final y producción

**Files:**
- Create: `docs/integraciones/BILBILDIN_REQUERIMIENTOS_VYVO.md`
- Modify: `docs/integraciones/VYVO.md`
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-07-29-vyvo-storefront-production-refinement.md`

**Interfaces:**
- Produces: handoff claro para VYVO y solicitudes no bloqueantes para BilBildin.
- Produces: commit final verificable en `origin/main`.

- [x] **Step 1: Documentar el límite VYVOCR ↔ BilBildin**

Actualizar `README.md` con:

- VYVOCR como superficie pública.
- BilBildin como motor administrativo.
- Business ID y nombres de variables, sin valores secretos.
- Flujo de lectura de catálogo.
- Flujo de creación idempotente de pedido.
- Formas de pago.
- Comandos de verificación.
- Total real de pruebas.
- Dominio canónico objetivo y URL Vercel actual.

- [x] **Step 2: Preparar el handoff para BilBildin**

Crear `docs/integraciones/BILBILDIN_REQUERIMIENTOS_VYVO.md`:

```md
# Requerimientos no bloqueantes de VYVO para BilBildin

## Estado actual
- Catálogo, precios, stock y pedidos conectados.
- Nueve productos visibles con diez unidades cada uno.

## Campos solicitados
1. `lead_time_days: { min, max }` por producto.
2. Galería publicable con orden y texto alternativo.
3. Material, edad y advertencias validadas.
4. Estado comercial del drop.
5. Límite máximo por pedido.

## Plataforma
- Protección centralizada contra abuso del endpoint de pedidos.
- Revisión de grants heredados sin afectar otros tenants.

Estas mejoras no bloquean la tienda; cuando un dato no existe, VYVO muestra “por coordinar”.
```

Actualizar `docs/integraciones/VYVO.md` para separar:

- completado;
- verificado;
- pendiente de DNS;
- pendiente de pedido controlado;
- solicitudes futuras.

- [x] **Step 3: Ejecutar la suite completa**

Run:

```bash
npm run check
```

Expected: lint, TypeScript, todas las pruebas y build PASS.

- [x] **Step 4: Revisar el diff**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: sin whitespace errors ni archivos generados accidentales.

- [x] **Step 5: Confirmar documentación**

```bash
git add README.md docs/integraciones/VYVO.md docs/integraciones/BILBILDIN_REQUERIMIENTOS_VYVO.md docs/superpowers/plans/2026-07-29-vyvo-storefront-production-refinement.md
git commit -m "Document VYVO production storefront"
```

- [ ] **Step 6: Publicar main**

Run:

```bash
git push origin main
```

Expected: `main -> main`.

- [ ] **Step 7: Verificar despliegue**

Comprobar:

- commit desplegado por Vercel;
- `/`, `/catalogo`, `/producto/vyvo-core`, `/carrito` y `/checkout` responden 200;
- catálogo público presenta nueve productos;
- stock/precio visibles coinciden con BilBildin;
- consola pública sin errores;
- ninguna acción pública menciona BilBildin o simula persistencia;
- el endpoint de pedido rechaza un payload inválido sin crear filas;
- `vyvocr.com` solo se declara activo después de verificar DNS.

- [ ] **Step 8: Marcar el plan**

Cambiar todas las casillas completadas de este documento a `[x]`, ejecutar:

```bash
git add docs/superpowers/plans/2026-07-29-vyvo-storefront-production-refinement.md
git commit -m "Complete VYVO storefront refinement plan"
git push origin main
```

Expected: `origin/main` limpio y sincronizado.
