import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductWithStockSummary, StockItemStatus, ProductDraft } from './inventoryTypes'

const COSTUMES_BUCKET = 'costumes'
const COSTUMES_PUBLIC_PATH = `/storage/v1/object/public/${COSTUMES_BUCKET}/`

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
    rentalTiers: Array.isArray(row.rental_tiers) ? row.rental_tiers : [],
    lateFeeRule: row.late_fee_rule ?? '',
    depositAmount: Number(row.deposit_amount) || 0,
    imageUrls: (row.image_urls ?? []).map((imageRef: string) => toPublicCostumeUrl(supabase, imageRef)),
    publicVisible: row.public_visible,
    isFeatured: row.is_featured,
    displayOrder: row.display_order,
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

function toPublicCostumeUrl(supabase: SupabaseClient, imageRef: string) {
  const storagePath = extractCostumeStoragePath(imageRef)
  if (!storagePath) return imageRef
  return supabase.storage.from(COSTUMES_BUCKET).getPublicUrl(storagePath).data.publicUrl
}

function extractCostumeStoragePath(imageRef: string | null | undefined) {
  if (!imageRef) return null
  if (!imageRef.includes('://') && !imageRef.startsWith('data:')) return imageRef
  const publicPathIndex = imageRef.indexOf(COSTUMES_PUBLIC_PATH)
  if (publicPathIndex === -1) return null
  return imageRef.slice(publicPathIndex + COSTUMES_PUBLIC_PATH.length)
}

async function cleanupUploadedProductImagePaths(supabase: SupabaseClient, storagePaths: string[]) {
  if (storagePaths.length === 0) return

  const { error } = await supabase.storage.from(COSTUMES_BUCKET).remove(storagePaths)
  if (error) {
    console.warn('Failed to delete product images after upload error:', storagePaths, error)
  }
}

async function cleanupDeletedProductImagePaths(supabase: SupabaseClient, storagePaths: string[]) {
  if (storagePaths.length === 0) return

  const { error } = await supabase.storage.from(COSTUMES_BUCKET).remove(storagePaths)
  if (error) {
    console.warn('Failed to delete product images after metadata update:', storagePaths, error)
  }
}

