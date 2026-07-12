import {
  createCorsHeaders,
  createOptionsResponse,
  downloadDriveFile,
  functionErrorResponse,
  getDriveAccessToken,
  requireShopAccess,
} from '../_shared/googleDrive.ts'
import { createServiceClient } from '../_shared/googleOAuth.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return createOptionsResponse(request)
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...createCorsHeaders(request),
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    const url = new URL(request.url)
    const documentId = url.searchParams.get('documentId')?.trim() || ''

    if (!documentId) {
      return new Response(JSON.stringify({ error: 'Missing documentId' }), {
        status: 400,
        headers: {
          ...createCorsHeaders(request),
          'Content-Type': 'application/json',
        },
      })
    }

    const baseClient = createServiceClient()
    const { data: document, error: documentError } = await baseClient
      .from('customer_documents')
      .select('id, shop_id, external_file_id, mime_type, storage_provider')
      .eq('id', documentId)
      .single()

    if (documentError || !document) {
      throw documentError ?? new Error('ไม่พบรูปเอกสารลูกค้า')
    }

    if (document.storage_provider !== 'google_drive' || !document.external_file_id) {
      throw new Error('เอกสารนี้ไม่ได้เก็บใน Google Drive')
    }

    const { supabase } = await requireShopAccess(request, document.shop_id)
    const accessToken = await getDriveAccessToken(supabase)
    const driveResponse = await downloadDriveFile(accessToken, document.external_file_id)

    return new Response(driveResponse.body, {
      status: 200,
      headers: {
        ...createCorsHeaders(request),
        'Content-Type': driveResponse.headers.get('Content-Type') || document.mime_type || 'application/octet-stream',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    const response = functionErrorResponse(error, 'โหลดรูปจาก Google Drive ไม่สำเร็จ', 500)
    const headers = new Headers(response.headers)
    Object.entries(createCorsHeaders(request)).forEach(([key, value]) => headers.set(key, value))
    return new Response(response.body, { status: response.status, headers })
  }
})
