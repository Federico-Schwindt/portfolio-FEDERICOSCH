// Product pictures for the home: the client dashboard (demo data), in English and Spanish → public/img/app/*.webp
// Needs the preview on :4330. Run again whenever the dashboard changes.
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import fs from 'node:fs'
fs.mkdirSync('public/img/app', { recursive: true })
const b = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
for (const lang of ['en', 'es']) {
  const base = 'http://localhost:4330/' + (lang === 'es' ? 'es/' : '')
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 })).newPage()
  await p.goto(base + 'checkout/?plan=grow&demo', { waitUntil: 'load' }); await p.waitForSelector('.af')
  await p.click('.af__swap'); await p.click('.af__swap')
  await p.fill('.af input[autocomplete=name]', lang === 'es' ? 'Ana Ruiz' : 'Ana Ruiz'); await p.fill('.af input[type=email]', 'ana@cafelavirginia.com'); await p.fill('.af input[type=password]', 'demo'); await p.click('.af button[type=submit]')
  await p.waitForSelector('.co2__me'); await p.click('.co2__pay'); await p.waitForSelector('.co2__pay-m'); await p.click('.co2__pay-m .ap-btn--red'); await p.waitForSelector('.co2__ok')
  await p.goto(base + 'app/?demo', { waitUntil: 'load' }); await p.waitForSelector('.eng')
  await p.addStyleTag({ content: '.ap-demo, .ap-side__foot button:first-child { display: none !important } *, *::before, *::after { animation-play-state: paused !important }' })
  const shot = async (name) => { await p.waitForTimeout(900); const buf = await p.screenshot({ type: 'png' }); await sharp(buf).resize(1800).webp({ quality: 82 }).toFile(`public/img/app/${name}-${lang}.webp`) }
  await p.waitForTimeout(1200); await shot('overview')
  await p.evaluate(() => (location.hash = '/board')); await p.waitForSelector('.kb'); await shot('board')
  await p.evaluate(() => (location.hash = '/calendar')); await p.waitForSelector('.cal__grid'); await shot('calendar')
  await p.evaluate(() => (location.hash = '/billing')); await p.waitForSelector('.bl-now'); await shot('plan')
  await p.context().close()
}
await b.close()
console.log(fs.readdirSync('public/img/app').map((f) => f + ' ' + Math.round(fs.statSync('public/img/app/' + f).size / 1024) + 'KB').join('\n'))
