import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/gsap'
import { useIsTouch } from '../lib/hooks'

type Props = {
  children: ReactNode
  className?: string
  href?: string
  strength?: number
  target?: string
  rel?: string
  onClick?: (e: React.MouseEvent) => void
  cursor?: string
}

export function MagneticButton({ children, className = '', href, strength = 0.35, target, rel, onClick, cursor = 'link' }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  const touch = useIsTouch()

  useEffect(() => {
    const el = ref.current
    if (!el || touch) return
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      x((e.clientX - (r.left + r.width / 2)) * strength)
      y((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => {
      x(0)
      y(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [touch, strength])

  return (
    <a ref={ref} href={href} className={`magnetic ${className}`} target={target} rel={rel} onClick={onClick} data-cursor={cursor}>
      {children}
    </a>
  )
}
