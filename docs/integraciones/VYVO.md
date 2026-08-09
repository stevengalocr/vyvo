# Alta e integración de VYVO en BilBildin

- Fecha de corte: 2026-07-29 · revisado 2026-08-09
- Repositorio: `stevengalocr/vyvo`
- Proyecto Supabase: `wgicaiphzwppnshagxve`
- Origen canónico: **`https://www.vyvocr.com`** (verificado: el ápex `vyvocr.com`
  responde 308 hacia `www`, y `www` responde 200)
- Alias de despliegue: `https://vyvo-six.vercel.app` — **nunca canónico**

> **Actualización 2026-08-09.** Mientras el dominio estuvo pendiente de DNS y SSL,
> `NEXT_PUBLIC_SITE_URL` quedó apuntando al alias de Vercel. Como de esa variable salen
> el canonical, el `robots.txt`, el `sitemap.xml` y las URLs de Open Graph, el sitio ya
> publicado en `www.vyvocr.com` le estaba declarando a Google que la versión buena vivía
> en `vyvo-six.vercel.app`: todas las señales de ranking iban al dominio equivocado.
> `src/lib/site.ts` ahora ignora cualquier host de despliegue. Queda pendiente corregir
> también el valor de la variable en Vercel.

## Resumen

VYVOCR es la tienda pública. BilBildin administra negocio, catálogo, precio,
stock y pedidos sin aparecer en la interfaz del cliente.

El negocio está aprobado y la integración técnica está preparada para operar.
El catálogo contiene nueve productos visibles en CRC y diez unidades de cada
uno. La única validación comercial pendiente es un pedido controlado con datos
acordados. El dominio `vyvocr.com` no debe declararse activo hasta comprobar
DNS y SSL.

## Negocio

| Campo | Valor |
|---|---|
| `business_id` | `14d10531-d6fc-45a9-9c74-1ff15c657099` |
| Nombre | VYVO |
| Propietario | `vyvocr@gmail.com` |
| Plan | `starter` |
| Estado | `active` y aprobado |
| Moneda / país | CRC / Costa Rica |
| WhatsApp operativo | `+506 7287 4779` |
| Dominio objetivo | `https://vyvocr.com` |
| Producción verificable | `https://vyvo-six.vercel.app` |
| Pagos | SINPE, transferencia, efectivo contra entrega |
| Coordinación | VYVO contacta al cliente después de recibir el pedido |

No se publican números SINPE, IBAN, cuentas ni instrucciones bancarias.

## Identidad

| Uso | Color |
|---|---|
| Negro | `#111111` |
| Violeta | `#6F2CFF` |
| Naranja | `#FF5A1F` |
| Blanco cálido | `#FAFAF7` |

El storefront también usa verde `#79C943` como acento de personajes. El motor
administrativo permanece visualmente separado del sitio público.

## Catálogo e inventario

Todos los productos están visibles y tienen diez unidades. Los costos se
mantienen en BilBildin y no se exponen en el storefront.

| UUID | SKU | Producto | Línea | Precio CRC | Stock |
|---|---|---|---|---:|---:|
| `14d10531-d6fc-45a9-9c74-1ff15c657001` | VYV-MINI-CORE-001 | CORE | Coleccionable | ₡15.000 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657002` | VYV-MINI-RUSH-002 | RUSH | Coleccionable | ₡16.000 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657003` | VYV-MINI-WILD-003 | WILD | Coleccionable | ₡16.500 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657004` | VYV-MINI-ECHO-004 | ECHO | Coleccionable | ₡17.000 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657006` | VYV-MINI-NOVA-006 | NOVA | Coleccionable | ₡18.000 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657005` | VYV-CUSTOM-SHIFT-005 | SHIFT | Personalizable | ₡20.500 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657008` | VYV-SPORT-ARENA-008 | ARENA | Personalizable | ₡22.000 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657009` | VYV-COMP-NEXO-009 | NEXO | Personalizable | ₡23.500 | 10 |
| `14d10531-d6fc-45a9-9c74-1ff15c657010` | VYV-DROP-ABYSS-010 | ABYSS | Drop | ₡25.000 | 10 |

Total: 90 unidades. El seed idempotente está en
`scripts/bilbildin/seed-vyvo.sql`.

## Lectura pública

- BilBildin se habilita únicamente con `BILBILDIN_ENABLED=true`.
- El catálogo usa una clave pública y siempre filtra por negocio y visibilidad.
- Precio, stock, categoría, SKU y estado vienen del motor.
- El costo no se selecciona en el proveedor público.
- La caché del catálogo es de 60 segundos.
- `public.is_storefront_business_active(uuid)` expone solo un booleano.
- Un plazo solo se publica si existe un atributo válido
  `lead_time_days: { min, max }`; nunca se inventa.

## Escritura de pedidos

Funciones:

```sql
public.create_storefront_order_idempotent(
  p_business_id uuid,
  p_idempotency_key uuid,
  p_payload jsonb
)

