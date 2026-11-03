/**
 * ─────────────────────────────────────────────────────────────
 *  SITE CONTENT — edit everything here.
 *  Items marked TODO are placeholders waiting for real data.
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  name: 'Federico Schwindt',
  firstName: 'Federico',
  lastName: 'Schwindt',
  tagline: 'Website Development, Design & Marketing',
  role: 'Designer & Developer',
  // TODO: confirm city / time zone
  location: 'Argentina',
  timeZone: 'America/Argentina/Buenos_Aires',
  availability: 'Available for new projects',
  // TODO: replace with your real contact email
  email: 'hello@federicoschwindt.com',
  year: new Date().getFullYear(),
  description:
    'I design and build immersive websites that turn visitors into believers. Strategy, design, code and growth — under one roof.',
}

export const socials = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/federico-schwindt/' },
  // TODO: add or remove profiles
  { label: 'Instagram', href: '#' },
  { label: 'GitHub', href: '#' },
  { label: 'Behance', href: '#' },
]

export const nav = [
  { label: 'About', href: '#about', index: '01' },
  { label: 'Services', href: '#services', index: '02' },
  { label: 'Work', href: '#work', index: '03' },
  { label: 'Process', href: '#process', index: '04' },
  { label: 'Contact', href: '#contact', index: '05' },
]

export const marquee = [
  'Web Development',
  'Web Design',
  'Branding',
  'Digital Marketing',
  '3D & Motion',
  'E-commerce',
  'SEO & Growth',
]

export const about = {
  manifesto:
    'I believe a website should feel like an experience, not a document. I combine strategy, design and engineering to build digital products that look extraordinary and perform even better — from the first pixel to the last conversion.',
  columns: [
    {
      title: 'Approach',
      items: ['Strategy first', 'Design with intent', 'Code without compromise', 'Measure everything'],
    },
    {
      title: 'Stack',
      items: ['React / Next.js', 'Three.js / WebGL', 'GSAP / Motion', 'Shopify / WordPress', 'Figma'],
    },
    {
      title: 'Currently',
      items: ['Taking new projects', 'Working worldwide', 'Remote-first'],
    },
  ],
}

export const services = [
  {
    index: '01',
    title: 'Develop\u00ADment',
    text:
      'Fast, accessible, production-grade websites and web apps. Custom code, modern frameworks and real-time 3D when the story needs it.',
    tags: ['React & Next.js', 'TypeScript', 'Three.js / WebGL', 'Headless CMS', 'Shopify', 'WordPress', 'Performance'],
  },
  {
    index: '02',
    title: 'Design',
    text:
      'Interfaces with a point of view. Art direction, typography and motion systems that make a brand impossible to confuse with anyone else.',
    tags: ['Art Direction', 'UI / UX', 'Design Systems', 'Motion Design', 'Branding', 'Prototyping'],
  },
  {
    index: '03',
    title: 'Market\u00ADing',
    text:
      'Beautiful is not enough. I connect design and code to growth: SEO, analytics, landing pages and campaigns that turn attention into revenue.',
    tags: ['SEO', 'Analytics', 'Landing Pages', 'Paid Campaigns', 'Email', 'Conversion'],
  },
]

export type Project = {
  index: string
  title: string
  category: string
  year: string
  cover: string
  href: string
  color: string
}

// TODO: replace these concept projects with real case studies (and covers in /public/work).
export const projects: Project[] = [
  { index: '01', title: 'Aurora Studio', category: 'Brand & Website', year: '2026', cover: 'work/01.jpg', href: '#', color: '#5b4bff' },
  { index: '02', title: 'Nordic Roast', category: 'E-commerce', year: '2025', cover: 'work/02.jpg', href: '#', color: '#d9a066' },
  { index: '03', title: 'Vela Finance', category: 'Web App', year: '2025', cover: 'work/03.jpg', href: '#', color: '#19c37d' },
  { index: '04', title: 'Kōyō Hotel', category: 'Website & Branding', year: '2025', cover: 'work/04.jpg', href: '#', color: '#e8663d' },
  { index: '05', title: 'Pulse Fitness', category: 'Marketing & Landing', year: '2024', cover: 'work/05.jpg', href: '#', color: '#ff3b5c' },
  { index: '06', title: 'Orbit Agency', category: 'Motion & 3D', year: '2024', cover: 'work/06.jpg', href: '#', color: '#c8ff3b' },
]

export const process = [
  {
    index: '01',
    title: 'Discover',
    text: 'We dig into your business, audience and goals. No assumptions — a clear brief and a plan everyone believes in.',
  },
  {
    index: '02',
    title: 'Design',
    text: 'Art direction, wireframes and high-fidelity screens. Motion and 3D are designed in from the start, not sprinkled on top.',
  },
  {
    index: '03',
    title: 'Build',
    text: 'Clean, fast, maintainable code. Every interaction is tuned by hand and tested on real devices.',
  },
  {
    index: '04',
    title: 'Launch & Grow',
    text: 'Deployment, analytics, SEO and campaigns. Launch day is the start of the work, not the end.',
  },
]

export const stats = [
  { value: '3', label: 'Disciplines, one partner' },
  { value: '0', label: 'Templates. Everything custom' },
  { value: '100%', label: 'Hand-tuned interactions' },
]

export const tools = [
  'React', 'Next.js', 'TypeScript', 'Three.js', 'WebGL', 'GSAP', 'Framer', 'Figma', 'Blender',
  'Shopify', 'WordPress', 'Node.js', 'Tailwind', 'Vercel', 'Google Analytics', 'Meta Ads',
]