async function uploadProductImages(supabase: SupabaseClient, shopId: string, productId: string, imageRefs: string[]) {
  const uploadedPaths: string[] = []
  const paths: string[] = []

  try {
    for (const [index, imageRef] of imageRefs.entries()) {
      if (!imageRef.startsWith('data:')) {
        paths.push(extractCostumeStoragePath(imageRef) ?? imageRef)
        continue
      }

      const response = await fetch(imageRef)
      const blob = await response.blob()
      const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png'
      const filename = `${productId}-${index}-${Date.now()}.${ext}`
      const storagePath = `${shopId}/${filename}`
      const { error } = await supabase.storage.from(COSTUMES_BUCKET).upload(storagePath, blob, { upsert: false })
      if (error) throw error

      uploadedPaths.push(storagePath)
      paths.push(storagePath)
    }
  } catch (error) {
    await cleanupUploadedProductImagePaths(supabase, uploadedPaths)
    throw error
  }

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
    rental_tiers: draft.rentalTiers,
    late_fee_rule: draft.lateFeeRule,
    deposit_amount: Number(draft.depositAmount) || 0,
    image_urls: paths,
    public_visible: draft.publicVisible,
    is_featured: draft.isFeatured,
    display_order: draft.displayOrder
  }

  const { error: rpcError } = await supabase.rpc('create_product_with_variants', {
    p_shop_id: shopId,
    p_product: payload,
    p_variants: draft.variants
  })
  
  if (rpcError) {
    await cleanupUploadedProductImagePaths(supabase, uploadedPaths)
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

export async function updateRemoteProduct(
  supabase: SupabaseClient,
  shopId: string,
  productId: string,
  draft: Omit<ProductDraft, 'variants' | 'baseSku'>,
  oldImageUrls: string[] = [],
) {
  const { paths, uploadedPaths } = await uploadProductImages(supabase, shopId, productId, draft.imageUrls)
  const previousPaths = oldImageUrls
    .map((imageUrl) => extractCostumeStoragePath(imageUrl))
    .filter((path): path is string => Boolean(path))
  const { error } = await supabase.from('products').update({
    product_name: draft.productName,
    brand: draft.brand,
    category: draft.category,
    primary_color: draft.primaryColor,
    public_description: draft.publicDescription,
    rental_tiers: draft.rentalTiers,
    late_fee_rule: draft.lateFeeRule,
    deposit_amount: Number(draft.depositAmount) || 0,
    image_urls: paths,
    public_visible: draft.publicVisible,
    is_featured: draft.isFeatured,
    display_order: draft.displayOrder,
    updated_at: new Date().toISOString()
  }).eq('id', productId).eq('shop_id', shopId)
  if (error) {
    await cleanupUploadedProductImagePaths(supabase, uploadedPaths)
    throw error
  }

  const nextPathSet = new Set(paths)
  const deletedPaths = previousPaths.filter((path) => !nextPathSet.has(path))
  await cleanupDeletedProductImagePaths(supabase, deletedPaths)
}

export async function deleteRemoteProduct(supabase: SupabaseClient, shopId: string, productId: string, imageUrls: string[] = []) {
  const { error } = await supabase.from('products').delete().eq('id', productId).eq('shop_id', shopId)
  if (error) throw error

  const storagePaths = imageUrls
    .map((imageUrl) => extractCostumeStoragePath(imageUrl))
    .filter((path): path is string => Boolean(path))
  await cleanupDeletedProductImagePaths(supabase, storagePaths)
}

export async function deleteRemoteStockItem(supabase: SupabaseClient, shopId: string, stockItemId: string) {
  const { error } = await supabase.from('stock_items').delete().eq('id', stockItemId).eq('shop_id', shopId)
  if (error) throw error
}

export async function updateRemoteProductPublicVisibility(supabase: SupabaseClient, shopId: string, productId: string, visible: boolean) {
  const { error } = await supabase.from('products').update({ public_visible: visible }).eq('id', productId).eq('shop_id', shopId)
  if (error) throw error
}

export async function updateRemoteProductFeatured(supabase: SupabaseClient, shopId: string, productId: string, isFeatured: boolean) {
  const { error } = await supabase.from('products').update({ is_featured: isFeatured }).eq('id', productId).eq('shop_id', shopId)
  if (error) throw error
}

export async function bulkUpdateRemoteDisplayOrder(
  supabase: SupabaseClient,
  updates: { id: string; displayOrder: number }[]
) {
  const payload = updates.map(u => ({ id: u.id, display_order: u.displayOrder }))
  const { error } = await supabase.rpc('bulk_update_display_order', { p_updates: payload })
  if (error) throw error
}

export async function updateRemoteStockItemStatus(supabase: SupabaseClient, shopId: string, stockItemId: string, status: StockItemStatus) {
  const { error } = await supabase.from('stock_items').update({ status }).eq('id', stockItemId).eq('shop_id', shopId)
  if (error) throw error
}

export async function countRemoteRentalsForProduct(supabase: SupabaseClient, shopId: string, productId: string): Promise<number> {
  const { data: stockItems, error: stockError } = await supabase
    .from('stock_items')
    .select('id')
    .eq('product_id', productId)
    .eq('shop_id', shopId)
  if (stockError) throw stockError
  if (!stockItems || stockItems.length === 0) return 0
  const ids = stockItems.map(s => s.id)
  const { count: rentalCount, error: rError } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .in('stock_item_id', ids)
  if (rError) throw rError
  return rentalCount || 0
}

export async function countRemoteRentalsForStockItem(supabase: SupabaseClient, shopId: string, stockItemId: string): Promise<number> {
  const { count, error } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('stock_item_id', stockItemId)
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
