# VYVO Hero Character Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el hero de VYVO en una experiencia de dos estados donde Familia conserva la composición grupal y la vista previa automática, mientras una selección manual presenta un solo personaje grande con animación futurista.

**Architecture:** La lógica de navegación vivirá en funciones puras y probadas dentro de `src/lib/hero/showcase-state.ts`. `HeroShowcase` consumirá ese estado para separar `previewIndex` de `selectedIndex`, y el CSS existente del hero se ampliará con un escenario estable, señales cromáticas y transiciones accesibles. Los nueve recursos se producirán como recortes PNG transparentes derivados de las imágenes actuales y se servirán mediante `next/image`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, CSS nativo, Node test runner con `tsx`, `next/image`, herramienta integrada de generación de imágenes.

## Global Constraints

- Mantener el estado inicial Familia con la composición actual.
- Mantener la rotación automática únicamente en la tarjeta flotante cada 4.8 segundos.
- Pausar la rotación cuando exista una selección manual.
- No añadir dependencias de animación.
- No modificar catálogo, precios, inventario, BilBildin, carrito ni checkout.
- Generar los nueve recursos como PNG con canal alfa bajo `/public/products/<slug>/hero-transparent.png`.
- Respetar `prefers-reduced-motion`.
- Mantener navegación por mouse, teclado y touch.
- Ejecutar y validar directamente sobre `main`, autorizado por el usuario.

---

### Task 1: Modelo de estado probado

**Files:**
- Create: `src/lib/hero/showcase-state.ts`
- Create: `tests/hero-showcase.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `type HeroShowcaseState = { selectedIndex: number | null; previewIndex: number; direction: -1 | 1 }`
  - `createHeroShowcaseState(): HeroShowcaseState`
  - `advanceHeroPreview(state, productCount): HeroShowcaseState`
  - `selectHeroProduct(state, index, productCount): HeroShowcaseState`
  - `clearHeroSelection(state): HeroShowcaseState`
  - `moveHero(state, direction, productCount): HeroShowcaseState`
  - `getHeroKeyboardTarget(key, currentIndex, productCount): number | null`

- [ ] **Step 1: Escribir las pruebas fallidas**

Crear `tests/hero-showcase.test.ts` con casos literales para:

```ts
assert.deepEqual(createHeroShowcaseState(), {
  selectedIndex: null,
  previewIndex: 0,
  direction: 1,
});

assert.deepEqual(advanceHeroPreview(createHeroShowcaseState(), 9), {
  selectedIndex: null,
  previewIndex: 1,
  direction: 1,
});

assert.deepEqual(
  advanceHeroPreview(
    { selectedIndex: 3, previewIndex: 3, direction: 1 },
    9,
  ),
  { selectedIndex: 3, previewIndex: 3, direction: 1 },
);

assert.deepEqual(
  selectHeroProduct(createHeroShowcaseState(), 4, 9),
  { selectedIndex: 4, previewIndex: 4, direction: 1 },
);

assert.deepEqual(
  moveHero({ selectedIndex: null, previewIndex: 0, direction: 1 }, -1, 9),
  { selectedIndex: null, previewIndex: 8, direction: -1 },
);

assert.deepEqual(
  moveHero({ selectedIndex: 8, previewIndex: 8, direction: 1 }, 1, 9),
  { selectedIndex: 0, previewIndex: 0, direction: 1 },
);

assert.deepEqual(
  clearHeroSelection({ selectedIndex: 4, previewIndex: 4, direction: 1 }),
  { selectedIndex: null, previewIndex: 4, direction: 1 },
);

