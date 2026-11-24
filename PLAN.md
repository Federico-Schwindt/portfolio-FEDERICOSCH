# Plan: portfolio de Federico Schwindt

Acordado entre Claude y Codex en dos rondas. La discusión completa, con los desacuerdos y por qué se
resolvieron así, está en [CHAT.md](CHAT.md). Nada de esto está construido todavía.

## Objetivo

Un portfolio de nivel Awwwards que además **convierta dueños de pymes en clientes** y posicione en
Google por intención de compra. Hoy el sitio impresiona pero no vende: es largo, la prueba llega tarde
y no hay páginas de servicio.

**No se toca:** paleta rojo / negro / crema, Archivo + Instrument Serif, apellido elástico, cursor que
pinta, lentes 3D que viajan y se posan en el retrato.

## Punto de partida (medido)

| Qué | Hoy | Meta |
| --- | --- | --- |
| Largo del home a 1440 x 900 | 23.851 px (~26 pantallas) | objetivo 9.000, máximo 11.000 |
| Escenas que fijan el scroll | 4 (330% + carrusel + 320% + 130%) | 2 cortas, solo en escritorio |
| JS inicial | 727 KB en un solo bundle, en todas las páginas | <= 150 KB home, <= 50 KB contacto (comprimido) |
| Páginas de servicio | 0 | 3 + índice |
| `sitemap.xml` | no existe (y `robots.txt` lo anuncia) | 24 URL canónicas |
| Formulario de auditoría | al final, pantalla ~25 | landing propia + enlace desde el cierre |

## 1. Home nuevo: 8 secciones

| # | Sección | Qué ve el visitante |
| --- | --- | --- |
| 1 | **Hero** | Apellido elástico y lentes. Un solo `h1` de dos niveles: "Websites that sell." en display y "Web design and development for small businesses." como bajada. Botón "Start a project" + enlace al caso UDS. Cifra, cliente y período visibles sin scrollear, también en teléfono. |
| 2 | **Trabajos y mediciones** | Una ficha grande de Universal Driveshafts y dos de clientes reales: Mirage TLV (reservar turno) y Certified Retail Cars (filtrar inventario). Debajo, franja de hasta 450 px con tres comparaciones de Lighthouse **móvil**: UDS 65 a 77 (cliente), Andreani 7 a 89 (concepto), La Virginia 30 a 95 (concepto). Enlace a los 14 casos. |
| 3 | **Servicios** | Tres filas: comprador, entregable, plazo, precio de entrada y enlace a su página. Al elegir una cambia la imagen. Una línea de complementos: landing pages, SEO y campañas, motion y 3D. |
| 4 | **Archivo de diseño** | La escena tipo Figma, fijada +100 vh (hoy +330). Un solo ejemplo: del catálogo difícil de buscar a la ficha donde el comprador encuentra su pieza. |
| 5 | **Precios y trabajo a distancia** | Los tres tickets, con alta y mensualidad juntas. Al lado: horario de llamadas en ET, idiomas, moneda y pagos, propiedad de dominio y código, qué se entrega al cancelar. |
| 6 | **Proceso** | El editor de video, pero **sin fijar el scroll**: se reproduce al entrar en pantalla y el visitante mueve el cabezal con clic, arrastre o teclado. Rotulado como ejemplo de un proyecto de 7 semanas. |
| 7 | **Federico** | Los lentes se posan en el retrato, fijado +70 vh (hoy +130). Quién diseña, quién atiende, en cuánto responde. |
| 8 | **Dudas y contacto** | Tres preguntas de compra (plazo, mantenimiento, propiedad). "Start a project" y "Already have a site? Get a free audit". |

Se elimina el carrusel horizontal de trabajos y las cuatro pantallas completas de servicios.
En teléfono y con movimiento reducido: cero fijaciones.

## 2. Páginas nuevas (6)

| Ruta | Para qué | Momento propio |
| --- | --- | --- |
| `/services/` | Elegir servicio | Índice de los tres, con complementos |
| `/services/ecommerce/` | "ecommerce website redesign" | Elegir vehículo y ver la pieza compatible entre seis registros de muestra. Caso UDS; Joya para WooCommerce. |
| `/services/business-websites/` | "small business website redesign services" | Elegir tratamiento y horario hasta una vista previa de la solicitud. Casos Mirage y Minrat. |
| `/services/car-dealer-websites/` | "independent used car dealer website design" | Filtrar seis autos de muestra por marca y precio, abrir una ficha. Caso Certified Retail Cars. |
| `/pricing/` | Comparar planes | Los tres planes en detalle, qué incluye la mensualidad y qué no |
| `/audit/` | Captar a quien ya tiene sitio | URL + email, tres correcciones en 48 horas |

