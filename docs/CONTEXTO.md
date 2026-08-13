# Contexto de VYVO Web

Documento de traspaso. Está escrito para alguien que abre este repositorio sin haber
estado en la sesión donde se hicieron los cambios: qué rompe el sitio, qué se midió y
cómo, qué caminos ya se probaron y no funcionaron, y qué queda pendiente.

- **Corte:** 2026-08-09
- **Producción:** `https://www.vyvocr.com`
- **Rama:** `main`

---

## 1. Lo que hay que saber antes de tocar nada

### BilBildin manda sobre el catálogo

`readBilbildinCatalog` lista **todos** los productos `visible` de BilBildin.
`src/data/products.ts` ya no decide qué se publica: solo aporta el texto editorial de las
nueve piezas Origins que lo tienen escrito.

Esto era al revés y causó un bug silencioso: se recorrían los nueve slugs locales y se
descartaba cualquier fila que no coincidiera. Alguien publicaba FORGE en el admin, lo
dejaba visible, y la tienda lo ignoraba **sin error y sin log**. Si volvés a invertir esa
dirección, vuelve el bug.

La única exclusión es el producto de encargo, y es **explícita por slug**. Antes quedaba
fuera por accidente —porque no estaba en el archivo local— y esa protección desapareció
al arreglar el catálogo.

### El canonical no puede salir de un host de despliegue

`src/lib/site.ts` descarta `*.vercel.app`, `*.netlify.app` y `*.pages.dev`. No es
paranoia: `NEXT_PUBLIC_SITE_URL` estuvo apuntando al alias de Vercel y, como de esa
variable salen el canonical, el `robots.txt`, el `sitemap.xml` y las URLs de Open Graph,
el sitio publicado le estaba declarando a Google que la versión buena vivía en otro
dominio. **Todas las señales de ranking iban al lugar equivocado.**

`localhost` sigue siendo un override válido. Cualquier otro host de despliegue se ignora.

### No agregar `loading.tsx` en la raíz de `app/`

Había uno y costaba **0.254 de CLS**, el 98 % del total. Como las rutas públicas son
estáticas, ese archivo creaba un límite de Suspense: el HTML salía con el fallback y el
footer pegado debajo, y al llegar el contenido real el footer se desplazaba miles de
píxeles. El fallback vive solo en `checkout/confirmacion`, que sí es dinámica.

Quitarlo movió el rendimiento de escritorio de 87 a 100 sin tocar una línea de diseño.

### Las imágenes en base64 no pueden entrar al catálogo

BilBildin permite subir la foto embebida como data URI. La de FORGE pesaba 198 KB y
viajaba **tres veces por visita** —una en el JSON-LD y dos en el payload RSC—, sumando
unos 600 KB al HTML. Un data URI **parsea como URL válida**, así que la comprobación de
origen no lo detenía.

`sameOriginImage` ahora las traduce a `/api/media/[slug]`. Hay una prueba que falla si
una vuelve a colarse. Es contención, no solución: lo correcto es que la foto viva como
archivo y BilBildin guarde su URL.

### `robots.txt` debe permitir `/api/media/`

Es donde viven las fotos de producto que el `image` del JSON-LD declara. Con `/api/`
bloqueado de plano, Googlebot no podía leerlas y el resultado enriquecido quedaba sin
imagen. `Allow` gana por ser más específico.

### Las fuentes se verifican con `npm run fonts:check`

Son self-hosted y subseteadas. El símbolo del colón (**₡**, U+20A1) vive en el subset
`latin-ext`: con `@fontsource-variable`, cada precio de la tienda arrastraba 83 KB de
Inter y 15 KB de Sora **por un solo glifo**.

Sora no trae ese glifo en ninguna versión; las cifras se pintan con Inter
(`--font-body`) y el fallback por carácter cubre el resto. El verificador lo contempla en
vez de fallar por algo que la fuente nunca tuvo.

### Los enlaces de navegación llevan `prefetch={false}`

Next precarga el payload RSC de cada ruta enlazada. Con el catálogo dentro, cada uno
pesaba ~155 KB: el header, el footer y el logo sumaban **468 KB descargados de entrada**
—el 43 % del peso total— para páginas que el visitante quizá nunca abre. Los CTA de
intención de compra sí conservan prefetch.

