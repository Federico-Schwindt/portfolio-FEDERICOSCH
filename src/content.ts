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
      'Complete redesign and rebuild of universaldriveshafts.com: a catalog of 6,800+ parts, a vehicle fitment finder, an online driveshaft builder and a wholesale flow. Sales grew 551% from 2024 to 2026.',
    role: ['Strategy', 'UX / UI design', 'Front-end & back-end', 'SEO & campaigns'],
    stack: ['Custom storefront', 'Fitment catalog', 'Cart & checkout', 'Multi-language', 'SEO', 'Google Ads', 'Analytics'],
    stats: [
      { value: '+551%', label: 'Sales growth, 2024 → 2026' },
      { value: '6,821', label: 'Parts on the shelf' },
      { value: '4,433', label: 'Driveshafts in the vehicle finder' },
      { value: '43', label: 'Vehicle makes covered' },
    ],
    challenge:
      'The original WordPress site made it hard to find the right part. Thousands of SKUs, no fitment logic and a checkout that leaked customers, in a category where buyers need the exact part, today.',
    solution:
      'A new storefront built around how mechanics actually search: by component series, by vehicle (make → year → model from the real fitment catalog) or by having a shaft built to spec. Same-day shipping, wholesale pricing and three languages on top of a fast, custom codebase.',
    result:
      'Sales up 551% between 2024 and 2026, with a catalog of 6,821 parts and 4,433 complete driveshafts searchable across 43 makes. The site is now the company’s primary sales channel.',
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
  {
    slug: 'ultramedix',
    index: '06',
    title: 'UltraMedix',
    client: 'UltraMedix · Israel',
    category: 'Online pharmacy (RTL)',
    tags: 'WooCommerce, RTL',
    year: '2024',
    cover: 'work/ultramedix.jpg',
    summary:
      'A fully functional online pharmacy in Hebrew: product categories, product pages, customer accounts and checkout, laid out right-to-left for Hebrew-speaking customers.',
    role: ['WooCommerce development', 'Catalog setup', 'RTL layout'],
    stack: ['WordPress', 'WooCommerce', 'Elementor', 'RTL / Hebrew'],
    challenge: 'Make an everyday purchase (medicine and supplements) feel simple and trustworthy for a Hebrew-speaking audience, with the catalogue and checkout fully mirrored.',
    solution: 'A category-first home page, clean product grids, product pages with clear pricing and add-to-cart, and an account area for repeat orders, all built right-to-left from the ground up.',
    images: ['case/ultramedix-1.jpg', 'case/ultramedix-2.jpg', 'case/ultramedix-3.jpg'],
  },
  {
    slug: 'sababa-shop',
    index: '07',
    title: 'Sababa Shop',
    client: 'Sababa Shop · Israel',
    category: 'Dropshipping store',
    tags: 'WooCommerce, Integrations',
    year: '2024',
    cover: 'work/sababa.jpg',
    summary:
      'An e-commerce store built for dropshipping: a WooCommerce catalogue of products imported from AliExpress, promotional sections and clear shipping and returns pages.',
    role: ['WooCommerce development', 'Store setup', 'Content pages'],
    stack: ['WordPress', 'WooCommerce', 'Elementor', 'AliExpress import'],
    challenge: 'Run a wide, changing catalogue with no warehouse: products, prices and stock had to flow from suppliers into a store that still looks and feels like one brand.',
    solution: 'WooCommerce with supplier import for the catalogue, Elementor templates for product and category pages, a promotional home page with featured categories and free-shipping campaigns, and policy pages that set expectations on delivery.',
    images: ['case/sababa-1.jpg', 'case/sababa-2.jpg', 'case/sababa-3.jpg'],
  },
  {
    slug: 'havat-aliza',
    index: '08',
    title: 'Havat Aliza',
    client: 'Havat Aliza · Israel',
    category: 'Business website',
    tags: 'Design, WordPress',
    year: '2024', // TODO: confirm year
    cover: 'work/havat-aliza.jpg',
    summary:
      'Website for a family-run horse-riding ranch: home, riding tours, horse boarding, a photo gallery and contact, designed to feel as warm and welcoming as the place.',
    role: ['Web design', 'WordPress development', 'Content structure'],
    stack: ['WordPress', 'Elementor', 'RTL / Hebrew', 'Responsive'],
    challenge: 'Show a family business the way it feels in person: open landscapes, horses and people, with the practical information (tours, boarding, how to get there) easy to find.',
    solution: 'A photography-led home page, dedicated pages for riding tours and boarding with clear pricing blocks, a large gallery, and a contact page with map and directions, all in Hebrew.',
    images: ['case/havat-aliza-1.jpg', 'case/havat-aliza-2.jpg', 'case/havat-aliza-3.jpg', 'case/havat-aliza-4.jpg'],
  },
  {
    slug: 'dogstore',
    index: '09',
    title: 'DogStore',
    client: 'DogStore · Israel',
    category: 'WooCommerce store',
    tags: 'Design, WooCommerce',
    year: '2024', // TODO: confirm year
    cover: 'work/dogstore.jpg',
    summary:
      'Online store for premium dog food and veterinary supplies (dogstore.co.il): product catalogue, categories, promotions and a streamlined cart, in Hebrew.',
    role: ['Web design', 'WooCommerce development'],
    stack: ['WordPress', 'WooCommerce', 'Payments', 'RTL / Hebrew'],
    challenge: 'Pet owners reorder the same products often. The store had to make finding and re-buying a specific food or supplement fast, on a phone, in Hebrew.',
    solution: 'A home page built around best-sellers and promotions, clear category navigation, product pages with the information owners look for, and a short, secure checkout.',
    images: ['case/dogstore-1.jpg', 'case/dogstore-2.jpg'],
  },
  {
    slug: 'sure-thing-car-subscription',
    index: '10',
    title: 'Sure Thing Car Subscription',
    client: 'Sure Thing · Sydney, Australia',
    category: 'Car rental website',
    tags: 'Design, WordPress',
    year: '2023',
    cover: 'work/sure-thing.jpg',
    summary:
      'WordPress site for a flexible car-rental and subscription company in Sydney: plans from $149 a week, a clear offer and a fast path to an enquiry.',
    role: ['Web design', 'WordPress development'],
    stack: ['WordPress', 'Elementor', 'Responsive'],
    images: ['case/sure-thing-1.jpg'],
  },
  {
    slug: 'datasoft-consulting',
    index: '11',
    title: 'DataSoft Consulting',
    client: 'DataSoft · India',
    category: 'Agency website',
    tags: 'Design, WordPress',
    year: '2023',
    cover: 'work/datasoft.jpg',
    summary:
      'A clean, modern site for a marketing and IT solutions agency: services, work, about and contact, built on WordPress with Elementor and the HUB theme.',
    role: ['Web design', 'WordPress development'],
    stack: ['WordPress', 'Elementor', 'HUB theme'],
    images: ['case/datasoft-1.jpg', 'case/datasoft-2.jpg', 'case/datasoft-3.jpg'],
  },
  {
    slug: 'bebes-click',
    index: '12',
    title: 'Bebés Click',
    client: 'Bebés Click',
    category: 'Blog, neo-brutalism',
    tags: 'Design, WordPress',
    year: '2023',
    cover: 'work/bebes-click.jpg',
    summary:
      'A kids and parenting blog with a playful neo-brutalist look: bold colours, chunky cards and a category grid that invites browsing.',
    role: ['Art direction', 'WordPress development'],
    stack: ['WordPress', 'Elementor'],
    images: ['case/bebes-click-1.jpg', 'case/bebes-click-2.jpg'],
  },
  {
    slug: 'motion-cv-reel',
    index: '13',
    title: 'Motion CV Reel',
    client: 'Zyneteq',
    category: 'Motion design',
    tags: 'Motion, Brand',
    year: '2023',
    cover: 'work/reel.jpg',
    summary: 'A motion-graphics reel explaining services, stack and achievements, in sixty seconds.',
    role: ['Concept', 'Motion design', 'Edit'],
    stack: ['After Effects', 'Illustrator', 'Premiere'],
    images: [],
  },
]

export const workIntro = 'Thoughtful design, careful code, and numbers to show for it.'

// TODO: confirm prices and what each package includes.
export const packages = [
  {
    code: 'FS/PKG.01-L1',
    short: 'LCH',
    name: 'Launch',
    text: 'Your first serious presence: a sharp, credible site built to go live fast and convert from day one.',
    textItalic: 'launch fast',
    items: ['1–3 pages', 'Custom visual direction', 'Conversion-focused layout', 'WordPress or custom code'],
    price: '$1,500',
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
    price: '$3,500',
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
    price: '$7,000',
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
