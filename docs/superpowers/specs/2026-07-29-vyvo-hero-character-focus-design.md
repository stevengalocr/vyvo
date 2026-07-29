# VYVO — Hero con enfoque de personaje

**Fecha:** 2026-07-29  
**Estado:** Diseño aprobado; pendiente de implementación  
**Superficie:** Landing principal, hero y selector de personajes

## Objetivo

Convertir el hero actual en una experiencia de descubrimiento con dos estados claros:

1. **Familia:** muestra la composición completa de personajes y mantiene una vista previa automática, discreta, dentro de la tarjeta flotante.
2. **Personaje seleccionado:** reemplaza la composición grupal por un único personaje grande, recortado y protagonista, con una transición futurista breve y controlada.

La mejora debe conservar la esencia de VYVO como tienda de figuras para niños: expresiva, fácil de entender, orientada a producto y compra, sin apariencia de SaaS ni protagonismo del proceso de fabricación.

## Alcance

- Rediseñar el comportamiento del selector inferior del hero.
- Separar el personaje previsualizado automáticamente del personaje seleccionado manualmente.
- Crear un recorte transparente, fiel al arte existente, para cada uno de los nueve personajes.
- Incorporar transiciones con energía VYVO, respuesta inmediata y soporte de movimiento reducido.
- Mantener funcionales las llamadas a compra y personalización.
- Verificar interacción con mouse, teclado, touch, desktop y mobile.

## Fuera de alcance

- Cambiar el catálogo, precios, inventario o datos de BilBildin.
- Rediseñar el resto de la landing.
- Crear personajes, poses, accesorios o narrativas nuevas.
- Añadir nuevas dependencias de animación.
- Cambiar el flujo de carrito o checkout.

## Modelo de interacción

El componente manejará dos conceptos independientes:

- `selectedIndex: number | null`: selección manual que controla el protagonista grande. `null` representa el estado Familia.
- `previewIndex: number`: personaje mostrado en la tarjeta flotante.

### Estado inicial: Familia

- `selectedIndex` inicia en `null`.
- La imagen grande conserva la composición familiar existente.
- La tarjeta flotante presenta un personaje a la vez.
- `previewIndex` avanza automáticamente cada 4.8 segundos.
- El cambio automático nunca reemplaza la imagen familiar ni mueve el escenario principal.

### Selección manual

Al pulsar un personaje:

- `selectedIndex` toma el índice del personaje.
- `previewIndex` se sincroniza con el mismo personaje.
- La rotación automática se pausa.
- El escenario principal muestra únicamente el recorte transparente del personaje seleccionado.
- La tarjeta flotante muestra los datos del personaje seleccionado.
- El control inferior refleja visual y semánticamente una selección manual, no una simple vista previa.

### Volver a Familia

Al pulsar `Familia`:

- `selectedIndex` vuelve a `null`.
- Regresa la composición grupal.
- La rotación automática de la tarjeta se reanuda.
- La vista previa continúa desde el último personaje visible para evitar un salto arbitrario.

### Flechas

- En modo Familia, las flechas cambian solamente `previewIndex`; la imagen grande sigue siendo la familia.
- Con un personaje seleccionado, las flechas cambian la selección manual al personaje anterior o siguiente, sincronizando la tarjeta y el protagonista.
- El recorrido es circular.

### Interrupción y foco

- Una interacción manual siempre prevalece sobre el temporizador.
- Cambiar de pestaña o desmontar el componente limpia el intervalo.
- Al regresar a Familia se crea un único intervalo nuevo, sin temporizadores duplicados.

## Dirección visual

### Familia

- Se mantiene la imagen familiar actual como vista panorámica.
- La tarjeta flotante funciona como “radar de personaje”: miniatura, código, nombre, frase, precio y acceso al producto.
- Un indicador de progreso sutil comunica el siguiente cambio automático sin convertir el hero en un carrusel convencional.

### Personaje seleccionado

- El personaje ocupa el escenario principal como recorte completo, centrado y de gran escala.
- Debe conservar margen seguro en casco/cabeza y pies.
- El fondo del escenario continúa limpio y luminoso.
- Una señal gráfica VYVO —haz angular, máscara en V o halo cromático relacionado con el acento del personaje— acompaña la entrada sin competir con la figura.
- No habrá personajes secundarios, miniaturas flotantes ni decoración que reste jerarquía al producto.

## Recursos visuales

Se generará un archivo por producto:

`/public/products/<slug>/hero-transparent.png`

Productos:

- CORE
- RUSH
- WILD
- ECHO
- SHIFT
- NOVA
- ARENA
- NEXO
- ABYSS

Cada recurso debe:

- Partir de la imagen original del producto.
- Conservar exactamente pose, silueta, proporciones, casco/rostro, colores, armadura y accesorios.
- Eliminar fondo, suelo y sombra de estudio.
- Mantener bordes limpios con canal alfa transparente.
- Mostrar el cuerpo completo, sin recortes, espejado ni cambio de cámara.
- Incluir margen uniforme para que todos los personajes compartan una escala visual coherente.

Si un recurso no estuviera disponible durante la carga, el componente usará temporalmente la imagen principal existente del producto como fallback, sin romper el hero.

## Sistema de movimiento

### Principio

La animación principal comunica continuidad entre “familia” y “protagonista”. Debe sentirse precisa y energética, no decorativa ni permanente.

### Cambio del escenario principal

