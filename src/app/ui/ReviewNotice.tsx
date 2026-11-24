import { useRef, useState } from 'react'
import { dict } from '../i18n'
import { requestLink } from '../mail'
import { useStore } from '../store'
import type { Req } from '../types'

export function ReviewNotice({ request }: { request: Req }) {
  const { t, lang, base, be, toast } = useStore()
  const [language, setLanguage] = useState(lang)
  const message = useRef<HTMLTextAreaElement>(null)
  const demo = be.mode === 'demo'
  const copy = dict[language].reviewMail
  const link = new URL(requestLink(base, language, request.id, demo), location.origin)
  const title = request.title.replace(/[\r\n]+/g, ' ')
  const subject = copy.subjectLine(title)
  const body = copy.body(title, link.href)
  // A mailto can address multiple people. A review belongs to a single client.
  const email = request.ownerEmail
  const recipient = email && /^[^\s@,;:<>?"\\]+@[^\s@,;:<>?"\\]+$/.test(email) ? encodeURIComponent(email).replace('%40', '@') : null
  const draft = recipient && `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\n/g, '\r\n'))}`
  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(body)
      toast(t.reviewMail.copied)
    } catch {
      message.current?.focus()
      message.current?.select()
      toast(t.reviewMail.manual)
    }
  }

  return (
    <section className="dr__notice">
      <h3>{t.reviewMail.title}</h3>
      {email && <p>{t.reviewMail.to} <b>{email}</b></p>}
      <label>{t.reviewMail.language}
        <select value={language} onChange={(e) => setLanguage(e.target.value === 'es' ? 'es' : 'en')}>
          <option lang="en" value="en">English</option><option lang="es" value="es">Español</option>
        </select>
      </label>
      <p>{t.reviewMail.subject} <b lang={language}>{subject}</b></p>
      <textarea ref={message} lang={language} aria-label={t.reviewMail.message} rows={8} readOnly value={body} />
      {demo ? <p className="muted">{t.reviewMail.demo}</p> : (
        <div className="dr__fa dr__fa--l">
          {draft && <a className="ap-btn ap-btn--sm" href={draft}>{t.reviewMail.draft}</a>}
          <button type="button" className="ap-btn ap-btn--sm ap-btn--ghost" onClick={copyMessage}>{t.reviewMail.copy}</button>
        </div>
      )}
    </section>
  )
}
