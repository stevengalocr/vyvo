# BilBildin VYVO Business Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Asociar definitivamente el administrador de VYVO, aplicar la identidad visual aprobada y dejar los nueve productos visibles con diez unidades auditadas.

**Architecture:** BilBildin seguirá siendo la fuente de verdad para negocio, usuario, catálogo e inventario. La mutación de datos se ejecutará como una sola sentencia PostgreSQL limitada al Business ID y correo de VYVO; la tienda Next.js solo consumirá esos datos y conservará el envío de pedidos por la función transaccional existente.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node test runner, Supabase Postgres/Auth, BilBildin, Vercel.

## Global Constraints

- Trabajar y publicar únicamente en `main`.
- No crear ni enviar pedidos reales durante la verificación.
- No publicar credenciales, números SINPE ni datos bancarios.
- No modificar negocios, productos ni usuarios fuera de VYVO.
- Toda afirmación de finalización requiere evidencia fresca de base de datos, pruebas y producción.

---

### Task 1: Corregir el copy de compra conectado

**Files:**
- Modify: `src/lib/commerce/experience.ts`
- Modify: `src/components/cart-page-client.tsx`
- Modify: `src/components/checkout-client.tsx`
- Test: `tests/commerce-experience.test.ts`

- [ ] **Step 1: Escribir pruebas que fallen**

Agregar al modelo `CommerceExperience` los textos `cart.emptyDescription` y
`checkout.contactPrivacy`, y comprobar que el modo BilBildin no contiene
“simulación” ni une las palabras “decompra”.

- [ ] **Step 2: Ejecutar la prueba enfocada y confirmar el fallo**

Run: `npx tsx --test tests/commerce-experience.test.ts`
Expected: FAIL porque los nuevos campos todavía no existen o no se usan.

- [ ] **Step 3: Implementar el copy mínimo**

Definir texto conectado y demostrativo en `experience.ts`, consumirlo desde
`CartPageClient` y `CheckoutClient`, y eliminar el texto hardcodeado incorrecto.

- [ ] **Step 4: Ejecutar la prueba enfocada y confirmar éxito**

Run: `npx tsx --test tests/commerce-experience.test.ts`
Expected: PASS sin fallos.

### Task 2: Configurar VYVO y normalizar el inventario en Supabase

**Files:**
- Reference: `docs/superpowers/specs/2026-07-29-bilbildin-vyvo-business-configuration-design.md`
- Modify: Supabase project `wgicaiphzwppnshagxve`

- [ ] **Step 1: Capturar una línea base aislada**

Consultar el negocio `14d10531-d6fc-45a9-9c74-1ff15c657099`, el usuario
`vyvocr@gmail.com`, los nueve productos y un resumen verificable de los demás
tenants. Confirmar negocio/plan activos, correo exacto y stock esperado antes de
mutar.

- [ ] **Step 2: Ejecutar una única sentencia transaccional**

La sentencia debe:

1. seleccionar VYVO por Business ID, correo exacto, negocio activo, plan activo
   y usuario confirmado;
2. reemplazar `theme_config` con el objeto plano aprobado y mantener
   `custom_domain = 'vyvocr.com'`;
3. bloquear los productos visibles;
4. cambiar a diez solo los stocks distintos de diez;
5. insertar un movimiento `restock` por cada producto modificado, con stock
   anterior/final y nota de auditoría;
6. devolver conteos de negocio, productos y movimientos afectados.

Expected: un negocio, nueve productos en alcance, ocho productos modificados y
ocho movimientos registrados.

- [ ] **Step 3: Verificar la postcondición y el aislamiento**

Confirmar:

- correo de `auth.users` igual a `owner_email` y confirmado;
- negocio y plan activos;
- `custom_domain = vyvocr.com`;
- configuración plana completa con `storefront_url = https://vyvocr.com`;
- nueve productos visibles con stock diez y total noventa;
- ocho movimientos correspondientes a esta carga;
- resumen de otros tenants idéntico a la línea base.

- [ ] **Step 4: Ejecutar asesores de seguridad y rendimiento**

Revisar los asesores Supabase. No introducir cambios de esquema para resolver
advertencias preexistentes fuera del alcance.

### Task 3: Actualizar el handoff operativo

**Files:**
- Modify: `README.md`
- Modify: `docs/integraciones/VYVO.md`
- Modify: `C:\tmp\bilbildin-theme-inspect-20260729\docs\integraciones\VYVO.md`

- [ ] **Step 1: Documentar el estado comprobado**

Registrar usuario asociado, configuración visual aplicada, dominio objetivo,
stock diez por producto y total noventa. Marcar como pendiente solo la compra
transaccional controlada, DNS/SSL y cualquier tarea realmente no comprobada.

- [ ] **Step 2: Revisar que no se documenten secretos**

Run: `rg -n "service_role|secret key|password|contraseña|IBAN|SINPE.*[0-9]{8}" README.md docs/integraciones/VYVO.md`
Expected: ninguna credencial o dato bancario expuesto.

### Task 4: Verificación integral y publicación

**Files:**
- Verify: aplicación completa y producción Vercel

- [ ] **Step 1: Ejecutar la verificación completa local**

Run: `npm run check`
Expected: lint, typecheck, pruebas y build con exit code 0.

- [ ] **Step 2: Validar la experiencia productiva sin enviar pedido**

En `https://vyvo-six.vercel.app` comprobar:

- catálogo con nueve productos y precio CRC;
- cada producto con stock disponible;
- acción de carrito habilitada;
- flujo carrito → checkout hasta revisión;
- personalización con acción final habilitada;
- copy de producción sin lenguaje demostrativo;
- sin errores de consola ni desbordamiento horizontal.

No pulsar “Confirmar pedido”.

- [ ] **Step 3: Confirmar y publicar VYVO**

Revisar diff, confirmar solo los archivos previstos, crear un commit descriptivo
en `main` y hacer push a `origin/main`.

- [ ] **Step 4: Confirmar y publicar el handoff BilBildin**

Revisar diff en la copia temporal BilBildin, confirmar únicamente
`docs/integraciones/VYVO.md`, crear commit en `main` y hacer push a
`origin/main`.

- [ ] **Step 5: Verificar despliegue final y repositorios**

Confirmar que producción sirve el commit nuevo, que la base conserva las
postcondiciones y que ambas ramas locales coinciden con sus respectivos
`origin/main`.

- [ ] **Step 6: Retirar la copia temporal**

Resolver y validar que la ruta exacta
`C:\tmp\bilbildin-theme-inspect-20260729` está dentro de `C:\tmp`; después
eliminar solo esa copia temporal.
