import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return json({ error: 'server_misconfigured' }, 500)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const anon_id = typeof body.anon_id === 'string' ? body.anon_id : ''
  const type = typeof body.type === 'string' ? body.type : ''
  const message = typeof body.message === 'string' ? body.message : ''
  const page_url = typeof body.page_url === 'string' ? body.page_url : ''
  const rating =
    body.rating === null || body.rating === undefined || body.rating === ''
      ? null
      : Number(body.rating)
  const user_agent = typeof body.user_agent === 'string' ? body.user_agent : ''

  if (!anon_id || !type || !message || !page_url) {
    return json({ error: 'missing_fields' }, 400)
  }
  if (rating !== null && (Number.isNaN(rating) || !Number.isInteger(rating))) {
    return json({ error: 'invalid_rating' }, 400)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let userId: string | null = null
  if (token && token.split('.').length === 3) {
    const { data, error } = await admin.auth.getUser(token)
    if (!error && data?.user?.id) userId = data.user.id
  }

  const salt = Deno.env.get('FEEDBACK_IP_SALT') ?? 'dev-only-change-in-production'
  const ip = clientIp(req)
  const ip_hash = ip ? await sha256Hex(`${ip}:${salt}`) : null

  const { data: rpcData, error: rpcError } = await admin.rpc('submit_feedback', {
    p_anon_id: anon_id,
    p_user_id: userId,
    p_type: type,
    p_rating: rating,
    p_message: message,
    p_page_url: page_url,
    p_user_agent: user_agent || null,
    p_ip_hash: ip_hash,
  })

  if (rpcError) {
    const raw = `${rpcError.message ?? ''} ${rpcError.details ?? ''}`.toLowerCase()
    if (raw.includes('cooldown')) return json({ error: 'cooldown' }, 429)
    if (raw.includes('rate_limit')) return json({ error: 'rate_limit' }, 429)
    if (raw.includes('invalid_') || rpcError.code === 'P0001') {
      const short =
        (rpcError.message || '').replace(/^.*Exception:\s*/i, '').trim() || 'validation_error'
      return json({ error: short }, 400)
    }
    console.error('submit_feedback rpc', rpcError)
    return json({ error: 'submit_failed' }, 500)
  }

  const id = rpcData as string | null
  return json({ ok: true, id: id ?? undefined })
})