assert.equal(getHeroKeyboardTarget("Home", 4, 9), 0);
assert.equal(getHeroKeyboardTarget("End", 4, 9), 8);
assert.equal(getHeroKeyboardTarget("ArrowLeft", 0, 9), 8);
assert.equal(getHeroKeyboardTarget("ArrowRight", 8, 9), 0);
assert.equal(getHeroKeyboardTarget("Enter", 4, 9), null);
```

La mutación que deben capturar es cualquier mezcla accidental entre vista previa y selección, límites no circulares o temporizador activo durante una selección.

- [ ] **Step 2: Ejecutar la prueba y confirmar RED**

Run:

```powershell
npx tsx --test tests/hero-showcase.test.ts
```

Expected: FAIL porque `src/lib/hero/showcase-state.ts` todavía no existe.

- [ ] **Step 3: Implementar el modelo mínimo**

Crear funciones puras con normalización circular:

```ts
const wrapIndex = (index: number, count: number) =>
  ((index % count) + count) % count;
```

Validar `productCount > 0`; para cero productos, conservar el estado y devolver `null` desde la navegación de teclado. La selección debe sincronizar ambos índices y `clearHeroSelection` debe conservar el último `previewIndex`.

- [ ] **Step 4: Añadir la prueba al script del proyecto**

Agregar `tests/hero-showcase.test.ts` al comando `test` de `package.json`.

- [ ] **Step 5: Ejecutar GREEN**

Run:

```powershell
npx tsx --test tests/hero-showcase.test.ts
npm test
```

Expected: todas las pruebas PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/hero/showcase-state.ts tests/hero-showcase.test.ts package.json
git commit -m "Test VYVO hero selection state"
```

---

### Task 2: Recursos transparentes de los nueve personajes

**Files:**
- Inspect: `public/products/<slug>/concept-primary.png`
- Create: `public/products/<slug>/hero-transparent.png`

**Interfaces:**
- Consumes: los nueve `slug` del catálogo existente.
- Produces: una imagen cuadrada con alfa por personaje, lista para `next/image`.

- [ ] **Step 1: Inspeccionar cada imagen original**

Abrir con la herramienta visual:

```text
public/products/{core,rush,wild,echo,shift,nova,arena,nexo,abyss}/concept-primary.png
```

Confirmar pose, color de acento, casco, silueta, cuerpo completo y espacio disponible alrededor.

- [ ] **Step 2: Crear una edición con fondo chroma por personaje**

Usar una llamada integrada de generación por personaje. Prompt base:

```text
Use case: background-extraction
Asset type: recorte principal del hero de una tienda VYVO
Input image: Image 1 is the edit target and identity source
Primary request: isolate the exact existing VYVO <NAME> figure from Image 1 and place it on a perfectly flat solid chroma-key background
Scene/backdrop: one uniform <KEY_COLOR> with no floor, shadow, gradient, texture, reflection or lighting variation
Composition/framing: centered full-body cutout, original camera angle and pose, generous uniform padding, no crop
Style/medium: preserve the exact original stylized 3D product render
Constraints: preserve exact silhouette, proportions, helmet/face, colors, armor details and accessories; change only the background; do not redesign, add, remove, mirror or rotate anything
Avoid: text, watermark, cast shadow, contact shadow, reflection, extra objects
```

Usar `#ff00ff` para WILD por su verde y `#00ff00` para los demás, salvo conflicto visible.

- [ ] **Step 3: Convertir chroma a alfa**

Copiar cada salida elegida dentro del workspace y ejecutar:

```powershell
python C:\Users\steve_1xcg4d1\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py --input <chroma-source> --out public\products\<slug>\hero-transparent.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
```

- [ ] **Step 4: Validar cada PNG**

Comprobar:

- modo RGBA;
- esquinas completamente transparentes;
- cobertura de sujeto plausible;
- cuerpo completo;
- ausencia de halo chroma visible;
- fidelidad de pose y diseño.

Si hay borde de color, reintentar una vez con `--edge-contract 1`. Si la extracción simple no es suficiente, detenerse antes de cambiar al fallback CLI de transparencia nativa.

- [ ] **Step 5: Commit**

```powershell
git add public/products/*/hero-transparent.png
git commit -m "Add transparent VYVO hero characters"
```

---

### Task 3: Interacción accesible del hero

