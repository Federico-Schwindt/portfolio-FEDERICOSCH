# Federico Schwindt — Portfolio

Cinematic, scroll-driven 3D portfolio for **Federico Schwindt** (Website Development, Design & Marketing).

One fixed WebGL canvas. Scrolling flies a camera through a continuous sequence — a red dragon and Federico's own 3D character, three floating service objects, a gallery of real project screens you can click to zoom into, a glowing core for the +551% result, and a final contact shot — while HTML overlays fade in and out over the scene. Plus a Work index, case studies, About, a WebGL Lab and Contact.

## Stack

| Layer | Tech |
| --- | --- |
| App | Vite 8 · React 19 · TypeScript · react-router |
| 3D | Three.js · React Three Fiber · drei · postprocessing (bloom, noise, vignette) |
| Motion | GSAP 3 (ScrollTrigger, SplitText) · Lenis smooth scroll |
| Audio | Web Audio API — a generative, tempo-synced soundtrack (no audio files) |
| Fonts | Syne · Space Grotesk · Instrument Serif, self-hosted via Fontsource |
| Models | Draco-compressed GLBs: `public/char/dragon.glb`, `public/char/federico.glb` (rigged, idle animation) |

## Pages

| Route | What |
| --- | --- |
| `/` | The journey: intro (dragon → character) → manifesto → services → work gallery (click a screen) → impact → contact |
| `/work` | All projects |
| `/work/:slug` | Case study (overview, challenge, solution, results, gallery) |
| `/about` | Bio, photo, facts, skills, timeline — with the 3D character beside the text |
| `/lab` | WebGL experiments: particle type, liquid metal, spectrum ring |
| `/contact` | Form (opens your mail client pre-filled), email, socials, local time |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/
```

## Editing content

Everything editable lives in **`src/content.ts`**: identity, email, socials, nav, manifesto, services, projects (with case-study copy, stats and image lists), the impact figure, about copy, facts, skills and timeline.

Images live in `public/`: `work/` (covers, 1440×900), `case/` (case-study shots), `char/` (portrait, turnaround, models).

Items marked `TODO` in `content.ts` are waiting for confirmation (project years). Covers for Havat Aliza, DogStore and the reel are generated placeholders (`npm run covers`) — swap them for real screenshots when available.

## The 3D scene

- `src/three/path.ts` — the camera journey (`HOME_PATH` keyframes by scroll progress), the positions of the service objects, the gallery layout and the core.
- `src/three/config.ts` — model paths, dragon/character placement and scale.
- `src/three/World.tsx` — the persistent canvas; it switches scenes per route.
- `src/pages/Home.tsx` — the overlay chapters and their progress ranges.
- `src/lib/audio.ts` — the generative soundtrack (84 BPM, D minor; pads, sub, pluck arpeggio, kick/hats, bells, risers).

Lower-powered devices and phones get a lighter scene automatically (no reflections or post-processing, fewer particles).

## Deploying

`.github/workflows/deploy.yml` builds and publishes to **GitHub Pages** on every push to `main`.

1. Repository **Settings → Pages → Source: GitHub Actions** (one-time).
2. Push to `main`. Live at `https://federico-schwindt.github.io/portfolio-FEDERICOSCH/`.

`public/404.html` + a snippet in `index.html` make deep links (e.g. `/work/universal-driveshafts`) work on GitHub Pages.

Custom domain? Remove the `BASE_PATH` env from the workflow and add `public/CNAME`. Any static host (Vercel, Netlify, Cloudflare Pages) works too: build `npm run build`, output `dist`.
