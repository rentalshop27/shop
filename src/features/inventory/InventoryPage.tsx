import { useMemo, useRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import {
  Archive,
  BadgeCheck,
  CalendarDays,
  FileImage,
  ImagePlus,
  Images,
  LayoutGrid,
  List,
  Menu,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'
import { getInventoryDisplayStatus } from './inventoryStatus'
import type { StockDraft, StockItem, StockItemStatus } from './inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

type InventorySummary = {
  total: number
  sets: number
  deposits: number
  priced: number
}

export type InventoryPageProps = {
  items: StockItem[]
  query: string
  setQuery: (value: string) => void
  summary: InventorySummary
  isFormOpen: boolean
  isEditing: boolean
  draft: StockDraft
  formError: string
  isSaving: boolean
  onOpenForm: () => void
  onCloseForm: () => void
  onEdit: (item: StockItem) => void
  onDelete: (item: StockItem) => void
  onPreview: (item: StockItem, index?: number) => void
  onDraftChange: (field: keyof StockDraft, value: string) => void
  onResetDraft: () => void
  onImageUpload: (files: FileList | null) => void
  onImageRemove: (imageUrl: string) => void
  onSave: () => void
  previewItem: StockItem | null
  previewImageIndex: number
  onPreviewIndexChange: (index: number) => void
  onClosePreview: () => void
  brands: string[]
  categories: string[]
  colors: string[]
  rentals: RentalOrder[]
  onUpdateStatus: (itemId: string, status: StockItemStatus) => void
}

export function InventoryPage({
  items,
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
  onDelete,
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
}: InventoryPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
    return (localStorage.getItem('inventoryViewMode') as 'table' | 'card') || 'card'
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeStatusDropdownId, setActiveStatusDropdownId] = useState<string | null>(null)

  const handleViewModeChange = (mode: 'table' | 'card') => {
    setViewMode(mode)
    localStorage.setItem('inventoryViewMode', mode)
  }

  const today = (() => {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  })()

  const statusCounts = useMemo(() => {
    const counts = { all: items.length, available: 0, rented: 0, booked: 0, repair: 0, wash: 0 }
    items.forEach((item) => {
      const { primaryStatus } = getInventoryDisplayStatus(item, rentals, today)
      if (primaryStatus in counts) {
        counts[primaryStatus as keyof typeof counts] += 1
      }
    })
    return counts
  }, [items, rentals, today])

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return items
    return items.filter((item) => {
      const { primaryStatus } = getInventoryDisplayStatus(item, rentals, today)
      return primaryStatus === statusFilter
    })
  }, [items, statusFilter, rentals, today])

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>คลังชุด</h1>
          <p className="subtitle">จัดการ SKU รายการชุด ค่าเช่า ค่าปรับล่าช้า และเงินประกัน</p>
        </div>
        <button className="primary-button" type="button" onClick={onOpenForm}>
          <Plus size={22} />
          เพิ่มสต๊อก
        </button>
      </header>

      <section className="system-strip inventory-summary-strip" aria-label="ภาพรวมคลังชุด">
        <InventoryMetricCard label="รายการสต๊อก" value={`${summary.total}`} icon={<Menu />} type="total" />
        <InventoryMetricCard label="จำนวนชุดรวม" value={`${summary.sets}`} icon={<Archive />} type="verified" unit="ชุด" />
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
              placeholder="ค้นหาด้วย SKU ชื่อสินค้า แบรนด์ หมวดหมู่ สี หรือไซซ์..."
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

        <div className="status-filter-container">
          <button type="button" className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
            ทั้งหมด ({statusCounts.all})
          </button>
          <button type="button" className={`filter-chip available ${statusFilter === 'available' ? 'active' : ''}`} onClick={() => setStatusFilter('available')}>
            <span className="dot success" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#4ade80', marginRight: 4 }}></span>
            ว่าง ({statusCounts.available})
          </button>
          <button type="button" className={`filter-chip rented ${statusFilter === 'rented' ? 'active' : ''}`} onClick={() => setStatusFilter('rented')}>
            <span className="dot rented" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#ead483', marginRight: 4 }}></span>
            ถูกเช่า ({statusCounts.rented})
          </button>
          <button type="button" className={`filter-chip booked ${statusFilter === 'booked' ? 'active' : ''}`} onClick={() => setStatusFilter('booked')}>
            <span className="dot booked" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#a5b4fc', marginRight: 4 }}></span>
            มีคิวจอง ({statusCounts.booked})
          </button>
          <button type="button" className={`filter-chip repair ${statusFilter === 'repair' ? 'active' : ''}`} onClick={() => setStatusFilter('repair')}>
            <span className="dot danger" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f87171', marginRight: 4 }}></span>
            ซ่อม ({statusCounts.repair})
          </button>
          <button type="button" className={`filter-chip wash ${statusFilter === 'wash' ? 'active' : ''}`} onClick={() => setStatusFilter('wash')}>
            <span className="dot warning" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', marginRight: 4 }}></span>
            ซัก ({statusCounts.wash})
          </button>
        </div>

        {viewMode === 'table' ? (
          <div className="stock-table" role="table" aria-label="รายการคลังชุด">
            <div className="stock-row stock-head" role="row">
              <span>รูป</span>
              <span>SKU</span>
              <span>สินค้า</span>
              <span>ไซซ์/สี</span>
              <span>สถานะ</span>
              <span>ค่าเช่า</span>
              <span>ค่าปรับ</span>
              <span>ประกัน</span>
              <span>จัดการ</span>
            </div>
            {filteredItems.map((item) => {
              const { primaryStatus, nextBookedRental } = getInventoryDisplayStatus(item, rentals, today)
              return (
                <div className="stock-row" key={item.id} role="row">
                  <div className="stock-image-thumbnail">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <img src={item.imageUrls[0]} alt={item.productName} onClick={() => onPreview(item, 0)} style={{ cursor: 'pointer' }} />
                    ) : (
                      <div className="stock-image-placeholder">
                        <FileImage size={20} />
                      </div>
                    )}
                  </div>
                  <strong>{item.sku}</strong>
                  <div className="stock-product-cell">
                    <span>
                      {item.productName}
                      <small>{[item.brand, item.category, item.serialNumber].filter(Boolean).join(' | ') || '-'}</small>
                    </span>
                    {item.imageUrls.length > 0 && (
                      <button className="inline-link-button" type="button" onClick={() => onPreview(item, 0)} aria-label={`ดูรูป ${item.sku}`}>
                        <Images size={14} />
                        ดูรูป {item.imageUrls.length}
                      </button>
                    )}
                  </div>
                  <span>
                    {item.size || '-'}
                    <small>{item.primaryColor || '-'}</small>
                  </span>
                  <span style={{ position: 'relative' }}>
                    <StatusDropdown
                      itemId={item.id}
                      isOpen={activeStatusDropdownId === item.id}
                      primaryStatus={primaryStatus}
                      nextBookedRental={nextBookedRental}
                      onToggle={() => setActiveStatusDropdownId(activeStatusDropdownId === item.id ? null : item.id)}
                      onClose={() => setActiveStatusDropdownId(null)}
                      onUpdateStatus={onUpdateStatus}
                    />
                  </span>
                  <span>{formatBaht(item.rentalPricePerDay)}</span>
                  <span>{item.lateFeeRule || '-'}</span>
                  <span>{formatBaht(item.depositAmount)}</span>
                  <div className="stock-action-group">
                    <button className="icon-action-button compact" type="button" onClick={() => onEdit(item)} aria-label={`แก้ไข ${item.sku}`}>
                      <Pencil size={16} />
                    </button>
                    <button className="icon-action-button compact danger" type="button" onClick={() => onDelete(item)} aria-label={`ลบ ${item.sku}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
            {filteredItems.length === 0 && <div className="empty-state">ยังไม่มีรายการที่ตรงกับคำค้นหา</div>}
          </div>
        ) : (
          <div className="stock-grid">
            {filteredItems.map((item) => {
              const { primaryStatus, nextBookedRental } = getInventoryDisplayStatus(item, rentals, today)
              return (
                <div className="stock-card" key={item.id}>
                  <div className="stock-card-image">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <img src={item.imageUrls[0]} alt={item.productName} onClick={() => onPreview(item, 0)} style={{ cursor: 'pointer' }} />
                    ) : (
                      <div className="stock-card-image-placeholder">
                        <FileImage size={32} />
                      </div>
                    )}
                    <span className="stock-card-sku-badge">{item.sku}</span>
                    <div className="stock-card-status-badge-wrapper" onClick={(event) => {
                      event.stopPropagation()
                      setActiveStatusDropdownId(activeStatusDropdownId === item.id ? null : item.id)
                    }}>
                      {renderStockStatusPill(primaryStatus)}
                      {activeStatusDropdownId === item.id && (
                        <>
                          <div className="dropdown-overlay-fixed" onClick={(event) => {
                            event.stopPropagation()
                            setActiveStatusDropdownId(null)
                          }} />
                          <div className="status-dropdown-menu" onClick={(event) => event.stopPropagation()}>
                            <StatusUpdateButtons itemId={item.id} onUpdateStatus={onUpdateStatus} onClose={() => setActiveStatusDropdownId(null)} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="stock-card-content">
                    <div className="stock-card-title-section">
                      <h3 className="stock-card-title">{item.productName}</h3>
                      <p className="stock-card-subtitle">{[item.brand, item.category, item.serialNumber].filter(Boolean).join(' | ') || '-'}</p>
                    </div>

                    <div className="stock-card-specs">
                      {item.size && <span className="stock-card-spec-tag">ไซซ์: {item.size}</span>}
                      {item.primaryColor && <span className="stock-card-spec-tag">สี: {item.primaryColor}</span>}
                      {item.setCount && <span className="stock-card-spec-tag">จำนวน: {item.setCount} ชุด</span>}
                    </div>

                    {nextBookedRental && (primaryStatus === 'booked' || primaryStatus === 'repair' || primaryStatus === 'wash') && (
                      <div className="stock-card-next-booking">
                        <CalendarDays size={12} />
                        <span>คิว: {nextBookedRental.pickupDate} ถึง {nextBookedRental.returnDate}</span>
                      </div>
                    )}

                    <div className="stock-card-pricing">
                      <div className="stock-card-price-item">
                        <span className="stock-card-price-label">ค่าเช่า</span>
                        <strong className="stock-card-price-value gold">{formatBaht(item.rentalPricePerDay)}</strong>
                      </div>
                      <div className="stock-card-price-item">
                        <span className="stock-card-price-label">ค่าปรับ</span>
                        <strong className="stock-card-price-value">{item.lateFeeRule || '-'}</strong>
                      </div>
                      <div className="stock-card-price-item">
                        <span className="stock-card-price-label">ประกัน</span>
                        <strong className="stock-card-price-value">{formatBaht(item.depositAmount)}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="stock-card-actions">
                    <div className="stock-card-action-buttons">
                      <button className="icon-action-button compact" type="button" onClick={() => onEdit(item)} aria-label={`แก้ไข ${item.sku}`} title="แก้ไข">
                        <Pencil size={15} />
                      </button>
                      <button className="icon-action-button compact danger" type="button" onClick={() => onDelete(item)} aria-label={`ลบ ${item.sku}`} title="ลบชุด">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredItems.length === 0 && <div className="empty-state" style={{ gridColumn: '1 / -1' }}>ยังไม่มีรายการที่ตรงกับคำค้นหา</div>}
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
              <button className="ghost-button" type="button" onClick={onClosePreview}>
                ปิด
              </button>
            </div>

            <div className="stock-preview-stage">
              <img src={previewItem.imageUrls[previewImageIndex]} alt={`รูปชุด ${previewImageIndex + 1} ของ ${previewItem.productName}`} />
            </div>

            <div className="stock-preview-meta">
              <span>{previewItem.sku}</span>
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
                <p className="eyebrow">Stock Item</p>
                <h2>{isEditing ? 'แก้ไขสินค้าในคลังชุด' : 'เพิ่มสินค้าเข้าคลังชุด'}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={onCloseForm} disabled={isSaving}>
                ปิด
              </button>
            </div>

            <div className="stock-form-section">
              <InventoryTextField
                label="ชื่อสินค้า"
                value={draft.productName}
                onChange={(value) => onDraftChange('productName', value)}
                placeholder="เช่น ชุดราตรี Midnight Starlight"
                required
              />
              <div className="form-grid">
                <label className="field">
                  <span>แบรนด์</span>
                  <select value={draft.brand} onChange={(event) => onDraftChange('brand', event.target.value)}>
                    <option value="">-- เลือกแบรนด์ --</option>
                    {brands.map((brandName) => (
                      <option key={brandName} value={brandName}>
                        {brandName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>หมวดหมู่/ประเภทชุด</span>
                  <select value={draft.category} onChange={(event) => onDraftChange('category', event.target.value)}>
                    <option value="">-- เลือกประเภทชุด --</option>
                    {categories.map((catName) => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>ไซซ์ / ขนาด</span>
                  <select value={draft.size} onChange={(event) => onDraftChange('size', event.target.value)}>
                    <option value="">-- เลือกไซซ์ --</option>
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'].map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>สีหลัก</span>
                  <select value={draft.primaryColor} onChange={(event) => onDraftChange('primaryColor', event.target.value)}>
                    <option value="">-- เลือกสีหลัก --</option>
                    {colors.map((colorName) => (
                      <option key={colorName} value={colorName}>
                        {colorName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>สถานะคลังสินค้า</span>
                  <select value={draft.status} onChange={(event) => onDraftChange('status', event.target.value)}>
                    <option value="available">ว่าง</option>
                    <option value="repair">ซ่อม</option>
                    <option value="wash">ซัก</option>
                  </select>
                </label>
              </div>
              <label className="field wide">
                <span>คำอธิบายสาธารณะ</span>
                <textarea
                  value={draft.publicDescription}
                  onChange={(event) => onDraftChange('publicDescription', event.target.value)}
                  placeholder="คำอธิบายสั้น ๆ ที่น่าสนใจสำหรับลูกค้า..."
                  rows={4}
                />
              </label>
            </div>

            <div className="stock-form-section">
              <div className="section-title-row">
                <h3>รูปชุด</h3>
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

            <div className="stock-form-section stock-code-section">
              <div className="form-grid">
                <InventoryTextField
                  label="SKU/รหัสสต๊อก"
                  value={draft.sku}
                  onChange={(value) => onDraftChange('sku', value)}
                  placeholder="เช่น PR-4791"
                  required
                  disabled={isSaving}
                />
                <InventoryTextField
                  label="จำนวนชุด"
                  value={draft.setCount}
                  onChange={(value) => onDraftChange('setCount', value)}
                  inputMode="numeric"
                  type="number"
                  disabled={isSaving}
                />
                <InventoryTextField
                  label="หมายเลขซีเรียล"
                  value={draft.serialNumber}
                  onChange={(value) => onDraftChange('serialNumber', value)}
                  placeholder="หมายเลขซีเรียลจากผู้ผลิต"
                  disabled={isSaving}
                />
              </div>
              {!isEditing && Number(draft.setCount) > 1 && draft.sku.trim() && (
                <SubSkuPreview draft={draft} />
              )}
            </div>

            <div className="stock-form-section">
              <div className="section-title-row">
                <h3>ราคาดำเนินการ</h3>
                <span>ไม่เปิดเผยต่อสาธารณะ</span>
              </div>
              <div className="form-grid pricing-grid">
                <CurrencyField label="ค่าเช่า (รายวัน)" value={draft.rentalPricePerDay} onChange={(value) => onDraftChange('rentalPricePerDay', value)} />
                <InventoryTextField
                  label="เกณฑ์ค่าปรับล่าช้า"
                  value={draft.lateFeeRule}
                  onChange={(value) => onDraftChange('lateFeeRule', value)}
                  placeholder="เช่น 300 บาท/วัน หลังครบกำหนด"
                />
                <CurrencyField label="เงินประกัน" value={draft.depositAmount} onChange={(value) => onDraftChange('depositAmount', value)} />
              </div>
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={onResetDraft} disabled={isSaving}>
                ล้างฟอร์ม
              </button>
              <button className="primary-button" type="button" onClick={onSave} disabled={isSaving}>
                {isSaving ? 'กำลังบันทึก...' : !isEditing && Number(draft.setCount) > 1 ? `บันทึก ${draft.setCount} ชุด` : isEditing ? 'บันทึกการแก้ไข' : 'บันทึกสต๊อก'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function StatusDropdown({
  itemId,
  isOpen,
  primaryStatus,
  nextBookedRental,
  onToggle,
  onClose,
  onUpdateStatus,
}: {
  itemId: string
  isOpen: boolean
  primaryStatus: 'available' | 'repair' | 'wash' | 'rented' | 'booked'
  nextBookedRental: RentalOrder | null
  onToggle: () => void
  onClose: () => void
  onUpdateStatus: (itemId: string, status: StockItemStatus) => void
}) {
  return (
    <>
      <div className="stock-card-status-badge-wrapper" onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}>
        {renderStockStatusPill(primaryStatus)}
      </div>
      {isOpen && (
        <>
          <div className="dropdown-overlay-fixed" onClick={(event) => {
            event.stopPropagation()
            onClose()
          }} />
          <div className="status-dropdown-menu" onClick={(event) => event.stopPropagation()}>
            <StatusUpdateButtons itemId={itemId} onUpdateStatus={onUpdateStatus} onClose={onClose} />
          </div>
        </>
      )}
      {nextBookedRental && (primaryStatus === 'booked' || primaryStatus === 'repair' || primaryStatus === 'wash') && (
        <small style={{ display: 'block', marginTop: '4px', color: '#a5b4fc', fontSize: '0.75rem' }}>
          คิว: {nextBookedRental.pickupDate} ถึง {nextBookedRental.returnDate}
        </small>
      )}
    </>
  )
}

function StatusUpdateButtons({
  itemId,
  onUpdateStatus,
  onClose,
}: {
  itemId: string
  onUpdateStatus: (itemId: string, status: StockItemStatus) => void
  onClose: () => void
}) {
  const updateStatus = (status: StockItemStatus) => {
    onUpdateStatus(itemId, status)
    onClose()
  }

  return (
    <>
      <button type="button" onClick={() => updateStatus('available')}>
        <span className="dot success"></span> ว่าง
      </button>
      <button type="button" onClick={() => updateStatus('repair')}>
        <span className="dot danger"></span> ซ่อม
      </button>
      <button type="button" onClick={() => updateStatus('wash')}>
        <span className="dot warning"></span> ซัก
      </button>
    </>
  )
}

function SubSkuPreview({ draft }: { draft: StockDraft }) {
  const count = Number(draft.setCount)
  let baseSku = draft.sku.trim()
  const suffixRegex = /-(\d{2,})$/
  const match = baseSku.match(suffixRegex)
  if (match) baseSku = baseSku.replace(suffixRegex, '')

  const skus = Array.from({ length: Math.min(count, 20) }, (_, index) => `${baseSku}-${String(index + 1).padStart(2, '0')}`)

  return (
    <div
      className="sub-sku-preview"
      style={{
        marginTop: '12px',
        padding: '12px 16px',
        background: 'rgba(223, 183, 80, 0.06)',
        border: '1px solid rgba(223, 183, 80, 0.2)',
        borderRadius: '10px',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>⚡</span> ระบบจะสร้าง {count} รายการแยก Sub-SKU อัตโนมัติ
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {skus.map((sku) => (
          <span
            key={sku}
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: 'rgba(223, 183, 80, 0.12)',
              border: '1px solid rgba(223, 183, 80, 0.25)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-gold)',
              fontFamily: 'monospace',
            }}
          >
            {sku}
          </span>
        ))}
        {count > 20 && <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 6px' }}>...และอีก {count - 20} รายการ</span>}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
        แต่ละชุดจะมีสถานะเช่าแยกกัน สามารถติดตามได้ว่าชุดไหนว่าง ชุดไหนมีคนเช่าอยู่
      </p>
    </div>
  )
}

function renderStockStatusPill(status: string) {
  switch (status) {
    case 'rented':
      return (
        <span
          className="status-pill"
          style={{
            background: 'rgba(218, 165, 32, 0.15)',
            color: '#ead483',
            border: '1px solid rgba(218, 165, 32, 0.3)',
          }}
        >
          ถูกเช่า
        </span>
      )
    case 'booked':
      return (
        <span
          className="status-pill"
          style={{
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          มีคิวจอง
        </span>
      )
    case 'repair':
      return <span className="status-pill danger">ซ่อม</span>
    case 'wash':
      return <span className="status-pill warning">ซัก</span>
    case 'available':
    default:
      return <span className="status-pill success">ว่าง</span>
  }
}

function CurrencyField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="field currency-field">
      <span>{label}</span>
      <div className="currency-input">
        <strong>฿</strong>
        <input value={value} inputMode="decimal" type="number" placeholder="0.00" onChange={(event) => onChange(event.target.value)} />
      </div>
    </label>
  )
}

function InventoryMetricCard({
  label,
  value,
  icon,
  type,
  unit,
}: {
  label: string
  value: string
  icon: React.ReactNode
  type: 'total' | 'verified' | 'risk' | 'incomplete'
  unit?: string
}) {
  return (
    <div className={`metric-card ${type}`}>
      <div className="metric-icon-wrapper">{icon}</div>
      <div className="card-content">
        <span>{label}</span>
        <strong>
          {value} {unit && <span className="unit">{unit}</span>}
        </strong>
      </div>
    </div>
  )
}

function InventoryTextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  ...rest
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} {...rest} />
    </label>
  )
}

function formatBaht(value: number) {
  return `฿${value.toLocaleString('th-TH', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
