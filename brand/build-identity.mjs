// Builds the brand identity manual (brand/identity.html → brand/Federico-Schwindt-Brand-Identity.pdf + page previews)
// from the vector mark in brand/logo/svg. Run: node brand/build-identity.mjs
import fs from 'node:fs'
import { chromium } from 'playwright-core'

const svg = fs.readFileSync('brand/logo/svg/mark-ink.svg', 'utf8')
const D = svg.match(/ d="([^"]+)"/)[1]
const VB = svg.match(/viewBox="([^"]+)"/)[1]
const [vx, vy, vw, vh] = VB.split(' ').map(Number)
const DOT = { cx: 1046.5, cy: 337.5, r: 44 }
const geo = JSON.parse(fs.readFileSync('brand/logo/geometry.json', 'utf8'))
const INK = '#0B0B0B', PAPER = '#FFF1E0', RED = '#F01111', SMOKE = '#A39C90', STONE = '#24201C', SAND = '#F5EDE2'

/** the mark, any colours, any height; pad adds clear space around it (in units of the dot's diameter) */
const mark = ({ blade = INK, dot = RED, h = 120, pad = 0, cls = '' } = {}) => {
  const p = pad * DOT.r * 2
  return `<svg class="${cls}" viewBox="${vx - p} ${vy - p} ${vw + 2 * p} ${vh + 2 * p}" height="${h}" aria-label="Federico Schwindt" role="img"><path fill="${blade}" d="${D}"/><circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${dot}"/></svg>`
}
const lockup = ({ blade = INK, dot = RED, text = INK, h = 64, sub = '' } = {}) => `<div class="lk" style="--h:${h}px;color:${text}">${mark({ blade, dot, h })}<div class="lk__t"><b>Federico Schwindt</b>${sub ? `<span>${sub}</span>` : ''}</div></div>`

const page = (n, title, body, theme = 'paper') => `<section class="pg pg--${theme}"><header class="pg__h"><span>${String(n).padStart(2, '0')}</span><span>${title}</span><span>Federico Schwindt · Identidad de marca</span></header>${body}</section>`

// construction: the 45° diagonals, the bar heights and the dot, drawn over the mark
const b1 = geo.blade1, b2 = geo.blade2
const constr = `<svg viewBox="${vx - 70} ${vy - 70} ${vw + 140} ${vh + 140}" class="cn">
  <defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#0B0B0B" stroke-opacity=".06"/></pattern></defs>
  <rect x="${vx - 70}" y="${vy - 70}" width="${vw + 140}" height="${vh + 140}" fill="url(#g)"/>
  <path fill="${INK}" fill-opacity=".9" d="${D}"/><circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${RED}"/>
  <g stroke="${RED}" stroke-width="2" fill="none" stroke-dasharray="6 6">
    <line x1="${b1.O - (vy + vh + 40)}" y1="${vy + vh + 40}" x2="${b1.O - (vy - 40)}" y2="${vy - 40}"/>
    <line x1="${b2.O - (vy + vh + 40)}" y1="${vy + vh + 40}" x2="${b2.O - (vy - 40)}" y2="${vy - 40}"/>
    <line x1="${vx - 50}" y1="${b1.T}" x2="${vx + vw + 50}" y2="${b1.T}"/><line x1="${vx - 50}" y1="${b1.B}" x2="${vx + vw + 50}" y2="${b1.B}"/>
    <line x1="${vx - 50}" y1="${b2.T}" x2="${vx + vw + 50}" y2="${b2.T}"/><line x1="${vx - 50}" y1="${b2.B}" x2="${vx + vw + 50}" y2="${b2.B}"/>
    <circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r + 14}"/>
  </g>
  <g font-family="Martian" font-size="20" fill="${RED}">
    <text x="${b1.O - (vy + vh + 40) + 14}" y="${vy + vh + 30}">45°</text>
    <text x="${vx + vw + 4}" y="${(b1.T + b1.B) / 2 + 6}">x</text>
    <text x="${vx + vw + 4}" y="${(b2.T + b2.B) / 2 + 6}">x</text>
    <text x="${DOT.cx + DOT.r + 20}" y="${DOT.cy - 40}">⌀ ≈ 0.85x</text>
  </g></svg>`

