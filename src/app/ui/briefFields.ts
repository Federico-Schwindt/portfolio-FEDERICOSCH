/**
 * A short brief per kind of request: the two to four answers the studio always needs before starting, so a request
 * can begin without a second message. The answers are written into the brief as "Label: value" lines, so the data
 * model stays one text field and the studio reads them like a form.
 */
import type { Kind } from '../types'

export type Field = { key: string; en: string; es: string; ph?: [string, string]; type?: 'text' | 'url' | 'area' | 'chips'; req?: boolean; options?: [string, string][] }

const DEVICES: [string, string][] = [['iPhone', 'iPhone'], ['Android', 'Android'], ['Mac', 'Mac'], ['Windows', 'Windows'], ['All', 'Todos']]
const CHANNELS: [string, string][] = [['Google', 'Google'], ['Instagram', 'Instagram'], ['Facebook', 'Facebook'], ['TikTok', 'TikTok'], ['Email', 'Email'], ['Other', 'Otro']]
const NETWORKS: [string, string][] = [['Instagram', 'Instagram'], ['TikTok', 'TikTok'], ['LinkedIn', 'LinkedIn'], ['Facebook', 'Facebook'], ['YouTube', 'YouTube']]

export const FIELDS: Record<Kind, Field[]> = {
  fix: [
    { key: 'url', en: 'Page where it happens', es: 'Página donde pasa', type: 'url', req: true, ph: ['https://yoursite.com/contact', 'https://tusitio.com/contacto'] },
    { key: 'device', en: 'Device', es: 'Dispositivo', type: 'chips', req: true, options: DEVICES },
    { key: 'happens', en: 'What happens', es: 'Qué pasa', type: 'area', req: true, ph: ['The form button does nothing on iPhone', 'El botón del formulario no hace nada en iPhone'] },
    { key: 'expected', en: 'What should happen', es: 'Qué debería pasar', req: true, ph: ['It sends the message and shows "Thanks"', 'Envía el mensaje y muestra "Gracias"'] },
  ],
  page: [
    { key: 'goal', en: 'What the page should get people to do', es: 'Qué tiene que lograr la página', req: true, ph: ['Book a free consultation', 'Que reserven una consulta gratis'] },
    { key: 'sections', en: 'Sections or content', es: 'Secciones o contenido', type: 'area', ph: ['Hero, services, prices, reviews, FAQ', 'Portada, servicios, precios, reseñas, preguntas'] },
    { key: 'ref', en: 'A page you like (link)', es: 'Una página que te guste (link)', type: 'url' },
  ],
  design: [
    { key: 'use', en: 'What it is for', es: 'Para qué es', req: true, ph: ['Instagram post for the summer sale', 'Posteo de Instagram para la promo de verano'] },
    { key: 'sizes', en: 'Sizes or formats', es: 'Tamaños o formatos', ph: ['1080 × 1350 and a story', '1080 × 1350 y una historia'] },
    { key: 'ref', en: 'References (link)', es: 'Referencias (link)', type: 'url' },
  ],
  copy: [
    { key: 'where', en: 'Where it goes', es: 'Dónde va', req: true, ph: ['Home page hero and About page', 'Portada de la home y Sobre nosotros'] },
    { key: 'message', en: 'The one thing it must say', es: 'Lo único que tiene que decir', type: 'area', req: true },
    { key: 'tone', en: 'Tone', es: 'Tono', type: 'chips', options: [['Friendly', 'Cercano'], ['Professional', 'Profesional'], ['Bold', 'Directo'], ['Premium', 'Premium']] },
  ],
  campaign: [
    { key: 'goal', en: 'Goal', es: 'Objetivo', req: true, ph: ['30 bookings in July', '30 reservas en julio'] },
    { key: 'channel', en: 'Channel', es: 'Canal', type: 'chips', req: true, options: CHANNELS },
    { key: 'when', en: 'Dates and budget', es: 'Fechas y presupuesto', ph: ['July 1 to 31, $300', '1 al 31 de julio, $300'] },
  ],
  social: [
    { key: 'network', en: 'Network', es: 'Red', type: 'chips', req: true, options: NETWORKS },
    { key: 'idea', en: 'Idea or message', es: 'Idea o mensaje', type: 'area', req: true },
    { key: 'cta', en: 'What people should do after', es: 'Qué tiene que hacer la gente después', ph: ['Book from the link in bio', 'Reservar desde el link de la bio'] },
  ],
  automation: [
    { key: 'trigger', en: 'What starts it', es: 'Qué lo inicia', req: true, ph: ['Someone fills the contact form', 'Alguien completa el formulario'] },
    { key: 'does', en: 'What it should do', es: 'Qué tiene que hacer', type: 'area', req: true, ph: ['Send me a WhatsApp and add the lead to a sheet', 'Mandarme un WhatsApp y sumar el contacto a una planilla'] },
    { key: 'tools', en: 'Tools involved', es: 'Herramientas', ph: ['WhatsApp, Google Sheets', 'WhatsApp, Google Sheets'] },
  ],
  other: [],
}

/** the answers as brief lines, then the free notes */
export function compose(kind: Kind, vals: Record<string, string>, notes: string, lang: 'en' | 'es') {
  const lines = FIELDS[kind].filter((f) => vals[f.key]?.trim()).map((f) => `${lang === 'es' ? f.es : f.en}: ${vals[f.key].trim()}`)
  return [...lines, notes.trim()].filter(Boolean).join('\n')
}

export const missing = (kind: Kind, vals: Record<string, string>) => FIELDS[kind].filter((f) => f.req && !vals[f.key]?.trim())
