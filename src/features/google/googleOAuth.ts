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

export function getGoogleOAuthReturnUrl() {
  const browserOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : readEnv('VITE_PUBLIC_APP_URL')

  if (!browserOrigin) return ''
  return `${trimTrailingSlash(browserOrigin)}/?tab=profile`
}

export function buildGoogleOAuthStartUrl(shopId: string | null) {
  const supabaseUrl = readEnv('VITE_SUPABASE_URL')
  const clientId = getGoogleOAuthClientId()

  if (!supabaseUrl || !clientId || !shopId) return ''

  const url = new URL(`${trimTrailingSlash(supabaseUrl)}/functions/v1/google-oauth-start`)
  url.searchParams.set('shopId', shopId)

  const redirectTo = getGoogleOAuthReturnUrl()
  if (redirectTo) {
    url.searchParams.set('redirectTo', redirectTo)
  }

  return url.toString()
}

export function getGoogleOAuthSetupState(shopId: string | null) {
  const clientId = getGoogleOAuthClientId()
  const callbackUrl = getGoogleOAuthCallbackUrl()
  const returnUrl = getGoogleOAuthReturnUrl()
  const startUrl = buildGoogleOAuthStartUrl(shopId)

  return {
    clientId,
    callbackUrl,
    returnUrl,
    startUrl,
    hasClientId: Boolean(clientId),
    hasCallbackUrl: Boolean(callbackUrl),
    hasSelectedShop: Boolean(shopId),
    canStartOAuth: Boolean(startUrl),
  }
}
