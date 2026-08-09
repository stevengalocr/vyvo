# Requerimientos de VYVO para BilBildin

- Fecha: 2026-07-29 · actualizado 2026-08-09
- Tienda: VYVOCR
- Negocio: `14d10531-d6fc-45a9-9c74-1ff15c657099`

---

## ⚠️ Pendiente para activar encargos personalizados

VYVO publicó `/personalizar/encargo`: el cliente cuenta su idea, adjunta fotos y completa
el formulario como si fuera una compra. **El encargo no lleva precio** — se cotiza
después de revisarlo.

Se resolvió **sin funciones nuevas en BilBildin**: el encargo entra por
`create_storefront_order_idempotent`, la misma que usa el checkout, y aparece en la lista
de pedidos normal.

Faltan dos cosas, ninguna es una migración de esquema:

### 1. Crear el producto de encargo

| Campo | Valor |
|---|---|
| Slug | `vyvo-encargo-personalizado` |
| Nombre sugerido | VYVO You · Encargo personalizado |
| Precio | **₡0** — el precio real se define al cotizar |
| Stock | Alto (ej. 9999) |
| Estado | `visible` |

No aparece en la tienda: el storefront solo lista los nueve slugs de Origins.

### 2. Crear el bucket de fotos

`supabase/migrations/202608090001_create_vyvo_reference_bucket.sql`, o a mano desde
Supabase → Storage → New bucket:

- Nombre `vyvo-custom-references`
- **Privado** (son fotos de personas y mascotas reales)
- Límite 5 MB, solo `image/jpeg`, `image/png`, `image/webp`

VYVO sube desde el servidor con `service_role` y guarda en el pedido una **URL firmada a
90 días**, así que BilBildin abre las fotos sin credenciales y el bucket nunca queda
expuesto.

Mientras falte cualquiera de las dos, el envío responde **503** con un mensaje claro al
cliente. Nada se rompe.

### Cómo llega el encargo

Dentro del pedido, en `notes.configurations`, con estos campos en orden:

`Idea del cliente` · `Para quién` · `Ocasión` · `Tamaño que imagina` · `Para cuándo` ·
`Referencia 1..5` (URLs firmadas) · `Estado comercial`

Método de pago **efectivo** y total **₡0**.

### Efectos conocidos

Consecuencia de reutilizar el flujo de pedidos, aceptados a conciencia:

- Los encargos aparecen como **pedidos de ₡0** en los reportes de ventas.
- Cada encargo **descuenta stock** del producto de encargo y deja un
  `inventory_movements` de tipo `sale`. Hay que reponer stock cada tanto.
- Suman al `total_orders` del cliente.

### Alternativa limpia, si algún día molesta

`supabase/opcional/storefront_custom_requests.sql` — tabla y función propias, sin pedidos
de ₡0 ni stock fantasma. **No está en `migrations/` a propósito**, para que
`supabase db push` no la aplique sola. Requiere que BilBildin exponga esa tabla en su
panel; si no, los encargos quedan donde nadie los ve.

---

## Estado actual

La integración necesaria para operar la tienda está completa:

- negocio `active` en plan `starter`;
- nueve productos visibles en CRC;
- diez unidades por producto, 90 en total;
- catálogo, precios y stock consumidos desde BilBildin;
- pedidos idempotentes creados desde servidor;
- SINPE, transferencia y efectivo contra entrega;
- pago y entrega coordinados de forma privada por VYVO;
- BilBildin permanece fuera del lenguaje y de la navegación pública.

Los siguientes puntos son mejoras no bloqueantes. Cuando un dato validado no
existe, VYVO muestra una explicación honesta como “por coordinar” y no inventa
valores.

## Contrato de producto solicitado

1. `lead_time_days`
   - Objeto `{ min: integer, max: integer }`.
   - `0 <= min <= max <= 365`.
   - Debe representar un plazo aprobado, no una estimación del storefront.

2. Galería pública
   - Lista ordenada de imágenes publicables.
   - Cada elemento necesita URL, texto alternativo y posición.
   - Conviene distinguir render conceptual, fotografía real y detalle.

3. Materiales y seguridad
   - Material o acabado validado.
   - Edad mínima y advertencias de uso.
   - Estado de validación para evitar publicar datos preliminares como hechos.

4. Estado comercial de Drops
   - `available`, `sold_out`, `scheduled` o equivalente documentado.
   - Fecha solo cuando esté aprobada y exista una fuente operativa.
   - Límite por cliente o por pedido cuando aplique.

5. Límite máximo de compra
   - Entero por variante o producto.
   - La tienda conserva un límite defensivo local, pero BilBildin debe ser la
     fuente final y validarlo nuevamente en la transacción.

## Errores públicos estables

El endpoint transaccional debería mantener códigos identificables sin exponer
detalles internos:

- `store_not_active`;
- `product_unavailable`;
- `insufficient_stock`;
- `invalid_product`;
- `temporarily_unavailable`.

VYVO traduce disponibilidad a `409`, fallos reintentables a `503` y errores
internos a `500`, siempre con mensajes públicos propios.

## Plataforma y seguridad

- Centralizar protección contra abuso y límites de frecuencia para pedidos.
- Revisar grants heredados del proyecto junto con RLS, sin afectar otros
  negocios.
- Mantener funciones de escritura fuera de `anon` y `authenticated`.
- Conservar idempotencia por `(business_id, idempotency_key)`.
- Habilitar protección de contraseñas filtradas en Supabase Auth.
- Registrar auditoría de cambios de precio, costo, inventario y estado.
- Asegurar que el administrador de VYVO solo vea su tenant.

## Dominio y marca

- Dominio objetivo: `https://vyvocr.com`.
- URL Vercel verificable mientras se completa el dominio:
  `https://vyvo-six.vercel.app`.
- Colores: `#111111`, `#6F2CFF`, `#FF5A1F`, `#FAFAF7`.
- El dominio debe declararse activo únicamente después de validar DNS y SSL.

## Prueba coordinada pendiente

La última validación debe realizarse con datos reales acordados:

1. crear un pedido controlado;
2. confirmar estado `pending`;
3. validar precio, costo y líneas calculados en PostgreSQL;
4. confirmar descuento de inventario y movimiento auditable;
5. confirmar tracking inicial;
6. comprobar que un reintento devuelve el mismo pedido;
7. anular o cerrar el pedido según el procedimiento de BilBildin.

No se debe crear un cliente u orden ficticia solo para completar un checklist.
