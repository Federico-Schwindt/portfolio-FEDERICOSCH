import { projects, type Project } from '../data/content'

export const SITE_URL = (import.meta.env.SITE_URL as string | undefined) ?? 'https://federico-schwindt.github.io/portfolio-FEDERICOSCH'
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

/** Internal link or asset path, prefixed with the base path. External links pass through. */
export const url = (p = '/') => (/^(https?:|mailto:|tel:|#)/.test(p) ? p : `${BASE}${p.startsWith('/') ? p : `/${p}`}`)
export const canonicalFor = (path: string) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path.replace(/\/$/, '')}/`)
export const numberOf = (p: Project) => String(projects.indexOf(p) + 1).padStart(2, '0')
export const bySlug = (slug: string) => projects.find((p) => p.slug === slug)
export const thumbOf = (p: Project) => p.cover.replace('work/', 'work/sm/')
export const hostOf = (u?: string) => u?.replace(/^https?:\/\//, '').replace(/\/$/, '')
/** The headline number of a project, if it has one */
export const heroStat = (p: Project) => p.stats?.[0]
