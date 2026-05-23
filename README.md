# MARO - 名古屋市博物館サポーター活動紹介サイト

![CI](https://github.com/Isk5434/MARO3/actions/workflows/ci.yml/badge.svg)

名古屋市博物館サポーター団体「MARO」の活動紹介サイトです。
名古屋市立大学から始まった学生主体の活動として、若い世代と博物館をつなぐ企画・運営・発信を行っています。

## URL

https://maroinu.pages.dev/

## 使用技術

| カテゴリ            | 技術                                    |
| ------------------- | --------------------------------------- |
| フレームワーク      | Next.js 16 / React 19                   |
| 言語                | TypeScript                              |
| 3D / アニメーション | Three.js / React Three Fiber / GSAP     |
| CMS                 | microCMS                                |
| ホスティング        | Cloudflare Pages                        |
| CI/CD               | GitHub Actions                          |
| E2Eテスト           | Playwright                              |
| ユニットテスト      | Vitest                                  |
| エラー監視          | Sentry                                  |
| セキュリティ        | Cloudflare Turnstile / KV Rate Limiting |

## 主な機能

- 活動記事一覧（microCMS連携）
- PWA対応（オフライン閲覧・ホーム画面追加）
- SEO対応（OGP / 構造化データ / サイトマップ / robots.txt）
- お問い合わせフォーム（Turnstile bot対策 / Rate Limit）
- 3Dモデル・アニメーション演出
- ダークモード切替

## デプロイ設計

Next.js の `output: 'export'` を使用して静的HTMLとして出力。
Cloudflare Pages にデプロイすることで、CDNによる高速配信と低コスト運用を実現しています。

### デプロイフロー

1. `master` ブランチへ push
2. GitHub Actions でビルド（lint → typecheck → test → build）
3. Cloudflare Pages へ自動デプロイ
4. microCMS 記事更新時は `repository_dispatch` で再ビルド・再デプロイ

## 設計判断

### Next.js を選んだ理由

SEO対応・静的生成・App Router によるルーティング・メタデータ管理を一元化するため。

### Cloudflare Pages を選んだ理由

静的サイトとの相性が良く、Pages Functions による API エンドポイントも同一プロジェクトで管理できるため。

### microCMS を選んだ理由

記事更新をコード変更なしに行えるようにし、非エンジニアも更新できる構成にするため。

### Playwright を導入した理由

PC / スマホ両環境での主要ページ表示崩れを CI で自動検知するため。

### `output: 'export'` を選んだ理由

Cloudflare Pages はサーバーレス環境のため、Node.js サーバーを必要としない静的エクスポートと相性が良い。
画像最適化 API は使用せず、WebP化・事前圧縮・適切なサイズ管理でパフォーマンスを確保している。

## 画像最適化

静的エクスポート構成のため Next.js の画像最適化 API は使用しない。
代わりに以下の方針でパフォーマンスを確保している。

- `public/` 配下の画像は WebP / JPG（事前圧縮済み）で管理
- 3Dモデル（`.glb`）は Draco 圧縮を適用
- `Cache-Control: immutable` でブラウザキャッシュを最大活用

## エラー監視

Sentry を導入し、フロントエンドで発生したエラーを本番環境でリアルタイムに検知できる構成にしている。
本番運用を想定したエラーの早期発見・改善サイクルに対応。

## セキュリティ対策

- セキュリティヘッダー（CSP / HSTS / COOP / CORP 等）を `public/_headers` で一元管理
- お問い合わせフォームに Cloudflare Turnstile（bot対策）を導入
- API エンドポイント（`/api/contact`）に KV ベースの Rate Limiting（1分5回制限）を実装
- 秘匿情報は Cloudflare Secrets / GitHub Secrets で管理しフロントには一切露出しない

## 制作背景

名古屋市博物館サポーター団体 MARO の活動をより多くの人に届けるため、
スマートフォンでも快適に閲覧でき、CMS で記事更新しやすいサイトを制作した。
活動情報を microCMS で管理し、非エンジニアのメンバーでも記事投稿できる構成を目指した。

## 開発環境セットアップ

```bash
# 依存関係インストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集して各キーを設定

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト
npm test
npm run test:e2e
```

## 環境変数

| 変数名                       | 説明                              |
| ---------------------------- | --------------------------------- |
| `NEXT_PUBLIC_SITE_URL`       | サイトの公開URL                   |
| `MICROCMS_SERVICE_DOMAIN`    | microCMS サービスドメイン         |
| `MICROCMS_API_KEY`           | microCMS API キー（読み取り専用） |
| `MICROCMS_ACTIVITY_ENDPOINT` | 活動記事エンドポイント名          |
| `NEXT_PUBLIC_WEB3FORMS_KEY`  | Web3Forms アクセスキー（公開用）  |
| `SENTRY_ORG`                 | Sentry 組織名                     |
| `SENTRY_PROJECT`             | Sentry プロジェクト名             |
| `SENTRY_AUTH_TOKEN`          | Sentry 認証トークン（CI専用）     |

## ライセンス

© MARO - 名古屋市博物館サポーター
