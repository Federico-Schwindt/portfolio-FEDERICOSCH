import { chromium } from 'playwright-core'
import fs from 'node:fs'
const [pre, from, to, out] = process.argv.slice(2)
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1920, height: 1100 } })
const file = (i) => [`${pre}${i}.jpg`, `${pre}${String(i).padStart(2, "0")}.jpg`].find((f) => fs.existsSync(f))
const ids = []; for (let i = +from; i <= +to; i++) if (file(i)) ids.push(i)
const imgs = ids.map((i) => `<div style="width:25%;float:left;position:relative"><img src="data:image/jpeg;base64,${fs.readFileSync(file(i)).toString('base64')}" style="width:100%;display:block;border:2px solid #f0f;box-sizing:border-box"><b style="position:absolute;left:6px;top:4px;background:#f0f;color:#fff;font:12px sans-serif;padding:1px 4px">${i}</b></div>`).join('')
await p.setContent(`<body style="margin:0;background:#f0f">${imgs}</body>`)
await p.screenshot({ path: out, quality: 60, type: 'jpeg', fullPage: true })
await b.close()
