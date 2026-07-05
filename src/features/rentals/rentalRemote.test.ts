import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import { deleteRemoteRental, loadRentals, saveExtraFine, updateRemoteRentalDepositResolution, updateRemoteRentalStatus } from './rentalRemote'

const customer: Customer = {
  id: 'customer_1',
  shopId: 'shop_1',
  customerCode: 'CUS-001',
  fullName: 'Somjai',
  lineAccount: 'somjai-line',
  phone: '0812345678',
  phoneNormalized: '0812345678',
  currentAddress: 'Bangkok',
  notes: '',
  profileStatus: 'verified',
  riskFlag: 'none',
  documents: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

const stockItem: FlatStockItem = {
  id: 'stock_1',
  shopId: 'shop_1',
  productId: 'product_1',
  sku: 'SKU-001',
  size: 'M',
  status: 'available',
  createdAt: '2026-07-01T00:00:00.000Z',
  productName: 'Golden Dress',
  brand: 'Precious',
  category: 'Evening',
  primaryColor: 'Gold',
  rentalTiers: [{ days: 1, price: 1200 }],
  lateFeeRule: '100/day',
  depositAmount: 500,
  imageUrls: ['https://signed.example/costumes/shop_1/golden-front.webp'],
  publicVisible: true,
  isFeatured: false,
  displayOrder: 0,
}

function createLoadRentalsClient(rows: unknown[]) {
  const order = vi.fn(async () => ({ data: rows, error: null }))
  const eq = vi.fn(() => ({ order }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))

  return {
    client: { from } as unknown as SupabaseClient,
    from,
    select,
    eq,
    order,
  }
}

function makeRentalRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rental_1',
    shop_id: 'shop_1',
    order_code: 'PR-ORD-260704-001',
    customer_id: 'customer_1',
    stock_item_id: 'stock_1',
    stock_item_sku: 'SKU-001',
    pickup_date: '2026-07-04',
    return_date: '2026-07-05',
    rental_price: 1200,
    deposit_amount: 500,
    collected_amount: 1700,
    status: 'booked',
    deposit_status: null,
    deposit_forfeited_amount: 0,
    deposit_resolution_note: null,
    deposit_resolved_at: null,
    shipping_method: null,
    tracking_number: null,
    return_tracking_note: null,
    shipping_cost: 0,
    fine_amount: 0,
    fine_reason: '',
    fine_created_at: null,
    notes: null,
    created_at: '2026-07-04T00:00:00.000Z',
    updated_at: '2026-07-04T00:00:00.000Z',
    ...overrides,
  }
}

