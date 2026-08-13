# VYVO Web

Tienda pública de VYVOCR construida con Next.js 16, React 19 y TypeScript.
Incluye landing, catálogo, fichas, personalización, carrito, checkout y
confirmación. BilBildin funciona como motor administrativo y no aparece en la
navegación ni en el lenguaje dirigido al cliente.

> **¿Vas a retomar esto?** Leé primero [`docs/CONTEXTO.md`](docs/CONTEXTO.md). Trae las
> invariantes que rompen el sitio, las mediciones con su método, las hipótesis ya
> descartadas sobre el techo de rendimiento —para no repetir caminos que no funcionaron—
> y lo que queda pendiente.

## Auditoría — 2026-08-09

Medido sobre `https://www.vyvocr.com`, no sobre el build local.

| Lighthouse móvil | |
|---|---|
| Rendimiento | **90 / 91 / 92** (mediana de 3 corridas) |
| Accesibilidad · Prácticas recomendadas · SEO | **100 · 100 · 100** |
| FCP · LCP · CLS | 1.0 s · 2.8 s · **0** |
| Peso total | **383 KB** en 34 peticiones |

| Verificado en producción | |
|---|---|
| Rutas públicas | 17/17 responden 200 |
| Fichas de producto | Todas las del catálogo responden 200 |
| Canonical | Correcto por ruta; **cero referencias a `vercel.app`** |
| `noindex` | Activo en `/carrito`, `/checkout` y confirmación |
| Datos estructurados | `Organization`, `WebSite`, `ItemList`, `Product`, `BreadcrumbList` — válidos |
| `Product` | Campos requeridos y recomendados completos, con precio real en CRC |
| Sitemap | 10 rutas fijas + una por producto publicado |
| Imágenes base64 | **0 en el HTML** (se sirven por `/api/media/`) |
| Encargos | `GET /api/encargos` responde `listo: true` |
| Suite | 57 pruebas, `npm run check` en verde |

> El catálogo cambia desde el admin sin pasar por un deploy, así que los conteos de
> productos y de URLs del sitemap varían. Se comprobó el **mecanismo**: publicar un
> producto lo hace aparecer y borrarlo lo hace desaparecer, con la ficha pasando a 404.

**Techo actual del rendimiento:** los 175 KB de JavaScript, dominados por el hero
(componente cliente con estado, rotación e IntersectionObserver). Pasar de ~92 pide
partirlo, y eso ya es rediseño de ese componente, no entrega.

### Pendiente fuera del código

- **Pedir reindexación en Search Console.** Es lo único con reloj: el canonical apuntó
  a `vyvo-six.vercel.app` durante un tiempo y, hasta que Google no vuelva a rastrear,
  las señales de ranking siguen yendo al dominio equivocado.
- **Un pedido y un encargo de prueba reales**, para cerrar la validación comercial que
  `docs/integraciones/VYVO.md` lista como pendiente. Nunca se creó una orden ficticia
  durante el desarrollo, a propósito.
- Corregir `NEXT_PUBLIC_SITE_URL` en Vercel a `https://www.vyvocr.com`. El código ya
  descarta hosts de despliegue, así que es higiene, no un fallo.
- Si volvés a publicar un producto con la foto embebida en base64, subila **como
  archivo**: se sirve igual por `/api/media/`, pero el servidor tiene que decodificarla
  en cada revalidación.

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
| Catálogo | Los que estén `visible` en Bilbildin (varía desde el admin) |
| Inventario | Gestionado en Bilbildin |
| Pagos | SINPE, transferencia, efectivo contra entrega |
| Business ID | `14d10531-d6fc-45a9-9c74-1ff15c657099` |
| Alias de despliegue | `https://vyvo-six.vercel.app` — **nunca canónico** |
| Dominio canónico | `https://www.vyvocr.com` (el ápex responde 308 hacia www) |

Dominio verificado y en producción desde el 2026-08-09.

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

## Catálogo: Bilbildin manda

