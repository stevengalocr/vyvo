# Configuración integral de VYVO en BilBildin

Fecha: 2026-07-29

## Objetivo

Dejar el negocio VYVO completamente asociado con su usuario confirmado,
configurado con la identidad visual oficial de la marca y con diez unidades
disponibles por producto en el inventario de BilBildin.

## Identidad y asociación

- Business ID: `14d10531-d6fc-45a9-9c74-1ff15c657099`.
- Propietario: `vyvocr@gmail.com`.
- El correo de `auth.users` debe coincidir exactamente con `owner_email`.
- La cuenta y el plan deben permanecer activos.
- Dominio del negocio: `vyvocr.com`.
- URL de tienda: `https://vyvocr.com`.

BilBildin resuelve el tenant del administrador mediante `owner_email`. No se
crearán tablas, roles ni asociaciones paralelas mientras esa relación exista y
el usuario esté confirmado.

## Configuración canónica

`theme_config` usará el formato plano que consumen el panel y la tienda de
BilBildin. La configuración anidada anterior se reemplazará porque el motor
actual no interpreta esas propiedades.

```json
{
  "store_name": "VYVO",
  "store_description": "Figuras, personajes y recuerdos hechos VYVO en Costa Rica.",
  "currency": "CRC",
  "language": "es",
  "timezone": "America/Costa_Rica",
  "whatsapp": "+506 7287 4779",
  "email": "vyvocr@gmail.com",
  "instagram": "",
  "notify_orders": true,
  "notify_stock": true,
  "notify_pay": false,
  "primary_color": "#111111",
  "accent_color": "#6F2CFF",
  "bg_color": "#FAFAF7",
  "alert_color": "#FF5A1F",
  "storefront_url": "https://vyvocr.com",
  "sinpe_number": "",
  "sinpe_name": "",
  "link_url": "",
  "link_instructions": "",
  "cash_instructions": "VYVO confirmará disponibilidad, entrega y forma de pago directamente con el cliente."
}
```

La combinación mantiene el negro y el violeta como jerarquía principal, el
blanco cálido como superficie y el naranja para alertas. Tiene contraste
suficiente para el sidebar oscuro y los acentos del panel.

Los datos bancarios y el número SINPE permanecerán vacíos. La tienda externa
recibe la preferencia del cliente y VYVO coordina el pago posteriormente, de
acuerdo con el flujo aprobado.

## Inventario

Los nueve productos visibles quedarán con `stock_quantity = 10`, para un total
de 90 unidades.

La operación será atómica:

1. Bloquear y leer el stock actual de los productos VYVO.
2. Actualizar únicamente los productos cuyo valor no sea diez.
3. Insertar un movimiento `restock` por cada producto modificado.
4. Guardar stock anterior, cambio, stock final, Business ID y nota de auditoría.

ABYSS ya tiene diez unidades, por lo que no recibirá un movimiento artificial.
Los otros ocho productos pasarán de cero a diez.

## Seguridad

- Toda actualización se limita al Business ID de VYVO.
- No se modifican otros negocios ni usuarios.
- No se consulta, reemplaza ni expone la contraseña del propietario.
- La operación de inventario conserva trazabilidad en
  `inventory_movements`.
- No se crea un pedido de cliente durante esta configuración.

## Verificación

Después de aplicar los cambios se comprobará:

1. Usuario confirmado y correo exactamente asociado.
2. Negocio y plan activos.
3. Configuración plana completa y colores hexadecimales válidos.
4. Nueve productos con diez unidades y total de 90.
5. Ocho movimientos de reposición correspondientes a esta carga.
6. Catálogo público con nueve productos comprables después de la revalidación.
7. Fichas y personalización con acciones habilitadas.
8. Ausencia de errores de consola y desbordamiento horizontal.
9. Aislamiento intacto de los demás negocios.

Una compra comercial completa se validará separadamente con datos de prueba
acordados, para no generar clientes u órdenes falsas en el entorno productivo.
