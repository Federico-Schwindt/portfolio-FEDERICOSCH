import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { registerTransition } from '../lib/transition'

export function PageTransition() {
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useEffect(() => {
    registerTransition(ref.current!, (to) => navigate(to))
  }, [navigate])
  return (
    <div className="wipe" ref={ref} aria-hidden="true">
      <span className="wipe__line" />
    </div>
  )
}
