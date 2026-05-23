'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type InstallState = 'hidden' | 'android' | 'ios'

export default function InstallBanner() {
  const [state, setState] = useState<InstallState>('hidden')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // standalone（インストール済み）なら何もしない
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    if (isStandalone) return

    // 既に閉じた場合は表示しない
    if (localStorage.getItem('install-banner-dismissed')) return

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

    if (isIos) {
      setTimeout(() => setState('ios'), 2000)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setState('android'), 2000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem('install-banner-dismissed', '1')
    setState('hidden')
  }

  const install = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setState('hidden')
    }
    setInstalling(false)
    setDeferredPrompt(null)
  }

  if (state === 'hidden') return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '12px 16px',
      background: 'var(--color-bg)',
      borderTop: '1px solid var(--color-border)',
      boxShadow: '0 -4px 20px rgba(92,69,52,0.10)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontFamily: 'var(--font-jp)',
      animation: 'slideUp 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      <Image src="/favicon.jpg" alt="MARO" width={40} height={40} style={{ borderRadius: '10px', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
          MAROをホーム画面に追加
        </p>
        {state === 'ios' ? (
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-light)', lineHeight: 1.4 }}>
            Safari の <span style={{ display: 'inline-block', fontSize: '14px' }}>􀈂</span> →「ホーム画面に追加」
          </p>
        ) : (
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-light)' }}>
            オフラインでも使えます
          </p>
        )}
      </div>

      {state === 'android' && (
        <button
          onClick={install}
          disabled={installing}
          style={{
            padding: '7px 14px',
            background: 'var(--color-text)',
            color: 'var(--color-bg)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
            fontFamily: 'var(--font-jp)',
          }}
        >
          {installing ? '...' : '追加'}
        </button>
      )}

      <button
        onClick={dismiss}
        aria-label="閉じる"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-light)',
          fontSize: '18px',
          padding: '4px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}
