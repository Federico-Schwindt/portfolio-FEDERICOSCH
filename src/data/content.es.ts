/**
 * ─────────────────────────────────────────────────────────────
 *  CONTENIDO DEL SITIO (español). Misma estructura que content.ts.
 *  Los elementos marcados TODO son marcadores pendientes de
 *  confirmación.
 * ─────────────────────────────────────────────────────────────
 */

import type { Project } from './content'

export const site = {
  name: 'Federico Schwindt',
  firstName: 'Federico',
  lastName: 'Schwindt',
  tagline: 'Desarrollo web, diseño y marketing',
  role: 'Diseñador, desarrollador y marketer',
  agency: 'Zyneteq',
  location: 'Argentina',
  city: 'Gualeguaychú, Argentina',
  timeZone: 'America/Argentina/Buenos_Aires',
  utc: 'GMT-3',
  availability: 'Disponible para proyectos',
  email: 'leonel.sch2003@gmail.com',
  year: new Date().getFullYear(),
}

export const socials = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/federico-schwindt/' },
  { label: 'GitHub', href: 'https://github.com/Federico-Schwindt' },
  { label: 'Freelancer', href: 'https://www.freelancer.com/u/kiwiapp' },
]

export const nav = [
  { label: 'Trabajos', href: '/work/' },
  { label: 'Servicios', href: '/#services' },
  { label: 'Precios', href: '/#pricing' },
  { label: 'Sobre mí', href: '/about/' },
]

export const hero = {
  kicker: 'Diseño · Código · Marketing',
  lines: ['Sitios web', 'que venden.'],
  sub: 'Diseño, desarrollo y hago crecer sitios web para negocios a los que les importan los resultados. Una sola persona, tres disciplinas, nada se pierde en el traspaso.',
}

/** La franja roja debajo del hero */
export const marquee = ['Diseño', 'Código', 'Marketing', '+551% en ventas', '99 en Lighthouse', 'E-commerce', 'SEO', 'Motion', 'Renders 3D']

/** Prueba justo después del hero: un número grande y tres datos de apoyo */
export const proof = {
  value: 551,
  prefix: '+',
  suffix: '%',
  label: 'Crecimiento en ventas de Universal Driveshafts después de rediseñar y reconstruir su tienda, 2024 → 2026.',
  slug: 'universal-driveshafts',
  facts: [
    { value: '99', label: 'Rendimiento en Lighthouse (escritorio) de la tienda de UDS en producción' },
    { value: '5.0', label: 'Calificación promedio en 13 proyectos en Freelancer.com' },
    { value: '100%', label: 'Proyectos entregados a tiempo y dentro del presupuesto' },
  ],
}

/** “Redesign a Day”: la serie pública en LinkedIn, del más nuevo al más viejo */
export const series = {
  title: 'Redesign a Day',
  text: 'Una serie pública: cada día elijo una empresa real y rediseño su sitio web como un sitio funcional, no un mockup. Conceptos no oficiales, sin relación con las marcas.',
  days: [
    { day: 3, slug: 'andreani-concept' },
    { day: 2, slug: 'la-virginia-concept' },
    { day: 1, slug: 'advancing-eco-agriculture-concept' },
  ],
}

export const process = [
  { index: '01', title: 'Descubrir', italic: 'y estrategia', text: 'Dónde estás, adónde quieres llegar y qué hay en el medio. Un brief claro antes de un solo píxel.' },
  { index: '02', title: 'Diseñar', italic: 'iteraciones', text: 'Marca, sistema visual y diseño web, convertidos en algo creíble y hecho para durar. Sin plantillas.' },
  { index: '03', title: 'Construir', italic: 'y lanzar', text: 'Código limpio, rápido y fácil de mantener. Cada interacción ajustada a mano y probada en dispositivos reales.' },
  { index: '04', title: 'Crecer', italic: 'y acompañar', text: 'SEO, analítica y campañas después del lanzamiento. El proceso se adapta a ti, no al revés.' },
]

