# VYVO Storefront — Auditoría y refinamiento de producción

**Fecha:** 2026-07-29  
**Estado:** Diseño aprobado  
**Superficie:** `vyvocr.com` / storefront público VYVO  
**Repositorio:** `stevengalocr/vyvo`, rama `main`

## 1. Objetivo

Convertir la tienda pública VYVO en una experiencia comercial sólida, memorable y accesible, conservando la identidad existente y eliminando toda fricción o contradicción que reduzca la confianza del comprador.

VYVOCR es el producto prioritario. BilBildin es un motor administrativo invisible para el cliente: administra catálogo, precio, inventario, estado del negocio y pedidos, pero no define la presentación, el lenguaje ni la experiencia pública de la marca.

## 2. Fuentes de verdad

### Marca y experiencia

La fuente editorial y visual es **VYVO Centro del Proyecto** en Notion y sus páginas relacionadas:

- Identidad de marca.
- PRD público.
- Brief de construcción web.
- Marketing y conversión.
- Biblioteca visual.
- Catálogo comercial inicial.

Las decisiones posteriores aprobadas por el propietario prevalecen sobre documentos antiguos. En particular:

- La navegación pública queda limitada a **Catálogo**, **Personalizar** y **Drops**.
- No se incorpora VYVO Club.
- La web es una tienda de productos y regalos; no una interfaz SaaS ni una demostración de impresión 3D.
- La sección “Líneas VYVO” permanece eliminada.

### Comercio

BilBildin es la fuente de verdad para:

- Identidad del negocio.
- Estado activo/inactivo.
- Nombre, slug e identificador de cada producto.
- Precio en CRC.
- Stock.
- Estado de publicación.
- Categoría y modelo de venta.
- SKU y atributos operativos.
- Creación del pedido y descuento de inventario.

Los contenidos locales se limitan a narrativa, dirección visual, recursos gráficos y explicaciones de marca. Nunca pueden contradecir la disponibilidad o el precio devueltos por BilBildin.

## 3. Estado verificado al iniciar

La auditoría confirmó:

- Negocio VYVO activo en el plan Starter.
- Business ID `14d10531-d6fc-45a9-9c74-1ff15c657099`.
- Correo propietario `vyvocr@gmail.com`.
- Dominio objetivo `vyvocr.com`.
- Moneda CRC y zona horaria `America/Costa_Rica`.
- Nueve productos visibles.
- Diez unidades por producto; noventa unidades totales.
- Rango de precios entre ₡15.000 y ₡25.000.
- Colores del negocio alineados con la marca:
  - negro `#111111`;
  - morado `#6F2CFF`;
  - naranja `#FF5A1F`;
  - fondo `#FAFAF7`.
- Pedidos protegidos mediante función privada, validación de negocio/producto/stock y una capa idempotente.
- La aplicación publicada no presentó errores de consola durante el recorrido auditado.

También se detectaron problemas que este trabajo debe resolver:

- Textos públicos que nombran BilBildin sin aportar valor al comprador.
- Mensajes que hablan de inventario futuro aunque el catálogo ya tiene stock.
- ABYSS se presenta simultáneamente como disponible y como “próximo drop”.
- Plazos operativos definidos localmente sin una fuente comercial verificable.
- En móvil, la ficha de producto muestra tres medios pendientes antes del precio y el CTA.
- En ancho intermedio, la escena del hero pierde parte de la composición.
- La landing dedica demasiado espacio a proceso, impresión y promesas de empaque aún no validadas.
- La documentación tiene cantidades de pruebas desactualizadas.

## 4. Dirección visual

La intervención es un **refinamiento comercial integral**, no un rediseño.

### Principios

- Fondo blanco cálido dominante.
- Negro para estructura, jerarquía y contraste.
- Un color protagonista por composición.
- Producto y personaje como foco principal.
- Tipografía Sora para títulos e Inter para interfaz y lectura.
- Espacio negativo generoso, sombras suaves y bordes controlados.
- Lenguaje en español costarricense, claro y emocional sin manipulación.
- Sin gradientes decorativos, estética cyberpunk, falsas urgencias ni claims no comprobados.
- El logotipo no recibe sombras, brillos, animaciones ni modificaciones.

### Proporción cromática

- Blanco cálido: 55–65 %.
- Negro/grafito: 20–30 %.
- Acento protagonista: 10–15 %.
- Acento secundario: máximo 5 %.

