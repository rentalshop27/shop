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
  ShieldCheck,
  Trash2,
  UserRound,
  X,
  History,
  Shirt,
  BarChart3,
} from 'lucide-react'
import './index.css'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { RentalsPage } from './features/rentals/RentalsPage'
import { CalendarPage } from './features/calendar/CalendarPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { AuditLogPage } from './features/audit/AuditLogPage'
import { ReportsPage } from './features/reports/ReportsPage'
import { UpdatePrompt } from './features/settings/UpdatePrompt'
import { demoRentals, demoStockItemsForRentals } from './features/rentals/rentalSeed'
import type { RentalOrder, RentalStatus } from './features/rentals/rentalTypes'
import { getInventoryDisplayStatus } from './features/inventory/inventoryStatus'
import { findOpenRentalConflict } from './features/rentals/rentalRules'
import {
  createRemoteRentals,
  loadRentals,
} from './features/rentals/rentalRemote'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import { demoCustomers } from './features/customers/customerSeed'
import { loadAuditLogs, demoAuditLogs } from './features/audit/auditRemote'
import type { AuditLog } from './features/audit/auditRemote'
import {
  archiveRemoteCustomer,
  createRemoteCustomer,
  deleteRemoteCustomerDocuments,
  loadAccessibleShops,
  loadCustomers,
  type ShopSummary,
  updateRemoteCustomer,
  updateRemoteCustomerRisk,
  updateRemoteCustomerStatus,
  uploadRemoteCustomerDocuments,
} from './features/customers/customerRemote'
import {
  countRemoteRentalsForStockSku,
  loadStockItems,
  createRemoteStockItem,
  createRemoteStockItems,
  deleteRemoteStockItem,
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
  sanitizeThaiPhoneInput,
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

type ViewKey = 'dashboard' | 'inventory' | 'customers' | 'rentals' | 'calendar' | 'settings' | 'audit' | 'reports'

export type StockItemStatus = 'available' | 'repair' | 'wash'

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
  status: StockItemStatus
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
  status: string
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
  status: 'available',
}

const demoStockItems: StockItem[] = demoStockItemsForRentals
const DEMO_SHOP_ID = 'shop_demo'
const DEFAULT_BRANDS = ['Precious', 'Chanel', 'Dior', 'Gucci']
const DEFAULT_CATEGORIES = ['ชุดราตรี', 'ชุดไทย', 'ชุดสูท', 'ชุดแต่งงาน']
const DEFAULT_COLORS = ['น้ำเงินมิดไนต์', 'แดงไวน์', 'ชมพูโรส', 'ทองแชมเปญ', 'ขาวมุก', 'ดำคลาสสิก']
const LAST_SELECTED_SHOP_KEY_PREFIX = 'precious_last_shop:'

const statusOptions: Array<{ value: 'all' | CustomerProfileStatus | 'has_risk'; label: string }> = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'incomplete', label: profileStatusLabel.incomplete },
  { value: 'pending_review', label: profileStatusLabel.pending_review },
  { value: 'verified', label: profileStatusLabel.verified },
  { value: 'suspended', label: profileStatusLabel.suspended },
  { value: 'has_risk', label: 'มีสัญญาณความเสี่ยง' },
]

async function refreshAuditLogs(
  isAuthenticated: boolean,
  shopId: string | null,
  setLoadingAudit: (loading: boolean) => void,
  setAuditLogs: (logs: AuditLog[]) => void,
) {
  if (!supabase || !isAuthenticated || !shopId) return
  try {
    setLoadingAudit(true)
    const logs = await loadAuditLogs(supabase, shopId)
    setAuditLogs(logs)
  } catch (error) {
    console.warn('Failed to load audit logs from Supabase, using demo logs:', error)
    setAuditLogs(demoAuditLogs)
  } finally {
    setLoadingAudit(false)
  }
}

