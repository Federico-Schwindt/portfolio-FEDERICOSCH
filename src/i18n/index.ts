/**
 * Two languages: English at the root, Spanish under /es/ with the same slugs.
 * Pages pass `lang` down; data comes from the matching file (content / content.es, offers / offers.es).
 */
import * as contentEn from '../data/content'
import * as contentEs from '../data/content.es'
import * as offersEn from '../data/offers'
import * as offersEs from '../data/offers.es'
import * as samplesEn from '../data/samples'
import * as samplesEs from '../data/samples.es'

export type Lang = 'en' | 'es'
export const LANGS: Lang[] = ['en', 'es']
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

/** the language of a pathname (with or without the base path) */
export const langOf = (pathname: string): Lang => (pathname.slice(BASE.length).startsWith('/es/') || pathname.slice(BASE.length) === '/es' ? 'es' : 'en')
/** a site path (no base) in the given language: '/work/' -> '/es/work/' */
export const lp = (lang: Lang, p: string) => (lang === 'es' && p.startsWith('/') && !p.startsWith('/es/') ? `/es${p}` : p)
/** the same page in the other language, as a site path without the base */
export const twin = (pathname: string, to: Lang) => {
  const p = pathname.slice(BASE.length) || '/'
  const bare = p.startsWith('/es/') ? p.slice(3) : p === '/es' ? '/' : p
  return to === 'es' ? `/es${bare}` : bare
}

export const data = (lang: Lang) => ({
  ...(lang === 'es' ? contentEs : contentEn),
  ...(lang === 'es' ? offersEs : offersEn),
  samples: lang === 'es' ? samplesEs : samplesEn,
})

/** interface words shared by every page */
export const ui = {
  en: {
    nav: { work: 'Work', services: 'Services', pricing: 'Pricing', about: 'About', contact: 'Contact', audit: 'Free audit' },
    cta: 'Start a project', login: 'Log in',
    menu: 'Menu', mainNav: 'Main', mobileNav: 'Mobile', home: 'Home', skip: 'Skip to content', homeLabel: 'Federico Schwindt, home',
    menuFoot: 'Design, code, marketing',
    theme: { toDark: 'Switch to dark mode', toLight: 'Switch to light mode' },
    lang: { label: 'Español', short: 'ES', title: 'Ver el sitio en español' },
    footer: 'From sketch to sold. A whole team, in one person.',
    email: 'Email',
    slogan: 'From sketch to sold',
    form: {
      website: 'Your website', websitePh: 'yourbusiness.com', email: 'Email', name: 'Name', company: 'Company', current: 'Current website', optional: 'Optional',
      need: 'What do you need?', needUnsure: 'Not sure, help me decide', several: 'Several of these',
      plan: 'Website plan', planUnsure: 'Not sure yet', budget: 'Budget', message: 'Tell me about it', hp: 'Leave empty',
      sendAudit: 'Get my free audit', send: 'Send message',
    },
  },
  es: {
    nav: { work: 'Trabajos', services: 'Servicios', pricing: 'Precios', about: 'Sobre mí', contact: 'Contacto', audit: 'Auditoría gratis' },
    cta: 'Empezar un proyecto', login: 'Entrar',
    menu: 'Menú', mainNav: 'Principal', mobileNav: 'Móvil', home: 'Inicio', skip: 'Ir al contenido', homeLabel: 'Federico Schwindt, inicio',
    menuFoot: 'Diseño, código, marketing',
    theme: { toDark: 'Cambiar a modo oscuro', toLight: 'Cambiar a modo claro' },
    lang: { label: 'English', short: 'EN', title: 'View the site in English' },
    footer: 'Del boceto a la venta. Un equipo entero, en una persona.',
    email: 'Email',
    slogan: 'Del boceto a la venta',
    form: {
      website: 'Tu sitio web', websitePh: 'tunegocio.com', email: 'Email', name: 'Nombre', company: 'Empresa', current: 'Sitio web actual', optional: 'Opcional',
      need: '¿Qué necesitas?', needUnsure: 'No sé, ayúdame a decidir', several: 'Varios de estos',
      plan: 'Plan web', planUnsure: 'Todavía no sé', budget: 'Presupuesto', message: 'Cuéntame', hp: 'Dejar vacío',
      sendAudit: 'Quiero mi auditoría gratis', send: 'Enviar mensaje',
    },
  },
} as const

export const t = (lang: Lang) => ui[lang]
