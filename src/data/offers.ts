/**
 * SERVICES: the one catalog, organised by discipline (what I do), not by industry (who it is for).
 * The home roads, /services/ and each service page all read from here. Sample data for the
 * interactive demos lives in src/data/samples.ts.
 *
 * Prices are not published: each service says how it is quoted.
 */
export type Offer = {
  slug: string
  /** short name for cards, nav and the form */
  name: string
  /** the verb on the home roads: what this road does to the idea */
  road: string
  /** one line for the home road card */
  roadLine: string
  /** page h1, two levels: plain + emphasised */
  h1: [string, string]
  /** <title> and meta description, written for the search that should find the page */
  title: string
  description: string
  /** the search phrases this page answers, used in its structured data */
  keywords: string[]
  buyer: string
  deliverable: string
  timeline: string
  from: string
  image: string
  intro: string
  steps: { t: string; d: string }[]
  includes: { t: string; d: string }[]
  youBring: string[]
  cases: string[]
  demo?: 'fitment' | 'booking' | 'inventory'
  demoTitle?: string
  demoText?: string
  faq: { q: string; a: string }[]
}

export const offers: Offer[] = [
  {
    slug: 'web-design',
    name: 'Web design',
    road: 'Design it',
    roadLine: 'A site people understand in five seconds.',
    h1: ['Web design that makes', 'the next step obvious.'],
    title: 'Web Design Services for Small Businesses | Federico Schwindt',
    description: 'Custom web design for small businesses: clear pages, one obvious next step, designed on your real content and tested on phones.',
    keywords: ['web design services', 'freelance web designer', 'small business web design', 'website redesign', 'UX UI design'],
    buyer: 'Businesses whose site looks fine but does not explain what they do',
    deliverable: 'Every page designed on your real content, with a clickable prototype before a line of code',
    timeline: '1 to 3 weeks',
    from: 'A clear quote before we start',
    image: 'work/nova.jpg',
    intro: 'People decide in seconds whether a site is for them. I design each page around one message and one next step, so a visitor knows what you do, why you, and what to click.',
    steps: [
      { t: 'Content first', d: 'We agree on what each page has to say before choosing a colour. Real text, real prices, real photos.' },
      { t: 'Prototype you can click', d: 'Every page designed and linked, on desktop and phone. You test it like a finished site and ask for changes.' },
      { t: 'Hand-off to code', d: 'Spacing, type and motion specified, so the built site looks exactly like the design.' },
    ],
    includes: [
      { t: 'A clear structure', d: 'Which pages you need, in which order, and what each one is for.' },
      { t: 'Every page designed', d: 'Desktop and phone, on your real content. No lorem ipsum, no stock photos pretending to be you.' },
      { t: 'One obvious action per page', d: 'Call, book, buy or write. The page is built around it.' },
      { t: 'Accessible by default', d: 'Readable contrast, real buttons, keyboard and screen reader friendly.' },
      { t: 'A small design system', d: 'Colours, type and components written down, so the next page matches the first.' },
    ],
    youBring: ['What you sell and who buys it', 'Your logo, or a brief for one', 'Photos, or access to the products'],
    cases: ['nova-dental-concept', 'atelier-norte-concept', 'la-virginia-concept'],
    demo: 'booking',
    demoTitle: 'One road to one action',
    demoText: 'A booking flow for a spa, designed so a first-time visitor can pick a treatment and a time in two taps. Try it.',
    faq: [
      { q: 'Can you redesign my current site without starting over?', a: 'Yes. I keep what works, your URLs and your content where it is good, and redesign the pages that lose people.' },
      { q: 'Do I get to see the design before it is built?', a: 'Yes. You click through a prototype of every page, on desktop and phone, and approve it before development starts.' },
      { q: 'Do you use templates?', a: 'No. Each site is designed for its content. I do reuse good patterns, like a clear header or a short form, because they work.' },
    ],
  },
  {
    slug: 'web-development',
    name: 'Web development',
    road: 'Build it',
    roadLine: 'Fast pages, stores and tools that work on every phone.',
    h1: ['Web development', 'that stays fast.'],
    title: 'Web Development, WordPress & Shopify | Federico Schwindt',
    description: 'Freelance web developer: custom sites, WordPress, WooCommerce and Shopify stores, product finders and forms. Fast on phones.',
    keywords: ['web development services', 'freelance web developer', 'WordPress developer', 'WooCommerce developer', 'Shopify developer', 'custom website development'],
    buyer: 'Anyone whose site has to do something: sell, book, search, quote',
    deliverable: 'A fast site on your domain, a staging link from week one, and code and accounts in your name',
    timeline: '2 to 6 weeks',
    from: 'A clear quote before we start',
    image: 'work/uds.jpg',
    intro: 'I write the code myself, so the person who designed the page is the one who builds it. Light pages that load fast on a bad signal, stores that are easy to search, and forms that reach your inbox.',
    steps: [
      { t: 'Staging from week one', d: 'A private link you can open every day and watch the site grow.' },
      { t: 'Built on what fits', d: 'Custom code, WordPress, WooCommerce or Shopify. I pick for your catalog and your budget, not for my habits.' },
      { t: 'Tested, then launched', d: 'Real phones, every browser, speed and accessibility checks, redirects in place. Then your domain.' },
    ],
    includes: [
      { t: 'Fast on phones', d: 'Pages that load in about a second, so people stay. Measured with Lighthouse before and after.' },
      { t: 'Stores and catalogs', d: 'Search by part number, by vehicle, by spec. Wholesale and quick order. Checkout that does not leak.' },
      { t: 'Forms and integrations', d: 'Enquiries, bookings and quotes that land in your inbox, CRM or WhatsApp.' },
      { t: 'SEO built in', d: 'Clean URLs, titles, structured data and a sitemap, from day one.' },
      { t: 'Yours, completely', d: 'Domain, hosting, code and accounts in your name. Nothing rented back to you.' },
    ],
    youBring: ['Access to your current site or store', 'Your catalog or a product export', 'One person who can answer questions'],
    cases: ['universal-driveshafts', 'andreani-concept', 'advancing-eco-agriculture-concept'],
    demo: 'fitment',
    demoTitle: 'Find the part by vehicle',
    demoText: 'Pick a make, a year and a model. Only combinations that exist can be chosen, and the result carries its part number, price and stock. Built this for Universal Driveshafts.',
    faq: [
      { q: 'Will my site be fast?', a: 'Yes, and I measure it. Universal Driveshafts went from 65 to 77 on mobile Lighthouse, and the Andreani concept from 7 to 89 on its homepage.' },
      { q: 'Can you work on my existing WordPress or Shopify site?', a: 'Yes. If the platform works, I build on top of it. I only suggest moving when the platform is the bottleneck.' },
      { q: 'Can you handle thousands of products?', a: 'Yes. Universal Driveshafts has 7,541 parts across 44 categories and 4,433 driveshafts searchable by vehicle.' },
    ],
  },
  {
    slug: 'branding',
    name: 'Branding',
    road: 'Name it',
    roadLine: 'A logo, colours and a voice people remember.',
    h1: ['Branding that people', 'remember.'],
    title: 'Branding & Visual Identity | Federico Schwindt',
    description: 'Logo, colours, type and a voice, in a brand guide you can hand to anyone. Visual identity for new businesses and brands that outgrew their logo.',
    keywords: ['branding for small business', 'visual identity design', 'logo design', 'brand guidelines', 'rebranding'],
    buyer: 'New businesses, and brands that outgrew their first logo',
    deliverable: 'A logo system, colours, type, a few rules for tone, and a brand guide as a PDF',
    timeline: '1 to 3 weeks',
    from: 'Quoted per project',
    image: 'work/brasa.jpg',
    intro: 'A brand is what people remember after they close the tab. I design the logo, colours, type and a short voice guide, and then I use them on your site, so everything matches from day one.',
    steps: [
      { t: 'What you want to be known for', d: 'A short call about your customers, your rivals and the one thing you want people to repeat.' },
      { t: 'Two directions', d: 'Two different routes shown on real things: your homepage, a post, a business card. You pick.' },
      { t: 'The guide', d: 'Logo files, colours, type and examples in one PDF, ready for any designer or printer.' },
    ],
    includes: [
      { t: 'Logo system', d: 'Main logo, a compact mark and versions for dark, light and small sizes.' },
      { t: 'Colour and type', d: 'A palette with exact values and fonts licensed for the web.' },
      { t: 'Voice', d: 'How the brand talks: a few rules and before-and-after examples.' },
      { t: 'Brand guide', d: 'Everything in one PDF, plus the source files.' },
      { t: 'Applied for real', d: 'Your site, social templates and a business card in the new identity.' },
    ],
    youBring: ['What you sell and who to', 'Brands you like, and ones you do not', 'Your current logo, if any'],
    cases: ['brasa-coffee-concept', 'la-virginia-concept', 'atelier-norte-concept'],
    faq: [
      { q: 'Do I get the source files?', a: 'Yes. Vector logos, colour values, fonts and the guide are yours to keep and use anywhere.' },
      { q: 'Can you refresh my brand without losing recognition?', a: 'Yes. A refresh keeps what people already recognise and fixes what gets in the way.' },
      { q: 'Is the website included?', a: 'It can be. Brand and site are often done together, so the site uses the new identity from day one. Branding on its own is quoted per project.' },
    ],
  },
  {
    slug: 'marketing',
    name: 'Marketing',
    road: 'Get it found',
    roadLine: 'SEO, Google and Meta ads, and a report in plain words.',
    h1: ['Marketing that brings', 'the right people.'],
    title: 'SEO, Google Ads & Meta Ads | Federico Schwindt',
    description: 'Technical and local SEO, Google Business Profile, Google and Meta Ads, analytics and a monthly report in plain words. Quoted after a free audit.',
    keywords: ['SEO for small business', 'local SEO', 'Google Ads management', 'Meta Ads', 'digital marketing freelancer'],
    buyer: 'Businesses with a good site that not enough people find',
    deliverable: 'Search set up properly, campaigns that are watched, and one report a month you can actually read',
    timeline: 'Monthly, reviewed every month',
    from: 'Monthly, quoted after a free audit',
    image: 'work/velocity.jpg',
    intro: 'A great site nobody finds is a secret. I fix the technical SEO, set up your Google Business Profile, run Google and Meta campaigns with a clear budget, and tell you every month what worked, in plain words.',
    steps: [
      { t: 'Free audit', d: 'Where you rank, what is broken, what your competitors do better. You keep the report either way.' },
      { t: 'Fix, then grow', d: 'Technical fixes first, then content and campaigns aimed at the searches that bring customers.' },
      { t: 'Monthly report', d: 'Visitors, enquiries and cost per enquiry. What we try next month and why.' },
    ],
    includes: [
      { t: 'Technical SEO', d: 'Speed, indexing, structured data, redirects and a clean sitemap.' },
      { t: 'Local SEO', d: 'Google Business Profile, reviews and local pages for the places you serve.' },
      { t: 'Google and Meta Ads', d: 'Campaigns with a fixed budget, landing pages and conversion tracking.' },
      { t: 'Analytics that count enquiries', d: 'Forms, calls and purchases tracked, not just page views.' },
      { t: 'A report in plain language', d: 'One page a month. No vanity metrics.' },
    ],
    youBring: ['Access to your site, Google and Meta accounts', 'A monthly ad budget you are comfortable with', 'What a good customer is worth to you'],
    cases: ['universal-driveshafts', 'velocity-motors-concept'],
    faq: [
      { q: 'How soon will I see results?', a: 'Ads can bring visits in days. SEO usually shows movement in two to three months and keeps compounding after that.' },
      { q: 'Do you need a minimum ad budget?', a: 'No fixed minimum. We set a budget you are comfortable with and decide together whether to raise it based on results.' },
      { q: 'Will I own the accounts?', a: 'Yes. Google, Meta and analytics accounts stay in your name; I work with access you can remove at any time.' },
    ],
  },
  {
    slug: 'community-management',
    name: 'Community management',
    road: 'Keep it alive',
    roadLine: 'Posts, replies and a calendar, every week.',
    h1: ['Social media,', 'handled.'],
    title: 'Community Manager & Social Media | Federico Schwindt',
    description: 'Freelance community manager: a monthly calendar, designed posts and reels, replies to comments and messages, and a report. Instagram, LinkedIn, TikTok.',
    keywords: ['community manager', 'social media management', 'social media manager freelance', 'Instagram management', 'content calendar'],
    buyer: 'Brands that should post every week and never find the time',
    deliverable: 'A monthly calendar, designed posts and short videos, replies to comments and messages, and a report',
    timeline: 'Monthly',
    from: 'Monthly, quoted after a short call',
    image: 'work/motion-loop.jpg',
    intro: 'An account that has not posted since March tells customers you might be closed. I plan the month with you, design the posts and short videos in your brand, publish them, answer comments and messages, and send you a report.',
    steps: [
      { t: 'A calendar you approve', d: 'At the start of each month, every post laid out with its copy and design. You approve or change.' },
      { t: 'Made and published', d: 'Posts, carousels and short videos in your identity, published at the right times.' },
      { t: 'Replies and report', d: 'Comments and messages answered in your voice; at the end of the month, what grew and what did not.' },
    ],
    includes: [
      { t: 'Monthly content calendar', d: 'Themes, dates and copy for every post, approved before publishing.' },
      { t: 'Designed posts and reels', d: 'Graphics, carousels and short videos made in your brand, not templates.' },
      { t: 'Community care', d: 'Comments and direct messages answered in your voice, leads passed to you.' },
      { t: 'Profiles that convert', d: 'Bio, highlights and links pointing to your site and booking.' },
      { t: 'Monthly report', d: 'Reach, engagement, messages and enquiries, with the plan for next month.' },
    ],
    youBring: ['Access to your accounts', 'Photos or products to shoot', 'Thirty minutes a month to approve the calendar'],
    cases: ['motion-ident-concept', 'brasa-coffee-concept', 'velocity-motors-concept'],
    faq: [
      { q: 'Which networks do you manage?', a: 'Instagram, Facebook, LinkedIn and TikTok. Most small businesses do best focusing on one or two.' },
      { q: 'How many posts a month?', a: 'It depends on the brand; a common start is three posts a week plus stories. We size it to what you can sustain.' },
      { q: 'Do you answer messages too?', a: 'Yes. Comments and direct messages are answered in your voice, and real enquiries are passed straight to you.' },
    ],
  },
  {
    slug: 'motion-3d',
    name: 'Motion & 3D',
    road: 'Make it move',
    roadLine: '3D product renders and motion that stop the scroll.',
    h1: ['Motion and 3D that', 'stop the scroll.'],
    title: '3D Product Renders & Motion | Federico Schwindt',
    description: '3D product renders built from your specs, product films and motion graphics for launches, ads and stores. Every angle a buyer asks for.',
    keywords: ['3D product rendering', 'product animation', 'motion graphics', 'product video for ecommerce', '3D renders for catalog'],
    buyer: 'Products that need to be seen from every angle, and launches that need a film',
    deliverable: 'Studio renders, angle sets and short films, ready for your store, ads and social',
    timeline: '1 to 2 weeks per set',
    from: 'Quoted per piece',
    image: 'work/uds-3d.jpg',
    intro: 'A buyer cannot hold the product, so the pictures have to answer every question. I build 3D models from your specs, render every angle and make short films for launches and ads.',
    steps: [
      { t: 'From your specs', d: 'Drawings, photos or the real part. The model is checked against it, detail by detail.' },
      { t: 'Every angle', d: 'Studio renders, close-ups and the angles customers ask about, in one consistent light.' },
      { t: 'Motion', d: 'Short product films and loops for the store, ads and social.' },
    ],
    includes: [
      { t: 'Product models', d: 'Built from your specs and checked against the real thing.' },
      { t: 'Studio renders', d: 'Consistent light and background across the whole catalog.' },
      { t: 'Angle sets', d: 'The views buyers need, exported for the store and marketplaces.' },
      { t: 'Product films', d: 'Short loops and launch films for ads and social.' },
      { t: 'Brand motion', d: 'Logo animations and motion systems for your channels.' },
    ],
    youBring: ['Drawings, photos or a sample of the product', 'Where the images will be used', 'Your brand guide, if any'],
    cases: ['uds-3d-driveshafts', 'motion-ident-concept', 'velocity-motors-concept'],
    faq: [
      { q: 'Do I need a physical sample?', a: 'Not always. Technical drawings and good photos are often enough; a sample helps for the finest details.' },
      { q: 'Can renders replace product photography?', a: 'For catalogs, often yes: every product in the same light, any angle, without a studio day.' },
      { q: 'What formats do I get?', a: 'High-resolution stills for print and web, web-optimised versions for your store, and video in the sizes each network needs.' },
    ],
  },
]

/** Added on top of any service */
export const addons = [
  { t: 'Landing pages', d: 'One page, one goal, for a campaign or a launch.' },
  { t: 'Copywriting', d: 'The words on your site, written to be clear, in English or Spanish.' },
  { t: 'Community management', d: 'Posts, replies and a weekly content calendar, on top of any service.' },
]

/** Working at a distance. Only facts already published on the site; commercial terms are added once confirmed. */
export const remote = [
  { t: 'Where', d: 'Based in Argentina (GMT-3). Clients so far in the United States, Israel, Australia and India.' },
  { t: 'Calls', d: 'In your time zone, in English or Spanish.' },
  { t: 'Replies', d: 'Within one business day.' },
  { t: 'After launch', d: 'Hosting, security and updates, plus your requests from your own dashboard, several at once.' },
]

export const offerBySlug = (slug: string) => offers.find((o) => o.slug === slug)
/** The service page a case study belongs to, if any */
export const offerForCase = (caseSlug: string) => offers.find((o) => o.cases.includes(caseSlug))
