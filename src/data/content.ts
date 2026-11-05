/**
 * ─────────────────────────────────────────────────────────────
 *  SITE CONTENT — edit everything here. Items marked TODO are
 *  placeholders waiting for confirmation.
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  name: 'Federico Schwindt',
  firstName: 'Federico',
  lastName: 'Schwindt',
  tagline: 'Website Development, Design & Marketing',
  role: 'Designer, developer & marketer',
  agency: 'Zyneteq',
  location: 'Argentina',
  city: 'Gualeguaychú, Argentina',
  timeZone: 'America/Argentina/Buenos_Aires',
  utc: 'GMT-3',
  availability: 'Open for work',
  email: 'leonel.sch2003@gmail.com',
  year: new Date().getFullYear(),
}

export const socials = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/federico-schwindt/' },
  { label: 'GitHub', href: 'https://github.com/Federico-Schwindt' },
  { label: 'Freelancer', href: 'https://www.freelancer.com/u/kiwiapp' },
]

export const nav = [
  { label: 'Work', href: '/work/' },
  { label: 'Services', href: '/#services' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'About', href: '/about/' },
]

export const hero = {
  kicker: 'Design · Code · Marketing',
  lines: ['Websites', 'that sell.'],
  sub: 'I design, build and grow websites for businesses that care about results. One person, three disciplines, nothing lost in a hand-off.',
}

/** The red band under the hero */
export const marquee = ['Design', 'Code', 'Marketing', '+551% sales', '99 Lighthouse', 'E-commerce', 'SEO', 'Motion']

/** Proof right after the hero: one big number, three supporting facts */
export const proof = {
  value: 551,
  prefix: '+',
  suffix: '%',
  label: 'Sales growth for Universal Driveshafts after I redesigned and rebuilt their store, 2024 → 2026.',
  slug: 'universal-driveshafts',
  facts: [
    { value: '99', label: 'Lighthouse mobile performance on the new UDS store' },
    { value: '5.0', label: 'Average rating across 13 projects on Freelancer.com' },
    { value: '100%', label: 'Projects delivered on time and on budget' },
  ],
}

/** “Redesign a Day”: the public series on LinkedIn, newest first */
export const series = {
  title: 'Redesign a Day',
  text: 'A public series: every day I pick a real company and redesign its website as a working site, not a mockup. Unofficial concepts, not affiliated with the brands.',
  days: [
    { day: 3, slug: 'andreani-concept' },
    { day: 2, slug: 'la-virginia-concept' },
    { day: 1, slug: 'advancing-eco-agriculture-concept' },
  ],
}

export const process = [
  { index: '01', title: 'Discover', italic: '& strategy', text: 'Where you are, where you want to go, and what is standing in between. A clear brief before a single pixel.' },
  { index: '02', title: 'Design', italic: 'iterations', text: 'Brand, visual system and web design, crafted into something credible and built to last. No templates.' },
  { index: '03', title: 'Build', italic: '& launch', text: 'Clean, fast, maintainable code. Every interaction tuned by hand and tested on real devices.' },
  { index: '04', title: 'Grow', italic: '& support', text: 'SEO, analytics and campaigns after launch. The process bends to fit you, not the other way around.' },
]

export type Kind = 'Website' | 'E-commerce' | 'Motion'

export type Project = {
  slug: string
  /** what the project is, for the filter on /work */
  kinds: Kind[]
  title: string
  client: string
  category: string
  tags: string
  year: string
  cover: string
  url?: string
  featured?: boolean
  summary: string
  role: string[]
  stack: string[]
  stats?: { value: string; label: string }[]
  challenge?: string
  solution?: string
  result?: string
  images: string[]
  /** self-initiated concept, not client work (labelled as such everywhere) */
  concept?: boolean
  /** looping, muted film shown on the case study (and as the cover on hover) */
  video?: string
  /** Lighthouse lab measurements shown as score rings + Core Web Vitals table */
  performance?: {
    measured: string
    tool: string
    note?: string
    before?: { label: string; url?: string }
    after: { label: string; url?: string }
    runs: { device: string; before?: LighthouseRun; after: LighthouseRun }[]
  }
  /** “What I built”: alternating image / text rows */
  features?: { title: string; text: string; image?: string; stat?: string }[]
}

/** One Lighthouse run: category scores (0–100) and lab metrics (ms, bytes, counts) */
export type LighthouseRun = {
  perf: number
  a11y: number
  bp: number
  fcp: number
  lcp: number
  tbt: number
  cls: number
  si: number
  bytes: number
  reqs: number
  js: number
}

