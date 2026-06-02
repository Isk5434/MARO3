# Safari 動作確認チェックリスト

MARO サイトは GSAP / Three.js / CSS マスク / `backdrop-filter` を多用しており、Safari (WebKit) で
Chrome と挙動が分かれやすい。本書は **手動確認チェックリスト** と、それを固定する
**自動ハーネス (Playwright)** の対応表をまとめる。

## 対象環境

| 区分 | 環境 | 備考 |
| --- | --- | --- |
| Desktop Safari | macOS Safari 最新 + 1つ前 | WebGL ヒーローあり |
| Mobile Safari | iOS Safari (iPhone) 最新 + 1つ前 | WebGL ヒーローは非搭載 (`HeroCanvas.tsx:32`) |
| PWA | iOS ホーム画面追加 (standalone) | InstallBanner / manifest |

> 実機が無い場合も、Playwright の `webkit` / `mobile-safari` プロジェクトで主要回帰を機械的に検出できる。
> ただし `backdrop-filter` の見た目や WebGL の発色など「目視でしか分からない項目」は実機確認が必須。

---

## 自動チェック (Playwright ハーネス)

```bash
# 既存 out/ を使ってWebKit系のみ実行
npm run test:e2e:safari

# クリーンビルドから通す
npm run test:safari
```

`e2e/safari.spec.ts` が以下を自動検証する。`@Lx` は下の手動表の行 ID と対応。

| ID | テスト | 紐づく過去修正 |
| --- | --- | --- |
| L1 | Enter Site でガラスシャッターが走りオーバーレイが消える | `83114dd` 透明 transform 補間 |
| L2 | Hero リビール完了後にマスクが覆ったまま残らない | リビールマスク系 |
| L3 | 「MAROとは？」詳細を開くとマスクが除去される | `b51930d` |
| L4 | Desktop Safari でヒーロー WebGL キャンバスが描画される | `6353100` sRGB |
| L7 | 全ページで致命的 console error が出ない | 共通 |

`e2e/marquee.spec.ts` がマーキー回帰 (`a5bebc5`) を別途カバー。

---

## 手動チェックリスト

### 1. ローディング & 入場演出
- [ ] **L1** ローディング後「Enter Site」を押すと**ガラスが砕けて外に飛ぶ**(その場でフェードするだけ＝NG)。iOS Safari の `transform: none` 非補間問題 (`83114dd`)。
- [ ] ローディングのドット/パーセントが進み、最大6秒で必ず本編に入れる(`MAX_LOADING_MS`)。
- [ ] 入場後ヒーローのタイトル/CTA/背景が**マスクの帯を残さず**全面表示される。

### 2. リビールマスク (CSS mask-image)
- [ ] **L2** ヒーローのリビール完了後、要素の一部が黒く覆われたまま残らない。
- [ ] **L3** 「MAROとは？」を開き、本文最終段落が**左下にフェードして残らない**(`b51930d`)。`-webkit-mask-image` のクリア漏れ検出。
- [ ] 内部ページ (activity / link) のテキストリビールも終端で完全表示される。

### 3. マーキー / 無限ループ
- [ ] **(marquee.spec)** トップ表示直後、`loopRingRotor` 等4種のループが動いている。
- [ ] **ページをスクロールした後も**ループが止まらず再開する。iOS Safari がスクロール中に
      compositor レイヤのアニメを止め再開しない問題 (`a5bebc5`)。`will-change` 付与は要注意。

### 4. WebGL / 3D マスコット
- [ ] **L4** Desktop Safari でヒーローの 3D マスコットが表示される(キャンバス描画あり)。
- [ ] マスコットが**ピンク/黒のアクセント付き**で表示される(真っ白＝sRGB 未設定の退行, `6353100`)。
- [ ] Mobile Safari ではキャンバス非表示で代替が崩れていない(設計通り `HeroCanvas.tsx:32`)。
- [ ] WebGL コンテキスト喪失/メモリ警告が出ない(長時間放置・タブ復帰後)。

### 5. backdrop-filter (すりガラス)
- [ ] AboutModal のオーバーレイがぼけている(`AboutModal.module.css` は `-webkit-` 併記済み)。
- [ ] ⚠️ **ヘッダーのすりガラス**: `src/styles/Header.module.css:148` は `backdrop-filter` のみで
      `-webkit-backdrop-filter` が**未併記**。古い Safari でぼけが効かない可能性 → 要 `-webkit-` 追加検討。
- [ ] スクロール時にヘッダーのぼけがちらつかない。

### 6. レイアウト / ビューポート
- [ ] `100vh` 起因でアドレスバーぶんスクロールが破綻しないか(必要なら `dvh`)。
- [ ] フォーム入力時に iOS の自動ズームが起きない(input の `font-size >= 16px`)。
- [ ] セーフエリア(ノッチ/ホームインジケータ)に要素がかぶらない。
- [ ] 横向き(landscape)でヒーロー/フッターが崩れない。

### 7. 機能 / エラー
- [ ] **L7** トップ/activity/contact/link で console に致命的エラーが出ない。
- [ ] お問い合わせフォームの送信が WebKit で動く(送信→完了表示)。
- [ ] 外部リンク (link ページ) が新規タブで開く。
- [ ] スムーズスクロール/アンカー遷移が効く。

### 8. PWA / オフライン
- [ ] ホーム画面に追加でき、アイコン/名前が `manifest.webmanifest` 通り。
- [ ] standalone 起動でレイアウトが崩れない。
- [ ] `offline.html` がオフライン時に表示される。

---

## ⚠️ ハーネスが検出した未修正バグ
- **Footer タイムスタンプの hydration 不一致 (React #418)** — `src/components/Footer.tsx:3-6` が
  `new Date().toISOString()`(=アクセス当日)を描画。静的書き出しでは**ビルド日**が HTML に焼き込まれ、
  閲覧日と異なると hydration mismatch でエラー。全ページの Footer に影響(Safari 限定ではない)。
  `npm run test:e2e:safari` の `console error なし: /` が**決定的に赤**になる。
  対応案: (a) `useEffect` でマウント後にクライアントだけで日付を出す / (b) ビルド時固定値にする /
  (c) 表示意図がビルド日なら `suppressHydrationWarning`。表示意図(当日 or 公開日)を決めてから修正する。

## 既知の要対応メモ
- `Header.module.css:148` の `-webkit-backdrop-filter` 未併記(上記 5)。安全に追記可能。
- 新規にループ系要素を足す際は `will-change: transform` / インライン `translate3d` を
  **付けない**(マーキー再開不能問題の再発要因 — `a5bebc5` の教訓)。
- 新しいリビール演出を足したら GSAP timeline の `onComplete` で必ずマスクをクリアする
  (`AboutMaroSection.tsx` / `InternalPage.tsx` のパターンに倣う)。
