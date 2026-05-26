import { test, expect } from '@playwright/test'

const SELECTORS = [
  '[class*="loopRingRotor"]',
  '[class*="contactSashTrack"]',
  '[class*="contactRoundelRotor"]',
  '[class*="flowTrack"]',
]

async function measure(page: import('@playwright/test').Page) {
  const t0 = await page.evaluate((sels) => {
    return sels.map((s) => {
      const el = document.querySelector(s)
      return el ? getComputedStyle(el).transform : null
    })
  }, SELECTORS)
  await page.waitForTimeout(1500)
  const t1 = await page.evaluate((sels) => {
    return sels.map((s) => {
      const el = document.querySelector(s)
      return el ? getComputedStyle(el).transform : null
    })
  }, SELECTORS)
  return SELECTORS.map((sel, i) => ({
    sel,
    count: t0[i] === null ? 0 : 1,
    t0: t0[i],
    t1: t1[i],
    moved: t0[i] !== null && t0[i] !== t1[i],
  }))
}

test('スクロールなし: 初期状態で全trackが動いているか', async ({ page }, info) => {
  await page.goto('/')
  await page.waitForTimeout(1500)
  const results = await measure(page)
  await info.attach('initial', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  })
  const stuck = results.filter((r) => r.count > 0 && !r.moved)
  expect(stuck, `止まっているtrack:\n${JSON.stringify(results, null, 2)}`).toHaveLength(0)
})

test('スクロール後: 各セクションを表示中に動いているか', async ({ page }, info) => {
  await page.goto('/')
  await page.waitForTimeout(800)

  await page.evaluate(async () => {
    const sections = ['#activity', '#contact', '#link']
    for (const s of sections) {
      document.querySelector(s)?.scrollIntoView({ block: 'center' })
      await new Promise((r) => setTimeout(r, 400))
    }
  })
  await page.waitForTimeout(1500)
  const results = await measure(page)
  await info.attach('after-scroll', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  })
  const stuck = results.filter((r) => r.count > 0 && !r.moved)
  expect(stuck, `止まっているtrack:\n${JSON.stringify(results, null, 2)}`).toHaveLength(0)
})
