import { useEffect, useMemo, useState } from 'react'
import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  FileImage,
  FileText,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  UserRound,
  X,
} from 'lucide-react'
import './index.css'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { RentalsPage } from './features/rentals/RentalsPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { demoRentals, demoStockItemsForRentals } from './features/rentals/rentalSeed'
import type { RentalOrder, RentalStatus } from './features/rentals/rentalTypes'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import { demoCustomers } from './features/customers/customerSeed'
import {
  archiveRemoteCustomer,
  createRemoteCustomer,
  loadCustomers,
  loadOwnerShopId,
  updateRemoteCustomerRisk,
  updateRemoteCustomerStatus,
  uploadRemoteCustomerDocuments,
} from './features/customers/customerRemote'
import type {
  Customer,
  CustomerDocument,
  CustomerDraft,
  CustomerProfileStatus,
  RiskFlag,
} from './features/customers/customerTypes'
import {
  canAddMoreDocuments,
  canCreateRentalForCustomer,
  findPhoneDuplicate,
  formatMeasurements,
  normalizeThaiPhone,
  profileStatusLabel,
  profileStatusTone,
  validateThaiPhone,
} from './features/customers/customerRules'

const emptyDraft: CustomerDraft = {
  fullName: '',
  lineAccount: '',
  phone: '',
  currentAddress: '',
  notes: '',
  profileStatus: 'incomplete',
  riskFlag: 'none',
  bustIn: '',
  waistIn: '',
  hipIn: '',
  heightCm: '',
}

type ViewKey = 'dashboard' | 'inventory' | 'customers' | 'rentals' | 'calendar' | 'settings'

export type StockItem = {
  id: string
  sku: string
  serialNumber: string
  productName: string
  brand: string
  category: string
  size: string
  primaryColor: string
  publicDescription: string
  setCount: number
  rentalPricePerDay: number
  lateFeeRule: string
  depositAmount: number
  imageUrls: string[]
  createdAt: string
}

type StockDraft = {
  sku: string
  serialNumber: string
  productName: string
  brand: string
  category: string
  size: string
  primaryColor: string
  publicDescription: string
  setCount: string
  rentalPricePerDay: string
  lateFeeRule: string
  depositAmount: string
  imageUrls: string[]
}

const emptyStockDraft: StockDraft = {
  sku: '',
  serialNumber: '',
  productName: '',
  brand: '',
  category: '',
  size: 'M',
  primaryColor: 'น้ำเงินมิดไนต์',
  publicDescription: '',
  setCount: '1',
  rentalPricePerDay: '',
  lateFeeRule: '',
  depositAmount: '',
  imageUrls: [],
}

const demoStockItems: StockItem[] = demoStockItemsForRentals

const statusOptions: Array<{ value: 'all' | CustomerProfileStatus; label: string }> = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'incomplete', label: profileStatusLabel.incomplete },
  { value: 'pending_review', label: profileStatusLabel.pending_review },
  { value: 'verified', label: profileStatusLabel.verified },
  { value: 'suspended', label: profileStatusLabel.suspended },
]

