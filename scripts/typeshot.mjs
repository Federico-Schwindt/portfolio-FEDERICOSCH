import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--allow-file-access-from-files'] })
const p = await b.newPage({ viewport: { width: 2400, height: 1430 } })
await p.goto('file:///D:/Websites/PORTFOLIO/brand/type-options.html')
await p.waitForTimeout(1500)
await p.screenshot({ path: 'brand/type-options.png', fullPage: true })
await b.close()
