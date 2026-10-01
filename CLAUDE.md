# VYVO

Tienda pública de VYVOCR (figuras personalizables, articuladas y coleccionables, Costa Rica): Next.js 16 + React 19 + TypeScript + Zod, desplegada en Vercel en `https://www.vyvocr.com`. Es una **landing propia conectada a BilBildin** (el CORE de ecommerce de GaloDev): lee el catálogo en vivo y le pide los pedidos a la base; no tiene panel propio. Estado al 2026-09-30: producción `READY`, alineada en código con el contrato de tiendas, **0 pedidos y 0 clientes reales** desde la limpieza del 2026-09-02.

**BilBildin permanece fuera del lenguaje y de la navegación pública.** Ningún texto dirigido al comprador, ninguna ruta y ningún enlace lo nombra. Es el motor administrativo; la cara es VYVO.

## Comandos

```bash
npm run dev            # desarrollo en :3000 (ojo: el 3000 lo puede tener otro proyecto)
npm run check          # lint → typecheck → test → build. Es el orden de verificación antes de cada commit.
npm run lint           # eslint . --max-warnings=0
npm run typecheck      # tsc --noEmit
npm test               # tsx --test sobre la lista explícita de tests/ (una prueba nueva se agrega al script)
npm run build          # next build
npm run fonts:check    # cobertura de glifos de las fuentes subseteadas, incluido el ₡
npm run verify:content | verify:responsive | verify:browser   # sondas contra un servidor levantado; no las corre `check`
```

No hay pruebas que toquen la base. `npm test` corre sin red; el contrato con BilBildin se fija en pruebas unitarias sobre la forma del payload y de la respuesta.

## Mapa

| Necesito… | Está en |
|---|---|
| Configuración y modo (`demo` / `bilbildin`) | `src/lib/bilbildin/config.ts` |
| Clientes de Supabase (público y de servidor, `server-only`) | `src/lib/bilbildin/client.ts` |
| Catálogo desde BilBildin (`is_storefront_business_active` + `products`) | `src/lib/bilbildin/provider.ts` · `catalog.ts` |
| **Contrato del RPC de pedidos** (payload, parámetros, respuesta) | `src/lib/bilbildin/order-payload.ts` |
| Los ocho códigos de rechazo, traducidos | `src/lib/bilbildin/order-errors.ts` |
| Crear pedidos | `src/app/api/orders/route.ts` + `order-schema.ts` |
| Encargos personalizados (multipart, fotos al bucket privado) | `src/app/api/encargos/route.ts` · `custom-requests.ts` · `custom-request-schema.ts` |
| Confirmación y seguimiento (`/checkout/confirmacion`, `/rastreo`) | `src/lib/bilbildin/orders.ts` · `order-reference.ts` · `src/app/api/rastreo/route.ts` |
| Dominio canónico, nombre, descripción | `src/lib/site.ts` |
| Datos legales y de contacto (no inventar razón social) | `src/lib/legal.ts` |
| Texto editorial de las nueve piezas Origins | `src/data/products.ts` (solo texto; el catálogo lo decide BilBildin) |
| Pruebas | `tests/*.test.ts` (Node test runner vía `tsx`) |
| Migraciones históricas de VYVO en la base de BilBildin | `supabase/migrations/` — **historia, no fuente** (`LEEME.md`) |
| Contexto de traspaso y mediciones | `docs/CONTEXTO.md` · `README.md` |
| Puente con el vault | `docs/vault-sync/` |

## Identidad en BilBildin

- `business_id`: `14d10531-d6fc-45a9-9c74-1ff15c657099` (UUID público; no es una clave).
- Proyecto Supabase del CORE: `wgicaiphzwppnshagxve`. Dominio en `businesses.custom_domain`: `vyvocr.com` (el ápex responde 308 a `www`).
- Puerta de pedidos: `create_storefront_order_idempotent(uuid, uuid, jsonb)`, que **desde el 2026-09-19 delega en `crear_pedido`** (`bilbildin/supabase/migrations/20260919_puertas_viejas_delegan.sql`). La puerta **lanza** el código de rechazo; VYVO lo lee de `error.message`.
- Contrato completo: `../bilbildin/docs/integraciones/CONTRATO-DE-ALINEACION.md` (copia fiel en el vault: `02-Proyectos/BilBildin/Contrato-De-Alineacion-De-Tiendas.md`). La auditoría de VYVO punto por punto está en el vault, `Tiendas/VYVO/Alineacion-Con-BilBildin.md`.

## Variables de entorno

Documentadas sin valores en `.env.example`; los valores viven en Vercel y en `.env.local` (ignorado por git).

