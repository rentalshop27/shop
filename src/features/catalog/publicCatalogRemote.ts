import { supabaseAnonKey, supabaseUrl } from '../../lib/supabase'
import type { CatalogDisplayItem } from './CustomerCatalogPage'

export type PublicCatalogResponse = {
  shop: {
    id: string
    name: string
    publicCatalogSlug?: string | null
    catalogHeroImageUrl?: string | null
    catalogMobileHeroImageUrl?: string | null
  }
  items: CatalogDisplayItem[]
}

export async function loadPublicCatalog(catalogKey: string): Promise<PublicCatalogResponse> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('ยังไม่ได้ตั้งค่า Supabase สำหรับ public catalog')
  }

  const functionsBaseUrl = supabaseUrl.replace(/\/+$/, '')
  const url = new URL(`${functionsBaseUrl}/functions/v1/public-catalog`)
  url.searchParams.set('catalogKey', catalogKey)

  const response = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
    },
  })

  const body = await response.json().catch(() => null) as { error?: string } | PublicCatalogResponse | null
  if (!response.ok) {
    throw new Error(body && 'error' in body && body.error ? body.error : 'โหลดหน้า catalog ไม่สำเร็จ')
  }

  return body as PublicCatalogResponse
}
