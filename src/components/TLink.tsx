import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router'
import { transitionTo } from '../lib/transition'

type Props = { to: string; children: ReactNode; className?: string; onClick?: () => void; cursor?: string }

/** Internal link that plays the page wipe before navigating. */
export function TLink({ to, children, className, onClick, cursor = 'link' }: Props) {
  const handle = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    onClick?.()
    transitionTo(to)
  }
  return (
    <Link to={to} className={className} onClick={handle} data-cursor={cursor}>
      {children}
    </Link>
  )
}
