import { createServiceClient } from '../_shared/googleOAuth.ts'

type ShopRow = {
  id: string
  name: string
  public_catalog_enabled: boolean
}

type StockItemRow = {
  sku: string
  product_name: string
  brand: string
  category: string
  size: string
  primary_color: string
  public_description: string
  set_count: number
  rental_price_per_day: number
  image_urls: string[]
  status: string
  created_at: string
}

type RentalRow = {
  stock_item_sku: string
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const url = new URL(request.url)
    const shopId = url.searchParams.get('shopId')?.trim() || ''

    if (!shopId) {
      return jsonResponse({ error: 'Missing shopId' }, 400)
    }

    const supabase = createServiceClient()
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name, public_catalog_enabled')
      .eq('id', shopId)
      .maybeSingle()

    if (shopError) throw shopError
    if (!shop) {
      return jsonResponse({ error: 'ไม่พบร้านนี้' }, 404)
    }

    const typedShop = shop as ShopRow
    if (!typedShop.public_catalog_enabled) {
      return jsonResponse({ error: 'ร้านนี้ยังไม่ได้เปิด public catalog' }, 403)
    }

    const { data: stockRows, error: stockError } = await supabase
      .from('stock_items')
      .select(`
        sku,
        product_name,
        brand,
        category,
        size,
        primary_color,
        public_description,
        set_count,
        rental_price_per_day,
        image_urls,
        status,
        created_at
      `)
      .eq('shop_id', shopId)
      .eq('public_visible', true)
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (stockError) throw stockError

    const rows = (stockRows ?? []) as StockItemRow[]
    const skus = rows.map((row) => row.sku)
    const bookedSkus = new Set<string>()

    if (skus.length > 0) {
      const { data: rentalRows, error: rentalError } = await supabase
        .from('rentals')
        .select('stock_item_sku')
        .eq('shop_id', shopId)
        .in('stock_item_sku', skus)
        .in('status', ['booked', 'active', 'overdue'])

      if (rentalError) throw rentalError

      ;((rentalRows ?? []) as RentalRow[]).forEach((rental) => {
        bookedSkus.add(rental.stock_item_sku)
      })
    }

    const items = await Promise.all(rows.map(async (row) => {
      const imageUrls = await Promise.all(
        (row.image_urls ?? []).slice(0, 5).map(async (path) => {
          const { data, error } = await supabase.storage
            .from('stock-images')
            .createSignedUrl(path, 60 * 60)

          if (error) return ''
          return data.signedUrl
        }),
      )

      return {
        productName: row.product_name,
        brand: row.brand ?? '',
        category: row.category ?? '',
        size: row.size ?? '',
        primaryColor: row.primary_color ?? '',
        publicDescription: row.public_description ?? '',
        setCount: row.set_count ?? 1,
        rentalPricePerDay: Number(row.rental_price_per_day) || 0,
        imageUrls: imageUrls.filter(Boolean),
        status: 'available',
        publicVisible: true,
        availabilityStatus: bookedSkus.has(row.sku) ? 'booked' : 'available',
        createdAt: row.created_at,
      }
    }))

    return jsonResponse({
      shop: {
        id: typedShop.id,
        name: typedShop.name,
      },
      items,
    })
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : 'โหลด public catalog ไม่สำเร็จ',
    }, 500)
  }
})
