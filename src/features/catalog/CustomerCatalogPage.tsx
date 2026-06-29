import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Heart, LayoutGrid, LayoutList, Search, SlidersHorizontal, X } from 'lucide-react'
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
type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'newest'
type ViewMode = 'grid' | 'list'

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
  subtitle = 'เลือกดูชุดให้เช่าผ่านเว็บไซต์สำหรับลูกค้า',
  publicUrl,
  onBackToInventory,
}: CustomerCatalogPageProps) {
  const [query, setQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [colorFilter, setColorFilter] = useState('all')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<CatalogAvailabilityFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('recommended')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedItem, setSelectedItem] = useState<CatalogDisplayItem | null>(null)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [imageIndex, setImageIndex] = useState(0)

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

    let result = customerReadyItems.filter((item) => {
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

    if (sortKey === 'price_asc') {
      result = [...result].sort((a, b) => a.rentalPricePerDay - b.rentalPricePerDay)
    } else if (sortKey === 'price_desc') {
      result = [...result].sort((a, b) => b.rentalPricePerDay - a.rentalPricePerDay)
    } else if (sortKey === 'newest') {
      result = [...result].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    }

    return result
  }, [customerReadyItems, query, brandFilter, categoryFilter, colorFilter, sizeFilter, availabilityFilter, sortKey, rentals, today])

  function clearFilters() {
    setQuery('')
    setBrandFilter('all')
    setCategoryFilter('all')
    setColorFilter('all')
    setSizeFilter('all')
    setAvailabilityFilter('all')
  }

  const hasActiveFilter =
    query.trim() ||
    brandFilter !== 'all' ||
    categoryFilter !== 'all' ||
    colorFilter !== 'all' ||
    sizeFilter !== 'all' ||
    availabilityFilter !== 'all'

  function toggleWishlist(name: string) {
    setWishlist((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function openDetail(item: CatalogDisplayItem) {
    setSelectedItem(item)
    setImageIndex(0)
    document.body.style.overflow = 'hidden'
  }

  function closeDetail() {
    setSelectedItem(null)
    document.body.style.overflow = ''
  }

  // Category quick-filter tabs
  const categoryTabs: Array<{ label: string; value: string }> = [
    { label: 'ทั้งหมด', value: 'all' },
    ...categories.map((c) => ({ label: c, value: c })),
  ]

  return (
    <div className="prc-page">
      {/* ── NAVBAR ── */}
      <nav className="prc-nav">
        <div className="prc-nav-inner">
          <div className="prc-nav-left">
            {onBackToInventory && (
              <button className="prc-nav-back" type="button" onClick={onBackToInventory}>
                ← กลับ
              </button>
            )}
          </div>
          <div className="prc-logo" aria-label="Precious Rental">
            <img src="/web-logo.png" alt="Precious Rental" />
          </div>
          <div className="prc-nav-right">
            {publicUrl && (
              <a className="prc-nav-link" href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                เปิด public link
              </a>
            )}
            <button className="prc-nav-icon" type="button" aria-label="รายการโปรด">
              <Heart size={20} />
              {wishlist.size > 0 && <span className="prc-wishlist-badge">{wishlist.size}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <section className="prc-hero">
        <div className="prc-hero-content">
          <p className="prc-hero-eyebrow">ชุดให้เช่า</p>
          <h1 className="prc-hero-title">
            {shopName ? `${shopName} Rental` : 'Precious Rental'}
          </h1>
          <p className="prc-hero-subtitle">{subtitle}</p>

          <label className="prc-search-box" htmlFor="prc-search-input">
            <Search size={18} className="prc-search-icon" />
            <input
              id="prc-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อชุด แบรนด์ สี ไซซ์ หรือรายละเอียด..."
            />
            {query && (
              <button className="prc-search-clear" type="button" onClick={() => setQuery('')}>
                <X size={14} />
              </button>
            )}
          </label>
        </div>
        <div className="prc-hero-image-col" aria-hidden="true">
          <div className="prc-hero-circle" />
        </div>
      </section>

      {/* ── FILTER ROW ── */}
      <section className="prc-filter-section" aria-label="ตัวกรองชุด">
        <div className="prc-filter-inner">
          <div className="prc-filter-grid">
            <label className="prc-filter-field" htmlFor="filter-brand">
              <span>แบรนด์</span>
              <select id="filter-brand" aria-label="Brands" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                <option value="all">ทุกแบรนด์</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
            <label className="prc-filter-field" htmlFor="filter-category">
              <span>หมวดหมู่</span>
              <select id="filter-category" aria-label="หมวดหมู่" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">ทุกหมวดหมู่</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="prc-filter-field" htmlFor="filter-color">
              <span>สี</span>
              <select id="filter-color" aria-label="สี" value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
                <option value="all">ทุกสี</option>
                {colors.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="prc-filter-field" htmlFor="filter-size">
              <span>ไซซ์</span>
              <select id="filter-size" aria-label="ไซซ์" value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}>
                <option value="all">ทุกไซซ์</option>
                {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="prc-filter-field" htmlFor="filter-status">
              <span>สถานะ</span>
              <select id="filter-status" aria-label="สถานะ" value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value as CatalogAvailabilityFilter)}>
                <option value="all">ทุกสถานะ ({availabilityCounts.all})</option>
                <option value="available">พร้อมให้เช่า ({availabilityCounts.available})</option>
                <option value="unavailable">ไม่ว่าง ({availabilityCounts.unavailable})</option>
              </select>
            </label>
          </div>
          {hasActiveFilter && (
            <button className="prc-clear-btn" type="button" onClick={clearFilters}>
              <SlidersHorizontal size={14} />
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </section>

      {/* ── CATEGORY TABS ── */}
      {categoryTabs.length > 1 && (
        <div className="prc-category-tabs">
          <div className="prc-category-tabs-inner">
            {categoryTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`prc-category-tab ${categoryFilter === tab.value ? 'prc-category-tab--active' : ''}`}
                onClick={() => setCategoryFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── RESULTS BAR ── */}
      <div className="prc-results-bar">
        <span className="prc-results-count">
          พบทั้งหมด <strong>{filteredItems.length}</strong> ชุด
        </span>
        <div className="prc-results-controls">
          <label className="prc-sort-label" htmlFor="prc-sort">
            เรียงตาม
          </label>
          <select
            id="prc-sort"
            className="prc-sort-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="recommended">แนะนำ</option>
            <option value="price_asc">ราคา: น้อย → มาก</option>
            <option value="price_desc">ราคา: มาก → น้อย</option>
            <option value="newest">ใหม่ล่าสุด</option>
          </select>
          <div className="prc-view-toggle">
            <button
              type="button"
              className={`prc-view-btn ${viewMode === 'grid' ? 'prc-view-btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="แบบตาราง"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={`prc-view-btn ${viewMode === 'list' ? 'prc-view-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="แบบรายการ"
            >
              <LayoutList size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <section
        className={`prc-grid ${viewMode === 'list' ? 'prc-grid--list' : ''}`}
        aria-label="รายการชุดสำหรับลูกค้า"
      >
        {filteredItems.map((item, index) => {
          const availability = getCatalogAvailability(item, rentals, today)
          const itemKey = `${item.productName}-${item.createdAt}-${index}`
          const inWishlist = wishlist.has(item.productName)

          return (
            <article className="prc-card" key={itemKey}>
              <div className="prc-card-image">
                {item.imageUrls.length > 0 ? (
                  <img src={item.imageUrls[0]} alt={item.productName} loading="lazy" />
                ) : (
                  <div className="prc-card-placeholder">
                    <span>PRECIOUS</span>
                  </div>
                )}
                <span className={`prc-badge prc-badge--${availability}`}>
                  {availability === 'available' ? 'พร้อมให้เช่า' : 'ไม่ว่าง'}
                </span>
                <button
                  className={`prc-wishlist-btn ${inWishlist ? 'prc-wishlist-btn--active' : ''}`}
                  type="button"
                  aria-label="เพิ่มในรายการโปรด"
                  onClick={() => toggleWishlist(item.productName)}
                >
                  <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="prc-card-body">
                <p className="prc-card-brand">{item.brand?.toUpperCase() || 'PRECIOUS'}</p>
                <h2 className="prc-card-name">{item.productName}</h2>
                <div className="prc-card-footer">
                  <div className="prc-card-price-block">
                    <span className="prc-card-price">{formatBaht(item.rentalPricePerDay)}</span>
                    <span className="prc-card-price-unit">/ 4 วัน</span>
                    {item.size && <span className="prc-card-size">ไซซ์ {item.size}</span>}
                  </div>
                  <div className="prc-card-actions">
                    <button
                      className="prc-detail-btn"
                      type="button"
                      onClick={() => openDetail(item)}
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                </div>
              </div>
            </article>
          )
        })}

        {filteredItems.length === 0 && (
          <div className="prc-empty">
            <p className="prc-empty-icon">🌸</p>
            <p className="prc-empty-title">ไม่พบชุดที่ตรงกับเงื่อนไข</p>
            <p className="prc-empty-sub">ลองปรับตัวกรองหรือค้นหาด้วยคำอื่น</p>
            {hasActiveFilter && (
              <button className="prc-clear-btn" type="button" onClick={clearFilters}>
                ล้างตัวกรอง
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── NOTICE: NO ONLINE BOOKING ── */}
      <div className="prc-notice">
        <p>📞 สนใจเช่าชุด กรุณาติดต่อร้านโดยตรง ยังไม่รองรับการจองออนไลน์ในขณะนี้</p>
      </div>

      {/* ── DETAIL MODAL ── */}
      {selectedItem && (
        <div className="prc-modal-overlay" role="dialog" aria-modal="true" onClick={closeDetail}>
          <div className="prc-modal" onClick={(e) => e.stopPropagation()}>
            <button className="prc-modal-close" type="button" onClick={closeDetail} aria-label="ปิด">
              <X size={20} />
            </button>
            <div className="prc-modal-body">
              {/* Image column */}
              <div className="prc-modal-images">
                <div className="prc-modal-main-image">
                  {selectedItem.imageUrls.length > 0 ? (
                    <img src={selectedItem.imageUrls[imageIndex]} alt={selectedItem.productName} />
                  ) : (
                    <div className="prc-modal-placeholder">
                      <span>PRECIOUS</span>
                    </div>
                  )}
                  {selectedItem.imageUrls.length > 1 && (
                    <>
                      <button
                        className="prc-modal-nav prc-modal-nav--prev"
                        type="button"
                        onClick={() => setImageIndex((i) => (i - 1 + selectedItem.imageUrls.length) % selectedItem.imageUrls.length)}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        className="prc-modal-nav prc-modal-nav--next"
                        type="button"
                        onClick={() => setImageIndex((i) => (i + 1) % selectedItem.imageUrls.length)}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
                {selectedItem.imageUrls.length > 1 && (
                  <div className="prc-modal-thumbs">
                    {selectedItem.imageUrls.map((url, i) => (
                      <button
                        key={i}
                        className={`prc-modal-thumb ${i === imageIndex ? 'prc-modal-thumb--active' : ''}`}
                        type="button"
                        onClick={() => setImageIndex(i)}
                      >
                        <img src={url} alt={`รูปที่ ${i + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info column */}
              <div className="prc-modal-info">
                <p className="prc-modal-brand">{selectedItem.brand?.toUpperCase() || 'PRECIOUS'}</p>
                <h2 className="prc-modal-title">{selectedItem.productName}</h2>

                <div className="prc-modal-status-row">
                  <span className={`prc-badge prc-badge--${getCatalogAvailability(selectedItem, rentals, today)}`}>
                    {getCatalogAvailability(selectedItem, rentals, today) === 'available' ? 'พร้อมให้เช่า' : 'ไม่ว่าง'}
                  </span>
                </div>

                <div className="prc-modal-price">
                  <span className="prc-modal-price-value">{formatBaht(selectedItem.rentalPricePerDay)}</span>
                  <span className="prc-modal-price-unit">/ 4 วัน</span>
                </div>

                <div className="prc-modal-specs">
                  {selectedItem.size && (
                    <div className="prc-modal-spec">
                      <span className="prc-modal-spec-label">ไซซ์</span>
                      <span className="prc-modal-spec-value">{selectedItem.size}</span>
                    </div>
                  )}
                  {selectedItem.primaryColor && (
                    <div className="prc-modal-spec">
                      <span className="prc-modal-spec-label">สี</span>
                      <span className="prc-modal-spec-value">{selectedItem.primaryColor}</span>
                    </div>
                  )}
                  {selectedItem.category && (
                    <div className="prc-modal-spec">
                      <span className="prc-modal-spec-label">หมวดหมู่</span>
                      <span className="prc-modal-spec-value">{selectedItem.category}</span>
                    </div>
                  )}
                  {selectedItem.setCount > 1 && (
                    <div className="prc-modal-spec">
                      <span className="prc-modal-spec-label">จำนวนชุด</span>
                      <span className="prc-modal-spec-value">{selectedItem.setCount} ชุด</span>
                    </div>
                  )}
                </div>

                {selectedItem.publicDescription && (
                  <div className="prc-modal-desc">
                    <p className="prc-modal-desc-label">รายละเอียด</p>
                    <p className="prc-modal-desc-text">{selectedItem.publicDescription}</p>
                  </div>
                )}

                <div className="prc-modal-cta">
                  <div className="prc-modal-no-booking">
                    <p>📞 สนใจเช่าชุดนี้ กรุณาติดต่อร้านโดยตรง</p>
                    <p className="prc-modal-no-booking-sub">ยังไม่รองรับการจองผ่านเว็บไซต์ในขณะนี้</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ──

function useCatalogOptions(items: CatalogDisplayItem[], key: keyof CatalogDisplayItem) {
  return useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => item[key])
          .filter((value): value is string => typeof value === 'string' && value.length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b, 'th'))
  }, [items, key])
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