function formatBaht(value: number) {
  return `฿${value.toLocaleString('th-TH', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
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
        <input
          value={value}
          inputMode="decimal"
          type="number"
          placeholder="0.00"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  )
}

// SideNav items list is now dynamically defined inside SideNav component

function App() {
  const [activeTab, setActiveTab] = useState<ViewKey>('customers')
  const [customers, setCustomers] = useState<Customer[]>(demoCustomers)
  const [stockItems, setStockItems] = useState<StockItem[]>(demoStockItems)
  const [selectedCustomerId, setSelectedCustomerId] = useState(demoCustomers[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [stockQuery, setStockQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerProfileStatus>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isStockFormOpen, setIsStockFormOpen] = useState(false)
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft)
  const [stockDraft, setStockDraft] = useState<StockDraft>(emptyStockDraft)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [brands, setBrands] = useState<string[]>(() => {
    const saved = localStorage.getItem('precious_brands')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return ['Precious', 'Chanel', 'Dior', 'Gucci']
  })

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('precious_categories')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return ['ชุดราตรี', 'ชุดไทย', 'ชุดสูท', 'ชุดแต่งงาน']
  })

  const [colors, setColors] = useState<string[]>(() => {
    const saved = localStorage.getItem('precious_colors')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return ['น้ำเงินมิดไนต์', 'แดงไวน์', 'ชมพูโรส', 'ทองแชมเปญ', 'ขาวมุก', 'ดำคลาสสิก']
  })

  useEffect(() => {
    localStorage.setItem('precious_brands', JSON.stringify(brands))
  }, [brands])

  useEffect(() => {
    localStorage.setItem('precious_categories', JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem('precious_colors', JSON.stringify(colors))
  }, [colors])

  const handleAddBrand = (brand: string) => {
    setBrands((current) => [...current, brand])
  }

  const handleDeleteBrand = (brand: string) => {
    setBrands((current) => current.filter((b) => b !== brand))
  }

  const handleAddCategory = (category: string) => {
    setCategories((current) => [...current, category])
  }

  const handleDeleteCategory = (category: string) => {
    setCategories((current) => current.filter((c) => c !== category))
  }

  const handleAddColor = (color: string) => {
    setColors((current) => [...current, color])
  }

  const handleDeleteColor = (color: string) => {
    setColors((current) => current.filter((c) => c !== color))
  }


  // Shared Rentals State with LocalStorage sync
  const [rentals, setRentals] = useState<RentalOrder[]>(() => {
    const saved = localStorage.getItem('precious_rentals')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        // fallback
      }
    }
    return demoRentals
  })

  useEffect(() => {
    localStorage.setItem('precious_rentals', JSON.stringify(rentals))
  }, [rentals])

  function handleCreateRental(draftVal: Omit<RentalOrder, 'id' | 'orderCode' | 'createdAt' | 'updatedAt'>) {
    const maxOrderCode = rentals.reduce((max, r) => {
      const match = r.orderCode.match(/PR-ORD-(\d+)/)
      return match ? Math.max(max, Number(match[1])) : max
    }, 100)

    const nextCode = `PR-ORD-${maxOrderCode + 1}`
    const now = new Date().toISOString()

    const newRental: RentalOrder = {
      ...draftVal,
      id: crypto.randomUUID(),
      orderCode: nextCode,
      createdAt: now,
      updatedAt: now
    }

    setRentals((current) => [newRental, ...current])
  }

  function handleUpdateRentalStatus(rentalId: string, status: RentalStatus) {
    setRentals((current) =>
      current.map((r) =>
        r.id === rentalId
          ? { ...r, status, updatedAt: new Date().toISOString() }
          : r
      )
    )
  }

  function handleDeleteRental(rentalId: string) {
    setRentals((current) => current.filter((r) => r.id !== rentalId))
  }
  const [formError, setFormError] = useState('')
  const [stockFormError, setStockFormError] = useState('')
  const [sessionReady, setSessionReady] = useState(!hasSupabaseConfig)
  const [isAuthenticated, setIsAuthenticated] = useState(!hasSupabaseConfig)
  const [shopId, setShopId] = useState<string | null>(null)
  const [remoteError, setRemoteError] = useState('')
  const [isLoadingRemote, setIsLoadingRemote] = useState(false)

  useEffect(() => {
    if (!supabase) return

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setIsAuthenticated(Boolean(data.session))
      setSessionReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session))
      setSessionReady(true)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !isAuthenticated) return

    const client = supabase

    Promise.resolve()
      .then(() => {
        setIsLoadingRemote(true)
        setRemoteError('')
        return Promise.all([loadOwnerShopId(client), loadCustomers(client)])
      })
      .then(([loadedShopId, loadedCustomers]) => {
        setShopId(loadedShopId)
        setCustomers(loadedCustomers)
        setSelectedCustomerId(loadedCustomers[0]?.id ?? '')
        if (!loadedShopId) {
          setRemoteError('ยังไม่พบร้านของผู้ใช้นี้ กรุณาสร้าง row ใน shops และ shop_members ก่อน')
        }
      })
      .catch((error: unknown) => {
        setRemoteError(getErrorMessage(error))
      })
      .finally(() => setIsLoadingRemote(false))
  }, [isAuthenticated])

  const activeCustomers = customers.filter((customer) => !customer.archivedAt)

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return activeCustomers.filter((customer) => {
      const matchesStatus =
        statusFilter === 'all' || customer.profileStatus === statusFilter
      const searchable = [
        customer.customerCode,
        customer.fullName,
        customer.phone,
        customer.phoneNormalized,
        customer.lineAccount,
      ]
        .join(' ')
        .toLowerCase()

      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [activeCustomers, query, statusFilter])

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredCustomers.slice(startIndex, startIndex + pageSize)
  }, [filteredCustomers, currentPage, pageSize])

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1

  const filteredStockItems = useMemo(() => {
    const normalizedQuery = stockQuery.trim().toLowerCase()

    return stockItems.filter((item) => {
      const searchable = [
        item.sku,
        item.serialNumber,
        item.productName,
        item.brand,
        item.category,
        item.size,
        item.primaryColor,
      ]
        .join(' ')
        .toLowerCase()

      return !normalizedQuery || searchable.includes(normalizedQuery)
    })
  }, [stockItems, stockQuery])

  const selectedCustomer =
    activeCustomers.find((customer) => customer.id === selectedCustomerId) ??
    filteredCustomers[0] ??
    activeCustomers[0]

  function updateDraft(field: keyof CustomerDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function updateStockDraft(field: keyof StockDraft, value: string) {
    setStockDraft((current) => ({ ...current, [field]: value }))
  }

  function openCreateStockForm() {
    setEditingStockId(null)
    setStockDraft(emptyStockDraft)
    setStockFormError('')
    setIsStockFormOpen(true)
  }

  function openEditStockForm(item: StockItem) {
    setEditingStockId(item.id)
    setStockDraft({
      sku: item.sku,
      serialNumber: item.serialNumber,
      productName: item.productName,
      brand: item.brand,
      category: item.category,
      size: item.size,
      primaryColor: item.primaryColor,
      publicDescription: item.publicDescription,
      setCount: String(item.setCount),
      rentalPricePerDay: item.rentalPricePerDay ? String(item.rentalPricePerDay) : '',
      lateFeeRule: item.lateFeeRule,
      depositAmount: item.depositAmount ? String(item.depositAmount) : '',
      imageUrls: item.imageUrls ?? [],
    })
    setStockFormError('')
    setIsStockFormOpen(true)
  }

  function closeStockForm() {
    setIsStockFormOpen(false)
    setEditingStockId(null)
    setStockFormError('')
  }

  function addStockImages(files: FileList | null) {
    if (!files?.length) return

    const imageUrls = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => URL.createObjectURL(file))

    setStockDraft((current) => ({
      ...current,
      imageUrls: [...current.imageUrls, ...imageUrls].slice(0, 5),
    }))
  }

  function removeStockImage(imageUrl: string) {
    setStockDraft((current) => ({
      ...current,
      imageUrls: current.imageUrls.filter((url) => url !== imageUrl),
    }))
  }

  function createCustomerCode() {
    const maxCode = customers.reduce((max, customer) => {
      const match = customer.customerCode.match(/PR-C(\d+)/)
      return match ? Math.max(max, Number(match[1])) : max
    }, 0)

    return `PR-C${String(maxCode + 1).padStart(3, '0')}`
  }

  async function handleCreateCustomer() {
    setFormError('')

    if (!draft.fullName.trim()) {
      setFormError('กรุณากรอกชื่อ-นามสกุล')
      return
    }

    if (!validateThaiPhone(draft.phone)) {
      setFormError('กรุณากรอกเบอร์โทรไทย 10 หลัก เช่น 0987654321')
      return
    }

    const duplicate = findPhoneDuplicate(customers, draft.phone)

    if (duplicate.kind === 'phone') {
      setSelectedCustomerId(duplicate.customer.id)
      setFormError(`เบอร์นี้มีอยู่แล้วในลูกค้า ${duplicate.customer.customerCode}`)
      return
    }

    if (supabase) {
      if (!shopId) {
        setFormError('ยังไม่พบร้านสำหรับบัญชีนี้')
        return
      }

      try {
        const newCustomer = await createRemoteCustomer(supabase, shopId, draft)
        setCustomers((current) => [newCustomer, ...current])
        setSelectedCustomerId(newCustomer.id)
        setDraft(emptyDraft)
        setIsFormOpen(false)
      } catch (error) {
        setFormError(getErrorMessage(error))
      }
      return
    }

    const now = new Date().toISOString()
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      shopId: 'shop_demo',
      customerCode: createCustomerCode(),
      fullName: draft.fullName.trim(),
      lineAccount: draft.lineAccount.trim(),
      phone: draft.phone.trim(),
      phoneNormalized: normalizeThaiPhone(draft.phone),
      currentAddress: draft.currentAddress.trim(),
      notes: draft.notes.trim(),
      profileStatus: draft.profileStatus,
      riskFlag: draft.riskFlag,
      bustIn: parseOptionalNumber(draft.bustIn),
      waistIn: parseOptionalNumber(draft.waistIn),
      hipIn: parseOptionalNumber(draft.hipIn),
      heightCm: parseOptionalNumber(draft.heightCm),
      documents: [],
      createdAt: now,
      updatedAt: now,
    }

    setCustomers((current) => [newCustomer, ...current])
    setSelectedCustomerId(newCustomer.id)
    setDraft(emptyDraft)
    setIsFormOpen(false)
  }

  function handleSaveStockItem() {
    setStockFormError('')

    if (!stockDraft.sku.trim()) {
      setStockFormError('กรุณากรอก SKU/รหัสสต๊อก')
      return
    }

    if (
      stockItems.some(
        (item) =>
          item.id !== editingStockId &&
          item.sku.toLowerCase() === stockDraft.sku.trim().toLowerCase(),
      )
    ) {
      setStockFormError('SKU/รหัสสต๊อกนี้มีอยู่แล้ว')
      return
    }

    if (!stockDraft.productName.trim()) {
      setStockFormError('กรุณากรอกชื่อสินค้า')
      return
    }

    const setCount = Number(stockDraft.setCount)
    if (!Number.isInteger(setCount) || setCount < 1) {
      setStockFormError('จำนวนชุดต้องเป็นตัวเลขตั้งแต่ 1 ขึ้นไป')
      return
    }

    const existingItem = editingStockId
      ? stockItems.find((item) => item.id === editingStockId)
      : undefined

    const savedItem: StockItem = {
      id: editingStockId ?? crypto.randomUUID(),
      sku: stockDraft.sku.trim(),
      serialNumber: stockDraft.serialNumber.trim(),
      productName: stockDraft.productName.trim(),
      brand: stockDraft.brand.trim(),
      category: stockDraft.category.trim(),
      size: stockDraft.size.trim(),
      primaryColor: stockDraft.primaryColor.trim(),
      publicDescription: stockDraft.publicDescription.trim(),
      setCount,
      rentalPricePerDay: parseOptionalNumber(stockDraft.rentalPricePerDay) ?? 0,
      lateFeeRule: stockDraft.lateFeeRule.trim(),
      depositAmount: parseOptionalNumber(stockDraft.depositAmount) ?? 0,
      imageUrls: stockDraft.imageUrls,
      createdAt: existingItem?.createdAt ?? new Date().toISOString(),
    }

    setStockItems((current) =>
      editingStockId
        ? current.map((item) => (item.id === editingStockId ? savedItem : item))
        : [savedItem, ...current],
    )
    setStockDraft(emptyStockDraft)
    setEditingStockId(null)
    setIsStockFormOpen(false)
  }

  async function updateSelectedStatus(profileStatus: CustomerProfileStatus) {
    if (!selectedCustomer) return

    if (profileStatus === 'verified' && selectedCustomer.documents.length === 0) {
      const confirmed = window.confirm(
        'ลูกค้ายังไม่มีรูปเอกสาร ต้องการเปลี่ยนเป็นตรวจแล้วใช่ไหม?',
      )
      if (!confirmed) return
    }

    if (supabase) {
      try {
        await updateRemoteCustomerStatus(supabase, selectedCustomer.id, profileStatus)
      } catch (error) {
        window.alert(getErrorMessage(error))
        return
      }
    }

    setCustomers((current) =>
      current.map((customer) =>
        customer.id === selectedCustomer.id
          ? { ...customer, profileStatus, updatedAt: new Date().toISOString() }
          : customer,
      ),
    )
  }

  async function updateSelectedRisk(riskFlag: RiskFlag) {
    if (!selectedCustomer) return

    if (supabase) {
      try {
        await updateRemoteCustomerRisk(supabase, selectedCustomer.id, riskFlag)
      } catch (error) {
        window.alert(getErrorMessage(error))
        return
      }
    }

    setCustomers((current) =>
      current.map((customer) =>
        customer.id === selectedCustomer.id
          ? { ...customer, riskFlag, updatedAt: new Date().toISOString() }
          : customer,
      ),
    )
  }

  async function archiveSelectedCustomer() {
    if (!selectedCustomer) return

    if (supabase) {
      try {
        await archiveRemoteCustomer(supabase, selectedCustomer.id)
      } catch (error) {
        window.alert(getErrorMessage(error))
        return
      }
    }

    setCustomers((current) =>
      current.map((customer) =>
        customer.id === selectedCustomer.id
          ? { ...customer, archivedAt: new Date().toISOString() }
          : customer,
      ),
    )
    setSelectedCustomerId(activeCustomers.find((customer) => customer.id !== selectedCustomer.id)?.id ?? '')
  }

  async function addDocuments(files: FileList | null) {
    if (!selectedCustomer || !files?.length) return

    const incomingFiles = Array.from(files)
    if (!canAddMoreDocuments(selectedCustomer.documents.length, incomingFiles.length)) {
      window.alert('อัปโหลดรูปเอกสารได้สูงสุด 5 รูปต่อลูกค้า')
      return
    }

    if (supabase) {
      try {
        await uploadRemoteCustomerDocuments(supabase, selectedCustomer, incomingFiles)
        const loadedCustomers = await loadCustomers(supabase)
        setCustomers(loadedCustomers)
        setSelectedCustomerId(selectedCustomer.id)
      } catch (error) {
        window.alert(getErrorMessage(error))
      }
      return
    }

    const now = new Date().toISOString()
    const newDocuments: CustomerDocument[] = incomingFiles.map((file, index) => ({
      id: crypto.randomUUID(),
      customerId: selectedCustomer.id,
      storagePath: `customer-documents/${selectedCustomer.id}/${file.name}`,
      previewUrl: URL.createObjectURL(file),
      sortOrder: selectedCustomer.documents.length + index + 1,
      createdAt: now,
    }))

    setCustomers((current) =>
      current.map((customer) =>
        customer.id === selectedCustomer.id
          ? {
              ...customer,
              documents: [...customer.documents, ...newDocuments],
              updatedAt: now,
            }
          : customer,
      ),
    )
  }

  const summary = {
    total: activeCustomers.length,
    verified: activeCustomers.filter((customer) => customer.profileStatus === 'verified').length,
    incomplete: activeCustomers.filter((customer) => customer.profileStatus === 'incomplete').length,
    risk: activeCustomers.filter((customer) => customer.riskFlag === 'has_risk').length,
  }

  const stockSummary = {
    total: stockItems.length,
    sets: stockItems.reduce((total, item) => total + item.setCount, 0),
    deposits: stockItems.reduce((total, item) => total + item.depositAmount, 0),
    priced: stockItems.filter((item) => item.rentalPricePerDay > 0).length,
  }

  if (!sessionReady) {
    return <LoadingScreen />
  }

  if (hasSupabaseConfig && !isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="app-layout">
      <SideNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="app-shell">
        {activeTab === 'dashboard' && (
          <DashboardPage
            rentals={rentals}
            onUpdateRentalStatus={handleUpdateRentalStatus}
            onNavigateToCustomers={() => setActiveTab('customers')}
            onNavigateToRentals={() => setActiveTab('rentals')}
          />
        )}

        {activeTab === 'rentals' && (
          <RentalsPage
            rentals={rentals}
            customers={customers}
            stockItems={stockItems}
            onCreateRental={handleCreateRental}
            onUpdateRentalStatus={handleUpdateRentalStatus}
            onDeleteRental={handleDeleteRental}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryPage
            items={filteredStockItems}
            query={stockQuery}
            setQuery={setStockQuery}
            summary={stockSummary}
            isFormOpen={isStockFormOpen}
            isEditing={Boolean(editingStockId)}
            draft={stockDraft}
            formError={stockFormError}
            onOpenForm={openCreateStockForm}
            onCloseForm={closeStockForm}
            onEdit={openEditStockForm}
            onDraftChange={updateStockDraft}
            onResetDraft={() => setStockDraft(emptyStockDraft)}
            onImageUpload={addStockImages}
            onImageRemove={removeStockImage}
            onSave={handleSaveStockItem}
            brands={brands}
            categories={categories}
            colors={colors}
          />
        )}

        {activeTab === 'customers' && (
          <>
            <header className="page-header">
              <div>
                <p className="eyebrow">Precious Shop</p>
                <h1>รายชื่อลูกค้า</h1>
                <p className="subtitle">ตรวจสอบข้อมูลลูกค้า จัดการสัดส่วน และทบทวนสถานะโปรไฟล์</p>
              </div>
              <button className="primary-button" type="button" onClick={() => setIsFormOpen(true)}>
                <Plus size={22} />
                เพิ่มลูกค้า
              </button>
            </header>

            <section className="system-strip" aria-label="สถานะระบบ">
              <MetricCard label="ลูกค้าทั้งหมด" value={`${summary.total}`} icon={<UserRound />} type="total" unit="ราย" />
              <MetricCard label="ตรวจแล้ว" value={`${summary.verified}`} icon={<BadgeCheck />} type="verified" unit="ราย" />
              <MetricCard label="ข้อมูลไม่ครบ" value={`${summary.incomplete}`} icon={<AlertTriangle />} type="incomplete" unit="ราย" />
              <MetricCard label="มีสัญญาณความเสี่ยง" value={`${summary.risk}`} icon={<ShieldAlert />} type="risk" unit="ราย" />
            </section>

            {!hasSupabaseConfig && (
              <section className="config-note">
                <div className="note-content">
                  <LockKeyhole size={18} />
                  <span>โหมดตัวอย่าง: ใส่ 'VITE_SUPABASE_URL' และ 'VITE_SUPABASE_ANON_KEY' เพื่อเชื่อม Supabase จริง</span>
                </div>
                <ChevronRight size={18} />
              </section>
            )}

            {hasSupabaseConfig && (
              <section className="config-note">
                <div className="note-content">
                  <LockKeyhole size={18} />
                  <span>
                    {isLoadingRemote
                      ? 'กำลังโหลดข้อมูลจาก Supabase...'
                      : 'เชื่อม Supabase แล้ว ใช้ private storage และ RLS'}
                  </span>
                </div>
                <ChevronRight size={18} />
              </section>
            )}

            {remoteError && <section className="remote-error">{remoteError}</section>}

            <section className="customer-grid">
              <div className="panel customer-list-panel">
                <div className="toolbar">
                  <label className="search-box">
                    <Search size={22} />
                    <input
                      value={query}
                      onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }}
                      placeholder="ค้นหาด้วยชื่อ เบอร์โทร รหัสลูกค้า หรือ LINE ID"
                    />
                  </label>
                  <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setCurrentPage(1); }}>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="customer-table" role="table" aria-label="รายชื่อลูกค้า">
                  <div className="table-row table-head" role="row">
                    <span></span>
                    <span>รหัสลูกค้า</span>
                    <span>ชื่อ</span>
                    <span>โทรศัพท์</span>
                    <span>สถานะโปรไฟล์</span>
                    <span></span>
                  </div>
                  {paginatedCustomers.map((customer) => (
                    <button
                      className={`table-row table-button ${customer.id === selectedCustomer?.id ? 'selected' : ''}`}
                      key={customer.id}
                      role="row"
                      type="button"
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <div className="row-selector">
                        <div className="selector-dot" />
                      </div>
                      <strong>{customer.customerCode}</strong>
                      <span>{customer.fullName}</span>
                      <span>{customer.phoneNormalized}</span>
                      {customer.riskFlag === 'has_risk' ? (
                        <span className="status-pill danger">มีสัญญาณความเสี่ยง</span>
                      ) : (
                        <StatusPill status={customer.profileStatus} />
                      )}
                      <ChevronRight size={18} className="arrow-icon" />
                    </button>
                  ))}
                </div>

                <div className="pagination-footer">
                  <button
                    className="pagination-btn"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    type="button"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="page-number-box">{currentPage}</div>
                  <button
                    className="pagination-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    type="button"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {selectedCustomer && (
                <CustomerDetail
                  customer={selectedCustomer}
                  onStatusChange={updateSelectedStatus}
                  onRiskChange={updateSelectedRisk}
                  onArchive={archiveSelectedCustomer}
                  onDocumentUpload={addDocuments}
                />
              )}
            </section>

            {isFormOpen && (
              <div className="modal-backdrop" role="presentation">
                <section className="modal-panel" aria-label="เพิ่มลูกค้า">
                  <div className="modal-header">
                    <div>
                      <p className="eyebrow">Customer Profile</p>
                      <h2>เพิ่มลูกค้าใหม่</h2>
                    </div>
                    <button className="ghost-button" type="button" onClick={() => setIsFormOpen(false)}>
                      ปิด
                    </button>
                  </div>

                  <div className="form-grid">
                    <TextField label="ชื่อ-นามสกุล" value={draft.fullName} onChange={(value) => updateDraft('fullName', value)} required />
                    <TextField label="เบอร์โทรศัพท์" value={draft.phone} onChange={(value) => updateDraft('phone', value)} required />
                    <TextField label="ชื่อแอคเคา/LINE" value={draft.lineAccount} onChange={(value) => updateDraft('lineAccount', value)} />
                    <label className="field">
                      <span>สถานะโปรไฟล์</span>
                      <select value={draft.profileStatus} onChange={(event) => updateDraft('profileStatus', event.target.value)}>
                        <option value="incomplete">ข้อมูลไม่ครบ</option>
                        <option value="pending_review">รอตรวจ</option>
                        <option value="verified">ตรวจแล้ว</option>
                        <option value="suspended">ระงับ</option>
                      </select>
                    </label>
                    <label className="field wide">
                      <span>ที่อยู่ปัจจุบัน</span>
                      <textarea value={draft.currentAddress} onChange={(event) => updateDraft('currentAddress', event.target.value)} rows={3} />
                    </label>
                    <label className="field wide">
                      <span>หมายเหตุ</span>
                      <textarea value={draft.notes} onChange={(event) => updateDraft('notes', event.target.value)} rows={3} />
                    </label>
                    <TextField label='รอบอก (นิ้ว)' value={draft.bustIn} onChange={(value) => updateDraft('bustIn', value)} inputMode="decimal" />
                    <TextField label='รอบเอว (นิ้ว)' value={draft.waistIn} onChange={(value) => updateDraft('waistIn', value)} inputMode="decimal" />
                    <TextField label='สะโพก (นิ้ว)' value={draft.hipIn} onChange={(value) => updateDraft('hipIn', value)} inputMode="decimal" />
                    <TextField label="ส่วนสูง (ซม.)" value={draft.heightCm} onChange={(value) => updateDraft('heightCm', value)} inputMode="decimal" />
                    <label className="field">
                      <span>สัญญาณความเสี่ยง</span>
                      <select value={draft.riskFlag} onChange={(event) => updateDraft('riskFlag', event.target.value)}>
                        <option value="none">ไม่มี</option>
                        <option value="has_risk">มี</option>
                      </select>
                    </label>
                  </div>

                  {formError && <p className="form-error">{formError}</p>}

                  <div className="modal-actions">
                    <button className="secondary-button" type="button" onClick={() => setDraft(emptyDraft)}>
                      ล้างฟอร์ม
                    </button>
                    <button className="primary-button" type="button" onClick={handleCreateCustomer}>
                      บันทึกลูกค้า
                    </button>
                  </div>
                </section>
              </div>
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            brands={brands}
            categories={categories}
            colors={colors}
            onAddBrand={handleAddBrand}
            onDeleteBrand={handleDeleteBrand}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddColor={handleAddColor}
            onDeleteColor={handleDeleteColor}
          />
        )}

        {activeTab !== 'dashboard' && activeTab !== 'inventory' && activeTab !== 'customers' && activeTab !== 'rentals' && activeTab !== 'settings' && (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: '#c7bfb9' }}>
            <p className="eyebrow" style={{ marginBottom: '16px' }}>Precious Shop</p>
            <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#fff7ef', marginBottom: '12px' }}>
              กำลังพัฒนาระบบ...
            </h2>
            <p style={{ fontSize: '18px', color: '#8f8580', maxWidth: '480px', margin: '0 auto' }}>
              หน้าสำหรับการจัดการข้อมูลในส่วนนี้ กำลังอยู่ในขั้นตอนการพัฒนาเพื่อตอบสนองการใช้งานที่ดีที่สุด
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function SideNav({
  activeTab,
  onTabChange,
}: {
  activeTab: ViewKey
  onTabChange: (tab: ViewKey) => void
}) {
  const items: Array<{ id: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'inventory', label: 'คลังชุด', icon: Menu },
    { id: 'customers', label: 'ลูกค้า', icon: UserRound },
    { id: 'rentals', label: 'เช่า/คืน', icon: CalendarCheck },
    { id: 'calendar', label: 'ปฏิทิน', icon: CalendarDays },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings },
  ]

  return (
    <aside className="side-nav" aria-label="เมนูหลัก">
      <div className="brand-logo" aria-label="Precious Rental">
        <strong>PRECIOUS</strong>
        <div className="divider-line" />
        <span>RENTAL</span>
      </div>
      <nav>
        {items.map(({ id, label, icon: Icon }) => (
          <button
            className={`nav-item ${activeTab === id ? 'active' : ''}`}
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon size={28} strokeWidth={2} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

function InventoryPage({
  items,
  query,
  setQuery,
  summary,
  isFormOpen,
  isEditing,
  draft,
  formError,
  onOpenForm,
  onCloseForm,
  onEdit,
  onDraftChange,
  onResetDraft,
  onImageUpload,
  onImageRemove,
  onSave,
  brands,
  categories,
  colors,
}: {
  items: StockItem[]
  query: string
  setQuery: (value: string) => void
  summary: { total: number; sets: number; deposits: number; priced: number }
  isFormOpen: boolean
  isEditing: boolean
  draft: StockDraft
  formError: string
  onOpenForm: () => void
  onCloseForm: () => void
  onEdit: (item: StockItem) => void
  onDraftChange: (field: keyof StockDraft, value: string) => void
  onResetDraft: () => void
  onImageUpload: (files: FileList | null) => void
  onImageRemove: (imageUrl: string) => void
  onSave: () => void
  brands: string[]
  categories: string[]
  colors: string[]
}) {
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

      <section className="system-strip" aria-label="ภาพรวมคลังชุด">
        <MetricCard label="รายการสต๊อก" value={`${summary.total}`} icon={<Menu />} type="total" />
        <MetricCard label="จำนวนชุดรวม" value={`${summary.sets}`} icon={<Archive />} type="verified" unit="ชุด" />
        <MetricCard label="ตั้งราคาแล้ว" value={`${summary.priced}`} icon={<BadgeCheck />} type="incomplete" />
        <MetricCard label="เงินประกันรวม" value={formatBaht(summary.deposits)} icon={<ShieldAlert />} type="risk" unit="" />
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
        </div>

        <div className="stock-table" role="table" aria-label="รายการคลังชุด">
          <div className="stock-row stock-head" role="row">
            <span>SKU</span>
            <span>สินค้า</span>
            <span>ไซซ์/สี</span>
            <span>ค่าเช่า</span>
            <span>ค่าปรับ</span>
            <span>ประกัน</span>
            <span></span>
          </div>
          {items.map((item) => (
            <div className="stock-row" key={item.id} role="row">
              <strong>{item.sku}</strong>
              <span>
                {item.productName}
                <small>{[item.brand, item.category, item.serialNumber].filter(Boolean).join(' | ') || '-'}</small>
              </span>
              <span>
                {item.size || '-'}
                <small>{item.primaryColor || '-'}</small>
              </span>
              <span>{formatBaht(item.rentalPricePerDay)}</span>
              <span>{item.lateFeeRule || '-'}</span>
              <span>{formatBaht(item.depositAmount)}</span>
              <button className="icon-action-button" type="button" onClick={() => onEdit(item)} aria-label={`แก้ไข ${item.sku}`}>
                <Pencil size={18} />
                <span>แก้ไข</span>
              </button>
            </div>
          ))}
          {items.length === 0 && <div className="empty-state">ยังไม่มีรายการที่ตรงกับคำค้นหา</div>}
        </div>
      </section>

      {isFormOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel stock-modal-panel" aria-label="เพิ่มสต๊อก">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Stock Item</p>
                <h2>{isEditing ? 'แก้ไขสินค้าในคลังชุด' : 'เพิ่มสินค้าเข้าคลังชุด'}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={onCloseForm}>
                ปิด
              </button>
            </div>

            <div className="stock-form-section">
              <TextField
                label="ชื่อสินค้า"
                value={draft.productName}
                onChange={(value) => onDraftChange('productName', value)}
                placeholder="เช่น ชุดราตรี Midnight Starlight"
                required
              />
              <div className="form-grid">
                <label className="field">
                  <span>แบรนด์</span>
                  <select
                    value={draft.brand}
                    onChange={(event) => onDraftChange('brand', event.target.value)}
                  >
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
                  <select
                    value={draft.category}
                    onChange={(event) => onDraftChange('category', event.target.value)}
                  >
                    <option value="">-- เลือกประเภทชุด --</option>
                    {categories.map((catName) => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField
                  label="ไซซ์ / ขนาด"
                  value={draft.size}
                  onChange={(value) => onDraftChange('size', value)}
                />
                <label className="field">
                  <span>สีหลัก</span>
                  <select
                    value={draft.primaryColor}
                    onChange={(event) => onDraftChange('primaryColor', event.target.value)}
                  >
                    <option value="">-- เลือกสีหลัก --</option>
                    {colors.map((colorName) => (
                      <option key={colorName} value={colorName}>
                        {colorName}
                      </option>
                    ))}
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
                <span>เพิ่มรูปชุดได้สูงสุด 5 รูป</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => onImageUpload(event.target.files)}
                />
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
                        <div className="stock-image-empty">
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
                <TextField
                  label="SKU/รหัสสต๊อก"
                  value={draft.sku}
                  onChange={(value) => onDraftChange('sku', value)}
                  placeholder="เช่น PR-4791"
                  required
                />
                <TextField
                  label="จำนวนชุด"
                  value={draft.setCount}
                  onChange={(value) => onDraftChange('setCount', value)}
                  inputMode="numeric"
                  type="number"
                />
                <TextField
                  label="หมายเลขซีเรียล"
                  value={draft.serialNumber}
                  onChange={(value) => onDraftChange('serialNumber', value)}
                  placeholder="หมายเลขซีเรียลจากผู้ผลิต"
                />
              </div>
            </div>

            <div className="stock-form-section">
              <div className="section-title-row">
                <h3>ราคาดำเนินการ</h3>
                <span>ไม่เปิดเผยต่อสาธารณะ</span>
              </div>
              <div className="form-grid pricing-grid">
                <CurrencyField
                  label="ค่าเช่า (รายวัน)"
                  value={draft.rentalPricePerDay}
                  onChange={(value) => onDraftChange('rentalPricePerDay', value)}
                />
                <TextField
                  label="เกณฑ์ค่าปรับล่าช้า"
                  value={draft.lateFeeRule}
                  onChange={(value) => onDraftChange('lateFeeRule', value)}
                  placeholder="เช่น 300 บาท/วัน หลังครบกำหนด"
                />
                <CurrencyField
                  label="เงินประกัน"
                  value={draft.depositAmount}
                  onChange={(value) => onDraftChange('depositAmount', value)}
                />
              </div>
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={onResetDraft}>
                ล้างฟอร์ม
              </button>
              <button className="primary-button" type="button" onClick={onSave}>
                {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกสต๊อก'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function CustomerDetail({
  customer,
  onStatusChange,
  onRiskChange,
  onArchive,
  onDocumentUpload,
}: {
  customer: Customer
  onStatusChange: (status: CustomerProfileStatus) => void
  onRiskChange: (riskFlag: RiskFlag) => void
  onArchive: () => void
  onDocumentUpload: (files: FileList | null) => void
}) {
  const rentalGuard = canCreateRentalForCustomer(customer)

  const initials = customer.fullName ? customer.fullName.slice(0, 2).toLowerCase() : ''

  return (
    <aside className="panel detail-panel">
      <div className="profile-card-top">
        <div className="profile-card-info">
          <div className="profile-avatar">
            {initials}
          </div>
          <div className="profile-meta">
            <h2>{customer.fullName}</h2>
            <p>รหัส: {customer.customerCode}</p>
            <p>LINE: {customer.lineAccount || '-'}</p>
          </div>
        </div>
        {customer.riskFlag === 'has_risk' ? (
          <span className="status-pill danger">มีสัญญาณความเสี่ยง</span>
        ) : (
          <StatusPill status={customer.profileStatus} />
        )}
      </div>

      <div className={`rental-guard ${rentalGuard.allowed ? 'warn' : 'block'}`}>
        {rentalGuard.allowed ? <AlertTriangle size={18} /> : <ShieldAlert size={18} />}
        {rentalGuard.message || 'ลูกค้าพร้อมสร้างรายการเช่า'}
      </div>

      <section className="detail-section">
        <h3>ข้อมูลติดต่อ</h3>
        <div className="info-list-container">
          <div className="info-row">
            <div className="info-row-left">
              <Phone size={18} />
              <span>โทรศัพท์</span>
            </div>
            <strong className="info-row-right">{customer.phoneNormalized}</strong>
          </div>
          <div className="info-row">
            <div className="info-row-left">
              <MessageSquare size={18} />
              <span>LINE ID</span>
            </div>
            <strong className="info-row-right">{customer.lineAccount || '-'}</strong>
          </div>
          <div className="info-row">
            <div className="info-row-left">
              <FileText size={18} />
              <span>หมายเหตุ</span>
            </div>
            <strong className="info-row-right">{customer.notes || '-'}</strong>
          </div>
          <div className="info-row">
            <div className="info-row-left">
              <FileText size={18} />
              <span>ที่อยู่ปัจจุบัน</span>
            </div>
            <strong className="info-row-right">{customer.currentAddress || '-'}</strong>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>สัดส่วนลูกค้า</h3>
        <div className="measurement-grid">
          {formatMeasurements(customer).map((measurement) => (
            <div key={measurement.label}>
              <span>{measurement.label}</span>
              <strong>{measurement.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="detail-section controls-section">
        <label className="field">
          <span>สถานะโปรไฟล์</span>
          <select value={customer.profileStatus} onChange={(event) => onStatusChange(event.target.value as CustomerProfileStatus)}>
            <option value="incomplete">ข้อมูลไม่ครบ</option>
            <option value="pending_review">รอตรวจ</option>
            <option value="verified">ตรวจแล้ว</option>
            <option value="suspended">ระงับ</option>
          </select>
        </label>
        <label className="field">
          <span>สัญญาณความเสี่ยง</span>
          <select value={customer.riskFlag} onChange={(event) => onRiskChange(event.target.value as RiskFlag)}>
            <option value="none">ไม่มี</option>
            <option value="has_risk">มี</option>
          </select>
        </label>
      </section>

      <section className="detail-section">
        <div className="section-title-row">
          <h3>ตรวจสอบหลักฐานยืนยันตัวตน</h3>
          <span>{customer.documents.length}/5 รูป</span>
        </div>
        <label className="upload-box">
          <Camera size={20} />
          อัปโหลดรูปเอกสาร/บัตรประชาชน
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => onDocumentUpload(event.target.files)}
          />
        </label>
        <div className="document-grid">
          {customer.documents.length === 0 && (
            <div className="empty-doc">
              <FileImage size={28} />
              ยังไม่มีรูปเอกสาร
            </div>
          )}
          {customer.documents.map((document) => (
            <figure key={document.id}>
              {document.previewUrl ? (
                <img src={document.previewUrl} alt={`เอกสารลูกค้า ${document.sortOrder}`} />
              ) : (
                <div className="file-placeholder">
                  <FileImage />
                </div>
              )}
              <figcaption>รูปที่ {document.sortOrder}</figcaption>
            </figure>
          ))}
        </div>
      </section>
      <button className="archive-button" type="button" onClick={onArchive}>
        <Archive size={18} />
        Archive ลูกค้า
      </button>
    </aside>
  )
}

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogin() {
    if (!supabase) return

    setError('')
    setIsSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
    }

    setIsSubmitting(false)
  }

  return (
    <main className="auth-shell">
      <section className="modal-panel auth-panel">
        <p className="eyebrow">Precious Shop</p>
        <h1>เข้าสู่ระบบหลังร้าน</h1>
        <p className="subtitle">ใช้บัญชีเจ้าของร้านจาก Supabase Auth</p>
        <div className="form-grid auth-form">
          <TextField label="อีเมล" value={email} onChange={setEmail} />
          <TextField label="รหัสผ่าน" value={password} onChange={setPassword} type="password" />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="button" onClick={handleLogin} disabled={isSubmitting}>
          {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </section>
    </main>
  )
}

function LoadingScreen() {
  return (
    <main className="auth-shell">
      <section className="modal-panel auth-panel">
        <p className="eyebrow">Precious Shop</p>
        <h1>กำลังเตรียมระบบ</h1>
      </section>
    </main>
  )
}

function MetricCard({
  label,
  value,
  icon,
  type,
  unit,
}: {
  label: string
  value: string
  icon: ReactNode
  type?: 'total' | 'verified' | 'incomplete' | 'risk'
  unit?: string
}) {
  return (
    <div className={`metric-card ${type || ''}`}>
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

function StatusPill({ status }: { status: CustomerProfileStatus }) {
  return (
    <span className={`status-pill ${profileStatusTone[status]}`}>
      {profileStatusLabel[status]}
    </span>
  )
}

function TextField({
  label,
  value,
  onChange,
  required,
  inputMode,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  type?: InputHTMLAttributes<HTMLInputElement>['type']
  placeholder?: string
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      <input
        value={value}
        inputMode={inputMode}
        type={type}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function parseOptionalNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && value.trim() ? parsed : undefined
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}

export default App
