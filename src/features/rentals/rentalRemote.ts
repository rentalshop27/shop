import type { SupabaseClient } from '@supabase/supabase-js'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import type { Customer } from '../customers/customerTypes'
import type { RentalOrder, RentalShippingUpdate, RentalStatus } from './rentalTypes'

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
  shipping_method: string | null
  tracking_number: string | null
  return_tracking_note: string | null
  shipping_cost: number | string | null
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
    shipping_method: rental.shippingMethod ?? null,
    tracking_number: rental.trackingNumber ?? null,
    return_tracking_note: rental.returnTrackingNote ?? null,
    shipping_cost: rental.shippingCost ?? 0,
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
    shippingMethod: row.shipping_method ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    returnTrackingNote: row.return_tracking_note ?? undefined,
    shippingCost: Number(row.shipping_cost) || 0,
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
