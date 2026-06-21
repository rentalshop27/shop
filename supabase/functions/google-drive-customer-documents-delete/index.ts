import {
  createCorsHeaders,
  createOptionsResponse,
  deleteFileFromDrive,
  functionErrorResponse,
  getDriveAccessToken,
  requireShopAccess,
} from '../_shared/googleDrive.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return createOptionsResponse(request)
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...createCorsHeaders(request),
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    const body = await request.json() as {
      shopId?: string
      documentIds?: string[]
    }

    const shopId = body.shopId?.trim() || ''
    const documentIds = Array.isArray(body.documentIds) ? body.documentIds.filter(Boolean) : []

    if (!shopId || documentIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing shopId or documentIds' }), {
        status: 400,
        headers: {
          ...createCorsHeaders(request),
          'Content-Type': 'application/json',
        },
      })
    }

    const { supabase } = await requireShopAccess(request, shopId)
    const accessToken = await getDriveAccessToken(supabase, shopId)

    const { data: documents, error: documentsError } = await supabase
      .from('customer_documents')
      .select('id, shop_id, external_file_id, storage_provider')
      .eq('shop_id', shopId)
      .eq('storage_provider', 'google_drive')
      .in('id', documentIds)

    if (documentsError) throw documentsError

    for (const document of documents ?? []) {
      if (document.external_file_id) {
        await deleteFileFromDrive(accessToken, document.external_file_id)
      }
    }

    const { error: deleteError } = await supabase
      .from('customer_documents')
      .delete()
      .eq('shop_id', shopId)
      .in('id', documentIds)

    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ deleted: documentIds.length }), {
      status: 200,
      headers: {
        ...createCorsHeaders(request),
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    const response = functionErrorResponse(error, 'ลบรูปจาก Google Drive ไม่สำเร็จ')
    const headers = new Headers(response.headers)
    Object.entries(createCorsHeaders(request)).forEach(([key, value]) => headers.set(key, value))
    return new Response(response.body, { status: response.status, headers })
  }
})
