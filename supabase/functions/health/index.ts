const responseHeaders = {
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  })
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

async function pingSupabaseDatabase() {
  const supabaseUrl = getRequiredEnv('SUPABASE_URL').replace(/\/+$/, '')
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  const response = await fetch(`${supabaseUrl}/rest/v1/shops?select=id&limit=1`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Supabase database ping failed: ${response.status}`)
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const expectedToken = getRequiredEnv('KEEPALIVE_TOKEN')
    const providedToken = request.headers.get('x-keepalive-token')?.trim() || ''

    if (!providedToken || providedToken !== expectedToken) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    await pingSupabaseDatabase()

    return jsonResponse({
      ok: true,
      service: 'health',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    }, 500)
  }
})
