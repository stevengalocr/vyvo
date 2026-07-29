# Alta e integración de VYVO en BilBildin

Fecha de preparación: 2026-07-29  
Repositorio de tienda: `stevengalocr/vyvo`  
Producción temporal: `https://vyvo-six.vercel.app`

Dominio objetivo: `https://vyvocr.com` (pendiente de compra y conexión DNS)
Proyecto Supabase BilBildin: `wgicaiphzwppnshagxve`

## Negocio

| Campo | Valor |
|---|---|
| `business_id` | `14d10531-d6fc-45a9-9c74-1ff15c657099` |
| Nombre | VYVO |
| Correo propietario | `vyvocr@gmail.com` |
| Plan | `starter` |
| Estado de cuenta | `active` (observado después del alta inicial `pending`) |
| Estado de plan | `active` |
| Dominio objetivo | `vyvocr.com` (pendiente de compra y DNS) |
| Moneda / país | CRC / Costa Rica |
| WhatsApp operativo | `+506 7287 4779` |
| Pagos | SINPE, transferencia, efectivo contra entrega |
| Coordinación | VYVO contacta al cliente después de recibir el pedido |

No se almacenaron números SINPE, IBAN, cuentas ni instrucciones bancarias
públicas.

## Catálogo cargado

Todos los registros están `visible` y con stock inicial `0`.

| UUID | SKU | Producto | Categoría | Precio CRC | Costo CRC |
|---|---|---|---|---:|---:|
| `14d10531-d6fc-45a9-9c74-1ff15c657001` | VYV-MINI-CORE-001 | CORE | Collectibles | ₡15.000 | ₡7.000 |
| `14d10531-d6fc-45a9-9c74-1ff15c657002` | VYV-MINI-RUSH-002 | RUSH | Collectibles | ₡16.000 | ₡7.100 |
| `14d10531-d6fc-45a9-9c74-1ff15c657003` | VYV-MINI-WILD-003 | WILD | Collectibles | ₡16.500 | ₡7.200 |
| `14d10531-d6fc-45a9-9c74-1ff15c657004` | VYV-MINI-ECHO-004 | ECHO | Collectibles | ₡17.000 | ₡7.200 |
| `14d10531-d6fc-45a9-9c74-1ff15c657006` | VYV-MINI-NOVA-006 | NOVA | Collectibles | ₡18.000 | ₡7.400 |
| `14d10531-d6fc-45a9-9c74-1ff15c657005` | VYV-CUSTOM-SHIFT-005 | SHIFT | Personalizables | ₡20.500 | ₡7.800 |
| `14d10531-d6fc-45a9-9c74-1ff15c657008` | VYV-SPORT-ARENA-008 | ARENA | Personalizables | ₡22.000 | ₡7.800 |
| `14d10531-d6fc-45a9-9c74-1ff15c657009` | VYV-COMP-NEXO-009 | NEXO | Personalizables | ₡23.500 | ₡8.000 |
| `14d10531-d6fc-45a9-9c74-1ff15c657010` | VYV-DROP-ABYSS-010 | ABYSS | Drops | ₡25.000 | ₡8.000 |

El seed idempotente y auditable está en
`scripts/bilbildin/seed-vyvo.sql`.

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
BILBILDIN_ENABLED=false
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

- [ ] Revisar el negocio y sus nueve productos.
- [ ] Confirmar precios/costos preliminares.
- [ ] Crear o asociar el administrador `vyvocr@gmail.com`.
- [ ] Definir fecha/ciclo del plan si corresponde.
- [ ] Cargar stock real en los productos habilitados.
- [x] `account_status` figura `active` en la verificación de base de datos.
- [ ] Confirmar que el admin muestra VYVO aislado de otros tenants.
- [ ] Avisar al equipo VYVO para activar `BILBILDIN_ENABLED=true`.
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

No se ejecutó una compra real porque el stock inicial es cero. Esa prueba debe
realizarse después de cargar inventario y confirmar el acceso administrativo.
