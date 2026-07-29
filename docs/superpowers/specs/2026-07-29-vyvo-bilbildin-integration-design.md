# VYVO + Bilbildin — Diseño de integración y activación

Fecha: 2026-07-29  
Estado: aprobado para especificación; pendiente de implementación  
Repositorio de tienda: `stevengalocr/vyvo`  
Backend operativo: Supabase `BILBILDIN` (`wgicaiphzwppnshagxve`)

## 1. Objetivo

Conectar la tienda VYVO con Bilbildin sin alterar su diseño ni incluir un panel
administrativo en este repositorio. Bilbildin será la fuente única de catálogo,
precios, costos, stock, clientes, pedidos y tracking cuando la integración se
active. Antes de esa activación, VYVO seguirá disponible en modo demostrativo.

La activación debe requerir únicamente:

1. que Bilbildin cree el usuario administrador;
2. que el equipo revise y active el negocio;
3. que se configuren las claves de Supabase en Vercel;
4. que se cambie `BILBILDIN_ENABLED` a `true`;
5. que se asocie `vyvocr.com` al proyecto Vercel.

## 2. Datos de alta

| Campo | Valor |
|---|---|
| Negocio | VYVO |
| Correo del dueño | `vyvocr@gmail.com` |
| Plan | `starter` |
| Estado inicial | `pending` |
| Dominio | `vyvocr.com` |
| Moneda | `CRC` |
| Idioma | `es` |
| Zona horaria | `America/Costa_Rica` |
| WhatsApp | `+506 7287 4779` |
| Métodos de pago | SINPE, transferencia y efectivo |
| Coordinación de pago | Posterior al pedido por WhatsApp |

No se publicarán números SINPE, cuentas bancarias, IBAN ni instrucciones
financieras. El cliente seleccionará el método, el pedido quedará con pago
pendiente y VYVO coordinará los datos sensibles de forma privada.

## 3. Estrategia de activación

### Modo demostrativo

`BILBILDIN_ENABLED=false`

- Usa el catálogo local actual.
- Conserva el carrito y checkout de demostración.
- No crea pedidos ni clientes reales.
- Permite desplegar y revisar `vyvocr.com` antes del alta final.

### Modo Bilbildin

`BILBILDIN_ENABLED=true`

- El catálogo se lee desde Supabase con caché de 60 segundos.
- Los productos se filtran siempre por el `business_id` configurado y
  `status = 'visible'`.
- El carrito permanece local en el navegador.
- El checkout crea pedidos reales desde código exclusivamente de servidor.
- Confirmación y tracking leen el pedido real filtrando por pedido y negocio.
- El checkout se cierra de forma segura si la cuenta no está activa, faltan
  variables, el producto dejó de estar disponible o no hay stock.

No habrá una mezcla de catálogo local y pedidos reales. Cada solicitud usará un
solo modo de principio a fin.

## 4. Arquitectura

```text
VYVO / Next.js 16 en Vercel
  |
  |-- StorefrontProvider
  |     |-- MockStorefrontProvider        (demo)
  |     `-- BilbildinStorefrontProvider   (activo)
  |
  |-- carrito local versionado
  |
  |-- POST /api/checkout
  |     `-- cliente privado Supabase, solo servidor
  |
  |-- /checkout/confirmacion/[orderId]
  |-- /tracking/[orderId]
  |
  `-- Supabase BILBILDIN
        |-- businesses
        |-- products
        |-- product_variants
        |-- store_customers
        |-- orders
        |-- order_items
        |-- inventory_movements
        `-- order_tracking
```

### Límites de responsabilidad

- VYVO controla la experiencia visual, navegación, carrito y checkout.
- Bilbildin controla catálogo operativo, stock, pedidos, clientes y tracking.
- El panel administrativo permanece exclusivamente en Bilbildin.
- VYVO nunca edita productos, cancela pedidos ni actualiza tracking.

## 5. Configuración y secretos

Variables públicas:

```bash
NEXT_PUBLIC_SITE_URL=https://vyvocr.com
NEXT_PUBLIC_SUPABASE_URL=https://wgicaiphzwppnshagxve.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_BUSINESS_ID=
```

Variables privadas:

```bash
BILBILDIN_ENABLED=false
SUPABASE_SECRET_KEY=
```

Compatibilidad temporal:

- La aplicación aceptará `NEXT_PUBLIC_SUPABASE_ANON_KEY` si Bilbildin todavía
  entrega una clave `anon` heredada.
- La aplicación aceptará `SUPABASE_SERVICE_ROLE_KEY` si Bilbildin todavía
  entrega una `service_role` heredada.
- Se preferirán las nuevas claves `publishable` y `secret`, ya que Supabase
  mantiene las claves heredadas solo como compatibilidad.

Reglas:

- Ninguna clave privada llevará el prefijo `NEXT_PUBLIC_`.
- El cliente privilegiado importará `server-only`.
- La aplicación validará todas las variables al iniciar el modo Bilbildin.
- Los errores nunca incluirán claves, consultas completas ni datos privados.

