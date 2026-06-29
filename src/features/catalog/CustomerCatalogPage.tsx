import { useMemo, useState } from 'react'
import { ExternalLink, FileImage, Search, Shirt } from 'lucide-react'
import { getInventoryDisplayStatus } from '../inventory/inventoryStatus'
import type { StockItem } from '../inventory/inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

export type CatalogDisplayItem = Pick<
  StockItem,
  | 'productName'
  | 'brand'
  | 'category'
  | 'size'
  | 'primaryColor'
  | 'publicDescription'
  | 'setCount'
  | 'rentalPricePerDay'
  | 'imageUrls'
  | 'status'
  | 'publicVisible'
  | 'createdAt'
> & {
  availabilityStatus?: 'available' | 'booked'
}

type CatalogAvailabilityFilter = 'all' | 'available' | 'unavailable'
type CatalogAvailabilityStatus = 'available' | 'unavailable'

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
  const [brandFilter, setBrandFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [colorFilter, setColorFilter] = useState('all')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<CatalogAvailabilityFilter>('all')

  const today = getTodayString()
  const customerReadyItems = useMemo(() => {
    return items.filter((item) => {
      const primaryStatus = getCatalogStatus(item, rentals, today)
      return item.publicVisible && primaryStatus !== 'repair' && primaryStatus !== 'wash'
    })
  }, [items, rentals, today])

  const brands = useCatalogOptions(customerReadyItems, 'brand')
  const categories = useCatalogOptions(customerReadyItems, 'category')
  const colors = useCatalogOptions(customerReadyItems, 'primaryColor')
  const sizes = useCatalogOptions(customerReadyItems, 'size')

  const availabilityCounts = useMemo(() => {
    return customerReadyItems.reduce(
      (counts, item) => {
        const availability = getCatalogAvailability(item, rentals, today)
        counts.all += 1
        counts[availability] += 1
        return counts
      },
      { all: 0, available: 0, unavailable: 0 },
    )
  }, [customerReadyItems, rentals, today])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return customerReadyItems.filter((item) => {
      const availability = getCatalogAvailability(item, rentals, today)
      const matchesBrand = brandFilter === 'all' || item.brand === brandFilter
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      const matchesColor = colorFilter === 'all' || item.primaryColor === colorFilter
      const matchesSize = sizeFilter === 'all' || item.size === sizeFilter
      const matchesAvailability = availabilityFilter === 'all' || availability === availabilityFilter
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

      return (
        matchesBrand &&
        matchesCategory &&
        matchesColor &&
        matchesSize &&
        matchesAvailability &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      )
    })
  }, [customerReadyItems, query, brandFilter, categoryFilter, colorFilter, sizeFilter, availabilityFilter, rentals, today])

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
        <div className="catalog-filter-grid">
          <CatalogSelectFilter
            label="Brands"
            value={brandFilter}
            allLabel="ทุกแบรนด์"
            options={brands}
            onChange={setBrandFilter}
          />
          <CatalogSelectFilter
            label="หมวดหมู่"
            value={categoryFilter}
            allLabel="ทุกหมวดหมู่"
            options={categories}
            onChange={setCategoryFilter}
          />
          <CatalogSelectFilter
            label="สี"
            value={colorFilter}
            allLabel="ทุกสี"
            options={colors}
            onChange={setColorFilter}
          />
          <CatalogSelectFilter
            label="ไซซ์"
            value={sizeFilter}
            allLabel="ทุกไซซ์"
            options={sizes}
            onChange={setSizeFilter}
          />
          <label className="catalog-filter-field">
            <span>สถานะ</span>
            <select
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value as CatalogAvailabilityFilter)}
            >
              <option value="all">ทุกสถานะ ({availabilityCounts.all})</option>
              <option value="available">พร้อมให้เช่า ({availabilityCounts.available})</option>
              <option value="unavailable">ไม่ว่าง ({availabilityCounts.unavailable})</option>
            </select>
          </label>
        </div>
      </section>

      <section className="catalog-grid" aria-label="รายการชุดสำหรับลูกค้า">
        {filteredItems.map((item, index) => {
          const availability = getCatalogAvailability(item, rentals, today)

          return (
            <article className="catalog-card" key={`${item.productName}-${item.createdAt}-${index}`}>
              <div className="catalog-card-image">
                {item.imageUrls.length > 0 ? (
                  <img src={item.imageUrls[0]} alt={item.productName} />
                ) : (
                  <div className="catalog-card-placeholder">
                    <FileImage size={34} />
                  </div>
                )}
                <span className={`catalog-status catalog-status-${availability}`}>
                  {availability === 'available' ? 'พร้อมให้เช่า' : 'ไม่ว่าง'}
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

function useCatalogOptions(items: CatalogDisplayItem[], key: keyof CatalogDisplayItem) {
  return useMemo(() => {
    return Array.from(new Set(items.map((item) => item[key]).filter((value): value is string => typeof value === 'string' && value.length > 0))).sort((a, b) => a.localeCompare(b, 'th'))
  }, [items, key])
}

type CatalogSelectFilterProps = {
  label: string
  value: string
  allLabel: string
  options: string[]
  onChange: (value: string) => void
}

function CatalogSelectFilter({ label, value, allLabel, options, onChange }: CatalogSelectFilterProps) {
  return (
    <label className="catalog-filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function getCatalogAvailability(item: CatalogDisplayItem, rentals: RentalOrder[], today: string): CatalogAvailabilityStatus {
  return getCatalogStatus(item, rentals, today) === 'available' ? 'available' : 'unavailable'
}

function getCatalogStatus(item: CatalogDisplayItem, rentals: RentalOrder[], today: string) {
  if (item.availabilityStatus) return item.availabilityStatus
  return getInventoryDisplayStatus(item as StockItem, rentals, today).primaryStatus
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