Reglas de las demos: datos locales rotulados "Sample data", una interacción por página, <= 10 KB de
JS comprimido cada una, y terminan en "Preview only" antes de pedir datos personales. Cada página
entrega en HTML un ejemplo resuelto, el alcance, el precio de entrada y el enlace al caso.

Las palabras clave son **hipótesis** para EE. UU.: se validan con Search Console después de publicar.

**Páginas existentes:** cada caso enlaza a su servicio antes de "Next project" y ofrece consulta con
ese contexto. Migas visibles en servicios y casos. Lentes en pose estática distinta por página, sin
three.js. Se posterga `/redesign-a-day/`.

## 3. SEO técnico

- Un solo catálogo de servicios en `src/data/content.ts` (hoy hay dos listas distintas).
- `sitemap.xml` con las 24 URL, misma base que canonical, Open Graph y enlaces internos.
- `title` del home: "Small Business Web Design & Development | Federico Schwindt".
- Schema: Person, FAQPage y CreativeWork ya existen; sumar Service, BreadcrumbList y ProfessionalService.
- Enlaces HTML de ida y vuelta entre servicios y casos.
- Cifras siempre con dispositivo y fuente: el 99 es Lighthouse **escritorio**; en móvil ese caso marca 77.

## 4. Rendimiento y acceso

1. Separar la carga por ruta: navegación y formulario independientes; three.js con importación dinámica solo en el home, después de pintar el hero.
2. Servir los lentes del retrato como imagen exportada por adelantado (hoy se genera en el arranque) y dejar de renderizar una vez posados.
3. `paint.ts`: guardar las posiciones de las bandas al cambiar el layout en vez de medirlas en cada fotograma.
4. Con movimiento reducido en escritorio, mostrar las cuatro etapas del proceso (hoy tres quedan invisibles).
5. Contenido, enlaces y email visibles aunque el módulo de animación no cargue.

## 5. Fases y cómo se aprueba cada una

| Fase | Qué se hace | Se aprueba cuando |
| --- | --- | --- |
| **0. Cimientos** | Carga por ruta y 3D diferido, sitemap, base única, formularios probados, contenido sin JS, ID de lead y página de entrada | Proyecto, plan y auditoría generan cada uno un ID con su origen correcto. Con el módulo bloqueado siguen visibles contenido y email. JS inicial <= 150 KB en home y <= 50 KB en contacto. |
| **1. Home** | Nuevo orden, 2 fijaciones cortas, proceso interactivo, servicios en 3 filas, H1, franja de mediciones | A 1440 x 900: orden, largo <= 11.000 px, y el puente de los lentes se mueve <= 4 px al pasar del 3D a la imagen, bajando y subiendo, también a 1366 x 768. A 390 x 844 y con movimiento reducido se llega a precio, caso y formulario sin esperar una escena. Proceso operable con teclado. |
| **2. Páginas** | Las 6 rutas, demos, migas, schema, enlaces caso y servicio | Las 6 responden 200. Sitemap con 24 URL únicas. Cada servicio tiene un caso enlazado de ida y vuelta y una demo dentro de presupuesto. |
| **3. Confianza** | Testimonios, permisos, condiciones | Cada cifra tiene fuente y alcance, cada cita o logo tiene permiso, y Federico validó horario, moneda, pagos, propiedad y condiciones de salida. |
| **4. Medición y dominio** | Search Console, dominio, informe | Propiedad verificada y sitemap enviado. A los 30 días: sesiones, leads con ID y presupuestos por página de entrada, y Core Web Vitals al percentil 75 (LCP <= 2,5 s, INP <= 200 ms, CLS <= 0,1). |

## 6. Lo que necesito de vos, Federico

Las fases 0 a 2 no dependen de esto; la 3 y la 4 sí.