---

## 2. Decisiones que parecen raras y no lo son

| Decisión | Por qué |
|---|---|
| El encargo se cobra contra un producto en **₡0** | El RPC calcula el subtotal desde el precio del catálogo. Un encargo sin precio obligaría a inventar valores para columnas cuyas restricciones son de BilBildin. Se aceptó a cambio de que el encargo caiga en la lista de pedidos donde VYVO ya trabaja. |
| `/rastreo` pide número **y** correo | El número no es un secreto: viaja por WhatsApp y queda en capturas. Con ocho caracteres por día es enumerable, y con solo ese dato alguien leería el nombre, teléfono y dirección de otra persona. |
| Todos los fallos de `/api/rastreo` dicen lo mismo | Distinguir «no existe» de «el correo no coincide» le confirma a quien enumera que el número es válido. |
| La llave de idempotencia la genera el servidor | Si llegara del navegador, un valor manipulado podría colisionar con el pedido de otra persona. |
| Los precios solo entran al JSON-LD en modo `bilbildin` | En modo demo la interfaz rotula los montos como demostrativos. Publicarlos como datos estructurados sería declararle precios falsos a Google. |
| Un producto sin ficha editorial no recibe relato inventado | Queda sin `quote`, sin lista de contenido y con medidas «por confirmar». Preferible a fabricarle una historia de marca a una pieza que nadie redactó. |
| Los preloads de fuente se quedan | Medido: sin ellos el arranque de la imagen del hero mejora (Load Delay 1278 → 0 ms) pero el FCP empeora de 0.9 a 1.7 s y el Speed Index de 1.1 a 1.7 s, con el mismo LCP. |
| No se inventó razón social ni cédula jurídica | El sitio se identifica como VYVOCR. Publicar una cédula equivocada es peor que no publicarla. |

---

## 3. Mediciones y su método

Todo medido con Lighthouse 12 sobre **producción**, no sobre el build local. El build
local no tiene el catálogo de BilBildin y por eso pesa mucho menos: sirve para iterar,
no para concluir.

| Lighthouse móvil, mediana de 3 corridas | |
|---|---|
| Rendimiento | 90 / 91 / 92 |
| Accesibilidad · Prácticas · SEO | 100 · 100 · 100 |
| FCP · LCP · CLS | 1.0 s · 2.8 s · 0 |

| Peso de la página | Antes | Después |
|---|---|---|
| Total | 1077 KB | **383 KB** |
| Peticiones | 48 | **34** |
| HTML sin comprimir | 929 KB | **139 KB** |
| Prefetch («Other») | 489 KB | **23 KB** |
| Fuentes | 179 KB / 4 req | **106 KB / 2 req** |
| JSON-LD | 208 KB | **10 KB** |

**Cómo reproducir la medición del HTML.** Descargar la página y separar el payload RSC
(`self.__next_f.push`), los bloques `application/ld+json` y el markup visible. Fue así
como apareció que 208 KB de «datos estructurados» eran en realidad **una sola foto en
base64**: nueve productos pesaban 0.9 KB cada uno y FORGE pesaba 198.8 KB.

---

## 4. Hipótesis descartadas por medición

Sirve para no repetir caminos. El techo del rendimiento móvil **no** es ninguna de estas:

| Hipótesis | Cómo se descartó |
|---|---|
| La foto del hero se descarta como LCP por estar demasiado ampliada | Se generó un recorte vertical a resolución correcta. Chrome la siguió descartando. |
| La descarta el `filter` del contenedor | Se quitó `brightness()` en una build de prueba. Sin cambio. |
| Falta `preload` o `fetchpriority` | Se agregaron. `lcp-discovery` pasó de 0 a 100 y el LCP no se movió. |
| El `alt=""` la excluye | Se le puso texto descriptivo. Sin cambio. |
| El TTFB de 654 ms es un problema real | Es del modelo simulado de Lighthouse. En producción el sitio responde en ~180 ms con caché HIT. |
| El CSS conviene inlinearlo | 92 KB para un sitio multipágina: se perdería el caché entre rutas. Descartado a propósito. |

