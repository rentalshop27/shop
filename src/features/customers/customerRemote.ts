import type { SupabaseClient } from '@supabase/supabase-js'
import type { Customer, CustomerDocument, CustomerDraft } from './customerTypes'
import { normalizeThaiPhone } from './customerRules'

type CustomerDocumentRow = {
  id: string
  customer_id: string
  storage_path: string
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

export async function loadOwnerShopId(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('shops')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.id ?? null
}

export async function loadCustomers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('customers')
    .select('*, customer_documents(*)')
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as CustomerRow[]
  return Promise.all(rows.map((row) => mapCustomerRow(supabase, row)))
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
    .select('*, customer_documents(*)')
    .single()

  if (error) throw error
  return mapCustomerRow(supabase, data as CustomerRow)
}

export async function updateRemoteCustomer(
  supabase: SupabaseClient,
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
    .select('*, customer_documents(*)')
    .single()

  if (error) throw error
  return mapCustomerRow(supabase, data as CustomerRow)
}

export async function updateRemoteCustomerStatus(
  supabase: SupabaseClient,
  customerId: string,
  profileStatus: Customer['profileStatus'],
) {
  const { error } = await supabase
    .from('customers')
    .update({ profile_status: profileStatus })
    .eq('id', customerId)

  if (error) throw error
}

export async function updateRemoteCustomerRisk(
  supabase: SupabaseClient,
  customerId: string,
  riskFlag: Customer['riskFlag'],
) {
  const { error } = await supabase
    .from('customers')
    .update({ risk_flag: riskFlag })
    .eq('id', customerId)

  if (error) throw error
}

export async function archiveRemoteCustomer(supabase: SupabaseClient, customerId: string) {
  const { error } = await supabase
    .from('customers')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', customerId)

  if (error) throw error
}

export async function uploadRemoteCustomerDocuments(
  supabase: SupabaseClient,
  customer: Customer,
  files: File[],
) {
  const existingCount = customer.documents.length
  const rows: Array<{
    shop_id: string
    customer_id: string
    storage_path: string
    sort_order: number
  }> = []

  for (const [index, file] of files.entries()) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const storagePath = `${customer.shopId}/${customer.id}/${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await supabase.storage
      .from('customer-documents')
      .upload(storagePath, file, { upsert: false })

    if (uploadError) throw uploadError

    rows.push({
      shop_id: customer.shopId,
      customer_id: customer.id,
      storage_path: storagePath,
      sort_order: existingCount + index + 1,
    })
  }

  const { error } = await supabase.from('customer_documents').insert(rows)
  if (error) throw error
}

async function mapCustomerRow(supabase: SupabaseClient, row: CustomerRow): Promise<Customer> {
  const documents = await Promise.all(
    (row.customer_documents ?? [])
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((document) => mapDocumentRow(supabase, document)),
  )

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
  supabase: SupabaseClient,
  row: CustomerDocumentRow,
): Promise<CustomerDocument> {
  const { data } = await supabase.storage
    .from('customer-documents')
    .createSignedUrl(row.storage_path, 60 * 5)

  return {
    id: row.id,
    customerId: row.customer_id,
    storagePath: row.storage_path,
    previewUrl: data?.signedUrl,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }
}

function parseOptionalNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && value.trim() ? parsed : null
}
