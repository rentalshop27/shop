import type { InputHTMLAttributes } from 'react'
import { useRef, useState } from 'react'
import {
  Archive,
  BadgeCheck,
  FileImage,
  ImagePlus,
  Images,
  LayoutGrid,
  List,
  Menu,
  Pencil,
  Eye,
  EyeOff,
  Plus,
  Search,
  ShieldAlert,
  Store,
  Trash2,
  X,
  PlusCircle,
} from 'lucide-react'
import { getInventoryDisplayStatus } from './inventoryStatus'
import { StockManagementDrawer } from './StockManagementDrawer'
import type { ProductDraft, ProductWithStockSummary, StockItemStatus } from './inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

type InventorySummary = {
  total: number
  sets: number
  deposits: number
  priced: number
}

export type InventoryControllerPageProps = {
  products: ProductWithStockSummary[]
  query: string
  setQuery: (value: string) => void
  summary: InventorySummary
  isFormOpen: boolean
  isEditing: boolean
  draft: ProductDraft
  formError: string
  isSaving: boolean
  onOpenForm: () => void
  onCloseForm: () => void
  onEdit: (product: ProductWithStockSummary) => void
  onDeleteProduct: (product: ProductWithStockSummary) => void
  onDeleteVariant: (productId: string, stockId: string) => void
  onAddStock: (productId: string, size: string, quantity: number) => void
  onPreview: (product: ProductWithStockSummary, index?: number) => void
  onDraftChange: <Field extends keyof ProductDraft>(field: Field, value: ProductDraft[Field]) => void
  onResetDraft: () => void
  onImageUpload: (files: FileList | null) => void
  onImageRemove: (imageUrl: string) => void
  onSave: () => void
  previewItem: ProductWithStockSummary | null
  previewImageIndex: number
  onPreviewIndexChange: (index: number) => void
  onClosePreview: () => void
  brands: string[]
  categories: string[]
  colors: string[]
  rentals: RentalOrder[]
  onUpdateStatus: (productId: string, stockId: string, status: StockItemStatus) => void
  onTogglePublicVisibility: (productId: string, publicVisible: boolean) => void
}

export type InventoryPageProps = InventoryControllerPageProps & {
  onOpenCatalog: () => void
}

