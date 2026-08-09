# Requerimientos de VYVO para BilBildin

- Fecha: 2026-07-29 · actualizado 2026-08-09
- Tienda: VYVOCR
- Negocio: `14d10531-d6fc-45a9-9c74-1ff15c657099`

---

## ⚠️ Pendiente de aplicar: encargos personalizados

**Migración:** `supabase/migrations/202608090001_create_vyvo_custom_request.sql`
**Estado:** escrita y probada en el repositorio, **sin aplicar en la base de BilBildin**.

Mientras no se aplique, `/personalizar/encargo` queda publicado pero el envío responde
**503** con un mensaje claro al cliente. Nada se rompe; simplemente no recibe encargos.

### Qué resuelve

`create_storefront_order` calcula el subtotal desde el precio del catálogo y descuenta
inventario. Sirve para piezas que ya existen y ya tienen precio. **Un encargo
personalizado no tiene ninguna de las dos cosas:** el cliente manda su idea, VYVO la
revisa y recién ahí define alcance, precio y plazo.

### Qué agrega — y qué NO toca

Es **estrictamente aditiva**. Hay una prueba automatizada
(`tests/custom-request.test.ts`) que falla si alguien mete un `alter table` sobre
`orders` o cualquier `drop`.

| Objeto nuevo | Para qué |
|---|---|
| `public.storefront_custom_requests` | Tabla de encargos, con `business_id`, contacto, `brief` jsonb, imágenes y estado |
| `public.create_storefront_custom_request(uuid, jsonb)` | La crea de forma atómica; valida negocio activo y reutiliza `store_customers` |
| bucket `vyvo-custom-references` | Imágenes de referencia, **privado**, 5 MB, solo JPG/PNG/WEBP |

**Por qué una tabla propia y no una fila en `orders`:** un encargo sin precio obligaría
a inventar valores para columnas cuyas restricciones (`payment_method`, `status`,
`payment_status`) son de BilBildin. Escribir ahí a ciegas falla en producción y ensucia
los reportes de ventas. Cuando VYVO cotice y el cliente acepte, BilBildin crea el pedido
real por su flujo normal y lo enlaza con `converted_order_id`.

### Postura de seguridad — igual que `create_storefront_order`

- `security definer` con `set search_path = ''`.
- RLS activo y **sin políticas**: nadie llega por PostgREST.
- `revoke` a `public`, `anon` y `authenticated`; `grant execute` solo a `service_role`.
- El bucket es privado: son fotos de personas y mascotas reales. BilBildin las lee con
  URL firmada.

### Ciclo de vida del encargo

`pending_review` → `quoted` → `accepted` | `declined` → `archived`

Campos para que BilBildin cierre el ciclo: `quoted_amount`, `quoted_currency`,
`internal_notes`, `converted_order_id`.

### Cómo aplicarla

```bash
supabase db push
# o pegar el archivo en el SQL editor del proyecto
```

Después de aplicar, verificar con un envío real desde `/personalizar/encargo` y revisar
que la fila aparezca en `storefront_custom_requests`.

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