export const projects: Project[] = [
  {
    slug: 'universal-driveshafts',
    kinds: ['E-commerce', 'Website'],
    title: 'Universal Driveshafts',
    client: 'Universal Driveshafts · Odessa, FL',
    category: 'Rediseño y crecimiento de e-commerce',
    tags: 'Diseño, Código, Marketing',
    year: '2024-2026',
    cover: 'work/uds.jpg',
    url: 'https://universaldriveshafts.com',
    featured: true,
    summary:
      'Rediseño y reconstrucción completa de universaldriveshafts.com, ya en producción: un catálogo de más de 7,500 repuestos, un buscador por vehículo, un configurador de cardanes online y un circuito mayorista. Las ventas crecieron 551% de 2024 a 2026.',
    role: ['Estrategia', 'Diseño UX / UI', 'Front-end y back-end', 'SEO y campañas'],
    stack: ['Tienda a medida', 'Catálogo de compatibilidad', 'Carrito y checkout', 'Multiidioma', 'SEO', 'Google Ads', 'Analytics'],
    stats: [
      { value: '+551%', label: 'Crecimiento en ventas, 2024 → 2026' },
      { value: '7,541', label: 'Repuestos en 44 categorías' },
      { value: '4,433', label: 'Cardanes en el buscador por vehículo' },
      { value: '99', label: 'Rendimiento en Lighthouse (escritorio) de la tienda en producción (antes 84)' },
    ],
    challenge:
      'El sitio original en WordPress hacía difícil encontrar el repuesto correcto. Miles de SKU, sin lógica de compatibilidad y un checkout donde se perdían clientes, en un rubro donde el comprador necesita la pieza exacta, hoy.',
    solution:
      'Una tienda nueva pensada según cómo buscan de verdad los mecánicos: por número de pieza u OEM, por serie de componente, por vehículo (marca → año → modelo desde el catálogo de compatibilidad real) o pidiendo un cardán fabricado a medida. Un diseño tipo app deja todo el catálogo a un toque en un menú lateral, con el teléfono y el WhatsApp de un técnico de transmisiones siempre a mano. Envíos en el día, precios mayoristas y cinco idiomas sobre un código propio y rápido.',
    result:
      'Ventas un 551% más altas entre 2024 y 2026, con un catálogo de 7,541 repuestos en 44 categorías y 4,433 cardanes completos que se pueden buscar entre 41 marcas. La tienda en producción obtiene 99 en rendimiento de Lighthouse en escritorio y 100 en accesibilidad y SEO, sin desplazamientos de diseño. Su propio código carga unos 22 KB de JavaScript, contra 1.2 MB del viejo sitio en WordPress; el resto son las etiquetas de Google y Meta detrás de las campañas de anuncios. Hoy el sitio es el principal canal de ventas de la empresa.',
    features: [
      {
        title: 'Encuentra el cardán por vehículo',
        text: 'Marca, año y modelo, directo del catálogo de compatibilidad, así que solo aparecen combinaciones reales. Empieza desde la home o elige la marca por su logo, y cada resultado muestra su número de pieza exacto, precio y stock.',
        image: 'case/uds-vehicle.jpg',
        stat: '4,433 cardanes · 41 marcas',
      },
      {
        title: 'Configurador de cardanes online',
        text: 'Una pregunta a la vez, cada una con un dibujo: a qué se conecta el cardán en la caja y en el eje, serie de cruceta, material del tubo, horquillas y medidas, más un chequeo opcional de velocidad crítica. El precio se actualiza en vivo y después el taller lo fabrica y lo balancea según la especificación.',
        image: 'case/uds-builder.jpg',
        stat: 'Precio en vivo mientras lo configuras',
      },
      {
        title: 'Diseñador de cardanes',
        text: 'Elige un modelo de una o dos piezas a partir de dibujos acotados, completa las secciones y las medidas, y luego imprime la hoja o envíala al taller. Gratis, sin crear una cuenta.',
        image: 'case/uds-designer.jpg',
        stat: 'Hojas técnicas listas para imprimir',
      },
      {
        title: 'Pedido rápido y mayorista',
        text: 'Talleres, casas de transmisiones y flotas escriben números de pieza con sugerencias en vivo, definen cantidades y agregan todo al carrito de una vez. Las páginas de categoría funcionan igual: una tabla filtrable por serie, marca y modelo, con tamaño de tapa y ancho en cada fila y un botón Agregar en cada línea. Las cuentas comerciales aprobadas tienen descuentos fijos en el checkout.',
        image: 'case/uds-quick-order.jpg',
        stat: '7,541 repuestos, con referencias cruzadas 1310-1810',
      },
      {
        title: 'Hecho para el taller',
        text: 'El buscador, el configurador y el catálogo se usan con una mano en el teléfono, con una barra fija de Agregar al carrito en cada repuesto y los mismos datos en vivo que en escritorio. Las fichas de producto estiman la entrega por código postal y muestran referencias cruzadas, alternativas y lo que compraron otros clientes.',
        image: 'case/uds-mobile.jpg',
        stat: 'Mobile first, mismos datos en vivo',
      },
    ],
    performance: {
      measured: '2026-11-16',
      tool: 'Lighthouse 12.8, el motor detrás de Google PageSpeed Insights (prueba de laboratorio, home)',
      before: { label: 'Sitio original en WordPress (5 nov 2026)' },
      after: { label: 'Tienda en producción (16 nov 2026)', url: 'https://universaldriveshafts.com' },
      note: 'Móvil simula un teléfono de gama media con una conexión 4G lenta. La tienda en producción carga Google Analytics, Google Ads y el Meta Pixel para las campañas: unos 570 KB del JavaScript de abajo y la mayor parte del tiempo de bloqueo en móvil. El código propio de la tienda pesa unos 22 KB.',
      runs: [
        { device: 'Móvil', before: { perf: 65, a11y: 87, bp: 79, fcp: 2909, lcp: 2939, tbt: 1104, cls: 0.067, si: 3466, bytes: 1613204, reqs: 164, js: 1239015 }, after: { perf: 77, a11y: 100, bp: 79, fcp: 2273, lcp: 3245, tbt: 536, cls: 0.0, si: 2273, bytes: 1400819, reqs: 52, js: 605630 } },
        { device: 'Escritorio', before: { perf: 84, a11y: 87, bp: 78, fcp: 1506, lcp: 2022, tbt: 42, cls: 0.057, si: 1506, bytes: 1670439, reqs: 170, js: 1238974 }, after: { perf: 99, a11y: 100, bp: 78, fcp: 535, lcp: 676, tbt: 69, cls: 0.0, si: 635, bytes: 1400803, reqs: 52, js: 605638 } },
      ],
    },
    images: ['case/uds-1.jpg', 'case/uds-2.jpg', 'case/uds-3.jpg', 'case/uds-4.jpg'],
  },
  {
    slug: 'uds-3d-driveshafts',
    kinds: ['3D', 'Motion'],
    title: 'UDS Product Studio',
    client: 'Universal Driveshafts · Odessa, FL',
    category: 'Renders 3D de cardanes y motion',
    tags: 'Modelado 3D, Render, Motion',
    year: '2026',
    cover: 'work/uds-3d.jpg',
    video: 'media/uds-3d.mp4',
    featured: true,
    summary:
      'Cardanes completos modelados en Blender a partir de los datos del propio catálogo de la tienda: cantidad de piezas, largo de tubo de soldadura a soldadura, serie de cruceta y tipo de extremos. Cada uno se renderiza en un estudio blanco desde hasta seis ángulos y se exporta como modelo 3D, sin un solo píxel de fotos del proveedor.',
    role: ['Modelado 3D', 'Iluminación y render', 'Productos generados desde datos', 'Motion'],
    stack: ['Blender (Cycles)', 'Datos de compatibilidad del catálogo', 'glTF / GLB', 'Higgsfield (motion)'],
    stats: [
      { value: '10', label: 'Cardanes completos: de 1, 2 y 3 piezas' },
      { value: '47', label: 'Renders de estudio' },
      { value: '10', label: 'Modelos 3D (GLB), de 1.2 a 4.4 MB cada uno' },
      { value: '0', label: 'Píxeles de fotos del proveedor usados' },
    ],
    challenge:
      'La mayoría de los cardanes completos de la tienda se mostraban con fotos del proveedor: distintos ángulos, luz y fondos, y muchas veces un cardán genérico en lugar de la pieza exacta. Fotografiar miles de cardanes nunca iba a pasar.',
    solution:
      'Cada cardán se construye a partir de su registro en el catálogo: cantidad de piezas, largo de tubo de soldadura a soldadura, diámetro del tubo, serie de cruceta, tipo de extremos y soportes centrales. El mismo modelo se renderiza desde los ángulos que piden los compradores (tres cuartos, lateral, ambos extremos y cada soporte central) y se exporta como GLB para una vista 3D interactiva. Una página de revisión pone cada render al lado de la foto actual del catálogo para que el taller lo compare con la pieza real.',
    result:
      'Un primer set de revisión de 10 vehículos, desde un Ford Ranger de una pieza hasta un International 4300 de tres, con 47 imágenes de estudio consistentes que respetan las proporciones de cada pieza porque salen de los mismos números con los que vende la tienda. Después, los renders se animaron en un breve video de producto para anuncios y redes. El taller está revisando el set antes de que reemplace las fotos del catálogo.',
    features: [
      {
        title: 'Hecho desde el catálogo, no desde fotos',
        text: 'El cardán trasero del Chrysler 300 / Dodge Charger 2005-2010, pieza 2891-401N: dos piezas, tubos de 18.37" de soldadura a soldadura, serie 1310, discos flexibles en ambos extremos y un soporte central. Cada número del modelo sale del registro de compatibilidad, y la página muestra exactamente a partir de qué se construyó.',
        image: 'case/uds3d-review.jpg',
        stat: '2 piezas · 1310 · 1,283 mm',
      },
      {
        title: 'Cada ángulo que pide un comprador',
        text: 'Una toma de estudio en tres cuartos, una vista lateral completa, los extremos de caja y de eje y un primer plano de cada soporte central, todo con la misma luz sobre el mismo fondo blanco, para que el catálogo por fin parezca una sola tienda.',
        image: 'case/uds3d-angles.jpg',
        stat: 'Hasta 6 ángulos por pieza',
      },
      {
        title: 'Cardanes de una, dos y tres piezas',
        text: 'Tubos de acero y aluminio, horquillas deslizantes, juntas homocinéticas, discos flexibles, crucetas con abrazaderas o bulones en U y uno o dos soportes centrales: el mismo sistema resuelve cardanes de las series 1310, 1330, 1350 y 1710.',
        image: 'case/uds3d-set.jpg',
        stat: '10 vehículos · 4 series',
      },
      {
        title: 'Comparado con la pieza real',
        text: 'Un chequeo de proporciones superpone el render lateral a la foto actual del catálogo de la misma pieza, para que el taller apruebe cada cardán antes de publicarlo.',
        image: 'case/uds3d-compare.jpg',
        stat: 'Revisado pieza por pieza',
      },
      {
        title: 'De imagen fija a movimiento',
        text: 'Los renders se convirtieron en el primer y el último cuadro de un video corto: la cámara avanza a lo largo del cardán hasta el soporte central mientras gira la cruceta. Animado con Higgsfield a partir de los renders de estudio, así la pieza sigue siendo la pieza.',
        image: 'case/uds3d-motion.jpg',
        stat: 'Video de producto de 13 segundos',
      },
    ],
    images: ['case/uds3d-1.jpg', 'case/uds3d-2.jpg', 'case/uds3d-3.jpg', 'case/uds3d-4.jpg'],
  },
  {
    slug: 'andreani-concept',
    kinds: ['Website', 'Motion'],
    title: 'Andreani',
    client: 'Concepto independiente · sin relación con Andreani Grupo Logístico',
    category: 'Sitio de logística con cotización y reserva al instante',
    tags: 'Concepto, Diseño web, Código, Logística, Motion',
    year: '2026',
    cover: 'work/andreani.jpg',
    url: 'https://federico-schwindt.github.io/Andreani-Redesign-Concept/',
    featured: true,
    concept: true,
    video: 'media/andreani.mp4',
    summary:
      'Un rediseño no solicitado, en español, para Andreani, la red logística más grande de Argentina (54.6 millones de envíos al año). Una animación de apertura hecha con la gráfica real de los camiones, un flujo de cotización y reserva en seis pasos que termina en una etiqueta impresa con un código QR que funciona, seguimiento en vivo y un buscador con 291 sucursales reales.',
    role: ['Investigación y concepto', 'Dirección de arte', 'Diseño UX / UI', 'Desarrollo front-end', 'Motion (asistido por IA)'],
    stack: ['Astro', 'TypeScript', 'GSAP + ScrollTrigger', 'Lenis', 'API pública de Andreani', 'API Georef (datos abiertos)', 'Higgsfield (Kling 3.0)', 'GPT Image', 'GitHub Pages'],
    stats: [
      { value: '89', label: 'Rendimiento en Lighthouse (móvil) (antes 7)' },
      { value: '10.6×', label: 'Contenido principal más rápido en el teléfono' },
      { value: '291', label: 'Sucursales reales con horarios' },
      { value: '6 pasos', label: 'De la ruta a la etiqueta impresa' },
    ],
    challenge:
      'Andreani mueve 54.6 millones de envíos al año y cumplió 80 años, pero su sitio te pide iniciar sesión antes de poder enviar algo, y la escala, la historia y la red de la empresa casi no se ven. En el teléfono, la home descargaba 5.6 MB y su contenido principal tardaba casi 29 segundos en aparecer. ¿Cómo haces que enviar un paquete se sienta tan rápido como la red que hay detrás?',
    solution:
      'Un sistema audaz tomado de la marca: la itálica expandida del logo, el rojo Andreani, la cinta de embalar y las etiquetas de envío. El sitio abre con la gráfica real: entra un camión, se cargan las cajas, la cámara se mete en una y sus solapas se abren sobre la home. El flujo de cotización toma lo mejor de las empresas de logística digital: precios en segundos sin registrarse, recálculo en vivo, carga masiva por CSV, las sucursales reales más cercanas con sus horarios y una etiqueta que se imprime en pantalla con un código QR que abre la página de seguimiento de ese mismo envío. Cada localidad de Argentina se autocompleta con los datos geográficos abiertos del gobierno.',
    result:
      'Un build estático en Astro con siete páginas: 89 en rendimiento y 100 en accesibilidad de Lighthouse en móvil para la home (el sitio actual obtiene 7 y 86), y 98/100 en el buscador de sucursales. La home descarga 431 KB en lugar de 5.6 MB, en 14 solicitudes en lugar de 109. Una página de propuesta en español se lo presenta al equipo de Andreani con un comparador antes/después, las mediciones y un plan para construirlo con las herramientas que ya usan.',
    features: [
      {
        title: 'Una apertura que carga el camión',
        text: 'La gráfica real, dibujada en SVG: entra el semirremolque, se cargan 24 cajas de adelante hacia atrás, la cámara se mete en una y sus solapas se abren sobre la home. CSS puro y la Web Animations API, se muestra una vez por sesión y se omite con movimiento reducido.',
        image: 'case/an-loader.jpg',
        stat: 'Se muestra una vez por sesión',
      },
      {
        title: 'Precios en segundos, sin registrarte',
        text: 'Paquetes, sobres, vino o pallets en filas o desde un CSV con hasta 50 bultos. Origen y destino autocompletan cualquier localidad del país, la ruta se dibuja sola en el mapa y los precios Estándar y Prioritario se recalculan en vivo cada vez que cambias algo.',
        image: 'case/an-quote.jpg',
        stat: 'Recálculo en vivo',
      },
      {
        title: 'De la ruta a la etiqueta en seis pasos',
        text: 'Bultos, origen, destino, contacto, pago y etiqueta. Las tres sucursales reales más cercanas aparecen con distancia y horarios mientras el mapa se acerca, y la etiqueta se imprime en pantalla con un código de clasificación y un QR que abre su propia página de seguimiento.',
        image: 'case/an-label.jpg',
        stat: 'Escanea el QR, sigue el paquete',
      },
      {
        title: 'La red, en un solo mapa',
        text: '291 sucursales desde la API pública de Andreani, con búsqueda por localidad, código postal o cercanía, con filtros, horarios y cómo llegar. El mapa se acerca a los resultados.',
        image: 'case/an-finder.jpg',
        stat: '98 en rendimiento de Lighthouse',
      },
      {
        title: 'Una propuesta con números',
        text: 'Una página de propuesta en español con un comparador antes/después deslizable, resultados de Lighthouse para dos páginas, el flujo de cotización explicado paso a paso y un plan para integrarlo con su CMS y sus APIs actuales.',
        image: 'case/an-pitch.jpg',
        stat: 'Contenido principal 10.6× más rápido',
      },
    ],
    performance: {
      measured: '2026-11-05',
      tool: 'Lighthouse 12.8.2, el motor detrás de Google PageSpeed Insights (prueba de laboratorio, móvil)',
      before: { label: 'Sitio actual', url: 'https://www.andreani.com' },
      after: { label: 'Rediseño', url: 'https://federico-schwindt.github.io/Andreani-Redesign-Concept/' },
      note: 'Móvil simula un teléfono de gama media con una conexión 4G lenta. El SEO no se compara porque el concepto bloquea la indexación a propósito.',
      runs: [
        { device: 'Home', before: { perf: 7, a11y: 86, bp: 75, fcp: 10086, lcp: 28881, tbt: 3075, cls: 0.396, si: 14057, bytes: 5596644, reqs: 109, js: 5261213 }, after: { perf: 89, a11y: 100, bp: 100, fcp: 1650, lcp: 2737, tbt: 23, cls: 0.001, si: 6753, bytes: 431250, reqs: 14, js: 70809 } },
        { device: 'Buscador de sucursales', before: { perf: 23, a11y: 82, bp: 68, fcp: 5041, lcp: 24132, tbt: 3016, cls: 0.121, si: 13273, bytes: 3002585, reqs: 93, js: 2596271 }, after: { perf: 98, a11y: 100, bp: 100, fcp: 1230, lcp: 2280, tbt: 4, cls: 0, si: 1471, bytes: 298479, reqs: 11, js: 23813 } },
      ],
    },
    images: ['case/an-1.jpg', 'case/an-2.jpg', 'case/an-3.jpg', 'case/an-4.jpg'],
  },
  {
    slug: 'la-virginia-concept',
    kinds: ['Website', 'Motion'],
    title: 'La Virginia',
    client: 'Concepto independiente · sin relación con Cafés La Virginia S.A.',
    category: 'Sitio de marca de té y café con pedidos mayoristas',
    tags: 'Concepto, Diseño web, Código, B2B, Motion',
    year: '2026',
    cover: 'work/lavirginia.jpg',
    url: 'https://federico-schwindt.github.io/La-Virginia-Redesign/',
    featured: true,
    concept: true,
    video: 'media/lavirginia.mp4',
    summary:
      'Un rediseño no solicitado, en español, de la marca de té y café de La Virginia, una empresa rosarina fundada en 1915. Un sitio clásico y moderno construido sobre el catálogo real (62 productos con sus notas sensoriales), una solicitud de pedido mayorista en lugar de una tienda y una página de propuesta con resultados medidos antes y después.',
    role: ['Investigación y concepto', 'Dirección de arte', 'Diseño UX / UI', 'Desarrollo front-end', 'Motion (asistido por IA)'],
    stack: ['Astro', 'TypeScript', 'Motion', 'View Transitions API', 'WooCommerce Store API', 'sharp', 'Higgsfield (Kling 3.0)', 'GPT Image', 'GitHub Pages'],
    stats: [
      { value: '95', label: 'Rendimiento en Lighthouse (móvil) (antes 30)' },
      { value: '3.6×', label: 'Contenido principal más rápido en el teléfono' },
      { value: '62', label: 'Productos reales con notas sensoriales' },
      { value: '32 KB', label: 'De JavaScript (antes 1.5 MB)' },
    ],
    challenge:
      'La Virginia está en las mesas argentinas desde hace más de un siglo, pero su sitio no muestra precios y no les da a comercios ni distribuidores una forma clara de hacer pedidos. En el teléfono, el contenido principal tardaba unos 8 segundos en aparecer. ¿Cómo mantienes el carácter de una marca de 1915 y aun así logras un sitio rápido, claro y útil para vender?',
    solution:
      'Un sistema clásico y moderno tomado de la propia marca: el azul Virginia, el dorado del logo reservado para las acciones, los ventanales en arco de las fachadas clásicas de Rosario como marco de cada imagen, y Fraunces combinada con Hanken Grotesk. Cinco videos cortos generados con IA se renderizaron sobre el azul exacto de la marca para que se fundan con la página. Como no hay precios públicos, el carrito se convirtió en una solicitud mayorista (empresa, CUIT, rubro, provincia). El catálogo se sincroniza desde la tienda WooCommerce existente, incluidos el color, el sabor, el aroma y la intensidad de cada producto, así el equipo no tendría que migrar nada.',
    result:
      'Un build estático en Astro con 72 páginas: 95 en rendimiento y 100 en accesibilidad de Lighthouse en móvil para la home (el sitio actual obtiene 30 y 91), y 100/100 en una ficha de producto. La home descarga 862 KB en lugar de 3 MB, en 26 solicitudes en lugar de 150. Una página de propuesta en español se lo presenta al equipo de La Virginia con un comparador antes/después, las mediciones y un plan de implementación.',
    features: [
      {
        title: 'El catálogo real, por línea',
        text: 'Té, hierbas y café, sincronizados desde la tienda WooCommerce de la marca con imágenes optimizadas. Una barra de filtros fija cambia de línea con View Transitions nativas, y la búsqueda funciona mientras escribes.',
        image: 'case/lv-catalog.jpg',
        stat: '62 productos · 15 líneas',
      },
      {
        title: 'Ficha sensorial',
        text: 'Color, sabor, aroma y un medidor de intensidad para cada producto que los publica, más presentaciones y atributos. La tarjeta de producto se transforma en su página de detalle al hacer clic.',
        image: 'case/lv-spec.jpg',
        stat: 'Color · sabor · aroma · intensidad',
      },
      {
        title: 'Solicitud de pedido mayorista',
        text: 'Almacenes, cafeterías y distribuidores agregan productos por presentación y envían una sola solicitud con el nombre de la empresa, CUIT, rubro y provincia. Llegaría a la bandeja de entrada o al CRM del equipo comercial.',
        image: 'case/lv-b2b.jpg',
        stat: 'Hecho para comercios, no para checkouts',
      },
      {
        title: 'Una propuesta que muestra la diferencia',
        text: 'Una página de propuesta en español con un comparador antes/después deslizable, resultados de Lighthouse que cuentan desde el valor del sitio actual hasta el nuevo, los fundamentos del diseño y un plan de implementación sin migración.',
        image: 'case/lv-pitch.jpg',
        stat: 'Contenido principal 3.6× más rápido',
      },
      {
        title: 'Primero el teléfono',
        text: 'Producto y acción en la primera pantalla, controles del tamaño del pulgar y videos que solo cargan cuando entran en pantalla. Todas las páginas obtienen 100 en accesibilidad de Lighthouse.',
        image: 'case/lv-mobile.jpg',
        stat: '32 KB de JavaScript',
      },
    ],
    performance: {
      measured: '2026-11-05',
      tool: 'Lighthouse 12.8.2, el motor detrás de Google PageSpeed Insights (prueba de laboratorio, móvil)',
      before: { label: 'Sitio actual', url: 'https://www.lavirginia.com.ar' },
      after: { label: 'Rediseño', url: 'https://federico-schwindt.github.io/La-Virginia-Redesign/' },
      note: 'Móvil simula un teléfono de gama media con una conexión 4G lenta. El SEO no se compara porque el concepto bloquea la indexación a propósito.',
      runs: [
        { device: 'Home', before: { perf: 30, a11y: 91, bp: 57, fcp: 6074, lcp: 8251, tbt: 1599, cls: 0, si: 12279, bytes: 3173143, reqs: 150, js: 1545128 }, after: { perf: 95, a11y: 100, bp: 100, fcp: 1455, lcp: 2280, tbt: 0, cls: 0, si: 4754, bytes: 882395, reqs: 26, js: 32513 } },
        { device: 'Ficha de producto', before: { perf: 35, a11y: 83, bp: 57, fcp: 6076, lcp: 8208, tbt: 1194, cls: 0.0, si: 7040, bytes: 2622791, reqs: 157, js: 1552859 }, after: { perf: 100, a11y: 100, bp: 100, fcp: 1132, lcp: 1680, tbt: 0, cls: 0, si: 2300, bytes: 351295, reqs: 15, js: 31951 } },
      ],
    },
    images: ['case/lv-1.jpg', 'case/lv-2.jpg', 'case/lv-3.jpg', 'case/lv-4.jpg'],
  },
  {
    slug: 'advancing-eco-agriculture-concept',
    kinds: ['E-commerce', 'Website', 'Motion'],
    title: 'Advancing Eco Agriculture',
    client: 'Concepto independiente · sin relación con AEA',
    category: 'Sitio web y tienda de agricultura regenerativa',
    tags: 'Concepto, Diseño web, Código, E-commerce, Motion',
    year: '2026',
    cover: 'work/aea.jpg',
    url: 'https://federico-schwindt.github.io/Advancing-Eco-Agriculture-Website/',
    featured: true,
    concept: true,
    video: 'media/aea.mp4',
    summary:
      'Un rediseño no solicitado de advancingecoag.com, construido como un sitio funcional y no como un mockup: un descenso guiado por el scroll desde el follaje del cultivo hasta la zona de raíces, una Pirámide de Salud Vegetal interactiva y una tienda que funciona con el catálogo real (42 productos, 191 presentaciones y precios) y que puede pasar el carrito al checkout de WooCommerce que la marca ya tiene.',
    role: ['Concepto y estrategia', 'Dirección de arte', 'Diseño UX / UI', 'Desarrollo front-end', 'Motion (asistido por IA)'],
    stack: ['Astro', 'TypeScript', 'GSAP + ScrollTrigger', 'Lenis', 'WooCommerce Store API', 'Higgsfield (FLUX 3 Video)', 'GPT Image', 'GitHub Pages'],
    stats: [
      { value: '95', label: 'Rendimiento en Lighthouse (móvil)' },
      { value: '100', label: 'Accesibilidad en Lighthouse' },
      { value: '191', label: 'Presentaciones y precios reales, sincronizados desde WooCommerce' },
      { value: '62', label: 'Páginas prerrenderizadas' },
    ],
    challenge:
      'La ciencia de AEA es notable (inmunidad vegetal, análisis de savia, biología del suelo), pero cuesta sentirla a través de una pantalla, y la tienda tiene que respetar las normas de fertilizantes de cada estado. ¿Podía el sitio de una marca de agricultura regenerativa sentirse tan vivo como el suelo del que habla y aun así cargar rápido para productores con conexiones rurales?',
    solution:
      'La historia antes que el catálogo. La home recorre un video desde el follaje del cultivo hasta las raíces mientras haces scroll, con un indicador de profundidad en vivo y capítulos sobre exudados, microbios y redes de hongos. La Pirámide de Salud Vegetal se vuelve interactiva, con fichas minerales al estilo “tabla periódica”. La tienda usa el catálogo real con precio por presentación, un selector de estado que cambia a las fórmulas registradas en cada estado, un carrito lateral y un checkout de demostración; un solo ajuste pasa el carrito al checkout de WooCommerce existente mediante enlaces de checkout compartibles, así que no hace falta migrar la tienda.',
    result:
      'Un build estático en Astro con 62 páginas prerrenderizadas, unos 8.5 KB de JavaScript global y video que solo carga después del primer renderizado: 95 en rendimiento y 97-100 en accesibilidad de Lighthouse en móvil. Hecho como una propuesta funcional para el equipo de AEA, con un aviso en la primera visita que deja claro que es un concepto no oficial.',
    images: ['case/aea-1.jpg', 'case/aea-2.jpg', 'case/aea-3.jpg', 'case/aea-4.jpg'],
  },
  {
    slug: 'velocity-motors-concept',
    kinds: ['Website', 'Motion'],
    title: 'Velocity Motors',
    client: 'Concepto independiente',
    category: 'Sitio de concesionaria y spot de lanzamiento',
    tags: 'Concepto, Diseño web, Motion',
    year: '2026',
    cover: 'work/velocity.jpg',
    concept: true,
    video: 'media/velocity.mp4',
    summary:
      'Un sitio conceptual y un spot de lanzamiento de cinco segundos para una concesionaria de autos premium: búsqueda de inventario en la primera pantalla, financiación y toma de usados a un clic, y un video que vende el showroom antes de la primera visita.',
    role: ['Dirección de arte', 'Diseño web', 'Motion (asistido por IA)'],
    stack: ['Figma', 'Higgsfield (Kling 3.0)', 'GPT Image', 'Diseño listo para WordPress'],
    challenge: 'Los sitios de concesionarias se parecen todos: un slider, un teléfono y una lista de autos. El concepto se pregunta cómo puede una concesionaria sentirse premium sin dejar de poner la búsqueda primero.',
    solution:
      'Un diseño oscuro y de alto contraste donde la búsqueda (marca, modelo, precio) es la protagonista, las señales de confianza van justo debajo y un spot cinematográfico corto con estelas de luz roja le da a la marca una firma de movimiento reconocible para anuncios y redes.',
    images: ['case/velocity-1.jpg', 'case/velocity-film.jpg'],
  },
  {
    slug: 'brasa-coffee-concept',
    kinds: ['E-commerce', 'Motion'],
    title: 'Brasa Coffee',
    client: 'Concepto independiente',
    category: 'E-commerce y motion de producto',
    tags: 'Concepto, E-commerce, Motion',
    year: '2026',
    cover: 'work/brasa.jpg',
    concept: true,
    video: 'media/brasa.mp4',
    summary:
      'Una tienda online conceptual para un tostador de café de pequeños lotes, con un video de producto a juego: paleta cálida, tres productos destacados con precio en la primera pantalla y suscripciones a un clic.',
    role: ['Dirección de arte', 'Diseño de e-commerce', 'Motion de producto (asistido por IA)'],
    stack: ['Figma', 'Higgsfield (Kling 3.0)', 'GPT Image', 'Listo para Shopify / WooCommerce'],
    challenge: 'Quien compra café elige por el aroma y la historia, y ninguno de los dos atraviesa una pantalla.',
    solution: 'Mostrar el producto y el precio de inmediato, mantener los textos cortos y sensoriales, y usar un video de producto en cámara lenta (granos que caen, vapor que sube) como hero y como pieza para anuncios.',
    images: ['case/brasa-1.jpg', 'case/brasa-film.jpg'],
  },
  {
    slug: 'atelier-norte-concept',
    kinds: ['Website', 'Motion'],
    title: 'Atelier Norte',
    client: 'Concepto independiente',
    category: 'Sitio y video para un estudio de arquitectura',
    tags: 'Concepto, Diseño web, Motion',
    year: '2026',
    cover: 'work/atelier.jpg',
    concept: true,
    video: 'media/atelier.mp4',
    summary:
      'Un sitio conceptual para un estudio de arquitectura: una grilla editorial suiza, un titular con serifa, un índice de proyectos en lugar de un carrusel y un video lento de la luz recorriendo un interior de hormigón.',
    role: ['Dirección de arte', 'Diseño web', 'Motion (asistido por IA)'],
    stack: ['Figma', 'Higgsfield (Kling 3.0)', 'GPT Image', 'Código a medida'],
    challenge: 'Los arquitectos venden mesura. El sitio tiene que dar un paso atrás y dejar hablar a la obra, sin dejar de ser fácil de navegar en el teléfono.',
    solution: 'Espacio en blanco generoso, una fotografía fuerte por proyecto, un índice de texto para recorrer rápido y un video en loop en la home que muestra el espacio y la luz como una imagen fija no puede.',
    images: ['case/atelier-1.jpg', 'case/atelier-film.jpg'],
  },
  {
    slug: 'nova-dental-concept',
    kinds: ['Website'],
    title: 'Nova Dental',
    client: 'Concepto independiente',
    category: 'Sitio de clínica con turnos online',
    tags: 'Concepto, Diseño web',
    year: '2026',
    cover: 'work/nova.jpg',
    concept: true,
    summary:
      'Un sitio conceptual para una clínica dental pensado alrededor de una sola acción: reservar un turno. Un widget de reserva en tres pasos (tratamiento, fecha, confirmar) está en la home, tanto en tablet como en teléfono.',
    role: ['UX', 'Diseño web'],
    stack: ['Figma', 'GPT Image', 'WordPress + plugin de reservas'],
    challenge: 'Los pacientes están ansiosos y ocupados. Cada clic de más entre llegar al sitio y reservar es un turno perdido.',
    solution: 'Una paleta tranquila en verde azulado y blanco, fotografía cercana y un flujo de reserva visible sin hacer scroll que se completa en tres pasos.',
    images: ['case/nova-1.jpg'],
  },
  {
    slug: 'motion-ident-concept',
    kinds: ['Motion'],
    title: 'Motion Ident',
    client: 'Concepto independiente',
    category: 'Motion graphics de marca',
    tags: 'Concepto, Motion',
    year: '2026',
    cover: 'work/motion-loop.jpg',
    concept: true,
    video: 'media/motion-loop.mp4',
    summary: 'Una cortina de marca de cinco segundos: formas geométricas rojas se deslizan y encajan hasta formar un emblema, el tipo de firma en movimiento que abre un reel, un video de producto o un anuncio.',
    role: ['Dirección de motion (asistida por IA)'],
    stack: ['Higgsfield (Kling 3.0)', 'After Effects'],
    images: ['case/motion-loop-film.jpg'],
  },
]

