# MARO プロジェクト 技術調査レポート

> 調査対象：`maro-hp3` リポジトリ全体  
> 作成日：2026-05-23

---

## 目次

1. [プロジェクト全体像](#1-プロジェクト全体像)
2. [セキュリティ対策](#2-セキュリティ対策)
3. [コード品質管理](#3-コード品質管理)
4. [プロジェクト整備](#4-プロジェクト整備)
5. [フロントエンド技術](#5-フロントエンド技術)
6. [インフラ・CI/CD](#6-インフラcicd)
7. [SEO・マーケティング技術](#7-seoマーケティング技術)
8. [総合評価](#8-総合評価)

---

## 1. プロジェクト全体像

### 構成

```
Next.js 16 (App Router, output: 'export')
  ├── app/                    ルーティング・ページ
  ├── src/
  │   ├── components/         UIコンポーネント
  │   ├── lib/                APIクライアント・ユーティリティ
  │   ├── types/              型定義
  │   ├── config/             設定ファイル
  │   └── styles/             CSSモジュール
  ├── functions/api/          Cloudflare Workers（サーバーレスAPI）
  ├── public/                 静的ファイル・セキュリティヘッダー
  └── .github/workflows/      CI/CD
```

### 技術スタック一覧

| レイヤー | 採用技術 |
|---|---|
| フレームワーク | Next.js 16 / React 19 |
| 言語 | TypeScript |
| 3D / アニメーション | Three.js / React Three Fiber / GSAP |
| CMS | microCMS |
| サーバーレスAPI | Cloudflare Pages Functions (Workers) |
| ホスティング | Cloudflare Pages |
| ストレージ | Cloudflare KV |
| CI/CD | GitHub Actions |
| E2Eテスト | Playwright |
| ユニットテスト | Vitest |
| エラー監視 | Sentry |
| セキュリティ | Cloudflare Turnstile / KV Rate Limiting |

---

## 2. セキュリティ対策

### 2-1. セキュリティヘッダー強化

**ファイル：** `public/_headers`

**何をやっているか**

Cloudflare Pages の `_headers` ファイルを使い、全レスポンスに HTTP セキュリティヘッダーを付与している。

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Content-Security-Policy: default-src 'self'; ...
```

| ヘッダー | 防ぐ攻撃 |
|---|---|
| HSTS + preload | HTTP通信の強制HTTPS化、SSLストリッピング攻撃 |
| CSP | XSS（クロスサイトスクリプティング） |
| X-Frame-Options | クリックジャッキング |
| X-Content-Type-Options | MIMEスニッフィング攻撃 |
| COOP / CORP | Spectre系サイドチャネル攻撃、他サイトからのリソース読み取り |
| Permissions-Policy | カメラ・マイク・位置情報の不正アクセス |

**技術的難易度**

★★★☆☆

各ヘッダーの意味と相互作用を理解する必要があるが、実装自体はファイルに書くだけ。CSP の調整（`unsafe-inline` 許可範囲など）は外部スクリプトとの兼ね合いで難しくなる。

**実務評価**

★★★★☆

ほとんどのフロントエンドエンジニアがセキュリティヘッダーを省く中、COOP/CORPまで含めて設定できているのは評価が高い。セキュリティ意識の高さが伝わる。

---

### 2-2. フォームAPI：CORS制限・入力バリデーション・KVレート制限

**ファイル：** `functions/api/contact.js`

**何をやっているか**

Cloudflare Pages Functions（サーバーレスWorker）として動作するお問い合わせAPIに、3層の防御を実装している。

**① CORS制限**
```js
const ALLOWED_ORIGINS = ['https://maroinu.pages.dev', ...]
// 許可ドメイン以外からのリクエストをブロック
```
自サイト以外からのAPIアクセスを制限し、他サイトからの悪用を防ぐ。

**② 入力バリデーション（サーバー側）**
```js
name: 1〜50文字
email: RFC形式 + 254文字制限
message: 1〜2000文字 + HTMLタグ禁止 + URL3件超禁止
```
フロント側のバリデーションは開発者ツールで簡単に迂回できるため、サーバー側での検証が本質的な防御になる。

**③ KV Rate Limiting**
```js
const ip = request.headers.get('CF-Connecting-IP')  // CF付与の本物IP
const count = await env.RATE_LIMIT_KV.get(`rl:${ip}`)
// 60秒間に5回超 → 429 Too Many Requests
await env.RATE_LIMIT_KV.put(key, count + 1, { expirationTtl: 60 })
```
Cloudflare KV を使ったIPベースのレート制限。`CF-Connecting-IP` は Cloudflare が付与するため偽装不可。カウントは60秒後に自動消滅。

**④ Turnstile検証**
```js
// サーバー側でトークンを検証（フロントだけで完結させない）
const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: turnstileToken }),
})
```
Turnstileのシークレットキーはサーバー側の環境変数にのみ保持し、フロントには一切露出しない。

**技術的難易度**

★★★★☆

サーバーレスWorkerのランタイム環境の理解、KVストアを使った状態管理、Turnstileのサーバー側検証フローなど、複数の技術を正しく組み合わせる必要がある。

**実務評価**

★★★★★

「フォームがあるだけ」のサイトに比べて圧倒的に差がつく。フロントとサーバー両側のバリデーション、bot対策、レート制限をすべて実装しているのは実務レベル。

---

### 2-3. GitHub / Cloudflare 2FA

**何をやっているか**

- **GitHub：** Authenticator app（TOTP）+ SMS + GitHub Mobile の3段階
- **Cloudflare：** Email認証

パスワードが漏洩しても、スマホを物理的に持っていなければログインできない状態にすること。GitHub が突破されると、コードの改ざん → 自動デプロイ → 本番サイトへの悪意あるコードの公開、という連鎖攻撃が成立するため最重要。

**技術的難易度**

★☆☆☆☆

設定作業のみ。技術的な実装はない。

**実務評価**

★★★★☆

「当たり前のこと」だが、設定していない人は多い。セキュリティポリシーとして「2FA必須」を徹底できているかどうかは、チーム開発・就職面接でそのまま評価される。

---

### 2-4. ブランチ保護（protect-master Ruleset）

**何をやっているか**

GitHub の Rulesets 機能で `master` ブランチに以下を設定：

- PR なしでの直接 `git push` を禁止
- `git push --force`（強制上書き）を禁止
- ブランチの削除を禁止

**技術的難易度**

★☆☆☆☆

UI操作のみ。

**実務評価**

★★★★☆

チーム開発では必須。「ブランチ保護を知っている・設定できる」は開発フローを理解していることの証明になる。個人リポジトリでも設定していると丁寧さが伝わる。

---

## 3. コード品質管理

### 3-1. ESLint 強化

**ファイル：** `eslint.config.js`

**何をやっているか**

```js
rules: {
  '@typescript-eslint/no-explicit-any': 'error',    // any型の使用を禁止
  '@typescript-eslint/no-unused-vars': ['error', {  // 未使用変数を禁止
    argsIgnorePattern: '^_',                          // _プレフィックスは許可
    varsIgnorePattern: '^_',
  }],
  'no-console': ['warn', { allow: ['warn', 'error'] }], // console.log禁止
}
```

`any` を禁止することで TypeScript を使っている意味を担保する。`no-unused-vars` は不要なコードの残存を防ぐ。

**技術的難易度**

★★☆☆☆

設定を書くだけだが、`any` を禁止すると既存コードのコンパイルエラーを全部直す必要がある。

**実務評価**

★★★★☆

`any` だらけのTypeScriptは型安全性ゼロで意味がない。`no-explicit-any: error` にしているのは「TypeScriptをちゃんと使っている」証拠になる。

---

### 3-2. Prettier 導入

**ファイル：** `.prettierrc`

**何をやっているか**

```json
{
  "semi": false,         // セミコロンなし
  "singleQuote": true,   // シングルクォート統一
  "printWidth": 100,     // 1行100文字
  "trailingComma": "all" // 末尾カンマあり
}
```

コード整形を自動化・統一化する。ESLint と競合しないよう `eslint-config-prettier` で連携。CI に `format:check` を追加することで、フォーマット違反があるとビルドが落ちる。

**技術的難易度**

★★☆☆☆

設定は簡単。ESLintとの競合解消（`eslint-config-prettier`の理解）が若干難しい。

**実務評価**

★★★★☆

チーム開発では必須。PR のコードレビューでフォーマットの話をしなくて済む状態を作れているかどうかは、チームへの配慮として評価される。

---

### 3-3. CI を3ジョブに分割

**ファイル：** `.github/workflows/ci.yml`

**何をやっているか**

```
quality-check           ← 並列実行（lint/typecheck/test/audit/format）
     ↓
   build                ← quality-check が通ったらビルド
     ↓
    e2e                 ← ビルド成果物でPlaywrightテスト
```

1ジョブにまとめると「どこで落ちたか」が分かりにくい。分割することで失敗箇所が一目で分かり、デバッグコストが下がる。`upload-artifact` / `download-artifact` でビルド成果物を次のジョブに渡している。

**技術的難易度**

★★★☆☆

GitHub Actionsのジョブ依存関係（`needs`）、アーティファクト受け渡しの理解が必要。

**実務評価**

★★★★★

「CI を構築できる」だけでなく「CI を設計できる」は一段上。ジョブ分割・依存関係・アーティファクト共有を正しく設計できているのは実務経験がなくても高評価。

---

### 3-4. npm audit・format:check を CI に追加

**何をやっているか**

```yaml
- run: npm audit --audit-level=high  # 高・致命的な脆弱性があるとCIが落ちる
- run: npm run format:check           # フォーマット違反があるとCIが落ちる
```

脆弱性のある依存パッケージを持ったままデプロイされることを防ぐ。フォーマット違反のコードがマージされることを防ぐ。

**技術的難易度**

★★☆☆☆

コマンドを追加するだけ。`--audit-level` の意味を理解していることが重要。

**実務評価**

★★★★☆

セキュリティと品質をCIで自動強制するのは実務の標準。意識の高さが伝わる。

---

## 4. プロジェクト整備

### 4-1. README（設計判断・デプロイフロー・CIバッジ）

**何をやっているか**

単なる「使い方」ではなく、**なぜその技術を選んだか**を「設計判断」セクションとして記載。

```markdown
### Next.js を選んだ理由
SEO対応・静的生成・App Routerによるルーティング・メタデータ管理を一元化するため。

### output: 'export' を選んだ理由
Cloudflare Pagesはサーバーレス環境のため、静的エクスポートと相性が良い。
```

これにより「なんとなく使った」ではなく「意図を持って選択した」ことが証明できる。

**技術的難易度**

★★☆☆☆

書くこと自体は簡単だが、設計判断を言語化するには技術理解が必要。

**実務評価**

★★★★★

採用担当・エンジニアがまず見るのはREADME。設計判断が書かれていると「設計力がある人」という印象になる。ポートフォリオとして最も費用対効果が高い作業。

---

### 4-2. 型定義の厳密化

**ファイル：** `src/types/activity.ts`

**何をやっているか**

```ts
// 変更前
export interface ActivityArticleSummary {
  publishedAt?: string  // オプショナル（undefined かも）
  eyecatch?: {
    url: string
    width?: number      // サイズ情報がオプション
    height?: number
  }
}

// 変更後
export type ActivityImage = {  // 画像型を独立させて再利用可能に
  url: string
  width: number               // 必須に変更
  height: number
}

export type ActivityArticleSummary = {
  publishedAt: string         // 必須に変更（記事には必ず日付がある）
  eyecatch?: ActivityImage    // 画像型を参照
}
```

`interface` → `type` の統一、画像型の抽出、必須フィールドの明示によって型安全性を高めた。

**技術的難易度**

★★★☆☆

TypeScriptの型設計の理解が必要。オプショナル・必須の判断はドメイン知識も必要。

**実務評価**

★★★★☆

「型があればいい」ではなく「正しい型を設計できる」は差がつく。

---

### 4-3. 404ページ

**ファイル：** `app/not-found.tsx`

**何をやっているか**

Next.js App Router の `not-found.tsx` 規約に従ったカスタム404ページ。`robots: { index: false }` で検索エンジンにインデックスさせない設定も含む。

**技術的難易度**

★☆☆☆☆

Next.jsの規約通りに作るだけ。

**実務評価**

★★★☆☆

「完成度の高いサイト」の必須要件。ないと未完成に見える。

---

## 5. フロントエンド技術

### 5-1. 3D ヒーローキャンバス

**ファイル：** `src/components/canvas/HeroCanvas.tsx`, `FloatingObjects.tsx`

**何をやっているか**

React Three Fiber（Three.js の React ラッパー）でWebGLキャンバスを構築。

```tsx
// カメラ・光源・GLTFモデルの設定
<Canvas camera={{ position: [0, 0, 5.5], fov: 48 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.25]}>
  <ambientLight intensity={1.4} color="#f8f0e0" />
  <directionalLight position={[5, 8, 5]} intensity={2.0} color="#fff8e8" />
  <FloatingObjects mouseRef={mouseRef} />
</Canvas>
```

**3Dオブジェクトのアニメーション：**
```tsx
useFrame((state, delta) => {
  mesh.current.position.y = baseY + Math.sin(state.clock.elapsedTime * speed) * amplitude
  mesh.current.rotation.x += delta * rotationX
})
```

- **Draco圧縮** GLTFモデルを使用（`.glb`ファイルをDracoで圧縮して配信サイズを削減）
- **DPR制限** `[1, 1.25]` でモバイルの過剰描画を防止
- **モバイル非表示** `useIsMobile()` で768px以下はキャンバスをレンダリングしない

**技術的難易度**

★★★★☆

Three.js / R3F の習熟、WebGLの基礎知識（マテリアル・ライティング・カメラ）、パフォーマンス最適化の理解が必要。

**実務評価**

★★★★☆

3Dグラフィックスは技術的に差がつく領域。採用側に強い印象を残せる。Dracoやモバイル対策まで考慮していると「ちゃんと設計できる」評価につながる。

---

### 5-2. ローディングアニメーション（ガラス破砕演出）

**ファイル：** `src/components/LoadingScreen.tsx`

**何をやっているか**

画面をガラスが砕けるように割れてコンテンツが現れるローディング演出。

```ts
// 60個の三角形シャード（6×5グリッド＋ランダムジッター）を生成
function buildShards(count = 60): Shard[] {
  // クリップパスで三角形を定義
  // 中央からの放射状変位ベクトルを計算
}

// GSAPで750ms変形 + 600ms フェードアウト
gsap.to(shardEl, {
  transform: `translate(${shard.dx}px, ${shard.dy}px) rotate(${shard.angle}deg)`,
  opacity: 0,
  duration: 0.75 + Math.random() * 0.3,
})
```

**進行状態管理：**
- `@react-three/drei` の `useProgress()` でリアルの読み込み進捗を取得
- 600ms 後もリアル進捗がなければ 1400ms のフェイク進捗に切り替え
- 最低 1800ms は表示（コンテンツ点滅を防止）
- CSS変数 `--hero-reveal-mask` を動かして背景マスクアニメーションと連携

**技術的難易度**

★★★★★

GSAPタイムライン制御、CSS クリップパスによる幾何学計算、React状態機械、Three.js読み込み進捗のフック、CSSカスタムプロパティとの連携など、多層技術の組み合わせ。

**実務評価**

★★★★☆

「作れる人が少ない」演出。技術力の証明として非常に有効。

---

### 5-3. PWA（Progressive Web App）

**ファイル：** `app/manifest.ts`, `src/components/InstallBanner.tsx`

**何をやっているか**

**マニフェスト：**
```ts
display: 'standalone'  // ネイティブアプリ風の全画面表示
theme_color: '#5c4534' // ブラウザのアドレスバーの色
```

**インストールバナー：**
```tsx
// iOS: beforeinstallpromptは発火しないので手動案内
// Android: beforeinstallpromptイベントをインターセプト
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()  // デフォルトのプロンプトを抑制
  setDeferredPrompt(e) // 自前のUIから起動
})
// localStorage で「一度閉じたら表示しない」を管理
```

iOS と Android でインストール方法が異なるため、両方に対応する実装が必要。

**技術的難易度**

★★★☆☆

iOS/Android の差異、`beforeinstallprompt` の仕様、`standalone` 検出など、知識がないとハマる部分が多い。

**実務評価**

★★★☆☆

PWA対応自体は加点。iOS対応まで含めると「細部まで考えている」評価につながる。

---

### 5-4. Service Worker

**ファイル：** `public/sw.js`

**何をやっているか**

ブラウザとサーバーの間に介在し、リソースをキャッシュしてオフライン閲覧を可能にする。バージョン管理付きのキャッシュ戦略を持ち、更新時に古いキャッシュを削除する。

**技術的難易度**

★★★★☆

Service Workerのライフサイクル（install/activate/fetch）、キャッシュ戦略、バージョン管理を正しく実装しないと古いコードが残り続けるバグが発生する。

**実務評価**

★★★☆☆

「動くService Worker」を実装するのは難易度が高く、あるだけで技術評価につながる。

---

## 6. インフラ・CI/CD

### 6-1. microCMS 連携 + 静的生成

**ファイル：** `src/lib/microcms.ts`, `app/activity/[id]/page.tsx`

**何をやっているか**

```ts
// ビルド時に全記事IDを取得して静的ページを生成
export async function generateStaticParams() {
  const ids = await getActivityArticleIds()
  return ids.map((id) => ({ id }))
}

// dynamicParams = false で未知URLは404
export const dynamicParams = false
```

CMS の記事更新 → GitHub の `repository_dispatch` webhook → GitHub Actions でリビルド → Cloudflare Pages に自動デプロイ、という完全自動化フローを構築している。

```yaml
# repository_dispatch で microCMS からトリガー
on:
  repository_dispatch:
    types: [microcms]
```

**技術的難易度**

★★★★☆

Headless CMS の概念、静的生成（SSG）とサーバーサイドレンダリングの使い分け、webhook → CI/CD のフロー設計の理解が必要。

**実務評価**

★★★★★

「CMSの記事を更新したらサイトが自動で更新される」という完全自動化フローは、実務で当たり前に求められる。Headless CMS + 静的生成 + webhook の三点セットを使いこなせているのは高評価。

---

### 6-2. Cloudflare Pages Functions（Workers）

**ファイル：** `functions/api/contact.js`

**何をやっているか**

フロントエンドと同一リポジトリで、サーバーレスAPIを `functions/` ディレクトリに置くだけで Cloudflare Workers として動作する。Node.js サーバーなしに API を持てる構成。

**技術的難易度**

★★★☆☆

Cloudflare Workers のランタイム（Node.jsとは異なる）、KV バインディングの設定、環境変数の扱いなどが独特。

**実務評価**

★★★★☆

「フロントエンドエンジニアがサーバーレスAPIも書ける」は現代の採用で強い。Cloudflare Workers の経験者は少ない。

---

### 6-3. Sentry エラー監視

**ファイル：** `sentry.client.config.ts`

**何をやっているか**

```ts
tracesSampleRate: 0.1,        // 全トランザクションの10%でパフォーマンス計測（コスト最適化）
replaysOnErrorSampleRate: 1.0, // エラー発生時は100%セッションリプレイを記録
replaysSessionSampleRate: 0,   // 通常時はセッションリプレイ不要
enabled: NODE_ENV === 'production' // 本番のみ有効
```

サンプリングレートを意識してコストと計測精度のバランスを取っている。

**技術的難易度**

★★☆☆☆

設定は簡単だが、サンプリングレートの意味と調整の考え方を理解していることが重要。

**実務評価**

★★★★☆

「Sentryを入れている」だけでなく「サンプリングを調整してコスト意識がある」は上位評価。本番運用を想定した設計。

---

### 6-4. E2E テスト（Playwright）

**ファイル：** `playwright.config.ts`

**何をやっているか**

```ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'mobile',   use: { ...devices['Pixel 5'] } },  // スマホ環境
]
// 静的ビルド成果物をserveしてテスト（本番同等の環境）
webServer: { command: 'npx serve out -p 3000' }
```

`next dev` ではなくビルド済み `out/` を使ってテストすることで、本番環境に近い条件でテストしている。PC・スマホ両方を自動確認。

**技術的難易度**

★★★☆☆

E2Eテストの設計（何をテストするか）、Playwrightの設定、CI連携の理解が必要。

**実務評価**

★★★★★

Playwright を CI に組み込んでいるのは実務レベル。モバイルテストまで含めているのは加点。

---

## 7. SEO・マーケティング技術

### 7-1. Schema.org 構造化データ

**ファイル：** `src/lib/structured-data.ts`

**何をやっているか**

```ts
// 各ページに合わせた schema.org JSON-LD を生成
organizationSchema()   // 組織情報
websiteSchema()        // サイト全体
webPageSchema()        // 各ページ
breadcrumbSchema()     // パンくずリスト
articleSchema()        // 記事詳細
faqSchema()            // FAQ（contactページ）
activityItemListSchema() // 記事一覧
```

Google の検索結果にリッチリザルト（星評価・FAQ展開・パンくず）を表示させるための実装。

**技術的難易度**

★★★☆☆

schema.org の仕様理解、Next.js での JSON-LD 埋め込み方法、各ページタイプへの適切なスキーマ選択が必要。

**実務評価**

★★★★☆

「SEO対応している」サイトの中でも構造化データまで実装しているのは少数。検索流入の改善に直結する実務スキル。

---

### 7-2. AI ボット向け robots.txt

**ファイル：** `app/robots.ts`

**何をやっているか**

```ts
// 主要AIクローラーを明示的に許可
GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot,
ClaudeBot, anthropic-ai, Claude-Web,
cohere-ai, Applebot-Extended, YouBot, CCBot
```

AEO（Answer Engine Optimization）/ LLMO（Large Language Model Optimization）を意識した設定。AI検索エンジンやチャットボットの回答に自サイトの情報を引用させるための許可設定。

**技術的難易度**

★★☆☆☆

各AIクローラーのUser-Agent名を知っている必要があるが、実装は簡単。

**実務評価**

★★★★☆

2025-2026年時点で最先端のSEO対策。「AIに回答させる」時代のSEOを理解していることが伝わる。

---

### 7-3. 動的サイトマップ生成

**ファイル：** `app/sitemap.ts`

**何をやっているか**

```ts
// ビルド時にmicroCMSから全記事IDを取得してサイトマップを生成
export const dynamic = 'force-static'