export const projects: Project[] = [
  {
    slug: 'universal-driveshafts',
    kinds: ['E-commerce', 'Website'],
    title: 'Universal Driveshafts',
    client: 'Universal Driveshafts · Odessa, FL',
    category: 'E-commerce redesign & growth',
    tags: 'Design, Code, Marketing',
    year: '2024 — 2026',
    cover: 'work/uds.jpg',
    url: 'https://dev.udshafts.com',
    featured: true,
    summary:
      'Complete redesign and rebuild of universaldriveshafts.com: a catalog of 7,500+ parts, a vehicle fitment finder, an online driveshaft builder and a wholesale flow. Sales grew 551% from 2024 to 2026.',
    role: ['Strategy', 'UX / UI design', 'Front-end & back-end', 'SEO & campaigns'],
    stack: ['Custom storefront', 'Fitment catalog', 'Cart & checkout', 'Multi-language', 'SEO', 'Google Ads', 'Analytics'],
    stats: [
      { value: '+551%', label: 'Sales growth, 2024 → 2026' },
      { value: '7,541', label: 'Parts across 44 categories' },
      { value: '4,433', label: 'Driveshafts in the vehicle finder' },
      { value: '99', label: 'Lighthouse mobile performance (was 65)' },
    ],
    challenge:
      'The original WordPress site made it hard to find the right part. Thousands of SKUs, no fitment logic and a checkout that leaked customers, in a category where buyers need the exact part, today.',
    solution:
      'A new storefront built around how mechanics actually search: by component series, by vehicle (make → year → model from the real fitment catalog) or by having a shaft built to spec. Same-day shipping, wholesale pricing and three languages on top of a fast, custom codebase.',
    result:
      'Sales up 551% between 2024 and 2026, with a catalog of 7,541 parts across 44 categories and 4,433 complete driveshafts searchable across 43 makes. The new build scores 99 on Lighthouse mobile performance and 100 on accessibility, ships 14 KB of JavaScript instead of 1.2 MB, and has zero layout shift. The site is now the company’s primary sales channel.',
    features: [
      {
        title: 'Find the driveshaft by vehicle',
        text: 'Make, year and model, straight from the fitment catalog, so only real combinations show up. Every result carries its exact part number, price and stock, across 4,433 complete driveshafts and 43 makes.',
        image: 'case/uds-vehicle.jpg',
        stat: '4,433 driveshafts · 43 makes',
      },
      {
        title: 'Online driveshaft builder',
        text: 'Pick duty, series and yokes, enter six measurements and watch the price update live. One piece or two, steel or aluminum, then the shop builds and balances it to spec.',
        image: 'case/uds-builder.jpg',
        stat: 'Live pricing as you spec it',
      },
      {
        title: 'Driveshaft designer',
        text: 'Draw the shaft, dimension it and print the sheet, or send it to the shop with the measurements attached. Free, no account needed.',
        image: 'case/uds-designer.jpg',
        stat: 'Print-ready spec sheets',
      },
      {
        title: 'Quick order & wholesale',
        text: 'Shops, drivelines and fleets type part numbers, set quantities and add everything to the cart at once. Approved trade accounts get standing discounts applied automatically at checkout.',
        image: 'case/uds-quick-order.jpg',
        stat: '7,541 parts, cross-referenced 1310–1810',
      },
      {
        title: 'Built for the shop floor',
        text: 'The finder, builder and catalog work one-handed on a phone, with a sticky price bar in the builder and the same live data as desktop. Same-day shipping on stock ordered before 2pm ET.',
        image: 'case/uds-mobile.jpg',
        stat: 'Mobile-first, same live data',
      },
    ],
    performance: {
      measured: '2026-11-05',
      tool: 'Lighthouse 12.8, the engine behind Google PageSpeed Insights (lab test, homepage)',
      before: { label: 'Original WordPress site', url: 'https://universaldriveshafts.com' },
      after: { label: 'New build', url: 'https://dev.udshafts.com' },
      note: 'Mobile simulates a mid-range phone on a slow 4G connection. SEO is not compared because the new build runs on a staging domain that blocks indexing on purpose.',
      runs: [
        { device: 'Mobile', before: { perf: 65, a11y: 87, bp: 79, fcp: 2909, lcp: 2939, tbt: 1104, cls: 0.067, si: 3466, bytes: 1613204, reqs: 164, js: 1239015 }, after: { perf: 99, a11y: 100, bp: 100, fcp: 1380, lcp: 2029, tbt: 0, cls: 0.0, si: 1919, bytes: 637439, reqs: 35, js: 14326 } },
        { device: 'Desktop', before: { perf: 84, a11y: 87, bp: 78, fcp: 1506, lcp: 2022, tbt: 42, cls: 0.057, si: 1506, bytes: 1670439, reqs: 170, js: 1238974 }, after: { perf: 100, a11y: 100, bp: 100, fcp: 331, lcp: 611, tbt: 0, cls: 0.0, si: 753, bytes: 992979, reqs: 52, js: 14326 } },
      ],
    },
    images: ['case/uds-1.jpg', 'case/uds-2.jpg', 'case/uds-3.jpg', 'case/uds-4.jpg'],
  },
  {
    slug: 'andreani-concept',
    kinds: ['Website', 'Motion'],
    title: 'Andreani',
    client: 'Self-initiated concept · not affiliated with Andreani Grupo Logístico',
    category: 'Logistics website with instant quotes and booking',
    tags: 'Concept, Web design, Code, Logistics, Motion',
    year: '2026',
    cover: 'work/andreani.jpg',
    url: 'https://federico-schwindt.github.io/Andreani-Redesign-Concept/',
    featured: true,
    concept: true,
    video: 'media/andreani.mp4',
    summary:
      'An unsolicited, Spanish-language redesign for Andreani, Argentina’s largest logistics network (54.6 million shipments a year). An opening animation built from the real truck livery, a six-step quote-and-book flow that ends in a printed label with a working QR code, live tracking, and a finder with 291 real branches.',
    role: ['Research & concept', 'Art direction', 'UX / UI design', 'Front-end development', 'Motion (AI-assisted)'],
    stack: ['Astro', 'TypeScript', 'GSAP + ScrollTrigger', 'Lenis', 'Andreani public API', 'Georef API (open data)', 'Higgsfield (Kling 3.0)', 'GPT Image', 'GitHub Pages'],
    stats: [
      { value: '89', label: 'Lighthouse mobile performance (was 7)' },
      { value: '10.6×', label: 'Faster main content on a phone' },
      { value: '291', label: 'Real branches with opening hours' },
      { value: '6 steps', label: 'From route to printed label' },
    ],
    challenge:
      'Andreani moves 54.6 million shipments a year and turned 80, but its website asks you to log in before you can send anything, and the company’s scale, history and network barely show. On a phone, the homepage downloaded 5.6 MB and its main content took almost 29 seconds to appear. How do you make sending a package feel as fast as the network behind it?',
    solution:
      'A bold system drawn from the brand: the expanded italic of the logo, the Andreani red, packing tape and shipping labels. The site opens with the real livery: a truck rolls in, boxes load, the camera dives into one and its flaps open onto the homepage. The quote flow borrows the best of digital freight companies: prices in seconds with no sign-up, live re-pricing, bulk upload by CSV, the nearest real branches with their hours, and a label that prints on screen with a QR code that opens the tracking page for that same shipment. Every town in Argentina autocompletes through the government’s open geodata.',
    result:
      'A static Astro build with seven pages: 89 Lighthouse performance and 100 accessibility on mobile for the homepage (the current site scores 7 and 86), and 98/100 on the branch finder. The homepage downloads 431 KB instead of 5.6 MB, in 14 requests instead of 109. A Spanish pitch page presents it to the Andreani team with a before-and-after slider, the measurements and a plan to build it on the tools they already use.',
    features: [
      {
        title: 'An opening that loads the truck',
        text: 'The real livery, drawn in SVG: the trailer rolls in, 24 boxes load front to back, the camera dives into one and its flaps open onto the homepage. Pure CSS and the Web Animations API, shown once per session and skipped with reduced motion.',
        image: 'case/an-loader.jpg',
        stat: 'Shown once per session',
      },
      {
        title: 'Prices in seconds, no sign-up',
        text: 'Parcels, envelopes, wine or pallets in rows or from a CSV with up to 50 boxes. Origin and destination autocomplete every town in the country, the route draws itself on the map, and Standard and Priority prices recalculate live as you change anything.',
        image: 'case/an-quote.jpg',
        stat: 'Live re-pricing',
      },
      {
        title: 'From route to label in six steps',
        text: 'Boxes, origin, destination, contact, payment and label. The nearest three real branches appear with distance and hours while the map zooms in, and the label prints on screen with a sorting code and a QR that opens its own tracking page.',
        image: 'case/an-label.jpg',
        stat: 'Scan the QR, track the package',
      },
      {
        title: 'The network, on one map',
        text: '291 branches from Andreani’s public API, searchable by town, postcode or proximity, with filters, opening hours and directions. The map zooms to the results.',
        image: 'case/an-finder.jpg',
        stat: '98 Lighthouse performance',
      },
      {
        title: 'A pitch with the numbers',
        text: 'A Spanish proposal page with a draggable before-and-after, Lighthouse results for two pages, the quote flow explained step by step and a plan to integrate with their current CMS and APIs.',
        image: 'case/an-pitch.jpg',
        stat: '10.6× faster main content',
      },
    ],
    performance: {
      measured: '2026-11-05',
      tool: 'Lighthouse 12.8.2, the engine behind Google PageSpeed Insights (lab test, mobile)',
      before: { label: 'Current site', url: 'https://www.andreani.com' },
      after: { label: 'Redesign', url: 'https://federico-schwindt.github.io/Andreani-Redesign-Concept/' },
      note: 'Mobile simulates a mid-range phone on a slow 4G connection. SEO is not compared because the concept blocks indexing on purpose.',
      runs: [
        { device: 'Homepage', before: { perf: 7, a11y: 86, bp: 75, fcp: 10086, lcp: 28881, tbt: 3075, cls: 0.396, si: 14057, bytes: 5596644, reqs: 109, js: 5261213 }, after: { perf: 89, a11y: 100, bp: 100, fcp: 1650, lcp: 2737, tbt: 23, cls: 0.001, si: 6753, bytes: 431250, reqs: 14, js: 70809 } },
        { device: 'Branch finder', before: { perf: 23, a11y: 82, bp: 68, fcp: 5041, lcp: 24132, tbt: 3016, cls: 0.121, si: 13273, bytes: 3002585, reqs: 93, js: 2596271 }, after: { perf: 98, a11y: 100, bp: 100, fcp: 1230, lcp: 2280, tbt: 4, cls: 0, si: 1471, bytes: 298479, reqs: 11, js: 23813 } },
      ],
    },
    images: ['case/an-1.jpg', 'case/an-2.jpg', 'case/an-3.jpg', 'case/an-4.jpg'],
  },
  {
    slug: 'la-virginia-concept',
    kinds: ['Website', 'Motion'],
    title: 'La Virginia',
    client: 'Self-initiated concept · not affiliated with Cafés La Virginia S.A.',
    category: 'Tea & coffee brand website with wholesale ordering',
    tags: 'Concept, Web design, Code, B2B, Motion',
    year: '2026',
    cover: 'work/lavirginia.jpg',
    url: 'https://federico-schwindt.github.io/La-Virginia-Redesign/',
    featured: true,
    concept: true,
    video: 'media/lavirginia.mp4',
    summary:
      'An unsolicited, Spanish-language redesign of the tea and coffee brand of La Virginia, a Rosario company founded in 1915. A modern-classic site built on the real catalog (62 products with their sensory notes), a wholesale order request instead of a shop, and a pitch page with measured before-and-after results.',
    role: ['Research & concept', 'Art direction', 'UX / UI design', 'Front-end development', 'Motion (AI-assisted)'],
    stack: ['Astro', 'TypeScript', 'Motion', 'View Transitions API', 'WooCommerce Store API', 'sharp', 'Higgsfield (Kling 3.0)', 'GPT Image', 'GitHub Pages'],
    stats: [
      { value: '95', label: 'Lighthouse mobile performance (was 30)' },
      { value: '3.6×', label: 'Faster main content on a phone' },
      { value: '62', label: 'Real products with sensory notes' },
      { value: '32 KB', label: 'JavaScript (was 1.5 MB)' },
    ],
    challenge:
      'La Virginia has been on Argentine tables for more than a century, but its website shows no prices and gives shops and distributors no clear way to order. On a phone, the main content took about 8 seconds to appear. How do you keep the character of a 1915 brand and still make the site fast, clear and commercially useful?',
    solution:
      'A modern-classic system drawn from the brand itself: the Virginia blue, the logo’s gold kept for actions, the arched windows of Rosario’s classical facades as the frame for every image, and Fraunces paired with Hanken Grotesk. Five short AI-generated films were rendered on the exact brand blue so they blend into the page. Because there are no public prices, the cart became a wholesale request (company, tax ID, trade, province). The catalog syncs from the existing WooCommerce store, including each product’s color, flavor, aroma and intensity, so the team would not need to migrate anything.',
    result:
      'A static Astro build with 72 pages: 95 Lighthouse performance and 100 accessibility on mobile for the homepage (the current site scores 30 and 91), and 100/100 on a product page. The homepage downloads 862 KB instead of 3 MB, in 26 requests instead of 150. A Spanish pitch page presents it to the La Virginia team with a before-and-after slider, the measurements and an implementation plan.',
    features: [
      {
        title: 'The real catalog, by line',
        text: 'Tea, herbal blends and coffee, synced from the brand’s WooCommerce store with optimized images. A sticky filter bar switches lines with native View Transitions, and search works as you type.',
        image: 'case/lv-catalog.jpg',
        stat: '62 products · 15 lines',
      },
      {
        title: 'Sensory spec sheet',
        text: 'Color, flavor, aroma and an intensity meter for every product that publishes them, plus pack sizes and claims. The product card morphs into its detail page as you click.',
        image: 'case/lv-spec.jpg',
        stat: 'Color · flavor · aroma · intensity',
      },
      {
        title: 'Wholesale order request',
        text: 'Grocers, cafés and distributors add products by pack size, then send one request with their company name, tax ID, trade and province. It would land in the sales team’s inbox or CRM.',
        image: 'case/lv-b2b.jpg',
        stat: 'Built for shops, not checkouts',
      },
      {
        title: 'A pitch that shows the difference',
        text: 'A Spanish proposal page with a draggable before-and-after, Lighthouse results counting from the current site’s value to the new one, the design rationale and a no-migration implementation plan.',
        image: 'case/lv-pitch.jpg',
        stat: '3.6× faster main content',
      },
      {
        title: 'Phone first',
        text: 'Product and action on the first screen, thumb-sized controls and films that only load when they scroll into view. Every page passes Lighthouse accessibility at 100.',
        image: 'case/lv-mobile.jpg',
        stat: '32 KB of JavaScript',
      },
    ],
    performance: {
      measured: '2026-11-05',
      tool: 'Lighthouse 12.8.2, the engine behind Google PageSpeed Insights (lab test, mobile)',
      before: { label: 'Current site', url: 'https://www.lavirginia.com.ar' },
      after: { label: 'Redesign', url: 'https://federico-schwindt.github.io/La-Virginia-Redesign/' },
      note: 'Mobile simulates a mid-range phone on a slow 4G connection. SEO is not compared because the concept blocks indexing on purpose.',
      runs: [
        { device: 'Homepage', before: { perf: 30, a11y: 91, bp: 57, fcp: 6074, lcp: 8251, tbt: 1599, cls: 0, si: 12279, bytes: 3173143, reqs: 150, js: 1545128 }, after: { perf: 95, a11y: 100, bp: 100, fcp: 1455, lcp: 2280, tbt: 0, cls: 0, si: 4754, bytes: 882395, reqs: 26, js: 32513 } },
        { device: 'Product page', before: { perf: 35, a11y: 83, bp: 57, fcp: 6076, lcp: 8208, tbt: 1194, cls: 0.0, si: 7040, bytes: 2622791, reqs: 157, js: 1552859 }, after: { perf: 100, a11y: 100, bp: 100, fcp: 1132, lcp: 1680, tbt: 0, cls: 0, si: 2300, bytes: 351295, reqs: 15, js: 31951 } },
      ],
    },
    images: ['case/lv-1.jpg', 'case/lv-2.jpg', 'case/lv-3.jpg', 'case/lv-4.jpg'],
  },
  {
    slug: 'advancing-eco-agriculture-concept',
    kinds: ['E-commerce', 'Website', 'Motion'],
    title: 'Advancing Eco Agriculture',
    client: 'Self-initiated concept · not affiliated with AEA',
    category: 'Regenerative-agriculture website & storefront',
    tags: 'Concept, Web design, Code, E-commerce, Motion',
    year: '2026',
    cover: 'work/aea.jpg',
    url: 'https://federico-schwindt.github.io/Advancing-Eco-Agriculture-Website/',
    featured: true,
    concept: true,
    video: 'media/aea.mp4',
    summary:
      'An unsolicited redesign of advancingecoag.com, built as a working site rather than a mockup: a scroll-driven dive from the crop canopy into the root zone, an interactive Plant Health Pyramid, and a storefront running on the real catalog (42 products, 191 sizes and prices) that can hand carts to the brand’s existing WooCommerce checkout.',
    role: ['Concept & strategy', 'Art direction', 'UX / UI design', 'Front-end development', 'Motion (AI-assisted)'],
    stack: ['Astro', 'TypeScript', 'GSAP + ScrollTrigger', 'Lenis', 'WooCommerce Store API', 'Higgsfield (FLUX 3 Video)', 'GPT Image', 'GitHub Pages'],
    stats: [
      { value: '95', label: 'Lighthouse performance (mobile)' },
      { value: '100', label: 'Lighthouse accessibility' },
      { value: '191', label: 'Real sizes & prices, synced from WooCommerce' },
      { value: '62', label: 'Pre-rendered pages' },
    ],
    challenge:
      'AEA’s science is remarkable (plant immunity, sap analysis, soil biology) but hard to feel through a screen, and the store has to respect state-by-state fertilizer rules. Could a regenerative-agriculture brand’s website feel as alive as the soil it talks about, and still load fast for growers on rural connections?',
    solution:
      'Story before catalog. The homepage scrubs a film from the crop canopy down into the roots as you scroll, with a live depth gauge and chapters on exudates, microbes and fungal networks. The Plant Health Pyramid becomes interactive, with mineral “periodic table” tiles. The shop uses the real catalog with per-size pricing, a state selector that swaps in state-registered formulations, a slide-out cart and a demo checkout; one setting hands the cart to the existing WooCommerce checkout through shareable checkout links, so no store migration is needed.',
    result:
      'A static Astro build with 62 pre-rendered pages, about 8.5 KB of global JavaScript and video that only loads after first paint: 95 Lighthouse performance and 97–100 accessibility on mobile. Built as a working proposal for the AEA team, with a first-visit disclaimer making clear it is an unofficial concept.',
    images: ['case/aea-1.jpg', 'case/aea-2.jpg', 'case/aea-3.jpg', 'case/aea-4.jpg'],
  },
  {
    slug: 'certified-retail-cars',
    kinds: ['Website'],
    title: 'Certified Retail Cars',
    client: 'Certified Retail · Israel',
    category: 'Car dealer website',
    tags: 'Design, WordPress',
    year: '2024',
    cover: 'work/certified.jpg',
    featured: true,
    summary:
      'Website for a multi-brand car dealer: a filterable inventory of every vehicle in stock, a page per car with gallery and specs, and a contact page with a map and every way to get in touch.',
    role: ['Web design', 'WordPress development', 'Inventory structure'],
    stack: ['WordPress', 'Elementor', 'Filterable listings', 'Maps integration'],
    challenge:
      'Buyers compare dozens of cars before they pick up the phone. The inventory had to be browsable by brand, price and year, and every car needed a page that answers the questions a buyer has before visiting the lot.',
    solution:
      'A dynamic listing with filters by make, model, price and year; a page per car with gallery, overview and feature list; a home page that surfaces the latest arrivals; and a contact page with location tools, a form and direct call, email and WhatsApp buttons.',
    images: ['case/certified-1.jpg', 'case/certified-2.jpg', 'case/certified-3.jpg', 'case/certified-4.jpg'],
  },
  {
    slug: 'mirage-tlv',
    kinds: ['Website'],
    title: 'Mirage TLV',
    client: 'Mirage · Tel Aviv',
    category: 'Spa website & booking',
    tags: 'Design, WordPress',
    year: '2024',
    cover: 'work/mirage.jpg',
    featured: true,
    summary:
      'Website for a luxury spa in Tel Aviv: an immersive, photography-led home page, a menu of massages and treatments, and an appointment page that turns visitors into bookings.',
    role: ['Art direction', 'Web design', 'WordPress development'],
    stack: ['WordPress', 'Elementor', 'Appointment form', 'Responsive'],
    challenge:
      'A spa sells an atmosphere. The site had to feel as calm and premium as the place itself while still making it easy to see the treatments, read what each one includes and book a slot from a phone.',
    solution:
      'Full-bleed imagery and a warm, muted palette set the mood. A treatments catalogue with descriptions and durations does the explaining, and one appointment page with a short form and a click-to-call number closes the loop.',
    images: ['case/mirage-1.jpg', 'case/mirage-2.jpg', 'case/mirage-3.jpg', 'case/mirage-4.jpg'],
  },
  {
    slug: 'minrat-projects',
    kinds: ['Website'],
    title: 'Minrat Projects',
    client: 'Minrat Projects Ltd. · Israel',
    category: 'Architecture & finishing portfolio',
    tags: 'Design, WordPress, RTL',
    year: '2024',
    cover: 'work/minrat.jpg',
    featured: true,
    summary:
      'Portfolio website for a company that designs and executes high-end finishing work for showrooms, offices and car centres: a project archive on custom post types, service pages and the company story, all in Hebrew and right-to-left.',
    role: ['Web design', 'WordPress development', 'Custom post types', 'RTL layout'],
    stack: ['WordPress', 'Elementor', 'Custom post types', 'RTL / Hebrew', 'Responsive'],
    challenge:
      'The work is visual and varied. Minrat needed a site that shows finished spaces at full size, lets the team publish new projects without a developer, and reads correctly in Hebrew on every screen.',
    solution:
      'Every project is a custom post type with its own gallery, category and location, so the archive and project pages build themselves. Service pages explain what the company does, an about page tells the story with key figures, and the contact page carries a map and a form.',
    images: ['case/minrat-1.jpg', 'case/minrat-2.jpg', 'case/minrat-3.jpg', 'case/minrat-4.jpg'],
  },
  {
    slug: 'joya-hijab',
    kinds: ['E-commerce'],
    title: 'Joya Hijab',
    client: 'Joya · Israel',
    category: 'WooCommerce store',
    tags: 'Design, WooCommerce',
    year: '2024',
    cover: 'work/joya.jpg',
    url: 'https://joyahijab.com',
    summary:
      'A right-to-left WooCommerce store for a hijab and modest-fashion brand: editorial photography, clean product grids and a checkout tuned for mobile.',
    role: ['Web design', 'WooCommerce development', 'RTL layout'],
    stack: ['WordPress', 'WooCommerce', 'Elementor', 'RTL / Arabic'],
    challenge: 'Sell a premium, image-led product in Arabic with a store that still feels fast and effortless on a phone.',
    solution: 'A minimal, photography-first layout with a fully right-to-left interface, simplified navigation and a two-step checkout.',
    images: ['case/joya-1.jpg', 'case/joya-2.jpg'],
  },
  {
    slug: 'velocity-motors-concept',
    kinds: ['Website', 'Motion'],
    title: 'Velocity Motors',
    client: 'Self-initiated concept',
    category: 'Car dealer website & launch spot',
    tags: 'Concept, Web design, Motion',
    year: '2026',
    cover: 'work/velocity.jpg',
    concept: true,
    video: 'media/velocity.mp4',
    summary:
      'A concept website and five-second launch spot for a premium car dealership: inventory search above the fold, financing and trade-in one click away, and a film that sells the showroom before the first visit.',
    role: ['Art direction', 'Web design', 'Motion (AI-assisted)'],
    stack: ['Figma', 'Higgsfield (Kling 3.0)', 'GPT Image', 'WordPress-ready layout'],
    challenge: 'Dealer websites look alike: a slider, a phone number and a list of cars. The concept asks how a dealer can feel premium while still putting the search box first.',
    solution:
      'A dark, high-contrast layout where the search (make, model, price) is the hero, trust signals sit directly under it, and a short cinematic spot with red light streaks gives the brand a recognisable motion signature for ads and social.',
    images: ['case/velocity-1.jpg', 'case/velocity-film.jpg'],
  },
  {
    slug: 'brasa-coffee-concept',
    kinds: ['E-commerce', 'Motion'],
    title: 'Brasa Coffee',
    client: 'Self-initiated concept',
    category: 'E-commerce & product motion',
    tags: 'Concept, E-commerce, Motion',
    year: '2026',
    cover: 'work/brasa.jpg',
    concept: true,
    video: 'media/brasa.mp4',
    summary:
      'A concept online store for a small-batch coffee roaster, with a matching product film: warm palette, three hero products with prices on the first screen, subscriptions one click away.',
    role: ['Art direction', 'E-commerce design', 'Product motion (AI-assisted)'],
    stack: ['Figma', 'Higgsfield (Kling 3.0)', 'GPT Image', 'Shopify / WooCommerce-ready'],
    challenge: 'Coffee shoppers buy on smell and story, neither of which travels through a screen.',
    solution: 'Show the product and the price immediately, keep the copy short and sensory, and use a slow-motion product film (beans falling, steam rising) as the hero and as ad creative.',
    images: ['case/brasa-1.jpg', 'case/brasa-film.jpg'],
  },
  {
    slug: 'atelier-norte-concept',
    kinds: ['Website', 'Motion'],
    title: 'Atelier Norte',
    client: 'Self-initiated concept',
    category: 'Architecture studio website & film',
    tags: 'Concept, Web design, Motion',
    year: '2026',
    cover: 'work/atelier.jpg',
    concept: true,
    video: 'media/atelier.mp4',
    summary:
      'A concept website for an architecture studio: a Swiss editorial grid, a serif headline, a project index instead of a carousel, and a slow film of light moving through a concrete interior.',
    role: ['Art direction', 'Web design', 'Motion (AI-assisted)'],
    stack: ['Figma', 'Higgsfield (Kling 3.0)', 'GPT Image', 'Custom code'],
    challenge: 'Architects sell restraint. The site has to step back and let the work speak while still being easy to navigate on a phone.',
    solution: 'Generous whitespace, one strong photograph per project, a text index for fast scanning and a looping film on the home page that shows space and light the way a still image cannot.',
    images: ['case/atelier-1.jpg', 'case/atelier-film.jpg'],
  },
  {
    slug: 'nova-dental-concept',
    kinds: ['Website'],
    title: 'Nova Dental',
    client: 'Self-initiated concept',
    category: 'Clinic website with online booking',
    tags: 'Concept, Web design',
    year: '2026',
    cover: 'work/nova.jpg',
    concept: true,
    summary:
      'A concept website for a dental clinic built around one action: booking an appointment. A three-step booking widget (treatment, date, confirm) sits on the home page, on tablet and phone alike.',
    role: ['UX', 'Web design'],
    stack: ['Figma', 'GPT Image', 'WordPress + booking plugin'],
    challenge: 'Patients are anxious and busy. Every extra click between landing on the site and booking is a lost appointment.',
    solution: 'A calm teal and white palette, friendly photography, and a booking flow that is visible without scrolling and finishes in three steps.',
    images: ['case/nova-1.jpg'],
  },
  {
    slug: 'motion-ident-concept',
    kinds: ['Motion'],
    title: 'Motion Ident',
    client: 'Self-initiated concept',
    category: 'Brand motion graphics',
    tags: 'Concept, Motion',
    year: '2026',
    cover: 'work/motion-loop.jpg',
    concept: true,
    video: 'media/motion-loop.mp4',
    summary: 'A five-second brand ident: red geometric shapes glide and snap into an emblem, the kind of motion signature that opens a reel, a product video or an ad.',
    role: ['Motion direction (AI-assisted)'],
    stack: ['Higgsfield (Kling 3.0)', 'After Effects'],
    images: ['case/motion-loop-film.jpg'],
  },
]

