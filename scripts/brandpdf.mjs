// Prints brand/brandbook.html to the identity PDF, one 1920 x 1080 page per section.
import { chromium } from 'playwright-core'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } })
await p.goto(pathToFileURL(path.resolve('brand/brandbook.html')).href, { waitUntil: 'load' })
await p.waitForTimeout(1200)
await p.pdf({ path: 'brand/Federico-Schwindt-Brand-Identity.pdf', width: '1920px', height: '1080px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } })
await p.screenshot({ path: 'scripts/.shots/brand-0.jpg', type: 'jpeg', quality: 50 })
await b.close()
console.log('pdf ok')
