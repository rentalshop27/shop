import {
  buildState,
  createJsonResponse,
  getCallbackUrl,
  getRequiredEnv,
} from '../_shared/googleOAuth.ts'
import { requireShopAccess } from '../_shared/googleDrive.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return createJsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    getRequiredEnv('GOOGLE_OAUTH_CLIENT_ID')
    getRequiredEnv('GOOGLE_OAUTH_STATE_SECRET')
    getRequiredEnv('SUPABASE_URL')

    const payload = await request.json() as {
      shopId?: string
      redirectTo?: string
    }
    const shopId = payload.shopId?.trim() || ''
    const redirectTo = payload.redirectTo?.trim() || ''

    if (!shopId) {
      return createJsonResponse({ error: 'Missing shopId' }, 400)
    }

    if (!redirectTo) {
      return createJsonResponse({ error: 'Missing redirectTo' }, 400)
    }

    const { user } = await requireShopAccess(request, shopId)
    const state = await buildState({ shopId, redirectTo, userId: user.id })
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', getRequiredEnv('GOOGLE_OAUTH_CLIENT_ID'))
    authUrl.searchParams.set('redirect_uri', getCallbackUrl())
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('include_granted_scopes', 'true')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('scope', [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '))
    authUrl.searchParams.set('state', state)

    return new Response(JSON.stringify({ url: authUrl.toString() }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unexpected error',
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  }
})
