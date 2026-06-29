import type { SupabaseClient } from '@supabase/supabase-js'
import type { StockItem, StockItemStatus } from './inventoryTypes'

type StockItemRow = {
  id: string
  shop_id: string
  sku: string
  serial_number: string
  product_name: string
  brand: string
  category: string
  size: string
  primary_color: string
  public_description: string
  set_count: number
  rental_price_per_day: number
  late_fee_rule: string
  deposit_amount: number
  image_urls: string[]
  status?: string
  public_visible?: boolean
  created_at: string
  updated_at: string
}

type UploadedStockImages = {
  paths: string[]
  uploadedPaths: string[]
}

// Function to extract storage paths from signed URLs or public URLs
export function getPathFromUrl(url: string, bucketName = 'stock-images'): string | null {
  if (url.startsWith('data:')) return null // Data URL, needs upload
  
  const searchPattern = `/object/sign/${bucketName}/`
  const index = url.indexOf(searchPattern)
  if (index !== -1) {
    const pathWithQuery = url.substring(index + searchPattern.length)
    const questionMarkIndex = pathWithQuery.indexOf('?')
    return questionMarkIndex !== -1 ? pathWithQuery.substring(0, questionMarkIndex) : pathWithQuery
  }
  
  const publicPattern = `/storage/v1/object/public/${bucketName}/`
  const publicIndex = url.indexOf(publicPattern)
  if (publicIndex !== -1) {
    return url.substring(publicIndex + publicPattern.length)
  }
  
  return null
}

// Utility to convert base64 Data URL to File object for upload
export function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

export async function loadStockItems(supabase: SupabaseClient, shopId: string): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from('stock_items')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as StockItemRow[]
  return Promise.all(rows.map((row) => mapStockItemRow(supabase, row)))
}

async function mapStockItemRow(supabase: SupabaseClient, row: StockItemRow): Promise<StockItem> {
  const imageUrls = await Promise.all(
    (row.image_urls ?? []).map(async (path) => {
      try {
        const { data } = await supabase.storage
          .from('stock-images')
          .createSignedUrl(path, 60 * 15) // 15 mins expiry
        return data?.signedUrl ?? ''
      } catch (e) {
        console.error('Error generating signed URL for:', path, e)
        return ''
      }
    })
  )

  return {
    id: row.id,
    sku: row.sku,
    serialNumber: row.serial_number ?? '',
    productName: row.product_name,
    brand: row.brand ?? '',
    category: row.category ?? '',
    size: row.size ?? 'M',
    primaryColor: row.primary_color ?? '',
    publicDescription: row.public_description ?? '',
    setCount: row.set_count ?? 1,
    rentalPricePerDay: Number(row.rental_price_per_day) || 0,
    lateFeeRule: row.late_fee_rule ?? '',
    depositAmount: Number(row.deposit_amount) || 0,
    imageUrls: imageUrls.filter(Boolean),
    status: (row.status as 'available' | 'repair' | 'wash') || 'available',
    publicVisible: Boolean(row.public_visible),
    createdAt: row.created_at,
  }
}

// Upload stock images helper
async function uploadStockImages(
  supabase: SupabaseClient,
  shopId: string,
  stockId: string,
  imageUrls: string[]
): Promise<UploadedStockImages> {
  const paths: string[] = []
  const uploadedPaths: string[] = []

  for (const [index, url] of imageUrls.entries()) {
    const existingPath = getPathFromUrl(url)
    if (existingPath) {
      // Already uploaded image path
      paths.push(existingPath)
      continue
    }

    if (url.startsWith('data:image/')) {
      // Local Base64 Data URL, convert to File and upload
      try {
        const mimeType = url.substring(url.indexOf(':') + 1, url.indexOf(';'))
        const ext = mimeType.split('/')[1] || 'jpg'
        const file = dataURLtoFile(url, `stock-${stockId}-${index}.${ext}`)
        const storagePath = `${shopId}/${stockId}/${crypto.randomUUID()}-${file.name}`
        
        const { error: uploadError } = await supabase.storage
          .from('stock-images')
          .upload(storagePath, file, { upsert: false })

        if (uploadError) throw uploadError
        paths.push(storagePath)
        uploadedPaths.push(storagePath)
      } catch (err) {
        console.error('Failed to upload image at index:', index, err)
        throw err
      }
    }
  }

  return { paths, uploadedPaths }
}

async function removeStockImagePaths(
  supabase: SupabaseClient,
  paths: string[],
): Promise<Error | null> {
  if (paths.length === 0) return null

  const { error } = await supabase.storage.from('stock-images').remove(paths)
  return error
}

// Cleanup deleted stock images from storage
async function cleanupUnusedImages(
  supabase: SupabaseClient,
  oldPaths: string[],
  newPaths: string[]
) {
  const pathsToDelete = oldPaths.filter((path) => !newPaths.includes(path))
  if (pathsToDelete.length > 0) {
    try {
      const error = await removeStockImagePaths(supabase, pathsToDelete)
      if (error) {
        console.warn('Failed to delete unused images:', pathsToDelete, error)
      }
    } catch (e) {
      console.warn('Failed to delete unused images:', pathsToDelete, e)
    }
  }
}

