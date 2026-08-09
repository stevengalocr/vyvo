# VYVO Web

Tienda pública de VYVOCR construida con Next.js 16, React 19 y TypeScript.
Incluye landing, catálogo, fichas, personalización, carrito, checkout y
confirmación. BilBildin funciona como motor administrativo y no aparece en la
navegación ni en el lenguaje dirigido al cliente.

## Arquitectura

```text
Cliente VYVOCR
  → Next.js obtiene catálogo visible por negocio
  → BilBildin resuelve precio, stock, estado y SKU
  → el carrito conserva solo producto, variante, cantidad y configuración
  → la API de servidor valida origen y payload
  → PostgreSQL recalcula valores y crea el pedido en una transacción
  → VYVO coordina pago y entrega con el cliente
```

La aplicación no contiene un panel administrativo. No acepta precios, costos,
totales ni `business_id` desde el navegador.

## Modos de operación

- `BILBILDIN_ENABLED=false`: catálogo y recorrido demostrativos, sin cobro ni
  persistencia comercial.
- `BILBILDIN_ENABLED=true`: catálogo, precios, stock, clientes y pedidos reales
  desde BilBildin.

El modo conectado falla de forma segura si falta configuración, el negocio no
está activo o el catálogo público no es válido. Nunca mezcla datos demo con un
pedido real.

## Desarrollo

Requisito: Node.js `>=20.9.0`.

```bash
npm install
copy .env.example .env.local
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Variables de entorno

> ⚠️ **`NEXT_PUBLIC_SITE_URL` no puede apuntar a un dominio de despliegue.** Estuvo
> configurada como `https://vyvo-six.vercel.app` y, como de ahí salen el canonical, el
> `robots.txt`, el `sitemap.xml` y las URLs de Open Graph, el sitio publicado en
> `www.vyvocr.com` le estaba declarando a Google que la versión buena vivía en otro
> dominio. `src/lib/site.ts` ahora descarta cualquier host `*.vercel.app`, `*.netlify.app`
> o `*.pages.dev` y usa el dominio de producción; aun así, conviene dejar la variable
> correcta en Vercel. `localhost` sigue siendo un override válido para desarrollo.

```bash
NEXT_PUBLIC_SITE_URL=https://www.vyvocr.com
BILBILDIN_ENABLED=true
NEXT_PUBLIC_SUPABASE_URL=https://wgicaiphzwppnshagxve.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_VYVO_BUSINESS_ID=14d10531-d6fc-45a9-9c74-1ff15c657099
SUPABASE_SECRET_KEY=
```

También se aceptan temporalmente
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y
`NEXT_PUBLIC_BUSINESS_ID`. Las claves privadas son exclusivamente de servidor
y nunca deben usar `NEXT_PUBLIC_`.

## Estado conectado

| Campo | Estado |
|---|---|
| Negocio | `active` |
| Plan | `starter` |
| Propietario | `vyvocr@gmail.com` |
| Moneda | CRC |
| Catálogo | 9 productos visibles |
| Inventario | 10 por producto, 90 total |
| Pagos | SINPE, transferencia, efectivo contra entrega |
| Business ID | `14d10531-d6fc-45a9-9c74-1ff15c657099` |
| Vercel | `https://vyvo-six.vercel.app` |
| Dominio objetivo | `https://vyvocr.com` |

El dominio personalizado solo se considera activo cuando DNS y SSL se hayan
verificado externamente.

## Integración de pedidos

La escritura usa
`public.create_storefront_order_idempotent(uuid, uuid, jsonb)`, que serializa
reintentos y delega en
`public.create_storefront_order(uuid, jsonb)`.

La transacción:

- solo puede ejecutarla `service_role`;
- exige un negocio activo;
- bloquea y valida inventario;
- recalcula precio y costo dentro de PostgreSQL;
- crea cliente, pedido, líneas, movimientos y tracking;
- devuelve el pedido original ante la misma llave de idempotencia;
- mantiene el pago pendiente para coordinación privada.

La referencia de confirmación está firmada con HMAC. Un UUID conocido o
alterado no autoriza la lectura de pedidos ajenos.

## Seguridad

- CSP, anti-framing, `nosniff`, Referrer Policy y Permissions Policy.
- Sin rutas administrativas en el storefront.
- Cliente privilegiado marcado `server-only`.
- Zod estricto, límite de cuerpo y validación de origen.
- Lecturas privadas siempre acotadas por `order.id + business_id`.
- Errores del proveedor clasificados sin filtrar detalles internos.
- Configuraciones personales almacenadas solo dentro del pedido.
- Sin números SINPE, IBAN ni instrucciones bancarias públicas.

## SEO y Core Web Vitals

Medido con Lighthouse sobre el build de producción:

| | Rendimiento | Accesibilidad | SEO |
|---|---|---|---|
| Escritorio | 100 | 100 | 100 |
| Móvil | 96 | 100 | 100 |

Tres piezas sostienen ese resultado y conviene no romperlas:

**1. No agregar `loading.tsx` en la raíz de `app/`.** Había uno y costaba **0.254 de CLS**
— el 98 % del total. Como todas las rutas públicas son estáticas, ese archivo creaba un
límite de Suspense: el HTML salía con el fallback y el footer pegado debajo, y al llegar
el contenido real el footer se desplazaba miles de píxeles. El fallback ahora vive solo en
`checkout/confirmacion`, que sí es dinámica. Con eso el rendimiento de escritorio pasó de
87 a 100 sin tocar una línea de diseño.

**2. El dominio canónico se resuelve en `src/lib/site.ts`.** Ver la advertencia en
variables de entorno: un host de despliegue nunca puede ser canónico.

**3. Datos estructurados en `src/lib/seo/structured-data.ts`.** El sitio no tenía ninguno.
Se emite un solo `@graph` por página con `Organization` y `WebSite` desde el layout, más
`ItemList` en home y catálogo, y `Product` + `BreadcrumbList` en cada ficha.

> **Los precios solo entran al grafo en modo `bilbildin`.** En modo demo la interfaz
> rotula los montos como demostrativos; publicarlos como datos estructurados sería
> declararle a Google precios que no son reales.

## Analítica

Vercel Web Analytics está integrado globalmente en el layout de Next.js para
medir visitas y páginas vistas en los despliegues de Vercel. No se registran
eventos personalizados ni se envían campos del checkout, datos de contacto o
detalles de pedidos.

La recopilación se activa desde **Vercel → Project → Analytics** y no requiere
variables de entorno adicionales.

## Calidad

```bash
npm run check
npm run verify:content
npm run verify:responsive
npm run verify:browser
```

La suite contiene 36 pruebas unitarias/de contrato. La matriz responsive cubre
24 combinaciones de cuatro rutas críticas en seis tamaños, de 375 a 1440 px.
El recorrido integral audita 23 rutas y completa personalización, carrito y
checkout demo en escritorio y móvil sin crear pedidos comerciales.

## Documentación

- Estado operativo: `docs/integraciones/VYVO.md`
- Requerimientos para BilBildin:
  `docs/integraciones/BILBILDIN_REQUERIMIENTOS_VYVO.md`
- Seed auditable: `scripts/bilbildin/seed-vyvo.sql`
- Migraciones: `supabase/migrations/`
- Diseño de refinamiento:
  `docs/superpowers/specs/2026-07-29-vyvo-storefront-production-audit-design.md`
- Plan ejecutado:
  `docs/superpowers/plans/2026-07-29-vyvo-storefront-production-refinement.md`
