const ALLOWED_ORIGINS = ['https://maroinu.pages.dev', 'https://www.maroinu.pages.dev']
const RATE_LIMIT = 5
const RATE_WINDOW_SECONDS = 60

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') ?? ''
  return new Response(null, { status: 204, headers: corsHeaders(origin) })
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') ?? ''
  const headers = corsHeaders(origin)

  // レート制限チェック
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const rateLimitKey = `rl:${ip}`
  const current = await env.RATE_LIMIT_KV.get(rateLimitKey)
  const count = current ? parseInt(current, 10) : 0

  if (count >= RATE_LIMIT) {
    return new Response(JSON.stringify({ success: false, error: 'rate_limited' }), {
      status: 429,
      headers: { ...headers, 'Retry-After': String(RATE_WINDOW_SECONDS) },
    })
  }

  await env.RATE_LIMIT_KV.put(rateLimitKey, String(count + 1), {
    expirationTtl: RATE_WINDOW_SECONDS,
  })

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'invalid_body' }), {
      status: 400,
      headers,
    })
  }

  const { name, email, message, turnstileToken } = body

  if (!name || !email || !message || !turnstileToken) {
    return new Response(JSON.stringify({ success: false, error: 'missing_fields' }), {
      status: 400,
      headers,
    })
  }

  if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50) {
    return new Response(JSON.stringify({ success: false, error: 'invalid_name' }), {
      status: 400,
      headers,
    })
  }
  if (
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    return new Response(JSON.stringify({ success: false, error: 'invalid_email' }), {
      status: 400,
      headers,
    })
  }
  if (typeof message !== 'string' || message.trim().length < 1 || message.trim().length > 2000) {
    return new Response(JSON.stringify({ success: false, error: 'invalid_message' }), {
      status: 400,
      headers,
    })
  }
  if (/<[^>]+>/.test(message) || (message.match(/https?:\/\//g) ?? []).length > 3) {
    return new Response(JSON.stringify({ success: false, error: 'invalid_message' }), {
      status: 400,
      headers,
    })
  }

  // Cloudflare Turnstile トークン検証
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: turnstileToken }),
  })
  const { success: captchaOk } = await verify.json()
  if (!captchaOk) {
    return new Response(JSON.stringify({ success: false, error: 'captcha_failed' }), {
      status: 403,
      headers,
    })
  }

  const submit = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: env.WEB3FORMS_KEY,
      subject: 'お問い合わせがきたまろ～',
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    }),
  })

  const data = await submit.json()
  return new Response(JSON.stringify(data), { status: submit.status, headers })
}
