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
    slug: 'joya-hijab',
    index: '02',
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
    slug: 'havat-aliza',
    index: '03',
    title: 'Havat Aliza',
    client: 'Havat Aliza · Israel',
    category: 'Business website',
    tags: 'Design, WordPress',
    year: '2023', // TODO: confirm year
    cover: 'work/havat-aliza.jpg',
    summary:
      'Website for a family-run horse-riding business: home, about, services and booking information, designed to feel warm and trustworthy.',
    role: ['Web design', 'WordPress development', 'Content structure'],
    stack: ['WordPress', 'Elementor', 'Responsive'],
    images: [],
  },
  {
    slug: 'dogstore',
    index: '04',
    title: 'DogStore',
    client: 'DogStore · Israel',
    category: 'WooCommerce store',
    tags: 'Design, WooCommerce',
    year: '2023', // TODO: confirm year
    cover: 'work/dogstore.jpg',
    summary:
      'Online store for premium dog food and veterinary supplies (dogstore.co.il): product catalog, categories and a streamlined cart.',
    role: ['Web design', 'WooCommerce development'],
    stack: ['WordPress', 'WooCommerce', 'Payments'],
    images: [],
  },
  {
    slug: 'motion-cv-reel',
    index: '05',
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