**El techo real son los ~175 KB de JavaScript**, dominados por el hero: un componente
cliente con estado, rotación e IntersectionObserver. Pasar de ~92 pide partirlo, y eso ya
es rediseño de ese componente, no optimización de entrega.

---

## 5. Cuánto tarda en verse un cambio del admin

| Superficie | Retraso máximo |
|---|---|
| Landing, catálogo, drops, fichas | ~60 s |
| Sitemap | ~10 min |
| Ficha de un producto borrado | pasa a 404 en ~60 s |

Sale de `revalidate` en `provider.ts` (60 s), `layout.tsx` (60 s) y `sitemap.ts` (600 s).
Vercel sirve la versión anterior mientras revalida: la primera visita tras un cambio
todavía puede ver lo viejo y la siguiente ya ve lo nuevo.

---

## 6. Cómo verificar que algo sigue vivo

```bash
npm run check          # lint + typecheck + 64 pruebas + build
npm run fonts:check    # cobertura de glifos, incluido el ₡
```

```
GET /api/encargos      # { listo: true, producto: { nombre, slug, stock } }
```

Ese endpoint existe porque la única forma de saber si los encargos estaban habilitados
era mandar uno de verdad, y crear un pedido ficticio para validar un checklist es
justamente lo que este proyecto decidió no hacer.

---

## 7. Pendiente

### Con reloj

- **Reindexación en Search Console.** El canonical apuntó a `vyvo-six.vercel.app` durante
  un tiempo; hasta que Google no vuelva a rastrear, las señales siguen yendo al dominio
  equivocado. Es lo único que se degrada con la espera.

### Validación comercial

- **Un pedido y un encargo de prueba reales.** Nunca se creó una orden ficticia durante
  el desarrollo, a propósito. Sin esto, «la tienda funciona» es una inferencia, no un
  hecho comprobado.

### Higiene

- `NEXT_PUBLIC_SITE_URL` en Vercel debería decir `https://www.vyvocr.com`. El código ya
  descarta hosts de despliegue, así que no es un fallo, pero la variable no debe mentir.
- El stock del producto de encargo está en 20 y cada encargo descuenta uno. Subirlo.
- Si se publica un producto con la foto embebida en base64, volver a subirla como archivo.

### Mejoras que dependen de BilBildin

- **Alimentar `order_tracking`.** Hoy el RPC inserta un solo evento al crear el pedido.
  `/rastreo` muestra la línea de tiempo completa, así que cada estado que BilBildin
  registre ahí el cliente lo ve solo y deja de escribir para preguntar.
- Centralizar el límite de intentos: el de `/api/rastreo` es memoria del proceso y en
  serverless cada instancia lleva su cuenta.
- Los efectos de cobrar los encargos contra un producto en ₡0: pedidos de ₡0 en los
  reportes, descuento de stock y `inventory_movements` de tipo `sale`. La alternativa
  limpia está escrita en `supabase/opcional/storefront_custom_requests.sql`, **fuera de
  `migrations/` a propósito** para que `supabase db push` no la aplique sola.

### Legal

Los tres documentos son un punto de partida sólido sobre la Ley 7472 y la Ley 8968,
**pero no son asesoría legal** y conviene que un abogado los revise. Los datos de
identificación salen de `src/lib/legal.ts`: si algún día hay razón social o cédula, se
completan ahí y aparecen solos en los tres.

---

## 8. Mapa rápido

| Necesito… | Está en |
|---|---|
| URL canónica, nombre, descripción | `src/lib/site.ts` |
| Datos legales y de contacto | `src/lib/legal.ts` |
| Catálogo desde BilBildin | `src/lib/bilbildin/provider.ts` · `catalog.ts` |
| Crear pedidos | `src/app/api/orders/route.ts` |
| Encargos personalizados | `src/app/api/encargos/route.ts` · `custom-requests.ts` |
| Consulta de pedido | `src/app/api/rastreo/route.ts` · `orders.ts` |
| Datos estructurados | `src/lib/seo/structured-data.ts` |
| Subsets de fuentes | `scripts/subset-fonts.mjs` |
| Contrato con BilBildin | `docs/integraciones/VYVO.md` |
| Lo que le pedimos a BilBildin | `docs/integraciones/BILBILDIN_REQUERIMIENTOS_VYVO.md` |
