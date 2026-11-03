import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { World } from './three/World'
import { SmoothScroll } from './components/SmoothScroll'
import { Preloader } from './components/Preloader'
import { Nav } from './components/Nav'
import { Menu } from './components/Menu'
import { Cursor } from './components/Cursor'
import { Grain } from './components/Grain'
import { PageTransition } from './components/PageTransition'
import { Home } from './pages/Home'
import { useStore } from './lib/store'
import { ScrollTrigger } from './lib/gsap'

const Work = lazy(() => import('./pages/Work').then((m) => ({ default: m.Work })))
const CaseStudy = lazy(() => import('./pages/CaseStudy').then((m) => ({ default: m.CaseStudy })))
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })))
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })))
const Lab = lazy(() => import('./pages/Lab').then((m) => ({ default: m.Lab })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

function RouteEffects() {
  const { pathname } = useLocation()
  const lenis = useStore((s) => s.lenis)
  const setMenu = useStore((s) => s.setMenu)
  const setZoom = useStore((s) => s.setZoom)
  useEffect(() => {
    setMenu(false)
    setZoom(null)
    lenis?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 150)
    return () => window.clearTimeout(t)
  }, [pathname, lenis, setMenu, setZoom])
  return null
}

export function App() {
  return (
    <>
      <World />
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
              <Route path="/lab" element={<Lab />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <PageTransition />
      </SmoothScroll>
      <Cursor />
      <Grain />
    </>
  )
}
