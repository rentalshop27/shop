import { type CSSProperties, type ChangeEvent, useMemo, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Heart, ImagePlus, Search, SlidersHorizontal, Trash2, X, Pin, GripVertical, Save, Pencil } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getInventoryDisplayStatus } from '../inventory/inventoryStatus'
import type { StockItem } from '../inventory/inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

export type CatalogDisplayItem = {
  id?: string
  baseSku?: string
  productName: string
  brand: string
  category: string
  primaryColor: string
  publicDescription: string
  rentalTiers: { days: number; price: number }[]
  imageUrls: string[]
  publicVisible?: boolean
  isFeatured?: boolean
  displayOrder?: number
  createdAt?: string
  sizeSummary?: { size: string; total: number; available: number }[]
  
  // Legacy fields (from StockItem structure)
  size?: string
  status?: string
  setCount?: number
  availabilityStatus?: 'available' | 'booked'
}

type CatalogAvailabilityFilter = 'all' | 'available' | 'unavailable'
type CatalogAvailabilityStatus = 'available' | 'unavailable'
type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'newest'

type CustomerCatalogPageProps = {
  items: CatalogDisplayItem[]
  rentals: RentalOrder[]
  shopName?: string
  subtitle?: string
  publicUrl?: string
  heroBackgroundUrl?: string | null
  mobileHeroBackgroundUrl?: string | null
  onUploadHeroBackground?: (file: File) => void | Promise<void>
  onUploadMobileHeroBackground?: (file: File) => void | Promise<void>
  onRemoveHeroBackground?: () => void | Promise<void>
  onRemoveMobileHeroBackground?: () => void | Promise<void>
  isUploadingHeroBackground?: boolean
  isUploadingMobileHeroBackground?: boolean
  onBackToInventory?: () => void
  isAdminMode?: boolean
  onToggleFeatured?: (id: string, isFeatured: boolean) => void
  onSaveOrder?: (orderedIds: string[]) => void | Promise<void>
}