public.create_storefront_order(
  p_business_id uuid,
  p_payload jsonb
)
```

Controles verificados:

- `SECURITY DEFINER` con `search_path = ''`;
- sin ejecución para `public`, `anon` ni `authenticated`;
- ejecución únicamente para `service_role`;
- negocio activo obligatorio;
- productos acotados por `business_id` y `visible`;
- inventario bloqueado con `FOR UPDATE`;
- precio y costo resueltos en PostgreSQL;
- cliente, pedido, líneas, movimiento y tracking en una transacción;
- idempotencia por `(business_id, idempotency_key)`;
- pago inicial `pending`.

La ruta pública recibe solo cliente, entrega, método de pago, productos,
cantidades y configuraciones. No confía en precio, costo, total o tenant
enviados por el navegador.

## Variables Vercel

```bash
NEXT_PUBLIC_SITE_URL=https://vyvocr.com
NEXT_PUBLIC_SUPABASE_URL=https://wgicaiphzwppnshagxve.supabase.co
NEXT_PUBLIC_VYVO_BUSINESS_ID=14d10531-d6fc-45a9-9c74-1ff15c657099
BILBILDIN_ENABLED=true
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Se permiten temporalmente los nombres legacy indicados en `.env.example`.
Ninguna clave privada debe publicarse en Git o usar `NEXT_PUBLIC_`.

## Completado y verificado

- [x] Negocio y plan aprobados.
- [x] Propietario `vyvocr@gmail.com` asociado.
- [x] Identidad VYVO configurada.
- [x] Nueve productos visibles con precios CRC.
- [x] Diez unidades por producto y 90 en total.
- [x] Pagos coordinados: SINPE, transferencia y efectivo.
- [x] Catálogo público filtrado por tenant.
- [x] Escritura transaccional, idempotente y server-only.
- [x] Referencias de confirmación firmadas.
- [x] Navegación pública limitada a Catálogo, Personalizar y Drops.
- [x] Copy público sin menciones de BilBildin.
- [x] Landing, catálogo, ficha, carrito y checkout responsive.
- [x] Cero waitlists o botones de persistencia simulada.
- [x] 36 pruebas unitarias/de contrato.
- [x] 24 combinaciones responsive sin fallos.
- [x] Recorrido integral de navegador con `failureCount: 0`.

## Pendiente controlado

- [ ] Verificar DNS y SSL de `vyvocr.com`.
- [ ] Confirmar `NEXT_PUBLIC_SITE_URL=https://vyvocr.com` después del DNS.
- [ ] Ejecutar un pedido real con datos acordados.
- [ ] Confirmar que el admin muestra únicamente el tenant VYVO.
- [ ] Confirmar precios y costos finales antes de venta pública.
- [ ] Habilitar protección de contraseñas filtradas en Supabase Auth.

No se creó una orden comercial ficticia durante el desarrollo.

## Requerimientos futuros

Las mejoras no bloqueantes para el equipo de BilBildin están documentadas en
`docs/integraciones/BILBILDIN_REQUERIMIENTOS_VYVO.md`: plazos validados,
galería con alt/orden, materiales y seguridad, estado de Drops, límites de
compra, errores estables, protección contra abuso y revisión de grants.

## Prueba de activación

Con un pedido controlado:

1. confirmar catálogo, precio y stock en CRC;
2. crear el pedido con pago `pending`;
3. verificar precio y costo calculados en PostgreSQL;
4. comprobar movimiento y descuento de inventario;
5. comprobar tracking inicial;
6. repetir con la misma llave y obtener el mismo pedido;
7. rechazar precio, tenant o referencia manipulados;
8. cerrar o anular el pedido según el procedimiento operativo.