export const workIntro = 'Diseño pensado, código cuidado y números que lo respaldan.'

/** Lo que hago: rico en palabras clave, una tarjeta por servicio (también alimenta el JSON-LD de Services). */
export const services = [
  {
    slug: 'business-websites',
    title: 'Sitios web para negocios',
    italic: 'que traen llamadas',
    text: 'Sitios rápidos y con diseño a medida para pequeñas y medianas empresas: clínicas, estudios, consultores, restaurantes. Hechos en WordPress o con código a medida, listos para Google desde el primer día.',
    tags: ['WordPress', 'Código a medida', 'Redacción'],
  },
  {
    slug: 'ecommerce',
    title: 'Tiendas online',
    italic: 'que venden',
    text: 'Tiendas en WooCommerce y Shopify con fichas de producto claras, checkout rápido, pagos y envíos configurados, y analítica que te dice qué se vende. Incluye tiendas de derecha a izquierda y multiidioma.',
    tags: ['WooCommerce', 'Shopify', 'Pagos'],
  },
  {
    slug: 'car-dealer-websites',
    title: 'Sitios para concesionarias e inventario',
    italic: 'que se pueden buscar',
    text: 'Inventario de vehículos con filtros, una página por auto con galería y ficha técnica, consultas de financiación y toma de usados, y botones de WhatsApp y llamada. La misma fórmula sirve para inmobiliarias y alquileres.',
    tags: ['Inventario', 'Filtros', 'Formularios de contacto'],
  },
  {
    slug: 'landing-pages',
    title: 'Landing pages',
    italic: 'para tus anuncios',
    text: 'Una página, un objetivo. Landing pages para campañas de Google y Meta con una oferta clara, prueba social y un formulario que llega directo a tu bandeja de entrada.',
    tags: ['Conversión', 'Tests A/B', 'Formularios'],
  },
  {
    slug: 'seo-ads',
    title: 'SEO y Google Ads',
    italic: 'para que te encuentren',
    text: 'SEO técnico, SEO local, Perfil de Empresa en Google, investigación de palabras clave y gestión de Google Ads. Informes mensuales en lenguaje claro, no métricas de vanidad.',
    tags: ['SEO', 'Google Ads', 'Analytics'],
  },
  {
    slug: 'motion-content',
    title: 'Motion y contenido',
    italic: 'que frena el scroll',
    text: 'Motion graphics, videos de producto y contenido para redes para lanzamientos y anuncios, producidos con una mezcla de motion design clásico y herramientas de IA.',
    tags: ['Motion', 'Video', 'Redes'],
  },
]