export function CustomerCatalogPage({
  items,
  rentals, // For legacy items that don't have availabilityStatus pre-computed
  shopName,
  subtitle = 'เลือกดูชุดให้เช่าผ่านเว็บไซต์สำหรับลูกค้า',
  publicUrl,
  heroBackgroundUrl,
  mobileHeroBackgroundUrl,
  onUploadHeroBackground,
  onUploadMobileHeroBackground,
  onRemoveHeroBackground,
  onRemoveMobileHeroBackground,
  isUploadingHeroBackground = false,
  isUploadingMobileHeroBackground = false,
  onBackToInventory,
  isAdminMode = false,
  onToggleFeatured,
  onSaveOrder,
}: CustomerCatalogPageProps) {
  const [query, setQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [colorFilter, setColorFilter] = useState('all')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<CatalogAvailabilityFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('recommended')
  const [selectedItem, setSelectedItem] = useState<CatalogDisplayItem | null>(null)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [imageIndex, setImageIndex] = useState(0)

  // Edit Mode State
  const [isEditModeActive, setIsEditModeActive] = useState(false)
  const [orderedItemIds, setOrderedItemIds] = useState<string[]>([])
  const [hasOrderChanged, setHasOrderChanged] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)

  // Sync orderedItemIds when items change (e.g. initial load, after save)
  useEffect(() => {
    // Sort items by is_featured DESC, display_order ASC for edit mode ordering
    const sorted = [...items]
      .filter(i => i.id)
      .sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1
        if ((a.displayOrder ?? 0) !== (b.displayOrder ?? 0)) return (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      })
    setOrderedItemIds(sorted.map(item => item.id!))
    setHasOrderChanged(false)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setOrderedItemIds((items) => {
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)
      return arrayMove(items, oldIndex, newIndex)
    })
    setHasOrderChanged(true)
  }

  async function handleSaveOrder() {
    if (!onSaveOrder || isSavingOrder) return

    setIsSavingOrder(true)
    try {
      await onSaveOrder(orderedItemIds)
      setHasOrderChanged(false)
    } catch {
      // Keep the order marked dirty when persistence fails.
    } finally {
      setIsSavingOrder(false)
    }
  }

  const today = getTodayString()
  const heroTitle = getCatalogHeroTitle(shopName)

  // Filter out non-visible or broken legacy items
  const customerReadyItems = useMemo(() => {
    return items.filter((item) => {
      if (item.publicVisible === false) return false
      // For legacy flat items, check if status is available or rented/booked
      if (item.status && (item.status === 'repair' || item.status === 'wash')) return false
      return true
    })
  }, [items])

  const brands = useCatalogOptions(customerReadyItems, 'brand')
  const categories = useCatalogOptions(customerReadyItems, 'category')
  const colors = useCatalogOptions(customerReadyItems, 'primaryColor')
  
  // Custom hook for sizes since sizes can be in .size or .sizeSummary
  const sizes = useMemo(() => {
    const sizeSet = new Set<string>()
    customerReadyItems.forEach((item) => {
      if (item.size) sizeSet.add(item.size)
      if (item.sizeSummary) {
        item.sizeSummary.forEach(s => sizeSet.add(s.size))
      }
    })
    return Array.from(sizeSet).sort((a, b) => a.localeCompare(b, 'th'))
  }, [customerReadyItems])

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
      
      let itemSizes: string[] = []
      if (item.sizeSummary) itemSizes = item.sizeSummary.map(s => s.size)
      else if (item.size) itemSizes = [item.size]
      
      const matchesSize = sizeFilter === 'all' || itemSizes.includes(sizeFilter)
      const matchesAvailability = availabilityFilter === 'all' || availability === availabilityFilter
      
      const searchable = [
        item.productName,
        item.brand,
        item.category,
        ...itemSizes,
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
      result = [...result].sort((a, b) => {
        const minA = a.rentalTiers?.length > 0 ? Math.min(...a.rentalTiers.map(t => t.price)) : 0
        const minB = b.rentalTiers?.length > 0 ? Math.min(...b.rentalTiers.map(t => t.price)) : 0
        return minA - minB
      })
    } else if (sortKey === 'price_desc') {
      result = [...result].sort((a, b) => {
        const minA = a.rentalTiers?.length > 0 ? Math.min(...a.rentalTiers.map(t => t.price)) : 0
        const minB = b.rentalTiers?.length > 0 ? Math.min(...b.rentalTiers.map(t => t.price)) : 0
        return minB - minA
      })
    } else if (sortKey === 'newest') {
      result = [...result].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    } else {
      // recommended
      result = [...result].sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1
        if ((a.displayOrder ?? 0) !== (b.displayOrder ?? 0)) return (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      })
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
  }

  function closeDetail() {
    setSelectedItem(null)
  }

  useEffect(() => {
    document.body.style.overflow = selectedItem ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedItem])

  const categoryTabs: Array<{ label: string; value: string }> = [
    { label: 'ทั้งหมด', value: 'all' },
    ...categories.map((c) => ({ label: c, value: c })),
  ]

  const canEditHeroBackground = Boolean(
    onUploadHeroBackground ||
    onUploadMobileHeroBackground ||
    onRemoveHeroBackground ||
    onRemoveMobileHeroBackground,
  )
  const hasHeroBackground = Boolean(heroBackgroundUrl || mobileHeroBackgroundUrl)
  const effectiveHeroBackgroundUrl = heroBackgroundUrl ?? mobileHeroBackgroundUrl
  const effectiveMobileHeroBackgroundUrl = mobileHeroBackgroundUrl ?? heroBackgroundUrl
  const heroBackgroundStyle = effectiveHeroBackgroundUrl
    ? {
        '--prc-hero-bg-image': `url('${effectiveHeroBackgroundUrl}')`,
        '--prc-hero-mobile-bg-image': `url('${effectiveMobileHeroBackgroundUrl}')`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      } as CSSProperties
    : undefined

  async function handleHeroBackgroundChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onUploadHeroBackground) return
    await onUploadHeroBackground(file)
  }

  async function handleMobileHeroBackgroundChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onUploadMobileHeroBackground) return
    await onUploadMobileHeroBackground(file)
  }

  return (
    <div className="prc-page">
      <nav className="prc-nav">
        <div className="prc-nav-inner">
          <div className="prc-nav-left">
            {onBackToInventory && (
              <button className="prc-nav-back" type="button" onClick={onBackToInventory}>
                ← กลับ
              </button>
            )}
          </div>
          <div className="prc-logo">
            <span className="prc-logo-text">PRECIOUS</span>
            <span className="prc-logo-sub">RENTAL</span>
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

      {canEditHeroBackground && (
        <section className="prc-hero-editor" aria-label="ตั้งค่ารูปพื้นหลังหน้าลูกค้า">
          <div className="prc-hero-editor-copy">
            <p className="prc-hero-editor-title">รูปพื้นหลังส่วนชื่อร้าน</p>
            <p className="prc-hero-editor-note">ใช้จริงขั้นต่ำ: 1600 x 600 px</p>
            <p className="prc-hero-editor-note">ถ้าอยากเผื่อจอใหญ่/Retina: 1920 x 720 px</p>
            <p className="prc-hero-editor-note">Safe area สำหรับข้อความชื่อร้าน: วางเนื้อหาสำคัญไว้ฝั่งซ้าย และเผื่อขอบซ้าย-ขวาอย่างน้อย 60px บน desktop</p>
            <p className="prc-hero-editor-note">รูปมือถือแยก: 1080 x 720 px ใช้แสดงบนหน้าจอมือถือ</p>
          </div>
          <div className="prc-hero-editor-actions">
            {onUploadHeroBackground && (
              <label className="prc-hero-editor-upload">
                <ImagePlus size={16} />
                {isUploadingHeroBackground ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป Desktop BG'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleHeroBackgroundChange}
                  disabled={isUploadingHeroBackground}
                />
              </label>
            )}
            {onUploadMobileHeroBackground && (
              <label className="prc-hero-editor-upload">
                <ImagePlus size={16} />
                {isUploadingMobileHeroBackground ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป Mobile BG'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleMobileHeroBackgroundChange}
                  disabled={isUploadingMobileHeroBackground}
                />
              </label>
            )}
            {heroBackgroundUrl && onRemoveHeroBackground && (
              <button
                className="prc-hero-editor-remove"
                type="button"
                onClick={() => void onRemoveHeroBackground()}
                disabled={isUploadingHeroBackground}
              >
                <Trash2 size={16} />
                ลบรูป Desktop
              </button>
            )}
            {mobileHeroBackgroundUrl && onRemoveMobileHeroBackground && (
              <button
                className="prc-hero-editor-remove"
                type="button"
                onClick={() => void onRemoveMobileHeroBackground()}
                disabled={isUploadingMobileHeroBackground}
              >
                <Trash2 size={16} />
                ลบรูป Mobile
              </button>
            )}
          </div>
        </section>
      )}

      <section className={`prc-hero${hasHeroBackground ? ' prc-hero--custom-bg' : ''}`} style={heroBackgroundStyle}>
        <div className="prc-hero-content">
          <p className="prc-hero-eyebrow">ชุดให้เช่า</p>
          <h1 className="prc-hero-title">{heroTitle}</h1>
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
        </div>
      </div>

      {isAdminMode && (
        <div className="prc-admin-toolbar">
          <button
            className={`prc-edit-mode-btn ${isEditModeActive ? 'active' : ''}`}
            onClick={() => setIsEditModeActive(!isEditModeActive)}
            disabled={isSavingOrder}
          >
            <Pencil size={16} />
            {isEditModeActive ? 'ปิดโหมดจัดเรียง' : 'โหมดจัดเรียง (Edit Mode)'}
          </button>
          {isEditModeActive && hasOrderChanged && (
            <button className="prc-save-order-btn" onClick={handleSaveOrder} disabled={isSavingOrder}>
              <Save size={16} />
              {isSavingOrder ? 'กำลังบันทึก...' : 'บันทึกลำดับใหม่'}
            </button>
          )}
        </div>
      )}

      <section
        className="prc-grid"
        aria-label="รายการชุดสำหรับลูกค้า"
      >

        {isEditModeActive ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedItemIds} strategy={rectSortingStrategy}>
              {orderedItemIds.map((id) => {
                const item = filteredItems.find(i => i.id === id)
                if (!item) return null

                let sizeDisplay = ''
                if (item.sizeSummary) sizeDisplay = item.sizeSummary.map(s => s.size).join(', ')
                else if (item.size) sizeDisplay = item.size

                return (
                  <SortableCatalogCard
                    key={item.id}
                    id={item.id!}
                    item={item}
                    inWishlist={wishlist.has(item.productName)}
                    sizeDisplay={sizeDisplay}
                    isEditModeActive={true}
                    onToggleFeatured={onToggleFeatured}
                  />
                )
              })}
            </SortableContext>
          </DndContext>
        ) : (
          <>
            {filteredItems.some(i => i.isFeatured) && sortKey === 'recommended' && (
              <div className="prc-recommended-section">
                <h2 className="prc-recommended-title">Precious Recommended ✨</h2>
                <div className="prc-recommended-carousel">
                  {filteredItems.filter(i => i.isFeatured).map((item, index) => {
                    const itemKey = `rec-${item.productName}-${item.createdAt}-${index}`
                    let sizeDisplay = ''
                    if (item.sizeSummary) sizeDisplay = item.sizeSummary.map(s => s.size).join(', ')
                    else if (item.size) sizeDisplay = item.size

                    return (
                      <CatalogCardBase
                        key={itemKey}
                        item={item}
                        inWishlist={wishlist.has(item.productName)}
                        sizeDisplay={sizeDisplay}
                        onToggleWishlist={() => toggleWishlist(item.productName)}
                        onOpenDetail={() => openDetail(item)}
                      />
                    )
                  })}
                </div>
              </div>
            )}
            
            {filteredItems.some(i => i.isFeatured) && sortKey === 'recommended' && (
              <h2 className="prc-all-items-title">ชุดทั้งหมด</h2>
            )}

            {filteredItems.map((item, index) => {
              const itemKey = `${item.productName}-${item.createdAt}-${index}`
              let sizeDisplay = ''
              if (item.sizeSummary) sizeDisplay = item.sizeSummary.map(s => s.size).join(', ')
              else if (item.size) sizeDisplay = item.size

              return (
                <CatalogCardBase
                  key={itemKey}
                  item={item}
                  inWishlist={wishlist.has(item.productName)}
                  sizeDisplay={sizeDisplay}
                  onToggleWishlist={() => toggleWishlist(item.productName)}
                  onOpenDetail={() => openDetail(item)}
                />
              )
            })}
          </>
        )}

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

              <div className="prc-modal-info">
                <p className="prc-modal-brand">{selectedItem.brand?.toUpperCase() || 'PRECIOUS'}</p>
                <h2 className="prc-modal-title">{selectedItem.productName}</h2>

                <div className="prc-modal-status-row">
                  <span className={`prc-badge prc-badge--${getCatalogAvailability(selectedItem, rentals, today)}`}>
                    {getCatalogAvailability(selectedItem, rentals, today) === 'available' ? 'พร้อมให้เช่า' : 'ไม่ว่าง'}
                  </span>
                </div>

                <div className="prc-modal-price">
                  <span className="prc-modal-price-value">{formatTierRange(selectedItem.rentalTiers)}</span>
                </div>

                <div className="prc-modal-specs">
                  {selectedItem.sizeSummary ? (
                    <div className="prc-modal-spec prc-modal-spec-full">
                      <span className="prc-modal-spec-label">ไซซ์ที่มีในคลัง</span>
                      <div className="prc-modal-size-badges">
                        {selectedItem.sizeSummary.map(s => (
                          <span key={s.size} className={`prc-size-badge ${s.available > 0 ? 'available' : 'unavailable'}`}>
                            {s.size} {s.available > 0 ? `(${s.available} ว่าง)` : '(ไม่ว่าง)'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    selectedItem.size && (
                      <div className="prc-modal-spec">
                        <span className="prc-modal-spec-label">ไซซ์</span>
                        <span className="prc-modal-spec-value">{selectedItem.size}</span>
                      </div>
                    )
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
                  {selectedItem.setCount && selectedItem.setCount > 1 && (
                    <div className="prc-modal-spec">
                      <span className="prc-modal-spec-label">จำนวนชุดรวม</span>
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
      
      <style>{`
        .prc-modal-spec-full {
          width: 100%;
          grid-column: 1 / -1;
        }
        .prc-modal-size-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .prc-size-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .prc-size-badge.available {
          background: rgba(74, 222, 128, 0.1);
          color: #166534;
          border: 1px solid rgba(74, 222, 128, 0.3);
        }
        .prc-size-badge.unavailable {
          background: rgba(107, 114, 128, 0.1);
          color: #4b5563;
          border: 1px solid rgba(107, 114, 128, 0.2);
        }
        
        [data-theme='dark'] .prc-size-badge.available {
          background: rgba(74, 222, 128, 0.15);
          color: #86efac;
        }
        [data-theme='dark'] .prc-size-badge.unavailable {
          background: rgba(107, 114, 128, 0.15);
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}

function getCatalogHeroTitle(shopName?: string) {
  const normalizedName = shopName?.trim()
  if (!normalizedName) return 'Precious Rental'
  return /rental$/i.test(normalizedName) ? normalizedName : `${normalizedName} Rental`
}

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
  // If it's a new grouped product with sizeSummary
  if (item.sizeSummary) {
    const totalAvailable = item.sizeSummary.reduce((sum, s) => sum + s.available, 0)
    return totalAvailable > 0 ? 'available' : 'unavailable'
  }
  
  // If it's a legacy flat item
  if (item.availabilityStatus) {
    return item.availabilityStatus === 'available' ? 'available' : 'unavailable'
  }
  return getInventoryDisplayStatus(item as unknown as StockItem, rentals, today).primaryStatus === 'available' ? 'available' : 'unavailable'
}

function getTodayString() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatBaht(value: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

function formatTierRange(tiers?: { price: number }[]) {
  if (!tiers || tiers.length === 0) return '-'
  if (tiers.length === 1) return formatBaht(tiers[0].price)
  const prices = tiers.map(t => t.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return formatBaht(min)
  return `${formatBaht(min)} – ${formatBaht(max)}`
}

function CatalogCardBase({
  item,
  inWishlist,
  sizeDisplay,
  onToggleWishlist,
  onOpenDetail,
  isEditModeActive,
  onToggleFeatured,
}: {
  item: CatalogDisplayItem
  inWishlist: boolean
  sizeDisplay: string
  onToggleWishlist?: () => void
  onOpenDetail?: () => void
  isEditModeActive?: boolean
  onToggleFeatured?: (id: string, isFeatured: boolean) => void
}) {
  return (
    <article className="prc-card">
      <div className="prc-card-image">
        {item.imageUrls.length > 0 ? (
          <img src={item.imageUrls[0]} alt={item.productName} loading="lazy" />
        ) : (
          <div className="prc-card-placeholder">
            <span>PRECIOUS</span>
          </div>
        )}
        {item.isFeatured && (
          <span className="prc-badge prc-badge--featured">
            ✨ แนะนำ
          </span>
        )}
        {!isEditModeActive ? (
          <button
            className={`prc-wishlist-btn ${inWishlist ? 'prc-wishlist-btn--active' : ''}`}
            type="button"
            aria-label="เพิ่มในรายการโปรด"
            onClick={onToggleWishlist}
          >
            <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>
        ) : (
          <div className="prc-edit-overlay">
            <div className="prc-edit-drag-handle">
              <GripVertical size={20} />
              <span>ลาก</span>
            </div>
            <button
              className={`prc-edit-pin-btn ${item.isFeatured ? 'pinned' : ''}`}
              onClick={() => onToggleFeatured?.(item.id!, !item.isFeatured)}
            >
              <Pin size={20} fill={item.isFeatured ? 'currentColor' : 'none'} />
              <span>{item.isFeatured ? 'ปักหมุดแล้ว' : 'ปักหมุด'}</span>
            </button>
          </div>
        )}
      </div>
      <div className="prc-card-body">

        <p className="prc-card-brand">{item.brand?.toUpperCase() || 'PRECIOUS'}</p>
        <h2 className="prc-card-name">{item.productName}</h2>
        <div className="prc-card-footer">
          <div className="prc-card-price-block">
            <span className="prc-card-price">{formatTierRange(item.rentalTiers)}</span>
            {sizeDisplay && <span className="prc-card-size">ไซซ์ {sizeDisplay}</span>}
          </div>
          <div className="prc-card-actions">
            {!isEditModeActive && (
              <button
                className="prc-detail-btn"
                type="button"
                onClick={onOpenDetail}
              >
                ดูรายละเอียด
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function SortableCatalogCard(props: Parameters<typeof CatalogCardBase>[0] & { id: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 0
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CatalogCardBase {...props} />
    </div>
  )
}