## 6. Aislamiento y seguridad

1. El `business_id` proviene de configuración del servidor, nunca del cuerpo
   enviado por el navegador.
2. Cada lectura de catálogo filtra por `business_id` y estado visible.
3. Cada lectura privada filtra por `order.id` y `business_id`.
4. Cada escritura fija el `business_id` del despliegue.
5. El servidor vuelve a consultar producto, precio, costo, estado y stock.
6. Los precios y totales del navegador son únicamente informativos.
7. La cuenta debe estar `active` para aceptar pedidos.
8. El método de pago se valida contra la configuración del negocio.
9. Las entradas se validan con Zod, límites de longitud y listas permitidas.
10. El endpoint de checkout tendrá límite de tamaño, honeypot, protección de
    origen y una llave de idempotencia por intento. Esa llave generará un
    `order_number` determinista respaldado por la restricción única existente,
    para que un reintento recupere la misma orden en vez de crear otra.
11. El stock se descuenta mediante la operación protegida de Bilbildin; la
    función existente `decrement_stock` solo concede ejecución a
    `service_role`.
12. VYVO no consultará ni copiará catálogos o costos de otros negocios.

## 7. Datos iniciales del negocio

El registro se insertará con `account_status = 'pending'`, `plan_status =
'active'` y sin fecha de renovación. Bilbildin establecerá la fecha y activará
la cuenta después de revisar el alta.

Configuración visual:

```json
{
  "store_name": "VYVO",
  "store_description": "Figuras originales para imaginar, regalar y coleccionar.",
  "email": "vyvocr@gmail.com",
  "whatsapp": "+506 7287 4779",
  "instagram": "",
  "storefront_url": "https://vyvocr.com",
  "primary_color": "#111111",
  "accent_color": "#6F2CFF",
  "bg_color": "#FAFAF7",
  "alert_color": "#FF5A1F",
  "currency": "CRC",
  "language": "es",
  "timezone": "America/Costa_Rica",
  "sinpe_number": "",
  "sinpe_name": "",
  "link_url": "",
  "link_instructions": "",
  "cash_instructions": "Pago contra entrega coordinado directamente con VYVO.",
  "enabled_payment_methods": ["sinpe", "transfer", "cash"],
  "payment_coordination_mode": "post_order_whatsapp",
  "notify_orders": true,
  "notify_stock": true,
  "notify_pay": true
}
```

Los dos últimos campos de coordinación son extensiones de VYVO dentro del JSON
flexible de Bilbildin. Permiten habilitar los métodos sin publicar información
financiera. El checkout siempre mostrará que VYVO contactará al cliente.

## 8. Catálogo inicial

Los productos se crearán visibles pero con stock `0`. Así el equipo puede
revisar el espejo del catálogo sin aceptar ventas. Los importes son preliminares
y el dueño podrá cambiarlos desde Bilbildin sin redesplegar.

| SKU | Producto | Categoría | Precio | Costo | Stock |
|---|---|---|---:|---:|---:|
| VYV-MINI-CORE-001 | CORE | Coleccionables | ₡15.000 | ₡7.000 | 0 |
| VYV-MINI-RUSH-002 | RUSH | Coleccionables | ₡16.000 | ₡7.100 | 0 |
| VYV-MINI-WILD-003 | WILD | Coleccionables | ₡16.500 | ₡7.200 | 0 |
| VYV-MINI-ECHO-004 | ECHO | Coleccionables | ₡17.000 | ₡7.200 | 0 |
| VYV-MINI-NOVA-006 | NOVA | Coleccionables | ₡18.000 | ₡7.400 | 0 |
| VYV-CUSTOM-SHIFT-005 | SHIFT | Personalizables | ₡20.500 | ₡7.800 | 0 |
| VYV-SPORT-ARENA-008 | ARENA | Personalizables | ₡22.000 | ₡7.800 | 0 |
| VYV-COMP-NEXO-009 | NEXO | Personalizables | ₡23.500 | ₡8.000 | 0 |
| VYV-DROP-ABYSS-010 | ABYSS | Drops | ₡25.000 | ₡8.000 | 0 |

Cada producto conservará:

- UUID, slug y SKU actuales;
- descripción corta y larga;
- imagen absoluta en `https://vyvocr.com/products/...`;
- etiquetas editoriales;
- número Origins, línea, descriptor, tamaño, contenido, empaque y estado
  editorial dentro de `attributes`;
- `featured = true` para CORE, SHIFT y ABYSS;
- precio comparativo vacío;
- stock inicial en cero.

No se crearán variantes artificiales. Cuando no haya variantes reales, el
proveedor de VYVO sintetizará una selección base solo para el carrito. Las
configuraciones únicas de SHIFT, ARENA y NEXO se guardarán como snapshot seguro
en las notas del pedido, no como variantes permanentes.

## 9. Flujo de catálogo y carrito

