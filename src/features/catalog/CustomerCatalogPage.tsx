import { useMemo, useState } from 'react'
import { ExternalLink, FileImage, Search, Shirt } from 'lucide-react'
import { getInventoryDisplayStatus } from '../inventory/inventoryStatus'
import type { StockItem } from '../inventory/inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

export type CatalogDisplayItem = StockItem & {
  availabilityStatus?: 'available' | 'booked'
}

type CustomerCatalogPageProps = {
  items: CatalogDisplayItem[]
  rentals: RentalOrder[]
  shopName?: string
  subtitle?: string
  publicUrl?: string
  onBackToInventory?: () => void
}

export function CustomerCatalogPage({
  items,
  rentals,
  shopName,
  subtitle = 'หน้าโชว์ชุดสำหรับลูกค้า ดึงข้อมูลจากคลังชุดเดียวกับ Inventory',
  publicUrl,
  onBackToInventory,
}: CustomerCatalogPageProps) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const today = getTodayString()
  const customerReadyItems = useMemo(() => {
    return items.filter((item) => {
      const primaryStatus = getCatalogStatus(item, rentals, today)
      return primaryStatus !== 'repair' && primaryStatus !== 'wash'
    })
  }, [items, rentals, today])

  const categories = useMemo(() => {
    return Array.from(new Set(customerReadyItems.map((item) => item.category).filter(Boolean))).sort()
  }, [customerReadyItems])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return customerReadyItems.filter((item) => {
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      const searchable = [
        item.productName,
        item.brand,
        item.category,
        item.size,
        item.primaryColor,
        item.publicDescription,
      ]
        .join(' ')
        .toLowerCase()

      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [customerReadyItems, query, categoryFilter])

  return (
    <>
      <header className="page-header catalog-header">
        <div>
          <p className="eyebrow">Customer Catalog</p>
          <h1>{shopName ? `ชุดให้เช่า ${shopName}` : 'ชุดให้เช่า'}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
        {(publicUrl || onBackToInventory) && (
          <div className="page-header-actions">
            {publicUrl && (
              <a className="secondary-button catalog-public-link" href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={20} />
                เปิด public link
              </a>
            )}
            {onBackToInventory && (
              <button className="secondary-button" type="button" onClick={onBackToInventory}>
                <Shirt size={20} />
                กลับไปคลังชุด
              </button>
            )}
          </div>
        )}
      </header>

      <section className="catalog-toolbar" aria-label="ค้นหาและกรองชุด">
        <label className="search-box">
          <Search size={22} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อชุด แบรนด์ สี ไซซ์ หรือรายละเอียด..."
          />
        </label>
        <div className="catalog-category-filter" role="list" aria-label="ประเภทชุด">
          <button
            className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`}
            type="button"
            onClick={() => setCategoryFilter('all')}
          >
            ทั้งหมด ({customerReadyItems.length})
          </button>
          {categories.map((category) => (
            <button
              className={`filter-chip ${categoryFilter === category ? 'active' : ''}`}
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="catalog-grid" aria-label="รายการชุดสำหรับลูกค้า">
        {filteredItems.map((item) => {
          const primaryStatus = getCatalogStatus(item, rentals, today)

          return (
            <article className="catalog-card" key={item.id}>
              <div className="catalog-card-image">
                {item.imageUrls.length > 0 ? (
                  <img src={item.imageUrls[0]} alt={item.productName} />
                ) : (
                  <div className="catalog-card-placeholder">
                    <FileImage size={34} />
                  </div>
                )}
                <span className={`catalog-status catalog-status-${primaryStatus}`}>
                  {primaryStatus === 'available' ? 'พร้อมให้เช่า' : 'มีคิวจอง'}
                </span>
              </div>
              <div className="catalog-card-body">
                <p className="catalog-card-meta">{[item.brand, item.category].filter(Boolean).join(' | ') || 'Precious Rental'}</p>
                <h2>{item.productName}</h2>
                {item.publicDescription && <p className="catalog-card-description">{item.publicDescription}</p>}
                <div className="catalog-card-tags">
                  {item.size && <span>ไซซ์ {item.size}</span>}
                  {item.primaryColor && <span>{item.primaryColor}</span>}
                  {item.setCount > 1 && <span>{item.setCount} ชุด</span>}
                </div>
                <div className="catalog-card-price">
                  <span>ค่าเช่าเริ่มต้น</span>
                  <strong>{formatBaht(item.rentalPricePerDay)}</strong>
                </div>
              </div>
            </article>
          )
        })}

        {filteredItems.length === 0 && (
          <div className="empty-state catalog-empty">ยังไม่มีชุดที่พร้อมโชว์ลูกค้าตามเงื่อนไขนี้</div>
        )}
      </section>
    </>
  )
}

function getCatalogStatus(item: CatalogDisplayItem, rentals: RentalOrder[], today: string) {
  if (item.availabilityStatus) return item.availabilityStatus
  return getInventoryDisplayStatus(item, rentals, today).primaryStatus
}

function getTodayString() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatBaht(value: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value)
}
