import { marquee } from './content'
import { Scene } from './three/Scene'
import { SmoothScroll } from './components/SmoothScroll'
import { Preloader } from './components/Preloader'
import { Nav } from './components/Nav'
import { Menu } from './components/Menu'
import { Cursor } from './components/Cursor'
import { Grain } from './components/Grain'
import { Hero } from './components/Hero'
import { Marquee } from './components/Marquee'
import { About } from './components/About'
import { Services } from './components/Services'
import { Work } from './components/Work'
import { Process } from './components/Process'
import { Contact } from './components/Contact'

export function App() {
  return (
    <>
      <Scene />
      <SmoothScroll>
        <Preloader />
        <Nav />
        <Menu />
        <main id="main">
          <Hero />
          <Marquee items={marquee} outline />
          <About />
          <Services />
          <Work />
          <Process />
          <Contact />
        </main>
      </SmoothScroll>
      <Cursor />
      <Grain />
    </>
  )
}
