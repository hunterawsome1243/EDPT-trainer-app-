/*
 * End-to-end smoke test. Builds the app, serves it, and drives every main flow
 * in headless Chromium: settings, a lesson mastery check, a practice session, a
 * quarter-length exam, the report, analytics, plan, rule library, mental math.
 * Screenshots land in ./smoke-shots. Fails on any page or console error.
 *
 *   npm run build && npm run smoke
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const S = 'smoke-shots'
mkdirSync(`${S}/shots`, { recursive: true })
const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 1500))
// CHROMIUM_PATH lets you point at an existing Chromium instead of downloading one.
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
const base = 'http://localhost:4173/#'
const shot = (n) => page.screenshot({ path: `${S}/shots/${n}.png`, fullPage: true })

await page.goto(base + '/')
await page.waitForSelector('h1:has-text("EDPT Trainer")')
await shot('01-home')

// Settings: set test date and AFSC
await page.goto(base + '/settings')
await page.waitForSelector('text=Your target')
await page.fill('input[type=date]', '2026-11-15')
await page.selectOption('select >> nth=0', '17S / 17D')
await shot('02-settings')

// Lesson + mastery check
await page.goto(base + '/learn/number-sequence')
await page.waitForSelector('text=Mastery check')
await page.click('text=Start mastery check')
for (let i = 0; i < 10; i++) {
  await page.waitForSelector('[role=radio]')
  await page.click('[role=radio] >> nth=0')
  await page.click('button:has-text("Check")')
  await page.waitForSelector('text=Pattern:')
  if (i === 0) await shot('03-mastery-q')
  await page.click(i < 9 ? 'button:has-text("Next")' : 'button:has-text("Finish")')
}
await page.waitForSelector('text=/\\d+ \\/ 10 correct/')
await shot('04-mastery-done')

// Practice: timed 5 questions mixed, instant feedback
await page.goto(base + '/practice')
await page.waitForSelector('text=Question types')
await page.fill('input[type=number] >> nth=0', '5')
await page.click('button:has-text("Start")')
await page.waitForSelector('[role=radio]')
await shot('05-practice-q')
for (let i = 0; i < 5; i++) {
  await page.waitForSelector('[role=radio]')
  await page.keyboard.press('B')
  await page.click('button:has-text("Submit")')
  await page.waitForSelector('text=Pattern:')
  await page.click(i < 4 ? 'button:has-text("Next")' : 'button:has-text("Finish")')
}
await page.waitForSelector('text=Session complete')
await shot('06-practice-summary')

// Quarter exam
await page.goto(base + '/simulate')
await page.waitForSelector('text=Quarter length')
await page.click('button:has-text("Start") >> nth=2')
await page.waitForSelector('[role=timer]')
await shot('07-exam-q1')
// flag, scratch pad, answer a few, use map
await page.click('button:has-text("Flag for review")')
await page.click('button:has-text("Scratch pad")')
await page.fill('#scratch', '1 2 3')
for (let i = 0; i < 29; i++) {
  await page.click('[role=radio] >> nth=1')
  await page.click('button:has-text("Next")')
}
await page.click('[role=radio] >> nth=0')
await shot('08-exam-last')
await page.click('button:has-text("Finish exam")')
await page.waitForSelector('[role=dialog]')
await page.click('[role=dialog] button:has-text("Submit")')
await page.waitForSelector('text=Estimated EDPT band', { timeout: 20000 })
await shot('09-report')

// Analyze, plan, rules, mental math, reference, glossary
await page.goto(base + '/analyze'); await page.waitForSelector('text=Rule heatmap'); await shot('10-analyze')
await page.goto(base + '/plan'); await page.waitForSelector('text=Study plan'); await shot('11-plan')
await page.goto(base + '/learn/rules'); await page.waitForSelector('text=Rule library'); await page.click('button:has-text("Odd one out")'); await page.waitForSelector('text=Pattern:'); await shot('12-rules')
await page.goto(base + '/learn/mental-math'); await page.click('button:has-text("Start") >> nth=0'); await page.waitForSelector('input[aria-label="Your answer"]'); await page.fill('input[aria-label="Your answer"]', '1'); await page.keyboard.press('Enter'); await shot('13-mental')
await page.goto(base + '/reference'); await page.waitForSelector('text=Commonly cited'); 
await page.goto(base + '/learn/glossary'); await page.waitForSelector('text=Glossary')
await page.goto(base + '/learn/figure'); await page.waitForSelector('text=Figure patterns')
// desktop view
await page.setViewportSize({ width: 1280, height: 900 })
await page.goto(base + '/'); await page.waitForSelector('text=Readiness'); await shot('14-home-desktop')
await page.goto(base + '/practice?type=figure'); await page.fill('input[type=number] >> nth=0', '3'); await page.click('button:has-text("Start")'); await page.waitForSelector('[role=radio]'); await shot('15-figure-desktop')

await browser.close()
server.kill()
if (errors.length) {
  console.error('ERRORS:\n' + errors.join('\n'))
  process.exit(1)
}
console.log('Smoke test passed; screenshots in', S)
