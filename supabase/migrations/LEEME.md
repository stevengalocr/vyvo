# Estas migraciones son historia, no la fuente

Los archivos de esta carpeta son el registro de cómo VYVO creó sus funciones en la base
de Bilbildin en julio y agosto de 2026. **Ya no describen lo que corre en producción.**

Desde el 19 de septiembre de 2026, `create_storefront_order` y
`create_storefront_order_idempotent` conservan su firma y su resultado, pero no escriben
por su cuenta: delegan en `crear_pedido`, la única función de Bilbildin que crea pedidos
para todas las tiendas. La fuente vigente está en el repo de Bilbildin:

- `supabase/migrations/20260919_crear_pedido.sql`
- `supabase/migrations/20260919_puertas_viejas_delegan.sql`

Por qué: cada tienda tenía su propia copia de «crear pedido». Cuando Bilbildin hizo
obligatorio `business_id` en `order_items` y `order_tracking` (18 de agosto), la copia de
VYVO dejó de funcionar y **la tienda pasó un mes sin poder recibir pedidos** sin que nada
avisara. Con un solo camino, certificado en Bilbildin, eso no se repite por esta vía.

Lo que VYVO ganó sin cambiar su código: el pedido ahora congela el correo y el teléfono
del comprador (`orders.buyer_email`, `orders.buyer_phone`) y respeta el tope por pedido y
el estado comercial de cada pieza.

No volver a aplicar estos archivos sobre la base: pisarían las funciones vigentes.