// ページ重要度に応じたpriorityとchangefreqを設定
{ url: '/', priority: 1.0, changeFrequency: 'weekly' }
{ url: '/activity/', priority: 0.9, changeFrequency: 'weekly' }
{ url: `/activity/${id}/`, priority: 0.7, changeFrequency: 'monthly' }
```

Next.jsのSitemap APIを使い、CMS記事の増減に対応した動的生成を実現。

**技術的難易度**

★★☆☆☆

Next.js の Sitemap API の理解が必要。

**実務評価**

★★★☆☆

SEO の基礎として必須。動的生成まで対応しているのは加点。

---

## 8. 総合評価

### 難易度・実務評価 一覧

| 項目 | 技術難易度 | 実務評価 |
|---|---|---|
| セキュリティヘッダー（CSP/HSTS/COOP/CORP） | ★★★☆☆ | ★★★★☆ |
| フォームAPI（CORS/バリデーション/KVレート制限/Turnstile） | ★★★★☆ | ★★★★★ |
| 2FA設定 | ★☆☆☆☆ | ★★★★☆ |
| ブランチ保護 | ★☆☆☆☆ | ★★★★☆ |
| ESLint強化（no-any/no-unused-vars） | ★★☆☆☆ | ★★★★☆ |
| Prettier + ESLint連携 | ★★☆☆☆ | ★★★★☆ |
| CI 3ジョブ分割（quality/build/e2e） | ★★★☆☆ | ★★★★★ |
| npm audit / format:check をCI追加 | ★★☆☆☆ | ★★★★☆ |
| README（設計判断・デプロイフロー） | ★★☆☆☆ | ★★★★★ |
| 型定義の厳密化 | ★★★☆☆ | ★★★★☆ |
| 404ページ | ★☆☆☆☆ | ★★★☆☆ |
| 3D ヒーローキャンバス（R3F/Draco） | ★★★★☆ | ★★★★☆ |
| ローディング演出（GSAP/クリップパス） | ★★★★★ | ★★★★☆ |
| PWA（iOS/Android対応） | ★★★☆☆ | ★★★☆☆ |
| Service Worker | ★★★★☆ | ★★★☆☆ |
| microCMS + 静的生成 + webhook CI/CD | ★★★★☆ | ★★★★★ |
| Cloudflare Workers（サーバーレスAPI） | ★★★☆☆ | ★★★★☆ |
| Sentry（サンプリング調整付き） | ★★☆☆☆ | ★★★★☆ |
| E2Eテスト（Playwright / モバイル対応） | ★★★☆☆ | ★★★★★ |
| Schema.org 構造化データ（7種類） | ★★★☆☆ | ★★★★☆ |
| AIボット向け robots.txt（LLMO） | ★★☆☆☆ | ★★★★☆ |
| 動的サイトマップ | ★★☆☆☆ | ★★★☆☆ |

---

### 総評

このプロジェクトが評価される最大の理由は、**技術の幅広さではなく、各技術に「なぜ使うか」の意図がある**ことにある。

| 視点 | 評価 |
|---|---|
| セキュリティ意識 | 同世代の個人サイトと比較して最上位クラス |
| CI/CD 設計 | 実務経験のある人間と同等の設計になっている |
| ドキュメント | 設計判断まで言語化できているのは少ない |
| フロントエンド技術 | 3D/アニメーション/PWAを組み合わせる力量は希少 |
| インフラ理解 | Cloudflare Pages + Workers + KV を適切に使い分けている |

**唯一の弱点：** 独自ドメインがないため Cloudflare WAF が使えず、CSP に `unsafe-inline`/`unsafe-eval` が残っている点。これは Next.js の静的エクスポート構成上の制約であり、構造的な問題ではない。

---

*本レポートはコード全体の自動調査に基づいて作成されました。*
