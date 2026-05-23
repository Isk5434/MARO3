import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // DSNがない場合はSentryビルドステップをスキップ
  silent: !process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
})
