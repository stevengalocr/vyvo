# VYVO — Sistema cinético «Transmisión Modular»

**Estado:** Diseño aprobado para planificación  
**Fecha:** 2026-07-28  
**Alcance:** Landing, Catálogo, Personalizar, Drops y continuidad del flujo de compra  
**Dirección aprobada:** Futurista cinética, con tipografía, parallax y transiciones de mayor energía

## 1. Objetivo

Elevar la experiencia pública de VYVO para que se sienta como una marca de
coleccionables contemporánea, tecnológica y humana. El movimiento debe expresar
que las ideas cobran vida, que las figuras se articulan y que cada producto
pertenece a un mismo universo.

La experiencia no debe parecer una interfaz de videojuego, un sitio cyberpunk,
una plantilla SaaS o un catálogo genérico de impresión 3D. El producto, la
historia y la facilidad de compra siguen siendo protagonistas.

## 2. Fundamentos de marca

El sistema parte de estas reglas oficiales:

- Sora 700/800 para display, titulares, nombres y números de edición.
- Inter 400–700 para navegación, comercio, formularios y texto.
- Fondo blanco cálido dominante, negro estructural y un acento protagonista por
  composición.
- Purple representa identidad, tecnología y línea premium.
- Orange representa energía, acción y lanzamientos.
- Green representa movimiento, creación y cercanía.
- Mucho espacio negativo, composición editorial, sombras suaves y producto real
  o conceptual como protagonista.
- La doble V, las capas de filamento, los contornos apilados, la precisión y la
  articulación son el vocabulario gráfico.
- El logo maestro nunca recibe glow, degradado, volumen, textura, sombra ni
  deformación.

## 3. Concepto rector

**Transmisión Modular** convierte la interfaz en un sistema de piezas que se
alinean, se separan, ganan profundidad y vuelven a ensamblarse.

El movimiento se inspira en:

- la superposición de las dos V del isotipo;
- las capas de filamento;
- las articulaciones visibles de las figuras;
- el paso de una referencia a un objeto físico;
- una transmisión que cambia el protagonista sin perder de vista la familia.

La sensación buscada es precisa, energética y física. Las aceleraciones serán
decididas; los aterrizajes, suaves. El usuario debe percibir intención, no
ornamento.

## 4. Jerarquía de movimiento

La intensidad cambia según la tarea.

### Nivel 1 — Inmersivo

Aplicado a la landing y Drops:

- parallax de producto y planos gráficos;
- tipografía cinética;
- composiciones que se compactan o despliegan con el scroll;
- máscaras angulares inspiradas en la doble V;
- cambios de foco entre personajes;
- transiciones de sección con mayor recorrido.

### Nivel 2 — Expresivo

Aplicado a Catálogo, PDP y Personalizar:

- entradas escalonadas;
- filtros y módulos que se reorganizan;
- imagen y contenido con profundidad moderada;
- respuestas físicas en cards y controles;
- continuidad entre card y detalle de producto;
- progreso visual claro en personalización.

### Nivel 3 — Funcional

Aplicado a Carrito y Checkout:

- microinteracciones de confirmación;
- cambios de cantidad, resumen y pasos con transiciones breves;
- errores, carga y éxito claramente comunicados;
- ninguna animación que compita con precio, dirección, condiciones o CTA.

## 5. Sistema tipográfico cinético

Sora permanece como única tipografía display. No se introduce una fuente
«futurista» adicional.

### Comportamientos

- Los grandes titulares se revelan por líneas o bloques semánticos, no por cada
  letra.
- La palabra o frase de mayor intención puede avanzar entre 8 y 20 px y resolver
  en su posición final.
- Nombres Origins y números de edición pueden cambiar mediante recorte vertical
  o desplazamiento de carril.
- Eyebrows y microetiquetas usan tracking amplio y recorridos cortos.
- El texto de lectura nunca tiene movimiento persistente.
- La tipografía no se deforma, inclina artificialmente ni pierde legibilidad.

## 6. Profundidad y parallax

El parallax se construye con un máximo de tres planos:

1. **Plano ambiente:** patrones de doble V, contornos o líneas de filamento.
2. **Plano producto:** figura o familia VYVO.
3. **Plano interfaz:** copy, controles y estados comerciales.

Reglas:

- El producto se desplaza menos que el ambiente para conservar peso visual.
- Los controles no deben alejarse de su objetivo ni perseguir el cursor.
- El recorrido permanece contenido y reversible.
- No se usa scroll hijacking.
- No se requiere WebGL ni video pesado.
- En dispositivos con entrada táctil se prioriza el progreso por scroll sobre
  efectos dependientes del puntero.

## 7. Landing

### Hero

- La familia VYVO conserva el primer cuadro unificado.
- CORE funciona como ancla y ABYSS aporta profundidad.
- El foco rota entre personajes sin ocultar completamente al resto.
- El personaje activo avanza ligeramente, aumenta su presencia y activa un
  ambiente cromático propio.
- El cambio de nombre, descriptor, Origins y CTA ocurre como una sola
  transición coordinada.
- La interacción manual pausa la rotación automática.
- Al abandonar el hero, la escena se comprime y entrega continuidad al
  descubrimiento de producto.

### Secciones

- «¿Qué querés hacer VYVO?» usa módulos que se ensamblan y responden según el
  acento de cada intención.
- Líneas VYVO introduce grandes formas V como piezas estructurales, no como
  decoración gratuita.
- Origins revela productos en una secuencia editorial; la cuadrícula no salta
  ni retrasa el acceso.