export function InventoryPage({
  products,
  query,
  setQuery,
  summary,
  isFormOpen,
  isEditing,
  draft,
  formError,
  isSaving,
  onOpenForm,
  onCloseForm,
  onEdit,
  onDeleteProduct,
  onDeleteVariant,
  onAddStock,
  onPreview,
  onDraftChange,
  onResetDraft,
  onImageUpload,
  onImageRemove,
  onSave,
  previewItem,
  previewImageIndex,
  onPreviewIndexChange,
  onClosePreview,
  brands,
  categories,
  colors,
  rentals,
  onUpdateStatus,
  onTogglePublicVisibility,
  onOpenCatalog,
}: InventoryPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
    return (localStorage.getItem('inventoryViewMode') as 'table' | 'card') || 'card'
  })

  const handleViewModeChange = (mode: 'table' | 'card') => {
    setViewMode(mode)
    localStorage.setItem('inventoryViewMode', mode)
  }

  const [selectedProductForDrawerId, setSelectedProductForDrawerId] = useState<string | null>(null)
  const activeDrawerProduct = selectedProductForDrawerId 
    ? products.find(p => p.id === selectedProductForDrawerId) || null 
    : null

  const today = (() => {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  })()

  // SIZES configuration
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom']

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>คลังชุด</h1>
          <p className="subtitle">จัดการรายการชุดหลักและตัวชุดย่อย ค่าเช่า และเงินประกัน</p>
        </div>
        <div className="page-header-actions">
          <button className="secondary-button" type="button" onClick={onOpenCatalog}>
            <Store size={20} />
            ดูหน้าลูกค้า
          </button>
          <button className="primary-button" type="button" onClick={onOpenForm}>
            <Plus size={22} />
            เพิ่มชุดหลัก
          </button>
        </div>
      </header>

      <section className="system-strip inventory-summary-strip" aria-label="ภาพรวมคลังชุด">
        <InventoryMetricCard label="ตัวชุดย่อยรวม" value={`${summary.total}`} icon={<Archive />} type="total" unit="ตัว" />
        <InventoryMetricCard label="แบบชุดหลัก" value={`${summary.sets}`} icon={<Menu />} type="verified" unit="แบบ" />
        <InventoryMetricCard label="ตั้งราคาแล้ว" value={`${summary.priced}`} icon={<BadgeCheck />} type="incomplete" />
        <InventoryMetricCard label="เงินประกันรวม" value={formatBaht(summary.deposits)} icon={<ShieldAlert />} type="risk" unit="" />
      </section>

      <section className="panel inventory-panel">
        <div className="toolbar inventory-toolbar">
          <label className="search-box">
            <Search size={22} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาด้วยรหัสหลัก ชื่อ แบรนด์ สี..."
            />
          </label>
          <div className="view-toggle-group">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('table')}
              title="แสดงแบบตาราง"
            >
              <List size={20} />
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('card')}
              title="แสดงแบบการ์ด"
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="stock-table" role="table" aria-label="รายการคลังชุด">
            <div className="stock-row stock-head" role="row">
              <span>รูป</span>
              <span>รหัสหลัก</span>
              <span>ชื่อสินค้า</span>
              <span>ไซซ์ที่มี</span>
              <span>ราคาเช่า</span>
              <span>จัดการชุดหลัก</span>
            </div>
            {products.map((product) => {
              const uniqueSizes = Array.from(new Set(product.stockItems.map(s => s.size))).join(', ') || '-'
              return (
                <div className="stock-row" key={product.id} role="row">
                  <div className="stock-image-thumbnail">
                    {product.imageUrls && product.imageUrls.length > 0 ? (
                      <img src={product.imageUrls[0]} alt={product.productName} onClick={() => onPreview(product, 0)} style={{ cursor: 'pointer' }} />
                    ) : (
                      <div className="stock-image-placeholder">
                        <FileImage size={20} />
                      </div>
                    )}
                  </div>
                  <strong>{product.baseSku}</strong>
                  <div className="stock-product-cell">
                    <span>
                      {product.productName}
                      <small>{[product.brand, product.category, product.primaryColor].filter(Boolean).join(' | ') || '-'}</small>
                    </span>
                    {product.imageUrls.length > 0 && (
                      <button className="inline-link-button" type="button" onClick={() => onPreview(product, 0)} aria-label={`ดูรูป`}>
                        <Images size={14} /> ดูรูป {product.imageUrls.length}
                      </button>
                    )}
                  </div>
                  <span>{uniqueSizes}</span>
                  <span>{formatBaht(product.rentalPricePerDay)}</span>
                  <div className="stock-action-group">
                    <button
                      className={`inline-link-button stock-visibility-button ${product.publicVisible ? 'active' : ''}`}
                      type="button"
                      onClick={() => onTogglePublicVisibility(product.id, !product.publicVisible)}
                    >
                      {product.publicVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      {product.publicVisible ? 'ซ่อนจากเว็บ' : 'โชว์หน้าเว็บ'}
                    </button>
                    <button className="icon-action-button compact" type="button" onClick={() => onEdit(product)} title="แก้ไข">
                      <Pencil size={16} />
                    </button>
                    <button className="icon-action-button compact danger" type="button" onClick={() => onDeleteProduct(product)} title="ลบชุด">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
            {products.length === 0 && <div className="empty-state">ยังไม่มีรายการที่ตรงกับคำค้นหา</div>}
          </div>
        ) : (
          <div className="stock-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {products.map((product) => {
              return (
                <div className="stock-card" key={product.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="stock-card-image">
                    {product.imageUrls && product.imageUrls.length > 0 ? (
                      <img src={product.imageUrls[0]} alt={product.productName} onClick={() => onPreview(product, 0)} style={{ cursor: 'pointer' }} />
                    ) : (
                      <div className="stock-card-image-placeholder">
                        <FileImage size={32} />
                      </div>
                    )}
                    <span className="stock-card-sku-badge">{product.baseSku}</span>
                  </div>
                  <div className="stock-card-content" style={{ flexGrow: 1 }}>
                    <div className="stock-card-title-section">
                      <h3 className="stock-card-title">{product.productName}</h3>
                      <p className="stock-card-subtitle">{[product.brand, product.category].filter(Boolean).join(' | ') || '-'}</p>
                    </div>

                    <div className="stock-card-pricing" style={{ marginBottom: '16px' }}>
                      <div className="stock-card-price-item">
                        <span className="stock-card-price-label">ค่าเช่า</span>
                        <strong className="stock-card-price-value gold">{formatBaht(product.rentalPricePerDay)}</strong>
                      </div>
                      <div className="stock-card-price-item">
                        <span className="stock-card-price-label">ประกัน</span>
                        <strong className="stock-card-price-value">{formatBaht(product.depositAmount)}</strong>
                      </div>
                    </div>

                    <div className="stock-card-summary">
                      <div className="size-badges-container">
                        {(() => {
                          const sizeCounts = product.stockItems.reduce((acc, si) => {
                            acc[si.size] = (acc[si.size] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                          
                          const sortedSizes = Object.keys(sizeCounts).sort((a, b) => {
                            const indexA = SIZES.indexOf(a)
                            const indexB = SIZES.indexOf(b)
                            if (indexA === -1 && indexB === -1) return a.localeCompare(b)
                            if (indexA === -1) return 1
                            if (indexB === -1) return -1
                            return indexA - indexB
                          })
                          
                          if (sortedSizes.length === 0) {
                            return <span className="status-summary-text">ยังไม่มีสินค้าในสต็อก</span>
                          }
                          
                          return sortedSizes.map(size => (
                            <span key={size} className="size-summary-badge">
                              ไซส์ {size}: {sizeCounts[size]} ตัว
                            </span>
                          ))
                        })()}
                      </div>
                      
                      <div className="status-summary-text">
                        {(() => {
                          if (product.stockItems.length === 0) return null
                          
                          const statusCounts = product.stockItems.reduce((acc, si) => {
                            const { primaryStatus } = getInventoryDisplayStatus(si, rentals, today)
                            acc[primaryStatus] = (acc[primaryStatus] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                          
                          const parts = []
                          if (statusCounts.available) parts.push(`ว่าง ${statusCounts.available}`)
                          if (statusCounts.booked) parts.push(`มีคิวจอง ${statusCounts.booked}`)
                          if (statusCounts.rented) parts.push(`ถูกเช่า ${statusCounts.rented}`)
                          if (statusCounts.repair) parts.push(`ซ่อม ${statusCounts.repair}`)
                          if (statusCounts.wash) parts.push(`ซัก ${statusCounts.wash}`)
                          
                          return <span><strong>สถานะรวม:</strong> {parts.join(' | ')}</span>
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="stock-card-actions" style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.2)', padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="primary-button compact"
                      type="button"
                      onClick={() => setSelectedProductForDrawerId(product.id)}
                      style={{ flexGrow: 1, padding: '8px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >
                      ⚙️ จัดการชุดย่อย
                    </button>
                    <button
                      className={`stock-card-visibility-toggle ${product.publicVisible ? 'active' : ''}`}
                      type="button"
                      onClick={() => onTogglePublicVisibility(product.id, !product.publicVisible)}
                      style={{ padding: '8px 10px', fontSize: '0.85rem', minWidth: '40px', flex: 'none', justifyContent: 'center' }}
                      title={product.publicVisible ? 'ซ่อนจากเว็บ' : 'โชว์หน้าเว็บ'}
                    >
                      {product.publicVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button className="icon-action-button compact" type="button" onClick={() => onEdit(product)} title="แก้ไขชุดหลัก" style={{ flex: 'none' }}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-action-button compact danger" type="button" onClick={() => onDeleteProduct(product)} title="ลบชุดหลัก" style={{ flex: 'none' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
            {products.length === 0 && <div className="empty-state" style={{ gridColumn: '1 / -1' }}>ยังไม่มีรายการที่ตรงกับคำค้นหา</div>}
          </div>
        )}
      </section>

      {previewItem && (
        <div className="modal-backdrop stock-preview-backdrop" role="presentation" onClick={onClosePreview}>
          <section className="modal-panel stock-preview-panel" aria-label="ดูรูปชุด" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Gallery</p>
                <h2>{previewItem.productName}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={onClosePreview}>ปิด</button>
            </div>
            <div className="stock-preview-stage">
              <img src={previewItem.imageUrls[previewImageIndex]} alt={`รูปชุด ${previewImageIndex + 1} ของ ${previewItem.productName}`} />
            </div>
            <div className="stock-preview-meta">
              <span>{previewItem.baseSku}</span>
              <span>รูปที่ {previewImageIndex + 1}/{previewItem.imageUrls.length}</span>
            </div>
            <div className="stock-preview-thumbs">
              {previewItem.imageUrls.map((imageUrl, index) => (
                <button
                  key={`${previewItem.id}-thumb-${index}`}
                  className={`stock-preview-thumb ${index === previewImageIndex ? 'active' : ''}`}
                  type="button"
                  onClick={() => onPreviewIndexChange(index)}
                >
                  <img src={imageUrl} alt={`ภาพย่อรูปชุด ${index + 1}`} />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {isFormOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel stock-modal-panel" aria-label="เพิ่มสต๊อก">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Product & Variants</p>
                <h2>{isEditing ? 'แก้ไขข้อมูลชุดหลัก' : 'เพิ่มชุดหลัก และจัดสต๊อกตัวชุด'}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={onCloseForm} disabled={isSaving}>
                ปิด
              </button>
            </div>

            <div className="stock-form-section">
              <div className="section-title-row">
                <h3>ส่วนที่ 1: ข้อมูลหลักของชุด</h3>
                <span>(ข้อมูลนี้แชร์กันทุกไซซ์)</span>
              </div>
              <InventoryTextField
                label="ชื่อชุด (แสดงในเว็บ)"
                value={draft.productName}
                onChange={(value) => onDraftChange('productName', value)}
                placeholder="เช่น ชุดราตรี Midnight Starlight"
                required
              />
              <div className="form-grid">
                <InventoryTextField
                  label="รหัสชุดหลัก (Base SKU)"
                  value={draft.baseSku}
                  onChange={(value) => onDraftChange('baseSku', value)}
                  placeholder="เช่น PR-4791"
                  required
                  disabled={isEditing || isSaving}
                />
                <label className="field">
                  <span>สีหลัก</span>
                  <select value={draft.primaryColor} onChange={(event) => onDraftChange('primaryColor', event.target.value)}>
                    <option value="">-- เลือกสีหลัก --</option>
                    {colors.map((colorName) => (
                      <option key={colorName} value={colorName}>{colorName}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>แบรนด์</span>
                  <select value={draft.brand} onChange={(event) => onDraftChange('brand', event.target.value)}>
                    <option value="">-- เลือกแบรนด์ --</option>
                    {brands.map((brandName) => (
                      <option key={brandName} value={brandName}>{brandName}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>หมวดหมู่/ประเภทชุด</span>
                  <select value={draft.category} onChange={(event) => onDraftChange('category', event.target.value)}>
                    <option value="">-- เลือกประเภทชุด --</option>
                    {categories.map((catName) => (
                      <option key={catName} value={catName}>{catName}</option>
                    ))}
                  </select>
                </label>
              </div>
              
              <div className="form-grid pricing-grid" style={{ marginTop: '16px' }}>
                <CurrencyField label="ค่าเช่า (ต่อชุด/ต่อวัน)" value={draft.rentalPricePerDay} onChange={(value) => onDraftChange('rentalPricePerDay', value)} />
                <CurrencyField label="เงินประกัน (มัดจำ)" value={draft.depositAmount} onChange={(value) => onDraftChange('depositAmount', value)} />
                <InventoryTextField
                  label="เกณฑ์ค่าปรับล่าช้า"
                  value={draft.lateFeeRule}
                  onChange={(value) => onDraftChange('lateFeeRule', value)}
                  placeholder="เช่น 300 บาท/วัน หลังครบกำหนด"
                />
              </div>

              <label className="checkbox-field inventory-public-toggle" style={{ marginTop: '16px' }}>
                <input
                  type="checkbox"
                  checked={Boolean(draft.publicVisible)}
                  onChange={(event) => onDraftChange('publicVisible', event.target.checked)}
                  disabled={isSaving}
                />
                <span>เปิดให้ลูกค้าเห็นในหน้า Public Catalog ทันทีที่บันทึก</span>
              </label>

              <label className="field wide" style={{ marginTop: '16px' }}>
                <span>คำอธิบายเพิ่มเติมสำหรับลูกค้า</span>
                <textarea
                  value={draft.publicDescription}
                  onChange={(event) => onDraftChange('publicDescription', event.target.value)}
                  placeholder="คำอธิบายสั้น ๆ ที่น่าสนใจ แนะนำทรงชุด..."
                  rows={4}
                />
              </label>
            </div>

            <div className="stock-form-section">
              <div className="section-title-row">
                <h3>รูปชุดตัวอย่าง</h3>
                <span>{draft.imageUrls.length}/5 รูป</span>
              </div>
              <label className="stock-image-uploader">
                <ImagePlus size={22} />
                <span>เพิ่มรูปชุดได้สูงสุด 5 รูป (เลือกพร้อมกันได้หลายรูป)</span>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(event) => onImageUpload(event.target.files)} />
              </label>
              <div className="stock-image-grid">
                {Array.from({ length: 5 }).map((_, index) => {
                  const imageUrl = draft.imageUrls[index]
                  return (
                    <div className="stock-image-slot" key={imageUrl ?? `empty-${index}`}>
                      {imageUrl ? (
                        <>
                          <img src={imageUrl} alt={`รูปชุด ${index + 1}`} />
                          <button type="button" onClick={() => onImageRemove(imageUrl)} aria-label={`ลบรูปชุด ${index + 1}`}>
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <div className="stock-image-empty" style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                          <FileImage size={24} />
                          <span>รูปที่ {index + 1}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {!isEditing && (
              <div className="stock-form-section" style={{ background: 'rgba(218, 165, 32, 0.05)', borderColor: 'rgba(218, 165, 32, 0.2)' }}>
                <div className="section-title-row">
                  <h3 style={{ color: 'var(--text-gold)' }}>ส่วนที่ 2: สร้างตัวชุดย่อย (Variant Generator)</h3>
                  <span>สร้าง SKU แยกตามตัวชุดอัตโนมัติ</span>
                </div>
                
                <div className="variants-generator">
                  <div className="variant-header" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 40px', gap: '16px', marginBottom: '8px', padding: '0 8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <span>ไซซ์</span>
                    <span>จำนวน (ตัว)</span>
                    <span>ตัวอย่าง SKU ลูกที่จะถูกสร้าง</span>
                    <span>ลบ</span>
                  </div>
                  
                  {draft.variants.map((variant, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 40px', gap: '16px', alignItems: 'center', marginBottom: '8px', background: 'var(--surface-elevated)', padding: '8px', borderRadius: '8px' }}>
                      <select 
                        value={variant.size} 
                        onChange={(e) => {
                          const newVariants = [...draft.variants]
                          newVariants[index].size = e.target.value
                          onDraftChange('variants', newVariants)
                        }}
                        style={{ padding: '8px', borderRadius: '6px', background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        {SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                      </select>
                      
                      <input 
                        type="number" 
                        min="1" 
                        value={variant.quantity} 
                        onChange={(e) => {
                          const newVariants = [...draft.variants]
                          newVariants[index].quantity = parseInt(e.target.value) || 1
                          onDraftChange('variants', newVariants)
                        }}
                        style={{ padding: '8px', borderRadius: '6px', background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-gold)' }}>
                        {Array.from({ length: Math.min(variant.quantity, 3) }).map((_, i) => (
                          <span key={i}>{draft.baseSku || 'SKU'}-{variant.size}-{String(i+1).padStart(2, '0')}</span>
                        ))}
                        {variant.quantity > 3 && <span style={{ color: 'var(--text-muted)' }}>...อีก {variant.quantity - 3} ตัว</span>}
                      </div>

                      <button type="button" onClick={() => {
                        const newVariants = draft.variants.filter((_, i) => i !== index)
                        onDraftChange('variants', newVariants)
                      }} style={{ background: 'none', border: 'none', color: 'var(--danger-glow)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    onClick={() => onDraftChange('variants', [...draft.variants, { size: 'S', quantity: 1 }])}
                    style={{ marginTop: '8px', padding: '12px', width: '100%', background: 'none', border: '1px dashed rgba(218, 165, 32, 0.4)', borderRadius: '8px', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <PlusCircle size={20} /> เพิ่มรายการไซซ์
                  </button>
                </div>
              </div>
            )}

            {formError && <p className="form-error">{formError}</p>}

            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={onResetDraft} disabled={isSaving}>
                ล้างฟอร์ม
              </button>
              <button className="primary-button" type="button" onClick={onSave} disabled={isSaving}>
                {isSaving ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการแก้ไข' : 'สร้างชุด และ ตัวชุดย่อย'}
              </button>
            </div>
          </section>
        </div>
      )}

      {activeDrawerProduct && (
        <StockManagementDrawer
          product={activeDrawerProduct}
          rentals={rentals}
          today={today}
          onClose={() => setSelectedProductForDrawerId(null)}
          onAddStock={onAddStock}
          onDeleteVariant={onDeleteVariant}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </>
  )
}

function InventoryMetricCard({ label, value, icon, type, unit = 'รายการ' }: { label: string; value: string; icon: React.ReactNode; type: string; unit?: string }) {
  return (
    <div className={`metric-card ${type}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <span className="metric-label">{label}</span>
        <div className="metric-value-row">
          <strong className="metric-value">{value}</strong>
          {unit && <span className="metric-unit">{unit}</span>}
        </div>
      </div>
    </div>
  )
}

function InventoryTextField({ label, value, onChange, placeholder, required, type = 'text', inputMode, disabled }: { label: string; value: string; onChange: (val: string) => void; placeholder?: string; required?: boolean; type?: string; inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']; disabled?: boolean }) {
  return (
    <label className="field">
      <span>{label} {required && <span className="required">*</span>}</span>
      <input type={type} inputMode={inputMode} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
    </label>
  )
}

function CurrencyField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <label className="field currency-field">
      <span>{label}</span>
      <div className="currency-input-wrapper">
        <span className="currency-prefix">฿</span>
        <input type="number" inputMode="numeric" value={value} onChange={e => onChange(e.target.value)} placeholder="0" />
      </div>
    </label>
  )
}

function formatBaht(amount: string | number) {
  const num = Number(amount)
  if (!num) return '-'
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)
}
