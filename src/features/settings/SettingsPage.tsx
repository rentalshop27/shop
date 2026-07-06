import { useEffect, useState } from 'react'
import { Plus, Trash2, Tag, Shirt, AlertCircle, CheckCircle, Palette, Globe2, Users, Copy } from 'lucide-react'
import { getUserFacingErrorMessage } from '../../lib/errorMessages'
import { sanitizeNumericInput } from '../../lib/numericInput'
import { supabase } from '../../lib/supabase'
import { getShopMembers, createShopMember, removeShopMember, type ShopMember } from './shopMembersRemote'

interface SettingsPageProps {
  canManageShopSettings: boolean
  canManageStaff: boolean
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
  activeTab: 'general' | 'inventory' | 'staff' | 'notifications' | 'integrations'
  onTabChange: (tab: 'general' | 'inventory' | 'staff' | 'notifications' | 'integrations') => void
  shopId: string | null
}

function cloneRentalTiers(tiers: {days: number; price: number}[]) {
  return tiers.map((tier) => ({ ...tier }))
}

const SETTINGS_COMING_SOON_TABS = [
  { id: 'staff', label: 'สิทธิ์พนักงาน' },
  { id: 'notifications', label: 'การแจ้งเตือน' },
  { id: 'integrations', label: 'เชื่อมต่อระบบ' },
] as const