`readBilbildinCatalog` lista **todos los productos visibles de Bilbildin**. El archivo
`src/data/products.ts` ya no decide qué se muestra: solo aporta el texto editorial de las
nueve piezas Origins que lo tienen escrito.

> Antes era al revés — se recorrían los nueve slugs locales y se descartaba cualquier
> fila de Bilbildin que no coincidiera. Alguien publicaba un producto en el admin, lo
> dejaba `visible`, y la tienda lo ignoraba sin avisar. Así desapareció FORGE.

Un producto sin ficha local (`mapStandaloneBilbildinProduct`) se arma desde su propia
fila: nombre, descripción, imagen, precio y stock. La línea sale de la categoría de
Bilbildin (`Drops` → VYVO Drops, `Personalizables` → VYVO Mini Custom, el resto → VYVO
Mini) y el acento visual es estable por slug. **No se le inventa relato de marca:** sin
`quote`, sin lista de contenido. Si nadie lo escribió, no aparece.

El sitemap y `generateStaticParams` de `/producto/[slug]` también salen del catálogo
real, así que un producto nuevo tiene URL indexable sin esperar un deploy.

La única exclusión es el producto de encargo, **por slug y de forma explícita**.

### Cuánto tarda en reflejarse un cambio del admin

| Superficie | Retraso máximo |
|---|---|
| Landing, catálogo, drops, fichas | ~60 s |
| Sitemap | ~10 min |
| Ficha de un producto borrado | pasa a 404 en ~60 s |

Sale de `revalidate` en `provider.ts` (60 s), `layout.tsx` (60 s) y `sitemap.ts`
(600 s). Vercel sirve la versión anterior mientras revalida, así que la primera visita
después del cambio todavía puede ver lo viejo y la siguiente ya ve lo nuevo.

## Seguimiento del pedido

`/rastreo` — la persona consulta el estado de su pedido cuando quiera, sin cuenta y sin
depender del enlace que le apareció al comprar.

```
/rastreo  → POST /api/rastreo { número + correo }
          → valida identidad contra Bilbildin
          → emite la MISMA referencia firmada del checkout
          → /checkout/confirmacion?pedido=<ref>  (estado + línea de tiempo)
```

### Por qué pide correo además del número

El número de pedido **no es un secreto**: viaja por WhatsApp, se comparte en capturas y
queda en el historial del navegador. Tiene ocho caracteres por día —no es trivial de
adivinar, pero tampoco imposible de enumerar—, y con solo ese dato alguien podría leer el
nombre, el teléfono y la dirección de otra persona. El correo actúa como segundo factor y
no se deduce del número.

Por lo mismo, **todos los fallos devuelven el mismo mensaje**. Distinguir entre “no
existe” y “el correo no coincide” le confirmaría a quien enumera que ese número es real.

Hay un freno de intentos por IP (8 cada 10 minutos). Es memoria del proceso: en
serverless cada instancia lleva su cuenta, así que encarece el ataque obvio pero no es
una defensa fuerte. Centralizarlo sigue anotado en el documento de requerimientos.

### La pantalla de estado es una sola

Quien acaba de comprar y quien vuelve un mes después ven exactamente la misma vista,
alcanzada con la misma referencia firmada. No hay dos caminos con reglas distintas para
leer un pedido.

Esa pantalla ahora pinta la **línea de tiempo** (`order_tracking`), que ya se consultaba
desde siempre y nunca se mostraba. Sigue `noindex`: tiene datos personales.

## Documentos legales

Tres páginas en `/terminos`, `/privacidad` y `/politicas`, redactadas sobre la **Ley
7472** (protección al consumidor) y la **Ley 8968** (datos personales) de Costa Rica.
Son Server Components estáticos: cero JavaScript al cliente y cero costo de rendimiento
— `/terminos` mide 94 en Lighthouse móvil con accesibilidad 100 y CLS 0.

