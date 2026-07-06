import { useState } from 'react'
import { Plus, Trash2, Tag, Shirt, AlertCircle, CheckCircle, Palette, Globe2 } from 'lucide-react'

interface SettingsPageProps {
  brands: string[]
  categories: string[]
  colors: string[]
  publicCatalogEnabled: boolean
  onAddBrand: (brand: string) => void
  onDeleteBrand: (brand: string) => void
  onAddCategory: (category: string) => void
  onDeleteCategory: (category: string) => void
  onAddColor: (color: string) => void
  onDeleteColor: (color: string) => void
  onPublicCatalogEnabledChange: (enabled: boolean) => void
  defaultRentalPrices: {days: number; price: number}[]
  onUpdateDefaultRentalPrices: (prices: {days: number; price: number}[]) => void
  defaultDeposit: number
  onUpdateDefaultDeposit: (deposit: number) => void
  defaultLateFinePerDay: number
  onUpdateDefaultLateFinePerDay: (fine: number) => void
}

function cloneRentalTiers(tiers: {days: number; price: number}[]) {
  return tiers.map((tier) => ({ ...tier }))
}

export function SettingsPage({
  brands,
  categories,
  colors,
  publicCatalogEnabled,
  onAddBrand,
  onDeleteBrand,
  onAddCategory,
  onDeleteCategory,
  onAddColor,
  onDeleteColor,
  onPublicCatalogEnabledChange,
  defaultRentalPrices,
  onUpdateDefaultRentalPrices,
  defaultDeposit,
  onUpdateDefaultDeposit,
  defaultLateFinePerDay,
  onUpdateDefaultLateFinePerDay,
}: SettingsPageProps) {
  const [newBrand, setNewBrand] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newColor, setNewColor] = useState('')
  const [brandError, setBrandError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [colorError, setColorError] = useState('')
  const [brandSuccess, setBrandSuccess] = useState('')
  const [categorySuccess, setCategorySuccess] = useState('')
  const [colorSuccess, setColorSuccess] = useState('')

  const handleAddBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBrandError('')
    setBrandSuccess('')

    const trimmed = newBrand.trim()
    if (!trimmed) {
      setBrandError('กรุณากรอกชื่อแบรนด์')
      return
    }

    if (brands.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      setBrandError('มีแบรนด์นี้อยู่ในระบบแล้ว')
      return
    }

    onAddBrand(trimmed)
    setNewBrand('')
    setBrandSuccess(`เพิ่มแบรนด์ "${trimmed}" สำเร็จแล้ว`)
    setTimeout(() => setBrandSuccess(''), 3000)
  }

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCategoryError('')
    setCategorySuccess('')

    const trimmed = newCategory.trim()
    if (!trimmed) {
      setCategoryError('กรุณากรอกประเภทชุด')
      return
    }

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError('มีประเภทชุดนี้อยู่ในระบบแล้ว')
      return
    }

    onAddCategory(trimmed)
    setNewCategory('')
    setCategorySuccess(`เพิ่มประเภทชุด "${trimmed}" สำเร็จแล้ว`)
    setTimeout(() => setCategorySuccess(''), 3000)
  }

  const handleAddColorSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setColorError('')
    setColorSuccess('')

    const trimmed = newColor.trim()
    if (!trimmed) {
      setColorError('กรุณากรอกชื่อสีหลัก')
      return
    }

    if (colors.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setColorError('มีสีหลักนี้อยู่ในระบบแล้ว')
      return
    }

    onAddColor(trimmed)
    setNewColor('')
    setColorSuccess(`เพิ่มสีหลัก "${trimmed}" สำเร็จแล้ว`)
    setTimeout(() => setColorSuccess(''), 3000)
  }

  const handleDeleteBrandClick = (brandName: string) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแบรนด์ "${brandName}"?`)
    if (confirmed) {
      onDeleteBrand(brandName)
      setBrandSuccess(`ลบแบรนด์ "${brandName}" สำเร็จ`)
      setTimeout(() => setBrandSuccess(''), 3000)
    }
  }

  const handleDeleteCategoryClick = (categoryName: string) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประเภทชุด "${categoryName}"?`)
    if (confirmed) {
      onDeleteCategory(categoryName)
      setCategorySuccess(`ลบประเภทชุด "${categoryName}" สำเร็จ`)
      setTimeout(() => setCategorySuccess(''), 3000)
    }
  }

  const handleDeleteColorClick = (colorName: string) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสีหลัก "${colorName}"?`)
    if (confirmed) {
      onDeleteColor(colorName)
      setColorSuccess(`ลบสีหลัก "${colorName}" สำเร็จ`)
      setTimeout(() => setColorSuccess(''), 3000)
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>ตั้งค่าระบบ</h1>
          <p className="subtitle">จัดการตัวเลือกพื้นฐานสำหรับระบบร้านเช่าชุด Precious Shop</p>
        </div>
      </header>

      <div className="settings-grid">
        {/* Global Rental Defaults Section */}
        <section className="panel settings-panel" aria-labelledby="global-defaults-title">
          <div className="section-header">
            <h2 id="global-defaults-title">
              ⚙️ ตั้งค่าระบบราคาและค่าปรับเริ่มต้น (Global Rental Defaults)
            </h2>
            <p className="section-subtitle">
              บันทึกราคาแพ็กเกจและเกณฑ์ค่าปรับมาตรฐาน เพื่อให้ระบบดึงไปใช้เวลาเพิ่มชุดใหม่ทันที
            </p>
          </div>

          <div style={{ marginTop: '24px', padding: '16px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-color)' }}>กำหนดแพ็กเกจราคาเช่าเริ่มต้นของร้าน</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {defaultRentalPrices.map((tier, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                  <label className="field">
                    <span>ระยะเวลา (วัน)</span>
                    <input
                      type="number"
                      min="1"
                      value={tier.days}
                      onChange={(e) => {
                        const newPrices = cloneRentalTiers(defaultRentalPrices)
                        newPrices[index].days = parseInt(e.target.value) || 1
                        onUpdateDefaultRentalPrices(newPrices)
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>ราคารวม (บาท)</span>
                    <input
                      type="number"
                      min="0"
                      value={tier.price}
                      onChange={(e) => {
                        const newPrices = cloneRentalTiers(defaultRentalPrices)
                        newPrices[index].price = parseInt(e.target.value) || 0
                        onUpdateDefaultRentalPrices(newPrices)
                      }}
                    />
                  </label>
                  {defaultRentalPrices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newPrices = defaultRentalPrices.filter((_, i) => i !== index)
                        onUpdateDefaultRentalPrices(newPrices)
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--danger-glow)', cursor: 'pointer', padding: '8px', marginBottom: '4px' }}
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => onUpdateDefaultRentalPrices([...cloneRentalTiers(defaultRentalPrices), { days: 1, price: 0 }])}
                style={{ marginTop: '8px', padding: '10px', width: '100%', background: 'none', border: '1px dashed rgba(218, 165, 32, 0.4)', borderRadius: '8px', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
              >
                <Plus size={18} /> เพิ่มแพ็กเกจวันใหม่
              </button>
            </div>
          </div>

          <div style={{ marginTop: '24px', padding: '16px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-color)' }}>ค่าประกัน & ค่าปรับเริ่มต้น</h3>
            <div className="form-grid">
              <label className="field">
                <span>เงินประกัน (มัดจำ) เริ่มต้น (บาท)</span>
                <input
                  type="number"
                  min="0"
                  value={defaultDeposit}
                  onChange={(e) => onUpdateDefaultDeposit(parseInt(e.target.value) || 0)}
                />
              </label>
              <label className="field">
                <span>เกณฑ์ค่าปรับล่าช้าเริ่มต้น (บาท / วัน)</span>
                <input
                  type="number"
                  min="0"
                  value={defaultLateFinePerDay}
                  onChange={(e) => onUpdateDefaultLateFinePerDay(parseInt(e.target.value) || 0)}
                />
              </label>
            </div>
          </div>
        </section>

        {/* Public Catalog Settings Section */}
        <section className="panel settings-panel settings-public-panel" aria-labelledby="public-catalog-title">
          <div className="panel-header-row">
            <div className="title-icon-wrapper brand-theme">
              <Globe2 size={22} />
            </div>
            <div>
              <h2 id="public-catalog-title" className="panel-section-title">Public catalog</h2>
              <p className="panel-section-subtitle">เปิดเมื่อต้องการให้ลูกค้าเข้าลิงก์หน้ารายการชุดได้โดยไม่ต้องล็อกอิน</p>
            </div>
          </div>

          <label className="settings-toggle-row">
            <input
              type="checkbox"
              checked={publicCatalogEnabled}
              onChange={(event) => onPublicCatalogEnabledChange(event.target.checked)}
            />
            <span>
              {publicCatalogEnabled ? 'เปิด public catalog แล้ว' : 'ปิด public catalog อยู่'}
              <small>ชุดแต่ละรายการต้องเปิด “โชว์ชุดนี้ในหน้า public catalog” เพิ่มด้วย</small>
            </span>
          </label>
        </section>

        {/* Brand Settings Section */}
        <section className="panel settings-panel" aria-labelledby="brand-title">
          <div className="panel-header-row">
            <div className="title-icon-wrapper brand-theme">
              <Shirt size={22} />
            </div>
            <div>
              <h2 id="brand-title" className="panel-section-title">จัดการแบรนด์ชุด</h2>
              <p className="panel-section-subtitle">เพิ่มหรือลบชื่อแบรนด์ที่จะไปปรากฏในขั้นตอนการเพิ่มชุดเข้าคลัง</p>
            </div>
          </div>

          <form onSubmit={handleAddBrandSubmit} className="settings-form">
            <div className="inline-input-group">
              <label className="field no-margin">
                <span className="sr-only">ชื่อแบรนด์</span>
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="เช่น Chanel, Dior, Precious..."
                />
              </label>
              <button className="primary-button add-btn" type="submit">
                <Plus size={18} />
                เพิ่มแบรนด์
              </button>
            </div>
          </form>

          {brandError && (
            <div className="settings-alert error">
              <AlertCircle size={16} />
              <span>{brandError}</span>
            </div>
          )}

          {brandSuccess && (
            <div className="settings-alert success">
              <CheckCircle size={16} />
              <span>{brandSuccess}</span>
            </div>
          )}

          <div className="settings-list-container">
            <div className="list-header">
              <span>รายชื่อแบรนด์ทั้งหมด ({brands.length})</span>
            </div>
            <div className="settings-list">
              {brands.map((brand) => (
                <div key={brand} className="settings-list-item">
                  <span className="item-text">{brand}</span>
                  <button
                    className="delete-item-btn"
                    type="button"
                    title={`ลบแบรนด์ ${brand}`}
                    onClick={() => handleDeleteBrandClick(brand)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {brands.length === 0 && (
                <div className="settings-empty-state">
                  ยังไม่มีแบรนด์ในระบบ กรุณาเพิ่มแบรนด์ใหม่
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="panel settings-panel" aria-labelledby="color-title">
          <div className="panel-header-row">
            <div className="title-icon-wrapper color-theme">
              <Palette size={22} />
            </div>
            <div>
              <h2 id="color-title" className="panel-section-title">จัดการสีหลัก</h2>
              <p className="panel-section-subtitle">เพิ่มหรือลบตัวเลือกสีหลักที่จะใช้ในขั้นตอนเพิ่มและแก้ไขสต๊อกชุด</p>
            </div>
          </div>

          <form onSubmit={handleAddColorSubmit} className="settings-form">
            <div className="inline-input-group">
              <label className="field no-margin">
                <span className="sr-only">ชื่อสีหลัก</span>
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="เช่น เขียวมรกต, ฟ้าอ่อน, เงินเมทัลลิก..."
                />
              </label>
              <button className="primary-button add-btn" type="submit">
                <Plus size={18} />
                เพิ่มสี
              </button>
            </div>
          </form>

          {colorError && (
            <div className="settings-alert error">
              <AlertCircle size={16} />
              <span>{colorError}</span>
            </div>
          )}

          {colorSuccess && (
            <div className="settings-alert success">
              <CheckCircle size={16} />
              <span>{colorSuccess}</span>
            </div>
          )}

          <div className="settings-list-container">
            <div className="list-header">
              <span>รายการสีหลักทั้งหมด ({colors.length})</span>
            </div>
            <div className="settings-list">
              {colors.map((color) => (
                <div key={color} className="settings-list-item">
                  <span className="item-text">{color}</span>
                  <button
                    className="delete-item-btn"
                    type="button"
                    title={`ลบสีหลัก ${color}`}
                    onClick={() => handleDeleteColorClick(color)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {colors.length === 0 && (
                <div className="settings-empty-state">
                  ยังไม่มีสีหลักในระบบ กรุณาเพิ่มสีหลักใหม่
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Costume Type Settings Section */}
        <section className="panel settings-panel" aria-labelledby="category-title">
          <div className="panel-header-row">
            <div className="title-icon-wrapper category-theme">
              <Tag size={22} />
            </div>
            <div>
              <h2 id="category-title" className="panel-section-title">จัดการประเภทชุด</h2>
              <p className="panel-section-subtitle">เพิ่มหรือลบหมวดหมู่/ประเภทชุดที่จะเลือกใช้ตอนบันทึกสินค้าใหม่</p>
            </div>
          </div>

          <form onSubmit={handleAddCategorySubmit} className="settings-form">
            <div className="inline-input-group">
              <label className="field no-margin">
                <span className="sr-only">ชื่อประเภทชุด</span>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="เช่น ชุดไทยสตรี, ชุดสูททางการ..."
                />
              </label>
              <button className="primary-button add-btn" type="submit">
                <Plus size={18} />
                เพิ่มประเภท
              </button>
            </div>
          </form>

          {categoryError && (
            <div className="settings-alert error">
              <AlertCircle size={16} />
              <span>{categoryError}</span>
            </div>
          )}

          {categorySuccess && (
            <div className="settings-alert success">
              <CheckCircle size={16} />
              <span>{categorySuccess}</span>
            </div>
          )}

          <div className="settings-list-container">
            <div className="list-header">
              <span>รายการประเภทชุดทั้งหมด ({categories.length})</span>
            </div>
            <div className="settings-list">
              {categories.map((category) => (
                <div key={category} className="settings-list-item">
                  <span className="item-text">{category}</span>
                  <button
                    className="delete-item-btn"
                    type="button"
                    title={`ลบประเภทชุด ${category}`}
                    onClick={() => handleDeleteCategoryClick(category)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="settings-empty-state">
                  ยังไม่มีประเภทชุดในระบบ กรุณาเพิ่มประเภทชุดใหม่
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
