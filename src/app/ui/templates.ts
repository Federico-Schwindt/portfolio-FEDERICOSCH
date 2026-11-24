import type { Kind } from '../types'

/** ready briefs for the requests clients send most; picking one fills the form, everything stays editable */
export type Template = { id: string; kind: Kind; en: [string, string]; es: [string, string]; every?: 'week' | 'month' }
export const TEMPLATES: Template[] = [
  { id: 'landing', kind: 'page', en: ['Landing page for an offer', 'One page, one offer. Headline, three benefits, proof, a clear call to action and a short form.'], es: ['Landing para una oferta', 'Una página, una oferta. Título, tres beneficios, pruebas, un llamado claro y un formulario corto.'] },
  { id: 'carousel', kind: 'social', en: ['Instagram carousel (5 slides)', 'Five slides on one idea. Brand colours, one message per slide, last slide sends to the site.'], es: ['Carrusel de Instagram (5 slides)', 'Cinco slides sobre una idea. Colores de marca, un mensaje por slide, la última lleva al sitio.'] },
  { id: 'newsletter', kind: 'copy', every: 'month', en: ['Monthly newsletter', 'News of the month, one featured product or service, one tip, and a link back to the site.'], es: ['Newsletter mensual', 'Novedades del mes, un producto o servicio destacado, un consejo y un link al sitio.'] },
  { id: 'posts', kind: 'social', every: 'week', en: ['Weekly social posts', 'Three posts for the week with captions and hashtags, ready to schedule.'], es: ['Posts semanales para redes', 'Tres publicaciones para la semana con textos y hashtags, listas para programar.'] },
  { id: 'fix', kind: 'fix', en: ['Something is broken on the site', 'What happens, on which page and device, and what should happen instead.'], es: ['Algo se rompió en el sitio', 'Qué pasa, en qué página y dispositivo, y qué debería pasar.'] },
  { id: 'ads', kind: 'campaign', en: ['Ad campaign set-up', 'Goal, budget, audience and the landing page it sends to. Tracking and conversions included.'], es: ['Campaña de anuncios', 'Objetivo, presupuesto, público y la página a la que lleva. Seguimiento y conversiones incluidos.'] },
  { id: 'flow', kind: 'automation', en: ['Automate a task', 'What you do by hand today, how often, and where the data comes from and goes.'], es: ['Automatizar una tarea', 'Qué haces a mano hoy, cada cuánto, y de dónde viene y a dónde va la información.'] },
  { id: 'seo', kind: 'page', every: 'month', en: ['Monthly SEO and speed check', 'Check speed, broken links and search position for the main pages; fix what is quick and list the rest.'], es: ['Revisión mensual de SEO y velocidad', 'Revisar velocidad, links rotos y posición en buscadores de las páginas principales; arreglar lo rápido y listar el resto.'] },
]