> **No son asesoría legal.** Son un punto de partida sólido para una tienda pequeña,
> pero conviene que un abogado los revise antes de tratarlos como vinculantes.

### Reglas al editarlos

- Los datos de identificación y contacto salen de **`src/lib/legal.ts`**, nunca escritos
  a mano dentro de un documento. Si algún día hay razón social o cédula jurídica, se
  completan ahí y aparecen solos en los tres.
- **No inventar datos registrales.** El sitio se identifica con su nombre comercial,
  VYVOCR: publicar una cédula equivocada es peor que no publicarla.
- Al cambiar el contenido, actualizá `LEGAL_UPDATED`. Un documento legal sin fecha no
  sirve para probar qué condiciones regían cuando alguien compró.

### Dónde se aceptan

| Punto | Qué declara |
|---|---|
| Checkout, paso 3 | Términos, políticas de compra y privacidad |
| Formulario de encargo | Además, **que tiene los derechos sobre las fotos que envía** |

La casilla del encargo es la que más protege: sin una declaración explícita de derechos,
un reclamo de un tercero por una foto que subió el cliente cae sobre VYVO. Va sin marcar,
es `required`, y el texto dice exactamente qué se está declarando.

### Lo que cubren, por si hace falta ampliarlo

Renders conceptuales frente a pieza física · precios y errores de precio · formación del
pedido y derecho a rechazarlo · **retracto de 8 días hábiles con la excepción expresa de
las piezas personalizadas** · defectos y garantía · licencia limitada sobre el material
del cliente · contenido prohibido · indemnidad · propiedad intelectual de VYVO ·
limitación de responsabilidad · fuerza mayor · ley aplicable y vía de reclamo ante el
MEIC.

## Encargos personalizados

`/personalizar/encargo` recibe ideas que no encajan en SHIFT, ARENA o NEXO: el cliente
escribe qué quiere, adjunta hasta 5 fotos de referencia y completa el formulario **como
si fuera una compra**. La diferencia es que **no se muestra ningún precio**: el encargo
se cotiza después de revisarlo y se paga contra entrega.

```
formulario → POST /api/encargos (multipart)
           → sube las fotos al bucket privado con service_role
           → RPC create_storefront_order_idempotent (la misma del checkout)
           → pedido normal en Bilbildin, ₡0, pago en efectivo
```

**Va por el flujo de pedidos existente a propósito.** El encargo aparece en la lista de
pedidos donde VYVO ya trabaja todos los días, en vez de en una tabla aparte que nadie
mira. El brief del cliente y las URLs de sus fotos viajan dentro de `configuration`.

### Requisito de configuración

Tiene que existir en Bilbildin un producto con slug **`vyvo-encargo-personalizado`**:

| Campo | Valor |
|---|---|
| Precio | **₡0** — el precio real se define al cotizar |
| Stock | Alto (ej. 9999); cada encargo descuenta una unidad |
| Estado | `visible` |

No aparece en el catálogo público porque `readBilbildinCatalog` **excluye ese slug de
forma explícita** — es la única exclusión. El slug se puede cambiar con
`BILBILDIN_CUSTOM_PRODUCT_SLUG`.

Si el producto no existe, el envío responde **503** con un mensaje claro y no se pierde
nada.

### Cómo comprobar que los encargos están activos

```
GET https://www.vyvocr.com/api/encargos
```

Devuelve `{ listo: true, producto: { nombre, slug, stock } }` cuando todo está en su
lugar, o el motivo concreto cuando no. **No crea ningún pedido** — existe justamente
para no tener que mandar uno ficticio solo para verificar configuración.

La búsqueda del producto acepta el slug exacto **o cualquiera que empiece igual**.
Bilbildin no siempre respeta el slug que se le pide: FORGE quedó guardado como
`vyvo-forge-origins-007`, no `vyvo-forge`. Si hay varios que coinciden, gana el más
corto.

### Efectos conocidos de usar el flujo de pedidos

