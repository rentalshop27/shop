import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductWithStockSummary, StockItemStatus, ProductDraft } from './inventoryTypes'

export async function loadProductsWithStock(supabase: SupabaseClient, shopId: string): Promise<ProductWithStockSummary[]> {
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (productsError) throw productsError

  const { data: stockData, error: stockError } = await supabase
    .from('stock_items')
    .select('*')
    .eq('shop_id', shopId)
    .order('sku', { ascending: true })

  if (stockError) throw stockError

  const products: ProductWithStockSummary[] = (productsData ?? []).map(row => ({
    id: row.id,
    baseSku: row.base_sku,
    productName: row.product_name,
    brand: row.brand ?? '',
    category: row.category ?? '',
    primaryColor: row.primary_color ?? '',
    publicDescription: row.public_description ?? '',
    rentalPricePerDay: Number(row.rental_price_per_day) || 0,
    lateFeeRule: row.late_fee_rule ?? '',
    depositAmount: Number(row.deposit_amount) || 0,
    imageUrls: row.image_urls ?? [],
    publicVisible: row.public_visible,
    createdAt: row.created_at,
    stockItems: []
  }))

  const productMap = new Map(products.map(p => [p.id, p]))

  for (const stockRow of (stockData ?? [])) {
    const product = productMap.get(stockRow.product_id)
    if (product) {
      product.stockItems.push({
        id: stockRow.id,
        shopId: stockRow.shop_id,
        productId: stockRow.product_id,
        sku: stockRow.sku,
        size: stockRow.size,
        status: stockRow.status as StockItemStatus,
        createdAt: stockRow.created_at,
      })
    }
  }

  return products
}

async function uploadProductImages(supabase: SupabaseClient, shopId: string, productId: string, dataUrls: string[]) {
  const uploadedPaths: string[] = []
  const paths = await Promise.all(
    dataUrls.map(async (url, index) => {
      if (!url.startsWith('data:')) return url
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png'
        const filename = `${productId}-${index}-${Date.now()}.${ext}`
        const storagePath = `${shopId}/${filename}`
        const { error } = await supabase.storage.from('costumes').upload(storagePath, blob, { upsert: false })
        if (error) throw error
        uploadedPaths.push(storagePath)
        const { data } = supabase.storage.from('costumes').getPublicUrl(storagePath)
        return data.publicUrl
      } catch (e) {
        console.error('Upload failed', e)
        return url
      }
    })
  )
  return { paths, uploadedPaths }
}

export async function createProductWithVariants(supabase: SupabaseClient, shopId: string, draft: ProductDraft) {
  const tempId = crypto.randomUUID()
  const { paths, uploadedPaths } = await uploadProductImages(supabase, shopId, tempId, draft.imageUrls)
  
  const payload = {
    shop_id: shopId,
    base_sku: draft.baseSku,
    product_name: draft.productName,
    brand: draft.brand,
    category: draft.category,
    primary_color: draft.primaryColor,
    public_description: draft.publicDescription,
    rental_price_per_day: Number(draft.rentalPricePerDay) || 0,
    late_fee_rule: draft.lateFeeRule,
    deposit_amount: Number(draft.depositAmount) || 0,
    image_urls: paths,
    public_visible: draft.publicVisible
  }

  const { error: rpcError } = await supabase.rpc('create_product_with_variants', {
    p_shop_id: shopId,
    p_product: payload,
    p_variants: draft.variants
  })
  
  if (rpcError) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from('costumes').remove(uploadedPaths)
    }
    throw rpcError
  }
}

export async function addStockToVariant(supabase: SupabaseClient, shopId: string, productId: string, size: string, quantity: number) {
  const { error } = await supabase.rpc('add_stock_to_variant', {
    p_shop_id: shopId,
    p_product_id: productId,
    p_size: size,
    p_quantity: quantity
  })
  if (error) throw error
}

export async function updateRemoteProduct(supabase: SupabaseClient, shopId: string, productId: string, draft: Omit<ProductDraft, 'variants' | 'baseSku'>, /* oldImageUrls */) {
  const { paths, uploadedPaths } = await uploadProductImages(supabase, shopId, productId, draft.imageUrls)
  const { error } = await supabase.from('products').update({
    product_name: draft.productName,
    brand: draft.brand,
    category: draft.category,
    primary_color: draft.primaryColor,
    public_description: draft.publicDescription,
    rental_price_per_day: Number(draft.rentalPricePerDay) || 0,
    late_fee_rule: draft.lateFeeRule,
    deposit_amount: Number(draft.depositAmount) || 0,
    image_urls: paths,
    public_visible: draft.publicVisible,
    updated_at: new Date().toISOString()
  }).eq('id', productId)
  if (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from('costumes').remove(uploadedPaths)
    }
    throw error
  }
}