1. **El +551%:** de dónde sale y qué períodos compara. Hasta confirmarlo, el enlace del hero dice "Explore the parts finder".
2. **Testimonios:** una cita de Universal Driveshafts con nombre y cargo, y las que quieras de Freelancer. Permiso para usar nombres o logos.
3. **Perfil de Freelancer:** confirmar que el 5,0 sobre 13 proyectos es del perfil de Zyneteq, para enlazarlo.
4. **Condiciones:** horario de llamadas, moneda, formas de pago, qué cubre la mensualidad y qué se entrega si el cliente cancela.
5. **WhatsApp:** solo lo agrego si lo vas a atender.
6. **Dominio propio:** cuál, o seguimos en GitHub Pages.
7. **Backend de leads:** confirmar que el endpoint de Neon del sitio anterior sigue desplegado, para probar los tres formularios de punta a punta.

## Cómo seguir la discusión con Codex

```bash
& .\scripts\ask-codex.ps1
```

Corre un turno de Codex que lee `CHAT.md` y agrega su respuesta al final. El texto que recibe está en
`scripts/codex-prompt.txt`.

---

# Etapa 2: rediseño (acordado en las rondas 4 y 5 de CHAT.md)

Pedido de Federico: mejor diseño, un ojo 3D en lugar de los lentes con zoom hasta su retrato, otra paleta, más animaciones tipo Figma, mejor conversión y SEO, y páginas de proyecto rehechas.

## Decisiones

| Tema | Decisión |
| --- | --- |
| Paleta | Ultramar `#2A3CFF`, tinta `#131622`, papel frío `#F4F2EC`, lavanda `#E3E6FF` como fondo de las capturas. Un solo acento. |
| Tipografía | Sin cambios: Archivo + Instrument Serif cursiva. |
| Objeto de marca | Ojo de cerámica esmaltada: esfera marfil, iris ultramar con dos anillos, pupila tinta, un reflejo fijo. Sin venas, párpados ni parpadeo. Mira al cursor. |
| Hero | Ultramar a sangre. Oferta, prueba y botón en una columna a la izquierda; ojo de 34 vw a la derecha; apellido elástico detrás como textura. |
| Transición al retrato | El ojo se centra y crece; dentro de la pupila se abre la foto, alineada sobre la pupila fotografiada; la foto se aleja hasta el retrato. Pantalla completa en escritorio, +70 vh, reversible. En táctil y con movimiento reducido, sin fijación. |
| Pintura del cursor | Solo en el hero y en los cierres de consulta (bloques ultramar). |
| Páginas de proyecto | Una plantilla para los 14: encargo y evidencia, problema y decisión, recorrido visual, resultado documentado, siguiente paso. Cada captura es una lámina entera a 16:10, sin recortar. |
| Animaciones tipo Figma | Manijas de selección en fichas y láminas, guía en servicios, escena de diseño con Universal Driveshafts (elegir vehículo, ver piezas, abrir ficha), un solo cursor "Federico", cabezal del proceso. Descartadas: regla sobre cifras, avatares ficticios, reordenación automática. |

## Estado

| Bloque | Estado |
| --- | --- |
| Paleta ultramar en todo el sitio, logo, imagen social y PDF | Hecho |
| Ojo 3D que mira al cursor, con imagen fija de respaldo | Hecho |
| Zoom del ojo al retrato (0 px de error a 1440 x 900, 3,1 px a 1366 x 768; tope 4) | Hecho |
| Hero ultramar con oferta, prueba y botón en una columna | Hecho |
| Plantilla nueva de proyecto para los 14 casos, sin imágenes deformes | Hecho |
| Manijas de selección en las láminas de proyecto | Hecho |
| Pintura solo en hero y cierres; el bucle se detiene al disiparse el trazo | Hecho |
| Sin three.js con movimiento reducido | Hecho |
| El formulario conserva caso y servicio de origen | Hecho, sin probar contra el servidor |
| Escena de diseño con Universal Driveshafts en tres estados | Pendiente (sigue la maqueta anterior) |
| Manijas en fichas de trabajo del home y sobre el foco de teclado | Pendiente |
| Guía ultramar en las filas de servicios | Pendiente |
| Leyendas y textos alternativos editoriales por figura (pilotos UDS, Mirage, Motion Ident) | Pendiente: hoy salen de los datos existentes |
| Títulos comerciales en servicios | Pendiente |
| Prueba automatizada del recorrido a precio y formulario | Pendiente |

Sigue pendiente de Federico todo lo de la sección 6.

## Cambio posterior (18 nov)

Federico descartó el azul ultramar y el ojo. Queda:

