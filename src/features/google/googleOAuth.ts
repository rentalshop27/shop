import type { SupabaseClient } from '@supabase/supabase-js'

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function readEnv(name: 'VITE_SUPABASE_URL' | 'VITE_PUBLIC_APP_URL' | 'VITE_GOOGLE_OAUTH_CLIENT_ID') {
  const value = import.meta.env[name] as string | undefined
  return value?.trim() || ''
}

export function getGoogleOAuthClientId() {
  return readEnv('VITE_GOOGLE_OAUTH_CLIENT_ID')
}

export function getGoogleOAuthCallbackUrl() {
  const supabaseUrl = readEnv('VITE_SUPABASE_URL')
  if (!supabaseUrl) return ''
  return `${trimTrailingSlash(supabaseUrl)}/functions/v1/google-oauth-callback`
}

export function getGoogleOAuthReturnUrl(shopId: string | null = null) {
  const browserOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : readEnv('VITE_PUBLIC_APP_URL')

  if (!browserOrigin) return ''

  const url = new URL(`${trimTrailingSlash(browserOrigin)}/`)
  url.searchParams.set('tab', 'profile')
  if (shopId) {
    url.searchParams.set('shopId', shopId)
  }
  return url.toString()
}

export type GoogleOAuthConnectionStatus = 'connected' | 'revoked' | 'error' | 'idle'

export interface GoogleOAuthConnection {
  status: GoogleOAuthConnectionStatus
  googleEmail: string | null
}

type GoogleOAuthConnectionRow = {
  connection_status: Exclude<GoogleOAuthConnectionStatus, 'idle'>
  google_email: string
}

function getStartFunctionUrl() {
  const supabaseUrl = readEnv('VITE_SUPABASE_URL')
  if (!supabaseUrl) return ''
  return `${trimTrailingSlash(supabaseUrl)}/functions/v1/google-oauth-start`
}

export function getGoogleOAuthSetupState(shopId: string | null) {
  const clientId = getGoogleOAuthClientId()
  const callbackUrl = getGoogleOAuthCallbackUrl()
  const returnUrl = getGoogleOAuthReturnUrl(shopId)
  const startUrl = getStartFunctionUrl()

  return {
    clientId,
    callbackUrl,
    returnUrl,
    startUrl,
    hasClientId: Boolean(clientId),
    hasCallbackUrl: Boolean(callbackUrl),
    hasSelectedShop: Boolean(shopId),
    canStartOAuth: Boolean(startUrl && returnUrl && shopId),
  }
}

export async function loadGoogleOAuthConnection(
  supabase: SupabaseClient,
  shopId: string,
): Promise<GoogleOAuthConnection> {
  const { data, error } = await supabase
    .from('shop_google_integrations')
    .select('connection_status, google_email')
    .eq('shop_id', shopId)
    .eq('provider', 'google')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    return {
      status: 'idle',
      googleEmail: null,
    }
  }

  const row = data as GoogleOAuthConnectionRow
  return {
    status: row.connection_status,
    googleEmail: row.google_email,
  }
}

export async function startGoogleOAuth(
  supabase: SupabaseClient,
  shopId: string,
) {
  const startUrl = getStartFunctionUrl()
  const redirectTo = getGoogleOAuthReturnUrl(shopId)

  if (!startUrl || !redirectTo) {
    throw new Error('ยังไม่ได้ตั้งค่า Google OAuth สำหรับโปรเจกต์นี้')
  }

  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error('กรุณาเข้าสู่ระบบใหม่ก่อนเชื่อม Google')
  }

  const response = await fetch(startUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shopId,
      redirectTo,
    }),
  })

  const payload = await response.json() as { url?: string; error?: string }
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'เริ่มเชื่อม Google ไม่สำเร็จ')
  }

  if (typeof window !== 'undefined') {
    window.location.assign(payload.url)
  }

  return payload.url
}
