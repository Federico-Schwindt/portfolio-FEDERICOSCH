import { motion } from 'motion/react'
import { useStore } from '../store'
import { AuthForm } from '../ui/AuthForm'
import { Mark } from '../Mark'
import { usersText } from '../i18n-users'

export function Login() {
  const { t, be, base, lang } = useStore()
  return (
    <div className="lg">
      <motion.div className="lg__card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <a href={base + (lang === 'es' ? 'es/' : '')}><Mark size={44} label="Federico Schwindt" /></a>
        <h1 className="d">{t.login.title}</h1>
        <p className="muted">{be.mode === 'demo' ? t.demo : t.login.sub}</p>
        <AuthForm start="login" />
        <p className="lg__plan muted">{usersText[lang].noAccount} <a className="link" href={base + (lang === 'es' ? 'es/' : '') + 'contact/'}>{usersText[lang].contact}</a></p>
      </motion.div>
    </div>
  )
}
