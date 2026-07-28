# VYVO Web

Tienda editorial de VYVO construida con Next.js. Incluye landing, catálogo,
nueve fichas de producto, carrito persistente, checkout guiado, confirmación,
personalización, Drops, Club y páginas informativas.

La prioridad actual es una experiencia web sólida. El catálogo funciona con un
proveedor local de demostración y no necesita Supabase, inventario, ERP ni un
servicio de pagos para navegar o compilar.

## Stack

- Next.js 16 App Router
- React 19 y TypeScript estricto
- CSS propio con Sora e Inter locales
- Datos versionados y proveedor de comercio mock
- Zod para validar entradas
- Vercel como destino de despliegue

## Desarrollo local

Requisito recomendado: Node.js 22 LTS.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abrí `http://localhost:3000`.

## Modelo de tienda

`src/data/storefront.ts` construye la versión comercial de los nueve productos.
Cada ficha ya contiene los campos que necesitará una tienda real:

- canal y visibilidad;
- etapa comercial;
- modalidad estándar, bajo pedido o drop;
- precio, moneda e impuestos;
- variantes y SKU;
- referencia de inventario externo;
- disponibilidad y cantidad;
- política de backorder;
- entrega, clase de envío y plazo;
- estado de compra.

El inventario permanece `untracked` y sin cantidades. Los precios actuales se
usan exclusivamente para probar el recorrido y siempre aparecen como
demostrativos. La web nunca los convierte en una promesa comercial.

El contrato está en `src/types/commerce.ts` y la interfaz `CommerceProvider`
permite sustituir el proveedor mock por un motor de inventario, ERP, API propia
o backend sin cambiar las páginas del catálogo.

```text
UI de VYVO
    ↓
CommerceProvider
    ├── mock local (actual)
    ├── motor de inventario (futuro)
    └── servicio de catálogo/backend (futuro)
```

## Formularios en modo demostración

La lista de interés valida origen, tamaño, formato, consentimiento y datos.
Después responde en modo `preview` y explica claramente que el correo no se
guarda. Esto permite probar toda la usabilidad sin crear persistencia falsa.

## Recorrido de compra

1. La landing conduce al catálogo.
2. La ficha permite agregar el producto al carrito.
3. El carrito persiste únicamente `slug`, variante y cantidad en
   `localStorage` versionado.
4. El checkout solicita contacto y dirección solo en memoria.
5. La revisión muestra pedido, entrega y método de pago demo.
6. La confirmación limpia el carrito y genera una referencia local.

No se solicitan datos bancarios, no se guarda información personal y no se
crea una orden real.

## Arquitectura

```text
src/
  app/                    rutas, metadata, API y estados globales
  components/             componentes visuales e interacción
  data/products.ts        contenido de los nueve personajes
  data/storefront.ts      campos comerciales simulados
  types/commerce.ts       contrato para motores futuros
  types/product.ts        contrato editorial del producto
public/
  brand/                  marca web temporal
  landing/                composición hero conceptual
  products/{slug}/        renders conceptuales originales
```

La carpeta `supabase/` conserva un prototipo previo como referencia, pero no
forma parte del runtime ni es necesaria para desarrollar, probar o desplegar
esta versión.

## Rutas

- `/`
- `/catalogo`
- `/colecciones/origins`
- `/producto/[slug]`
- `/carrito`
- `/checkout`
- `/checkout/confirmacion`
- `/personalizar`
- `/drops`
- `/club`
- `/politicas`, `/privacidad`, `/terminos`, `/cuidados`

Origins 007 no tiene producto, ficha ni redirección.

## Seguridad

- CSP, protección de framing, `nosniff`, política de referencia y permisos.
- No existen rutas, formularios ni componentes administrativos en este proyecto.
- El formulario público limita el tamaño, exige JSON, valida el origen y usa
  un honeypot.
- No se aceptan credenciales, pagos, archivos privados ni datos de inventario.
- No hay secretos requeridos en cliente.

## Calidad

```bash
npm run check
npm run verify:browser
```

Las pruebas cubren los nueve productos, SKU y slugs únicos, ausencia de Origins
007, configuración demo, variantes, carrito, totales y referencias de
inventario externo.

## Movimiento y verificación visual

La animación acompaña la exploración de producto sin cambiar la identidad de
tienda infantil. El hero destaca un personaje por vez, las entradas de
contenido ocurren una sola vez y los controles comunican sus cambios de estado
con transiciones breves.

El movimiento funciona como mejora progresiva: el contenido permanece visible
si JavaScript no carga y `prefers-reduced-motion` elimina desplazamientos,
profundidad y revelados pendientes. Los efectos de hover que mueven elementos
solo se aplican a punteros precisos.

`npm run verify:browser` recorre landing, catálogo, fichas, personalización,
Drops, carrito y checkout en escritorio y móvil. También valida menús,
enlaces, consola, respuestas fallidas, overflow horizontal, flujo completo de
compra y la ausencia de revelados pendientes con movimiento reducido.

## Vercel

1. Importar el repositorio.
2. Usar Node.js 22.
3. Definir `NEXT_PUBLIC_SITE_URL` para Preview y Production.
4. Mantener analytics desactivado hasta elegir proveedor y consentimiento.
5. Sustituir el proveedor demo por servicios comerciales cuando sus datos sean
   reales.

## Activos pendientes

- Reemplazar `public/brand/vyvo-mark-placeholder.svg` con el SVG maestro.
- Crear el hero maestro con los nueve personajes; el actual contiene cinco.
- Crear hero móvil, Open Graph, favicon e iconos definitivos.
- Sustituir renders por fotografía real cuando existan prototipos.
- Confirmar información legal, contactos y condiciones comerciales.

## Decisiones actuales

- El carrito y checkout están activos únicamente en modo `demo`.
- Los precios son explícitamente demostrativos y no existe cantidad publicada.
- El checkout no pide tarjeta ni persiste información personal.
- La administración pertenecerá al futuro sistema conectado, no a esta web.
- No hay prueba social sin evidencia.
- La integración de inventario es externa por contrato y se añadirá después.
