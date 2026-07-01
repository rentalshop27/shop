import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  countRemoteRentalsForProduct,
  createProductWithVariants,
  deleteRemoteProduct,
  loadProductsWithStock,
  updateRemoteProduct,
} from './stockRemote'

describe('stockRemote', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('converts stored costume image refs into public URLs when loading products', async () => {
    const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }))
    const productsOrder = vi.fn(() => ({
      data: [{
        id: 'product_1',
        base_sku: 'PR-001',
        product_name: 'Ruby Dress',
        brand: 'Precious',
        category: 'Evening',
        primary_color: 'Red',
        public_description: '',
        rental_price_per_day: 2200,
        late_fee_rule: '',
        deposit_amount: 5000,
        image_urls: [
          'shop_1/ruby-front.webp',
          'https://project.supabase.co/storage/v1/object/public/costumes/shop_1/ruby-back.webp',
        ],
        public_visible: true,
        created_at: '2026-07-01T00:00:00.000Z',
      }],
      error: null,
    }))
    const stockOrder = vi.fn(() => ({
      data: [{
        id: 'stock_1',
        shop_id: 'shop_1',
        product_id: 'product_1',
        sku: 'PR-001-M-01',
        size: 'M',
        status: 'available',
        created_at: '2026-07-01T00:00:00.000Z',
      }],
      error: null,
    }))
    const productsEq = vi.fn(() => ({ order: productsOrder }))
    const stockEq = vi.fn(() => ({ order: stockOrder }))
    const supabase = {
      storage: {
        from: vi.fn(() => ({ getPublicUrl })),
      },
      from: vi.fn((table: string) => {
        if (table === 'products') return { select: vi.fn(() => ({ eq: productsEq })) }
        if (table === 'stock_items') return { select: vi.fn(() => ({ eq: stockEq })) }
        throw new Error(`Unexpected table ${table}`)
      }),
    } as unknown as SupabaseClient

    const products = await loadProductsWithStock(supabase, 'shop_1')

    expect(products[0].imageUrls).toEqual([
      'https://cdn.example/shop_1/ruby-front.webp',
      'https://cdn.example/shop_1/ruby-back.webp',
    ])
    expect(getPublicUrl).toHaveBeenNthCalledWith(1, 'shop_1/ruby-front.webp')
    expect(getPublicUrl).toHaveBeenNthCalledWith(2, 'shop_1/ruby-back.webp')
  })

  it('scopes product updates by shop id and removes deleted costume images after success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('image', { status: 200, headers: { 'Content-Type': 'image/png' } })))

    const removedPaths: string[][] = []
    const upload = vi.fn(async () => ({ error: null }))
    const remove = vi.fn(async (paths: string[]) => {
      removedPaths.push(paths)
      return { error: null }
    })
    const updatePayloads: Array<{ image_urls: string[] }> = []
    const filters: Array<[string, string]> = []
    const updateQuery = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return updateQuery
      }),
    }
    const update = vi.fn((payload: { image_urls: string[] }) => {
      updatePayloads.push(payload)
      return updateQuery
    })
    const supabase = {
      storage: {
        from: vi.fn(() => ({ upload, remove })),
      },
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient

    await updateRemoteProduct(
      supabase,
      'shop_1',
      'product_1',
      {
        productName: 'Ruby Dress',
        brand: 'Precious',
        category: 'Evening',
        primaryColor: 'Red',
        publicDescription: '',
        rentalPricePerDay: '2200',
        lateFeeRule: '',
        depositAmount: '5000',
        imageUrls: [
          'data:image/png;base64,abc123',
          'https://project.supabase.co/storage/v1/object/public/costumes/shop_1/keep.webp',
        ],
        publicVisible: true,
        isFeatured: false,
        displayOrder: 0,
      },
      [
        'https://project.supabase.co/storage/v1/object/public/costumes/shop_1/keep.webp',
        'https://project.supabase.co/storage/v1/object/public/costumes/shop_1/remove.webp',
      ],
    )

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      image_urls: expect.arrayContaining(['shop_1/keep.webp']),
      public_visible: true,
    }))
    const payload = updatePayloads[0]
    expect(payload).toBeDefined()
    if (!payload) return
    expect(payload.image_urls).toHaveLength(2)
    expect(payload.image_urls[0]).toMatch(/^shop_1\/product_1-0-/)
    expect(filters).toEqual([
      ['id', 'product_1'],
      ['shop_id', 'shop_1'],
    ])
    expect(removedPaths).toEqual([['shop_1/remove.webp']])
  })

  it('cleans up partially uploaded images when product creation fails before the rpc', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('image', { status: 200, headers: { 'Content-Type': 'image/png' } })))

    const removedPaths: string[][] = []
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: new Error('upload failed') })
    const remove = vi.fn(async (paths: string[]) => {
      removedPaths.push(paths)
      return { error: null }
    })
    const supabase = {
      storage: {
        from: vi.fn(() => ({ upload, remove })),
      },
      rpc: vi.fn(),
      from: vi.fn(() => {
        throw new Error('Product creation should stop before touching the database')
      }),
    } as unknown as SupabaseClient

    await expect(createProductWithVariants(supabase, 'shop_1', {
      baseSku: 'PR-001',
      productName: 'Ruby Dress',
      brand: 'Precious',
      category: 'Evening',
      primaryColor: 'Red',
      publicDescription: '',
      rentalPricePerDay: '2200',
      lateFeeRule: '',
      depositAmount: '5000',
      imageUrls: [
        'data:image/png;base64,first',
        'data:image/png;base64,second',
      ],
      publicVisible: true,
      isFeatured: false,
      displayOrder: 0,
      variants: [{ size: 'M', quantity: 1 }],
    })).rejects.toThrow('upload failed')

    expect(remove).toHaveBeenCalledTimes(1)
    expect(removedPaths[0]).toHaveLength(1)
    expect(removedPaths[0][0]).toMatch(/^shop_1\//)
  })

  it('scopes product rental counts by shop id in both stock and rental queries', async () => {
    const stockFilters: Array<[string, string]> = []
    const rentalFilters: Array<[string, string]> = []
    const selectStock = {
      eq: vi.fn((column: string, value: string) => {
        stockFilters.push([column, value])
        return selectStock
      }),
    }
    const selectRentals = {
      eq: vi.fn((column: string, value: string) => {
        rentalFilters.push([column, value])
        return selectRentals
      }),
      in: vi.fn(() => ({ count: 3, error: null })),
    }
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'stock_items') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn((column: string, value: string) => {
                stockFilters.push([column, value])
                return {
                  eq: vi.fn((nestedColumn: string, nestedValue: string) => {
                    stockFilters.push([nestedColumn, nestedValue])
                    return { data: [{ id: 'stock_1' }], error: null }
                  }),
                }
              }),
            })),
          }
        }
        if (table === 'rentals') return { select: vi.fn(() => selectRentals) }
        throw new Error(`Unexpected table ${table}`)
      }),
    } as unknown as SupabaseClient

    const count = await countRemoteRentalsForProduct(supabase, 'shop_1', 'product_1')

    expect(count).toBe(3)
    expect(stockFilters).toEqual([
      ['product_id', 'product_1'],
      ['shop_id', 'shop_1'],
    ])
    expect(rentalFilters).toEqual([['shop_id', 'shop_1']])
    expect(selectRentals.in).toHaveBeenCalledWith('stock_item_id', ['stock_1'])
  })

  it('scopes product deletion by selected shop id and removes stored image paths afterward', async () => {
    const removedPaths: string[][] = []
    const filters: Array<[string, string]> = []
    const deleteQuery = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return deleteQuery
      }),
    }
    const remove = vi.fn(async (paths: string[]) => {
      removedPaths.push(paths)
      return { error: null }
    })
    const supabase = {
      storage: {
        from: vi.fn(() => ({ remove })),
      },
      from: vi.fn(() => ({ delete: vi.fn(() => deleteQuery) })),
    } as unknown as SupabaseClient

    await deleteRemoteProduct(
      supabase,
      'shop_1',
      'product_1',
      ['https://project.supabase.co/storage/v1/object/public/costumes/shop_1/ruby-front.webp'],
    )

    expect(filters).toEqual([
      ['id', 'product_1'],
      ['shop_id', 'shop_1'],
    ])
    expect(removedPaths).toEqual([['shop_1/ruby-front.webp']])
  })
})
