# Federico Schwindt — portfolio

Website development, design & marketing. A red-on-white editorial site whose centrepiece is a scroll-driven retro computer: the section opens on a Windows-XP-style desktop that fills the viewport, then the camera pulls back to reveal a 3D all-in-one PC on a desk whose screen keeps rendering that same desktop, live and clickable.

Live: https://federico-schwindt.github.io/portfolio-FEDERICOSCH/

## Stack

- Vite 8 + React 19 + TypeScript
- Three.js r187, `@react-three/fiber`, `@react-three/drei` (the computer is built from primitives and lit by a studio environment)
- GSAP 3 + ScrollTrigger (pinned, scrubbed sections), Lenis smooth scroll
- `react-router` with lazy pages, `zustand` for the small shared state
- Fonts: Archivo Variable, Space Mono, Instrument Serif

## Pages

| Route | What it is |
| --- | --- |
| `/` | Hero, the Design + Code + Marketing equation, manifesto, process, selected work, packages, the XP computer, contact |
| `/work` | All projects |
| `/work/:slug` | Case study (Universal Driveshafts, Joya Hijab, Havat Aliza, DogStore, Motion CV Reel) |
| `/about` | Bio, tools, stats |
| `/contact` | Email, socials, availability |

## The XP section

`src/three/Retro.tsx` renders the machine. The desktop (`src/components/Desktop.tsx`) is real DOM placed on the screen plane with drei's `<Html transform>`, so windows open, drag and close inside the monitor while the monitor itself sits in 3D. Scroll progress (`xpProgress` in `src/lib/store.ts`) drives one camera move: face-on with the screen filling the viewport, pull back to the full machine, then ease to a three-quarter hero angle.

Two things are easy to break:

- **Hit-testing.** Chromium mis-hit-tests CSS3D content whose layout position in the viewport is fractional, which a GSAP pin or smooth scroll produces. The DOM layer is therefore portalled to `<body>`, kept `position: fixed` at an integer offset and follows the section with a transform (`LayerSync`).
- **Cropping.** When the desktop fills the viewport the camera fits the shorter axis, so part of the 1280×960 desktop is off-screen. `safeArea()` in `Desktop.tsx` keeps windows and icons inside the visible region on every aspect ratio.

## Content

Everything editable lives in `src/content.ts`: copy, projects, packages and prices, icons on the desktop, socials. Images live in `public/work`, `public/case` and `public/char`.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build && npm run preview
```

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages through `.github/workflows/deploy.yml`. The build uses `BASE_PATH=/portfolio-FEDERICOSCH/`; `public/404.html` redirects deep links back into the router.
