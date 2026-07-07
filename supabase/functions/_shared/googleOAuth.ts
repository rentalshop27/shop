import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_AUTH_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
]

const encoder = new TextEncoder()

function base64UrlEncode(input: Uint8Array | string) {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  return atob(padded)
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return base64UrlEncode(new Uint8Array(signature))
}

export function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export function getCallbackUrl() {
  const supabaseUrl = getRequiredEnv('SUPABASE_URL').replace(/\/+$/, '')
  return `${supabaseUrl}/functions/v1/google-oauth-callback`
}

export function buildGoogleConsentUrl({
  shopId,
  redirectTo,
}: {
  shopId: string
  redirectTo: string
}) {
  const clientId = getRequiredEnv('GOOGLE_OAUTH_CLIENT_ID')
  const state = createSignedState({ shopId, redirectTo })

  const url = new URL(GOOGLE_AUTH_BASE_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', getCallbackUrl())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('include_granted_scopes', 'true')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('scope', GOOGLE_SCOPES.join(' '))
  url.searchParams.set('state', state)
  return url.toString()
}

function getStateSecret() {
  return getRequiredEnv('GOOGLE_OAUTH_STATE_SECRET')
}

export function createSignedState(payload: { shopId: string; redirectTo: string; userId: string }) {
  const now = Math.floor(Date.now() / 1000)
  const body = JSON.stringify({
    ...payload,
    iat: now,
    exp: now + 60 * 10,
  })

  const encoded = base64UrlEncode(body)
  return `${encoded}.${crypto.randomUUID()}`
}

export async function signStateToken(token: string) {
  return signValue(token, getStateSecret())
}

export async function buildState(payload: { shopId: string; redirectTo: string; userId: string }) {
  const token = createSignedState(payload)
  const signature = await signStateToken(token)
  return `${token}.${signature}`
}

export async function verifyState(state: string) {
  const lastDot = state.lastIndexOf('.')
  if (lastDot <= 0) {
    throw new Error('Invalid OAuth state')
  }

  const token = state.slice(0, lastDot)
  const signature = state.slice(lastDot + 1)
  const expected = await signStateToken(token)
  if (signature !== expected) {
    throw new Error('Invalid OAuth state signature')
  }

  const firstDot = token.indexOf('.')
  if (firstDot <= 0) {
    throw new Error('Invalid OAuth state token')
  }

  const encodedBody = token.slice(0, firstDot)
  const rawBody = base64UrlDecode(encodedBody)
  const payload = JSON.parse(rawBody) as {
    shopId: string
    redirectTo: string
    userId: string
    exp: number
  }

  if (!payload.shopId || !payload.redirectTo || !payload.userId) {
    throw new Error('Invalid OAuth state payload')
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('OAuth state expired')
  }

  return payload
}

export function createServiceClient() {
  return createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )
}

export async function exchangeGoogleCode(code: string) {
  const clientId = getRequiredEnv('GOOGLE_OAUTH_CLIENT_ID')
  const clientSecret = getRequiredEnv('GOOGLE_OAUTH_CLIENT_SECRET')

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getCallbackUrl(),
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status}`)
  }

  return await response.json() as {
    access_token: string
    expires_in?: number
    refresh_token?: string
    scope?: string
    token_type?: string
  }
}

export async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(`Google userinfo failed: ${response.status}`)
  }

  return await response.json() as {
    id?: string
    email?: string
  }
}

export function createRedirectResponse(url: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: url },
  })
}

export function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

export function appendResult(urlString: string, params: Record<string, string>) {
  const url = new URL(urlString)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return url.toString()
}