- Salida: 140–180 ms, opacidad descendente y desplazamiento horizontal corto según la dirección.
- Entrada: 360–460 ms, opacidad, escala aproximada de `0.96` a `1` y desplazamiento corto.
- Desenfoque máximo: 3 px y solamente durante el cambio.
- La señal VYVO aparece ligeramente antes que el personaje y se estabiliza antes de terminar la entrada.
- Las propiedades animadas se limitan a `transform`, `opacity` y, cuando sea seguro, `clip-path`.
- No habrá flotación infinita del personaje ni autoanimación de la imagen grande en modo Familia.

### Tarjeta flotante

- En modo Familia realiza un crossfade corto entre contenidos.
- El indicador de progreso dura 4.8 segundos y se reinicia con cada vista previa.
- En modo seleccionado deja de avanzar automáticamente.
- El cambio de tarjeta no debe provocar reflow ni variar su tamaño.

### Interrupciones

- Las transiciones deben responder correctamente a selecciones rápidas.
- El estado más reciente gana y no deja elementos fantasma.
- No se bloquearán controles mientras una transición esté en curso.

### Movimiento reducido

Con `prefers-reduced-motion: reduce`:

- Se elimina desplazamiento, escala, desenfoque y barrido angular.
- Los cambios usan solamente un crossfade corto o son inmediatos.
- Se desactiva el indicador animado de progreso, manteniendo la información estática.

## Accesibilidad

- El selector se comportará como un grupo de selección con etiquetas claras.
- `Familia` será la opción seleccionada cuando `selectedIndex` sea `null`.
- Un producto tendrá `aria-selected="true"` únicamente tras una selección manual; la vista previa automática no cambiará la selección semántica.
- Se implementarán `ArrowLeft`, `ArrowRight`, `Home` y `End` para navegación por teclado.
- El foco será siempre visible y conservará una forma coherente con los chips.
- La rotación automática no se anunciará en cada ciclo a lectores de pantalla.
- Una selección manual actualizará un estado `aria-live="polite"` con el nombre del personaje elegido.
- Todas las imágenes conservarán textos alternativos descriptivos.
- Botones, enlaces y controles mantendrán áreas táctiles mínimas de 44 × 44 px cuando el layout lo permita.

## Responsive

### Desktop

- Se conserva el balance actual entre copy y escenario.
- El recorte usa el área visual completa sin invadir la navegación ni la tarjeta.
- La tarjeta permanece anclada en la zona inferior derecha.

### Tablet

- Se reduce la escala del personaje y se protege el margen superior.
- Los chips pueden desplazarse horizontalmente sin cortar el foco.

### Mobile

- Copy, escenario, tarjeta y selector mantienen una lectura vertical clara.
- El personaje nunca queda oculto detrás de la tarjeta.
- La figura usa `object-fit: contain` y un alto limitado por viewport.
- El selector continúa siendo accesible por touch y teclado, con scroll horizontal suave.
- La tarjeta no produce desbordamiento lateral.

## Rendimiento

- No se añadirá una librería de animación.
- La imagen familiar seguirá siendo el recurso prioritario del estado inicial.
- Los recortes de personaje se cargarán al necesitarlos y serán optimizados por `next/image`.
- El cambio de recurso no alterará el tamaño del contenedor, evitando CLS.
- El temporizador se ejecutará solo cuando el modo Familia esté activo.

## Arquitectura propuesta

- Extraer la lógica de estado a funciones puras para probarla sin depender del DOM.
- Mantener el componente visual en `src/components/hero-showcase.tsx`.
- Añadir estilos acotados al bloque existente del hero en `src/app/globals.css`.
- Conservar el contrato actual de productos y derivar la ruta del recorte desde el `slug`.
- No modificar la fuente de datos de BilBildin.

## Estrategia de pruebas

### Unitarias

- Estado inicial Familia.
- Avance automático solo en Familia.
- Selección manual sincroniza protagonista y tarjeta.
- El temporizador no altera una selección manual.
- `Familia` limpia la selección y reanuda la vista previa.
- Flechas recorren circularmente en ambos modos.
- Navegación `Home` y `End`.

### Interacción y visual

- Selección de cada uno de los nueve personajes.
- Cambios rápidos de selección sin estados intermedios rotos.
- Retorno a Familia y reanudación automática.
- Enlaces de compra y producto operativos.
- Navegación completa por teclado.
- Verificación de `prefers-reduced-motion`.
- Desktop, tablet y mobile sin solapamientos ni overflow.
- Consola del navegador sin errores.

### Calidad

- Ejecutar pruebas, tipos, lint y build del proyecto.
- Ejecutar el detector visual de Impeccable sobre los archivos modificados.
- Revisar la implementación en el servidor local y después en el despliegue de Vercel.

## Criterios de aceptación

1. Sin selección manual, la familia permanece grande y la tarjeta rota automáticamente.
2. Al seleccionar un personaje, solo ese personaje aparece grande y la rotación se pausa.
3. `Familia` restaura la composición grupal y la rotación.
4. Los nueve recortes son transparentes, completos y fieles a sus diseños existentes.
5. Las transiciones son fluidas, interrumpibles y respetan movimiento reducido.
6. Selector, flechas, tarjeta y CTA funcionan con mouse, touch y teclado.
7. No hay cambios en catálogo, inventario, precios ni checkout.
8. No existen errores de consola, overflow visible ni regresiones en la landing.
