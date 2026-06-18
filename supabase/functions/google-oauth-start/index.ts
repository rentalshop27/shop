import {
  buildState,
  createJsonResponse,
  createRedirectResponse,
  getCallbackUrl,
  getRequiredEnv,
} from '../_shared/googleOAuth.ts'

Deno.serve(async (request) => {
  if (request.method !== 'GET') {
    return createJsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    getRequiredEnv('GOOGLE_OAUTH_CLIENT_ID')
    getRequiredEnv('GOOGLE_OAUTH_STATE_SECRET')
    getRequiredEnv('SUPABASE_URL')

    const url = new URL(request.url)
    const shopId = url.searchParams.get('shopId')?.trim() || ''
    const redirectTo = url.searchParams.get('redirectTo')?.trim() || ''

    if (!shopId) {
      return createJsonResponse({ error: 'Missing shopId' }, 400)
    }

    if (!redirectTo) {
      return createJsonResponse({ error: 'Missing redirectTo' }, 400)
    }

    const state = await buildState({ shopId, redirectTo })
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', getRequiredEnv('GOOGLE_OAUTH_CLIENT_ID'))
    authUrl.searchParams.set('redirect_uri', getCallbackUrl())
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('include_granted_scopes', 'true')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('scope', [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '))
    authUrl.searchParams.set('state', state)

    return createRedirectResponse(authUrl.toString())
  } catch (error) {
    return createJsonResponse({
      error: error instanceof Error ? error.message : 'Unexpected error',
    }, 500)
  }
})
