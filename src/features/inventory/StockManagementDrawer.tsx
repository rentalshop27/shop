import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { PackagePlus, Search, Trash2, X } from 'lucide-react'
import { getInventoryDisplayStatus } from './inventoryStatus'
import type { ProductWithStockSummary, StockItemStatus, StockItem } from './inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

export type StockManagementDrawerProps = {
  product: ProductWithStockSummary
  rentals: RentalOrder[]
  today: string
  isSaving: boolean
  onClose: () => void
  onAddStock: (productId: string, size: string, quantity: number) => void
  onDeleteVariant?: (productId: string, stockId: string) => void
  onUpdateStatus: (productId: string, stockId: string, status: StockItemStatus) => void
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom']
const displayStatusLabels: Record<'rented' | 'booked' | StockItemStatus, string> = {
  rented: 'ถูกเช่า',
  booked: 'มีคิวจอง',
  available: 'ว่าง',
  repair: 'ซ่อม',
  wash: 'ซัก',
}

export function StockManagementDrawer({
  product,
  rentals,
  today,
  isSaving,
  onClose,
  onAddStock,
  onDeleteVariant,
  onUpdateStatus,
}: StockManagementDrawerProps) {
  const [query, setQuery] = useState('')
  const [addSize, setAddSize] = useState('S')
  const [addQty, setAddQty] = useState(1)

  // Filter stock items by SKU or Size based on the search query
  const filteredStockItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return product.stockItems

    return product.stockItems.filter(si => {
      return (
        si.sku.toLowerCase().includes(normalizedQuery) ||
        si.size.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [product.stockItems, query])

  // Group the filtered items by size, sorted by SIZES array
  const groupedBySize = useMemo(() => {
    const grouped: Record<string, StockItem[]> = {}
    filteredStockItems.forEach(si => {
      grouped[si.size] = grouped[si.size] || []
      grouped[si.size].push(si)
    })
    
    // Sort keys based on SIZES array order
    return Object.keys(grouped).sort((a, b) => {
      const indexA = SIZES.indexOf(a)
      const indexB = SIZES.indexOf(b)
      if (indexA === -1 && indexB === -1) return a.localeCompare(b)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    }).map(size => ({
      size,
      items: grouped[size]
    }))
  }, [filteredStockItems])

  const handleAddStock = () => {
    if (addQty < 1) return
    onAddStock(product.id, addSize, addQty)
    setAddQty(1)
  }

  const drawerContent = (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <section 
        className="drawer-panel" 
        aria-label="จัดการคลังชุดย่อย" 
        onClick={e => e.stopPropagation()}
      >
        <div className="drawer-header">
          <div>
            <h2>⚙️ จัดการคลังชุดย่อย (Base SKU: {product.baseSku})</h2>
            <p className="subtitle">
              ชุด: {product.productName} ({[product.brand, product.category].filter(Boolean).join(' | ') || '-'})
            </p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose} aria-label="ปิด">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Add Stock Section */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px', background: 'rgba(218, 165, 32, 0.05)', padding: '16px', borderRadius: '8px', border: '1px dashed rgba(218, 165, 32, 0.2)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PackagePlus size={18} /> เติมสต็อก:
            </span>
            <select 
              value={addSize} 
              onChange={e => setAddSize(e.target.value)} 
              disabled={isSaving}
              style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', flexGrow: 1 }}
            >
              {SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
            </select>
            <input 
              type="number" 
              min="1" 
              value={addQty} 
              onChange={e => setAddQty(parseInt(e.target.value) || 1)} 
              disabled={isSaving}
              style={{ width: '70px', padding: '8px 12px', borderRadius: '6px', background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }} 
            />
            <button 
              type="button" 
              onClick={handleAddStock} 
              disabled={isSaving}
              className="primary-button compact" 
              style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            >
              + เติมสต็อก
            </button>
          </div>

          {/* Search Box */}
          <label className="drawer-search-box">
            <Search size={20} color="var(--text-muted)" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ค้นหา SKU / กรองไซส์..."
            />
          </label>

          {/* Stock Items Grouped by Size */}
          {groupedBySize.length === 0 ? (
            <div className="empty-state">ไม่มีรายการที่ตรงกับคำค้นหา</div>
          ) : (
            groupedBySize.map(({ size, items }) => (
              <div key={size} className="drawer-size-group">
                <div className="drawer-size-group-header">
                  Group by: ไซส์ {size} ({items.length} ตัว)
                </div>
                {items.map(si => {
                  const { primaryStatus } = getInventoryDisplayStatus(si, rentals, today)
                  const statusValue = primaryStatus === 'rented' || primaryStatus === 'booked' ? primaryStatus : si.status
                  return (
                    <div key={si.id} className="drawer-item-row">
                      <span className="drawer-item-sku">{si.sku}</span>
                      <div className="drawer-item-actions">
                        <select 
                          aria-label={`สถานะของ ${si.sku}`}
                          value={statusValue} 
                          onChange={(e) => onUpdateStatus(product.id, si.id, e.target.value as StockItemStatus)}
                          disabled={isSaving}
                          style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          {(primaryStatus === 'rented' || primaryStatus === 'booked') && (
                            <option value={primaryStatus} disabled>{displayStatusLabels[primaryStatus]}</option>
                          )}
                          <option value="available">ว่าง</option>
                          <option value="repair">ซ่อม</option>
                          <option value="wash">ซัก</option>
                        </select>
                        {primaryStatus === 'rented' && <span className="status-pill warning" style={{ zoom: 0.85 }}>ถูกเช่า</span>}
                        {primaryStatus === 'booked' && <span className="status-pill success" style={{ zoom: 0.85 }}>มีคิวจอง</span>}
                        {onDeleteVariant && (
                          <button
                            type="button"
                            onClick={() => onDeleteVariant(product.id, si.id)}
                            disabled={isSaving}
                            style={{ background: 'none', border: 'none', color: 'var(--danger-glow)', cursor: 'pointer', padding: '4px', marginLeft: '4px' }}
                            title="ลบตัวชุดนี้"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )

  return createPortal(drawerContent, document.body)
}