## 5. Arquitectura pública

### Frontera con BilBildin

El navegador nunca recibe la llave de servicio ni acceso administrativo.

El storefront:

1. Obtiene el catálogo en el servidor.
2. Valida que el negocio esté activo.
3. Filtra productos visibles.
4. Adapta los datos externos a un contrato interno de presentación.
5. Falla de forma cerrada si los datos necesarios no son válidos.

El checkout:

1. Valida el formulario en cliente para usabilidad.
2. Vuelve a validar el cuerpo en el servidor.
3. Comprueba origen, tamaño y campo antispam.
4. Envía únicamente IDs, cantidades, configuración permitida y datos del comprador.
5. Delega en BilBildin el cálculo definitivo, stock, número de orden y persistencia.
6. Usa una clave idempotente para impedir duplicados.

### Configuración no disponible

No se inventan plazos, entregas, materiales, certificaciones, galería final ni accesorios definitivos. Cuando BilBildin no exponga un dato operativo, la interfaz utiliza lenguaje honesto como “por coordinar”.

## 6. Arquitectura de contenido

### Landing

Orden previsto:

1. Hero de marca y selección de personaje.
2. Ruta de compra compacta.
3. Productos destacados.
4. Personalización como experiencia emocional.
5. Una prueba compacta de calidad y fabricación local.
6. Preguntas comerciales reales.
7. CTA final.

Se eliminan o comprimen bloques repetitivos sobre proceso, impresión, empaques no confirmados y conceptos que no ayudan a descubrir, confiar o comprar.

### Catálogo

- Búsqueda por nombre, código o intención.
- Filtros con resultados reales y estados vacíos útiles.
- Ordenamiento por destacados y precio.
- Tarjetas completamente accionables.
- Precio y disponibilidad visibles.
- Acento de personaje como señal secundaria.
- Sin categorías o controles sin resultado.

### Ficha de producto

En móvil, el orden principal es:

1. Imagen.
2. Nombre y descriptor.
3. Precio.
4. Disponibilidad.
5. CTA de carrito.
6. Confianza y coordinación.
7. Información conceptual.
8. Medios pendientes y productos relacionados.

En escritorio se mantiene una composición de dos columnas, con la información comercial visible y estable mientras se recorre la galería.

Los renders se identifican como conceptuales. Esto describe la imagen, no invalida el precio o el stock comercial.

### Carrito y checkout

- Cantidades editables y eliminación clara.
- Precio unitario y total sin ambigüedad.
- Entrega indicada como “por coordinar” mientras no exista una tarifa verificable.
- Pasos de contacto, entrega y revisión.
- Validación próxima al campo.
- Datos preservados al regresar.
- Formas de pago: SINPE Móvil, transferencia y efectivo contra entrega.
- No se solicitan datos bancarios.
- Confirmación con referencia real devuelta por BilBildin.

## 7. Sistema de movimiento

Las animaciones comunican selección, continuidad y respuesta. Nunca retrasan una acción.

### Hero

Estado inicial:

- Se muestra la familia VYVO.
- La tarjeta informativa puede recorrer automáticamente los personajes.
- La escena principal no reemplaza la familia hasta que el usuario selecciona.

Estado seleccionado:

- La figura anterior sale en 140–180 ms.
- El escenario cambia de acento sin flashes.
- La figura nueva entra en 260–360 ms desde una escala cercana a 1.
- Nombre, código, descriptor, precio y CTA cambian coordinadamente.
- La sombra adopta el color del personaje con baja opacidad.
- La selección es interrumpible y admite teclado.

Perfiles:

- Morado: expansión concéntrica y precisa.
- Naranja: energía direccional y sombra cálida.
- Verde: entrada estable y pulso contenido.
- Blanco: anillo grafito y contraste limpio.

No se emplea brillo neón ni se anima el logotipo.

### Catálogo e interacción

- Hover solo con puntero preciso.
- Estado activo inmediato en touch.
- Filtros con continuidad visual, sin reanimar la página completa.
- Foco visible.
- Salida más rápida que entrada.
- Stagger corto únicamente cuando ayuda a leer una aparición inicial.

### Movimiento reducido

Con `prefers-reduced-motion`, se eliminan desplazamientos amplios, ciclos automáticos y parallax. Los cambios conservan una transición de opacidad breve o son instantáneos.