export const workIntro = 'Thoughtful design, careful code, and numbers to show for it.'

/** What I build: keyword-rich, one card per service (also feeds the Services JSON-LD). */
export const services = [
  {
    slug: 'business-websites',
    title: 'Business websites',
    italic: 'that bring in calls',
    text: 'Fast, custom-designed websites for small and medium businesses: clinics, studios, consultants, restaurants. Built on WordPress or custom code, ready for Google from day one.',
    tags: ['WordPress', 'Custom code', 'Copywriting'],
  },
  {
    slug: 'ecommerce',
    title: 'E-commerce stores',
    italic: 'that sell',
    text: 'WooCommerce and Shopify stores with clean product pages, fast checkout, payments and shipping set up, and analytics that tell you what sells. Right-to-left and multi-language stores included.',
    tags: ['WooCommerce', 'Shopify', 'Payments'],
  },
  {
    slug: 'car-dealer-websites',
    title: 'Car dealer & inventory sites',
    italic: 'buyers can search',
    text: 'Filterable vehicle inventory, a page per car with gallery and specs, finance and trade-in enquiries, WhatsApp and call buttons. The same playbook works for real estate and rentals.',
    tags: ['Inventory', 'Filters', 'Lead forms'],
  },
  {
    slug: 'landing-pages',
    title: 'Landing pages',
    italic: 'for your ads',
    text: 'One page, one goal. Landing pages for Google and Meta campaigns with a clear offer, social proof and a form that lands straight in your inbox.',
    tags: ['Conversion', 'A/B tests', 'Forms'],
  },
  {
    slug: 'seo-ads',
    title: 'SEO & Google Ads',
    italic: 'so people find you',
    text: 'Technical SEO, local SEO, Google Business Profile, keyword research and Google Ads management. Monthly reports in plain language, not vanity metrics.',
    tags: ['SEO', 'Google Ads', 'Analytics'],
  },
  {
    slug: 'motion-content',
    title: 'Motion & content',
    italic: 'that stops the scroll',
    text: 'Motion graphics, product videos and social content for launches and ads, produced with a mix of classic motion design and AI tools.',
    tags: ['Motion', 'Video', 'Social'],
  },
]

