import type { SupabaseClient } from '@supabase/supabase-js'
import type { Customer, CustomerDocument, CustomerDraft } from './customerTypes'
import { normalizeThaiPhone } from './customerRules'
import { normalizeShopRole, type ShopRole } from '../auth/shopPermissions'

type CustomerDocumentRow = {
  id: string
  shop_id: string
  customer_id: string
  storage_path: string
  storage_provider: CustomerDocument['storageProvider']
  external_file_id: string | null
  mime_type: string | null
  original_file_name: string | null
  sort_order: number
  created_at: string
}

type CustomerRow = {
  id: string
  shop_id: string
  customer_code: string
  full_name: string
  line_account: string | null
  phone: string
  phone_normalized: string
  current_address: string | null
  notes: string | null
  profile_status: Customer['profileStatus']
  risk_flag: Customer['riskFlag']
  bust_in: number | null
  waist_in: number | null
  hip_in: number | null
  height_cm: number | null
  archived_at: string | null
  created_at: string
  updated_at: string
  customer_documents?: CustomerDocumentRow[]
}

export type ShopSummary = {
  id: string
  name: string
  publicCatalogSlug?: string | null
  role: ShopRole
}

type ShopMembershipRow = {
  role: string | null
  shops: {
    id: string
    name: string
    public_catalog_slug: string | null
    created_at: string
  } | Array<{
    id: string
    name: string
    public_catalog_slug: string | null
    created_at: string
  }>
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const CUSTOMER_WITH_DOCUMENTS_SELECT = '*, customer_documents!customer_documents_shop_customer_fk(*)'
const CUSTOMER_SUMMARY_SELECT = [
  'id',
  'shop_id',
  'customer_code',
  'full_name',
  'line_account',
  'phone',
  'phone_normalized',
  'current_address',
  'notes',
  'profile_status',
  'risk_flag',
  'bust_in',
  'waist_in',
  'hip_in',
  'height_cm',
  'archived_at',
  'created_at',
  'updated_at',
].join(', ')

function getFunctionUrl(name: string) {
  if (!supabaseUrl) return ''
  return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/${name}`
}

export async function loadAccessibleShops(supabase: SupabaseClient, userId: string): Promise<ShopSummary[]> {
  const { data, error } = await supabase
    .from('shop_members')
    .select('role, shops!inner(id, name, public_catalog_slug, created_at)')
    .eq('user_id', userId)

  if (error) throw error

  const shopsWithCreatedAt: Array<ShopSummary & { createdAt: string }> = ((data ?? []) as ShopMembershipRow[])
    .flatMap((membership) => {
      const shop = Array.isArray(membership.shops) ? membership.shops[0] : membership.shops
      if (!shop) return []

      return [{
        id: shop.id,
        name: shop.name,
        publicCatalogSlug: shop.public_catalog_slug ?? null,
        role: normalizeShopRole(membership.role),
        createdAt: shop.created_at,
      }]
    })

  return shopsWithCreatedAt
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .map((shop) => ({
      id: shop.id,
      name: shop.name,
      publicCatalogSlug: shop.publicCatalogSlug,
      role: shop.role,
    }))
}

export async function loadCustomers(supabase: SupabaseClient, shopId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select(CUSTOMER_WITH_DOCUMENTS_SELECT)
    .eq('shop_id', shopId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as CustomerRow[]
  return Promise.all(rows.map((row) => mapCustomerRow(supabase, row)))
}

export async function loadCustomerSummaries(supabase: SupabaseClient, shopId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select(CUSTOMER_SUMMARY_SELECT)
    .eq('shop_id', shopId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as unknown as CustomerRow[]).map((row) => mapCustomerSummaryRow(row))
}

export async function createRemoteCustomer(
  supabase: SupabaseClient,
  shopId: string,
  draft: CustomerDraft,
) {
  const payload = {
    shop_id: shopId,
    full_name: draft.fullName.trim(),
    line_account: draft.lineAccount.trim(),
    phone: draft.phone.trim(),
    phone_normalized: normalizeThaiPhone(draft.phone),
    current_address: draft.currentAddress.trim(),
    notes: draft.notes.trim(),
    profile_status: draft.profileStatus,
    risk_flag: draft.riskFlag,
    bust_in: parseOptionalNumber(draft.bustIn),
    waist_in: parseOptionalNumber(draft.waistIn),
    hip_in: parseOptionalNumber(draft.hipIn),
    height_cm: parseOptionalNumber(draft.heightCm),
  }

  const { data, error } = await supabase
    .from('customers')
    .insert(payload)
    .select(CUSTOMER_WITH_DOCUMENTS_SELECT)
    .single()

  if (error) throw error
  return mapCustomerRow(supabase, data as CustomerRow)
}

export async function updateRemoteCustomer(
  supabase: SupabaseClient,
  shopId: string,
  customerId: string,
  draft: CustomerDraft,
) {
  const payload = {
    full_name: draft.fullName.trim(),
    line_account: draft.lineAccount.trim(),
    phone: draft.phone.trim(),
    phone_normalized: normalizeThaiPhone(draft.phone),
    current_address: draft.currentAddress.trim(),
    notes: draft.notes.trim(),
    profile_status: draft.profileStatus,
    risk_flag: draft.riskFlag,
    bust_in: parseOptionalNumber(draft.bustIn),
    waist_in: parseOptionalNumber(draft.waistIn),
    hip_in: parseOptionalNumber(draft.hipIn),
    height_cm: parseOptionalNumber(draft.heightCm),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('customers')
    .update(payload)
    .eq('id', customerId)
    .eq('shop_id', shopId)
    .select(CUSTOMER_WITH_DOCUMENTS_SELECT)
    .single()

  if (error) throw error
  return mapCustomerRow(supabase, data as CustomerRow)
}

export async function updateRemoteCustomerStatus(
  supabase: SupabaseClient,
  shopId: string,
  customerId: string,
  profileStatus: Customer['profileStatus'],
) {
  const { data, error } = await supabase
    .from('customers')
    .update({ profile_status: profileStatus, updated_at: new Date().toISOString() })
    .eq('id', customerId)
    .eq('shop_id', shopId)
    .select('id')
    .single()

  if (error) throw error
  if (!data) throw new Error('ไม่พบลูกค้าที่ต้องการอัปเดตในร้านนี้')
}

export async function updateRemoteCustomerRisk(
  supabase: SupabaseClient,
  shopId: string,
  customerId: string,
  riskFlag: Customer['riskFlag'],
) {
  const { data, error } = await supabase
    .from('customers')
    .update({ risk_flag: riskFlag, updated_at: new Date().toISOString() })
    .eq('id', customerId)
    .eq('shop_id', shopId)
    .select('id')
    .single()

  if (error) throw error
  if (!data) throw new Error('ไม่พบลูกค้าที่ต้องการอัปเดตในร้านนี้')
}

export async function archiveRemoteCustomer(supabase: SupabaseClient, shopId: string, customerId: string) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('customers')
    .update({ archived_at: now, updated_at: now })
    .eq('id', customerId)
    .eq('shop_id', shopId)
    .select('id')
    .single()

  if (error) throw error
  if (!data) throw new Error('ไม่พบลูกค้าที่ต้องการลบในร้านนี้')
}

export async function uploadRemoteCustomerDocuments(
  supabase: SupabaseClient,
  customer: Customer,
  files: File[],
) {
  if (await hasConnectedGoogleDrive(supabase, customer.shopId)) {
    await uploadGoogleDriveCustomerDocuments(supabase, customer, files)
    return
  }

  const existingCount = customer.documents.length
  const uploadedPaths: string[] = []
  const rows: Array<{
    shop_id: string
    customer_id: string
    storage_path: string
    storage_provider: CustomerDocument['storageProvider']
    external_file_id: string | null
    mime_type: string
    original_file_name: string
    sort_order: number
  }> = []

  try {
    for (const [index, file] of files.entries()) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const storagePath = `${customer.shopId}/${customer.id}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('customer-documents')
        .upload(storagePath, file, { upsert: false })

      if (uploadError) throw uploadError

      uploadedPaths.push(storagePath)
      rows.push({
        shop_id: customer.shopId,
        customer_id: customer.id,
        storage_path: storagePath,
        storage_provider: 'supabase_storage',
        external_file_id: null,
        mime_type: file.type,
        original_file_name: file.name,
        sort_order: existingCount + index + 1,
      })
    }

    const { error } = await supabase.from('customer_documents').insert(rows)
    if (error) throw error
  } catch (error) {
    await cleanupUploadedCustomerDocumentPaths(supabase, uploadedPaths)
    throw error
  }
}

