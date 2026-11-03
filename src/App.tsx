import { Route, Routes, useLocation } from 'react-router'
import { useEffect } from 'react'
import { World } from './three/World'
import { SmoothScroll } from './components/SmoothScroll'
import { Preloader } from './components/Preloader'
import { Nav } from './components/Nav'
import { Menu } from './components/Menu'
import { Cursor } from './components/Cursor'
import { Grain } from './components/Grain'
import { PageTransition } from './components/PageTransition'
import { Home } from './pages/Home'
import { Work } from './pages/Work'
import { CaseStudy } from './pages/CaseStudy'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { Lab } from './pages/Lab'
import { NotFound } from './pages/NotFound'
import { useStore } from './lib/store'
import { ScrollTrigger } from './lib/gsap'

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
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 120)
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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/work" element={<Work />} />
            <Route path="/work/:slug" element={<CaseStudy />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <PageTransition />
      </SmoothScroll>
      <Cursor />
      <Grain />
    </>
  )
}
