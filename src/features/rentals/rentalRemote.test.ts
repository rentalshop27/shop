import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Customer } from '../customers/customerTypes'
import type { StockItem } from '../inventory/inventoryTypes'
import { loadRentals } from './rentalRemote'

const customer: Customer = {
  id: 'customer_1',
  shopId: 'shop_1',
  customerCode: 'PR-C001',
  fullName: 'ลูกค้าทดสอบ',
  lineAccount: '',
  phone: '0812345678',
  phoneNormalized: '0812345678',
  currentAddress: '',
  notes: '',
  profileStatus: 'verified',
  riskFlag: 'none',
  documents: [],
  createdAt: '2026-06-18T00:00:00.000Z',
  updatedAt: '2026-06-18T00:00:00.000Z',
}

const stockItem: StockItem = {
  id: 'stock_1',
  sku: 'SKU-001',
  serialNumber: '',
  productName: 'Evening Dress',
  brand: 'Precious',
  category: 'ชุดราตรี',
  size: 'M',
  primaryColor: 'ดำ',
  publicDescription: '',
  setCount: 1,
  rentalPricePerDay: 1200,
  lateFeeRule: '',
  depositAmount: 3000,
  imageUrls: [],
  status: 'available',
  createdAt: '2026-06-18T00:00:00.000Z',
}

describe('rental remote', () => {
  it('loads rentals for the selected shop only', async () => {
    const filters: Array<[string, string]> = []
    const order = vi.fn(() => ({
      data: [
        {
          id: 'rental_1',
          shop_id: 'shop_1',
          order_code: 'RENT-001',
          customer_id: 'customer_1',
          stock_item_sku: 'SKU-001',
          pickup_date: '2026-06-18',
          return_date: '2026-06-19',
          rental_price: 1200,
          deposit_amount: 3000,
          collected_amount: 4200,
          status: 'booked',
          notes: '',
          created_at: '2026-06-18T00:00:00.000Z',
          updated_at: '2026-06-18T00:00:00.000Z',
        },
      ],
      error: null,
    }))
    const eq = vi.fn((column: string, value: string) => {
      filters.push([column, value])
      return { order }
    })
    const select = vi.fn(() => ({ eq }))
    const supabase = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient

    const rentals = await loadRentals(supabase, 'shop_1', [customer], [stockItem])

    expect(supabase.from).toHaveBeenCalledWith('rentals')
    expect(select).toHaveBeenCalledWith('*')
    expect(filters).toEqual([['shop_id', 'shop_1']])
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(rentals).toHaveLength(1)
    expect(rentals[0].orderCode).toBe('RENT-001')
  })
})