async function cleanupUploadedCustomerDocumentPaths(
  supabase: SupabaseClient,
  storagePaths: string[],
) {
  if (storagePaths.length === 0) return

  const { error } = await supabase.storage
    .from('customer-documents')
    .remove(storagePaths)

  if (error) {
    console.warn('Failed to delete customer documents after upload error:', storagePaths, error)
  }
}

async function mapCustomerRow(supabase: SupabaseClient, row: CustomerRow): Promise<Customer> {
  const documents = await Promise.all(
    (row.customer_documents ?? [])
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((document) => mapDocumentRow(supabase, document)),
  )

  return mapCustomerSummaryRow(row, documents)
}

function mapCustomerSummaryRow(row: CustomerRow, documents: CustomerDocument[] = []): Customer {
  return {
    id: row.id,
    shopId: row.shop_id,
    customerCode: row.customer_code,
    fullName: row.full_name,
    lineAccount: row.line_account ?? '',
    phone: row.phone,
    phoneNormalized: row.phone_normalized,
    currentAddress: row.current_address ?? '',
    notes: row.notes ?? '',
    profileStatus: row.profile_status,
    riskFlag: row.risk_flag,
    bustIn: row.bust_in ?? undefined,
    waistIn: row.waist_in ?? undefined,
    hipIn: row.hip_in ?? undefined,
    heightCm: row.height_cm ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    documents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function mapDocumentRow(
  _supabase: SupabaseClient,
  row: CustomerDocumentRow,
): Promise<CustomerDocument> {
  return {
    id: row.id,
    customerId: row.customer_id,
    storagePath: row.storage_path,
    storageProvider: row.storage_provider,
    externalFileId: row.external_file_id ?? undefined,
    mimeType: row.mime_type ?? undefined,
    originalFileName: row.original_file_name ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }
}

export async function loadCustomerDocumentPreview(
  supabase: SupabaseClient,
  document: CustomerDocument,
  options: { forceRefresh?: boolean } = {},
): Promise<CustomerDocument> {
  if (document.previewUrl && !options.forceRefresh) return document

  if (document.storageProvider === 'google_drive') {
    return {
      ...document,
      previewUrl: await createGoogleDrivePreviewUrl(supabase, document.id),
    }
  }

  const { data, error } = await supabase.storage
    .from('customer-documents')
    .createSignedUrl(document.storagePath, 60 * 5)

  if (error) throw error
  return { ...document, previewUrl: data?.signedUrl }
}

export async function deleteRemoteCustomerDocuments(
  supabase: SupabaseClient,
  shopId: string,
  documents: CustomerDocument[],
) {
  if (documents.length === 0) return

  const googleDriveDocuments = documents.filter((document) => document.storageProvider === 'google_drive')
  if (googleDriveDocuments.length > 0) {
    await deleteGoogleDriveCustomerDocuments(supabase, shopId, googleDriveDocuments)
  }

  const supabaseDocuments = documents.filter((document) => document.storageProvider !== 'google_drive')
  if (supabaseDocuments.length === 0) return

  const documentIds = supabaseDocuments.map((document) => document.id)
  const storagePaths = supabaseDocuments.map((document) => document.storagePath)

  const { error: dbError } = await supabase
    .from('customer_documents')
    .delete()
    .eq('shop_id', shopId)
    .in('id', documentIds)

  if (dbError) throw dbError

  const validPaths = storagePaths.filter(Boolean)
  if (validPaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('customer-documents')
      .remove(validPaths)

    if (storageError) {
      console.warn('Failed to delete customer document files after metadata delete:', validPaths, storageError)
    }
  }
}

function parseOptionalNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && value.trim() ? parsed : null
}

async function hasConnectedGoogleDrive(supabase: SupabaseClient, shopId: string) {
  const { data, error } = await supabase
    .from('shop_google_integrations')
    .select('id')
    .eq('shop_id', shopId)
    .eq('provider', 'google')
    .eq('connection_status', 'connected')
    .maybeSingle()

  if (error) throw error
  return Boolean(data?.id)
}

async function getAuthAccessToken(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error('กรุณาเข้าสู่ระบบใหม่ก่อนใช้งาน Google Drive')
  }

  return accessToken
}