function formatBaht(value: number) {
  return `฿${value.toLocaleString('th-TH', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

function getLocalArray<T>(key: string, fallback: T[]): T[] {
  if (hasSupabaseConfig) return fallback

  const saved = localStorage.getItem(key)
  if (!saved) return fallback

  try {
    return JSON.parse(saved) as T[]
  } catch {
    return fallback
  }
}

function getLastSelectedShopKey(userId: string) {
  return `${LAST_SELECTED_SHOP_KEY_PREFIX}${userId}`
}

function getPreferredShopId(userId: string | null, shops: ShopSummary[]) {
  if (shops.length === 0) return null
  if (!userId) return shops.length === 1 ? shops[0].id : null

  const savedShopId = localStorage.getItem(getLastSelectedShopKey(userId))
  if (savedShopId && shops.some((shop) => shop.id === savedShopId)) {
    return savedShopId
  }

  return shops.length === 1 ? shops[0].id : null
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

  const [customers, setCustomers] = useState<Customer[]>(hasSupabaseConfig ? [] : demoCustomers)
  const [stockItems, setStockItems] = useState<StockItem[]>(() =>
    getLocalArray('precious_stock_items', demoStockItems)
  )
  const [selectedCustomerId, setSelectedCustomerId] = useState(hasSupabaseConfig ? '' : demoCustomers[0]?.id ?? '')
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [stockQuery, setStockQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerProfileStatus | 'has_risk'>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isStockFormOpen, setIsStockFormOpen] = useState(false)
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [previewStockId, setPreviewStockId] = useState<string | null>(null)
  const [previewImageIndex, setPreviewImageIndex] = useState(0)
  const [previewCustomerDocOwnerId, setPreviewCustomerDocOwnerId] = useState<string | null>(null)
  const [previewCustomerDocIndex, setPreviewCustomerDocIndex] = useState<number>(0)
  const previewCustomer = useMemo(() => {
    return customers.find((c) => c.id === previewCustomerDocOwnerId)
  }, [customers, previewCustomerDocOwnerId])
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft)
  const [draftDocuments, setDraftDocuments] = useState<Array<{ id: string; file: File; previewUrl: string }>>([])
  const [existingDocuments, setExistingDocuments] = useState<CustomerDocument[]>([])
  const [deletedDocumentIds, setDeletedDocumentIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  async function addDraftDocuments(files: FileList | null) {
    if (!files?.length) return

    const incomingFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    const remainingSlots = 5 - existingDocuments.length - draftDocuments.length

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

  const [brands, setBrands] = useState<string[]>(() => getLocalArray('precious_brands', DEFAULT_BRANDS))
  const [categories, setCategories] = useState<string[]>(() => getLocalArray('precious_categories', DEFAULT_CATEGORIES))
  const [colors, setColors] = useState<string[]>(() => getLocalArray('precious_colors', DEFAULT_COLORS))
  const [availableShops, setAvailableShops] = useState<ShopSummary[]>([])
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [shopsReady, setShopsReady] = useState(!hasSupabaseConfig)
  const [isShopDataLoading, setIsShopDataLoading] = useState(false)

  useEffect(() => {
    if (hasSupabaseConfig) return
    localStorage.setItem('precious_brands', JSON.stringify(brands))
  }, [brands])

  useEffect(() => {
    if (hasSupabaseConfig) return
    localStorage.setItem('precious_categories', JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    if (hasSupabaseConfig) return
    localStorage.setItem('precious_colors', JSON.stringify(colors))
  }, [colors])

  useEffect(() => {
    if (hasSupabaseConfig) return
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
      } catch {
        return demoRentals
      }
    }
    return demoRentals
  })

  useEffect(() => {
    localStorage.setItem('precious_rentals', JSON.stringify(rentals))
  }, [rentals])

  async function handleCreateRentals(drafts: Omit<RentalOrder, 'id' | 'orderCode' | 'createdAt' | 'updatedAt'>[]): Promise<boolean> {
    if (drafts.length === 0) return false

    const firstDraft = drafts[0]
    const customerRentalGuard = canCreateRentalForCustomer(firstDraft.customer)
    if (!customerRentalGuard.allowed) {
      window.alert(customerRentalGuard.message || 'ไม่สามารถสร้างรายการเช่าสำหรับลูกค้ารายนี้ได้')
      return false
    }

    const openRentalConflict = findOpenRentalConflict(
      rentals,
      drafts.map((draft) => draft.costume.sku),
      firstDraft.pickupDate,
      firstDraft.returnDate
    )
    if (openRentalConflict) {
      window.alert(`ชุด ${openRentalConflict.costume.sku} มีคิวจองหรือใช้งานในช่วงวันที่ระบุแล้ว (${openRentalConflict.orderCode}) ไม่สามารถเช่าซ้ำได้`)
      return false
    }

    const nowLocal = new Date()
    const yy = String(nowLocal.getFullYear()).slice(-2)
    const mm = String(nowLocal.getMonth() + 1).padStart(2, '0')
    const dd = String(nowLocal.getDate()).padStart(2, '0')
    const dateStr = `${yy}${mm}${dd}`

    const prefixRegex = new RegExp(`^PR-ORD-${dateStr}-(\\d+)(?:-\\d+)?$`)

    let maxSeq = 0
    rentals.forEach((r) => {
      const match = r.orderCode.match(prefixRegex)
      if (match) {
        const seq = parseInt(match[1], 10)
        if (seq > maxSeq) {
          maxSeq = seq
        }
      }
    })

    const nextSeq = maxSeq + 1
    const nextSeqStr = String(nextSeq).padStart(3, '0')
    const nextCode = `PR-ORD-${dateStr}-${nextSeqStr}`

    const now = new Date().toISOString()
    const newRentals: RentalOrder[] = drafts.map((draft, index) => ({
      ...draft,
      id: crypto.randomUUID(),
      orderCode: drafts.length > 1 ? `${nextCode}-${index + 1}` : nextCode,
      createdAt: now,
      updatedAt: now
    }))

    if (supabase && isAuthenticated) {
      if (!shopId) {
        window.alert('ยังไม่พบร้านสำหรับบัญชีนี้')
        return false
      }

      try {
        await createRemoteRentals(supabase, shopId, newRentals)
        handleLoadAuditLogs()
      } catch (error) {
        window.alert(getErrorMessage(error))
        return false
      }
    }

    setRentals((current) => [...newRentals, ...current])
    return true
  }

  async function handleUpdateRentalStatus(rentalIdOrIds: string | string[], status: RentalStatus) {
    const ids = Array.isArray(rentalIdOrIds) ? rentalIdOrIds : [rentalIdOrIds]
    if (ids.length === 0) return

    if (supabase && isAuthenticated) {
      try {
        const { error } = await supabase
          .from('rentals')
          .update({ status, updated_at: new Date().toISOString() })
          .in('id', ids)

        if (error) throw error
        handleLoadAuditLogs()
      } catch (error) {
        window.alert(getErrorMessage(error))
        return
      }
    }

    setRentals((current) =>
      current.map((r) =>
        ids.includes(r.id)
          ? { ...r, status, updatedAt: new Date().toISOString() }
          : r
      )
    )
  }

  async function handleDeleteRental(rentalIdOrIds: string | string[]) {
    const ids = Array.isArray(rentalIdOrIds) ? rentalIdOrIds : [rentalIdOrIds]
    if (ids.length === 0) return

    if (supabase && isAuthenticated) {
      try {
        const { error } = await supabase
          .from('rentals')
          .delete()
          .in('id', ids)

        if (error) throw error
        handleLoadAuditLogs()
      } catch (error) {
        window.alert(getErrorMessage(error))
        return
      }
    }

    setRentals((current) => current.filter((r) => !ids.includes(r.id)))
  }
  const [formError, setFormError] = useState('')
  const [stockFormError, setStockFormError] = useState('')
  const [sessionReady, setSessionReady] = useState(!hasSupabaseConfig)
  const [isAuthenticated, setIsAuthenticated] = useState(!hasSupabaseConfig)
  const [shopId, setShopId] = useState<string | null>(null)
  const [remoteError, setRemoteError] = useState('')
  const currentShop = availableShops.find((shop) => shop.id === shopId) ?? null

  useEffect(() => {
    if (!supabase) return

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setIsAuthenticated(Boolean(data.session))
      setAuthUserId(data.session?.user.id ?? null)
      setShopsReady(!data.session)
      setSessionReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session))
      setAuthUserId(session?.user.id ?? null)
      setShopsReady(!session)
      if (!session) {
        setAvailableShops([])
        setShopId(null)
        setRemoteError('')
      }
      setSessionReady(true)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !isAuthenticated || !authUserId) return

    let cancelled = false

    setShopsReady(false)
    setRemoteError('')

    loadAccessibleShops(supabase)
      .then((shops) => {
        if (cancelled) return

        setAvailableShops(shops)

        if (shops.length === 0) {
          setShopId(null)
          setRemoteError('ยังไม่พบร้านของผู้ใช้นี้ กรุณาสร้าง row ใน shops และ shop_members ก่อน')
          return
        }

        setShopId(getPreferredShopId(authUserId, shops))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setAvailableShops([])
        setShopId(null)
        setRemoteError(getErrorMessage(error))
      })
      .finally(() => {
        if (!cancelled) {
          setShopsReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [authUserId, isAuthenticated])

  useEffect(() => {
    if (!authUserId || !shopId) return
    localStorage.setItem(getLastSelectedShopKey(authUserId), shopId)
  }, [authUserId, shopId])

  useEffect(() => {
    if (!supabase || !isAuthenticated || !shopId) return

    let cancelled = false
    const client = supabase

    setIsShopDataLoading(true)
    setRemoteError('')
    setCustomers([])
    setStockItems([])
    setRentals([])
    setAuditLogs([])
    setSelectedCustomerId('')
    setFormError('')
    setStockFormError('')
    setIsMobileDetailOpen(false)
    setIsFormOpen(false)
    setIsStockFormOpen(false)
    setEditingCustomerId(null)
    setEditingStockId(null)
    setPreviewStockId(null)
    setPreviewCustomerDocOwnerId(null)
    setPreviewCustomerDocIndex(0)
    setPreviewImageIndex(0)
    setExternalSelectedRentalId('')
    setExternalIsFormOpen(false)
    setExternalPickupDate('')
    setExternalReturnDate('')
    setDraft(emptyDraft)
    setDraftDocuments([])
    setExistingDocuments([])
    setDeletedDocumentIds([])
    setStockDraft(emptyStockDraft)
    setQuery('')
    setStockQuery('')
    setCurrentPage(1)
    setStatusFilter('all')
    setBrands(DEFAULT_BRANDS)
    setCategories(DEFAULT_CATEGORIES)
    setColors(DEFAULT_COLORS)

    Promise.all([
      loadCustomers(client, shopId),
      loadStockItems(client, shopId),
      loadShopSettings(client, shopId),
      loadAuditLogs(client, shopId),
    ])
      .then(async ([loadedCustomers, loadedStock, settings, loadedAuditLogs]) => {
        if (cancelled) return

        setCustomers(loadedCustomers)
        setStockItems(loadedStock)
        setAuditLogs(loadedAuditLogs)
        setSelectedCustomerId(loadedCustomers[0]?.id ?? '')

        const loadedRentals = await loadRentals(client, shopId, loadedCustomers, loadedStock)
        if (cancelled) return

        setRentals(loadedRentals)

        if (settings?.brands?.length) setBrands(settings.brands)
        if (settings?.categories?.length) setCategories(settings.categories)
        if (settings?.colors?.length) setColors(settings.colors)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setRemoteError(getErrorMessage(error))
        setAuditLogs(demoAuditLogs)
      })
      .finally(() => {
        if (!cancelled) {
          setIsShopDataLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, shopId])

  async function handleLoadAuditLogs() {
    await refreshAuditLogs(isAuthenticated, shopId, setLoadingAudit, setAuditLogs)
  }

  const activeCustomers = customers.filter((customer) => !customer.archivedAt)

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return activeCustomers.filter((customer) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'has_risk'
          ? customer.riskFlag === 'has_risk'
          : customer.profileStatus === statusFilter
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
    filteredCustomers.find((customer) => customer.id === selectedCustomerId) ??
    filteredCustomers[0]

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
      status: item.status || 'available',
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

  async function handleDeleteStockItem(item: StockItem) {
    try {
      let relatedRentalCount = rentals.filter(
        (rental) => rental.costume.id === item.id || rental.costume.sku === item.sku,
      ).length

      if (supabase && isAuthenticated) {
        if (!shopId) {
          window.alert('ยังไม่พบร้านสำหรับบัญชีนี้')
          return
        }
        relatedRentalCount = await countRemoteRentalsForStockSku(supabase, shopId, item.sku)
      }

      if (relatedRentalCount > 0) {
        window.alert(`ยังลบชุด ${item.sku} ไม่ได้ เพราะมีใบเช่าที่อ้างอิงชุดนี้อยู่ ${relatedRentalCount} รายการ`)
        return
      }
    } catch (error) {
      window.alert(getErrorMessage(error))
      return
    }

    const confirmed = window.confirm(
      `คุณต้องการลบชุด "${item.productName}" (${item.sku}) ใช่หรือไม่?\n\nข้อมูลชุดและรูปภาพของชุดนี้จะถูกลบออกจากระบบ`
    )
    if (!confirmed) return

    setStockFormError('')
    setIsSaving(true)

    try {
      if (supabase && isAuthenticated) {
        await deleteRemoteStockItem(supabase, item.id, item.imageUrls)
        handleLoadAuditLogs()
      }

      setStockItems((current) => current.filter((stockItem) => stockItem.id !== item.id))

      if (editingStockId === item.id) {
        closeStockForm()
      }

      if (previewStockId === item.id) {
        closeStockPreview()
      }
    } catch (error) {
      window.alert(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateStockStatus(itemId: string, newStatus: StockItemStatus) {
    try {
      if (supabase && isAuthenticated) {
        const { error } = await supabase
          .from('stock_items')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId)
        if (error) throw error
        handleLoadAuditLogs()
      }
      setStockItems((current) =>
        current.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
      )
    } catch (error) {
      window.alert(getErrorMessage(error))
    }
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
    setExistingDocuments(customer.documents || [])
    setDeletedDocumentIds([])
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
      setIsMobileDetailOpen(true)
      setFormError(`เบอร์นี้มีอยู่แล้วในลูกค้า ${duplicate.customer.customerCode}`)
      return
    }

    const documentCount = existingDocuments.length + draftDocuments.length
    if (draft.profileStatus === 'verified' && documentCount === 0) {
      const confirmed = window.confirm(
        'ลูกค้ายังไม่มีรูปเอกสาร ต้องการบันทึกเป็นตรวจแล้วใช่ไหม?',
      )
      if (!confirmed) return
    }

    setIsSaving(true)
    try {
      if (editingCustomerId) {
        let docsPendingDelete: CustomerDocument[] = []
        if (supabase) {
          if (deletedDocumentIds.length > 0) {
            const originalCustomer = customers.find((c) => c.id === editingCustomerId)
            if (originalCustomer) {
              docsPendingDelete = originalCustomer.documents.filter((doc) =>
                deletedDocumentIds.includes(doc.id)
              )
            }
          }

          if (docsPendingDelete.length > 0) {
            const pathsToDelete = docsPendingDelete.map((doc) => doc.storagePath).filter(Boolean)
            await deleteRemoteCustomerDocuments(supabase, docsPendingDelete.map((doc) => doc.id), pathsToDelete)
          }

          const updatedCustomer = await updateRemoteCustomer(supabase, editingCustomerId, draft)
          if (draftDocuments.length > 0) {
            await uploadRemoteCustomerDocuments(
              supabase,
              updatedCustomer,
              draftDocuments.map((d) => d.file),
            )
          }

          const loadedCustomers = await loadCustomers(supabase, updatedCustomer.shopId)
          setCustomers(loadedCustomers)
          setSelectedCustomerId(updatedCustomer.id)
          setIsMobileDetailOpen(true)

          setDraft(emptyDraft)
          setDraftDocuments([])
          setExistingDocuments([])
          setDeletedDocumentIds([])
          setEditingCustomerId(null)
          setIsFormOpen(false)
          return
        }

        const now = new Date().toISOString()
        const existingCustomer = customers.find((c) => c.id === editingCustomerId)
        if (!existingCustomer) return

        const remainingExistingDocs = existingCustomer.documents.filter(
          (doc) => !deletedDocumentIds.includes(doc.id)
        )

        const newDocsFromDraft = draftDocuments.map((doc, index) => ({
          id: doc.id,
          customerId: editingCustomerId,
          storagePath: `customer-documents/demo/${doc.file.name}`,
          previewUrl: doc.previewUrl,
          sortOrder: remainingExistingDocs.length + index + 1,
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
          documents: [...remainingExistingDocs, ...newDocsFromDraft],
          updatedAt: now,
        }

        setCustomers((current) =>
          current.map((customer) =>
            customer.id === editingCustomerId ? updatedCustomer : customer
          )
        )
        setSelectedCustomerId(updatedCustomer.id)
        setIsMobileDetailOpen(true)
        setDraft(emptyDraft)
        setDraftDocuments([])
        setExistingDocuments([])
        setDeletedDocumentIds([])
        setEditingCustomerId(null)
        setIsFormOpen(false)
        return
      }

      if (supabase) {
        if (!shopId) {
          setFormError('ยังไม่พบร้านสำหรับบัญชีนี้')
          return
        }

        const newCustomer = await createRemoteCustomer(supabase, shopId, draft)
        if (draftDocuments.length > 0) {
          await uploadRemoteCustomerDocuments(
            supabase,
            newCustomer,
            draftDocuments.map((d) => d.file),
          )
          const loadedCustomers = await loadCustomers(supabase, shopId)
          setCustomers(loadedCustomers)
          setSelectedCustomerId(newCustomer.id)
        } else {
          setCustomers((current) => [newCustomer, ...current])
          setSelectedCustomerId(newCustomer.id)
        }
        setDraft(emptyDraft)
        setDraftDocuments([])
        setExistingDocuments([])
        setDeletedDocumentIds([])
        setIsFormOpen(false)
        return
      }

      const now = new Date().toISOString()
      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        shopId: DEMO_SHOP_ID,
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
      setExistingDocuments([])
      setDeletedDocumentIds([])
      setIsFormOpen(false)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveStockItem() {
    setStockFormError('')

    if (!stockDraft.sku.trim()) {
      setStockFormError('กรุณากรอก SKU/รหัสสต๊อก')
      return
    }

    const setCount = Number(stockDraft.setCount)
    if (!Number.isInteger(setCount) || setCount < 1) {
      setStockFormError('จำนวนชุดต้องเป็นตัวเลขตั้งแต่ 1 ขึ้นไป')
      return
    }

    if (!stockDraft.productName.trim()) {
      setStockFormError('กรุณากรอกชื่อสินค้า')
      return
    }

    // Determine base SKU and serial number
    let baseSku = stockDraft.sku.trim()
    const suffixRegex = /-(\d{2,})$/
    if (!editingStockId && setCount > 1) {
      const match = baseSku.match(suffixRegex)
      if (match) {
        baseSku = baseSku.replace(suffixRegex, '')
      }
    }

    let baseSerial = stockDraft.serialNumber.trim()
    if (!editingStockId && setCount > 1 && baseSerial) {
      const match = baseSerial.match(suffixRegex)
      if (match) {
        baseSerial = baseSerial.replace(suffixRegex, '')
      }
    }

    const existingItem = editingStockId
      ? stockItems.find((item) => item.id === editingStockId)
      : undefined

    // Check for duplicate SKUs
    if (editingStockId) {
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

      if (existingItem && existingItem.sku !== stockDraft.sku.trim()) {
        let relatedRentalCount: number
        try {
          relatedRentalCount = supabase && isAuthenticated && shopId
            ? await countRemoteRentalsForStockSku(supabase, shopId, existingItem.sku)
            : rentals.filter(
                (rental) =>
                  rental.costume.id === existingItem.id ||
                  rental.costume.sku === existingItem.sku,
              ).length
        } catch (error) {
          setStockFormError(getErrorMessage(error))
          return
        }

        if (relatedRentalCount > 0) {
          setStockFormError(`แก้ไข SKU ของชุด ${existingItem.sku} ไม่ได้ เพราะมีใบเช่าที่อ้างอิงชุดนี้อยู่ ${relatedRentalCount} รายการ`)
          return
        }
      }
    } else {
      if (setCount > 1) {
        const duplicatedSkus: string[] = []
        for (let i = 1; i <= setCount; i++) {
          const suffix = String(i).padStart(2, '0')
          const itemSku = `${baseSku}-${suffix}`
          if (stockItems.some((item) => item.sku.toLowerCase() === itemSku.toLowerCase())) {
            duplicatedSkus.push(itemSku)
          }
        }
        if (duplicatedSkus.length > 0) {
          setStockFormError(`SKU ต่อไปนี้มีอยู่ในระบบแล้ว: ${duplicatedSkus.join(', ')}`)
          return
        }
      } else {
        if (
          stockItems.some(
            (item) =>
              item.sku.toLowerCase() === stockDraft.sku.trim().toLowerCase(),
          )
        ) {
          setStockFormError('SKU/รหัสสต๊อกนี้มีอยู่แล้ว')
          return
        }
      }
    }

    setIsSaving(true)
    try {
      if (supabase && isAuthenticated) {
        if (!shopId) {
          setStockFormError('ยังไม่พบร้านสำหรับบัญชีนี้')
          setIsSaving(false)
          return
        }

        if (editingStockId) {
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
            status: (stockDraft.status as StockItemStatus) || 'available',
          }
          const savedItem = await updateRemoteStockItem(
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
          if (setCount > 1) {
            const itemDrafts: Array<Omit<StockItem, 'id' | 'createdAt'>> = []
            for (let i = 1; i <= setCount; i++) {
              const suffix = String(i).padStart(2, '0')
              const itemSku = `${baseSku}-${suffix}`
              const itemSerial = baseSerial ? `${baseSerial}-${suffix}` : ''

              const itemDraft: Omit<StockItem, 'id' | 'createdAt'> = {
                sku: itemSku,
                serialNumber: itemSerial,
                productName: stockDraft.productName.trim(),
                brand: stockDraft.brand.trim(),
                category: stockDraft.category.trim(),
                size: stockDraft.size.trim(),
                primaryColor: stockDraft.primaryColor.trim(),
                publicDescription: stockDraft.publicDescription.trim(),
                setCount: 1,
                rentalPricePerDay: parseOptionalNumber(stockDraft.rentalPricePerDay) ?? 0,
                lateFeeRule: stockDraft.lateFeeRule.trim(),
                depositAmount: parseOptionalNumber(stockDraft.depositAmount) ?? 0,
                imageUrls: stockDraft.imageUrls,
                status: (stockDraft.status as StockItemStatus) || 'available',
              }
              itemDrafts.push(itemDraft)
            }
            await createRemoteStockItems(supabase, shopId, itemDrafts)
            const loadedStock = await loadStockItems(supabase, shopId)
            setStockItems(loadedStock)
          } else {
            const itemDraft: Omit<StockItem, 'id' | 'createdAt'> = {
              sku: stockDraft.sku.trim(),
              serialNumber: stockDraft.serialNumber.trim(),
              productName: stockDraft.productName.trim(),
              brand: stockDraft.brand.trim(),
              category: stockDraft.category.trim(),
              size: stockDraft.size.trim(),
              primaryColor: stockDraft.primaryColor.trim(),
              publicDescription: stockDraft.publicDescription.trim(),
              setCount: 1,
              rentalPricePerDay: parseOptionalNumber(stockDraft.rentalPricePerDay) ?? 0,
              lateFeeRule: stockDraft.lateFeeRule.trim(),
              depositAmount: parseOptionalNumber(stockDraft.depositAmount) ?? 0,
              imageUrls: stockDraft.imageUrls,
              status: (stockDraft.status as StockItemStatus) || 'available',
            }
            const savedItem = await createRemoteStockItem(supabase, shopId, itemDraft)
            setStockItems((current) => [savedItem, ...current])
          }
        }

        handleLoadAuditLogs()
        closeStockForm()
      } else {
        // Local Storage Fallback
        if (editingStockId) {
          const draftItem: StockItem = {
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
            id: editingStockId,
            createdAt: existingItem?.createdAt ?? new Date().toISOString(),
            status: (stockDraft.status as StockItemStatus) || 'available',
          }
          setStockItems((current) =>
            current.map((item) => (item.id === editingStockId ? draftItem : item))
          )
        } else {
          const savedItemsList: StockItem[] = []
          if (setCount > 1) {
            for (let i = 1; i <= setCount; i++) {
              const suffix = String(i).padStart(2, '0')
              const itemSku = `${baseSku}-${suffix}`
              const itemSerial = baseSerial ? `${baseSerial}-${suffix}` : ''

              const savedItem: StockItem = {
                sku: itemSku,
                serialNumber: itemSerial,
                productName: stockDraft.productName.trim(),
                brand: stockDraft.brand.trim(),
                category: stockDraft.category.trim(),
                size: stockDraft.size.trim(),
                primaryColor: stockDraft.primaryColor.trim(),
                publicDescription: stockDraft.publicDescription.trim(),
                setCount: 1,
                rentalPricePerDay: parseOptionalNumber(stockDraft.rentalPricePerDay) ?? 0,
                lateFeeRule: stockDraft.lateFeeRule.trim(),
                depositAmount: parseOptionalNumber(stockDraft.depositAmount) ?? 0,
                imageUrls: stockDraft.imageUrls,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                status: (stockDraft.status as StockItemStatus) || 'available',
              }
              savedItemsList.push(savedItem)
            }
            setStockItems((current) => [...savedItemsList, ...current])
          } else {
            const savedItem: StockItem = {
              sku: stockDraft.sku.trim(),
              serialNumber: stockDraft.serialNumber.trim(),
              productName: stockDraft.productName.trim(),
              brand: stockDraft.brand.trim(),
              category: stockDraft.category.trim(),
              size: stockDraft.size.trim(),
              primaryColor: stockDraft.primaryColor.trim(),
              publicDescription: stockDraft.publicDescription.trim(),
              setCount: 1,
              rentalPricePerDay: parseOptionalNumber(stockDraft.rentalPricePerDay) ?? 0,
              lateFeeRule: stockDraft.lateFeeRule.trim(),
              depositAmount: parseOptionalNumber(stockDraft.depositAmount) ?? 0,
              imageUrls: stockDraft.imageUrls,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              status: (stockDraft.status as StockItemStatus) || 'available',
            }
            setStockItems((current) => [savedItem, ...current])
          }
        }
        closeStockForm()
      }
    } catch (err) {
      if (supabase && isAuthenticated && shopId) {
        try {
          const loadedStock = await loadStockItems(supabase, shopId)
          setStockItems(loadedStock)
        } catch (reloadError) {
          console.warn('Failed to reload stock after save error:', reloadError)
        }
      }
      setStockFormError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
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

    const relatedRentalCount = rentals.filter((rental) => rental.customer.id === selectedCustomer.id).length
    if (relatedRentalCount > 0) {
      window.alert(`ยังลบลูกค้า ${selectedCustomer.customerCode} ไม่ได้ เพราะมีใบเช่าที่อ้างอิงลูกค้ารายนี้อยู่ ${relatedRentalCount} รายการ`)
      return
    }

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
    setIsMobileDetailOpen(false)
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
        const loadedCustomers = await loadCustomers(supabase, selectedCustomer.shopId)
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

  async function refreshCustomerDocumentUrls(customerId: string) {
    if (!supabase || !shopId) return

    try {
      const loadedCustomers = await loadCustomers(supabase, shopId)
      setCustomers(loadedCustomers)
      setSelectedCustomerId(customerId)
    } catch (error) {
      console.warn('Failed to refresh customer document URLs:', error)
    }
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

  if (hasSupabaseConfig && !shopsReady) {
    return <LoadingScreen title="กำลังตรวจสอบร้านค้า" subtitle="กำลังโหลดรายการร้านที่บัญชีนี้เข้าใช้งานได้" />
  }

  if (hasSupabaseConfig && availableShops.length === 0) {
    return <EmptyShopAccessScreen message={remoteError || 'ยังไม่พบร้านสำหรับบัญชีนี้'} />
  }

  if (hasSupabaseConfig && availableShops.length > 1 && !shopId) {
    return <ShopSelectScreen shops={availableShops} onSelectShop={setShopId} />
  }

  if (hasSupabaseConfig && isShopDataLoading) {
    return <LoadingScreen title="กำลังสลับร้าน" subtitle="กำลังโหลดข้อมูลของร้านที่เลือก" />
  }

  return (
    <div className="app-layout">
      <div className="mobile-top-bar">
        <div className="mobile-brand-logo">
          <img src="/web-logo.png" alt="Precious Rental" />
        </div>
        {availableShops.length > 1 && (
          <div className="mobile-shop-switcher">
            <label className="shop-switcher-field">
              <span>ร้านที่ใช้งาน</span>
              <select value={shopId ?? ''} onChange={(event) => setShopId(event.target.value)}>
                {availableShops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="mobile-top-actions">
          <button
            className={`mobile-action-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleTabChange('reports')}
            title="รายงาน"
            type="button"
          >
            <BarChart3 size={20} />
          </button>
          <button
            className={`mobile-action-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
            title="ตั้งค่า"
            type="button"
          >
            <Settings size={20} />
          </button>
          <button
            className={`mobile-action-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => handleTabChange('audit')}
            title="ประวัติระบบ"
            type="button"
          >
            <History size={20} />
          </button>
        </div>
      </div>

      <SideNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        availableShops={availableShops}
        selectedShopId={shopId}
        onShopChange={setShopId}
      />
      <main className="app-shell">
        {currentShop && (
          <section className="active-shop-banner" aria-label="ร้านที่กำลังใช้งาน">
            <p className="eyebrow">ร้านที่กำลังใช้งาน</p>
            <strong>{currentShop.name}</strong>
          </section>
        )}
        {remoteError && <section className="remote-error">{remoteError}</section>}

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
            onCreateRentals={handleCreateRentals}
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
            onNavigateToTab={setActiveTab}
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
            isSaving={isSaving}
            onOpenForm={openCreateStockForm}
            onCloseForm={closeStockForm}
            onEdit={openEditStockForm}
            onDelete={handleDeleteStockItem}
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
            rentals={rentals}
            onUpdateStatus={handleUpdateStockStatus}
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
              <MetricCard
                label="ลูกค้าทั้งหมด"
                value={`${summary.total}`}
                icon={<UserRound />}
                type="total"
                unit="ราย"
                onClick={() => {
                  setStatusFilter('all')
                  setCurrentPage(1)
                }}
                isActive={statusFilter === 'all'}
              />
              <MetricCard
                label="ตรวจแล้ว"
                value={`${summary.verified}`}
                icon={<ShieldCheck />}
                type="verified"
                unit="ราย"
                onClick={() => {
                  setStatusFilter('verified')
                  setCurrentPage(1)
                }}
                isActive={statusFilter === 'verified'}
              />
              <MetricCard
                label="มีสัญญาณความเสี่ยง"
                value={`${summary.risk}`}
                icon={<ShieldAlert />}
                type="risk"
                unit="ราย"
                onClick={() => {
                  setStatusFilter('has_risk')
                  setCurrentPage(1)
                }}
                isActive={statusFilter === 'has_risk'}
              />
              <MetricCard
                label="ข้อมูลไม่ครบ"
                value={`${summary.incomplete}`}
                icon={<AlertTriangle />}
                type="incomplete"
                unit="ราย"
                onClick={() => {
                  setStatusFilter('incomplete')
                  setCurrentPage(1)
                }}
                isActive={statusFilter === 'incomplete'}
              />
            </section>

            <section className="customer-grid">
              <div className="panel customer-list-panel">
                <div className="toolbar">
                  <label className="search-box">
                    <Search size={22} />
                    <input
                      value={query}
                      onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }}
                      placeholder="ค้นหาด้วยชื่อ เบอร์โทร รหัสลูกค้า หรือ LINE"
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
                      onClick={() => {
                        setSelectedCustomerId(customer.id)
                        setIsMobileDetailOpen(true)
                      }}
                    >
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
                <div className={`customer-detail-wrapper ${isMobileDetailOpen ? 'mobile-open' : ''}`} onClick={() => setIsMobileDetailOpen(false)}>
                  <div className="customer-detail-content" onClick={(e) => e.stopPropagation()}>
                    <CustomerDetail
                      customer={selectedCustomer}
                      onStatusChange={updateSelectedStatus}
                      onRiskChange={updateSelectedRisk}
                      onArchive={archiveSelectedCustomer}
                      onDocumentUpload={addDocuments}
                      onDocumentPreviewError={refreshCustomerDocumentUrls}
                      onEdit={() => openEditCustomerForm(selectedCustomer)}
                      onClose={() => setIsMobileDetailOpen(false)}
                      onPreviewDocument={(index) => {
                        setPreviewCustomerDocOwnerId(selectedCustomer.id)
                        setPreviewCustomerDocIndex(index)
                      }}
                    />
                  </div>
                </div>
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
                    <button className="ghost-button" type="button" onClick={() => { setIsFormOpen(false); setDraft(emptyDraft); setDraftDocuments([]); setExistingDocuments([]); setDeletedDocumentIds([]); setFormError(''); setEditingCustomerId(null); setIsSaving(false); }} disabled={isSaving}>
                      ปิด
                    </button>
                  </div>

                  <div className="form-grid">
                    <TextField label="ชื่อ-นามสกุล" value={draft.fullName} onChange={(value) => updateDraft('fullName', value)} required disabled={isSaving} />
                    <TextField
                      label="เบอร์โทรศัพท์"
                      value={draft.phone}
                      onChange={(value) => {
                        updateDraft('phone', sanitizeThaiPhoneInput(value))
                      }}
                      inputMode="numeric"
                      required
                      disabled={isSaving}
                    />
                    <TextField label="ชื่อแอคเคา/LINE" value={draft.lineAccount} onChange={(value) => updateDraft('lineAccount', value)} disabled={isSaving} />
                    <label className="field">
                      <span>สถานะโปรไฟล์</span>
                      <select value={draft.profileStatus} onChange={(event) => updateDraft('profileStatus', event.target.value)} disabled={isSaving}>
                        <option value="incomplete">ข้อมูลไม่ครบ</option>
                        <option value="pending_review">รอตรวจ</option>
                        <option value="verified">ตรวจแล้ว</option>
                        <option value="suspended">ระงับ</option>
                      </select>
                    </label>
                    <label className="field wide">
                      <span>ที่อยู่ปัจจุบัน</span>
                      <textarea
                        value={draft.currentAddress}
                        onChange={(event) => updateDraft('currentAddress', event.target.value)}
                        rows={3}
                        disabled={isSaving}
                        spellCheck={false}
                        autoCapitalize="off"
                        translate="no"
                      />
                    </label>
                    <label className="field wide">
                      <span>หมายเหตุ</span>
                      <textarea
                        value={draft.notes}
                        onChange={(event) => updateDraft('notes', event.target.value)}
                        rows={3}
                        disabled={isSaving}
                        spellCheck={false}
                        autoCapitalize="off"
                        translate="no"
                      />
                    </label>
                    <TextField label='รอบอก (นิ้ว)' value={draft.bustIn} onChange={(value) => updateDraft('bustIn', value)} inputMode="decimal" disabled={isSaving} />
                    <TextField label='รอบเอว (นิ้ว)' value={draft.waistIn} onChange={(value) => updateDraft('waistIn', value)} inputMode="decimal" disabled={isSaving} />
                    <TextField label='สะโพก (นิ้ว)' value={draft.hipIn} onChange={(value) => updateDraft('hipIn', value)} inputMode="decimal" disabled={isSaving} />
                    <TextField label="ส่วนสูง (ซม.)" value={draft.heightCm} onChange={(value) => updateDraft('heightCm', value)} inputMode="decimal" disabled={isSaving} />
                    <label className="field">
                      <span>สัญญาณความเสี่ยง</span>
                      <select value={draft.riskFlag} onChange={(event) => updateDraft('riskFlag', event.target.value)} disabled={isSaving}>
                        <option value="none">ไม่มี</option>
                        <option value="has_risk">มี</option>
                      </select>
                    </label>
                  </div>

                  <div className="customer-document-section" style={{ marginTop: '20px' }}>
                    <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>เอกสารยืนยันตัวตน (สูงสุด 5 รูป)</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {existingDocuments.length + draftDocuments.length}/5 รูป
                      </span>
                    </div>

                    {(existingDocuments.length + draftDocuments.length) < 5 ? (
                      <label
                        className="upload-box"
                        style={{ opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                      >
                        <Camera size={20} />
                        เพิ่มรูปเอกสาร/บัตรประชาชน (เลือกพร้อมกันได้หลายรูป)
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={isSaving}
                          onChange={(event) => addDraftDocuments(event.target.files)}
                        />
                      </label>
                    ) : (
                      <div
                        className="upload-box"
                        style={{ opacity: 0.5, cursor: 'not-allowed', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        <Camera size={20} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-muted)' }}>รูปเอกสารเต็มขีดจำกัด (5 รูป) แล้ว</span>
                      </div>
                    )}

                    {(existingDocuments.length > 0 || draftDocuments.length > 0) && (
                       <div className="document-grid" style={{ marginTop: '12px' }}>
                         {existingDocuments.map((doc, index) => (
                           <figure key={doc.id} style={{ position: 'relative', margin: 0 }}>
                             <img src={doc.previewUrl} alt={`เอกสารเดิมที่ ${index + 1}`} />
                             <button
                               type="button"
                               disabled={isSaving}
                               onClick={() => {
                                 setExistingDocuments((current) => current.filter((d) => d.id !== doc.id))
                                 setDeletedDocumentIds((current) => [...current, doc.id])
                               }}
                               aria-label={`ลบรูปเอกสารเดิมที่ ${index + 1}`}
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
                                 cursor: isSaving ? 'not-allowed' : 'pointer',
                                 opacity: isSaving ? 0.5 : 1,
                               }}
                             >
                               <X size={16} />
                             </button>
                             <figcaption>รูปเดิมที่ {index + 1}</figcaption>
                           </figure>
                         ))}

                         {draftDocuments.map((doc, index) => (
                           <figure key={doc.id} style={{ position: 'relative', margin: 0 }}>
                             <img src={doc.previewUrl} alt={`เอกสารร่างที่ ${index + 1}`} />
                             <button
                               type="button"
                               disabled={isSaving}
                               onClick={() => removeDraftDocument(doc.id)}
                               aria-label={`ลบรูปเอกสารร่างที่ ${index + 1}`}
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
                                 cursor: isSaving ? 'not-allowed' : 'pointer',
                                 opacity: isSaving ? 0.5 : 1,
                               }}
                             >
                               <X size={16} />
                             </button>
                             <figcaption>รูปใหม่ที่ {index + 1}</figcaption>
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
                        disabled={isSaving}
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
                            setExistingDocuments(customer.documents || [])
                            setDeletedDocumentIds([])
                          }
                        }}
                      >
                        รีเซ็ตค่าเดิม
                      </button>
                    ) : (
                      <button className="secondary-button" type="button" disabled={isSaving} onClick={() => { setDraft(emptyDraft); setDraftDocuments([]); setExistingDocuments([]); setDeletedDocumentIds([]); }}>
                        ล้างฟอร์ม
                      </button>
                    )}
                    <button className="primary-button" type="button" onClick={handleSaveCustomer} disabled={isSaving}>
                      {isSaving ? 'กำลังบันทึก...' : (editingCustomerId ? 'บันทึกการแก้ไข' : 'บันทึกลูกค้า')}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {previewCustomer && (
              <div
                className="modal-backdrop document-preview-backdrop"
                role="presentation"
                onClick={() => setPreviewCustomerDocOwnerId(null)}
              >
                <section
                  className="modal-panel document-preview-panel"
                  aria-label="ดูรูปเอกสารลูกค้า"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="modal-header">
                    <div>
                      <p className="eyebrow">เอกสารยืนยันตัวตน</p>
                      <h2>{previewCustomer.fullName}</h2>
                    </div>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => setPreviewCustomerDocOwnerId(null)}
                    >
                      ปิด
                    </button>
                  </div>

                  <div className="document-preview-stage">
                    {previewCustomer.documents[previewCustomerDocIndex]?.previewUrl ? (
                      <img
                        src={previewCustomer.documents[previewCustomerDocIndex].previewUrl}
                        alt={`เอกสารลูกค้า รูปที่ ${previewCustomerDocIndex + 1} ของ ${previewCustomer.fullName}`}
                      />
                    ) : (
                      <div className="file-placeholder" style={{ height: '100%' }}>
                        <FileImage size={48} />
                        <span>ไม่มีรูปตัวอย่าง</span>
                      </div>
                    )}
                  </div>

                  <div className="document-preview-meta">
                    <span>รหัสลูกค้า: {previewCustomer.customerCode}</span>
                    <span>
                      รูปที่ {previewCustomerDocIndex + 1}/{previewCustomer.documents.length}
                    </span>
                  </div>

                  {previewCustomer.documents.length > 1 && (
                    <div className="document-preview-thumbs">
                      {previewCustomer.documents.map((doc, index) => (
                        <button
                          key={`${previewCustomer.id}-doc-thumb-${index}`}
                          className={`document-preview-thumb ${index === previewCustomerDocIndex ? 'active' : ''}`}
                          type="button"
                          onClick={() => setPreviewCustomerDocIndex(index)}
                        >
                          {doc.previewUrl ? (
                            <img src={doc.previewUrl} alt={`ภาพย่อเอกสารรูปที่ ${index + 1}`} />
                          ) : (
                            <div className="file-placeholder" style={{ height: '100%' }}>
                              <FileImage size={20} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
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

        {activeTab === 'reports' && (
          <ReportsPage
            rentals={rentals}
            stockItems={stockItems}
          />
        )}

        {activeTab !== 'dashboard' && activeTab !== 'inventory' && activeTab !== 'customers' && activeTab !== 'rentals' && activeTab !== 'calendar' && activeTab !== 'settings' && activeTab !== 'audit' && activeTab !== 'reports' && (
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
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
          type="button"
        >
          <LayoutGrid size={20} />
          <span>แดชบอร์ด</span>
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => handleTabChange('inventory')}
          type="button"
        >
          <Shirt size={20} />
          <span>คลังชุด</span>
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'rentals' ? 'active' : ''}`}
          onClick={() => handleTabChange('rentals')}
          type="button"
        >
          <FileText size={20} />
          <span>การเช่า</span>
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => handleTabChange('customers')}
          type="button"
        >
          <UserRound size={20} />
          <span>ลูกค้า</span>
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => handleTabChange('calendar')}
          type="button"
        >
          <CalendarDays size={20} />
          <span>ปฏิทิน</span>
        </button>
      </nav>
    </div>
  )
}

function SideNav({
  activeTab,
  onTabChange,
  availableShops,
  selectedShopId,
  onShopChange,
}: {
  activeTab: ViewKey
  onTabChange: (tab: ViewKey) => void
  availableShops: ShopSummary[]
  selectedShopId: string | null
  onShopChange: (shopId: string) => void
}) {
  const items: Array<{ id: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'inventory', label: 'คลังชุด', icon: Menu },
    { id: 'customers', label: 'ลูกค้า', icon: UserRound },
    { id: 'rentals', label: 'เช่า/คืน', icon: CalendarCheck },
    { id: 'calendar', label: 'ปฏิทิน', icon: CalendarDays },
    { id: 'reports', label: 'รายงาน', icon: BarChart3 },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings },
    { id: 'audit', label: 'ประวัติระบบ', icon: History },
  ]

  return (
    <aside className="side-nav" aria-label="เมนูหลัก">
      <div className="brand-logo" aria-label="Precious Rental">
        <img src="/web-logo.png" alt="Precious Rental" style={{ width: '100%', maxWidth: '160px', height: 'auto', display: 'block', margin: '0 auto' }} />
      </div>
      {availableShops.length > 1 && (
        <div className="side-nav-shop-switcher">
          <label className="shop-switcher-field">
            <span>สลับร้าน</span>
            <select value={selectedShopId ?? ''} onChange={(event) => onShopChange(event.target.value)}>
              {availableShops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
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
}: {
  items: StockItem[]
  query: string
  setQuery: (value: string) => void
  summary: { total: number; sets: number; deposits: number; priced: number }
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
}) {
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

  function getStockStatusPill(status: string) {
    switch (status) {
      case 'rented':
        return (
          <span
            className="status-pill"
            style={{
              background: 'rgba(218, 165, 32, 0.15)',
              color: '#ead483',
              border: '1px solid rgba(218, 165, 32, 0.3)'
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
              border: '1px solid rgba(99, 102, 241, 0.3)'
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

        <div className="status-filter-container">
          <button
            type="button"
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            ทั้งหมด ({statusCounts.all})
          </button>
          <button
            type="button"
            className={`filter-chip available ${statusFilter === 'available' ? 'active' : ''}`}
            onClick={() => setStatusFilter('available')}
          >
            <span className="dot success" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#4ade80', marginRight: 4 }}></span>
            ว่าง ({statusCounts.available})
          </button>
          <button
            type="button"
            className={`filter-chip rented ${statusFilter === 'rented' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rented')}
          >
            <span className="dot rented" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#ead483', marginRight: 4 }}></span>
            ถูกเช่า ({statusCounts.rented})
          </button>
          <button
            type="button"
            className={`filter-chip booked ${statusFilter === 'booked' ? 'active' : ''}`}
            onClick={() => setStatusFilter('booked')}
          >
            <span className="dot booked" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#a5b4fc', marginRight: 4 }}></span>
            มีคิวจอง ({statusCounts.booked})
          </button>
          <button
            type="button"
            className={`filter-chip repair ${statusFilter === 'repair' ? 'active' : ''}`}
            onClick={() => setStatusFilter('repair')}
          >
            <span className="dot danger" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f87171', marginRight: 4 }}></span>
            ซ่อม ({statusCounts.repair})
          </button>
          <button
            type="button"
            className={`filter-chip wash ${statusFilter === 'wash' ? 'active' : ''}`}
            onClick={() => setStatusFilter('wash')}
          >
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
                  <span style={{ position: 'relative' }}>
                    <div 
                      className="stock-card-status-badge-wrapper"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveStatusDropdownId(activeStatusDropdownId === item.id ? null : item.id)
                      }}
                    >
                      {getStockStatusPill(primaryStatus)}
                    </div>
                    {activeStatusDropdownId === item.id && (
                      <>
                        <div 
                          className="dropdown-overlay-fixed" 
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveStatusDropdownId(null)
                          }} 
                        />
                        <div className="status-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          <button 
                            type="button" 
                            onClick={() => { 
                              onUpdateStatus(item.id, 'available') 
                              setActiveStatusDropdownId(null) 
                            }}
                          >
                            <span className="dot success"></span> ว่าง
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { 
                              onUpdateStatus(item.id, 'repair') 
                              setActiveStatusDropdownId(null) 
                            }}
                          >
                            <span className="dot danger"></span> ซ่อม
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { 
                              onUpdateStatus(item.id, 'wash') 
                              setActiveStatusDropdownId(null) 
                            }}
                          >
                            <span className="dot warning"></span> ซัก
                          </button>
                        </div>
                      </>
                    )}
                    {nextBookedRental && (primaryStatus === 'booked' || primaryStatus === 'repair' || primaryStatus === 'wash') && (
                      <small style={{ display: 'block', marginTop: '4px', color: '#a5b4fc', fontSize: '0.75rem' }}>
                        คิว: {nextBookedRental.pickupDate} ถึง {nextBookedRental.returnDate}
                      </small>
                    )}
                  </span>
                  <span>{formatBaht(item.rentalPricePerDay)}</span>
                  <span>{item.lateFeeRule || '-'}</span>
                  <span>{formatBaht(item.depositAmount)}</span>
                  <div className="stock-action-group">
                    <button
                      className="icon-action-button compact"
                      type="button"
                      onClick={() => onEdit(item)}
                      aria-label={`แก้ไข ${item.sku}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-action-button compact danger"
                      type="button"
                      onClick={() => onDelete(item)}
                      aria-label={`ลบ ${item.sku}`}
                    >
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
                    <div 
                      className="stock-card-status-badge-wrapper"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveStatusDropdownId(activeStatusDropdownId === item.id ? null : item.id)
                      }}
                    >
                      {getStockStatusPill(primaryStatus)}
                      {activeStatusDropdownId === item.id && (
                        <>
                          <div 
                            className="dropdown-overlay-fixed" 
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveStatusDropdownId(null)
                            }} 
                          />
                          <div className="status-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <button 
                              type="button" 
                              onClick={() => { 
                                onUpdateStatus(item.id, 'available') 
                                setActiveStatusDropdownId(null) 
                              }}
                            >
                              <span className="dot success"></span> ว่าง
                            </button>
                            <button 
                              type="button" 
                              onClick={() => { 
                                onUpdateStatus(item.id, 'repair') 
                                setActiveStatusDropdownId(null) 
                              }}
                            >
                              <span className="dot danger"></span> ซ่อม
                            </button>
                            <button 
                              type="button" 
                              onClick={() => { 
                                onUpdateStatus(item.id, 'wash') 
                                setActiveStatusDropdownId(null) 
                              }}
                            >
                              <span className="dot warning"></span> ซัก
                            </button>
                          </div>
                        </>
                      )}
                    </div>
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
                      <button
                        className="icon-action-button compact"
                        type="button"
                        onClick={() => onEdit(item)}
                        aria-label={`แก้ไข ${item.sku}`}
                        title="แก้ไข"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-action-button compact danger"
                        type="button"
                        onClick={() => onDelete(item)}
                        aria-label={`ลบ ${item.sku}`}
                        title="ลบชุด"
                      >
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
              <button className="ghost-button" type="button" onClick={onCloseForm} disabled={isSaving}>
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
                <label className="field">
                  <span>ไซซ์ / ขนาด</span>
                  <select
                    value={draft.size}
                    onChange={(event) => onDraftChange('size', event.target.value)}
                  >
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
                <label className="field">
                  <span>สถานะคลังสินค้า</span>
                  <select
                    value={draft.status}
                    onChange={(event) => onDraftChange('status', event.target.value)}
                  >
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
                  disabled={isSaving}
                />
                <TextField
                  label="จำนวนชุด"
                  value={draft.setCount}
                  onChange={(value) => onDraftChange('setCount', value)}
                  inputMode="numeric"
                  type="number"
                  disabled={isSaving}
                />
                <TextField
                  label="หมายเลขซีเรียล"
                  value={draft.serialNumber}
                  onChange={(value) => onDraftChange('serialNumber', value)}
                  placeholder="หมายเลขซีเรียลจากผู้ผลิต"
                  disabled={isSaving}
                />
              </div>
              {!isEditing && Number(draft.setCount) > 1 && draft.sku.trim() && (() => {
                const count = Number(draft.setCount)
                let baseSku = draft.sku.trim()
                const suffixRegex = /-(\d{2,})$/
                const match = baseSku.match(suffixRegex)
                if (match) baseSku = baseSku.replace(suffixRegex, '')
                const skus = Array.from({ length: Math.min(count, 20) }, (_, i) => `${baseSku}-${String(i + 1).padStart(2, '0')}`)
                return (
                  <div className="sub-sku-preview" style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: 'rgba(223, 183, 80, 0.06)',
                    border: '1px solid rgba(223, 183, 80, 0.2)',
                    borderRadius: '10px',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚡</span> ระบบจะสร้าง {count} รายการแยก Sub-SKU อัตโนมัติ
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {skus.map((sku) => (
                        <span key={sku} style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: 'rgba(223, 183, 80, 0.12)',
                          border: '1px solid rgba(223, 183, 80, 0.25)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--text-gold)',
                          fontFamily: 'monospace',
                        }}>{sku}</span>
                      ))}
                      {count > 20 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 6px' }}>...และอีก {count - 20} รายการ</span>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                      แต่ละชุดจะมีสถานะเช่าแยกกัน สามารถติดตามได้ว่าชุดไหนว่าง ชุดไหนมีคนเช่าอยู่
                    </p>
                  </div>
                )
              })()}
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
              <button className="secondary-button" type="button" onClick={onResetDraft} disabled={isSaving}>
                ล้างฟอร์ม
              </button>
              <button className="primary-button" type="button" onClick={onSave} disabled={isSaving}>
                {isSaving
                  ? 'กำลังบันทึก...'
                  : !isEditing && Number(draft.setCount) > 1
                    ? `บันทึก ${draft.setCount} ชุด`
                    : isEditing ? 'บันทึกการแก้ไข' : 'บันทึกสต๊อก'
                }
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
  onDocumentPreviewError,
  onEdit,
  onClose,
  onPreviewDocument,
}: {
  customer: Customer
  onStatusChange: (status: CustomerProfileStatus) => void
  onRiskChange: (riskFlag: RiskFlag) => void
  onArchive: () => void
  onDocumentUpload: (files: FileList | null) => void
  onDocumentPreviewError: (customerId: string) => void
  onEdit: () => void
  onClose?: () => void
  onPreviewDocument?: (index: number) => void
}) {
  const rentalGuard = canCreateRentalForCustomer(customer)

  const initials = customer.fullName ? customer.fullName.slice(0, 2).toLowerCase() : ''

  return (
    <aside className="panel detail-panel">
      {onClose && (
        <button className="close-detail-btn" type="button" onClick={onClose} aria-label="ปิด">
          <X size={20} />
        </button>
      )}
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
          {customer.documents.map((document, index) => (
            <figure
              key={document.id}
              onClick={() => document.previewUrl && onPreviewDocument?.(index)}
              style={document.previewUrl ? { cursor: 'pointer' } : undefined}
            >
              {document.previewUrl ? (
                <img
                  src={document.previewUrl}
                  alt={`เอกสารลูกค้า ${document.sortOrder}`}
                  onError={() => onDocumentPreviewError(customer.id)}
                />
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

function ShopSelectScreen({
  shops,
  onSelectShop,
}: {
  shops: ShopSummary[]
  onSelectShop: (shopId: string) => void
}) {
  return (
    <main className="auth-shell">
      <section className="modal-panel auth-panel">
        <p className="eyebrow">Precious Shop</p>
        <h1>เลือกร้านที่ต้องการเข้าใช้งาน</h1>
        <p className="subtitle">บัญชีนี้มีสิทธิ์เข้าหลายร้าน เลือกร้านที่จะเปิดก่อนเริ่มงาน</p>
        <div className="shop-selection-grid">
          {shops.map((shop) => (
            <button
              key={shop.id}
              className="shop-selection-card"
              type="button"
              onClick={() => onSelectShop(shop.id)}
            >
              <strong>{shop.name}</strong>
              <span>เข้าสู่ร้านนี้</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

function EmptyShopAccessScreen({ message }: { message: string }) {
  return (
    <main className="auth-shell">
      <section className="modal-panel auth-panel">
        <p className="eyebrow">Precious Shop</p>
        <h1>ยังไม่พบบัญชีร้านค้า</h1>
        <p className="subtitle">{message}</p>
      </section>
    </main>
  )
}

function LoadingScreen({
  title = 'กำลังเตรียมระบบ',
  subtitle,
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <main className="auth-shell">
      <section className="modal-panel auth-panel">
        <p className="eyebrow">Precious Shop</p>
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
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
  onClick,
  isActive,
}: {
  label: string
  value: string
  icon: ReactNode
  type?: 'total' | 'verified' | 'incomplete' | 'risk'
  unit?: string
  onClick?: () => void
  isActive?: boolean
}) {
  const Component = onClick ? 'button' : 'div'
  return (
    <Component
      className={`metric-card ${type || ''} ${isActive ? 'active' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <div className="metric-icon-wrapper">{icon}</div>
      <div className="card-content">
        <span>{label}</span>
        <strong>
          {value} {unit && <span className="unit">{unit}</span>}
        </strong>
      </div>
      {onClick && <ChevronRight size={18} className="metric-chevron" />}
    </Component>
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
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  type?: InputHTMLAttributes<HTMLInputElement>['type']
  placeholder?: string
  maxLength?: number
  disabled?: boolean
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
        disabled={disabled}
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
  if (error && typeof error === 'object') {
    const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown }
    const parts = [maybeError.message, maybeError.details, maybeError.hint]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    if (parts.length > 0) return parts.join('\n')
  }
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}

export default App
