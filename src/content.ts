/**
 * ─────────────────────────────────────────────────────────────
 *  SITE CONTENT — edit everything here.
 *  Items marked TODO are waiting for confirmation.
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  name: 'Federico Schwindt',
  firstName: 'Federico',
  lastName: 'Schwindt',
  tagline: 'Website Development, Design & Marketing',
  role: 'Designer & Developer',
  agency: 'Zyneteq',
  location: 'Argentina',
  city: 'Gualeguaychú, Argentina',
  timeZone: 'America/Argentina/Buenos_Aires',
  availability: 'Available for new projects',
  email: 'leonel.sch2003@gmail.com',
  year: new Date().getFullYear(),
  description:
    'I design, build and grow websites that people remember. Strategy, design, code and marketing — one person, one thread.',
}

export const socials = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/federico-schwindt/' },
  { label: 'GitHub', href: 'https://github.com/Federico-Schwindt' },
  { label: 'Freelancer', href: 'https://www.freelancer.com/u/kiwiapp' },
]

export const nav = [
  { label: 'Work', href: '/work', index: '01' },
  { label: 'About', href: '/about', index: '02' },
  { label: 'Lab', href: '/lab', index: '03' },
  { label: 'Contact', href: '/contact', index: '04' },
]

/** Chapters of the home-page journey (used by the nav counter). */
export const chapters = [
  { id: 'intro', label: 'Gargantua' },
  { id: 'manifesto', label: 'Approach' },
  { id: 'dive', label: 'Event horizon' },
  { id: 'tesseract', label: 'Tesseract' },
  { id: 'services', label: 'Services' },
  { id: 'work', label: 'Work' },
  { id: 'impact', label: 'Impact' },
  { id: 'contact', label: 'Contact' },
]

export const journeyCopy = {
  intro: {
    kicker: 'Website Development, Design & Marketing',
    scroll: 'Scroll to begin the descent',
  },
  manifesto: {
    title: 'I build websites that feel like experiences, not documents.',
    text: 'Strategy, design, engineering and marketing in one pair of hands — so nothing gets lost between the idea and the launch.',
  },
  dive: 'Crossing the event horizon',
  tesseract: {
    title: 'Every project. One line to follow.',
    text: 'Welcome to the tesseract: the work, the thinking and the results, laid out along a single red line. Keep scrolling to follow it.',
  },
  workIntro: {
    title: 'Selected work',
    text: 'Five projects with real numbers. Click a screen to step inside the case study.',
  },
  allWork: 'See all work',
}

export const manifesto = {
  text: 'I build websites that feel like experiences, not documents.',
  sub: 'Strategy, design, engineering and marketing in one pair of hands — so nothing gets lost between the idea and the launch.',
  pillars: ['Design', 'Code', 'Growth'],
}

export const services = [
  {
    index: '01',
    title: 'Develop­ment',
    short: 'Development',
    kicker: 'Built to last',
    text:
      'Fast, accessible, production-grade websites and web apps. Custom code, modern frameworks and real-time 3D when the story needs it.',
    tags: ['React & Next.js', 'TypeScript', 'Three.js / WebGL', 'WordPress & WooCommerce', 'Shopify', 'Performance'],
  },
  {
    index: '02',
    title: 'Design',
    short: 'Design',
    kicker: 'Made to be remembered',
    text:
      'Interfaces with a point of view. Art direction, typography and motion systems that make a brand impossible to confuse with anyone else.',
    tags: ['Art Direction', 'UI / UX', 'Design Systems', 'Motion', 'Branding & Logo', 'Figma'],
  },
  {
    index: '03',
    title: 'Market­ing',
    short: 'Marketing',
    kicker: 'Measured to grow',
    text:
      'Beautiful is not enough. I connect design and code to growth: SEO, analytics, landing pages and campaigns that turn attention into revenue.',
    tags: ['SEO', 'Analytics', 'Landing Pages', 'Paid Campaigns', 'Email', 'Conversion'],
  },
]

export type Stat = { value: string; label: string }

export type Project = {
  slug: string
  index: string
  title: string
  client: string
  category: string
  year: string
  cover: string
  url?: string
  color: string
  featured?: boolean
  summary: string
  role: string[]
  stack: string[]
  stats?: Stat[]
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
    year: '2024 — 2026',
    cover: 'work/uds.jpg',
    url: 'https://dev.udshafts.com',
    color: '#ff2b2b',
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
      'The original WordPress site made it hard to find the right part. Thousands of SKUs, no fitment logic and a checkout that leaked customers — in a category where buyers need the exact part, today.',
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
    year: '2024',
    cover: 'work/joya.jpg',
    url: 'https://joyahijab.com',
    color: '#d9b36c',
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
    year: '2023', // TODO: confirm year
    cover: 'work/havat-aliza.jpg',
    color: '#8c6a3f',
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
    year: '2023', // TODO: confirm year
    cover: 'work/dogstore.jpg',
    color: '#4a6fff',
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
    year: '2023',
    cover: 'work/reel.jpg',
    color: '#ffffff',
    summary:
      'A motion-graphics reel explaining services, stack and achievements — website development, design and content creation in sixty seconds.',
    role: ['Concept', 'Motion design', 'Edit'],
    stack: ['After Effects', 'Illustrator', 'Premiere'],
    images: [],
  },
]

export const impact = {
  value: '+551%',
  label: 'Sales growth for Universal Driveshafts, 2024 → 2026',
  text: 'Design, code and marketing pulling in the same direction. One rebuilt storefront turned a parts catalog into the company’s main sales channel.',
  kicker: 'Impact',
  cta: 'Read the case study',
  slug: 'universal-driveshafts',
}

export const about = {
  intro:
    'I’m Federico — a designer, developer and marketer from Argentina, working with clients worldwide through my studio, Zyneteq.',
  bio: [
    'I started building websites because I was frustrated by how many of them looked the same and converted nobody. Today I work end-to-end: strategy, art direction, front-end and back-end code, and the campaigns that bring people in.',
    'My favourite projects are the ones where craft meets numbers — a store that doubles its sales, a brand that finally looks like what it sells, an interaction nobody has seen before.',
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
    { year: '2023', title: 'Founded Zyneteq', text: 'A verified agency on Freelancer.com — 13 projects delivered with a 5.0 rating, 100% on time and on budget.' },
    { year: '2024', title: 'Universal Driveshafts', text: 'Took over the redesign and growth of universaldriveshafts.com: new storefront, fitment catalog and campaigns.' },
    { year: '2026', title: '+551% sales', text: 'UDS sales up 551% versus 2024. Started building immersive, 3D-first experiences for new clients.' },
  ],
}

export const marquee = ['Web Development', 'Web Design', 'E-commerce', 'Branding', '3D & Motion', 'SEO & Growth', 'WordPress', 'React']

export const tools = [
  'React', 'Next.js', 'TypeScript', 'Three.js', 'WebGL', 'GSAP', 'Figma', 'WordPress', 'WooCommerce', 'Shopify',
  'Elementor', 'Flutter', 'Node.js', 'Google Ads', 'Meta Ads', 'Analytics',
]
