import { createJsonResponse, createServiceClient, getRequiredEnv } from './googleOAuth.ts'

const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType'
const GOOGLE_DRIVE_FILE_URL = 'https://www.googleapis.com/drive/v3/files'
const GOOGLE_DRIVE_LIST_URL = 'https://www.googleapis.com/drive/v3/files'
const GOOGLE_DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder'

type DriveTokenRow = {
  integration_id: string
  refresh_token: string
  access_token: string | null
  token_type: string
  expires_at: string | null
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Missing bearer token')
  }

  return authHeader.slice('Bearer '.length).trim()
}

export async function requireShopAccess(request: Request, shopId: string) {
  const supabase = createServiceClient()
  const token = getBearerToken(request)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    throw new Error('กรุณาเข้าสู่ระบบใหม่ก่อนใช้งาน Google Drive')
  }

  const { data: membership, error: membershipError } = await supabase
    .from('shop_members')
    .select('shop_id')
    .eq('shop_id', shopId)
    .eq('user_id', data.user.id)
    .eq('role', 'owner')
    .maybeSingle()

  if (membershipError) {
    throw membershipError
  }

  if (!membership) {
    throw new Error('คุณไม่มีสิทธิ์เข้าถึงร้านนี้')
  }

  return { supabase, user: data.user }
}

export async function getDriveAccessToken(supabase: ReturnType<typeof createServiceClient>, shopId: string) {
  const { data: integration, error: integrationError } = await supabase
    .from('shop_google_integrations')
    .select('id, connection_status')
    .eq('shop_id', shopId)
    .eq('provider', 'google')
    .maybeSingle()

  if (integrationError) throw integrationError
  if (!integration || integration.connection_status !== 'connected') {
    throw new Error('ร้านนี้ยังไม่ได้เชื่อม Google Drive')
  }

  const { data: tokenRow, error: tokenError } = await supabase
    .from('shop_google_integration_tokens')
    .select('integration_id, refresh_token, access_token, token_type, expires_at')
    .eq('shop_id', shopId)
    .eq('integration_id', integration.id)
    .single()

  if (tokenError) throw tokenError

  const normalizedToken = tokenRow as DriveTokenRow
  const expiresAt = normalizedToken.expires_at ? new Date(normalizedToken.expires_at).getTime() : 0
  const needsRefresh = !normalizedToken.access_token || !expiresAt || expiresAt <= Date.now() + 60_000

  if (!needsRefresh) {
    return normalizedToken.access_token
  }

  const refreshed = await refreshDriveAccessToken(normalizedToken.refresh_token)
  const nextExpiresAt = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    : null

  const { error: updateError } = await supabase
    .from('shop_google_integration_tokens')
    .update({
      access_token: refreshed.access_token,
      token_type: refreshed.token_type ?? normalizedToken.token_type,
      expires_at: nextExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('integration_id', normalizedToken.integration_id)

  if (updateError) throw updateError
  return refreshed.access_token
}

async function refreshDriveAccessToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getRequiredEnv('GOOGLE_OAUTH_CLIENT_ID'),
      client_secret: getRequiredEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error(`Google refresh token failed: ${response.status}`)
  }

  return await response.json() as {
    access_token: string
    expires_in?: number
    token_type?: string
  }
}

export async function uploadFileToDrive(accessToken: string, file: File, metadata: Record<string, unknown>) {
  const boundary = `precious-${crypto.randomUUID()}`
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ])

  const response = await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`Google Drive upload failed: ${response.status}`)
  }

  return await response.json() as {
    id: string
    name?: string
    mimeType?: string
  }
}

export async function findOrCreateDriveFolder(
  accessToken: string,
  {
    name,
    parentId,
    appProperties,
  }: {
    name: string
    parentId?: string
    appProperties?: Record<string, string>
  },
) {
  const existingFolder = await findDriveFolder(accessToken, { name, parentId, appProperties })
  if (existingFolder) {
    return existingFolder
  }

  return await createDriveFolder(accessToken, { name, parentId, appProperties })
}

async function findDriveFolder(
  accessToken: string,
  {
    name,
    parentId,
    appProperties,
  }: {
    name: string
    parentId?: string
    appProperties?: Record<string, string>
  },
) {
  const queryParts = [
    `mimeType = '${GOOGLE_DRIVE_FOLDER_MIME}'`,
    'trashed = false',
    `name = '${escapeDriveQueryValue(name)}'`,
  ]

  if (parentId) {
    queryParts.push(`'${escapeDriveQueryValue(parentId)}' in parents`)
  }

  Object.entries(appProperties ?? {}).forEach(([key, value]) => {
    queryParts.push(`appProperties has { key='${escapeDriveQueryValue(key)}' and value='${escapeDriveQueryValue(value)}' }`)
  })

  const url = new URL(GOOGLE_DRIVE_LIST_URL)
  url.searchParams.set('q', queryParts.join(' and '))
  url.searchParams.set('fields', 'files(id,name)')
  url.searchParams.set('pageSize', '1')
  url.searchParams.set('supportsAllDrives', 'true')
  url.searchParams.set('includeItemsFromAllDrives', 'true')

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Google Drive folder search failed: ${response.status}`)
  }

  const result = await response.json() as {
    files?: Array<{ id: string; name?: string }>
  }

  return result.files?.[0] ?? null
}

async function createDriveFolder(
  accessToken: string,
  {
    name,
    parentId,
    appProperties,
  }: {
    name: string
    parentId?: string
    appProperties?: Record<string, string>
  },
) {
  const response = await fetch(`${GOOGLE_DRIVE_FILE_URL}?fields=id,name`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: GOOGLE_DRIVE_FOLDER_MIME,
      parents: parentId ? [parentId] : undefined,
      appProperties,
    }),
  })

  if (!response.ok) {
    throw new Error(`Google Drive folder create failed: ${response.status}`)
  }

  return await response.json() as {
    id: string
    name?: string
  }
}

export async function deleteFileFromDrive(accessToken: string, fileId: string) {
  const response = await fetch(`${GOOGLE_DRIVE_FILE_URL}/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 404) return
  if (!response.ok) {
    throw new Error(`Google Drive delete failed: ${response.status}`)
  }
}

export async function downloadDriveFile(accessToken: string, fileId: string) {
  const response = await fetch(`${GOOGLE_DRIVE_FILE_URL}/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Google Drive download failed: ${response.status}`)
  }

  return response
}

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export function sanitizeDriveFolderName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

export function functionErrorResponse(error: unknown, fallbackMessage: string, status = 500) {
  const message = error instanceof Error ? error.message : fallbackMessage
  return createJsonResponse({ error: message || fallbackMessage }, status)
}

export function createCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export function createOptionsResponse(request: Request) {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(request),
  })
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}
