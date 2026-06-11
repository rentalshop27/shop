import { useEffect, useMemo, useState, useRef } from 'react'
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
  Eye,
  FileImage,
  FileText,
  Images,
  ImagePlus,
  LayoutDashboard,
  LayoutGrid,
  List,
  Menu,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Trash2,
  UserRound,
  X,
  History,
} from 'lucide-react'
import './index.css'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { RentalsPage } from './features/rentals/RentalsPage'
import { CalendarPage } from './features/calendar/CalendarPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { AuditLogPage } from './features/audit/AuditLogPage'
import { UpdatePrompt } from './features/settings/UpdatePrompt'
import { demoRentals, demoStockItemsForRentals } from './features/rentals/rentalSeed'
import type { RentalOrder, RentalStatus } from './features/rentals/rentalTypes'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import { demoCustomers } from './features/customers/customerSeed'
import { loadAuditLogs, demoAuditLogs } from './features/audit/auditRemote'
import type { AuditLog } from './features/audit/auditRemote'
import {
  archiveRemoteCustomer,
  createRemoteCustomer,
  loadCustomers,
  loadOwnerShopId,
  updateRemoteCustomer,
  updateRemoteCustomerRisk,
  updateRemoteCustomerStatus,
  uploadRemoteCustomerDocuments,
} from './features/customers/customerRemote'
import {
  loadStockItems,
  createRemoteStockItem,
  updateRemoteStockItem,
  updateShopSettings,
  loadShopSettings,
} from './features/inventory/stockRemote'
import type {
  Customer,
  CustomerDocument,
  CustomerDraft,
  CustomerProfileStatus,
  RiskFlag,
} from './features/customers/customerTypes'
import {
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

type ViewKey = 'dashboard' | 'inventory' | 'customers' | 'rentals' | 'calendar' | 'settings' | 'audit'

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
  const [activeTab, setActiveTab] = useState<ViewKey>('dashboard')
  const [externalSelectedRentalId, setExternalSelectedRentalId] = useState<string>('')
  const [externalIsFormOpen, setExternalIsFormOpen] = useState<boolean>(false)
  const [externalPickupDate, setExternalPickupDate] = useState<string>('')
  const [externalReturnDate, setExternalReturnDate] = useState<string>('')

  function handleClearExternalDates() {
    setExternalPickupDate('')
    setExternalReturnDate('')
  }

  function handleNavigateToRentals(rentalId: string) {
    setExternalSelectedRentalId(rentalId)
    setExternalIsFormOpen(false)
    setActiveTab('rentals')
  }

  function handleNavigateToCreateRental(pickupDate: string, returnDate: string) {
    setExternalPickupDate(pickupDate)
    setExternalReturnDate(returnDate)
    setExternalIsFormOpen(true)
    setActiveTab('rentals')
  }

  function handleTabChange(tab: ViewKey) {
    setActiveTab(tab)
    if (tab !== 'rentals') {
      setExternalIsFormOpen(false)
      setExternalPickupDate('')
      setExternalReturnDate('')
      setExternalSelectedRentalId('')
    }
  }

  const [customers, setCustomers] = useState<Customer[]>(demoCustomers)
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('precious_stock_items')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return demoStockItems
  })
  const [selectedCustomerId, setSelectedCustomerId] = useState(demoCustomers[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [stockQuery, setStockQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerProfileStatus>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isStockFormOpen, setIsStockFormOpen] = useState(false)
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [previewStockId, setPreviewStockId] = useState<string | null>(null)
  const [previewImageIndex, setPreviewImageIndex] = useState(0)
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft)
  const [draftDocuments, setDraftDocuments] = useState<Array<{ id: string; file: File; previewUrl: string }>>([])

  async function addDraftDocuments(files: FileList | null) {
    if (!files?.length) return

    const incomingFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    const remainingSlots = 5 - draftDocuments.length

    if (remainingSlots <= 0) {
      window.alert('รูปเอกสารเต็ม 5 รูปแล้ว')
      return
    }

    const filesToUpload = incomingFiles.slice(0, remainingSlots)
    if (incomingFiles.length > remainingSlots) {
      window.alert(`สามารถเพิ่มรูปได้อีกเพียง ${remainingSlots} รูป ระบบจะทำการเลือกเฉพาะ ${remainingSlots} รูปแรก`)
    }

    const newDocs = await Promise.all(
      filesToUpload.map(async (file) => {
        const previewUrl = await readFileAsDataUrl(file)
        return {
          id: crypto.randomUUID(),
          file,
          previewUrl,
        }
      })
    )

    setDraftDocuments((current) => [...current, ...newDocs])
  }

  function removeDraftDocument(id: string) {
    setDraftDocuments((current) => current.filter((doc) => doc.id !== id))
  }

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

  useEffect(() => {
    localStorage.setItem('precious_stock_items', JSON.stringify(stockItems))
  }, [stockItems])

  const handleAddBrand = async (brand: string) => {
    const updated = [...brands, brand]
    setBrands(updated)
    if (supabase && isAuthenticated && shopId) {
      try {
        await updateShopSettings(supabase, shopId, { brands: updated, categories, colors })
      } catch (err) {
        console.error('Failed to save settings:', err)
        window.alert('บันทึกข้อมูลการตั้งค่าล้มเหลว: ' + getErrorMessage(err))
      }
    }
  }

  const handleDeleteBrand = async (brand: string) => {
    const updated = brands.filter((b) => b !== brand)
    setBrands(updated)
    if (supabase && isAuthenticated && shopId) {
      try {
        await updateShopSettings(supabase, shopId, { brands: updated, categories, colors })
      } catch (err) {
        console.error('Failed to save settings:', err)
        window.alert('ลบข้อมูลการตั้งค่าล้มเหลว: ' + getErrorMessage(err))
      }
    }
  }

  const handleAddCategory = async (category: string) => {
    const updated = [...categories, category]
    setCategories(updated)
    if (supabase && isAuthenticated && shopId) {
      try {
        await updateShopSettings(supabase, shopId, { brands, categories: updated, colors })
      } catch (err) {
        console.error('Failed to save settings:', err)
        window.alert('บันทึกข้อมูลการตั้งค่าล้มเหลว: ' + getErrorMessage(err))
      }
    }
  }

  const handleDeleteCategory = async (category: string) => {
    const updated = categories.filter((c) => c !== category)
    setCategories(updated)
    if (supabase && isAuthenticated && shopId) {
      try {
        await updateShopSettings(supabase, shopId, { brands, categories: updated, colors })
      } catch (err) {
        console.error('Failed to save settings:', err)
        window.alert('ลบข้อมูลการตั้งค่าล้มเหลว: ' + getErrorMessage(err))
      }
    }
  }

  const handleAddColor = async (color: string) => {
    const updated = [...colors, color]
    setColors(updated)
    if (supabase && isAuthenticated && shopId) {
      try {
        await updateShopSettings(supabase, shopId, { brands, categories, colors: updated })
      } catch (err) {
        console.error('Failed to save settings:', err)
        window.alert('บันทึกข้อมูลการตั้งค่าล้มเหลว: ' + getErrorMessage(err))
      }
    }
  }

  const handleDeleteColor = async (color: string) => {
    const updated = colors.filter((c) => c !== color)
    setColors(updated)
    if (supabase && isAuthenticated && shopId) {
      try {
        await updateShopSettings(supabase, shopId, { brands, categories, colors: updated })
      } catch (err) {
        console.error('Failed to save settings:', err)
        window.alert('ลบข้อมูลการตั้งค่าล้มเหลว: ' + getErrorMessage(err))
      }
    }
  }

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(demoAuditLogs)
  const [loadingAudit, setLoadingAudit] = useState(false)

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
        setRemoteError('')
        return Promise.all([
          loadOwnerShopId(client),
          loadCustomers(client),
          loadStockItems(client)
        ])
      })
      .then(([loadedShopId, loadedCustomers, loadedStock]) => {
        setShopId(loadedShopId)
        setCustomers(loadedCustomers)
        setStockItems(loadedStock)
        setSelectedCustomerId(loadedCustomers[0]?.id ?? '')
        if (!loadedShopId) {
          setRemoteError('ยังไม่พบร้านของผู้ใช้นี้ กรุณาสร้าง row ใน shops และ shop_members ก่อน')
          return null
        }
        return loadShopSettings(client, loadedShopId)
      })
      .then((settings) => {
        if (settings) {
          if (settings.brands && settings.brands.length > 0) setBrands(settings.brands)
          if (settings.categories && settings.categories.length > 0) setCategories(settings.categories)
          if (settings.colors && settings.colors.length > 0) setColors(settings.colors)
        }
      })
      .catch((error: unknown) => {
        setRemoteError(getErrorMessage(error))
      })
  }, [isAuthenticated])

  async function handleLoadAuditLogs() {
    if (!supabase || !isAuthenticated) return
    try {
      setLoadingAudit(true)
      const logs = await loadAuditLogs(supabase)
      setAuditLogs(logs)
    } catch (error) {
      console.warn('Failed to load audit logs from Supabase, using demo logs:', error)
      setAuditLogs(demoAuditLogs)
    } finally {
      setLoadingAudit(false)
    }
  }

  useEffect(() => {
    if (!supabase || !isAuthenticated) {
      setAuditLogs(demoAuditLogs)
      return
    }
    handleLoadAuditLogs()
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

  const previewStockItem = previewStockId
    ? stockItems.find((item) => item.id === previewStockId) ?? null
    : null

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

  async function addStockImages(files: FileList | null) {
    if (!files?.length) return

    const incomingFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    const remainingSlots = 5 - stockDraft.imageUrls.length

    if (remainingSlots <= 0) {
      window.alert('รูปชุดเต็ม 5 รูปแล้ว')
      return
    }

    const filesToUpload = incomingFiles.slice(0, remainingSlots)
    if (incomingFiles.length > remainingSlots) {
      window.alert(`สามารถเพิ่มรูปชุดได้อีกเพียง ${remainingSlots} รูป ระบบจะทำการเลือกเฉพาะ ${remainingSlots} รูปแรก`)
    }

    const imageUrls = await Promise.all(
      filesToUpload.map((file) => readFileAsDataUrl(file)),
    )

    setStockDraft((current) => ({
      ...current,
      imageUrls: [...current.imageUrls, ...imageUrls],
    }))
  }

  function removeStockImage(imageUrl: string) {
    setStockDraft((current) => ({
      ...current,
      imageUrls: current.imageUrls.filter((url) => url !== imageUrl),
    }))
  }

  function openStockPreview(item: StockItem, index = 0) {
    if (!item.imageUrls.length) return
    setPreviewStockId(item.id)
    setPreviewImageIndex(index)
  }

  function closeStockPreview() {
    setPreviewStockId(null)
    setPreviewImageIndex(0)
  }

  function createCustomerCode() {
    const maxCode = customers.reduce((max, customer) => {
      const match = customer.customerCode.match(/PR-C(\d+)/)
      return match ? Math.max(max, Number(match[1])) : max
    }, 0)

    return `PR-C${String(maxCode + 1).padStart(3, '0')}`
  }

  function openEditCustomerForm(customer: Customer) {
    setEditingCustomerId(customer.id)
    setDraft({
      fullName: customer.fullName,
      lineAccount: customer.lineAccount,
      phone: customer.phone,
      currentAddress: customer.currentAddress,
      notes: customer.notes,
      profileStatus: customer.profileStatus,
      riskFlag: customer.riskFlag,
      bustIn: customer.bustIn !== undefined ? String(customer.bustIn) : '',
      waistIn: customer.waistIn !== undefined ? String(customer.waistIn) : '',
      hipIn: customer.hipIn !== undefined ? String(customer.hipIn) : '',
      heightCm: customer.heightCm !== undefined ? String(customer.heightCm) : '',
    })
    setDraftDocuments([])
    setIsFormOpen(true)
  }

  async function handleSaveCustomer() {
    setFormError('')

    if (!draft.fullName.trim()) {
      setFormError('กรุณากรอกชื่อ-นามสกุล')
      return
    }

    if (!validateThaiPhone(draft.phone)) {
      setFormError('กรุณากรอกเบอร์โทรไทย 10 หลัก เช่น 0987654321')
      return
    }

    const duplicate = findPhoneDuplicate(customers, draft.phone, editingCustomerId ?? undefined)

    if (duplicate.kind === 'phone') {
      setSelectedCustomerId(duplicate.customer.id)
      setFormError(`เบอร์นี้มีอยู่แล้วในลูกค้า ${duplicate.customer.customerCode}`)
      return
    }

    if (editingCustomerId) {
      if (supabase) {
        try {
          const updatedCustomer = await updateRemoteCustomer(supabase, editingCustomerId, draft)
          if (draftDocuments.length > 0) {
            await uploadRemoteCustomerDocuments(
              supabase,
              updatedCustomer,
              draftDocuments.map((d) => d.file),
            )
            const loadedCustomers = await loadCustomers(supabase)
            setCustomers(loadedCustomers)
            setSelectedCustomerId(updatedCustomer.id)
          } else {
            setCustomers((current) =>
              current.map((customer) =>
                customer.id === editingCustomerId ? updatedCustomer : customer
              )
            )
            setSelectedCustomerId(updatedCustomer.id)
          }
          setDraft(emptyDraft)
          setDraftDocuments([])
          setEditingCustomerId(null)
          setIsFormOpen(false)
        } catch (error) {
          setFormError(getErrorMessage(error))
        }
        return
      }

      const now = new Date().toISOString()
      const existingCustomer = customers.find((c) => c.id === editingCustomerId)
      if (!existingCustomer) return

      const newDocsFromDraft = draftDocuments.map((doc, index) => ({
        id: doc.id,
        customerId: editingCustomerId,
        storagePath: `customer-documents/demo/${doc.file.name}`,
        previewUrl: doc.previewUrl,
        sortOrder: existingCustomer.documents.length + index + 1,
        createdAt: now,
      }))

      const updatedCustomer: Customer = {
        ...existingCustomer,
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
        documents: [...existingCustomer.documents, ...newDocsFromDraft],
        updatedAt: now,
      }

      setCustomers((current) =>
        current.map((customer) =>
          customer.id === editingCustomerId ? updatedCustomer : customer
        )
      )
      setSelectedCustomerId(updatedCustomer.id)
      setDraft(emptyDraft)
      setDraftDocuments([])
      setEditingCustomerId(null)
      setIsFormOpen(false)
      return
    }

    if (supabase) {
      if (!shopId) {
        setFormError('ยังไม่พบร้านสำหรับบัญชีนี้')
        return
      }

      try {
        const newCustomer = await createRemoteCustomer(supabase, shopId, draft)
        if (draftDocuments.length > 0) {
          await uploadRemoteCustomerDocuments(
            supabase,
            newCustomer,
            draftDocuments.map((d) => d.file),
          )
          const loadedCustomers = await loadCustomers(supabase)
          setCustomers(loadedCustomers)
          setSelectedCustomerId(newCustomer.id)
        } else {
          setCustomers((current) => [newCustomer, ...current])
          setSelectedCustomerId(newCustomer.id)
        }
        setDraft(emptyDraft)
        setDraftDocuments([])
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
      documents: draftDocuments.map((doc, index) => ({
        id: doc.id,
        customerId: '',
        storagePath: `customer-documents/demo/${doc.file.name}`,
        previewUrl: doc.previewUrl,
        sortOrder: index + 1,
        createdAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    }

    setCustomers((current) => [newCustomer, ...current])
    setSelectedCustomerId(newCustomer.id)
    setDraft(emptyDraft)
    setDraftDocuments([])
    setIsFormOpen(false)
  }

  async function handleSaveStockItem() {
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

    const draftItem: Omit<StockItem, 'id' | 'createdAt'> = {
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
    }

    if (supabase && isAuthenticated) {
      if (!shopId) {
        setStockFormError('ยังไม่พบร้านสำหรับบัญชีนี้')
        return
      }

      try {
        let savedItem: StockItem
        if (editingStockId) {
          savedItem = await updateRemoteStockItem(
            supabase,
            shopId,
            editingStockId,
            draftItem,
            existingItem?.imageUrls ?? []
          )
          setStockItems((current) =>
            current.map((item) => (item.id === editingStockId ? savedItem : item))
          )
        } else {
          savedItem = await createRemoteStockItem(supabase, shopId, draftItem)
          setStockItems((current) => [savedItem, ...current])
        }
        
        handleLoadAuditLogs()
        closeStockForm()
      } catch (err) {
        setStockFormError(getErrorMessage(err))
      }
      return
    }

    // Local Storage Fallback
    const savedItem: StockItem = {
      ...draftItem,
      id: editingStockId ?? crypto.randomUUID(),
      createdAt: existingItem?.createdAt ?? new Date().toISOString(),
    }

    setStockItems((current) =>
      editingStockId
        ? current.map((item) => (item.id === editingStockId ? savedItem : item))
        : [savedItem, ...current],
    )
    closeStockForm()
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

    const confirmed = window.confirm(
      `คุณต้องการลบข้อมูลลูกค้ารายนี้ใช่หรือไม่?\n\nข้อมูลลูกค้า ${selectedCustomer.fullName} (${selectedCustomer.customerCode}) จะถูกลบ/ซ่อนออกจากระบบ`
    )
    if (!confirmed) return

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

    const incomingFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    const remainingSlots = 5 - selectedCustomer.documents.length

    if (remainingSlots <= 0) {
      window.alert('รูปเอกสารเต็ม 5 รูปต่อลูกค้าแล้ว')
      return
    }

    const filesToUpload = incomingFiles.slice(0, remainingSlots)
    if (incomingFiles.length > remainingSlots) {
      window.alert(`สามารถเพิ่มรูปได้อีกเพียง ${remainingSlots} รูป ระบบจะทำการเลือกเฉพาะ ${remainingSlots} รูปแรก`)
    }

    if (supabase) {
      try {
        await uploadRemoteCustomerDocuments(supabase, selectedCustomer, filesToUpload)
        const loadedCustomers = await loadCustomers(supabase)
        setCustomers(loadedCustomers)
        setSelectedCustomerId(selectedCustomer.id)
      } catch (error) {
        window.alert(getErrorMessage(error))
      }
      return
    }

    const now = new Date().toISOString()
    const newDocuments: CustomerDocument[] = filesToUpload.map((file, index) => ({
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
      <SideNav activeTab={activeTab} onTabChange={handleTabChange} />
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
            externalSelectedRentalId={externalSelectedRentalId}
            onSelectRental={setExternalSelectedRentalId}
            externalIsFormOpen={externalIsFormOpen}
            onFormOpenChange={setExternalIsFormOpen}
            externalPickupDate={externalPickupDate}
            externalReturnDate={externalReturnDate}
            onClearExternalDates={handleClearExternalDates}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarPage
            rentals={rentals}
            onUpdateRentalStatus={handleUpdateRentalStatus}
            onNavigateToRentals={handleNavigateToRentals}
            onNavigateToCreateRental={handleNavigateToCreateRental}
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
            onPreview={openStockPreview}
            onDraftChange={updateStockDraft}
            onResetDraft={() => setStockDraft(emptyStockDraft)}
            onImageUpload={addStockImages}
            onImageRemove={removeStockImage}
            onSave={handleSaveStockItem}
            previewItem={previewStockItem}
            previewImageIndex={previewImageIndex}
            onPreviewIndexChange={setPreviewImageIndex}
            onClosePreview={closeStockPreview}
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
                  onEdit={() => openEditCustomerForm(selectedCustomer)}
                />
              )}
            </section>

            {isFormOpen && (
              <div className="modal-backdrop" role="presentation">
                <section className="modal-panel" aria-label="เพิ่มลูกค้า">
                  <div className="modal-header">
                    <div>
                      <p className="eyebrow">Customer Profile</p>
                      <h2>{editingCustomerId ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h2>
                    </div>
                    <button className="ghost-button" type="button" onClick={() => { setIsFormOpen(false); setDraft(emptyDraft); setDraftDocuments([]); setFormError(''); setEditingCustomerId(null); }}>
                      ปิด
                    </button>
                  </div>

                  <div className="form-grid">
                    <TextField label="ชื่อ-นามสกุล" value={draft.fullName} onChange={(value) => updateDraft('fullName', value)} required />
                    <TextField
                      label="เบอร์โทรศัพท์"
                      value={draft.phone}
                      onChange={(value) => {
                        const onlyNums = value.replace(/\D/g, '')
                        if (onlyNums.length <= 10) {
                          updateDraft('phone', onlyNums)
                        }
                      }}
                      inputMode="numeric"
                      maxLength={10}
                      required
                    />
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

                  <div className="customer-document-section" style={{ marginTop: '20px' }}>
                    <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>เอกสารยืนยันตัวตน (สูงสุด 5 รูป)</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{draftDocuments.length}/5 รูป</span>
                    </div>
                    <label className="upload-box">
                      <Camera size={20} />
                      เพิ่มรูปเอกสาร/บัตรประชาชน (เลือกพร้อมกันได้หลายรูป)
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => addDraftDocuments(event.target.files)}
                      />
                    </label>
                    {draftDocuments.length > 0 && (
                       <div className="document-grid" style={{ marginTop: '12px' }}>
                         {draftDocuments.map((doc, index) => (
                           <figure key={doc.id} style={{ position: 'relative', margin: 0 }}>
                             <img src={doc.previewUrl} alt={`เอกสารร่างที่ ${index + 1}`} />
                             <button
                               type="button"
                               onClick={() => removeDraftDocument(doc.id)}
                               aria-label={`ลบรูปเอกสารที่ ${index + 1}`}
                               style={{
                                 position: 'absolute',
                                 top: '8px',
                                 right: '8px',
                                 background: 'rgba(7, 10, 18, 0.86)',
                                 border: '1px solid rgba(255, 255, 255, 0.14)',
                                 borderRadius: '999px',
                                 color: 'var(--text-bright)',
                                 display: 'flex',
                                 width: '28px',
                                 height: '28px',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 cursor: 'pointer',
                               }}
                             >
                               <X size={16} />
                             </button>
                             <figcaption>รูปที่ {index + 1}</figcaption>
                           </figure>
                         ))}
                       </div>
                    )}
                  </div>

                  {formError && <p className="form-error">{formError}</p>}

                  <div className="modal-actions">
                    {editingCustomerId ? (
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => {
                          const customer = customers.find((c) => c.id === editingCustomerId)
                          if (customer) {
                            setDraft({
                              fullName: customer.fullName,
                              lineAccount: customer.lineAccount,
                              phone: customer.phone,
                              currentAddress: customer.currentAddress,
                              notes: customer.notes,
                              profileStatus: customer.profileStatus,
                              riskFlag: customer.riskFlag,
                              bustIn: customer.bustIn !== undefined ? String(customer.bustIn) : '',
                              waistIn: customer.waistIn !== undefined ? String(customer.waistIn) : '',
                              hipIn: customer.hipIn !== undefined ? String(customer.hipIn) : '',
                              heightCm: customer.heightCm !== undefined ? String(customer.heightCm) : '',
                            })
                            setDraftDocuments([])
                          }
                        }}
                      >
                        รีเซ็ตค่าเดิม
                      </button>
                    ) : (
                      <button className="secondary-button" type="button" onClick={() => { setDraft(emptyDraft); setDraftDocuments([]); }}>
                        ล้างฟอร์ม
                      </button>
                    )}
                    <button className="primary-button" type="button" onClick={handleSaveCustomer}>
                      {editingCustomerId ? 'บันทึกการแก้ไข' : 'บันทึกลูกค้า'}
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

        {activeTab === 'audit' && (
          <AuditLogPage
            auditLogs={auditLogs}
            loading={loadingAudit}
            onRefresh={handleLoadAuditLogs}
          />
        )}

        {activeTab !== 'dashboard' && activeTab !== 'inventory' && activeTab !== 'customers' && activeTab !== 'rentals' && activeTab !== 'calendar' && activeTab !== 'settings' && activeTab !== 'audit' && (
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
      <UpdatePrompt />
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
    { id: 'audit', label: 'ประวัติระบบ', icon: History },
  ]

  return (
    <aside className="side-nav" aria-label="เมนูหลัก">
      <div className="brand-logo" aria-label="Precious Rental">
        <img src="/web-logo.png" alt="Precious Rental" style={{ width: '100%', maxWidth: '160px', height: 'auto', display: 'block', margin: '0 auto' }} />
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
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
    return (localStorage.getItem('inventoryViewMode') as 'table' | 'card') || 'table'
  })

  const handleViewModeChange = (mode: 'table' | 'card') => {
    setViewMode(mode)
    localStorage.setItem('inventoryViewMode', mode)
  }

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
              <span>SKU</span>
              <span>สินค้า</span>
              <span>ไซซ์/สี</span>
              <span>ค่าเช่า</span>
              <span>ค่าปรับ</span>
              <span>ประกัน</span>
              <span>จัดการ</span>
            </div>
            {items.map((item) => (
              <div className="stock-row" key={item.id} role="row">
                <div className="stock-image-thumbnail">
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <img
                      src={item.imageUrls[0]}
                      alt={item.productName}
                      onClick={() => onPreview(item, 0)}
                      style={{ cursor: 'pointer' }}
                    />
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
                    <button
                      className="inline-link-button"
                      type="button"
                      onClick={() => onPreview(item, 0)}
                      aria-label={`ดูรูป ${item.sku}`}
                    >
                      <Images size={14} />
                      ดูรูป {item.imageUrls.length}
                    </button>
                  )}
                </div>
                <span>
                  {item.size || '-'}
                  <small>{item.primaryColor || '-'}</small>
                </span>
                <span>{formatBaht(item.rentalPricePerDay)}</span>
                <span>{item.lateFeeRule || '-'}</span>
                <span>{formatBaht(item.depositAmount)}</span>
                <div className="stock-action-group">
                  <button
                    className="icon-action-button compact"
                    type="button"
                    onClick={() => onPreview(item, 0)}
                    aria-label={`ดูรูป ${item.sku}`}
                    disabled={item.imageUrls.length === 0}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="icon-action-button compact"
                    type="button"
                    onClick={() => onEdit(item)}
                    aria-label={`แก้ไข ${item.sku}`}
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="empty-state">ยังไม่มีรายการที่ตรงกับคำค้นหา</div>}
          </div>
        ) : (
          <div className="stock-grid">
            {items.map((item) => (
              <div className="stock-card" key={item.id}>
                <div className="stock-card-image">
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <img
                      src={item.imageUrls[0]}
                      alt={item.productName}
                      onClick={() => onPreview(item, 0)}
                      style={{ cursor: 'pointer' }}
                    />
                  ) : (
                    <div className="stock-card-image-placeholder">
                      <FileImage size={32} />
                    </div>
                  )}
                  <span className="stock-card-sku-badge">{item.sku}</span>
                </div>
                <div className="stock-card-content">
                  <div className="stock-card-title-section">
                    <h3 className="stock-card-title">{item.productName}</h3>
                    <p className="stock-card-subtitle">
                      {[item.brand, item.category, item.serialNumber].filter(Boolean).join(' | ') || '-'}
                    </p>
                  </div>
                  
                  <div className="stock-card-specs">
                    {item.size && <span className="stock-card-spec-tag">ไซซ์: {item.size}</span>}
                    {item.primaryColor && <span className="stock-card-spec-tag">สี: {item.primaryColor}</span>}
                    {item.setCount && <span className="stock-card-spec-tag">จำนวน: {item.setCount} ชุด</span>}
                  </div>

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
                  <button
                    className="icon-action-button compact"
                    type="button"
                    onClick={() => onPreview(item, 0)}
                    aria-label={`ดูรูป ${item.sku}`}
                    disabled={item.imageUrls.length === 0}
                    title="ดูรูปภาพ"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="icon-action-button compact"
                    type="button"
                    onClick={() => onEdit(item)}
                    aria-label={`แก้ไข ${item.sku}`}
                    title="แก้ไข"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="empty-state" style={{ gridColumn: '1 / -1' }}>ยังไม่มีรายการที่ตรงกับคำค้นหา</div>}
          </div>
        )}
      </section>

      {previewItem && (
        <div className="modal-backdrop stock-preview-backdrop" role="presentation" onClick={onClosePreview}>
          <section
            className="modal-panel stock-preview-panel"
            aria-label="ดูรูปชุด"
            onClick={(event) => event.stopPropagation()}
          >
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
              <img
                src={previewItem.imageUrls[previewImageIndex]}
                alt={`รูปชุด ${previewImageIndex + 1} ของ ${previewItem.productName}`}
              />
            </div>

            <div className="stock-preview-meta">
              <span>{previewItem.sku}</span>
              <span>
                รูปที่ {previewImageIndex + 1}/{previewItem.imageUrls.length}
              </span>
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
                <span>เพิ่มรูปชุดได้สูงสุด 5 รูป (เลือกพร้อมกันได้หลายรูป)</span>
                <input
                  ref={fileInputRef}
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
                        <div
                          className="stock-image-empty"
                          style={{ cursor: 'pointer' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
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
  onEdit,
}: {
  customer: Customer
  onStatusChange: (status: CustomerProfileStatus) => void
  onRiskChange: (riskFlag: RiskFlag) => void
  onArchive: () => void
  onDocumentUpload: (files: FileList | null) => void
  onEdit: () => void
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
          อัปโหลดรูปเอกสาร/บัตรประชาชน (เลือกพร้อมกันได้หลายรูป)
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
      <div className="detail-action-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
        <button className="secondary-button" type="button" onClick={onEdit} style={{ minHeight: '44px', width: '100%', gap: '8px' }}>
          <Pencil size={18} />
          แก้ไขข้อมูล
        </button>
        <button className="archive-button" type="button" onClick={onArchive} style={{ minHeight: '44px', width: '100%', gap: '8px', marginTop: 0 }}>
          <Trash2 size={18} />
          ลบลูกค้า
        </button>
      </div>
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
  maxLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  type?: InputHTMLAttributes<HTMLInputElement>['type']
  placeholder?: string
  maxLength?: number
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
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function parseOptionalNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && value.trim() ? parsed : undefined
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error(`ไม่สามารถอ่านไฟล์ ${file.name} ได้`))
    reader.readAsDataURL(file)
  })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}

export default App
