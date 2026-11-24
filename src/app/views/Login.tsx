import { motion } from 'motion/react'
import { useStore } from '../store'
import { AuthForm } from '../ui/AuthForm'

export function Login() {
  const { t, be, base, lang } = useStore()
  return (
    <div className="lg">
      <motion.div className="lg__card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <a href={base + (lang === 'es' ? 'es/' : '')}><img src={base + 'brand/mark-main.svg'} alt="Federico Schwindt" width="66" height="22" /></a>
        <h1 className="d">{t.login.title}</h1>
        <p className="muted">{be.mode === 'demo' ? t.demo : t.login.sub}</p>
        <AuthForm start="login" />
        <p className="lg__plan muted">{t.login.noPlan} <a className="link" href={base + (lang === 'es' ? 'es/' : '') + 'checkout/'}>{t.login.pick}</a></p>
      </motion.div>
    </div>
  )
}