El proveedor Bilbildin convierte las filas de Supabase al contrato
`StorefrontProduct` existente. Esto evita acoplar los componentes visuales a los
nombres de columnas de la base.

- Precio de Supabase: unidades CRC.
- Precio de la UI: `amountMinor = price * 100`.
- Stock `0`: agotado y botón de compra deshabilitado.
- Producto oculto o eliminado: no se muestra y se elimina del carrito al
  reconciliarlo.
- Variante real: precio base más `price_modifier`.
- Imágenes: primera URL o imagen local de respaldo.

El carrito seguirá guardando únicamente identificadores, cantidad y la
configuración personalizada. Antes del checkout, el servidor resolverá de nuevo
todas las líneas contra Bilbildin.

## 10. Checkout real

El cliente completará:

- nombre y apellidos;
- correo;
- teléfono;
- dirección, provincia, ciudad y código postal;
- notas opcionales;
- SINPE, transferencia o efectivo.

Al confirmar:

1. se valida la entrada;
2. se deriva el número único desde la llave de idempotencia;
3. se confirma que la cuenta está activa;
4. se consultan productos y stock con el negocio fijo;
5. se recalculan precios y costos en servidor;
6. se crea o actualiza el cliente;
7. se crea el pedido y sus líneas;
8. se descuenta stock con la operación protegida;
9. se registran movimientos de inventario;
10. se crea el primer evento de tracking;
11. se devuelve el UUID real del pedido.

El carrito solo se limpia cuando el servidor confirma la creación. Si ocurre un
error, el cliente conserva sus productos y recibe un mensaje recuperable.

## 11. Confirmación y tracking

La confirmación dejará de recibir un identificador demostrativo. Usará el UUID
real y mostrará:

- número de pedido;
- productos y total;
- método y estado de pago;
- explicación de coordinación por WhatsApp;
- enlace al tracking.

La ruta `/tracking/[orderId]` será un Server Component dinámico. Consultará
pedido, líneas y eventos con `orderId + business_id`, ordenará los eventos de
forma cronológica y no permitirá modificaciones.

Un pedido desconocido o de otro negocio responderá como no encontrado, sin
confirmar que ese UUID existe.

## 12. Manejo de errores

| Situación | Comportamiento |
|---|---|
| Integración desactivada | Continúa el modo demo |
| Variables incompletas con modo activo | Fallo de configuración visible en servidor; checkout cerrado |
| Bilbildin no disponible | Catálogo con estado controlado; checkout no crea pedido |
| Cuenta pendiente o bloqueada | Compra deshabilitada |
| Precio cambió | Se muestra el total recalculado y se solicita confirmación |
| Producto oculto | Se retira de la orden |
| Stock insuficiente | Se conserva el carrito y se informa la disponibilidad |
| Reintento del formulario | La idempotencia evita pedidos duplicados |
| Pedido ajeno o inexistente | Respuesta no encontrada |

## 13. Verificación

Antes de activar:

- pruebas unitarias de configuración, mapeo de productos, moneda, stock,
  validación y errores;
- pruebas del proveedor demo y del proveedor Bilbildin con respuestas simuladas;
- build de producción sin secretos;
- auditoría para asegurar que ninguna clave privada llega al bundle;
- verificación de catálogo agotado con stock cero;
- verificación de checkout cerrado con cuenta pendiente;
- verificación visual y accesible en escritorio y móvil.

Después de que Bilbildin active la cuenta y Vercel tenga credenciales:

- cambio de precio visible en menos de 60 segundos;
- stock actualizado sin redespliegue;
- pedido de prueba visible en el admin;
- método y pago pendientes correctos;
- descuento de stock y movimiento de inventario;
- confirmación con UUID real;
- cambio de estado visible en tracking;
- rechazo de pedidos cruzados o con precios manipulados.

## 14. Entrega a Bilbildin

Se generará `docs/integraciones/VYVO.md` con:

- negocio, owner, plan, dominio y `business_id`;
- configuración de marca;
- tabla de los nueve productos;
- precios y costos preliminares;
- campos de pago coordinado;
- variables que debe entregar/configurar el equipo;
- checklist de usuario administrador, revisión, stock y activación;
- commit exacto de VYVO preparado para desplegar.

Ese documento no contendrá claves. Se publicará en el repositorio Bilbildin
cuando la conexión de GitHub tenga acceso al repositorio privado. Si la conexión
sigue sin acceso, el archivo quedará versionado en VYVO y se entregará como
commit listo para copiar sin bloquear la integración técnica.

## 15. Reversión

Antes de activar no habrá pedidos reales. Si el alta necesita rehacerse:

1. mantener `BILBILDIN_ENABLED=false`;
2. poner los productos VYVO en `hidden`;
3. conservar el negocio en `pending`;
4. corregir los datos desde el admin o mediante un script idempotente;
5. revalidar antes de habilitar Vercel.

No se borrarán pedidos, clientes ni movimientos una vez que exista operación
real. Las correcciones posteriores se harán mediante estados y ajustes
auditables de Bilbildin.
