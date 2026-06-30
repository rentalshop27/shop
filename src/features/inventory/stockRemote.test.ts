import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import {
  countRemoteRentalsForStockSku,
  createRemoteStockItems,
  deleteShopHeroImage,
  deleteRemoteStockItem,
  loadShopSettings,
  loadStockItems,
  uploadShopHeroImage,
  updateRemoteStockItem,
  updateRemoteStockItemPublicVisibility,
  updateRemoteStockItemStatus,
  updateShopSettings,
} from './stockRemote'

describe('stock remote', () => {
  it('loads stock items for the active shop only', async () => {
    const filters: Array<[string, string]> = []
    const order = vi.fn(() => ({ data: [], error: null }))
    const eq = vi.fn((column: string, value: string) => {
      filters.push([column, value])
      return { order }
    })
    const select = vi.fn(() => ({ eq }))
    const supabase = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient

    await loadStockItems(supabase, 'shop_1')

    expect(supabase.from).toHaveBeenCalledWith('stock_items')
    expect(select).toHaveBeenCalledWith('*')
    expect(filters).toEqual([['shop_id', 'shop_1']])
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

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

  it('loads settings for the active shop only', async () => {
    const filters: Array<[string, string]> = []
    const maybeSingle = vi.fn(() => ({
      data: {
        brands: ['Precious'],
        categories: ['ชุดราตรี'],
        colors: ['ดำ'],
        public_catalog_enabled: true,
        catalog_hero_image_path: 'shop_1/catalog/hero.png',
      },
      error: null,
    }))
    const eq = vi.fn((column: string, value: string) => {
      filters.push([column, value])
      return { maybeSingle }
    })
    const select = vi.fn(() => ({ eq }))
    const createSignedUrl = vi.fn(() => ({ data: { signedUrl: 'https://example.com/hero-signed' }, error: null }))
    const supabase = {
      from: vi.fn(() => ({ select })),
      storage: {
        from: vi.fn(() => ({ createSignedUrl })),
      },
    } as unknown as SupabaseClient

    const settings = await loadShopSettings(supabase, 'shop_1')

    expect(supabase.from).toHaveBeenCalledWith('shops')
    expect(select).toHaveBeenCalledWith('brands, categories, colors, public_catalog_enabled, catalog_hero_image_path')
    expect(filters).toEqual([['id', 'shop_1']])
    expect(maybeSingle).toHaveBeenCalled()
    expect(createSignedUrl).toHaveBeenCalledWith('shop_1/catalog/hero.png', 60 * 15)
    expect(settings).toEqual({
      brands: ['Precious'],
      categories: ['ชุดราตรี'],
      colors: ['ดำ'],
      publicCatalogEnabled: true,
      catalogHeroImageUrl: 'https://example.com/hero-signed',
    })
  })

  it('updates settings for the active shop only', async () => {
    const filters: Array<[string, string]> = []
    const updatePayloads: unknown[] = []
    const eq = vi.fn((column: string, value: string) => {
      filters.push([column, value])
      return { error: null }
    })
    const update = vi.fn((payload: unknown) => {
      updatePayloads.push(payload)
      return { eq }
    })
    const supabase = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient

    await updateShopSettings(supabase, 'shop_1', {
      brands: ['Precious'],
      categories: ['ชุดราตรี'],
      colors: ['ดำ'],
      publicCatalogEnabled: false,
      catalogHeroImageUrl: 'https://example.supabase.co/storage/v1/object/sign/shop-assets/shop_1/catalog/hero.png?token=abc',
    })

    expect(supabase.from).toHaveBeenCalledWith('shops')
    expect(filters).toEqual([['id', 'shop_1']])
    expect(updatePayloads[0]).toMatchObject({
      brands: ['Precious'],
      categories: ['ชุดราตรี'],
      colors: ['ดำ'],
      public_catalog_enabled: false,
      catalog_hero_image_path: 'shop_1/catalog/hero.png',
    })
  })

  it('uploads a shop hero image and removes the previous asset path', async () => {
    const upload = vi.fn(() => ({ error: null }))
    const createSignedUrl = vi.fn(() => ({ data: { signedUrl: 'https://example.com/new-hero-signed' }, error: null }))
    const remove = vi.fn(() => ({ error: null }))
    const supabase = {
      storage: {
        from: vi.fn((bucket: string) => {
          if (bucket === 'shop-assets') {
            return { upload, createSignedUrl, remove }
          }
          throw new Error(`Unexpected bucket ${bucket}`)
        }),
      },
    } as unknown as SupabaseClient

    const file = new File(['hero'], 'hero.png', { type: 'image/png' })
    const signedUrl = await uploadShopHeroImage(
      supabase,
      'shop_1',
      file,
      'https://example.supabase.co/storage/v1/object/sign/shop-assets/shop_1/catalog/old-hero.png?token=abc',
    )

    expect(signedUrl).toBe('https://example.com/new-hero-signed')
    expect(upload).toHaveBeenCalledTimes(1)
    expect(createSignedUrl).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith(['shop_1/catalog/old-hero.png'])
  })

  it('deletes a shop hero image by parsed storage path', async () => {
    const remove = vi.fn(() => ({ error: null }))
    const supabase = {
      storage: {
        from: vi.fn(() => ({ remove })),
      },
    } as unknown as SupabaseClient

    await deleteShopHeroImage(
      supabase,
      'https://example.supabase.co/storage/v1/object/sign/shop-assets/shop_1/catalog/hero.png?token=abc',
    )

    expect(remove).toHaveBeenCalledWith(['shop_1/catalog/hero.png'])
  })

  it('updates a stock item by both id and active shop', async () => {
    const filters: Array<[string, string]> = []
    const savedRow = {
      id: 'stock_1',
      shop_id: 'shop_1',
      sku: 'SKU-001',
      serial_number: '',
      product_name: 'Updated Dress',
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
      public_visible: false,
      created_at: '2026-06-13T00:00:00.000Z',
      updated_at: '2026-06-20T00:00:00.000Z',
    }
    const query = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return query
      }),
      select: vi.fn(() => ({ single: vi.fn(() => ({ data: savedRow, error: null })) })),
    }
    const supabase = {
      from: vi.fn(() => ({ update: vi.fn(() => query) })),
      storage: {
        from: vi.fn(() => ({ remove: vi.fn(() => ({ error: null })) })),
      },
    } as unknown as SupabaseClient

    await updateRemoteStockItem(
      supabase,
      'shop_1',
      'stock_1',
      {
        sku: 'SKU-001',
        serialNumber: '',
        productName: 'Updated Dress',
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
        publicVisible: false,
      },
      [],
    )

    expect(filters).toEqual([
      ['id', 'stock_1'],
      ['shop_id', 'shop_1'],
    ])
  })

  it('deletes a stock item by both id and active shop', async () => {
    const filters: Array<[string, string]> = []
    const query = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return filters.length === 2 ? { error: null } : query
      }),
    }
    const supabase = {
      from: vi.fn(() => ({ delete: vi.fn(() => query) })),
      storage: {
        from: vi.fn(() => ({ remove: vi.fn(() => ({ error: null })) })),
      },
    } as unknown as SupabaseClient

    await deleteRemoteStockItem(supabase, 'shop_1', 'stock_1', [])

    expect(filters).toEqual([
      ['id', 'stock_1'],
      ['shop_id', 'shop_1'],
    ])
  })

  it('updates stock status by both id and active shop', async () => {
    const filters: Array<[string, string]> = []
    const query = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return filters.length === 2 ? { error: null } : query
      }),
    }
    const supabase = {
      from: vi.fn(() => ({ update: vi.fn(() => query) })),
    } as unknown as SupabaseClient

    await updateRemoteStockItemStatus(supabase, 'shop_1', 'stock_1', 'repair')

    expect(filters).toEqual([
      ['id', 'stock_1'],
      ['shop_id', 'shop_1'],
    ])
  })

  it('updates stock public visibility by both id and active shop', async () => {
    const filters: Array<[string, string]> = []
    const query = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return filters.length === 2 ? { error: null } : query
      }),
    }
    const supabase = {
      from: vi.fn(() => ({ update: vi.fn(() => query) })),
    } as unknown as SupabaseClient

    await updateRemoteStockItemPublicVisibility(supabase, 'shop_1', 'stock_1', true)

    expect(filters).toEqual([
      ['id', 'stock_1'],
      ['shop_id', 'shop_1'],
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
    const deleteFilters: Array<[string, string]> = []
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
    const deleteFilterQuery = {
      eq: vi.fn((column: string, value: string) => {
        deleteFilters.push([column, value])
        return deleteFilters.length % 2 === 0 ? { error: null } : deleteFilterQuery
      }),
    }
    const deleteQuery = {
      delete: vi.fn(() => deleteFilterQuery),
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
    expect(deleteFilters).toEqual([
      ['id', 'stock_1'],
      ['shop_id', 'shop_1'],
    ])
  })
})
