/**
 * ─────────────────────────────────────────────────────────────
 *  SITE CONTENT-edit everything here. Items marked TODO are
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
  { label: 'About', href: '/about/' },
]

export const hero = {
  kicker: 'Design · Code · Marketing',
  lines: ['Websites', 'that sell.'],
  sub: 'I design, build and grow websites for businesses that care about results. One person, three disciplines, nothing lost in a hand-off.',
}

/** The red band under the hero */
export const marquee = ['Design', 'Code', 'Marketing', '+551% sales', '99 Lighthouse', 'E-commerce', 'SEO', 'Motion', '3D renders']

/** Proof right after the hero: one big number, three supporting facts */
export const proof = {
  value: 551,
  prefix: '+',
  suffix: '%',
  label: 'Sales growth for Universal Driveshafts after I redesigned and rebuilt their store, 2024 → 2026.',
  slug: 'universal-driveshafts',
  facts: [
    { value: '99', label: 'Lighthouse desktop performance on the live UDS store' },
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

export type Kind = 'Website' | 'E-commerce' | 'Motion' | '3D'

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

/** One Lighthouse run: category scores (0-100) and lab metrics (ms, bytes, counts) */
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
    year: '2024-2026',
    cover: 'work/uds.jpg',
    url: 'https://universaldriveshafts.com',
    featured: true,
    summary:
      'Complete redesign and rebuild of universaldriveshafts.com, now live: a catalog of 7,500+ parts, a vehicle fitment finder, an online driveshaft builder and a wholesale flow. Sales grew 551% from 2024 to 2026.',
    role: ['Strategy', 'UX / UI design', 'Front-end & back-end', 'SEO & campaigns'],
    stack: ['Custom storefront', 'Fitment catalog', 'Cart & checkout', 'Multi-language', 'SEO', 'Google Ads', 'Analytics'],
    stats: [
      { value: '+551%', label: 'Sales growth, 2024 → 2026' },
      { value: '7,541', label: 'Parts across 44 categories' },
      { value: '4,433', label: 'Driveshafts in the vehicle finder' },
      { value: '99', label: 'Lighthouse desktop performance on the live store (was 84)' },
    ],
    challenge:
      'The original WordPress site made it hard to find the right part. Thousands of SKUs, no fitment logic and a checkout that leaked customers, in a category where buyers need the exact part, today.',
    solution:
      'A new storefront built around how mechanics actually search: by part or OEM number, by component series, by vehicle (make → year → model from the real fitment catalog) or by having a shaft built to spec. An app-style layout keeps the whole catalog one tap away in a side menu, with a driveline tech’s phone and WhatsApp always in reach. Same-day shipping, wholesale pricing and five languages on top of a fast, custom codebase.',
    result:
      'Sales up 551% between 2024 and 2026, with a catalog of 7,541 parts across 44 categories and 4,433 complete driveshafts searchable across 41 makes. The live store scores 99 on Lighthouse desktop performance and 100 on accessibility and SEO, with zero layout shift. Its own code ships about 22 KB of JavaScript, against 1.2 MB on the old WordPress site; the rest is the Google and Meta tags behind the ad campaigns. The site is now the company’s primary sales channel.',
    features: [
      {
        title: 'Find the driveshaft by vehicle',
        text: 'Make, year and model, straight from the fitment catalog, so only real combinations show up. Start from the home page or pick the make by its logo, and every result carries its exact part number, price and stock.',
        image: 'case/uds-vehicle.jpg',
        stat: '4,433 driveshafts · 41 makes',
      },
      {
        title: 'Online driveshaft builder',
        text: 'One question at a time, each with a drawing: what the shaft connects to at the transmission and the axle, u-joint series, tube material, yokes and measurements, plus an optional critical-speed check. The price updates live, then the shop builds and balances it to spec.',
        image: 'case/uds-builder.jpg',
        stat: 'Live pricing as you spec it',
      },
      {
        title: 'Driveshaft designer',
        text: 'Choose a one-piece or two-piece style from dimensioned drawings, fill in the sections and measurements, then print the sheet or send it to the shop. Free, no account needed.',
        image: 'case/uds-designer.jpg',
        stat: 'Print-ready spec sheets',
      },
      {
        title: 'Quick order & wholesale',
        text: 'Shops, drivelines and fleets type part numbers with live suggestions, set quantities and add everything to the cart at once. Category pages work the same way: a filterable table by series, brand and style, with cap size and width per row and an Add button on each line. Approved trade accounts get standing discounts at checkout.',
        image: 'case/uds-quick-order.jpg',
        stat: '7,541 parts, cross-referenced 1310-1810',
      },
      {
        title: 'Built for the shop floor',
        text: 'The finder, builder and catalog work one-handed on a phone, with a sticky Add to cart bar on every part and the same live data as desktop. Product pages estimate delivery by ZIP code and show cross-references, alternatives and what other customers bought.',
        image: 'case/uds-mobile.jpg',
        stat: 'Mobile-first, same live data',
      },
    ],
    performance: {
      measured: '2026-11-16',
      tool: 'Lighthouse 12.8, the engine behind Google PageSpeed Insights (lab test, homepage)',
      before: { label: 'Original WordPress site (Nov 5, 2026)' },
      after: { label: 'Live store (Nov 16, 2026)', url: 'https://universaldriveshafts.com' },
      note: 'Mobile simulates a mid-range phone on a slow 4G connection. The live store loads Google Analytics, Google Ads and the Meta Pixel for the campaigns: about 570 KB of the JavaScript below and most of the mobile blocking time. The store’s own code is about 22 KB.',
      runs: [
        { device: 'Mobile', before: { perf: 65, a11y: 87, bp: 79, fcp: 2909, lcp: 2939, tbt: 1104, cls: 0.067, si: 3466, bytes: 1613204, reqs: 164, js: 1239015 }, after: { perf: 77, a11y: 100, bp: 79, fcp: 2273, lcp: 3245, tbt: 536, cls: 0.0, si: 2273, bytes: 1400819, reqs: 52, js: 605630 } },
        { device: 'Desktop', before: { perf: 84, a11y: 87, bp: 78, fcp: 1506, lcp: 2022, tbt: 42, cls: 0.057, si: 1506, bytes: 1670439, reqs: 170, js: 1238974 }, after: { perf: 99, a11y: 100, bp: 78, fcp: 535, lcp: 676, tbt: 69, cls: 0.0, si: 635, bytes: 1400803, reqs: 52, js: 605638 } },
      ],
    },
    images: ['case/uds-1.jpg', 'case/uds-2.jpg', 'case/uds-3.jpg', 'case/uds-4.jpg'],
  },
  {
    slug: 'uds-3d-driveshafts',
    kinds: ['3D', 'Motion'],
    title: 'UDS Product Studio',
    client: 'Universal Driveshafts · Odessa, FL',
    category: '3D driveshaft renders & motion',
    tags: '3D modeling, Rendering, Motion',
    year: '2026',
    cover: 'work/uds-3d.jpg',
    video: 'media/uds-3d.mp4',
    featured: true,
    summary:
      'Complete driveshafts modeled in Blender from the store’s own catalog data: piece count, weld-to-weld tube lengths, u-joint series and end types. Each one is rendered in a white studio from up to six angles and exported as a 3D model, with no supplier photo pixels.',
    role: ['3D modeling', 'Lighting & rendering', 'Data-driven product builds', 'Motion'],
    stack: ['Blender (Cycles)', 'Catalog fitment data', 'glTF / GLB', 'Higgsfield (motion)'],
    stats: [
      { value: '10', label: 'Complete driveshafts: 1, 2 and 3-piece' },
      { value: '47', label: 'Studio renders' },
      { value: '10', label: '3D models (GLB), 1.2 to 4.4 MB each' },
      { value: '0', label: 'Supplier photo pixels used' },
    ],
    challenge:
      'Most complete driveshafts on the store were shown with supplier photos: different angles, light and backgrounds, often a generic shaft rather than the exact part. Photographing thousands of shafts was never going to happen.',
    solution:
      'Each shaft is built from its catalog record: number of pieces, weld-to-weld tube lengths, tube diameter, u-joint series, end types and centre bearings. The same model is rendered from the angles buyers ask about (three-quarter, side, both ends and every centre bearing) and exported as a GLB for an interactive 3D view. A review page puts every render next to today’s catalog photo so the shop can check it against the real part.',
    result:
      'A first review set of 10 vehicles, from a Ford Ranger one-piece to an International 4300 three-piece, with 47 consistent studio images that match each part’s proportions because they come from the same numbers the store sells by. The renders were then animated into a short product film for ads and social. The set is being reviewed by the shop before it replaces the catalog photos.',
    features: [
      {
        title: 'Built from the catalog, not from photos',
        text: 'The 2005-2010 Chrysler 300 / Dodge Charger rear shaft, part 2891-401N: two pieces, 18.37" tubes weld to weld, 1310 series, flex discs at both ends and one centre bearing. Every number in the model comes from the fitment record, and the page shows exactly what it was built from.',
        image: 'case/uds3d-review.jpg',
        stat: '2-piece · 1310 · 1,283 mm',
      },
      {
        title: 'Every angle a buyer asks for',
        text: 'A three-quarter studio shot, a full side view, the transmission and axle ends and a close-up of each centre bearing, all lit the same way on the same white sweep, so the catalog finally looks like one store.',
        image: 'case/uds3d-angles.jpg',
        stat: 'Up to 6 angles per part',
      },
      {
        title: 'One, two and three-piece shafts',
        text: 'Steel and aluminum tubes, slip yokes, CV joints, flex discs, u-joints with straps or U-bolts and one or two centre bearings: the same build handles 1310, 1330, 1350 and 1710 series shafts.',
        image: 'case/uds3d-set.jpg',
        stat: '10 vehicles · 4 series',
      },
      {
        title: 'Checked against the real part',
        text: 'A proportion check lays the side render over today’s catalog photo of the same part, so the shop can approve each shaft before it goes live.',
        image: 'case/uds3d-compare.jpg',
        stat: 'Reviewed part by part',
      },
      {
        title: 'From still to motion',
        text: 'The renders became the first and last frames of a short film: the camera pushes in along the shaft to the centre bearing while the u-joint turns. Animated with Higgsfield from the studio renders, so the part stays the part.',
        image: 'case/uds3d-motion.jpg',
        stat: '13-second product film',
      },
    ],
    images: ['case/uds3d-1.jpg', 'case/uds3d-2.jpg', 'case/uds3d-3.jpg', 'case/uds3d-4.jpg'],
  },
  {
    slug: 'stefania-nails-studio',
    kinds: ['Website'],
    title: 'Stefania Nails Studio',
    client: 'Stefania Nails Studio · Argentina',
    category: 'Nail studio website with online booking',
    tags: 'Web design, Code, Booking system, Admin panel',
    year: '2026',
    cover: 'work/stefania.jpg',
    url: 'https://federico-schwindt.github.io/stefania-nails-studio/',
    featured: true,
    summary:
      'A website and booking system for a one-woman nail studio: the next free slot on the homepage, a five-step booking flow with a deposit by bank transfer or Mercado Pago, a gallery of her real work, and a studio panel where Stefania runs her agenda, clients and cash from her phone.',
    role: ['UX / UI design', 'Art direction', 'Front-end development', 'Booking logic & database', 'Studio panel'],
    stack: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS v4', 'Motion', 'Neon Postgres', 'Zustand', 'GitHub Pages + Actions'],
    stats: [
      { value: '5 steps', label: 'From service to a paid deposit' },
      { value: '20', label: 'Real designs from her own clients' },
      { value: '9', label: 'Sections in the studio panel' },
      { value: '100', label: 'Lighthouse SEO and best practices (mobile)' },
    ],
    challenge:
      'Small nail studios usually take bookings over WhatsApp: a back-and-forth to find a free slot, photos sent to explain a design, deposits chased by hand and reminders sent one by one. Every message is time away from the table, and a missed appointment loses a whole slot. The goal: let clients book and leave the deposit on their own, and give Stefania one place to run the studio from her phone.',
    solution:
      'A dark, editorial site with her name as the masthead and a burgundy accent, built around one action: booking. The homepage shows the next free slot and lets clients pick a service and a time before they scroll. The booking flow goes through service, design, date, contact details and deposit, with extras added to the total as they are chosen. Her real work is the catalog: clients tap a design they like and book it. Deposits go by bank transfer (alias and CBU with a copy button, plus proof upload) or a Mercado Pago link, and “My booking” lets clients check the status, pay, add it to their calendar or cancel. Behind it, a light-themed panel covers today, the weekly agenda, clients with notes and allergies, cash and reports, the waitlist, availability and holidays, designs, services and settings, including WhatsApp message templates.',
    result:
      'Live on GitHub Pages, with the data in Neon Postgres behind a restricted role that can only run the booking functions, so client details are never exposed to the browser. On mobile, Lighthouse gives the homepage 100 for SEO and best practices and 96 for accessibility. Without a database connection the same build runs as a self-contained demo, which makes it easy to show and test without touching real bookings.',
    features: [
      {
        title: 'Book before you scroll',
        text: 'The homepage shows the next free slot and a quick booker: pick a service, tap one of the next open times and continue. Availability comes straight from the database.',
        image: 'case/sn-quick.jpg',
        stat: 'Next free slot, live',
      },
      {
        title: 'Five steps, deposit included',
        text: 'Service, design, date, details and deposit. Extras such as nail art or removal add to the total as they are chosen, and a summary of the booking stays on screen the whole time.',
        image: 'case/sn-booking.jpg',
        stat: 'Deposit online, the rest at the studio',
      },
      {
        title: 'Her real work is the catalog',
        text: 'Photos of her own clients’ nails, not stock. Each design opens up close, and clients book the one they like: it travels with the booking, so Stefania knows what to prepare.',
        image: 'case/sn-gallery.jpg',
        stat: '20 real designs',
      },
      {
        title: 'A studio panel built for one person',
        text: 'Today, the weekly agenda filtered by status, clients with history and notes, the waitlist, availability and holidays, services and designs. The panel switches to a light theme for long working sessions. (Screenshots show the demo mode with sample bookings.)',
        image: 'case/sn-agenda.jpg',
        stat: '9 sections',
      },
      {
        title: 'Cash and reports',
        text: 'What came in, deposits, appointments attended, no-shows and new clients for any period, broken down by day, service, payment method and most-booked design, with a CSV export.',
        image: 'case/sn-reports.jpg',
        stat: 'CSV export',
      },
    ],
    images: ['case/sn-1.jpg', 'case/sn-2.jpg', 'case/sn-3.jpg', 'case/sn-4.jpg'],
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
      'A static Astro build with 62 pre-rendered pages, about 8.5 KB of global JavaScript and video that only loads after first paint: 95 Lighthouse performance and 97-100 accessibility on mobile. Built as a working proposal for the AEA team, with a first-visit disclaimer making clear it is an unofficial concept.',
    images: ['case/aea-1.jpg', 'case/aea-2.jpg', 'case/aea-3.jpg', 'case/aea-4.jpg'],
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
    q: 'How do requests work?',
    a: 'You send a request (a new page, a banner, a campaign, a fix, a post) from your dashboard and it goes into your queue. Several move at the same time. Most are done in two to three business days, and the next one starts as soon as one is delivered.',
  },
  {
    q: 'How long does it take?',
    a: 'A simple site usually goes live in one to two weeks; larger sites and brands take two to six weeks. After that, requests are delivered in days.',
  },
  {
    q: 'What happens after launch?',
    a: 'Hosting, SSL, backups, security updates and uptime monitoring, plus your requests: new pages, changes, graphics, campaigns, sent from your own dashboard.',
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
    { title: 'Marketing', items: ['SEO', 'Google & Meta Ads', 'Analytics', 'Community management', 'Social content', 'Landing pages', 'Email'] },
  ],
  timeline: [
    { year: '2023', title: 'Founded Zyneteq', text: 'A verified agency on Freelancer.com: 13 projects delivered with a 5.0 rating, 100% on time and on budget.' },
    { year: '2024', title: 'Universal Driveshafts', text: 'Took over the redesign and growth of universaldriveshafts.com: new storefront, fitment catalog and campaigns.' },
    { year: '2026', title: '+551% sales', text: 'UDS sales up 551% versus 2024. Started Redesign a Day: a public series of working redesigns for real companies.' },
  ],
}

export const tools = ['Astro', 'React', 'Next.js', 'TypeScript', 'Three.js', 'WebGL', 'GSAP', 'Figma', 'WordPress', 'WooCommerce', 'Shopify', 'Elementor', 'Flutter', 'Node.js', 'Google Ads', 'Meta Ads', 'Analytics']