/** Free website audit: the main lead magnet. */
export const audit = {
  kicker: 'Free website audit',
  title: 'Is your website',
  titleItalic: 'losing you clients?',
  text: 'Send me your URL. Within 48 hours you get a short, honest review: what slows it down, what Google sees, and the three changes that would bring you more enquiries. Free, no strings attached.',
  points: ['Speed & Core Web Vitals', 'SEO & Google visibility', 'Conversion: forms, calls, WhatsApp'],
}

export const faq = [
  {
    q: 'How much does a website cost?',
    a: 'Packages start at $300 setup plus $50/month (Launch), $500 plus $80/month (Grow) and $750 plus $100/month (Scale). The monthly plan covers hosting, maintenance, security updates and small changes, so you never pay for a rebuild because the site was left to rot.',
  },
  {
    q: 'How long does it take?',
    a: 'A Launch site usually goes live in one to two weeks. Grow and Scale projects take two to six weeks depending on content, integrations and the size of the catalogue.',
  },
  {
    q: 'What is included in the monthly plan?',
    a: 'Hosting, SSL, backups, plugin and security updates, uptime monitoring, and a set amount of small content changes every month. Higher plans add SEO and reporting.',
  },
  {
    q: 'Do you work with clients outside Argentina?',
    a: 'Yes. My clients so far are in the United States, Israel, Australia and India. I work remotely in English and Spanish, with calls in your time zone.',
  },
  {
    q: 'Can you redesign my existing website?',
    a: 'Yes. Redesigns are often the best return: Universal Driveshafts grew sales by 551% after its rebuild. I keep your URLs and rankings safe during the move.',
  },
  {
    q: 'WordPress, Shopify or custom code?',
    a: 'Whatever fits the business. WordPress and WooCommerce for most business sites and stores, Shopify when you want the simplest store to run, and custom code (React, Node) when performance or a unique experience matters.',
  },
]

