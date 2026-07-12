import { S3Client, PutObjectCommand, DeleteObjectCommand } from 'npm:@aws-sdk/client-s3@3.799.0'
import { createCorsHeaders, createOptionsResponse, functionErrorResponse, requireShopAccess } from '../_shared/googleDrive.ts'
import { getRequiredEnv } from '../_shared/googleOAuth.ts'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
type DeletePayload = { action?: string; shopId?: string; imageUrls?: string[] }

function getR2Client() {
  const accountId = getRequiredEnv('CLOUDFLARE_R2_ACCOUNT_ID')
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getRequiredEnv('CLOUDFLARE_R2_ACCESS_KEY_ID'),
      secretAccessKey: getRequiredEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
    },
  })
}

function getPublicBaseUrl() {
  return getRequiredEnv('CLOUDFLARE_R2_PUBLIC_BASE_URL').replace(/\/+$/, '')
}

function getObjectKey(imageUrl: string, shopId: string) {
  const baseUrl = getPublicBaseUrl()
  if (!imageUrl.startsWith(`${baseUrl}/`)) return null

  const key = decodeURIComponent(imageUrl.slice(baseUrl.length + 1))
  return key.startsWith(`shops/${shopId}/`) ? key : null
}

function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...createCorsHeaders(request), 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return createOptionsResponse(request)
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Method not allowed' }, 405)

  try {
    const contentType = request.headers.get('content-type') ?? ''
    const payload = contentType.includes('multipart/form-data')
      ? await request.formData()
      : await request.json() as DeletePayload
    const shopId = payload instanceof FormData
      ? String(payload.get('shopId') ?? '').trim()
      : String(payload.shopId ?? '').trim()

    if (!shopId) return jsonResponse(request, { error: 'Missing shopId' }, 400)
    const { supabase } = await requireShopAccess(request, shopId)
    void supabase

    const bucket = getRequiredEnv('CLOUDFLARE_R2_BUCKET')
    const r2 = getR2Client()
    if (payload instanceof FormData) {
      const kind = String(payload.get('kind') ?? '')
      if (kind !== 'product') return jsonResponse(request, { error: 'Invalid image kind' }, 400)

      const files = payload.getAll('files').filter((value): value is File => value instanceof File)
      if (files.length === 0) return jsonResponse(request, { error: 'Missing image files' }, 400)
      if (files.some((file) => file.size > MAX_FILE_SIZE_BYTES || !ACCEPTED_IMAGE_TYPES.has(file.type))) {
        return jsonResponse(request, { error: 'Images must be JPEG, PNG, or WebP and at most 10 MB' }, 400)
      }

      const imageUrls = await Promise.all(files.map(async (file) => {
        const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : 'png'
        const key = `shops/${shopId}/products/${crypto.randomUUID()}.${extension}`
        await r2.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: new Uint8Array(await file.arrayBuffer()), ContentType: file.type }))
        return `${getPublicBaseUrl()}/${key}`
      }))
      return jsonResponse(request, { imageUrls })
    }

    if (payload.action !== 'delete') return jsonResponse(request, { error: 'Invalid action' }, 400)
    const imageUrls = Array.isArray(payload.imageUrls) ? payload.imageUrls : []
    const keys = imageUrls.map((imageUrl) => getObjectKey(imageUrl, shopId)).filter((key): key is string => Boolean(key))
    await Promise.all(keys.map((key) => r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))))
    return jsonResponse(request, { deleted: keys.length })
  } catch (error) {
    const response = functionErrorResponse(error, 'อัปโหลดรูปไป Cloudflare R2 ไม่สำเร็จ')
    const headers = new Headers(response.headers)
    Object.entries(createCorsHeaders(request)).forEach(([key, value]) => headers.set(key, value))
    return new Response(response.body, { status: response.status, headers })
  }
})