**Files:**
- Modify: `src/components/hero-showcase.tsx`
- Consume: `src/lib/hero/showcase-state.ts`
- Consume: `public/products/<slug>/hero-transparent.png`

**Interfaces:**
- Consumes: las funciones puras de Task 1 y el contrato `StorefrontProduct[]`.
- Produces: hero con estado Familia y selección manual separada.

- [ ] **Step 1: Releer el craft floor antes de editar UI**

Leer completamente:

```text
C:\Users\steve_1xcg4d1\.codex\skills\impeccable\reference\craft-floor.md
```

- [ ] **Step 2: Reemplazar el estado ambiguo**

Sustituir `active`, `paused` y `familyIndex` por:

```ts
const [showcase, setShowcase] = useState(createHeroShowcaseState);
const focusProduct = products[showcase.previewIndex] ?? null;
const selectedProduct =
  showcase.selectedIndex === null
    ? null
    : (products[showcase.selectedIndex] ?? null);
```

El intervalo llamará `advanceHeroPreview` solamente cuando no exista selección, el hero esté visible, el documento esté activo y el usuario no solicite movimiento reducido.

- [ ] **Step 3: Renderizar un escenario estable**

En Familia:

```tsx
<Image
  src="/landing/hero-family-concept-v1.png"
  alt="Familia conceptual de figuras VYVO compartiendo una escena de estudio."
  fill
  priority
/>
```

Con selección:

```tsx
<Image
  src={`/products/${selectedProduct.slug.replace(/^vyvo-/, "")}/hero-transparent.png`}
  alt={`${selectedProduct.name}, figura de la colección Origins de VYVO.`}
  fill
/>
```

Usar una `key` por estado para reiniciar la transición, `data-direction` para orientar el desplazamiento y un estado `stageImageFailed` que cambie a `selectedProduct.image` desde `onError` y se reinicie cuando cambie el personaje.

- [ ] **Step 4: Mantener la tarjeta como foco automático**

La tarjeta siempre usa `focusProduct`. En Familia muestra producto y progreso de 4.8 segundos; al seleccionar, muestra ese mismo producto sin progreso automático. El enlace conserva `/producto/<slug>` y el precio usa `formatMoney`.

- [ ] **Step 5: Implementar selección y flechas**

- Click de producto: `selectHeroProduct`.
- Click de Familia: `clearHeroSelection`.
- Flechas: `moveHero`.
- En Familia, `moveHero` cambia solo la tarjeta.
- En modo producto, `moveHero` cambia protagonista y tarjeta.

- [ ] **Step 6: Implementar teclado y semántica**

- Mantener `role="tablist"` y `role="tab"`.
- `aria-selected` refleja selección manual; Familia es seleccionada cuando `selectedIndex === null`.
- El preview automático usa `data-previewing`, no `aria-selected`.
- Implementar `ArrowLeft`, `ArrowRight`, `Home` y `End` con `getHeroKeyboardTarget`.
- Gestionar roving `tabIndex`.
- Añadir un estado visualmente oculto `aria-live="polite"` que se actualiza solo con selección manual.
- No anunciar los cambios automáticos.

- [ ] **Step 7: Ejecutar validaciones funcionales**

Run:

```powershell
npm run typecheck
npm test
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/components/hero-showcase.tsx
git commit -m "Build interactive VYVO hero focus"
```

---

### Task 4: Dirección visual y movimiento

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: clases y atributos del componente de Task 3.
- Produces: escenario Familia/producto, señal VYVO, tarjeta con progreso, estados de chips y responsive.

- [ ] **Step 1: Crear el escenario del protagonista**

Añadir clases acotadas:

```css
.hero__stage
.hero__stage-media
.hero__stage-media--family
.hero__stage-media--product
.hero__stage-signal
.hero__stage-orbit
```

El producto usa `object-fit: contain`, escala consistente y un fondo luminoso con halo basado en `--accent`. Familia conserva `object-fit: cover`.

- [ ] **Step 2: Crear la transición**

