import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { SmoothScroll } from './components/SmoothScroll'
import { Preloader } from './components/Preloader'
import { Nav } from './components/Nav'
import { Menu } from './components/Menu'
import { Cursor } from './components/Cursor'
import { PageTransition } from './components/PageTransition'
import { Home } from './pages/Home'
import { useStore } from './lib/store'
import { ScrollTrigger } from './lib/gsap'

const Work = lazy(() => import('./pages/Work').then((m) => ({ default: m.Work })))
const CaseStudy = lazy(() => import('./pages/CaseStudy').then((m) => ({ default: m.CaseStudy })))
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })))
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

function RouteEffects() {
  const { pathname, hash } = useLocation()
  const lenis = useStore((s) => s.lenis)
  const setMenu = useStore((s) => s.setMenu)
  useEffect(() => {
    setMenu(false)
    if (hash) {
      const t = window.setTimeout(() => {
        ScrollTrigger.refresh()
        lenis?.scrollTo(hash, { duration: 1.4, offset: -20 })
      }, 450)
      return () => window.clearTimeout(t)
    }
    lenis?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 150)
    return () => window.clearTimeout(t)
  }, [pathname, hash, lenis, setMenu])
  return null
}

export function App() {
  return (
    <>
      <SmoothScroll>
        <RouteEffects />
        <Preloader />
        <Nav />
        <Menu />
        <main id="main">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/work" element={<Work />} />
              <Route path="/work/:slug" element={<CaseStudy />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <PageTransition />
      </SmoothScroll>
      <Cursor />
    </>
  )
}