- **Paleta:** el rojo de SLICK `#F01111`, negro `#0B0B0B` y crema `#FFF1E0`.
- **Objeto de marca:** una tecla blanca (keycap) con la letra F. Viaja con el scroll, cae vista desde arriba en el único hueco de un teclado blanco y, al completarlo, el scroll escribe código en un editor mientras se hunden las teclas correspondientes.
- La transición de pupilas y el retrato a pantalla completa quedan descartados; el retrato va como avatar en esa misma sección.
- Aterrizaje verificado: 0 px de error de posición a 1440 x 900 y 1366 x 768.

El resto de "Etapa 2" (plantilla de casos, pintura en hero y cierres, pendientes) sigue igual.

## Etapa 3 (18 nov, noche): rediseño y servicios por disciplina

Decidido y construido:
- Slogan: "From sketch to sold." Hero centrado con un solo botón, prueba y precio; cuatro hilos finos van de ideas sueltas al botón; una línea baja del botón y escribe "Work that moved numbers." con las letras reales.
- Preloader: líneas rojas sobre crema forman SOLD, zoom a la palabra y entrada por el hueco de la "O".
- Sin fondos rojos con texto negro: el rojo es acento; las secciones antes rojas son crema cálido (#F3E2CC).
- Studio: archivo tipo Figma por scroll (plantilla borrada, selección que escala, línea tipeada, letras que caen, comentarios) y un stick man con IK que sale de la "o", salta, se cuelga de la "h" y saluda.
- Servicios por disciplina (src/data/offers.ts): Web design, Web development, Branding, Marketing, Community management, Motion & 3D. Sin precios inventados: solo los planes web tienen cifra.
- Precios: tres tickets lado a lado, Grow recomendado, franja "In every plan" y salida a la auditoría.
- SEO: títulos ≤ 60 y descripciones ≤ 160, ProfessionalService + WebSite + Service + FAQPage + BreadcrumbList, llms.txt, og.jpg nuevo, sitemap de 23 URL.
- Formulario: campo "What do you need?" con las seis disciplinas, preseleccionado desde ?service=.

Pendiente de Federico: fuente del +551 %, dominio, endpoint de leads (Neon), precios de branding, marketing, community y 3D.

## Etapa 4 (18 nov, mediodía): Venom, español, modo oscuro y capa Figma

- **Botón Venom en el hero.** Portado de exteestudio/venom-button (MIT, licencia en `src/scripts/venom.LICENSE.txt`) con `scripts/mkvenom.cjs`. Cuerpo de goma roja (#f01111), etiqueta crema en Archivo, piso transparente (solo dibuja la sombra), canvas del tamaño del botón más un margen, pausado fuera de pantalla. El link real queda encima, invisible: clic, teclado y lectores de pantalla siguen funcionando. Solo con mouse y desde 861 px; en celular es el botón normal.
- **Español en /es/** con los mismos slugs. Páginas en `src/views/*` con `lang`; `src/pages` y `src/pages/es` son envoltorios. Datos traducidos en `content.es.ts`, `offers.es.ts`, `samples.es.ts`; palabras de interfaz en `src/i18n/index.ts`. hreflang en cada página y en el sitemap (46 URLs). Tono: español neutro con "tú".
- **Modo claro y oscuro.** Toma la preferencia del sistema, se cambia con el botón sol/luna y se recuerda. En oscuro las secciones claras se invierten en su lugar (tokens `--ink`/`--paper`/`--ink-rgb`), el rojo no cambia.
- **Capa Figma** (`src/scripts/figma.ts`), medida del layout real: marco de selección con el tamaño verdadero cuando llega cada título, bandas de auto layout con el gap en px en las grillas marcadas `data-fx="gap"`, selección con medidas al pasar el mouse por tarjetas (`data-fx-hover`), texto tipeado con cursor en el hero.
- Pruebas: `scripts/i18n-check.mjs` (46 rutas, idioma, hreflang, sin inglés en /es/, sin errores), `scripts/vb.mjs`, `scripts/fx.mjs`, `scripts/theme-shots.mjs`, `scripts/path.mjs`.

## Etapa 5 (18 nov, tarde): home por bloques y Venom liviano

- **Scroll por bloques** (`src/scripts/slides.ts`, solo home, desktop con mouse, sin "reducir movimiento"): un gesto = un bloque. Paradas en cada sección; las secciones más altas que la pantalla tienen paradas internas y las escenas fijadas avanzan por capítulos (`data-steps`: Studio 0.3 / 0.5 / 0.72 / 1, código 1). Rueda, teclado (flechas, página, espacio, inicio, fin), links internos y puntos a la derecha. En este modo no se usa Lenis.
- **Armado tipo Figma**: al llegar a un bloque, tres cursores (Diseño, Código, Textos) arman las piezas marcadas `data-bd`. Los textos se dibujan como caja y aparecen de izquierda a derecha; tarjetas y botones se arrastran desde un poco afuera, encajan y muestran guías de alineación con la x real. Empieza a mitad de la transición; si te vas antes, lo pendiente aparece de golpe.
- **Venom**: se duerme cuando no hay nada moviéndose (cero frames con el mouse lejos), sin tentáculos espontáneos, resolución máxima 1.25x y canvas más chico. Se despierta al acercar el mouse.
- Prueba: `scripts/slides.mjs` (paradas, piezas que nunca aparecen, errores, costo en reposo).

## Etapa 6 (18 nov, tarde): un bloque por pantalla, modelo por pedidos

- **Cada bloque entra en una pantalla** (1366×768, 1440×900, 1920×1080 probados, sin nada cortado). CSS compacto en modo bloques más un ajuste automático con `zoom` (`slides.ts` → `fit()`). Sin paradas internas ni escenas fijadas al scroll.
- **Todo arranca con la transición**: evento `slide:enter` por sección (`src/scripts/enter.ts`). Studio (6,4 s), código tipeado, caminos de servicios, línea del hero y SOLD se reproducen por tiempo al llegar. El armado tipo Figma también.
- **Footer como bloque**: al bajar desde Contacto la vista entra por el agujero de la O de SOLD (`src/scripts/dive.ts`), como el preloader.
- **Venom eliminado** (archivos, estilos y prueba). Sin el punto del hero; el eyebrow dice "Schwindt Federico".
- **Modelo nuevo: un equipo entero en una persona, planes mensuales por pedidos, con IA.** Launch $600 + $80/mes (sitio simple, 2 pedidos a la vez), Grow $1,200 + $150/mes (branding, sitio mediano a medida, 4), Scale $3,000 + $250/mes (sitio completo, sistema propio, IA, flujos, 6, fila sin límite). Community management +$1,000/mes en cualquier plan. FAQ "¿Cómo funcionan los pedidos?", proceso Suscribirte / Construir / Pedir / Crecer, precios en servicios, schema y llms.txt actualizados. Inglés y español.
- **Trabajos rediseñado**: caso principal a la izquierda; dos casos horizontales y las mediciones Lighthouse a la derecha.

## Etapa 7 (18 nov, tarde): app de clientes (SaaS)

- **App en `/app/` y checkout en `/checkout/`** (también `/es/`), una isla React (`src/app/`). Funciona hoy en **modo demo** (datos de ejemplo y pago simulado en el navegador); con `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` pasa a real. Guía: `docs/saas-setup.md`.
- **Checkout** al hacer clic en un plan: elegir plan, sumar community management, cuenta (link por email o Google), pagar el desarrollo y entrar al tablero.
- **Panel**: motor de la fila (lugares del plan en vivo con anillos de avance), agentes de IA, métricas, entregas por semana, pedidos para revisar con aprobar o pedir cambios, actividad en vivo. Tablero kanban (fila arrastrable, en curso con límite, para revisar, listo). Ficha de pedido con brief, checklist, entrega, historial y comentarios. Nuevo pedido con tipos, plantillas, "Ordenar con IA" (checklist) y adjuntos; tecla N. Paleta Ctrl K. Plan y pagos (cambiar plan, add-on, facturas, portal). Kit de marca. Vista del estudio para Federico (todos los clientes).
- **Base de datos** Supabase (`supabase/migrations/0001_init.sql`): planes, perfiles, suscripciones, facturas, pedidos, eventos y archivos, con seguridad por fila; la regla de la fila (2/4/6 en curso) vive en la base.
- **Pagos** Lemon Squeezy (merchant of record, paga a cuentas argentinas), aislado en `supabase/functions/_shared/billing.ts`; funciones `checkout` y `billing-webhook`.
- Pendiente de Federico: crear las cuentas de Supabase y Lemon Squeezy y cargar las claves.
