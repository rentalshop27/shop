import type { SupabaseClient } from '@supabase/supabase-js'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import type { Customer } from '../customers/customerTypes'
import type { RentalOrder, RentalShippingUpdate, RentalStatus, DepositStatus } from './rentalTypes'

export type RentalDepositResolutionUpdate = {
  id: string
  depositStatus: DepositStatus
  depositForfeitedAmount: number
  depositResolutionNote?: string | null
  depositResolvedAt: string
}

export type RentalFineUpdate = {
  id: string
  fineAmount: number
  fineReason: string
  fineCreatedAt: string
}

type RentalRow = {
  id: string
  shop_id: string
  order_code: string
  customer_id: string
  stock_item_id: string
  stock_item_sku: string | null
  pickup_date: string
  return_date: string
  rental_price: number | string
  deposit_amount: number | string
  collected_amount: number | string
  status: RentalStatus
  deposit_status: DepositStatus | null
  deposit_forfeited_amount: number | string | null
  deposit_resolution_note: string | null
  deposit_resolved_at: string | null
  shipping_method: string | null
  tracking_number: string | null
  return_tracking_note: string | null
  shipping_cost: number | string | null
  fine_amount: number | string | null
  fine_reason: string | null
  fine_created_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function loadRentals(
  supabase: SupabaseClient,
  shopId: string,
  customers: Customer[],
  stockItems: FlatStockItem[],
): Promise<RentalOrder[]> {
  const { data, error } = await supabase
    .from('rentals')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => mapRentalRow(row as RentalRow, customers, stockItems))
}

export async function createRemoteRental(
  supabase: SupabaseClient,
  shopId: string,
  rental: RentalOrder,
): Promise<void> {
  const { error } = await supabase.from('rentals').insert(toRentalInsert(shopId, rental))

  if (error) throw error
}

export async function createRemoteRentals(
  supabase: SupabaseClient,
  shopId: string,
  rentals: RentalOrder[],
): Promise<void> {
  if (rentals.length === 0) return

  const { error } = await supabase
    .from('rentals')
    .insert(rentals.map((rental) => toRentalInsert(shopId, rental)))

  if (error) throw error
}

function toRentalInsert(shopId: string, rental: RentalOrder) {
  return {
    id: rental.id,
    shop_id: shopId,
    order_code: rental.orderCode,
    customer_id: rental.customer.id,
    stock_item_id: rental.costume.id,
    stock_item_sku: rental.costume.sku, // Kept for legacy fallback
    pickup_date: rental.pickupDate,
    return_date: rental.returnDate,
    rental_price: rental.rentalPrice,
    deposit_amount: rental.depositAmount,
    collected_amount: rental.collectedAmount,
    status: rental.status,
    deposit_status: rental.depositStatus ?? null,
    deposit_forfeited_amount: rental.depositForfeitedAmount ?? 0,
    deposit_resolution_note: rental.depositResolutionNote ?? null,
    deposit_resolved_at: rental.depositResolvedAt ?? null,
    shipping_method: rental.shippingMethod ?? null,
    tracking_number: rental.trackingNumber ?? null,
    return_tracking_note: rental.returnTrackingNote ?? null,
    shipping_cost: rental.shippingCost ?? 0,
    fine_amount: rental.fineAmount ?? 0,
    fine_reason: rental.fineReason ?? '',
    fine_created_at: rental.fineCreatedAt ?? null,
    notes: rental.notes ?? '',
    created_at: rental.createdAt,
    updated_at: rental.updatedAt,
  }
}

export async function updateRemoteRentalStatus(
  supabase: SupabaseClient,
  shopId: string,
  rentalIds: string[],
  status: RentalStatus,
  shippingInfo?: RentalShippingUpdate
): Promise<void> {
  if (rentalIds.length === 0) return

  const updateData: {
    status: RentalStatus
    updated_at: string
    shipping_method?: string
    tracking_number?: string
    return_tracking_note?: string
  } = { status, updated_at: new Date().toISOString() }
  if (shippingInfo?.method) updateData.shipping_method = shippingInfo.method
  if (shippingInfo?.trackingNumber) updateData.tracking_number = shippingInfo.trackingNumber
  if (shippingInfo?.returnTrackingNote) updateData.return_tracking_note = shippingInfo.returnTrackingNote

  const { error } = await supabase
    .from('rentals')
    .update(updateData)
    .eq('shop_id', shopId)
    .in('id', rentalIds)

  if (error) throw error
}