export async function deleteRemoteProduct(supabase: SupabaseClient, /* shopId */ _shopId: string, productId: string, /* imageUrls */ _imageUrls?: string[]) {
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) throw error
}

export async function deleteRemoteStockItem(supabase: SupabaseClient, /* shopId */ _shopId: string, stockItemId: string) {
  const { error } = await supabase.from('stock_items').delete().eq('id', stockItemId)
  if (error) throw error
}

export async function updateRemoteProductPublicVisibility(supabase: SupabaseClient, _shopId: string, productId: string, visible: boolean) {
  const { error } = await supabase.from('products').update({ public_visible: visible }).eq('id', productId)
  if (error) throw error
}

export async function updateRemoteStockItemStatus(supabase: SupabaseClient, /* shopId */ _shopId: string, stockItemId: string, status: StockItemStatus) {
  const { error } = await supabase.from('stock_items').update({ status }).eq('id', stockItemId)
  if (error) throw error
}

export async function countRemoteRentalsForProduct(supabase: SupabaseClient, _shopId: string, productId: string): Promise<number> {
  const { data: stockItems } = await supabase.from('stock_items').select('id').eq('product_id', productId)
  if (!stockItems || stockItems.length === 0) return 0
  const ids = stockItems.map(s => s.id)
  const { count: rentalCount, error: rError } = await supabase.from('rentals').select('*', { count: 'exact', head: true }).in('stock_item_id', ids)
  if (rError) throw rError
  return rentalCount || 0
}

export async function countRemoteRentalsForStockItem(supabase: SupabaseClient, /* shopId */ _shopId: string, stockItemId: string): Promise<number> {
  const { count, error } = await supabase.from('rentals').select('*', { count: 'exact', head: true }).eq('stock_item_id', stockItemId)
  if (error) throw error
  return count || 0
}

export type ShopSettings = {
  brands: string[]
  categories: string[]
  colors: string[]
  publicCatalogEnabled: boolean
  catalogHeroImageUrl: string | null
  catalogMobileHeroImageUrl: string | null
}

const SHOP_HERO_BUCKET = 'shop-assets'

export async function loadShopSettings(supabase: SupabaseClient, shopId: string): Promise<ShopSettings | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('brands, categories, colors, public_catalog_enabled, catalog_hero_image_path, catalog_mobile_hero_image_path')
    .eq('id', shopId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  // Since createSignedStorageUrl is missing in the new version, we can just get the public URL for now
  const catalogHeroImageUrl = data.catalog_hero_image_path 
    ? supabase.storage.from(SHOP_HERO_BUCKET).getPublicUrl(data.catalog_hero_image_path).data.publicUrl
    : null
  const catalogMobileHeroImageUrl = data.catalog_mobile_hero_image_path
    ? supabase.storage.from(SHOP_HERO_BUCKET).getPublicUrl(data.catalog_mobile_hero_image_path).data.publicUrl
    : null

  return {
    brands: data.brands,
    categories: data.categories,
    colors: data.colors,
    publicCatalogEnabled: Boolean(data.public_catalog_enabled),
    catalogHeroImageUrl,
    catalogMobileHeroImageUrl,
  }
}

export async function updateShopSettings(supabase: SupabaseClient, shopId: string, settings: ShopSettings): Promise<void> {
  // Simplistic url extraction logic
  const extractPath = (url: string | null) => {
    if (!url) return null
    const parts = url.split('/')
    const idx = parts.indexOf(SHOP_HERO_BUCKET)
    return idx !== -1 ? parts.slice(idx + 1).join('/') : url
  }
  
  const { error } = await supabase.from('shops').update({
    brands: settings.brands,
    categories: settings.categories,
    colors: settings.colors,
    public_catalog_enabled: settings.publicCatalogEnabled,
    catalog_hero_image_path: extractPath(settings.catalogHeroImageUrl),
    catalog_mobile_hero_image_path: extractPath(settings.catalogMobileHeroImageUrl),
    updated_at: new Date().toISOString()
  }).eq('id', shopId)
  if (error) throw error
}

export async function uploadShopHeroImage(supabase: SupabaseClient, shopId: string, file: File, /* previousImageUrl */ _previousImageUrl?: string | null, variant: 'desktop' | 'mobile' = 'desktop'): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const storagePath = `${shopId}/catalog/${variant}-${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(SHOP_HERO_BUCKET).upload(storagePath, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(SHOP_HERO_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export async function deleteShopHeroImage(supabase: SupabaseClient, imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return
  const extractPath = (url: string) => {
    const parts = url.split('/')
    const idx = parts.indexOf(SHOP_HERO_BUCKET)
    return idx !== -1 ? parts.slice(idx + 1).join('/') : url
  }
  const path = extractPath(imageUrl)
  await supabase.storage.from(SHOP_HERO_BUCKET).remove([path])
}