- Personalizar usa la transformación referencia → sistema → figura.
- Articulación utiliza callouts que aparecen conectados a la pieza.
- ABYSS incrementa profundidad y contraste sin recurrir a neón.
- Unboxing y proceso usan movimiento explicativo, no teatral.
- El CTA final recoge el movimiento anterior y lo resuelve en una acción clara.

## 8. Catálogo

- La cabecera se mantiene compacta y orientada a descubrimiento.
- Los filtros se sienten como controles de una colección, con selección
  inequívoca y actualización estable.
- Las cards pueden tener una inclinación o separación de capas mínima en
  dispositivos con puntero preciso.
- La imagen no se recorta ni se desplaza de modo que oculte el producto.
- Las entradas por scroll se ejecutan una sola vez; el contenido permanece
  estable al volver hacia arriba.
- El orden, los resultados y la disponibilidad nunca dependen de una animación.
- Estados vacíos y limpieza de filtros tienen acciones funcionales.

## 9. Personalizar

- El flujo se representa como una construcción progresiva, no como un formulario
  extenso.
- Cada paso entra desde la dirección lógica del avance; volver invierte esa
  dirección.
- El preview responde a selecciones válidas y conserva continuidad entre pasos.
- El progreso siempre se comunica mediante texto, número y estructura, no solo
  mediante color o movimiento.
- La carga de referencias debe explicar privacidad, límites y estado.
- La confirmación final resume lo elegido antes de cualquier envío.
- SHIFT, ARENA y NEXO conservan flujos específicos.

## 10. Drops

- Drops adopta el nivel de movimiento más intenso junto con el hero.
- Graphite y negro estructuran la escena; Purple u Orange lidera cada
  composición.
- ABYSS puede aparecer mediante profundidad, máscara angular y escala contenida.
- La energía no crea escasez artificial: fechas, cantidades y estados solo se
  muestran cuando sean reales.
- La lista de espera conserva estados de carga, éxito y error visibles.

## 11. Navegación y transiciones

- El header mantiene continuidad sobre el hero y se solidifica al avanzar.
- Las transiciones de ruta usarán una respuesta breve de superficie o máscara,
  sin retrasar la navegación.
- Enlaces, botones, cards y filtros ofrecen feedback inmediato.
- Los botones no cambian de posición al activarse.
- La navegación móvil conserva objetivos táctiles mínimos de 44 px.
- Catálogo, Personalizar y Drops siguen siendo las tres entradas principales.

## 12. Lenguaje temporal

Familias de duración:

- Feedback inmediato: 120–180 ms.
- Controles y componentes: 180–280 ms.
- Entradas de sección: 420–700 ms.
- Transiciones hero o Drops: 700–1100 ms.

Las curvas de movimiento deben sentirse ágiles al salir y controladas al
aterrizar. Los retrasos escalonados se limitan para que la última pieza útil no
aparezca tarde.

No se permite:

- animar todas las propiedades;
- rebotes elásticos en comercio o formularios;
- movimiento perpetuo detrás de texto largo;
- cursores personalizados;
- elementos que huyan del puntero;
- animaciones de carga falsas.

## 13. Accesibilidad

- `prefers-reduced-motion: reduce` elimina parallax, autoplay y transiciones no
  esenciales.
- El hero ofrece una composición estática completa.
- La pausa del autoplay ocurre al interactuar, salir del viewport o perder
  visibilidad la pestaña.
- El contenido no depende de estar animado para existir o ser entendible.
- El foco permanece visible y sigue un orden lógico.
- Los controles funcionan con teclado y lector de pantalla.
- Los estados no se comunican únicamente por color.
- No se producen flashes ni cambios bruscos de luminancia.
- El texto normal mantiene WCAG AA.

## 14. Rendimiento y arquitectura

- Preferir transformaciones y opacidad.
- Evitar mediciones de layout repetidas durante scroll.
- Usar observadores para activar y pausar escenas.
- Cargar primero únicamente el medio crítico.
- Mantener dimensiones declaradas para prevenir layout shift.
- No incorporar una dependencia de animación si CSS y APIs nativas resuelven el
  caso con suficiente calidad.
- Si una librería aporta orquestación materialmente mejor, debe cargarse solo
  donde exista interacción real y revisarse su impacto en el bundle.
- El render del contenido continúa siendo server-first; los controladores de
  movimiento se aíslan en componentes cliente pequeños.

## 15. Criterios de aceptación

- La landing se percibe más energética sin perder claridad en menos de diez
  segundos.
- La experiencia conserva el vocabulario oficial de VYVO.
- El logo no recibe tratamientos prohibidos.
- Cada composición usa un acento dominante.
- Hero, Drops, Catálogo y Personalizar tienen identidades de movimiento
  relacionadas pero distintas.
- Carrito y Checkout permanecen rápidos y tranquilos.
- No existen botones, filtros o controles visuales sin función.
- Reduced motion produce una experiencia completa y estable.
- La navegación completa funciona con teclado.
- No hay layout shifts provocados por animación.
- Lint, typecheck, build y pruebas pasan.
- Se verifican desktop y mobile en navegador.
- La implementación queda en `main` y se publica solo después de la
  verificación.

## 16. Fuentes de verdad

- [VYVO — Centro del Proyecto](https://app.notion.com/p/3a52f6f30d2b81b790dfe8f182303346)
- [VYVO — Identidad de Marca y Sistema Visual](https://app.notion.com/p/3a52f6f30d2b8191bbc4daf5841acb45)
- [VYVO — Biblioteca Visual de Landing](https://app.notion.com/p/3a52f6f30d2b819a97adc4e66a3674b2)
- [VYVO — Brief de Construcción Web para Codex](https://app.notion.com/p/3ab2f6f30d2b81d196f5ec035b0a4b9f)
