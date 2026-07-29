# Alta e integración de VYVO en BilBildin

Fecha de preparación: 2026-07-29  
Repositorio de tienda: `stevengalocr/vyvo`  
Producción temporal: `https://vyvo-six.vercel.app`

Dominio objetivo: `https://vyvocr.com` (pendiente de compra y conexión DNS)
Proyecto Supabase BilBildin: `wgicaiphzwppnshagxve`

Estado de integración: negocio aprobado y producción conectada a BilBildin el
2026-07-29. El catálogo real, la configuración de marca y el inventario están
activos; la tienda puede preparar pedidos y VYVO coordina pago y entrega.

## Negocio

| Campo | Valor |
|---|---|
| `business_id` | `14d10531-d6fc-45a9-9c74-1ff15c657099` |
| Nombre | VYVO |
| Correo propietario | `vyvocr@gmail.com` |
| Plan | `starter` |
| Estado de cuenta | `active` y aprobado |
| Estado de plan | `active` |
| Dominio objetivo | `vyvocr.com` (pendiente de compra y DNS) |
| Moneda / país | CRC / Costa Rica |
| WhatsApp operativo | `+506 7287 4779` |
| Administrador | `vyvocr@gmail.com`, asociado y confirmado |
| Colores | `#111111`, `#6F2CFF`, `#FAFAF7`, `#FF5A1F` |
| URL de tienda | `https://vyvocr.com` |
| Pagos | SINPE, transferencia, efectivo contra entrega |
| Coordinación | VYVO contacta al cliente después de recibir el pedido |

No se almacenaron números SINPE, IBAN, cuentas ni instrucciones bancarias
públicas.

## Catálogo e inventario

Todos los registros están `visible` y tienen diez unidades disponibles. El
inventario total verificado es de 90 unidades.

| UUID | SKU | Producto | Categoría | Precio CRC | Costo CRC | Stock |
|---|---|---|---|---:|---:|---:|
| `14d10531-d6fc-45a9-9c74-1ff15c657001` | VYV-MINI-CORE-001 | CORE | Collectibles | ₡15.000 | ₡7.000 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657002` | VYV-MINI-RUSH-002 | RUSH | Collectibles | ₡16.000 | ₡7.100 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657003` | VYV-MINI-WILD-003 | WILD | Collectibles | ₡16.500 | ₡7.200 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657004` | VYV-MINI-ECHO-004 | ECHO | Collectibles | ₡17.000 | ₡7.200 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657006` | VYV-MINI-NOVA-006 | NOVA | Collectibles | ₡18.000 | ₡7.400 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657005` | VYV-CUSTOM-SHIFT-005 | SHIFT | Personalizables | ₡20.500 | ₡7.800 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657008` | VYV-SPORT-ARENA-008 | ARENA | Personalizables | ₡22.000 | ₡7.800 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657009` | VYV-COMP-NEXO-009 | NEXO | Personalizables | ₡23.500 | ₡8.000 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657010` | VYV-DROP-ABYSS-010 | ABYSS | Drops | ₡25.000 | ₡8.000 | 10 |

El seed idempotente y auditable está en
`scripts/bilbildin/seed-vyvo.sql`.

La carga del 2026-07-29 actualizó ocho productos de cero a diez y registró ocho
movimientos `restock`. ABYSS ya estaba en diez y no recibió un movimiento
artificial.

## Escritura de pedidos

Se aplicó la migración `create_storefront_order`, que crea:

```sql
public.create_storefront_order(p_business_id uuid, p_payload jsonb)
```

Propiedades verificadas:

- `SECURITY DEFINER`;
- `search_path = ''`;
- sin ejecución para `public`, `anon` ni `authenticated`;
- ejecución únicamente para `service_role`;
- cuenta activa obligatoria;
- productos filtrados por `business_id` y `visible`;
- inventario bloqueado con `FOR UPDATE`;
- precios y costos resueltos en PostgreSQL;
- cliente, pedido, items, movimiento y tracking en una transacción.

La migración fuente está en
`supabase/migrations/202607290001_create_vyvo_storefront_order.sql`.

La lectura pública valida la activación mediante
`public.is_storefront_business_active(uuid)`, que devuelve únicamente un
booleano y no expone campos del negocio. Su fuente está en
`supabase/migrations/202607290002_add_storefront_status_check.sql`.

Los reintentos usan
`public.create_storefront_order_idempotent(uuid, uuid, jsonb)` y una tabla
server-only con llave primaria `(business_id, idempotency_key)`. Las solicitudes
con la misma llave se serializan y devuelven el pedido original.

## Variables Vercel

Requeridas:

```bash
NEXT_PUBLIC_SITE_URL=https://vyvo-six.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://wgicaiphzwppnshagxve.supabase.co
NEXT_PUBLIC_VYVO_BUSINESS_ID=14d10531-d6fc-45a9-9c74-1ff15c657099
BILBILDIN_ENABLED=true
```

Usar uno de cada par, prefiriendo los nombres nuevos:

```bash
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# o NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SECRET_KEY=
# o SUPABASE_SERVICE_ROLE_KEY=
```

Ninguna clave privada debe publicarse en Git, documentación o variables
`NEXT_PUBLIC_*`.

## Checklist para el equipo BilBildin

- [x] Aprobar el negocio y revisar sus nueve productos.
- [ ] Confirmar precios/costos preliminares.
- [x] Crear o asociar el administrador `vyvocr@gmail.com`.
- [ ] Definir fecha/ciclo del plan si corresponde.
- [x] Cargar stock: diez unidades por producto, 90 en total.
- [x] `account_status` figura `active` en la verificación de base de datos.
- [ ] Confirmar que el admin muestra VYVO aislado de otros tenants.
- [x] Activar `BILBILDIN_ENABLED=true` en producción.
- [ ] Comprar `vyvocr.com`, asociarlo al proyecto Vercel `vyvo` y validar DNS/SSL.
- [ ] Cambiar `NEXT_PUBLIC_SITE_URL` a `https://vyvocr.com` y redesplegar.
- [ ] Habilitar protección de contraseñas filtradas en Supabase Auth.

## Pruebas posteriores a la activación

- catálogo visible en CRC;
- actualización de precio/stock reflejada en menos de 60 segundos;
- productos sin stock no comprables;
- pedido real con pago `pending`;
- precio y costo correctos en `orders` y `order_items`;
- descuento y movimiento de inventario;
- evento inicial de tracking;
- confirmación accesible solo con referencia firmada;
- rechazo de precio, tenant o referencia manipulados.

La base de datos quedó verificada con los nueve productos visibles, stock diez
por producto, 90 unidades totales y ocho movimientos auditados. El usuario de
administración coincide exactamente con `owner_email`, está confirmado, y los
otros tres negocios conservaron sus huellas de configuración e inventario.

No se ejecutó una compra real durante esta configuración para evitar crear
clientes u órdenes falsas. Esa prueba debe realizarse con datos controlados y
acordados.
