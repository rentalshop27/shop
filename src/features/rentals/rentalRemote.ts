import type { SupabaseClient } from '@supabase/supabase-js'
import type { StockItem } from '../../App'
import type { Customer } from '../customers/customerTypes'
import type { RentalOrder, RentalStatus } from './rentalTypes'

type RentalRow = {
  id: string
  shop_id: string
  order_code: string
  customer_id: string
  stock_item_sku: string
  pickup_date: string
  return_date: string
  rental_price: number | string
  deposit_amount: number | string
  collected_amount: number | string
  status: RentalStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export async function loadRentals(
  supabase: SupabaseClient,
  customers: Customer[],
  stockItems: StockItem[],
): Promise<RentalOrder[]> {
  const { data, error } = await supabase
    .from('rentals')
    .select('*')
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
    stock_item_sku: rental.costume.sku,
    pickup_date: rental.pickupDate,
    return_date: rental.returnDate,
    rental_price: rental.rentalPrice,
    deposit_amount: rental.depositAmount,
    collected_amount: rental.collectedAmount,
    status: rental.status,
    notes: rental.notes ?? '',
    created_at: rental.createdAt,
    updated_at: rental.updatedAt,
  }
}

export async function updateRemoteRentalStatus(
  supabase: SupabaseClient,
  rentalId: string,
  status: RentalStatus,
): Promise<void> {
  const { error } = await supabase
    .from('rentals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', rentalId)

  if (error) throw error
}

export async function deleteRemoteRental(
  supabase: SupabaseClient,
  rentalId: string,
): Promise<void> {
  const { error } = await supabase.from('rentals').delete().eq('id', rentalId)
  if (error) throw error
}

function mapRentalRow(
  row: RentalRow,
  customers: Customer[],
  stockItems: StockItem[],
): RentalOrder {
  const customer = customers.find((item) => item.id === row.customer_id)
  const costume = stockItems.find((item) => item.sku === row.stock_item_sku)

  if (!customer) {
    throw new Error(`ไม่พบลูกค้าของใบเช่า ${row.order_code}`)
  }
  if (!costume) {
    throw new Error(`ไม่พบชุด SKU ${row.stock_item_sku} ของใบเช่า ${row.order_code}`)
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
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
