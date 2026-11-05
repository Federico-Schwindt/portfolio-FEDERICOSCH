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
  { label: 'Process', href: '/#process' },
  { label: 'Work', href: '/work' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'About', href: '/about' },
]

export const hero = {
  title: ['I design, build and grow websites for people who', 'care about results'],
  sub: 'One person, three disciplines. Design that looks like the brand, code that loads fast, marketing that turns visits into sales.',
}

export const equation = ['Design', '+', 'Code', '+', 'Marketing', '=', '+551%']

export const manifesto = {
  lead: 'Your website isn’t a brochure.',
  leadItalic: 'It’s your best salesperson, and it never sleeps.',
  text: 'Strategy, design, development and campaigns, handled by the same pair of hands. Nothing gets lost in a hand-off, and nothing has to be rebuilt somewhere else later.',
  line: 'First I understand where your business is →',
  lineItalic: 'then I build the shortest path from a visit to a sale.',
  road: 'The road has corners.',
  roadItalic: 'Each step, a few less.',
}

export const process = [
  { index: '01', title: 'Discover', italic: '& Strategy', text: 'Where you are, where you want to go, and what is standing in between. A clear brief before a single pixel.', sides: 4 },
  { index: '02', title: 'Design', italic: 'Iterations', text: 'Brand, visual system and web design, crafted into something credible and built to last. No templates.', sides: 6 },
  { index: '03', title: 'Build', italic: '& Launch', text: 'Clean, fast, maintainable code. Every interaction tuned by hand and tested on real devices.', sides: 12 },
  { index: '04', title: 'Grow', italic: '& Support', text: 'SEO, analytics and campaigns after launch. The process bends to fit you, not the other way around.', sides: 64 },
]

export type Project = {
  slug: string
  index: string
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
    index: '01',
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
    slug: 'certified-retail-cars',
    index: '02',
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
    index: '03',
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
    index: '04',
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
    index: '05',
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
  // ── Concepts: self-initiated pieces made to explore an industry before pitching it ──
  {
    slug: 'advancing-eco-agriculture-concept',
    index: 'C1',
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
    slug: 'velocity-motors-concept',
    index: 'C2',
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
    slug: 'atelier-norte-concept',
    index: 'C3',
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
    slug: 'brasa-coffee-concept',
    index: 'C4',
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
    slug: 'nova-dental-concept',
    index: 'C5',
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
    index: 'C6',
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

export const xp = {
  title: 'Old-school commitment.',
  titleItalic: 'New-school results.',
  desktopTitle: 'Pricing.html',
  icons: [
    { id: 'pricing', label: 'Pricing.html', kind: 'html' },
    { id: 'projects', label: 'Projects', kind: 'folder' },
    { id: 'about', label: 'About.txt', kind: 'txt' },
    { id: 'results', label: 'Results.xls', kind: 'xls' },
    { id: 'photo', label: 'Federico.png', kind: 'png' },
    { id: 'contact', label: 'Contact.exe', kind: 'exe' },
  ],
}

export const contact = {
  title: 'Ready to grow?',
  titleItalic: 'Let’s start with a call.',
  text: 'Treat it like a first coffee. We get to know each other, I look at what you have, and I tell you honestly what I would do. No pitch deck, no obligations.',
  cta: "[ LET'S TALK ]",
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
    { title: 'Development', items: ['React / Next.js', 'TypeScript', 'Three.js / WebGL', 'WordPress / WooCommerce', 'Shopify', 'Flutter'] },
    { title: 'Marketing', items: ['SEO', 'Google & Meta Ads', 'Analytics', 'Landing pages', 'Email'] },
  ],
  timeline: [
    { year: '2023', title: 'Founded Zyneteq', text: 'A verified agency on Freelancer.com: 13 projects delivered with a 5.0 rating, 100% on time and on budget.' },
    { year: '2024', title: 'Universal Driveshafts', text: 'Took over the redesign and growth of universaldriveshafts.com: new storefront, fitment catalog and campaigns.' },
    { year: '2026', title: '+551% sales', text: 'UDS sales up 551% versus 2024. Building immersive, 3D-first experiences for new clients.' },
  ],
}

export const tools = ['React', 'Next.js', 'TypeScript', 'Three.js', 'WebGL', 'GSAP', 'Figma', 'WordPress', 'WooCommerce', 'Shopify', 'Elementor', 'Flutter', 'Node.js', 'Google Ads', 'Meta Ads', 'Analytics']