/** Auditoría web gratuita: el principal imán de contactos. */
export const audit = {
  kicker: 'Auditoría web gratuita',
  title: '¿Tu sitio web',
  titleItalic: 'te está haciendo perder clientes?',
  text: 'Envíame tu URL. En 48 horas recibes una revisión breve y honesta: qué lo hace lento, qué ve Google y los tres cambios que te traerían más consultas. Gratis y sin compromiso.',
  points: ['Velocidad y Core Web Vitals', 'SEO y visibilidad en Google', 'Conversión: formularios, llamadas, WhatsApp'],
}

export const faq = [
  {
    q: '¿Cuánto cuesta un sitio web?',
    a: 'Launch cuesta $600 de desarrollo más $80/mes, con 2 pedidos a la vez. Grow cuesta $1,200 más $150/mes, con branding y 4 pedidos a la vez. Scale cuesta $3,000 más $250/mes, con IA, flujos automatizados y 6 pedidos a la vez. A cualquier plan se le puede sumar community management por $1,000/mes.',
  },
  {
    q: '¿Cómo funcionan los pedidos?',
    a: 'Envías un pedido (una página nueva, un banner, una campaña, un arreglo, una publicación) y entra en tu fila. Tu plan define cuántos avanzan al mismo tiempo: 2, 4 o 6. La mayoría se entrega en dos a tres días hábiles, y el siguiente empieza apenas se entrega uno.',
  },
  {
    q: '¿Cuánto tarda?',
    a: 'Un sitio Launch suele estar en línea en una a dos semanas. Los proyectos Grow y Scale llevan de dos a seis semanas, según el contenido, las integraciones y el tamaño del catálogo.',
  },
  {
    q: '¿Qué incluye el plan mensual?',
    a: 'Hosting, SSL, copias de seguridad, actualizaciones de plugins y de seguridad, monitoreo de disponibilidad y una cantidad fija de cambios menores de contenido cada mes. Los planes superiores suman SEO e informes.',
  },
  {
    q: '¿Trabajas con clientes fuera de Argentina?',
    a: 'Sí. Hasta ahora mis clientes están en Estados Unidos, Israel, Australia e India. Trabajo de forma remota en inglés y español, con llamadas en tu zona horaria.',
  },
  {
    q: '¿Puedes rediseñar mi sitio actual?',
    a: 'Sí. Un rediseño suele ser la mejor inversión: Universal Driveshafts aumentó sus ventas un 551% después de su reconstrucción. Durante la mudanza cuido tus URLs y tu posicionamiento.',
  },
  {
    q: '¿WordPress, Shopify o código a medida?',
    a: 'Lo que mejor le sirva al negocio. WordPress y WooCommerce para la mayoría de los sitios y tiendas, Shopify cuando quieres la tienda más simple de manejar, y código a medida (React, Node) cuando importan el rendimiento o una experiencia única.',
  },
]