async function uploadGoogleDriveCustomerDocuments(
  supabase: SupabaseClient,
  customer: Customer,
  files: File[],
) {
  const functionUrl = getFunctionUrl('google-drive-customer-documents-upload')
  if (!functionUrl) {
    throw new Error('ยังไม่ได้ตั้งค่า VITE_SUPABASE_URL สำหรับอัปโหลด Google Drive')
  }

  const formData = new FormData()
  formData.append('shopId', customer.shopId)
  formData.append('customerId', customer.id)
  files.forEach((file) => formData.append('files', file))

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getAuthAccessToken(supabase)}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw await createFunctionError(response, 'อัปโหลดรูปไป Google Drive ไม่สำเร็จ')
  }
}

async function deleteGoogleDriveCustomerDocuments(
  supabase: SupabaseClient,
  shopId: string,
  documents: CustomerDocument[],
) {
  const functionUrl = getFunctionUrl('google-drive-customer-documents-delete')
  if (!functionUrl) {
    throw new Error('ยังไม่ได้ตั้งค่า VITE_SUPABASE_URL สำหรับลบรูปใน Google Drive')
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getAuthAccessToken(supabase)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shopId,
      documentIds: documents.map((document) => document.id),
    }),
  })

  if (!response.ok) {
    throw await createFunctionError(response, 'ลบรูปจาก Google Drive ไม่สำเร็จ')
  }
}

async function createGoogleDrivePreviewUrl(
  supabase: SupabaseClient,
  documentId: string,
) {
  const functionUrl = getFunctionUrl('google-drive-customer-document')
  if (!functionUrl) return undefined

  const response = await fetch(`${functionUrl}?documentId=${encodeURIComponent(documentId)}`, {
    headers: {
      Authorization: `Bearer ${await getAuthAccessToken(supabase)}`,
    },
  })

  if (!response.ok) {
    return undefined
  }

  const blob = await response.blob()
  if (!blob.size) {
    return undefined
  }

  return URL.createObjectURL(blob)
}

async function createFunctionError(response: Response, fallbackMessage: string) {
  try {
    const body = await response.json() as { error?: string }
    return new Error(body.error || fallbackMessage)
  } catch {
    return new Error(fallbackMessage)
  }
}