const swatch = (name, hex, rgb, cmyk, note, dark) => `<div class="sw" style="background:${hex};color:${dark ? PAPER : INK}"><b>${name}</b><span>${hex}</span><span>RGB ${rgb}</span><span>CMYK ${cmyk}</span><em>${note}</em></div>`

const misuse = [
  [mark({ h: 90 }).replace('<svg ', '<svg style="transform:rotate(-18deg)" '), 'No lo gires.'],
  [mark({ h: 90 }).replace('<svg ', '<svg style="transform:scaleX(1.5)" '), 'No lo estires ni lo comprimas.'],
  [mark({ h: 90, dot: '#2E6BFF' }), 'El punto siempre es rojo (o del mismo color que la marca en versión de un color).'],
  [mark({ h: 90 }).replace('<svg ', '<svg style="filter:drop-shadow(8px 10px 0 #F01111)" '), 'Sin sombras, contornos ni efectos.'],
  [`<svg viewBox="${vx} ${vy} ${vw + 260} ${vh}" height="90"><path fill="${INK}" d="${D}"/><circle cx="${DOT.cx + 240}" cy="${DOT.cy}" r="${DOT.r}" fill="${RED}"/></svg>`, 'No separes ni muevas el punto.'],
  [mark({ h: 90, blade: '#C9C2B6', dot: '#F7A1A1' }), 'Nada de colores lavados o fuera de la paleta.'],
]

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Federico Schwindt · Identidad de marca</title>
<style>
@font-face{font-family:Archivo;src:url(../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2) format("woff2");font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:Serif;src:url(../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2) format("woff2");font-style:italic}
@font-face{font-family:Hanken;src:url(../node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2) format("woff2");font-weight:100 900}
@font-face{font-family:Martian;src:url(../node_modules/@fontsource-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2) format("woff2");font-weight:100 800}
@page{size:1600px 1000px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Hanken,sans-serif;background:#222;color:${INK};-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{width:1600px;height:1000px;position:relative;overflow:hidden;padding:96px 110px 90px;display:flex;flex-direction:column;page-break-after:always;break-after:page;margin:0 auto 24px}
@media print{.pg{margin:0}}
.pg--paper{background:${PAPER}}.pg--ink{background:${INK};color:${PAPER}}.pg--red{background:${RED};color:${PAPER}}.pg--sand{background:${SAND}}
.pg__h{position:absolute;inset:34px 110px auto;display:flex;justify-content:space-between;font:500 13px/1 Martian,monospace;letter-spacing:.08em;text-transform:uppercase;opacity:.7}
h1,h2{font-family:Archivo;font-weight:900;letter-spacing:-.045em;line-height:.92}
h1{font-size:150px}h2{font-size:84px;margin-bottom:28px}
h1 i,h2 i{font-family:Serif;font-weight:400;letter-spacing:-.02em;color:${RED}}
.pg--red h2 i,.pg--red h1 i{color:${PAPER}}
p.lead{font-size:28px;line-height:1.4;max-width:30ch}
p{font-size:20px;line-height:1.5}
.mono{font:500 13px/1.4 Martian,monospace;letter-spacing:.08em;text-transform:uppercase}
.row{display:flex;gap:56px;align-items:center}
.grid{display:grid;gap:28px}
.muted{opacity:.62}
/* cover */
.cv{flex:1;display:grid;grid-template-columns:1fr auto;align-items:end}
.cv h1{font-size:132px}
/* lockups */
.lk{display:inline-flex;align-items:center;gap:calc(var(--h)*.42)}
.lk__t{display:grid;gap:calc(var(--h)*.08)}
.lk__t b{font:900 calc(var(--h)*.62)/0.9 Archivo;letter-spacing:-.04em}
.lk__t span{font:500 calc(var(--h)*.2)/1 Martian,monospace;letter-spacing:.08em;text-transform:uppercase;opacity:.65}
.box{border-radius:18px;display:grid;place-items:center;padding:40px}
.sw{border-radius:16px;outline:1px solid #0B0B0B22;padding:26px;display:flex;flex-direction:column;gap:6px;min-height:300px;font:500 15px/1.4 Martian,monospace;letter-spacing:.04em}
.sw b{font:900 34px/1 Archivo;letter-spacing:-.03em;margin-bottom:auto}
.sw em{font:400 16px/1.4 Hanken;font-style:normal;opacity:.8;margin-top:8px}
.ty{display:grid;grid-template-columns:260px 1fr;gap:20px 40px;align-items:baseline;border-top:2px solid ${INK};padding-top:22px}
.ty .mono{opacity:.7}
.ms{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.ms div{background:${SAND};border-radius:16px;height:230px;display:grid;place-items:center;position:relative;overflow:hidden}
.ms div::after{content:'';position:absolute;inset:auto 18px 18px auto;width:34px;height:34px;border-radius:50%;background:${RED};mask:linear-gradient(#000,#000);opacity:.9}
.ms div::before{content:'✕';position:absolute;right:26px;bottom:20px;z-index:1;color:#fff;font:700 18px Hanken}
.ms p{font-size:16px;margin-top:10px}
/* applications */
.card{width:470px;height:270px;border-radius:14px;box-shadow:0 40px 80px -30px rgba(0,0,0,.45);position:relative;padding:38px}
.av{width:180px;height:180px;border-radius:50%;display:grid;place-items:center}
.ic{width:120px;height:120px;border-radius:28px;display:grid;place-items:center}
.sig{background:#fff;border-radius:14px;padding:26px 30px;display:flex;gap:22px;align-items:center;box-shadow:0 30px 60px -30px rgba(0,0,0,.35)}
.sig b{display:block;font:800 20px Hanken}.sig span{font-size:15px;opacity:.7}
.og{width:470px;height:247px;border-radius:14px;background:${INK};color:${PAPER};padding:40px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 40px 80px -30px rgba(0,0,0,.5)}
.og h3{font:900 42px/.95 Archivo;letter-spacing:-.04em}.og h3 i{font-family:Serif;font-weight:400;color:${RED}}
.cs{position:relative}
.cs .zone{position:absolute;border:2px dashed ${RED};inset:0}
.cs .x{position:absolute;font:600 15px Martian;color:${RED}}
</style></head><body>

${page(1, 'Portada', `<div class="cv"><div><p class="mono" style="color:${RED};margin-bottom:28px">Identidad de marca · 2026</p><h1>Federico<br>Schwindt</h1><p class="lead" style="margin-top:28px;opacity:.75">Diseño, código, marca y marketing. Un equipo entero, en una persona.</p></div>${mark({ blade: PAPER, h: 420 })}</div>`, 'ink')}

${page(2, 'La marca', `<div class="row" style="flex:1;align-items:center"><div style="flex:1"><h2>Dos trazos <i>y un punto.</i></h2>
<p class="lead">La F está hecha de dos trazos que avanzan en itálica, como una firma rápida: el primero es el boceto, el segundo lo que sale a la venta.</p>
<p style="margin-top:24px;max-width:46ch">Van siempre hacia adelante y hacia arriba. El punto rojo es el momento en que algo queda terminado y en vivo: la idea que llega a destino. Es el único color fuerte de la marca y se usa con la misma economía en todo lo demás.</p></div>
<div class="box" style="background:${INK};width:620px;height:620px">${mark({ blade: PAPER, h: 380 })}</div></div>`)}

${page(3, 'Construcción', `<div class="row" style="flex:1"><div style="width:520px"><h2>Construcción</h2>
<p>Los dos trazos comparten el mismo ángulo de <b>45°</b> y el mismo grosor (<b>x</b>). Cada uno es una barra horizontal que gira a 45° con una curva amplia; los extremos se cortan con un arco convexo: afilado arriba a la derecha, redondeado en la punta.</p>
<p style="margin-top:18px">El punto mide alrededor de 0.85x y se apoya a la altura del primer trazo. La marca se reconstruyó en vector a partir del dibujo original: usa siempre los archivos de <span class="mono">brand/logo/svg</span>, nunca una captura.</p></div>
<div style="flex:1">${constr}</div></div>`)}

${page(4, 'Área de respeto y tamaño mínimo', `<div class="row" style="flex:1;align-items:center;gap:90px"><div style="width:520px"><h2>Aire <i>alrededor.</i></h2>
<p>Deja libre alrededor de la marca, como mínimo, el diámetro del punto (<b>d</b>). Dentro de esa zona no van textos, bordes ni otras marcas.</p>
<div class="grid" style="margin-top:40px;grid-template-columns:auto auto;gap:18px 28px;align-items:end">
<div>${mark({ h: 64 })}</div><div>${mark({ h: 24 })}</div>
<p class="mono">Pantalla · mín. 24 px de alto</p><p class="mono">Favicon · 16 px, versión cuadrada</p></div>
<p class="mono" style="margin-top:22px">Impreso · mín. 8 mm de alto</p></div>
<div class="cs" style="padding:${DOT.r * 2 * 0.5}px">${mark({ h: 440, pad: 1 }).replace('<svg ', '<svg style="background:' + SAND + ';border-radius:12px" ')}<div class="zone" style="inset:${DOT.r * 2 * 0.5}px"></div><span class="x" style="top:4px;left:50%">d</span><span class="x" style="left:8px;top:50%">d</span></div></div>`)}

${page(5, 'Versiones', `<h2>Versiones</h2><div class="grid" style="grid-template-columns:repeat(3,1fr);flex:1">
<div class="box" style="background:${PAPER};outline:2px solid #0001">${mark({ h: 200 })}<p class="mono" style="margin-top:24px">Principal · sobre papel</p></div>
<div class="box" style="background:${INK};color:${PAPER}">${mark({ blade: PAPER, h: 200 })}<p class="mono" style="margin-top:24px">Principal · sobre tinta</p></div>
<div class="box" style="background:${RED};color:${PAPER}">${mark({ blade: PAPER, dot: PAPER, h: 200 })}<p class="mono" style="margin-top:24px">Sobre rojo · todo papel</p></div>
<div class="box" style="background:#fff;outline:2px solid #0001">${mark({ dot: INK, h: 140 })}<p class="mono" style="margin-top:18px">Un color · tinta</p></div>
<div class="box" style="background:${STONE};color:${PAPER}">${mark({ blade: PAPER, dot: PAPER, h: 140 })}<p class="mono" style="margin-top:18px">Un color · papel</p></div>
<div class="box" style="background:${SAND}"><div class="row" style="gap:26px"><div class="ic" style="background:${INK}">${mark({ blade: PAPER, h: 64 })}</div><div class="ic" style="background:${RED}">${mark({ blade: PAPER, dot: PAPER, h: 64 })}</div><div class="ic" style="background:${PAPER};outline:2px solid #0001">${mark({ h: 64 })}</div></div><p class="mono" style="margin-top:18px">Ícono · cuadrado con esquinas suaves</p></div>
</div>`)}

${page(6, 'Firmas', `<h2>Marca <i>y nombre.</i></h2><div class="grid" style="grid-template-columns:1fr 1fr;flex:1">
<div class="box" style="background:${PAPER};outline:2px solid #0001;justify-items:start;padding:60px">${lockup({ h: 96 })}<p class="mono muted" style="margin-top:30px">Horizontal · uso principal</p></div>
<div class="box" style="background:${INK};justify-items:start;padding:60px">${lockup({ blade: PAPER, text: PAPER, h: 96, sub: 'Diseño y desarrollo web' })}<p class="mono" style="margin-top:30px;color:${SMOKE}">Con descriptor</p></div>
<div class="box" style="background:${SAND}"><div style="display:grid;justify-items:center;gap:26px">${mark({ h: 150 })}<b style="font:900 56px/1 Archivo;letter-spacing:-.04em">Federico Schwindt</b></div><p class="mono muted" style="margin-top:26px">Apilada</p></div>
<div class="box" style="background:${RED};color:${PAPER}">${lockup({ blade: PAPER, dot: PAPER, text: PAPER, h: 80 })}<p class="mono" style="margin-top:26px">Sobre rojo</p></div>
</div><p style="margin-top:20px" class="muted">El nombre va en Archivo Black. La distancia entre marca y nombre es 0.42 veces la altura de la marca.</p>`)}

${page(7, 'Color', `<h2>Color</h2><div class="grid" style="grid-template-columns:1.4fr 1fr 1fr 0.8fr 0.8fr;flex:1;align-items:stretch">
${swatch('Rojo', RED, '240 17 17', '0 93 93 6', 'El punto, los llamados a la acción y un acento por pieza. Nunca de fondo en textos largos.', true)}
${swatch('Tinta', INK, '11 11 11', '0 0 0 96', 'Texto, la marca y los fondos oscuros.', true)}
${swatch('Papel', PAPER, '255 241 224', '0 5 12 0', 'El fondo de la marca. Cálido, nunca blanco puro.', false)}
${swatch('Arena', SAND, '245 237 226', '0 3 8 4', 'Superficies y tarjetas.', false)}
${swatch('Humo', SMOKE, '163 156 144', '0 4 12 36', 'Textos secundarios.', false)}
</div><div style="display:flex;height:40px;border-radius:10px;overflow:hidden;margin-top:28px"><i style="flex:60;background:${PAPER};outline:1px solid #0002"></i><i style="flex:30;background:${INK}"></i><i style="flex:10;background:${RED}"></i></div><p class="mono muted" style="margin-top:10px">Proporción de uso · 60 papel · 30 tinta · 10 rojo</p>`)}

${page(8, 'Tipografía', `<h2>Tipografía</h2><div class="grid" style="gap:26px">
<div class="ty"><span class="mono">Títulos · Archivo Black</span><span style="font:900 86px/1 Archivo;letter-spacing:-.045em">Del boceto a la venta.</span></div>
<div class="ty"><span class="mono">Acento · Instrument Serif itálica</span><span style="font:italic 400 78px/1 Serif;color:${RED}">un equipo entero.</span></div>
<div class="ty"><span class="mono">Texto · Hanken Grotesk</span><span style="font:400 28px/1.45 Hanken;max-width:44ch">Diseñador, desarrollador, estratega de marca y marketer en una sola persona. Pedidos que avanzan varios a la vez.</span></div>
<div class="ty"><span class="mono">Etiquetas · Martian Mono</span><span style="font:500 20px/1 Martian;letter-spacing:.08em;text-transform:uppercase">Pedido #128 · En curso · 48 h</span></div>
</div><p class="muted" style="margin-top:22px">Los títulos combinan Archivo con una palabra en Instrument Serif itálica, en rojo o en el color del texto. Una sola palabra en serif por título.</p>`)}

${page(9, 'Usos incorrectos', `<h2>Lo que <i>no.</i></h2><div class="ms">${misuse.map(([m, t]) => `<figure><div>${m}</div><p>${t}</p></figure>`).join('')}</div>`)}

${page(10, 'Aplicaciones', `<h2>Aplicaciones</h2><div style="flex:1;display:grid;grid-template-columns:auto auto auto;gap:46px;align-items:center">
<div class="grid" style="gap:34px"><div class="card" style="background:${INK};color:${PAPER}">${mark({ blade: PAPER, h: 70 })}<div style="position:absolute;left:38px;bottom:34px"><b style="font:900 34px/1 Archivo;letter-spacing:-.03em">Federico Schwindt</b><p class="mono" style="margin-top:10px;color:${SMOKE}">Diseño y desarrollo web</p></div><span style="position:absolute;right:34px;bottom:36px;width:14px;height:14px;border-radius:50%;background:${RED}"></span></div>
<div class="card" style="background:${PAPER};"><p class="mono" style="color:${RED}">Federico Schwindt</p><div style="position:absolute;left:38px;bottom:34px;font:400 18px/1.6 Hanken">Diseño y desarrollo web<br>Gualeguaychú, Argentina</div>${mark({ h: 46 }).replace('<svg ', '<svg style="position:absolute;right:34px;bottom:34px" ')}</div></div>
<div class="grid" style="gap:34px;justify-items:center"><div class="row" style="gap:30px"><div class="av" style="background:${INK}">${mark({ blade: PAPER, h: 92 })}</div><div class="av" style="background:${RED}">${mark({ blade: PAPER, dot: PAPER, h: 92 })}</div></div><p class="mono muted">Avatar para redes</p>
<div class="sig">${mark({ h: 46 })}<div><b>Federico Schwindt</b><span>Diseño, desarrollo, marca y marketing</span></div></div><p class="mono muted">Firma de email</p></div>
<div class="og"><div class="row" style="justify-content:space-between;align-items:flex-start">${mark({ blade: PAPER, h: 56 })}<span class="mono" style="color:${SMOKE}">Federico Schwindt</span></div><h3>Del boceto <i>a la venta.</i></h3></div>
</div>`, 'sand')}

${page(11, 'Voz', `<div class="row" style="flex:1;align-items:center"><div style="flex:1"><h2>Cómo <i>suena.</i></h2>
<p class="lead">Directo, cálido y concreto. Frases cortas, verbos activos, números reales.</p></div>
<div class="grid" style="flex:1;gap:22px">
<div><p class="mono" style="color:${RED}">Sí</p><p style="font-size:24px">"Te muestro el diseño el jueves y lo publicamos el lunes."</p></div>
<div><p class="mono muted">No</p><p style="font-size:24px;opacity:.55">"Soluciones digitales innovadoras para potenciar tu negocio."</p></div>
<div><p class="mono" style="color:${RED}">Sí</p><p style="font-size:24px">"Hablas con quien hace el trabajo."</p></div>
<div><p class="mono muted">No</p><p style="font-size:24px;opacity:.55">"Nuestro equipo de expertos está a tu disposición."</p></div>
</div></div>`)}

${page(12, 'Contacto', `<div class="cv"><div><h1>Gracias.</h1><p class="lead" style="margin-top:26px;opacity:.75">Archivos de la marca: <span class="mono">brand/logo/svg</span> (SVG) y <span class="mono">public/brand</span> (sitio).</p></div>${mark({ blade: PAPER, dot: PAPER, h: 300 })}</div>`, 'red')}
</body></html>`

fs.writeFileSync('brand/identity.html', html)
const b = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } })
await p.goto('file:///' + process.cwd().replace(/\\/g, '/') + '/brand/identity.html', { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.pdf({ path: 'brand/Federico-Schwindt-Brand-Identity.pdf', width: '1600px', height: '1000px', printBackground: true })
fs.mkdirSync('brand/identity-pages', { recursive: true })
const n = await p.locator('.pg').count()
for (let i = 0; i < n; i++) await p.locator('.pg').nth(i).screenshot({ path: `brand/identity-pages/${String(i + 1).padStart(2, '0')}.png` })
await b.close()
console.log('pages', n, 'pdf', (fs.statSync('brand/Federico-Schwindt-Brand-Identity.pdf').size / 1024).toFixed(0) + ' KB')