/** อัปเดตสถานะปิดเคสเงินมัดจำของ rentals หลายแถวพร้อมกัน */
export async function updateRemoteRentalDepositResolution(
  supabase: SupabaseClient,
  shopId: string,
  updates: RentalDepositResolutionUpdate[],
): Promise<void> {
  if (updates.length === 0) return

  const { error } = await supabase.rpc('resolve_rental_deposit', {
    p_shop_id: shopId,
    p_updates: updates.map((update) => ({
      id: update.id,
      deposit_status: update.depositStatus,
      deposit_forfeited_amount: update.depositForfeitedAmount,
      deposit_resolution_note: update.depositResolutionNote ?? null,
      deposit_resolved_at: update.depositResolvedAt,
    })),
  })

  if (error) throw error
}

/**
 * อัปเดต field ที่แก้ไขได้ของ rental (ใช้ใน Edit Modal)
 * ส่งเฉพาะ field ที่ต้องการเปลี่ยนจริงๆ — partial patch
 */
export async function updateRemoteRentalFields(
  supabase: SupabaseClient,
  shopId: string,
  rentalId: string,
  patch: {
    stock_item_id?: string
    stock_item_sku?: string
    pickup_date?: string
    return_date?: string
    rental_price?: number
    deposit_amount?: number
    collected_amount?: number
    shipping_cost?: number
    notes?: string
    return_tracking_note?: string
  }
): Promise<void> {
  const { error } = await supabase
    .from('rentals')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('shop_id', shopId)
    .eq('id', rentalId)

  if (error) throw error
}

export async function deleteRemoteRental(
  supabase: SupabaseClient,
  shopId: string,
  rentalIds: string[],
): Promise<void> {
  if (rentalIds.length === 0) return

  const { error } = await supabase
    .from('rentals')
    .delete()
    .eq('shop_id', shopId)
    .in('id', rentalIds)
  if (error) throw error
}

export async function saveExtraFine(
  supabase: SupabaseClient,
  shopId: string,
  updates: RentalFineUpdate[],
): Promise<void> {
  if (updates.length === 0) return

  const { error } = await supabase.rpc('save_rental_fine_updates', {
    p_shop_id: shopId,
    p_updates: updates.map((update) => ({
      id: update.id,
      fine_amount: update.fineAmount,
      fine_reason: update.fineReason,
      fine_created_at: update.fineCreatedAt,
    })),
  })

  if (error) throw error
}

function mapRentalRow(
  row: RentalRow,
  customers: Customer[],
  stockItems: FlatStockItem[],
): RentalOrder {
  const customer = customers.find((item) => item.id === row.customer_id)
  
  // Try mapping by UUID first (new standard), fallback to SKU for non-migrated legacy data
  const costume = 
    stockItems.find((item) => item.id === row.stock_item_id) ??
    stockItems.find((item) => item.sku === row.stock_item_sku)

  if (!customer) {
    throw new Error(`ไม่พบลูกค้าของใบเช่า ${row.order_code}`)
  }
  if (!costume) {
    throw new Error(`ไม่พบชุดของใบเช่า ${row.order_code} (ID: ${row.stock_item_id}, SKU: ${row.stock_item_sku})`)
  }

  return {
    id: row.id,
    orderCode: row.order_code,
    customer,
    costume,
    pickupDate: row.pickup_date,
    returnDate: row.return_date,
    rentalPrice: Number(row.rental_price) || 0,
    depositAmount: Number(row.deposit_amount) || 0,
    collectedAmount: Number(row.collected_amount) || 0,
    status: row.status,
    depositStatus: row.deposit_status ?? undefined,
    depositForfeitedAmount: Number(row.deposit_forfeited_amount) || 0,
    depositResolutionNote: row.deposit_resolution_note ?? undefined,
    depositResolvedAt: row.deposit_resolved_at ?? undefined,
    shippingMethod: row.shipping_method ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    returnTrackingNote: row.return_tracking_note ?? undefined,
    shippingCost: Number(row.shipping_cost) || 0,
    fineAmount: Number(row.fine_amount) || 0,
    fineReason: row.fine_reason ?? undefined,
    fineCreatedAt: row.fine_created_at ?? undefined,
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
