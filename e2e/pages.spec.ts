import { test, expect } from '@playwright/test'

test.describe('主要ページ', () => {
  test('トップページが表示される', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/MARO/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('活動ページが表示される', async ({ page }) => {
    await page.goto('/activity/')
    await expect(page).toHaveTitle(/MARO/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('お問い合わせページが表示される', async ({ page }) => {
    await page.goto('/contact/')
    await expect(page).toHaveTitle(/MARO/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('リンクページが表示される', async ({ page }) => {
    await page.goto('/link/')
    await expect(page).toHaveTitle(/MARO/)
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('SEO・AI向けファイル', () => {
  test('robots.txt が公開されている', async ({ page }) => {
    const res = await page.request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const text = await res.text()
    expect(text).toContain('User-agent')
    expect(text).toContain('Sitemap')
  })

  test('sitemap.xml が公開されている', async ({ page }) => {
    const res = await page.request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const text = await res.text()
    expect(text).toContain('<urlset')
    expect(text).toContain('maroinu.pages.dev')
  })

  test('llms.txt が公開されている', async ({ page }) => {
    const res = await page.request.get('/llms.txt')
    expect(res.status()).toBe(200)
    const text = await res.text()
    expect(text.length).toBeGreaterThan(0)
  })

  test('manifest.webmanifest が公開されている', async ({ page }) => {
    const res = await page.request.get('/manifest.webmanifest')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.name).toBeTruthy()
  })
})

test.describe('お問い合わせフォーム', () => {
  test('フォームの入力欄が存在する', async ({ page }) => {
    await page.goto('/contact/')
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('textarea[name="message"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})
