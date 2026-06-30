import { createServiceClient } from '../_shared/googleOAuth.ts'

type ShopRow = {
  id: string
  name: string
  public_catalog_slug: string
  public_catalog_enabled: boolean
  catalog_hero_image_path: string | null
  catalog_mobile_hero_image_path: string | null
}

type ProductRow = {
  id: string
  base_sku: string
  product_name: string
  brand: string
  category: string
  primary_color: string
  public_description: string
  rental_price_per_day: number
  image_urls: string[]
  stock_items: {
    id: string
    size: string
    status: string
  }[]
}

type RentalRow = {
  stock_item_id: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? 'public, max-age=60, s-maxage=300' : 'no-store',
    },
  })
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const url = new URL(request.url)
    const catalogKey = (
      url.searchParams.get('catalogKey')
      ?? url.searchParams.get('shopId')
      ?? ''
    ).trim()

    if (!catalogKey) {
      return jsonResponse({ error: 'Missing catalogKey' }, 400)
    }

    const supabase = createServiceClient()
    const shopQuery = supabase
      .from('shops')
      .select('id, name, public_catalog_slug, public_catalog_enabled, catalog_hero_image_path, catalog_mobile_hero_image_path')

    const { data: shop, error: shopError } = await (
      isUuid(catalogKey)
        ? shopQuery.eq('id', catalogKey)
        : shopQuery.eq('public_catalog_slug', catalogKey.toLowerCase())
    ).maybeSingle()

    if (shopError) throw shopError
    if (!shop) {
      return jsonResponse({ error: 'ไม่พบร้านนี้' }, 404)
    }

    const typedShop = shop as ShopRow
    const shopId = typedShop.id
    if (!typedShop.public_catalog_enabled) {
      return jsonResponse({ error: 'ร้านนี้ยังไม่ได้เปิด public catalog' }, 403)
    }

    // Load Products + Stock Items (Children)
    const { data: productRows, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        base_sku,
        product_name,
        brand,
        category,
        primary_color,
        public_description,
        rental_price_per_day,
        image_urls,
        stock_items (
          id,
          size,
          status
        )
      `)
      .eq('shop_id', shopId)
      .eq('public_visible', true)
      .order('created_at', { ascending: false })

    if (productError) throw productError

    const rows = (productRows ?? []) as unknown as ProductRow[]
    
    // Find rented stock items
    const allStockIds = rows.flatMap(p => p.stock_items.map(si => si.id))
    const bookedStockIds = new Set<string>()

    if (allStockIds.length > 0) {
      // Chunking if > 1000 items? usually small enough for simple in filter
      const { data: rentalRows, error: rentalError } = await supabase
        .from('rentals')
        .select('stock_item_id')
        .eq('shop_id', shopId)
        .in('stock_item_id', allStockIds)
        .in('status', ['booked', 'active', 'overdue'])

      if (rentalError) throw rentalError

      ;((rentalRows ?? []) as RentalRow[]).forEach((rental) => {
        bookedStockIds.add(rental.stock_item_id)
      })
    }

    // Process rows into grouped catalog items
    const items = await Promise.all(rows.map(async (row) => {
      // Sign URLs for up to 5 images
      const imageUrls = await Promise.all(
        (row.image_urls ?? []).slice(0, 5).map(async (path) => {
          const { data, error } = await supabase.storage
            .from('stock-images')
            .createSignedUrl(path, 60 * 60)

          if (error) return ''
          return data.signedUrl
        }),
      )

      // Aggregate sizes
      const sizeMap = new Map<string, { total: number, available: number }>()
      
      row.stock_items.forEach(si => {
        const size = si.size || 'M'
        if (!sizeMap.has(size)) {
          sizeMap.set(size, { total: 0, available: 0 })
        }
        
        const stats = sizeMap.get(size)!
        stats.total += 1
        
        const isRented = bookedStockIds.has(si.id)
        if (si.status === 'available' && !isRented) {
          stats.available += 1
        }
      })

      const sizeSummary = Array.from(sizeMap.entries())
        .map(([size, stats]) => ({
          size,
          total: stats.total,
          available: stats.available
        }))
        .sort((a, b) => a.size.localeCompare(b.size)) // basic sort

      return {
        id: row.id,
        baseSku: row.base_sku,
        productName: row.product_name,
        brand: row.brand ?? '',
        category: row.category ?? '',
        primaryColor: row.primary_color ?? '',
        publicDescription: row.public_description ?? '',
        rentalPricePerDay: Number(row.rental_price_per_day) || 0,
        imageUrls: imageUrls.filter(Boolean),
        sizeSummary,
      }
    }))

    async function createShopAssetSignedUrl(path: string | null) {
      if (!path) return null

      const { data, error } = await supabase.storage
        .from('shop-assets')
        .createSignedUrl(path, 60 * 60)

      if (error) return null
      return data.signedUrl
    }

    const catalogHeroImageUrl = typedShop.catalog_hero_image_path
      ? await createShopAssetSignedUrl(typedShop.catalog_hero_image_path)
      : null
    const catalogMobileHeroImageUrl = typedShop.catalog_mobile_hero_image_path
      ? await createShopAssetSignedUrl(typedShop.catalog_mobile_hero_image_path)
      : null

    return jsonResponse({
      shop: {
        id: typedShop.id,
        name: typedShop.name,
        publicCatalogSlug: typedShop.public_catalog_slug,
        catalogHeroImageUrl,
        catalogMobileHeroImageUrl,
      },
      items,
    })
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : 'โหลด public catalog ไม่สำเร็จ',
    }, 500)
  }
})
