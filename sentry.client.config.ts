import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // 本番のみエラーを送信
  enabled: process.env.NODE_ENV === 'production',
  // パフォーマンス監視のサンプリング率（無料枠を節約）
  tracesSampleRate: 0.1,
  // エラー再現のためのセッション記録（無料枠: 50件/月）
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
})