export async function createRemoteStockItem(
  supabase: SupabaseClient,
  shopId: string,
  item: Omit<StockItem, 'id' | 'createdAt'> & { id?: string }
): Promise<StockItem> {
  const stockId = item.id || crypto.randomUUID()
  
  // First, upload new images
  const { paths: imagePaths, uploadedPaths } = await uploadStockImages(supabase, shopId, stockId, item.imageUrls)

  const payload = {
    id: stockId,
    shop_id: shopId,
    sku: item.sku,
    serial_number: item.serialNumber,
    product_name: item.productName,
    brand: item.brand,
    category: item.category,
    size: item.size,
    primary_color: item.primaryColor,
    public_description: item.publicDescription,
    set_count: item.setCount,
    rental_price_per_day: item.rentalPricePerDay,
    late_fee_rule: item.lateFeeRule,
    deposit_amount: item.depositAmount,
    image_urls: imagePaths,
    status: item.status || 'available',
    public_visible: item.publicVisible,
  }

  const { data, error } = await supabase
    .from('stock_items')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    // Attempt cleanup of newly uploaded images if insert fails
    if (uploadedPaths.length > 0) {
      const storageError = await removeStockImagePaths(supabase, uploadedPaths)
      if (storageError) {
        console.warn('Failed to delete stock images after insert error:', uploadedPaths, storageError)
      }
    }
    throw error
  }

  return mapStockItemRow(supabase, data as StockItemRow)
}

export async function createRemoteStockItems(
  supabase: SupabaseClient,
  shopId: string,
  items: Array<Omit<StockItem, 'id' | 'createdAt'> & { id?: string }>
): Promise<StockItem[]> {
  const createdItems: StockItem[] = []

  try {
    for (const item of items) {
      const createdItem = await createRemoteStockItem(supabase, shopId, item)
      createdItems.push(createdItem)
    }
    return createdItems
  } catch (error) {
    for (const createdItem of createdItems) {
      try {
        await deleteRemoteStockItem(supabase, shopId, createdItem.id, createdItem.imageUrls)
      } catch (rollbackError) {
        console.warn('Failed to rollback stock item after batch create error:', createdItem.id, rollbackError)
      }
    }
    throw error
  }
}

export async function updateRemoteStockItem(
  supabase: SupabaseClient,
  shopId: string,
  stockId: string,
  item: Omit<StockItem, 'id' | 'createdAt'>,
  oldImageUrls: string[]
): Promise<StockItem> {
  // Get old paths for cleanup
  const oldPaths = oldImageUrls.map((url) => getPathFromUrl(url)).filter(Boolean) as string[]
  
  // Upload any new images and retain existing ones
  const { paths: newPaths, uploadedPaths } = await uploadStockImages(supabase, shopId, stockId, item.imageUrls)

  const payload = {
    sku: item.sku,
    serial_number: item.serialNumber,
    product_name: item.productName,
    brand: item.brand,
    category: item.category,
    size: item.size,
    primary_color: item.primaryColor,
    public_description: item.publicDescription,
    set_count: item.setCount,
    rental_price_per_day: item.rentalPricePerDay,
    late_fee_rule: item.lateFeeRule,
    deposit_amount: item.depositAmount,
    image_urls: newPaths,
    status: item.status || 'available',
    public_visible: item.publicVisible,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('stock_items')
    .update(payload)
    .eq('id', stockId)
    .eq('shop_id', shopId)
    .select('*')
    .single()

  if (error) {
    if (uploadedPaths.length > 0) {
      const storageError = await removeStockImagePaths(supabase, uploadedPaths)
      if (storageError) {
        console.warn('Failed to delete stock images after update error:', uploadedPaths, storageError)
      }
    }
    throw error
  }

  // Cleanup unused images from storage since database update succeeded
  await cleanupUnusedImages(supabase, oldPaths, newPaths)

  return mapStockItemRow(supabase, data as StockItemRow)
}

export async function deleteRemoteStockItem(
  supabase: SupabaseClient,
  shopId: string,
  stockId: string,
  imageUrls: string[]
): Promise<void> {
  const imagePaths = imageUrls
    .map((url) => getPathFromUrl(url))
    .filter(Boolean) as string[]

  const { error } = await supabase
    .from('stock_items')
    .delete()
    .eq('id', stockId)
    .eq('shop_id', shopId)

  if (error) throw error

  if (imagePaths.length > 0) {
    try {
      const error = await removeStockImagePaths(supabase, imagePaths)
      if (error) {
        console.warn('Failed to delete stock images:', imagePaths, error)
      }
    } catch (storageError) {
      console.warn('Failed to delete stock images:', imagePaths, storageError)
    }
  }
}

export async function updateRemoteStockItemStatus(
  supabase: SupabaseClient,
  shopId: string,
  stockId: string,
  status: StockItemStatus,
): Promise<void> {
  const { error } = await supabase
    .from('stock_items')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stockId)
    .eq('shop_id', shopId)

  if (error) throw error
}

export async function countRemoteRentalsForStockSku(
  supabase: SupabaseClient,
  shopId: string,
  stockSku: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('rentals')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('stock_item_sku', stockSku)

  if (error) throw error
  return count ?? 0
}

export async function updateShopSettings(
  supabase: SupabaseClient,
  shopId: string,
  settings: { brands: string[]; categories: string[]; colors: string[]; publicCatalogEnabled: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('shops')
    .update({
      brands: settings.brands,
      categories: settings.categories,
      colors: settings.colors,
      public_catalog_enabled: settings.publicCatalogEnabled,
      updated_at: new Date().toISOString()
    })
    .eq('id', shopId)

  if (error) throw error
}

export async function loadShopSettings(
  supabase: SupabaseClient,
  shopId: string
): Promise<{ brands: string[]; categories: string[]; colors: string[]; publicCatalogEnabled: boolean } | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('brands, categories, colors, public_catalog_enabled')
    .eq('id', shopId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    brands: data.brands,
    categories: data.categories,
    colors: data.colors,
    publicCatalogEnabled: Boolean(data.public_catalog_enabled),
  }
}
