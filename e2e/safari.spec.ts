import { test, expect, type Page } from '@playwright/test'

// このファイルは過去に Safari (WebKit) で踏んだ不具合を回帰として固定するためのもの。
// 各 test は対応する修正コミットと checklist の項目に紐づく。
//   - ローディングのガラスシャッター遷移        → 83114dd / #L1
//   - Hero リビールマスクの残留                  → b51930d 系 / #L2
//   - MARO詳細パネルのリビールマスク残留         → b51930d / #L3
//   - マスコット(GLB)の sRGB 描画 → WebGL 起動    → 6353100 / #L4
//   - 各ページの致命的 console error            → 共通 / #L7
//
// 実行: npx playwright test e2e/safari.spec.ts --project=webkit --project=mobile-safari

const PAGES = ['/', '/activity/', '/contact/', '/link/']

/** ローディング画面の「Enter Site」を押してヒーローへ遷移し、オーバーレイ消滅まで待つ。 */
async function passLoadingScreen(page: Page) {
  const enter = page.getByRole('button', { name: 'サイトに入る' })
  // ready フェーズになるまで disabled。最大 MAX_LOADING_MS(6s)+α で必ず有効化される。
  // 並列実行時の負荷を見込んで余裕を持たせる。
  await expect(enter).toBeEnabled({ timeout: 15000 })
  await enter.click()
}

// 入場フローは WebKit ページごとに WebGL+GSAP を起動するため、並列で多重起動すると
// 負荷でフレークする。1件ずつ直列で回して接触を避ける(単体ではいずれも安定)。
test.describe('Safari 回帰チェック: 入場・演出', () => {
  test.describe.configure({ mode: 'serial' })

  test('ローディング: Enter Site でシャッターが走りオーバーレイが消える @L1', async ({ page }) => {
    await page.goto('/')
    await passLoadingScreen(page)

    // phase === 'done' で overlay 自体が unmount される (LoadingScreen.tsx:250)。
    // iOS Safari で transform:none からの補間が効かず固まる不具合(83114dd)の回帰検出。
    await expect(page.locator('[class*="overlay"]').first()).toHaveCount(0, { timeout: 12000 })
  })

  test('Hero: リビール完了後にマスクが残らない @L2', async ({ page }) => {
    await page.goto('/')
    await passLoadingScreen(page)

    // リビール timeline は 3.6s + delay。十分待ってから --hero-reveal-mask が
    // 「黒で覆ったまま」になっていない(=透けて見える終端値)ことを確認する。
    await page.waitForTimeout(6000)
    const leftover = await page.evaluate(() => {
      const targets = [...document.querySelectorAll<HTMLElement>('[data-hero-mask]')]
      return targets
        .map((el) => el.style.getPropertyValue('--hero-reveal-mask'))
        .filter((v) => v && /black\s+([0-9]|[1-9][0-9])%/.test(v) === false && /transparent\s+(100|[5-9][0-9])%/.test(v))
    })
    expect(leftover, `覆ったままのマスク: ${JSON.stringify(leftover)}`).toHaveLength(0)
  })

  test('MAROとは: 詳細を開くとリビールマスクが除去される @L3', async ({ page }) => {
    await page.goto('/')
    await passLoadingScreen(page)

    await page.locator('#about').scrollIntoViewIfNeeded()
    await page.waitForTimeout(2000) // セクションのリビール完了待ち

    const openBtn = page.getByRole('button', { name: 'MAROとは？を開く' })
    // リビール/フロート演出でボタンが動き続けるため stability 判定を待たず強制クリック。
    await openBtn.click({ force: true })

    // onComplete で mask-image:none / --about-reveal-mask 除去 (AboutMaroSection.tsx:98-104)。
    // ここが効かないと最終段落が左下にフェードして残る(b51930d)。
    // 詳細リビール(1.05s)の完了時刻は端末性能で揺れるため、固定sleepではなく解除されるまでポーリング。
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const ps = [...document.querySelectorAll<HTMLElement>('[data-detail-reveal]')]
            if (ps.length === 0) return -1 // まだ詳細が描画されていない
            return ps.filter((el) => {
              const m = getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage
              return m && m !== 'none'
            }).length
          }),
        { timeout: 8000, message: 'マスクが残った段落が解消されない' },
      )
      .toBe(0)
  })

  test('WebGL: デスクトップ Safari でヒーローキャンバスが描画される @L4', async ({ page, isMobile }) => {
    // モバイルは HeroCanvas が null を返す設計 (HeroCanvas.tsx:32) のためスキップ。
    test.skip(isMobile, 'モバイルはWebGLキャンバス非搭載')
    await page.goto('/')
    await passLoadingScreen(page)

    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 10000 })
    const box = await canvas.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThan(0)
    expect(box?.height ?? 0).toBeGreaterThan(0)

    // WebGL コンテキストが実際に取れているか(白飛び/未描画の早期検出)。
    const hasGl = await canvas.evaluate((el: HTMLCanvasElement) => {
      const gl = el.getContext('webgl2') || el.getContext('webgl')
      return !!gl
    })
    expect(hasGl, 'WebGLコンテキストが取得できない').toBe(true)
  })
})

test.describe('Safari 回帰チェック: ページ健全性', () => {
  for (const path of PAGES) {
    test(`console error なし: ${path} @L7`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      await page.goto(path)
      await page.waitForTimeout(2500)

      // サードパーティ計測/フォント等の許容ノイズを除外。
      // Cloudflare RUM/Turnstile はローカル serve(http)だと CORS/protocol で弾かれるが本番(https)では正常。
      const fatal = errors.filter(
        (e) =>
          !/favicon|sentry|net::ERR|Failed to load resource|ResizeObserver|cloudflare|cdn-cgi|turnstile|Access-Control-Allow-Origin|Protocols must match/i.test(
            e,
          ),
      )
      expect(fatal, `致命的エラー:\n${fatal.join('\n')}`).toHaveLength(0)
    })
  }
})