Definir:

```css
@keyframes hero-stage-product-enter
@keyframes hero-stage-family-enter
@keyframes hero-stage-signal-enter
@keyframes hero-focus-progress
```

Entrada del producto: 420 ms, `opacity`, desplazamiento direccional corto, `scale(.96)` y blur máximo de 3 px. La tarjeta cruza en 260 ms. El progreso dura 4.8 s solo en Familia.

- [ ] **Step 3: Diferenciar preview y selección**

- `.is-selected`: fondo, borde, color y sombra de selección manual.
- `.is-previewing`: señal secundaria discreta, sin copiar el peso visual de selección.
- Familia se ve seleccionada por defecto.
- Foco visible con `:focus-visible`.

- [ ] **Step 4: Proteger responsive**

Desktop:

- protagonista grande sin invadir la tarjeta;
- tarjeta anclada abajo a la derecha.

Mobile:

- escenario con altura suficiente para cuerpo completo;
- tarjeta pasa a una franja separada al pie del escenario;
- `object-fit: contain`;
- sin overflow horizontal;
- chips con scroll horizontal y áreas táctiles de 44 px.

- [ ] **Step 5: Respetar movimiento reducido**

Dentro de `@media (prefers-reduced-motion: reduce)`:

```css
.hero__stage-media,
.hero__stage-signal,
.hero-focus__content,
.hero-focus__progress {
  animation: none;
  transition: none;
}
```

Mantener contenido legible y cambios inmediatos.

- [ ] **Step 6: Ejecutar Impeccable una sola vez tras terminar UI**

Run:

```powershell
node C:\Users\steve_1xcg4d1\.codex\skills\impeccable\scripts\detect.mjs --json src/components/hero-showcase.tsx src/app/globals.css
```

Resolver cualquier hallazgo real sin expandir el alcance.

- [ ] **Step 7: Revisar React**

Aplicar la skill `vercel:react-best-practices` sobre los TSX modificados y corregir problemas de renderizado, efectos o carga.

- [ ] **Step 8: Commit**

```powershell
git add src/app/globals.css
git commit -m "Polish VYVO hero motion and layout"
```

---

### Task 5: Verificación integral, producción y main

**Files:**
- Verify: all changed files
- Modify only if a failing check exposes a scoped defect

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: implementación verificada localmente y desplegada.

- [ ] **Step 1: Verificar el proyecto completo**

Run:

```powershell
npm run check
git diff --check
```

Expected: lint, types, tests y build PASS; no whitespace errors.

- [ ] **Step 2: Verificar navegador local**

Iniciar el servidor de desarrollo y validar con automatización:

- estado inicial Familia;
- tarjeta rota sin cambiar la imagen grande;
- selección de cada personaje;
- flechas en ambos modos;
- regreso a Familia;
- teclado completo;
- CTA y enlace de tarjeta;
- desktop y mobile;
- sin overflow;
- consola sin errores.

- [ ] **Step 3: Revisar movimiento reducido**

Emular `prefers-reduced-motion: reduce` y confirmar que los cambios son inmediatos, sin barridos, escalas ni progreso animado.

- [ ] **Step 4: Confirmar estado Git**

Run:

```powershell
git status --short
git log --oneline -5
git rev-list --left-right --count origin/main...main
```

- [ ] **Step 5: Subir main**

Autenticar GitHub como `stevengalocr` si la credencial local sigue vencida y ejecutar:

```powershell
git push origin main
```

- [ ] **Step 6: Verificar Vercel**

Esperar el despliegue asociado al último commit y repetir en la URL pública:

- carga del hero y recursos;
- selección Familia/personaje;
- catálogo y enlaces;
- consola;
- viewport desktop y mobile.

- [ ] **Step 7: Entrega**

Reportar:

- commits y estado de sincronización de `main`;
- rutas de los nueve recursos;
- pruebas ejecutadas;
- URL de Vercel validada;
- cualquier bloqueo externo real, si existiera.
