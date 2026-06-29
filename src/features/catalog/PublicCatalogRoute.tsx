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

  // Apply light-theme class to root so the public catalog doesn't inherit dark admin styles
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'public')
    document.body.style.background = '#faf6f0'
    return () => {
      document.documentElement.removeAttribute('data-theme')
      document.body.style.background = ''
    }
  }, [])

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

  if (status === 'loading') {
    return (
      <div className="prc-loading-screen">
        <div className="prc-loading-logo">
          <span className="prc-logo-text">PRECIOUS</span>
          <span className="prc-logo-sub">RENTAL</span>
        </div>
        <div className="prc-spinner" />
        <p className="prc-loading-text">กำลังโหลดชุดให้เช่า...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="prc-loading-screen">
        <div className="prc-loading-logo">
          <span className="prc-logo-text">PRECIOUS</span>
          <span className="prc-logo-sub">RENTAL</span>
        </div>
        <p className="prc-loading-title">เปิด catalog ไม่ได้</p>
        <p className="prc-loading-text">{error}</p>
      </div>
    )
  }

  return (
    <CustomerCatalogPage
      items={items}
      rentals={[]}
      shopName={shopName}
      subtitle="เลือกดูชุดให้เช่าผ่านเว็บไซต์สำหรับลูกค้า"
    />
  )
}
