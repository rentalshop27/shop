import type { SupabaseClient } from '@supabase/supabase-js'
import type { StockItem } from '../../App'

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
  created_at: string
  updated_at: string
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

export async function loadStockItems(supabase: SupabaseClient): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from('stock_items')
    .select('*')
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
    createdAt: row.created_at,
  }
}

// Upload stock images helper
async function uploadStockImages(
  supabase: SupabaseClient,
  shopId: string,
  stockId: string,
  imageUrls: string[]
): Promise<string[]> {
  const uploadedPaths: string[] = []

  for (const [index, url] of imageUrls.entries()) {
    const existingPath = getPathFromUrl(url)
    if (existingPath) {
      // Already uploaded image path
      uploadedPaths.push(existingPath)
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
        uploadedPaths.push(storagePath)
      } catch (err) {
        console.error('Failed to upload image at index:', index, err)
        throw err;
      }
    }
  }

  return uploadedPaths
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
      await supabase.storage.from('stock-images').remove(pathsToDelete)
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
  const imagePaths = await uploadStockImages(supabase, shopId, stockId, item.imageUrls)

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
  }

  const { data, error } = await supabase
    .from('stock_items')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    // Attempt cleanup of newly uploaded images if insert fails
    if (imagePaths.length > 0) {
      await supabase.storage.from('stock-images').remove(imagePaths)
    }
    throw error
  }

  return mapStockItemRow(supabase, data as StockItemRow)
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
  const newPaths = await uploadStockImages(supabase, shopId, stockId, item.imageUrls)

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
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('stock_items')
    .update(payload)
    .eq('id', stockId)
    .select('*')
    .single()

  if (error) throw error

  // Cleanup unused images from storage since database update succeeded
  await cleanupUnusedImages(supabase, oldPaths, newPaths)

  return mapStockItemRow(supabase, data as StockItemRow)
}

export async function updateShopSettings(
  supabase: SupabaseClient,
  shopId: string,
  settings: { brands: string[]; categories: string[]; colors: string[] }
): Promise<void> {
  const { error } = await supabase
    .from('shops')
    .update({
      brands: settings.brands,
      categories: settings.categories,
      colors: settings.colors,
      updated_at: new Date().toISOString()
    })
    .eq('id', shopId)

  if (error) throw error
}

export async function loadShopSettings(
  supabase: SupabaseClient,
  shopId: string
): Promise<{ brands: string[]; categories: string[]; colors: string[] } | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('brands, categories, colors')
    .eq('id', shopId)
    .maybeSingle()

  if (error) throw error
  return data
}
