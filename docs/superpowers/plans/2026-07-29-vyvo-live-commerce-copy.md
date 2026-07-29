# VYVO Live Commerce Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar el lenguaje demostrativo de la producción conectada sin perder el modo demo seguro.

**Architecture:** Un view model puro convierte `BilbildinMode` en copy comercial compartido. Los Server Components resuelven el modo desde el entorno y los Client Components reutilizan `CartProvider`; la disponibilidad sigue derivándose exclusivamente del producto.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Node test runner y Vercel.

## Global Constraints

- Producción usa `BILBILDIN_ENABLED=true`; preview y desarrollo conservan `false`.
- No agregar dependencias.
- No exponer costos, claves privadas ni identificadores de tenant enviados por el cliente.
- Stock cero mantiene productos visibles y compra deshabilitada.
- El modo conectado no puede mostrar “demo”, “demostrativo”, “simulado” ni “sin cobro real”.

---

### Task 1: Contrato de experiencia comercial

**Files:**
- Create: `src/lib/commerce/experience.ts`
- Create: `tests/commerce-experience.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `BilbildinMode` desde `src/lib/bilbildin/config.ts`.
- Produces: `getCommerceExperience(mode: BilbildinMode): CommerceExperience`.

- [ ] **Step 1: Escribir la prueba fallida**

Crear casos que importen `getCommerceExperience`, aplanen sus strings y
comprueben que `bilbildin` no contiene lenguaje de simulación y `demo` sí
declara que no crea pedidos reales.

- [ ] **Step 2: Verificar RED**

Run: `npx tsx --test tests/commerce-experience.test.ts`

Expected: FAIL porque `src/lib/commerce/experience.ts` todavía no existe.

- [ ] **Step 3: Implementar el view model mínimo**

Definir tipos readonly y dos objetos completos, uno por modo. La función debe
seleccionar el objeto sin leer `process.env`.

- [ ] **Step 4: Verificar GREEN**

Run: `npx tsx --test tests/commerce-experience.test.ts`

Expected: PASS, 2 pruebas y 0 fallos.

### Task 2: Adoptar el modo en todas las superficies públicas

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/catalogo/page.tsx`
- Modify: `src/app/drops/page.tsx`
- Modify: `src/app/producto/[slug]/page.tsx`
- Modify: `src/app/personalizar/[slug]/page.tsx`
- Modify: `src/app/carrito/page.tsx`
- Modify: `src/app/checkout/page.tsx`
- Modify: `src/components/hero-showcase.tsx`
- Modify: `src/components/customization-builder.tsx`
- Modify: `src/components/cart-provider.tsx`
- Modify: `src/app/api/waitlist/route.ts`

**Interfaces:**
- Consumes: `getCommerceExperience(mode)` y el `mode` existente de
  `CartProvider`.
- Produces: UI y metadata coherentes con demo o BilBildin.

- [ ] **Step 1: Conectar Server Components**

Resolver `mode` una vez por página, construir `experience` y reemplazar solo
las frases dependientes del estado comercial.

- [ ] **Step 2: Conectar Client Components**

Pasar `mode` al hero y usar `useCart().mode` en personalización. Mantener las
ramas de inventario sobre `product.commerce`.

- [ ] **Step 3: Neutralizar waitlist y comentarios**

La API debe informar que la lista aún no almacena correos sin llamar
“demostración” a toda la tienda. El comentario de persistencia del carrito será
neutral.

- [ ] **Step 4: Verificar tests focalizados**

Run: `npx tsx --test tests/commerce-experience.test.ts tests/bilbildin-catalog.test.ts tests/bilbildin-order.test.ts`

Expected: PASS sin warnings ni fallos.

### Task 3: Verificación, documentación y publicación

**Files:**
- Modify: `README.md`
- Modify: `docs/integraciones/VYVO.md`

**Interfaces:**
- Consumes: producción Vercel y negocio BilBildin activo.
- Produces: evidencia reproducible y handoff actualizado en ambos repositorios.

- [ ] **Step 1: Ejecutar verificación integral**

Run: `npm run check`

Expected: lint, typecheck, 23 pruebas y build de 32 rutas sin fallos.

- [ ] **Step 2: Desplegar desde `main`**

Publicar los commits en `stevengalocr/vyvo`, esperar estado `Ready` y confirmar
que el alias estable apunta al commit final.

- [ ] **Step 3: Recorrer producción**

Validar landing, catálogo, producto, personalización, Drops, carrito y checkout.
Confirmar CRC, nueve productos, compra bloqueada por stock cero, cero errores y
copy conectado.

- [ ] **Step 4: Actualizar handoff BilBildin**

Reemplazar `docs/integraciones/VYVO.md` en `stevengalocr/bilbildin/main` usando
el SHA actual y comprobar igualdad binaria con el archivo local.

- [ ] **Step 5: Cerrar limpio**

Confirmar `main == origin/main`, worktree limpio, eliminar archivos y CLI
temporales, y revisar errores de runtime del despliegue final.