// Setup price, then a monthly fee (hosting, maintenance, updates).
export const packages = [
  {
    code: 'FS/PKG.01-L1',
    short: 'LCH',
    name: 'Launch',
    text: 'Your first serious presence: a sharp, credible site built to go live fast and convert from day one.',
    textItalic: 'launch fast',
    items: ['1–3 pages', 'Custom visual direction', 'Conversion-focused layout', 'WordPress or custom code'],
    price: '$300',
    monthly: '$50/month',
    stamp: 'IDEAS ARE NOT RECYCLABLE',
    stub: 'CREATIVE MATERIAL, DO NOT RECYCLE',
  },
  {
    code: 'FS/PKG.02-G1',
    short: 'GRW',
    name: 'Grow',
    text: 'You already have traction. Now we remove friction: a structured site with a CMS, a brand system and the integrations your sales need.',
    textItalic: 'remove friction',
    items: ['5–8 pages + CMS', 'Complete brand identity', 'Integrations & automations', 'SEO setup & analytics'],
    price: '$500',
    monthly: '$80/month',
    stamp: '100% ORIGINAL AND HUMAN-MADE',
    stub: '100% ORGANIC AND HUMAN PRODUCED',
  },
  {
    code: 'FS/PKG.03-S1',
    short: 'SCL',
    name: 'Scale',
    text: 'At scale, rough edges cost revenue. A system that keeps growing with you: e-commerce, design system, campaigns.',
    textItalic: 'cost revenue',
    items: ['10+ pages + CMS', 'E-commerce & catalog', 'Design system', 'Paid campaigns & reporting'],
    price: '$750',
    monthly: '$100/month',
    stamp: 'STORED IN DIRECT ACCESS OF CLIENTS',
    stub: 'STORE IN DIRECT ACCESS OF CLIENTS',
  },
]