## 8. Responsive y accesibilidad

La implementación se prueba al menos en:

- 375 × 812.
- 390 × 844.
- 768 × 1024.
- 1024 × 768.
- 1280 × 800.
- 1440 × 900.

Criterios:

- Sin desplazamiento horizontal de página.
- Hero completo en el rango de 901–1150 px.
- CTA comercial visible temprano en móvil.
- Objetivos táctiles de al menos 44 × 44 px.
- Tipografía fluida sin cortes incómodos.
- Orden de foco equivalente al orden visual.
- Contraste AA.
- Estados no comunicados únicamente mediante color.
- Anuncios accesibles para cambios de selección, carrito y errores.
- Alt útil para contenido; alt vacío para decoración.

## 9. Seguridad y manejo de errores

Se conservan:

- Secretos solo en servidor.
- RLS sobre tablas comerciales.
- Funciones de creación de pedidos restringidas a `service_role`.
- Validación de negocio, producto, precio, stock y cantidad dentro de la base.
- Idempotencia de pedidos.
- Política de mismo origen en el endpoint.
- Límite de cuerpo.
- Honeypot antispam.
- Respuestas `no-store`.
- Mensajes públicos que no filtran detalles internos.

El RPC anónimo que informa si la tienda está activa es intencional y devuelve únicamente un booleano. La documentación debe explicar esta excepción.

Las mejoras globales del proyecto compartido de BilBildin se comunican como recomendaciones y no se aplican unilateralmente si pueden afectar otras tiendas.

## 10. Necesidades futuras para BilBildin

No bloqueantes para este refinamiento:

- Plazo de producción/entrega por producto.
- Galería publicable con texto alternativo y orden.
- Especificaciones validadas de material, edad y seguridad.
- Estado comercial específico de un drop.
- Límite máximo de compra por producto.
- Protección centralizada contra abuso para el endpoint de pedidos.
- Auditoría del modelo de permisos heredado del proyecto compartido.

Hasta contar con esos campos, VYVO usa información honesta y conservadora.

## 11. Validación

### Automatizada

- Lint.
- TypeScript.
- Pruebas unitarias.
- Build de producción.
- Contratos de adaptación BilBildin.
- Estados del hero.
- Cálculo de carrito.
- Esquema de pedido.
- Errores de API e idempotencia.

### Navegador

- Landing, catálogo, producto, personalización, drops, carrito, checkout y confirmación.
- Todos los enlaces y botones públicos.
- Búsqueda, filtros, ordenamiento y navegación con teclado.
- Vacío, carga, error, sin stock y datos incompletos.
- Consola sin errores.
- Movimiento normal y reducido.
- Responsive en los seis tamaños acordados.

No se crea un pedido comercial falso. La prueba final de escritura se realiza una vez con información real autorizada; hasta entonces se verifica el flujo hasta el límite seguro y se deja el paso documentado.

## 12. Documentación y entrega

La entrega incluye:

- Este diseño.
- Plan de implementación.
- README actualizado.
- Arquitectura VYVOCR ↔ BilBildin.
- Variables de Vercel.
- Contrato de catálogo y pedido.
- Checklist de producción.
- Lista de mejoras solicitables a BilBildin.

Todo el trabajo se confirma y publica en `main`. El despliegue se valida en la URL pública de Vercel. `vyvocr.com` se mantiene como dominio canónico objetivo hasta completar su configuración DNS.

## 13. Criterios de aceptación

El trabajo se considera terminado cuando:

- La tienda no presenta BilBildin como parte de la experiencia de marca.
- Los nueve productos muestran precio, stock y estado coherentes.
- No existen claims comerciales contradictorios.
- El CTA principal de producto aparece antes que contenido secundario en móvil.
- El hero funciona sin recortes en móvil, tablet, ancho intermedio y escritorio.
- Cada personaje produce una transición reconocible, accesible y acorde con su acento.
- No hay botones, enlaces o formularios sin una respuesta funcional.
- El flujo carrito → checkout llega correctamente al límite de confirmación real.
- Todos los controles tienen estados de foco y touch adecuados.
- No hay overflow horizontal ni errores de consola.
- La suite, el build y la documentación reflejan el estado real.
- El commit final está disponible en `origin/main`.
