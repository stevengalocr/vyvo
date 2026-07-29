# VYVO Live Commerce Copy Design

**Fecha:** 2026-07-29  
**Estado:** Aprobado para implementación

## Objetivo

La tienda debe comunicar un único estado comercial coherente:

- en producción conectada, catálogo, precios, inventario y pedidos provienen de
  BilBildin;
- en desarrollo o con la integración desactivada, el recorrido sigue siendo
  demostrativo y no persiste pedidos;
- el copy nunca puede mezclar ambos estados en una misma experiencia.

## Causa raíz

El catálogo, carrito y checkout ya consumen el modo de BilBildin, pero varios
Server Components y componentes visuales conservan textos demostrativos
estáticos. La fuente de datos cambió correctamente; el lenguaje comercial no
tenía una frontera equivalente.

## Arquitectura

Se añadirá un view model puro en `src/lib/commerce/experience.ts`. Recibirá
`BilbildinMode` y devolverá el contenido compartido que cambia entre `demo` y
`bilbildin`. No consultará red, navegador, Supabase ni variables de entorno.

Los Server Components resolverán el modo con `getBilbildinMode(process.env)`.
Los Client Components reutilizarán el modo ya entregado por `CartProvider`.
Las decisiones dependientes de inventario continuarán usando
`product.commerce.purchasable` y `availableQuantity`; no se duplicará lógica de
stock en el view model.

## Superficies

- Landing: confianza del hero, tercer paso de compra y primera respuesta FAQ.
- Catálogo: introducción y beneficio de checkout.
- Drops: CTA y explicación de compra según integración e inventario.
- Producto: estado de fuente, precio, disponibilidad y seguridad.
- Personalización: metadata, revisión, consentimiento y confirmación local.
- Carrito y checkout: metadata indexable para el modo correcto.
- Waitlist: respuesta neutral y honesta mientras no exista persistencia.

Los nombres CSS históricos como `demo-badge` no se renombrarán: son detalles
internos de presentación y cambiarlos no aporta comportamiento.

## Contenido en producción

Producción debe hablar de:

- catálogo conectado;
- precios en CRC;
- inventario administrado por BilBildin;
- pedido protegido;
- pago y entrega coordinados directamente con VYVO.

Con stock cero, los productos seguirán visibles con su precio, pero los botones
de compra permanecerán deshabilitados. Ningún texto sugerirá que puede
completarse un pedido hasta que BilBildin informe inventario disponible.

## Seguridad y privacidad

- El frontend nunca recibe costos.
- El cliente nunca envía precio, costo, totales ni `business_id`.
- El brief de personalización permanece local hasta confirmar el pedido.
- La waitlist no afirmará que guarda correos mientras no exista persistencia.
- Preview y desarrollo permanecen en modo demo para evitar pedidos de prueba
  contra producción.

## Pruebas

Una prueba unitaria ejercerá el view model real y comprobará:

- el modo conectado no emite lenguaje de simulación;
- el modo demo declara explícitamente su naturaleza no persistente;
- ambos modos conservan mensajes distintos y completos.

Después se ejecutarán lint, TypeScript, todas las pruebas y build. La producción
se recorrerá en landing, catálogo, ficha, personalización, Drops, carrito y
checkout, comprobando CRC, stock cero, botones deshabilitados, ausencia de
errores y ausencia de copy demostrativo en el modo conectado.