export const pricingNote = {
  lead: 'Quality is not a package option.',
  text: 'Every project is responsive, performance-optimised, cross-browser tested, SEO-ready, accessible and built on a clean architecture, whatever the tier.',
}

export const contact = {
  title: 'Ready to grow?',
  titleItalic: 'Let’s start with a call.',
  text: 'Treat it like a first coffee. We get to know each other, I look at what you have, and I tell you honestly what I would do. No pitch deck, no obligations.',
}

export const about = {
  intro: 'I’m Federico, a designer, developer and marketer from Argentina, working with clients worldwide through my studio, Zyneteq.',
  bio: [
    'I started building websites because I was frustrated by how many of them looked the same and converted nobody. Today I work end-to-end: strategy, art direction, front-end and back-end code, and the campaigns that bring people in.',
    'My favourite projects are the ones where craft meets numbers: a store that multiplies its sales, a brand that finally looks like what it sells, an interaction nobody has seen before.',
  ],
  facts: [
    { value: '13', label: 'Projects completed on Freelancer.com' },
    { value: '5.0', label: 'Average client rating' },
    { value: '100%', label: 'On time · on budget' },
    { value: '+551%', label: 'Best growth result (UDS)' },
  ],
  skills: [
    { title: 'Design', items: ['Art direction', 'UI / UX', 'Figma', 'Branding & logo', 'Motion'] },
    { title: 'Development', items: ['Astro', 'React / Next.js', 'TypeScript', 'Three.js / WebGL', 'WordPress / WooCommerce', 'Shopify', 'Flutter'] },
    { title: 'Marketing', items: ['SEO', 'Google & Meta Ads', 'Analytics', 'Landing pages', 'Email'] },
  ],
  timeline: [
    { year: '2023', title: 'Founded Zyneteq', text: 'A verified agency on Freelancer.com: 13 projects delivered with a 5.0 rating, 100% on time and on budget.' },
    { year: '2024', title: 'Universal Driveshafts', text: 'Took over the redesign and growth of universaldriveshafts.com: new storefront, fitment catalog and campaigns.' },
    { year: '2026', title: '+551% sales', text: 'UDS sales up 551% versus 2024. Started Redesign a Day: a public series of working redesigns for real companies.' },
  ],
}

export const tools = ['Astro', 'React', 'Next.js', 'TypeScript', 'Three.js', 'WebGL', 'GSAP', 'Figma', 'WordPress', 'WooCommerce', 'Shopify', 'Elementor', 'Flutter', 'Node.js', 'Google Ads', 'Meta Ads', 'Analytics']
