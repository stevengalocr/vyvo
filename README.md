# VYVO Web

Tienda VYVO construida con Next.js 16, React 19 y TypeScript. Incluye landing,
catálogo, fichas, personalización, carrito, checkout y confirmación de pedido.
La administración permanece en BilBildin.

## Modos de operación

- `BILBILDIN_ENABLED=false`: catálogo y compra demostrativos, sin persistencia.
- `BILBILDIN_ENABLED=true`: catálogo, precios, stock, clientes y pedidos reales
  desde BilBildin.

El modo real falla de forma segura si faltan variables, el negocio no está
activo o BilBildin no devuelve productos visibles. Nunca mezcla datos demo con
pedidos reales.

## Desarrollo

Requisito: Node.js `>=20.9.0`.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abrí `http://localhost:3000`.

## Variables de entorno

Configuración recomendada:

```bash
NEXT_PUBLIC_SITE_URL=https://vyvo-six.vercel.app
BILBILDIN_ENABLED=false
NEXT_PUBLIC_SUPABASE_URL=https://wgicaiphzwppnshagxve.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_VYVO_BUSINESS_ID=14d10531-d6fc-45a9-9c74-1ff15c657099
SUPABASE_SECRET_KEY=
```

También se aceptan temporalmente:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_BUSINESS_ID=
```

Las claves `secret` o `service_role` son exclusivamente de servidor y nunca
deben usar el prefijo `NEXT_PUBLIC_`.

## Integración BilBildin

- Proyecto Supabase: `wgicaiphzwppnshagxve`
- Negocio VYVO: `14d10531-d6fc-45a9-9c74-1ff15c657099`
- Estado observado y aprobado: `active`
- Plan: `starter`
- Producción: `BILBILDIN_ENABLED=true`
- Producción temporal: `https://vyvo-six.vercel.app`
- Dominio objetivo: `vyvocr.com` (pendiente de compra y conexión DNS)
- Moneda: CRC
- Catálogo conectado: 9 productos visibles en CRC, stock actual 0
- Pagos: SINPE, transferencia y efectivo contra entrega

El catálogo se consulta con clave pública, siempre filtrado por negocio y
estado visible, con caché de 60 segundos. El costo nunca se selecciona en el
proveedor público.

Los pedidos se crean mediante
`public.create_storefront_order_idempotent(uuid, uuid, jsonb)`, que serializa
reintentos y delega la transacción a
`public.create_storefront_order(uuid, jsonb)`. El flujo:

- solo puede ejecutarla `service_role`;
- exige un negocio activo;
- bloquea y valida inventario;
- recalcula precios y costos dentro de PostgreSQL;
- crea cliente, pedido, líneas, movimientos y tracking en una transacción;
- devuelve el pedido original cuando se repite la misma llave de idempotencia;
- mantiene el pago pendiente para coordinación privada con VYVO.

La confirmación usa una referencia HMAC firmada. Conocer o modificar un UUID no
permite consultar pedidos ajenos.

## Estado de activación

- [x] Negocio y plan aprobados en BilBildin.
- [x] Variables de Supabase y Business ID verificadas en Vercel Production.
- [x] `BILBILDIN_ENABLED=true` en Production.
- [x] Catálogo real validado: nueve productos visibles y precios en CRC.
- [x] Preview y desarrollo conservan el modo demo.
- [ ] Cargar inventario real en BilBildin.
- [ ] Ejecutar un pedido transaccional controlado después de cargar stock.

Con inventario cero la producción permanece conectada, pero falla de forma
segura: muestra el catálogo real y deshabilita todas las acciones de compra.

## Seguridad

- CSP, anti-framing, `nosniff`, políticas de referencia y permisos.
- Sin rutas administrativas en esta aplicación.
- Cliente privilegiado marcado `server-only`.
- Validación Zod estricta, límite de cuerpo y protección de origen.
- El navegador no envía precios, costos, totales ni `business_id`.
- Todas las lecturas privadas usan `order.id + business_id`.
- Las referencias personales de configuraciones se guardan únicamente dentro
  del pedido y no se publican en catálogo.

## Calidad

```bash
npm run check
npm run verify:browser
```

Las 23 pruebas cubren configuración, catálogo CRC, aislamiento del seed,
carrito, stock cero, copy por modo, validación de checkout, referencias firmadas
y permisos esperados de la función transaccional.

## Documentación

- Handoff operativo: `docs/integraciones/VYVO.md`
- Seed auditable: `scripts/bilbildin/seed-vyvo.sql`
- Migración de pedidos:
  `supabase/migrations/202607290001_create_vyvo_storefront_order.sql`
- Diseño:
  `docs/superpowers/specs/2026-07-29-vyvo-bilbildin-integration-design.md`
