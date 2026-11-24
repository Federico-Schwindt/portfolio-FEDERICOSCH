import { dict } from './i18n'
import type { MailConfig } from './types'

export const mailMask = '••••••••'
export const blankMail: MailConfig = { provider: 'none', sender: '', appUrl: '', apiKey: '' }
export type Topic = 'review' | 'comments' | 'billing'

export function requestLink(base: string, language: string, id: string, demo = false) {
  return base.replace(/\/$/, '') + (language === 'es' ? '/es/app/' : '/app/') +
    (demo ? '?demo' : '') + '#/request/' + encodeURIComponent(id)
}

export function composeMail(topic: Topic, language: string, title: string, detail: string, base: string, requestId?: string) {
  const es = language === 'es'
  const t = dict[es ? 'es' : 'en']
  const label = topic === 'billing' ? t.pl.kindTitle(detail, title.charAt(0).toUpperCase() + title.slice(1)) : title
  const subject = t.flow[topic] + ' · ' + label.replace(/[\r\n]+/g, ' ')
  const link = requestId ? requestLink(base, language, requestId) : base.replace(/\/$/, '') + (es ? '/es/app/' : '/app/') + '#/billing'
  const body = topic === 'review' ? t.flow.reviewBody : topic === 'comments' ? detail : label
  return { subject, text: body + '\n\n' + link + '\n\nFederico Schwindt' }
}
