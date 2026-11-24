// Builds the Federico Schwindt logo system as outlined SVG: Archivo (variable width) + Instrument Serif italic.
import * as fontkit from 'fontkit'
import fs from 'node:fs'
import sharp from 'sharp'

const INK = '#0B0B0B', PAPER = '#FFF1E0', MAIN = '#F01111'
const archivo = fontkit.openSync('node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2')
const serif = fontkit.openSync('node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')

/** Outline a string; returns path data, advance width and cap height at `size` */
function outline(text, { font = 'archivo', wght = 900, wdth = 100, size = 100, tracking = 0 }) {
  const f = font === 'serif' ? serif : archivo.getVariation({ wght, wdth })
  const s = size / f.unitsPerEm
  const run = f.layout(text)
  let x = 0, d = ''
  run.glyphs.forEach((g, i) => { d += g.path.scale(s, -s).translate(x, 0).toSVG(); x += run.positions[i].xAdvance * s + tracking })
  return { d, width: x - tracking, cap: f.capHeight * s }
}
const svg = (w, h, body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${+w.toFixed(2)} ${+h.toFixed(2)}" width="${Math.round(w)}" height="${Math.round(h)}">${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}</svg>`

// MARK: condensed F + expanded S. One name, full range.
function mark(fill, { bg, pad = 0, tile = false } = {}) {
  const F = outline('F', { wdth: 68 }), S = outline('S', { wdth: 125 })
  const gap = 4, w = F.width + gap + S.width, h = F.cap
  const body = (ox, oy) => `<g fill="${fill}" transform="translate(${ox} ${oy})"><path d="${F.d}"/><path transform="translate(${F.width + gap} 0)" d="${S.d}"/></g>`
  if (tile) { const side = Math.max(w, h) + pad * 2; return svg(side, side, body((side - w) / 2, (side - h) / 2 + h), bg) }
  return svg(w + pad * 2, h + pad * 2, body(pad, h + pad), bg)
}
// WORDMARK: "Federico" in serif italic over SCHWINDT in expanded black
function wordmark(fill, { accent } = {}) {
  const bot = outline('SCHWINDT', { wdth: 125, size: 100, tracking: -3 })
  const top = outline('Federico', { font: 'serif', size: 62 })
  const gap = 14, h = top.cap + gap + bot.cap + 6
  return svg(bot.width, h, `<g fill="${accent || fill}" transform="translate(2 ${top.cap + 4})"><path d="${top.d}"/></g><g fill="${fill}" transform="translate(0 ${h})"><path d="${bot.d}"/></g>`)
}
// LOCKUP: mark + name on one line
function lockup(fill) {
  const F = outline('F', { wdth: 68 }), S = outline('S', { wdth: 125 })
  const n1 = outline('Federico', { font: 'serif', size: 44 }), n2 = outline('Schwindt', { wdth: 100, wght: 800, size: 36, tracking: -1 })
  const mw = F.width + 4 + S.width, h = F.cap, nameX = mw + 22
  return svg(nameX + Math.max(n1.width, n2.width), h, `<g fill="${fill}" transform="translate(0 ${h})"><path d="${F.d}"/><path transform="translate(${F.width + 4} 0)" d="${S.d}"/><path transform="translate(${nameX} ${-h + n1.cap + 2})" d="${n1.d}"/><path transform="translate(${nameX} 0)" d="${n2.d}"/></g>`)
}
const out = {
  'mark-ink.svg': mark(INK), 'mark-paper.svg': mark(PAPER), 'mark-main.svg': mark(MAIN),
  'mark-tile-main.svg': mark(INK, { bg: MAIN, pad: 34, tile: true }), 'mark-tile-ink.svg': mark(MAIN, { bg: INK, pad: 34, tile: true }),
  'wordmark-ink.svg': wordmark(INK), 'wordmark-paper.svg': wordmark(PAPER), 'wordmark-main.svg': wordmark(MAIN),
  'lockup-ink.svg': lockup(INK), 'lockup-paper.svg': lockup(PAPER),
}
fs.mkdirSync('brand/logo', { recursive: true })
for (const [n, s] of Object.entries(out)) fs.writeFileSync(`brand/logo/${n}`, s)
fs.copyFileSync('brand/logo/mark-tile-main.svg', 'public/favicon.svg')
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="800" height="450" fill="${MAIN}"/><rect x="800" width="800" height="450" fill="${INK}"/><rect y="450" width="800" height="450" fill="${PAPER}"/><rect x="800" y="450" width="800" height="450" fill="${INK}"/></svg>`
const place = async (name, w) => sharp(Buffer.from(out[name]), { density: 600 }).resize({ width: w }).png().toBuffer()
await sharp(Buffer.from(sheet)).composite([
  { input: await place('mark-ink.svg', 420), left: 190, top: 130 },
  { input: await place('wordmark-main.svg', 600), left: 900, top: 130 },
  { input: await place('lockup-ink.svg', 520), left: 140, top: 610 },
  { input: await place('mark-tile-main.svg', 220), left: 900, top: 565 },
  { input: await place('mark-tile-ink.svg', 220), left: 1180, top: 565 },
]).png().toFile('brand/logo/_preview.png')
console.log('ok')