// Precio de instalación y luego una cuota mensual (hosting, mantenimiento, actualizaciones).
// `name` se mantiene en inglés: se usa en ?package= del formulario de contacto.
export const packages = [
  {
    code: 'FS/PKG.01-L1',
    short: 'LCH',
    name: 'Launch',
    text: "Un sitio simple y prolijo online rápido, y después un equipo a disposición todos los meses para lo que el negocio necesite.",
    textItalic: '',
    requests: "2 pedidos a la vez",
    items: ["Sitio simple, hasta 5 páginas","Dirección visual a medida","Hosting, seguridad y actualizaciones","La mayoría de los pedidos en 2 a 3 días hábiles"],
    price: '$600',
    monthly: "$80/mes",
    stamp: 'IDEAS ARE NOT RECYCLABLE',
    stub: 'CREATIVE MATERIAL, DO NOT RECYCLE',
  },
  {
    code: 'FS/PKG.02-G1',
    short: 'GRW',
    name: 'Grow',
    text: "Marca y sitio diseñados juntos: identidad propia, un sitio mediano a medida y un equipo que no deja de entregar.",
    textItalic: '',
    requests: "4 pedidos a la vez",
    items: ["Identidad de marca completa","Sitio mediano, hasta 12 páginas + CMS","Diseño 100% a medida","SEO, analítica e integraciones","Antes que Launch en la fila"],
    price: '$1,200',
    monthly: "$150/mes",
    stamp: '100% ORIGINAL AND HUMAN-MADE',
    stub: '100% ORGANIC AND HUMAN PRODUCED',
  },
  {
    code: 'FS/PKG.03-S1',
    short: 'SCL',
    name: 'Scale',
    text: "El desarrollo completo: diseño innovador, un sistema propio, IA conectada al negocio y flujos de trabajo que andan solos.",
    textItalic: '',
    requests: "6 pedidos a la vez, fila sin límite",
    items: ["Sitio completo con diseño innovador","Sistema de diseño propio","IA conectada: asistentes, contenido, soporte","Flujos automatizados e integraciones","Primero en la fila"],
    price: '$3,000',
    monthly: "$250/mes",
    stamp: 'STORED IN DIRECT ACCESS OF CLIENTS',
    stub: 'STORE IN DIRECT ACCESS OF CLIENTS',
  },
]

