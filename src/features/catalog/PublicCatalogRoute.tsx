import { useEffect, useState } from 'react'
import { CustomerCatalogPage, type CatalogDisplayItem } from './CustomerCatalogPage'
import { loadPublicCatalog } from './publicCatalogRemote'

type PublicCatalogRouteProps = {
  catalogKey: string
}

export function PublicCatalogRoute({ catalogKey }: PublicCatalogRouteProps) {
  const [items, setItems] = useState<CatalogDisplayItem[]>([])
  const [shopName, setShopName] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    setStatus('loading')
    setError('')

    loadPublicCatalog(catalogKey)
      .then((catalog) => {
        if (cancelled) return
        setItems(catalog.items)
        setShopName(catalog.shop.name)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'โหลดหน้า catalog ไม่สำเร็จ')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [catalogKey])

  return (
    <main className="public-catalog-shell">
      {status === 'loading' && (
        <section className="modal-panel auth-panel">
          <p className="eyebrow">Customer Catalog</p>
          <h1>กำลังโหลดชุดให้เช่า</h1>
          <p className="subtitle">กำลังเตรียมรายการชุดล่าสุดของร้าน</p>
        </section>
      )}

      {status === 'error' && (
        <section className="modal-panel auth-panel">
          <p className="eyebrow">Customer Catalog</p>
          <h1>เปิด catalog ไม่ได้</h1>
          <p className="subtitle">{error}</p>
        </section>
      )}

      {status === 'ready' && (
        <CustomerCatalogPage
          items={items}
          rentals={[]}
          shopName={shopName}
          subtitle="เลือกดูชุดให้เช่าที่ร้านเปิดเผยไว้สำหรับลูกค้า"
        />
      )}
    </main>
  )
}
