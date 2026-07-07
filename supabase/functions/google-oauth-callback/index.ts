import {
  appendResult,
  createJsonResponse,
  createRedirectResponse,
  createServiceClient,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  verifyState,
} from '../_shared/googleOAuth.ts'
import { resolveGoogleRefreshToken } from '../_shared/googleToken.ts'

Deno.serve(async (request) => {
  if (request.method !== 'GET') {
    return createJsonResponse({ error: 'Method not allowed' }, 405)
  }

  const url = new URL(request.url)
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state') || ''

  try {
    const payload = await verifyState(state)
    const redirectTo = payload.redirectTo

    if (error) {
      return createRedirectResponse(appendResult(redirectTo, {
        tab: 'profile',
        google_oauth: 'error',
        reason: error,
      }))
    }

    const code = url.searchParams.get('code')?.trim() || ''
    if (!code) {
      return createRedirectResponse(appendResult(redirectTo, {
        tab: 'profile',
        google_oauth: 'error',
        reason: 'missing_code',
      }))
    }

    const tokenResult = await exchangeGoogleCode(code)
    const googleUser = await fetchGoogleUserInfo(tokenResult.access_token)

    if (!googleUser.email) {
      throw new Error('Google account email not found')
    }

    const supabase = createServiceClient()
    const { data: ownerMembership, error: ownerMembershipError } = await supabase
      .from('shop_members')
      .select('shop_id')
      .eq('shop_id', payload.shopId)
      .eq('user_id', payload.userId)
      .eq('role', 'owner')
      .maybeSingle()

    if (ownerMembershipError) {
      throw ownerMembershipError
    }

    if (!ownerMembership) {
      throw new Error('คุณไม่มีสิทธิ์เชื่อม Google ให้ร้านนี้')
    }

    const { data: existingIntegration, error: existingIntegrationError } = await supabase
      .from('shop_google_integrations')
      .select('id, google_user_id')
      .eq('shop_id', payload.shopId)
      .eq('provider', 'google')
      .maybeSingle()

    if (existingIntegrationError) {
      throw existingIntegrationError
    }

    let existingRefreshToken: string | null = null
    const canReuseExistingToken = Boolean(
      existingIntegration?.google_user_id
      && googleUser.id
      && existingIntegration.google_user_id === googleUser.id,
    )

    if (existingIntegration && canReuseExistingToken) {
      const { data: existingToken, error: existingTokenError } = await supabase
        .from('shop_google_integration_tokens')
        .select('refresh_token')
        .eq('integration_id', existingIntegration.id)
        .maybeSingle()

      if (existingTokenError) {
        throw existingTokenError
      }
      existingRefreshToken = existingToken?.refresh_token ?? null
    }

    const refreshToken = resolveGoogleRefreshToken(
      tokenResult.refresh_token,
      existingRefreshToken,
    )

    const { data: integration, error: integrationError } = await supabase
      .from('shop_google_integrations')
      .upsert({
        shop_id: payload.shopId,
        provider: 'google',
        google_email: googleUser.email,
        google_user_id: googleUser.id ?? '',
        connection_status: 'connected',
        connected_at: new Date().toISOString(),
        disconnected_at: null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'shop_id,provider',
      })
      .select('id')
      .single()

    if (integrationError || !integration) {
      throw integrationError ?? new Error('Failed to save Google integration')
    }

    const expiresAt = tokenResult.expires_in
      ? new Date(Date.now() + tokenResult.expires_in * 1000).toISOString()
      : null

    const { error: tokenError } = await supabase
      .from('shop_google_integration_tokens')
      .upsert({
        integration_id: integration.id,
        shop_id: payload.shopId,
        refresh_token: refreshToken,
        access_token: tokenResult.access_token,
        token_type: tokenResult.token_type ?? 'Bearer',
        scope: (tokenResult.scope ?? '').split(' ').filter(Boolean),
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'integration_id',
      })

    if (tokenError) {
      throw tokenError
    }

    return createRedirectResponse(appendResult(redirectTo, {
      tab: 'profile',
      google_oauth: 'success',
      google_email: googleUser.email,
    }))
  } catch (caughtError) {
    const fallbackRedirect = url.searchParams.get('redirectTo') || 'http://127.0.0.1:5173/?tab=profile'
    return createRedirectResponse(appendResult(fallbackRedirect, {
      tab: 'profile',
      google_oauth: 'error',
      reason: caughtError instanceof Error ? caughtError.message : 'unexpected_error',
    }))
  }
})