export function SettingsPage(props: SettingsPageProps) {
  // Form states kept in parent to prevent loss on unmount (Tab switching)
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

    if (props.brands.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      setBrandError('มีแบรนด์นี้อยู่ในระบบแล้ว')
      return
    }

    props.onAddBrand(trimmed)
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

    if (props.categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError('มีประเภทชุดนี้อยู่ในระบบแล้ว')
      return
    }

    props.onAddCategory(trimmed)
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

    if (props.colors.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setColorError('มีสีหลักนี้อยู่ในระบบแล้ว')
      return
    }

    props.onAddColor(trimmed)
    setNewColor('')
    setColorSuccess(`เพิ่มสีหลัก "${trimmed}" สำเร็จแล้ว`)
    setTimeout(() => setColorSuccess(''), 3000)
  }

  const handleDeleteBrandClick = (brandName: string) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแบรนด์ "${brandName}"?`)
    if (confirmed) {
      props.onDeleteBrand(brandName)
      setBrandSuccess(`ลบแบรนด์ "${brandName}" สำเร็จ`)
      setTimeout(() => setBrandSuccess(''), 3000)
    }
  }

  const handleDeleteCategoryClick = (categoryName: string) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประเภทชุด "${categoryName}"?`)
    if (confirmed) {
      props.onDeleteCategory(categoryName)
      setCategorySuccess(`ลบประเภทชุด "${categoryName}" สำเร็จ`)
      setTimeout(() => setCategorySuccess(''), 3000)
    }
  }

  const handleDeleteColorClick = (colorName: string) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสีหลัก "${colorName}"?`)
    if (confirmed) {
      props.onDeleteColor(colorName)
      setColorSuccess(`ลบสีหลัก "${colorName}" สำเร็จ`)
      setTimeout(() => setColorSuccess(''), 3000)
    }
  }

  const readyTabs: Array<{ id: 'general' | 'inventory' | 'staff'; label: string }> = [
    ...(props.canManageShopSettings
      ? [
          { id: 'general' as const, label: 'ตั้งค่าทั่วไป' },
          { id: 'inventory' as const, label: 'ตัวเลือกสินค้า' },
        ]
      : []),
    ...(props.canManageStaff ? [{ id: 'staff' as const, label: 'สิทธิ์พนักงาน' }] : []),
  ]

  const comingSoonTabs = SETTINGS_COMING_SOON_TABS.filter((tab) => {
    if (tab.id === 'staff') return false
    if (tab.id === 'notifications' || tab.id === 'integrations') {
      return props.canManageShopSettings
    }
    return true
  })

  const activeTab = readyTabs.some((tab) => tab.id === props.activeTab)
    ? props.activeTab
    : (readyTabs[0]?.id ?? 'general')

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>ตั้งค่าระบบ</h1>
          <p className="subtitle">จัดการตัวเลือกพื้นฐานสำหรับระบบร้านเช่าชุด Precious Shop</p>
        </div>
      </header>

      <div className="settings-mobile-nav">
        <div className="settings-mobile-tablist" role="tablist" aria-label="Settings tabs">
          {readyTabs.map(({ id, label }) => (
            <button
              key={id}
              id={`settings-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`settings-panel-${id}`}
              onClick={() => props.onTabChange(id)}
              className={`settings-tab-btn ${activeTab === id ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="settings-mobile-coming-soon" aria-label="Settings sections coming soon">
          {comingSoonTabs.map(({ id, label }) => (
            <button key={id} type="button" disabled className="settings-tab-btn disabled">
              {label}
              <span className="settings-tab-badge">เร็ว ๆ นี้</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'general' && <GeneralSettingsTab {...props} />}

      {activeTab === 'inventory' && (
        <InventorySettingsTab
          brands={props.brands}
          categories={props.categories}
          colors={props.colors}
          newBrand={newBrand}
          setNewBrand={setNewBrand}
          brandError={brandError}
          brandSuccess={brandSuccess}
          handleAddBrandSubmit={handleAddBrandSubmit}
          handleDeleteBrandClick={handleDeleteBrandClick}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          categoryError={categoryError}
          categorySuccess={categorySuccess}
          handleAddCategorySubmit={handleAddCategorySubmit}
          handleDeleteCategoryClick={handleDeleteCategoryClick}
          newColor={newColor}
          setNewColor={setNewColor}
          colorError={colorError}
          colorSuccess={colorSuccess}
          handleAddColorSubmit={handleAddColorSubmit}
          handleDeleteColorClick={handleDeleteColorClick}
        />
      )}

      {activeTab === 'staff' && <StaffSettingsTab shopId={props.shopId} />}
    </>
  )
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

function GeneralSettingsTab(props: SettingsPageProps) {
  return (
    <section
      id="settings-panel-general"
      role="tabpanel"
      aria-labelledby="settings-tab-general"
      className="settings-grid"
      style={{ marginTop: 0 }}
    >
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
            {props.defaultRentalPrices.map((tier, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                <label className="field">
                  <span>ระยะเวลา (วัน)</span>
                  <input
                    type="number"
                    min="1"
                    value={tier.days}
                    onChange={(e) => {
                      const newPrices = cloneRentalTiers(props.defaultRentalPrices)
                      newPrices[index].days = parseInt(e.target.value) || 1
                      props.onUpdateDefaultRentalPrices(newPrices)
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
                      const newPrices = cloneRentalTiers(props.defaultRentalPrices)
                      newPrices[index].price = parseInt(e.target.value) || 0
                      props.onUpdateDefaultRentalPrices(newPrices)
                    }}
                  />
                </label>
                {props.defaultRentalPrices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newPrices = props.defaultRentalPrices.filter((_, i) => i !== index)
                      props.onUpdateDefaultRentalPrices(newPrices)
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
              onClick={() => props.onUpdateDefaultRentalPrices([...cloneRentalTiers(props.defaultRentalPrices), { days: 1, price: 0 }])}
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
                value={props.defaultDeposit}
                onChange={(e) => props.onUpdateDefaultDeposit(parseInt(e.target.value) || 0)}
              />
            </label>
            <label className="field">
              <span>เกณฑ์ค่าปรับล่าช้าเริ่มต้น (บาท / วัน)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={props.defaultLateFinePerDay}
                onChange={(e) => {
                  const sanitized = sanitizeNumericInput(e.target.value)
                  props.onUpdateDefaultLateFinePerDay(sanitized ? Number(sanitized) : 0)
                }}
              />
            </label>
          </div>
        </div>
      </section>

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
            checked={props.publicCatalogEnabled}
            onChange={(event) => props.onPublicCatalogEnabledChange(event.target.checked)}
          />
          <span>
            {props.publicCatalogEnabled ? 'เปิด public catalog แล้ว' : 'ปิด public catalog อยู่'}
            <small>ชุดแต่ละรายการต้องเปิด “โชว์ชุดนี้ในหน้า public catalog” เพิ่มด้วย</small>
          </span>
        </label>
      </section>
    </section>
  )
}

interface InventorySettingsTabProps {
  brands: string[]
  categories: string[]
  colors: string[]
  newBrand: string
  setNewBrand: (val: string) => void
  brandError: string
  brandSuccess: string
  handleAddBrandSubmit: (e: React.FormEvent) => void
  handleDeleteBrandClick: (brand: string) => void
  newCategory: string
  setNewCategory: (val: string) => void
  categoryError: string
  categorySuccess: string
  handleAddCategorySubmit: (e: React.FormEvent) => void
  handleDeleteCategoryClick: (category: string) => void
  newColor: string
  setNewColor: (val: string) => void
  colorError: string
  colorSuccess: string
  handleAddColorSubmit: (e: React.FormEvent) => void
  handleDeleteColorClick: (color: string) => void
}

function InventorySettingsTab(props: InventorySettingsTabProps) {
  return (
    <section
      id="settings-panel-inventory"
      role="tabpanel"
      aria-labelledby="settings-tab-inventory"
      className="settings-grid"
      style={{ marginTop: 0 }}
    >
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

        <form onSubmit={props.handleAddBrandSubmit} className="settings-form">
          <div className="inline-input-group">
            <label className="field no-margin">
              <span className="sr-only">ชื่อแบรนด์</span>
              <input
                type="text"
                value={props.newBrand}
                onChange={(e) => props.setNewBrand(e.target.value)}
                placeholder="เช่น Chanel, Dior, Precious..."
              />
            </label>
            <button className="primary-button add-btn" type="submit">
              <Plus size={18} />
              เพิ่มแบรนด์
            </button>
          </div>
        </form>

        {props.brandError && (
          <div className="settings-alert error">
            <AlertCircle size={16} />
            <span>{props.brandError}</span>
          </div>
        )}

        {props.brandSuccess && (
          <div className="settings-alert success">
            <CheckCircle size={16} />
            <span>{props.brandSuccess}</span>
          </div>
        )}

        <div className="settings-list-container">
          <div className="list-header">
            <span>รายชื่อแบรนด์ทั้งหมด ({props.brands.length})</span>
          </div>
          <div className="settings-list">
            {props.brands.map((brand) => (
              <div key={brand} className="settings-list-item">
                <span className="item-text">{brand}</span>
                <button
                  className="delete-item-btn"
                  type="button"
                  title={`ลบแบรนด์ ${brand}`}
                  onClick={() => props.handleDeleteBrandClick(brand)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {props.brands.length === 0 && (
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

        <form onSubmit={props.handleAddColorSubmit} className="settings-form">
          <div className="inline-input-group">
            <label className="field no-margin">
              <span className="sr-only">ชื่อสีหลัก</span>
              <input
                type="text"
                value={props.newColor}
                onChange={(e) => props.setNewColor(e.target.value)}
                placeholder="เช่น เขียวมรกต, ฟ้าอ่อน, เงินเมทัลลิก..."
              />
            </label>
            <button className="primary-button add-btn" type="submit">
              <Plus size={18} />
              เพิ่มสี
            </button>
          </div>
        </form>

        {props.colorError && (
          <div className="settings-alert error">
            <AlertCircle size={16} />
            <span>{props.colorError}</span>
          </div>
        )}

        {props.colorSuccess && (
          <div className="settings-alert success">
            <CheckCircle size={16} />
            <span>{props.colorSuccess}</span>
          </div>
        )}

        <div className="settings-list-container">
          <div className="list-header">
            <span>รายการสีหลักทั้งหมด ({props.colors.length})</span>
          </div>
          <div className="settings-list">
            {props.colors.map((color) => (
              <div key={color} className="settings-list-item">
                <span className="item-text">{color}</span>
                <button
                  className="delete-item-btn"
                  type="button"
                  title={`ลบสีหลัก ${color}`}
                  onClick={() => props.handleDeleteColorClick(color)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {props.colors.length === 0 && (
              <div className="settings-empty-state">
                ยังไม่มีสีหลักในระบบ กรุณาเพิ่มสีหลักใหม่
              </div>
            )}
          </div>
        </div>
      </section>

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

        <form onSubmit={props.handleAddCategorySubmit} className="settings-form">
          <div className="inline-input-group">
            <label className="field no-margin">
              <span className="sr-only">ชื่อประเภทชุด</span>
              <input
                type="text"
                value={props.newCategory}
                onChange={(e) => props.setNewCategory(e.target.value)}
                placeholder="เช่น ชุดไทยสตรี, ชุดสูททางการ..."
              />
            </label>
            <button className="primary-button add-btn" type="submit">
              <Plus size={18} />
              เพิ่มประเภท
            </button>
          </div>
        </form>

        {props.categoryError && (
          <div className="settings-alert error">
            <AlertCircle size={16} />
            <span>{props.categoryError}</span>
          </div>
        )}

        {props.categorySuccess && (
          <div className="settings-alert success">
            <CheckCircle size={16} />
            <span>{props.categorySuccess}</span>
          </div>
        )}

        <div className="settings-list-container">
          <div className="list-header">
            <span>รายการประเภทชุดทั้งหมด ({props.categories.length})</span>
          </div>
          <div className="settings-list">
            {props.categories.map((category) => (
              <div key={category} className="settings-list-item">
                <span className="item-text">{category}</span>
                <button
                  className="delete-item-btn"
                  type="button"
                  title={`ลบประเภทชุด ${category}`}
                  onClick={() => props.handleDeleteCategoryClick(category)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {props.categories.length === 0 && (
              <div className="settings-empty-state">
                ยังไม่มีประเภทชุดในระบบ กรุณาเพิ่มประเภทชุดใหม่
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  )
}

function StaffSettingsTab({ shopId }: { shopId: string | null }) {
  const [members, setMembers] = useState<ShopMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'manager' | 'staff'>('staff')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createdMemberInfo, setCreatedMemberInfo] = useState<{email: string, password: string} | null>(null)

  useEffect(() => {
    if (!shopId || !supabase) {
      setMembers([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    void getShopMembers(supabase, shopId)
      .then((data) => {
        if (!cancelled) {
          setMembers(data)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setError(getUserFacingErrorMessage(error))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [shopId])

  async function refreshMembers() {
    if (!shopId || !supabase) return
    setLoading(true)
    setError('')
    try {
      const data = await getShopMembers(supabase, shopId)
      setMembers(data)
    } catch (error: unknown) {
      setError(getUserFacingErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!shopId || !supabase) return
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่านชั่วคราว')
      return
    }

    setError('')
    setSuccess('')
    setIsSubmitting(true)
    try {
      await createShopMember(supabase, shopId, email, password, role)
      setCreatedMemberInfo({ email, password })
      setEmail('')
      setPassword('')
      setRole('staff')
      await refreshMembers()
    } catch (error: unknown) {
      setError(getUserFacingErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!shopId || !supabase) return
    const confirmed = window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้?')
    if (!confirmed) return

    setError('')
    setSuccess('')
    try {
      await removeShopMember(supabase, shopId, userId)
      setSuccess('ลบพนักงานเรียบร้อยแล้ว')
      await refreshMembers()
    } catch (error: unknown) {
      setError(getUserFacingErrorMessage(error))
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      alert('คัดลอกลงคลิปบอร์ดแล้ว')
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  return (
    <section
      id="settings-panel-staff"
      role="tabpanel"
      aria-labelledby="settings-tab-staff"
      className="settings-grid"
      style={{ marginTop: 0 }}
    >
      {createdMemberInfo && (
        <div className="settings-alert success" style={{ display: 'block', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '8px', marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--success-glow)' }}>🎉 สร้างบัญชีพนักงานสำเร็จ!</h3>
          <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>ลิงก์เข้าระบบ:</strong> {window.location.origin}</p>
          <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>อีเมล:</strong> {createdMemberInfo.email}</p>
          <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>รหัสผ่านชั่วคราว:</strong> {createdMemberInfo.password}</p>
          <p style={{ margin: '8px 0 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>(คำแนะนำ: กรุณาแจ้งให้พนักงานทำการเปลี่ยนรหัสผ่านใหม่ทันทีในหน้าโปรไฟล์หลังเข้าสู่ระบบครั้งแรก)</p>
          
          <div style={{ display: 'flex', gap: '8px' }}>
             <button 
                type="button" 
                className="secondary-button"
                onClick={() => {
                  const text = `ลิงก์เข้าระบบ: ${window.location.origin}\nอีเมล: ${createdMemberInfo.email}\nรหัสผ่านชั่วคราว: ${createdMemberInfo.password}\n\n(กรุณาเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก)`
                  copyToClipboard(text)
                }}
              >
                <Copy size={16} /> คัดลอกข้อความเพื่อส่ง
             </button>
             <button 
                type="button" 
                className="ghost-button"
                onClick={() => setCreatedMemberInfo(null)}
              >
                ปิดหน้าต่าง
             </button>
          </div>
        </div>
      )}

      <section className="panel settings-panel" aria-labelledby="staff-add-title">
        <div className="panel-header-row">
          <div className="title-icon-wrapper" style={{ color: 'var(--text-color)', background: 'var(--surface-light)' }}>
            <Users size={22} />
          </div>
          <div>
            <h2 id="staff-add-title" className="panel-section-title">เพิ่มพนักงานใหม่</h2>
            <p className="panel-section-subtitle">ระบบจะสร้างบัญชีให้และพนักงานสามารถล็อกอินด้วยอีเมลและรหัสผ่านชั่วคราวได้ทันที</p>
          </div>
        </div>

        <form onSubmit={handleAddSubmit} className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-grid">
            <label className="field">
              <span>อีเมลพนักงาน</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={isSubmitting}
              />
            </label>
            <label className="field">
              <span>รหัสผ่านชั่วคราว</span>
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                disabled={isSubmitting}
              />
            </label>
          </div>
          <div className="field">
            <span>ระดับสิทธิ์การเข้าถึง</span>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="staff" 
                  checked={role === 'staff'} 
                  onChange={() => setRole('staff')} 
                  disabled={isSubmitting}
                />
                <span>พนักงานทั่วไป (Staff)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="manager" 
                  checked={role === 'manager'} 
                  onChange={() => setRole('manager')} 
                  disabled={isSubmitting}
                />
                <span>ผู้จัดการ (Manager)</span>
              </label>
            </div>
          </div>
          <button className="primary-button" type="submit" disabled={isSubmitting} style={{ alignSelf: 'flex-start' }}>
            {isSubmitting ? 'กำลังสร้างบัญชี...' : <><Plus size={18} /> เพิ่มพนักงาน</>}
          </button>
        </form>

        {error && (
          <div className="settings-alert error" style={{ marginTop: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="settings-alert success" style={{ marginTop: '16px' }}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}
      </section>

      <section className="panel settings-panel">
         <div className="list-header">
            <span>รายชื่อทีมงานทั้งหมด ({members.length})</span>
          </div>
          <div className="settings-list">
            {loading ? (
               <div className="settings-empty-state">กำลังโหลดรายชื่อ...</div>
            ) : members.length === 0 ? (
              <div className="settings-empty-state">ไม่มีรายชื่อพนักงาน</div>
            ) : (
              members.map((member) => (
                <div key={member.user_id} className="settings-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                     <span className="item-text" style={{ fontWeight: 600 }}>{member.email}</span>
                     <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '8px', padding: '2px 6px', background: 'var(--surface-light)', borderRadius: '4px' }}>
                        {member.role === 'owner' ? 'เจ้าของร้าน' : member.role === 'manager' ? 'ผู้จัดการ' : 'พนักงาน'}
                     </span>
                  </div>
                  {member.role !== 'owner' && (
                     <button
                        className="delete-item-btn"
                        type="button"
                        title="ลบพนักงาน"
                        onClick={() => handleRemoveMember(member.user_id)}
                     >
                        <Trash2 size={16} />
                     </button>
                  )}
                </div>
              ))
            )}
          </div>
      </section>
    </section>
  )
}
