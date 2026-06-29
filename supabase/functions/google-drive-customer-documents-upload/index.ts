import {
  createCorsHeaders,
  createOptionsResponse,
  deleteFileFromDrive,
  findOrCreateDriveFolder,
  functionErrorResponse,
  getDriveAccessToken,
  requireShopAccess,
  sanitizeDriveFolderName,
  sanitizeFileName,
  uploadFileToDrive,
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
    const formData = await request.formData()
    const shopId = String(formData.get('shopId') || '').trim()
    const customerId = String(formData.get('customerId') || '').trim()
    const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File)

    if (!shopId || !customerId) {
      return new Response(JSON.stringify({ error: 'Missing shopId or customerId' }), {
        status: 400,
        headers: {
          ...createCorsHeaders(request),
          'Content-Type': 'application/json',
        },
      })
    }

    if (files.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing files' }), {
        status: 400,
        headers: {
          ...createCorsHeaders(request),
          'Content-Type': 'application/json',
        },
      })
    }

    const { supabase } = await requireShopAccess(request, shopId)

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, shop_id, customer_code, full_name')
      .eq('id', customerId)
      .eq('shop_id', shopId)
      .single()

    if (customerError || !customer) {
      throw customerError ?? new Error('ไม่พบลูกค้าที่ต้องการอัปโหลดรูป')
    }

    const { data: existingDocuments, error: existingDocumentsError } = await supabase
      .from('customer_documents')
      .select('id')
      .eq('customer_id', customerId)
      .order('sort_order', { ascending: true })

    if (existingDocumentsError) throw existingDocumentsError

    const existingCount = (existingDocuments ?? []).length
    if (existingCount + files.length > 5) {
      throw new Error('รูปเอกสารเต็ม 5 รูปต่อลูกค้าแล้ว')
    }

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name')
      .eq('id', shopId)
      .single()

    if (shopError || !shop) {
      throw shopError ?? new Error('ไม่พบข้อมูลร้าน')
    }

    const accessToken = await getDriveAccessToken(supabase, shopId)
    const uploadedFileIds: string[] = []

    try {
      const rootFolder = await findOrCreateDriveFolder(accessToken, {
        name: sanitizeDriveFolderName(`Precious Rental - ${shop.name} - Customer Documents`),
        appProperties: {
          source: 'precious_customer_documents_root',
          shop_id: shopId,
        },
      })

      const customerFolder = await findOrCreateDriveFolder(accessToken, {
        name: sanitizeDriveFolderName(`${customer.customer_code} - ${customer.full_name}`),
        parentId: rootFolder.id,
        appProperties: {
          source: 'precious_customer_documents_customer',
          shop_id: shopId,
          customer_id: customerId,
        },
      })

      const rows = []
      for (const [index, file] of files.entries()) {
        const safeName = sanitizeFileName(file.name)
        const driveFile = await uploadFileToDrive(accessToken, file, {
          name: `${customer.customer_code}-${Date.now()}-${safeName}`,
          mimeType: file.type || 'application/octet-stream',
          parents: [customerFolder.id],
          appProperties: {
            shop_id: shopId,
            customer_id: customerId,
            customer_code: customer.customer_code,
            source: 'precious_customer_documents',
          },
        })

        uploadedFileIds.push(driveFile.id)
        rows.push({
          shop_id: shopId,
          customer_id: customerId,
          storage_path: `${shopId}/${customerId}/google-drive/${driveFile.id}-${safeName}`,
          storage_provider: 'google_drive',
          external_file_id: driveFile.id,
          mime_type: file.type || driveFile.mimeType || '',
          original_file_name: file.name,
          sort_order: existingCount + index + 1,
        })
      }

      const { error: insertError } = await supabase.from('customer_documents').insert(rows)
      if (insertError) throw insertError

      return new Response(JSON.stringify({ uploaded: rows.length }), {
        status: 200,
        headers: {
          ...createCorsHeaders(request),
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      await Promise.all(uploadedFileIds.map((fileId) => deleteFileFromDrive(accessToken, fileId).catch(() => undefined)))
      throw error
    }
  } catch (error) {
    const response = functionErrorResponse(error, 'อัปโหลดรูปไป Google Drive ไม่สำเร็จ')
    const headers = new Headers(response.headers)
    Object.entries(createCorsHeaders(request)).forEach(([key, value]) => headers.set(key, value))
    return new Response(response.body, { status: response.status, headers })
  }
})
