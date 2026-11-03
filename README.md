# Federico Schwindt — Portfolio

A cinematic, scroll-driven 3D portfolio for **Federico Schwindt** (Website Development, Design & Marketing).

**Act 1 — the dive.** A ship falls toward Gargantua: an event horizon, a shearing accretion disk with Doppler beaming and a lensed halo, star field, telemetry HUD, a riser in the score and a white flash at the crossing.

**Act 2 — the tesseract.** An endless lattice of rooms built from beams of extruded bookshelves with warm light rails. An astronaut glides along a single red line; the portfolio chapters sit along it (approach, services, five project screens you can click to fly into, the +551% impact where the shelves burn red, and contact under the exit light).

Plus a Work index, case studies, About, a WebGL Lab and Contact.

## Stack

| Layer | Tech |
| --- | --- |
| App | Vite 8 · React 19 · TypeScript · react-router (lazy-loaded pages) |
| 3D | Three.js · React Three Fiber · drei · postprocessing (bloom, vignette) |
| Motion | GSAP 3 (ScrollTrigger, SplitText) · Lenis smooth scroll |
| Audio | Web Audio API — an original, generative organ score ("Event Horizon"); no audio files |
| Fonts | Archivo (display) · Space Grotesk (body) · Space Mono (HUD) · Instrument Serif (accents), self-hosted |
| Models | Draco-compressed GLBs in `public/char/`: `astronaut.glb` is “Cooper” by Julien Hondaâ (Sketchfab, CC BY-SA 4.0 — see `public/char/LICENSE.md`), `ship.glb` is generated |

## Performance

- One instanced draw call for the whole tesseract (~25k beams); stripes and rails are computed in the fragment shader, no textures.
- Only one act is mounted at a time; chunks of the lattice beyond the fog are never shaded.
- Adaptive pixel ratio (`PerformanceMonitor`), post-processing at 75% resolution, no shadows.
- Phones and low-power devices get the light scene: fewer rooms, no post-processing. Force it with `?light`.
- Code split into `three`, `motion`, `react` and per-page chunks.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/
```

## Editing

- **Content**: `src/content.ts` (identity, email, socials, nav, journey copy, services, projects with case-study copy, impact, about).
- **Images**: `public/work/` (covers 1440×900), `public/case/`, `public/char/portrait.jpg`.
- **Journey**: `src/three/journey.ts` — the ship's dive curve, the red line, the chapter stations, and the camera path. `src/pages/Home.tsx` maps chapters to progress ranges.
- **Score**: `src/lib/audio.ts`. To use a real track instead, drop it in `public/audio/` and set `SCORE_FILE` — only with music you hold the rights to publish; a commercial film score cannot be used on a public site.
- **Models**: replace the GLBs in `public/char/` (keep them Draco-compressed; `src/three/config.ts` has the facing rotations and sizes). The astronaut is a CC BY-SA model: keep the credit in `src/content.ts` (`credits`) and the license file if you keep the model.

## Deploying

`.github/workflows/deploy.yml` builds and publishes to **GitHub Pages** on every push to `main`. Live at `https://federico-schwindt.github.io/portfolio-FEDERICOSCH/`. `public/404.html` makes deep links work. For a custom domain, remove the `BASE_PATH` env from the workflow and add `public/CNAME`.
