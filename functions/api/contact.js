export async function onRequestPost({ request, env }) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'invalid_body' }), { status: 400, headers })
  }

  const { name, email, message, turnstileToken } = body
  if (!name || !email || !message || !turnstileToken) {
    return new Response(JSON.stringify({ success: false, error: 'missing_fields' }), { status: 400, headers })
  }

  // Cloudflare Turnstile トークン検証
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: turnstileToken }),
  })
  const { success: captchaOk } = await verify.json()
  if (!captchaOk) {
    return new Response(JSON.stringify({ success: false, error: 'captcha_failed' }), { status: 403, headers })
  }

  // web3forms に転送（アクセスキーはサーバー側のみ）
  const submit = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: env.WEB3FORMS_KEY,
      subject: 'お問い合わせがきたまろ～',
      name, email, message,
    }),
  })

  const data = await submit.json()
  return new Response(JSON.stringify(data), { status: submit.status, headers })
}
