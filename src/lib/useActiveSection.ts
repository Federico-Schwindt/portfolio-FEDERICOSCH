import { useEffect, useState } from 'react'
import { ScrollTrigger } from './gsap'
import { useStore } from './store'

export const SECTION_ORDER = ['hero', 'about', 'services', 'work', 'process', 'contact']

export function useActiveSection() {
  const entered = useStore((s) => s.entered)
  const [active, setActive] = useState('hero')
  useEffect(() => {
    if (!entered) return
    const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]')).map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) setActive(el.dataset.scene ?? 'hero')
        },
      }),
    )
    return () => triggers.forEach((t) => t.kill())
  }, [entered])
  return active
}
