import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { countRemoteRentalsForStockSku, createRemoteStockItems } from './stockRemote'

describe('stock remote', () => {
  it('counts rentals for a stock SKU within the active shop only', async () => {
    const filters: Array<[string, string]> = []
    const terminalResult = { count: 2, error: null }
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return filters.length === 2 ? terminalResult : query
      }),
    }
    const supabase = {
      from: vi.fn(() => query),
    } as unknown as SupabaseClient

    const count = await countRemoteRentalsForStockSku(supabase, 'shop_1', 'SKU-001')

    expect(count).toBe(2)
    expect(supabase.from).toHaveBeenCalledWith('rentals')
    expect(query.select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
    expect(filters).toEqual([
      ['shop_id', 'shop_1'],
      ['stock_item_sku', 'SKU-001'],
    ])
  })

  it('rolls back previously created stock items when batch creation fails', async () => {
    const firstInsertResult = {
      data: {
        id: 'stock_1',
        shop_id: 'shop_1',
        sku: 'SKU-001',
        serial_number: '',
        product_name: 'First Dress',
        brand: '',
        category: '',
        size: 'M',
        primary_color: '',
        public_description: '',
        set_count: 1,
        rental_price_per_day: 1000,
        late_fee_rule: '',
        deposit_amount: 2000,
        image_urls: [],
        status: 'available',
        created_at: '2026-06-13T00:00:00.000Z',
        updated_at: '2026-06-13T00:00:00.000Z',
      },
      error: null,
    }
    const secondInsertResult = {
      data: null,
      error: new Error('duplicate sku'),
    }
    const insertPayloads: unknown[] = []
    const deletedIds: string[] = []
    const insertResults = [firstInsertResult, secondInsertResult]

    const makeInsertQuery = () => ({
      insert: vi.fn((payload: unknown) => {
        insertPayloads.push(payload)
        return {
          select: vi.fn(() => ({
            single: vi.fn(() => insertResults.shift()),
          })),
        }
      }),
    })
    const deleteQuery = {
      delete: vi.fn(() => ({
        eq: vi.fn((_column: string, value: string) => {
          deletedIds.push(value)
          return { error: null }
        }),
      })),
    }
    const supabase = {
      from: vi.fn((table: string) => {
        if (table !== 'stock_items') throw new Error(`Unexpected table ${table}`)
        return insertResults.length > 0 ? makeInsertQuery() : deleteQuery
      }),
      storage: {
        from: vi.fn(() => ({
          remove: vi.fn(() => ({ error: null })),
          createSignedUrl: vi.fn(),
        })),
      },
    } as unknown as SupabaseClient

    await expect(
      createRemoteStockItems(supabase, 'shop_1', [
        {
          sku: 'SKU-001',
          serialNumber: '',
          productName: 'First Dress',
          brand: '',
          category: '',
          size: 'M',
          primaryColor: '',
          publicDescription: '',
          setCount: 1,
          rentalPricePerDay: 1000,
          lateFeeRule: '',
          depositAmount: 2000,
          imageUrls: [],
          status: 'available',
        },
        {
          sku: 'SKU-002',
          serialNumber: '',
          productName: 'Second Dress',
          brand: '',
          category: '',
          size: 'M',
          primaryColor: '',
          publicDescription: '',
          setCount: 1,
          rentalPricePerDay: 1000,
          lateFeeRule: '',
          depositAmount: 2000,
          imageUrls: [],
          status: 'available',
        },
      ])
    ).rejects.toThrow('duplicate sku')

    expect(insertPayloads).toHaveLength(2)
    expect(deletedIds).toEqual(['stock_1'])
  })
})