/** the add-on every plan can take */
export const addonCM = {"t":"Community management","price":"$1,000/mes","d":"Súmalo a cualquier plan: publicaciones, respuestas y un calendario de contenido, todas las semanas."}

export const pricingNote = {"lead":"Un equipo entero, en una persona.","text":"Diseño, código, marca y marketing de una sola persona, con agentes de IA haciendo el trabajo repetitivo para que varios pedidos avancen a la vez. Te suscribes, pides y se hace, todos los meses."}

export const contact = {
  title: '¿Listo para crecer?',
  titleItalic: 'Empecemos con una llamada.',
  text: 'Tómalo como un primer café. Nos conocemos, miro lo que tienes y te digo con honestidad lo que haría. Sin presentaciones de venta, sin compromiso.',
}

export const about = {
  intro: 'Soy Federico, diseñador, desarrollador y marketer de Argentina. Trabajo con clientes de todo el mundo a través de mi estudio, Zyneteq.',
  bio: [
    'Empecé a hacer sitios web porque me frustraba ver cuántos se parecían entre sí y no convertían a nadie. Hoy trabajo de punta a punta: estrategia, dirección de arte, código front-end y back-end, y las campañas que traen a la gente.',
    'Mis proyectos favoritos son los que unen oficio y números: una tienda que multiplica sus ventas, una marca que por fin se ve como lo que vende, una interacción que nadie vio antes.',
  ],
  facts: [
    { value: '13', label: 'Proyectos completados en Freelancer.com' },
    { value: '5.0', label: 'Calificación promedio de clientes' },
    { value: '100%', label: 'A tiempo · dentro del presupuesto' },
    { value: '+551%', label: 'Mejor resultado de crecimiento (UDS)' },
  ],
  skills: [
    { title: 'Diseño', items: ['Dirección de arte', 'UI / UX', 'Figma', 'Branding y logo', 'Motion'] },
    { title: 'Desarrollo', items: ['Astro', 'React / Next.js', 'TypeScript', 'Three.js / WebGL', 'WordPress / WooCommerce', 'Shopify', 'Flutter'] },
    { title: 'Marketing', items: ['SEO', 'Google y Meta Ads', 'Analytics', 'Community management', 'Contenido para redes', 'Landing pages', 'Email'] },
  ],
  timeline: [
    { year: '2023', title: 'Fundé Zyneteq', text: 'Una agencia verificada en Freelancer.com: 13 proyectos entregados con calificación 5.0, 100% a tiempo y dentro del presupuesto.' },
    { year: '2024', title: 'Universal Driveshafts', text: 'Me hice cargo del rediseño y el crecimiento de universaldriveshafts.com: tienda nueva, catálogo de compatibilidad y campañas.' },
    { year: '2026', title: '+551% en ventas', text: 'Las ventas de UDS crecieron 551% frente a 2024. Empecé Redesign a Day: una serie pública de rediseños funcionales para empresas reales.' },
  ],
}

export const tools = ['Astro', 'React', 'Next.js', 'TypeScript', 'Three.js', 'WebGL', 'GSAP', 'Figma', 'WordPress', 'WooCommerce', 'Shopify', 'Elementor', 'Flutter', 'Node.js', 'Google Ads', 'Meta Ads', 'Analytics']