Son consecuencia de reutilizar `create_storefront_order`, y conviene tenerlos presentes:

- Los encargos aparecen como **pedidos de ₡0** en los reportes de ventas.
- Cada encargo **descuenta stock** del producto de encargo y registra un
  `inventory_movements` de tipo `sale`. Hay que reponer el stock cada tanto.
- Suman al `total_orders` del cliente.

La alternativa sin estos efectos —una tabla propia `storefront_custom_requests`— está
escrita en [`supabase/opcional/`](supabase/opcional/storefront_custom_requests.sql), sin
aplicar. Requiere que BilBildin la exponga en su panel.

### Decisiones que conviene no deshacer

- **La subida pasa por nuestro propio endpoint**, no del navegador a Supabase. Por eso el
  CSP sigue siendo `connect-src 'self'`: el cliente nunca habla con Supabase.
- **El tipo de imagen se decide por la firma binaria**, no por la extensión ni por el
  `Content-Type` que manda el navegador — los dos se falsifican renombrando.
- **Las fotos se suben antes de crear el pedido.** Si falla la subida no queda un pedido
  apuntando a archivos que nunca llegaron.
- **La llave de idempotencia la genera el servidor.** Si llegara del navegador, un valor
  manipulado podría colisionar con el pedido de otra persona.
- El bucket es **privado** y en el pedido va una URL firmada a 90 días: son fotos de
  personas y mascotas reales.

## Rendimiento: dos decisiones que no conviene deshacer

**1. Los enlaces de navegación llevan `prefetch={false}`.** Next precarga el payload
RSC de cada ruta enlazada; con el catálogo dentro, cada uno pesaba ~155 KB. El header,
el footer y el logo sumaban **468 KB descargados de entrada** para páginas que el
visitante quizá nunca abre — el 43 % del peso total. Los CTA de intención de compra sí
conservan prefetch.

**2. Las fuentes son self-hosted y subseteadas** (`scripts/subset-fonts.mjs`). Venían de
`@fontsource-variable`, que declara un @font-face por subset: el símbolo del colón (₡)
cae en `latin-ext`, así que cada precio arrastraba ese subset entero — 83 KB de Inter y
15 KB de Sora por un solo glifo. Ahora es un archivo por familia.

```bash
npm run fonts:check    # verifica cobertura de glifos, incluido el ₡
npm run fonts:build    # regenera los subsets (requiere los TTF originales)
```

El eje `opsz` de Inter va fijo en su valor por defecto — es lo que ya hacía fontsource,
así que el dibujo no cambia, pero dejarlo variable costaba 34 KB. Sora no trae el glifo
del colón en ninguna versión; las cifras se pintan con Inter y el fallback por carácter
cubre el resto.

Los preloads de fuente en el layout están medidos: bajan el FCP de 1.7 s a 0.9 s y el
Speed Index de 1.7 s a 1.1 s. Retrasan un poco el arranque de la imagen del hero, pero
el LCP total no cambia.

**3. Las imágenes en base64 se sirven por `/api/media/[slug]`.** El admin de Bilbildin
permite subir la foto embebida como data URI. La de FORGE pesaba 198 KB y viajaba tres
veces en cada visita —una en el JSON-LD y dos en el payload RSC— sumando unos 600 KB al
HTML. Un data URI parsea como URL válida, así que la comprobación de origen no lo
detenía. Ahora el catálogo lleva una ruta corta, la imagen se descarga aparte, se cachea
y `next/image` la puede convertir a AVIF/WebP.

> Es una contención, no la solución. **Lo correcto es volver a subir esas fotos como
> archivo** para que Bilbildin guarde una URL. Hay una prueba que falla si un data URI
> vuelve a colarse al catálogo.

| | antes | después |
|---|---|---|
| Peso total | 1077 KB | **404 KB** |
| Peticiones | 48 | **33** |
| Fuentes | 179 KB en 4 req | **105 KB en 2 req** |
| Style & Layout | 939 ms | **293 ms** |

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