describe('rentalRemote', () => {
  it('hydrates rental costumes with image urls from backend-loaded stock items', async () => {
    const { client, from, eq, order } = createLoadRentalsClient([makeRentalRow()])

    const rentals = await loadRentals(client, 'shop_1', [customer], [stockItem])

    expect(from).toHaveBeenCalledWith('rentals')
    expect(eq).toHaveBeenCalledWith('shop_id', 'shop_1')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(rentals[0].costume.imageUrls).toEqual(stockItem.imageUrls)
  })

  it('keeps image urls when hydrating legacy rental rows by stock item sku', async () => {
    const { client } = createLoadRentalsClient([
      makeRentalRow({
        stock_item_id: 'missing_legacy_id',
        stock_item_sku: 'SKU-001',
      }),
    ])

    const rentals = await loadRentals(client, 'shop_1', [customer], [stockItem])

    expect(rentals[0].costume.id).toBe('stock_1')
    expect(rentals[0].costume.imageUrls).toEqual(stockItem.imageUrls)
  })

  it('hydrates deposit resolution accounting fields', async () => {
    const { client } = createLoadRentalsClient([
      makeRentalRow({
        deposit_status: 'forfeited',
        deposit_forfeited_amount: '125.50',
        deposit_resolution_note: 'ชุดขาด',
        deposit_resolved_at: '2026-07-05T12:00:00.000Z',
      }),
    ])

    const rentals = await loadRentals(client, 'shop_1', [customer], [stockItem])

    expect(rentals[0]).toEqual(expect.objectContaining({
      depositStatus: 'forfeited',
      depositForfeitedAmount: 125.5,
      depositResolutionNote: 'ชุดขาด',
      depositResolvedAt: '2026-07-05T12:00:00.000Z',
    }))
  })

  it('hydrates extra fine fields', async () => {
    const { client } = createLoadRentalsClient([
      makeRentalRow({
        fine_amount: '350.25',
        fine_reason: 'คราบไวน์',
        fine_created_at: '2026-07-05T15:00:00.000Z',
      }),
    ])

    const rentals = await loadRentals(client, 'shop_1', [customer], [stockItem])

    expect(rentals[0]).toEqual(expect.objectContaining({
      fineAmount: 350.25,
      fineReason: 'คราบไวน์',
      fineCreatedAt: '2026-07-05T15:00:00.000Z',
    }))
  })

  it('scopes rental status updates by shop id and rental ids', async () => {
    const filters: Array<[string, string]> = []
    const updateQuery = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return updateQuery
      }),
      in: vi.fn(() => ({ error: null })),
    }
    const update = vi.fn(() => updateQuery)
    const supabase = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient

    await updateRemoteRentalStatus(supabase, 'shop_1', ['rental_1', 'rental_2'], 'returned')

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'returned',
        updated_at: expect.any(String),
      }),
    )
    expect(filters).toEqual([['shop_id', 'shop_1']])
    expect(updateQuery.in).toHaveBeenCalledWith('id', ['rental_1', 'rental_2'])
  })

  it('persists outbound and return shipping fields without overloading tracking_number', async () => {
    const updateQuery = {
      eq: vi.fn(() => updateQuery),
      in: vi.fn(() => ({ error: null })),
    }
    const update = vi.fn(() => updateQuery)
    const supabase = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient

    await updateRemoteRentalStatus(
      supabase,
      'shop_1',
      ['rental_1'],
      'returned',
      {
        method: 'thailand_post',
        trackingNumber: 'TH1234',
        returnTrackingNote: 'ลูกค้าส่งกลับทาง Kerry'
      }
    )

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'returned',
        shipping_method: 'thailand_post',
        tracking_number: 'TH1234',
        return_tracking_note: 'ลูกค้าส่งกลับทาง Kerry',
        updated_at: expect.any(String),
      }),
    )
  })

  it('scopes deposit resolution updates by shop id and rental id', async () => {
    const rpc = vi.fn(async () => ({ error: null }))
    const supabase = {
      rpc,
    } as unknown as SupabaseClient

    await updateRemoteRentalDepositResolution(supabase, 'shop_1', [
      {
        id: 'rental_1',
        depositStatus: 'forfeited',
        depositForfeitedAmount: 125.5,
        depositResolutionNote: 'ชุดขาด',
        depositResolvedAt: '2026-07-05T12:00:00.000Z',
      },
    ])

    expect(rpc).toHaveBeenCalledWith('resolve_rental_deposit', {
      p_shop_id: 'shop_1',
      p_updates: [
        {
          id: 'rental_1',
          deposit_status: 'forfeited',
          deposit_forfeited_amount: 125.5,
          deposit_resolution_note: 'ชุดขาด',
          deposit_resolved_at: '2026-07-05T12:00:00.000Z',
        },
      ],
    })
  })

  it('saves grouped fine allocations through the atomic rpc', async () => {
    const rpc = vi.fn(async () => ({ error: null }))
    const supabase = {
      rpc,
    } as unknown as SupabaseClient

    await saveExtraFine(supabase, 'shop_1', [
      {
        id: 'rental_1',
        fineAmount: 200,
        fineReason: 'ซิปแตก',
        fineCreatedAt: '2026-07-06T01:23:45.000Z',
      },
      {
        id: 'rental_2',
        fineAmount: 100,
        fineReason: 'ซิปแตก',
        fineCreatedAt: '2026-07-06T01:23:45.000Z',
      },
    ])

    expect(rpc).toHaveBeenCalledWith('save_rental_fine_updates', {
      p_shop_id: 'shop_1',
      p_updates: [
        {
          id: 'rental_1',
          fine_amount: 200,
          fine_reason: 'ซิปแตก',
          fine_created_at: '2026-07-06T01:23:45.000Z',
        },
        {
          id: 'rental_2',
          fine_amount: 100,
          fine_reason: 'ซิปแตก',
          fine_created_at: '2026-07-06T01:23:45.000Z',
        },
      ],
    })
  })

  it('scopes rental deletes by shop id and rental ids', async () => {
    const filters: Array<[string, string]> = []
    const deleteQuery = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return deleteQuery
      }),
      in: vi.fn(() => ({ error: null })),
    }
    const remove = vi.fn(() => deleteQuery)
    const supabase = {
      from: vi.fn(() => ({ delete: remove })),
    } as unknown as SupabaseClient

    await deleteRemoteRental(supabase, 'shop_1', ['rental_1'])

    expect(remove).toHaveBeenCalledTimes(1)
    expect(filters).toEqual([['shop_id', 'shop_1']])
    expect(deleteQuery.in).toHaveBeenCalledWith('id', ['rental_1'])
  })
})
