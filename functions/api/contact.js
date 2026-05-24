const ALLOWED_ORIGINS = ['https://maroinu.pages.dev', 'https://www.maroinu.pages.dev']
const RATE_LIMIT = 5
const RATE_WINDOW_SECONDS = 60

function jsonResponse(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers })
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

async function readJson(response) {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    const raw = text.slice(0, 500)
    const isCloudflareChallenge =
      raw.includes('Just a moment') || raw.includes('_cf_chl_opt') || raw.includes('cf_chl')

    return {
      success: false,
      error: isCloudflareChallenge ? 'upstream_challenge' : 'invalid_upstream_response',
      raw,
    }
  }
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') ?? ''
  return new Response(null, { status: 204, headers: corsHeaders(origin) })
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') ?? ''
  const headers = corsHeaders(origin)

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ success: false, error: 'invalid_body' }, 400, headers)
  }

  const { name, email, message, turnstileToken } = body

  if (!name || !email || !message || !turnstileToken) {
    return jsonResponse({ success: false, error: 'missing_fields' }, 400, headers)
  }

  if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50) {
    return jsonResponse({ success: false, error: 'invalid_name' }, 400, headers)
  }
  if (
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    return jsonResponse({ success: false, error: 'invalid_email' }, 400, headers)
  }
  if (typeof message !== 'string' || message.trim().length < 1 || message.trim().length > 2000) {
    return jsonResponse({ success: false, error: 'invalid_message' }, 400, headers)
  }
  if (/<[^>]+>/.test(message) || (message.match(/https?:\/\//g) ?? []).length > 3) {
    return jsonResponse({ success: false, error: 'invalid_message' }, 400, headers)
  }

  if (!env.WEB3FORMS_KEY || !env.TURNSTILE_SECRET_KEY) {
    console.error('Missing contact form secret', {
      hasWeb3FormsKey: Boolean(env.WEB3FORMS_KEY),
      hasTurnstileSecretKey: Boolean(env.TURNSTILE_SECRET_KEY),
    })
    return jsonResponse({ success: false, error: 'server_not_configured' }, 500, headers)
  }

  try {
    // レート制限チェック
    if (env.RATE_LIMIT_KV) {
      const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
      const rateLimitKey = `rl:${ip}`
      const current = await env.RATE_LIMIT_KV.get(rateLimitKey)
      const count = current ? parseInt(current, 10) : 0

      if (count >= RATE_LIMIT) {
        return jsonResponse(
          { success: false, error: 'rate_limited' },
          429,
          { ...headers, 'Retry-After': String(RATE_WINDOW_SECONDS) },
        )
      }

      await env.RATE_LIMIT_KV.put(rateLimitKey, String(count + 1), {
        expirationTtl: RATE_WINDOW_SECONDS,
      })
    } else {
      console.warn('RATE_LIMIT_KV binding is missing; continuing without rate limiting')
    }

    // Cloudflare Turnstile トークン検証
    const verifyBody = new FormData()
    verifyBody.append('secret', env.TURNSTILE_SECRET_KEY)
    verifyBody.append('response', turnstileToken)

    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: verifyBody,
    })
    const verifyData = await readJson(verify)
    if (!verify.ok || !verifyData.success) {
      console.warn('Turnstile verification failed', {
        status: verify.status,
        errorCodes: verifyData['error-codes'],
      })
      return jsonResponse({ success: false, error: 'captcha_failed' }, 403, headers)
    }

    const submit = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      redirect: 'manual',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_key: env.WEB3FORMS_KEY,
        subject: 'お問い合わせがきたまろ',
        from_name: 'MARO website',
        name: name.trim(),
        email: email.trim(),
        replyto: email.trim(),
        message: message.trim(),
      }),
    })

    if (submit.status === 303) {
      return jsonResponse(
        { success: true, message: 'Email accepted by Web3Forms.' },
        200,
        headers,
      )
    }

    const data = await readJson(submit)
    if (!submit.ok || !data.success) {
      const providerError =
        data.error === 'upstream_challenge' ? 'mail_provider_challenge' : 'mail_provider_failed'
      const providerDetail = data.body?.message ?? data.message ?? data.error
      console.error('Web3Forms submission failed', {
        status: submit.status,
        error: data.error,
        message: data.message ?? data.body?.message,
      })
      return jsonResponse(
        { success: false, error: providerError, detail: providerDetail },
        502,
        headers,
      )
    }

    return jsonResponse(data, submit.status, headers)
  } catch (error) {
    console.error('Contact form failed unexpectedly', error)
    return jsonResponse({ success: false, error: 'unexpected_server_error' }, 500, headers)
  }
}
