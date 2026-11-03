# Federico Schwindt — Portfolio

Immersive single-page portfolio for **Federico Schwindt** (Website Development, Design & Marketing).

Dark, typographic, with a scroll-driven WebGL scene, smooth scrolling, a generative ambient soundtrack and a custom cursor.

## Stack

| Layer | Tech |
| --- | --- |
| App | Vite 8 · React 19 · TypeScript |
| 3D | Three.js · React Three Fiber · drei · postprocessing (bloom, noise, vignette) |
| Motion | GSAP 3 (ScrollTrigger, SplitText) · Lenis smooth scroll |
| Audio | Web Audio API — fully generative, no audio files |
| Fonts | Syne (display) · Space Grotesk (UI) · Instrument Serif (accents), self-hosted via Fontsource |
| State | zustand |

## Features

- **Preloader** with 0→100 counter and an *Enter with sound / Enter muted* gate.
- **Hero** with a morphing iridescent blob (custom GLSL noise shader), orbit rings and a particle field; the blob reacts to the mouse and to the music, and travels/resizes per section while you scroll.
- **Generative soundtrack**: slow synth pads cycling through D-minor voicings, sub drone, noise bed, sparse shimmer notes, feedback delay and procedural reverb. Driven by `src/lib/audio.ts`. The nav shows a live spectrum visualiser.
- **Sections**: hero → marquee → about (word-by-word scroll reveal) → services (stacking sticky cards) → selected work (pinned horizontal scroll on desktop) → process + stats + tools marquee → contact.
- **Custom cursor** (dot + lagging ring, "View" state over projects), magnetic buttons, scroll-velocity-aware marquees, film grain overlay.
- **Full-screen menu**, local time, chapter counter, hide-on-scroll nav.
- Responsive (horizontal gallery becomes vertical on mobile), reduced-motion aware, lighter 3D on mobile / low-power devices.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/
```

## Editing content

Everything editable lives in **`src/content.ts`**: name, tagline, location/time zone, email, socials, nav, about copy, services, projects, process steps, stats and the tools marquee.

Items marked `TODO` are placeholders:

- `site.email` — replace with the real contact address.
- `socials` — real profile URLs (LinkedIn is already set).
- `projects` — the six projects are **concept placeholders**. Replace titles, categories, years, links and drop real cover images into `public/work/` (4:3 works best, ~1400×1050).

Placeholder covers and the Open Graph image were generated with `npm run covers` (`scripts/covers.mjs`, needs Playwright).

## 3D scene tuning

`src/three/keyframes.ts` defines, per section, where the blob sits (`x`/`y` as -1..1 of the viewport), its scale and the noise amplitude/frequency. Shader colours live in `src/three/Blob.tsx`.

## Deploying

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and publishes to **GitHub Pages** on every push to `main`.

1. In the repository go to **Settings → Pages** and set *Source* to **GitHub Actions**.
2. Push to `main`. The site will be live at `https://<user>.github.io/portfolio-federicosch/`.

Using a custom domain? Remove the `BASE_PATH` env from the workflow (so the base path is `/`) and add a `public/CNAME` file with your domain.

Any static host (Vercel, Netlify, Cloudflare Pages) works too: build command `npm run build`, output `dist`.
