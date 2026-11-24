import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto(process.argv[2], { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
await p.waitForTimeout(2500)
console.log(await p.evaluate((sel) => (document.querySelector(sel) || document.body).innerText, process.argv[3] || 'body'))
await b.close()
