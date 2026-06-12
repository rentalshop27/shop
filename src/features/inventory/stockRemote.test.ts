import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { countRemoteRentalsForStockSku } from './stockRemote'

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
})
