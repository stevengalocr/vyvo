# vault-sync — loop «Alineación Total» (2026-09-29 → 2026-09-30)

Unidad U06 del loop: VYVO auditada contra el Contrato de Alineación de Tiendas, corregida en código y con su sub-nodo completo en el vault. Nodo: `..\obsidian\Cerebro2.0\02-Proyectos\BilBildin\Tiendas\VYVO\`. VYVO no tiene `Decisiones.md` ni `Seguridad.md`: esas líneas dicen a qué página van.

### U06-A · Auditoría a–k y un solo contrato con la puerta de BilBildin · commit f719bda · despliegue pendiente (Vercel despliega `main` solo)
**Pendientes.md** — Cierra: «`invalid_product` cae en error interno» y «el `alt` fabricado» (ítem #28, ya cerrados en `4c555b2`; ahora también para las piezas con ficha local). Cierra: «`accepted_terms` no viaja». Nuevos: (1) configurar `theme_config.terms_url` en el panel del CORE apuntando a `https://www.vyvocr.com/terminos` (y `terms_version`), hoy `null`: sin eso ningún pedido guarda `terms_version`; (2) publicar los legales en `business_legal_documents` (B05) o decidir que VYVO sirve los suyos; (3) `next_payment_date` de VYVO fue el 2026-09-27 y la cuenta sigue `active`: cobro manual pendiente (decisión #43 del CORE); (4) producto de encargo en ₡2.000 / stock 20 (sigue abierto); (5) `NEXT_PUBLIC_SITE_URL` en Vercel; (6) reindexación en Search Console; (7) un pedido y un encargo reales; (8) `findOrderIdForTracking` lee `store_customers(email)` como segundo factor — es lectura de servidor, no se pinta; anotado, sin acción.
**Decisiones.md** — (van a `Integracion-Y-Estado.md`) ADR-1: la forma del payload y de la respuesta del RPC vive en `src/lib/bilbildin/order-payload.ts` y la usan las dos rutas; la prueba `tests/bilbildin-order-payload.test.ts` es el sustituto honesto de una prueba contra la base (VYVO no tiene base de pruebas). ADR-2: `accepted_terms: true` viaja siempre y el esquema del servidor lo exige (`z.literal(true)`), porque la puerta lo pasaba como `false` y `crear_pedido` rechaza con `invalid_request` el día que el negocio configure `terms_url`. ADR-3: el `alt` de `attributes.gallery` manda también sobre la ficha editorial local.
**Seguridad.md** — (va a `Alineacion-Con-BilBildin.md`) Sin cambios de estado: llave de servicio solo en módulos `server-only`, cero marcadores `sb_secret_`/`service_role` en `.next/static` tras el build; columnas enumeradas en confirmación y seguimiento (⊆ `COLUMNAS_PUBLICAS_*` del CORE).
**Otras páginas** — `VYVO.md`: «Una de las **cuatro** tiendas conectadas» → «una de las tres tiendas productivas (Ivory Labs es ficha pausada)»; la sección «Lo que VYVO le debe a su propio repo (ítem #28)» pasa a cerrada. `Integracion-Y-Estado.md`: «delega en `public.create_storefront_order(uuid, jsonb)`» → «desde el 2026-09-19 delega en `crear_pedido`»; «`createOrder` devuelve el código» se mantiene para el CORE, y se agrega que la puerta de VYVO lo **lanza**. `Rendimiento-SEO-Y-Pendientes.md`: el bloque «Trabajo propio del repo de VYVO — ítem #28» pasa a cerrado; «Bloqueado por BilBildin: los avisos no existen (#31)» → los avisos existen desde `20260925_los_avisos_salen_solos.sql` pero no salen por falta de la llave de correo (S3 del CORE).
**log.md** — `## [2026-09-30] ingest | Auditoría a–k contra el contrato y contrato único del RPC`
- Once puntos auditados con evidencia: 9 ✅, 2 ⚠️ (g: `terms_url` `null` en la base; j: contrato fijado en unitarias, sin transacción contra la base real).
- `f719bda`: `order-payload.ts` compartido por checkout y encargos; `accepted_terms` viaja; ocho códigos nombrados; `alt` de galería sobre ficha local; 76 pruebas.
- Verificado en la base (solo `select`): fila de `businesses` correcta, `custom_domain = vyvocr.com`, `active`/`starter`/`active`, `terms_url` y `business_legal_documents` vacíos, 0 pedidos, 0 clientes, 11 productos (10 `visible` + FORGE `deleted`), encargo a ₡2.000 / stock 20, ningún producto con `attributes.gallery` todavía.
- `curl -sI`: ápex 308 → `www`, `www` 200 con CSP y HSTS.
- Contradicción: README decía que la puerta delega en `create_storefront_order`; el código del CORE dice `crear_pedido` desde el 09-19. Gana el CORE; README corregido.
Aplicado en vault: sí

### U06-B · `CLAUDE.md` con protocolo de vault y sub-nodo completo · commit cfd3d34 · despliegue n/a
**Pendientes.md** — Cierra (k): «el repo no tiene `CLAUDE.md`». Sin ítems nuevos.
**Decisiones.md** — ninguna.
**Seguridad.md** — sin cambios. `CLAUDE.md` documenta el `business_id` y los nombres de variables, ninguna clave.
**Otras páginas** — Se crean `Alineacion-Con-BilBildin.md`, `Arquitectura-Y-Codigo.md`, `Marca-Y-Catalogo.md`, `Cuentas-y-Accesos.md`, `Pendientes.md`, `index.md`, `log.md`; se reescriben `VYVO.md`, `Integracion-Y-Estado.md`, `Rendimiento-SEO-Y-Pendientes.md` con la foto del 2026-09-30. El hub enlaza a todas, a `index` y `log` con ruta completa, y a `[[02-Proyectos/BilBildin/BilBildin|BilBildin]]`.
**log.md** — `## [2026-09-30] ingest | CLAUDE.md del repo y sub-nodo completo en el vault`
- `CLAUDE.md` creado con qué es, comandos, mapa, identidad en BilBildin, variables, reglas, trampas (fallo de build del 09-19 por el permiso de `anon`) y el protocolo de vault.
- Sub-nodo VYVO completo según `Plantilla-Tienda.md`; lint del grafo en 0 problemas para la carpeta.
- Espejo de Drive `_raw/BilBildin/drive-2026-09-29/Tiendas/VYVO/` está vacío: no había nada que comparar.
Aplicado en vault: sí