| Variable | Ámbito | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | pública | origen canónico; `site.ts` descarta cualquier `*.vercel.app` aunque la variable mienta |
| `BILBILDIN_ENABLED` | servidor | `true` = catálogo y pedidos reales; cualquier otra cosa = modo demo |
| `NEXT_PUBLIC_SUPABASE_URL` | pública | URL del proyecto del CORE |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (legado: `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | pública | catálogo e `is_storefront_business_active`, nada más |
| `NEXT_PUBLIC_VYVO_BUSINESS_ID` (legado: `NEXT_PUBLIC_BUSINESS_ID`) | pública | el `business_id` de arriba |
| `SUPABASE_SECRET_KEY` (legado: `SUPABASE_SERVICE_ROLE_KEY`) | **solo servidor** | pedidos, encargos, confirmación y seguimiento |
| `BILBILDIN_CUSTOM_PRODUCT_SLUG` | servidor | slug del producto contra el que se registran los encargos (`vyvo-encargo-personalizado`) |

## Reglas que no se rompen

1. **La tienda no escribe pedidos: se los pide a BilBildin.** Cero `insert`/`update` en `orders`, `order_items`, `order_tracking`, `store_customers`, `inventory_movements`; cero cambios a `stock_quantity`. Solo `supabase.rpc(STOREFRONT_ORDER_RPC, …)` desde `order-payload.ts`, y lecturas de `orders` con columnas enumeradas para confirmación/seguimiento.
2. **Del carrito solo viaja qué y cuánto.** Nunca precio, costo, total, nombre ni `business_id` desde el navegador. `checkoutRequestSchema` y `customRequestSchema` son `.strict()`.
3. **La llave de servicio solo vive en el servidor.** Nunca con `NEXT_PUBLIC_`, nunca en un archivo `"use client"`, nunca devuelta por un endpoint. `client.ts`, `orders.ts` y `custom-requests.ts` son `server-only`.
4. **Toda consulta lleva `.eq("business_id", config.businessId)`** y el catálogo además `.eq("status", "visible")`, enumerando columnas (nunca `select("*")`, nunca `cost_price`).
5. **Los ocho códigos de `crear_pedido` se traducen todos**, a HTTP y texto propio, **devolviendo** el error (no lanzándolo): `store_not_active`, `product_unavailable`, `insufficient_stock`, `invalid_product`, `temporarily_unavailable`, `purchase_limit_exceeded`, `invalid_request`, `internal_error`. Si el CORE agrega uno, se agrega a `BILBILDIN_ORDER_CODES` y a su familia, y la prueba lo exige.
6. **`accepted_terms: true` viaja siempre** (la casilla es obligatoria en el navegador y el esquema del servidor lo vuelve a exigir). La versión de términos la pone BilBildin; el navegador nunca la manda.
7. **BilBildin manda sobre el catálogo.** `readBilbildinCatalog` lista todo lo `visible`; `src/data/products.ts` solo aporta texto. Un `alt` inventado es peor que ninguno: el de `attributes.gallery` manda, el respaldo es el texto local o el nombre.
8. **El canonical nunca sale de un host de despliegue.** No agregar `loading.tsx` en la raíz de `app/`. `robots.txt` debe permitir `/api/media/`. (Las tres cuestan CLS, ranking o imágenes en resultados enriquecidos; detalle en `docs/CONTEXTO.md`.)
9. **No inventar datos registrales ni legales.** Razón social y cédula solo en `src/lib/legal.ts`, y solo si existen.

## Trampas conocidas

- **El build falla si `anon` pierde el permiso de `is_storefront_business_active`.** Pasó el 2026-09-19: un endurecimiento en el CORE lo quitó y el deploy quedó en `ERROR` con «No fue posible validar la tienda VYVO en Bilbildin». Se restauró (`bilbildin` `8fbeba7`, decisión `docs/decisiones/is-storefront-business-active-la-puede-llamar-anon.md`) y `check:crear-pedido` caso 16 lo vigila del lado del CORE. Si el build de Vercel muere con ese texto, el problema está en el CORE, no acá.
- **`supabase/migrations/` de este repo ya no describe producción.** Las funciones que creó se renombraron `_legado_20260919` sin permisos. Las pruebas que leen esos SQL prueban historia. No aplicarlos sobre la base.
- **Un `Error` lanzado desde una server action no llega al comprador en producción** (Next lo redacta). Por eso `/api/orders` responde JSON con el mensaje ya traducido.
- **Un mes sin vender sin que nada avisara** (2026-08-18 → 09-19): la copia propia de «crear pedido» dejó de funcionar cuando `order_items.business_id` se volvió obligatorio y las suites daban verde. La cura fue delegar en `crear_pedido`; la protección es no volver a escribir pedidos desde acá.
- **El producto de encargo está en ₡2.000 y stock 20 en la base** (verificado 2026-09-30), no en ₡0 como asume el flujo documentado. Cada encargo descuenta 1.
- **`next start` sirve el build viejo** y `next/image` cachea por URL: una página nueva que da 404 o una imagen reemplazada con el mismo nombre no son bugs del código.
- **El build local corre en modo demo** si `.env.local` no tiene las claves: no prueba la conexión con BilBildin. La prueba real es el deploy.
- **Puerto 3000:** otro proyecto de `claude-proyectos` puede tenerlo ocupado; una sonda que solo pregunte «¿hay servidor?» verifica el sitio equivocado.

## Vault de Obsidian (memoria del proyecto) — protocolo de alineación

El estado, las decisiones, los pendientes y la relación con BilBildin viven fuera del repo, en el vault local de Obsidian:

- **Sub-nodo VYVO:** `..\obsidian\Cerebro2.0\02-Proyectos\BilBildin\Tiendas\VYVO\` — `VYVO.md` (hub), `Alineacion-Con-BilBildin.md` (auditoría a–k contra el contrato), `Integracion-Y-Estado.md`, `Arquitectura-Y-Codigo.md`, `Marca-Y-Catalogo.md`, `Rendimiento-SEO-Y-Pendientes.md`, `Pendientes.md`, `Cuentas-y-Accesos.md` (credenciales: solo ahí, nunca acá), `index.md`, `log.md`.
- **Nodo padre:** `..\obsidian\Cerebro2.0\02-Proyectos\BilBildin\` (hub `BilBildin.md`, `Contrato-De-Alineacion-De-Tiendas.md`, `Pendientes.md`). Lo que exija cambiar el CORE va como pendiente ahí, no se toca desde este repo.
- La constitución del vault es `..\obsidian\Cerebro2.0\CLAUDE.md`; el protocolo completo, `..\obsidian\Cerebro2.0\00-Sistema\Protocolo-Repo-Vault.md`; la plantilla del sub-nodo, `00-Sistema\Plantillas\Plantilla-Tienda.md`.

**Toda sesión que cambie código, esquema, seguridad, decisiones o estado deja el vault al día.** El repo lleva un archivo puente que después se aplica al vault tal cual:

- Archivo: `docs/vault-sync/AAAA-MM-DD-<tema>.md` (uno por sesión o loop; se versiona).
- Un bloque por unidad de trabajo, con este formato exacto:
  ```
  ### <ID> · <título> · commit <hash> · despliegue <estado|n/a>
  **Pendientes.md** — ítems a cerrar e ítems nuevos.
  **Decisiones.md** — decisiones nuevas en ADR corto, o "ninguna".
  **Seguridad.md** — hallazgos que cambian de estado, o "sin cambios".
  **Otras páginas** — qué frase queda desactualizada en qué página y el texto nuevo.
  **log.md** — `## [AAAA-MM-DD] ingest | <título>` + 3-6 viñetas.
  Aplicado en vault: sí | no
  ```
- **Sesión local** (con el vault a mano): aplica el bloque directo a las páginas del sub-nodo, corre `node ..\obsidian\Cerebro2.0\00-Sistema\scripts\lint-vault.mjs 02-Proyectos/BilBildin/Tiendas/VYVO VYVO` desde la raíz del vault y marca `Aplicado en vault: sí` en el mismo commit. **Sesión en la nube:** deja `no`; la próxima sesión local lo aplica al recibir «sincronizá el vault».
- **Una unidad sin su bloque de `vault-sync` no está terminada.** VYVO no tiene `Decisiones.md` ni `Seguridad.md` propios: lo que corresponda a esas líneas va a `Pendientes.md`, a `Integracion-Y-Estado.md` o al hub, y se dice cuál.
- Fin de línea: `.gitattributes` fuerza LF y `core.autocrlf=false`; antes de `git add`, `git diff --stat --ignore-cr-at-eol` tiene que mostrar solo cambios reales. Un commit no puede contener cambios que sean solo CRLF↔LF.
- Nunca se copian credenciales del vault al repo ni al `vault-sync`: se nombran («la llave de servicio»), no se escriben. Un `business_id` sí se documenta.
- Un cambio en el CORE que altere el contrato (una columna, un permiso de `anon`, un código) llega como pendiente a `Tiendas/VYVO/Pendientes.md`; esta tienda lo cierra en su repo y deja su bloque.
