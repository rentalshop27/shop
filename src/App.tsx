import { Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react'
import {
  CalendarCheck,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  Menu,
  Settings,
  UserRound,
  History,
  Shirt,
  BarChart3,
  CircleUserRound,
  Store,
} from 'lucide-react'
import './index.css'
import { MultiShopDashboardPage, type OverviewShopData } from './features/dashboard/MultiShopDashboardPage'
import { UpdatePrompt } from './features/settings/UpdatePrompt'
import { useInventoryController } from './features/inventory/useInventoryController'
import { demoRentals } from './features/rentals/rentalSeed'
import type { RentalOrder, RentalStatus } from './features/rentals/rentalTypes'
import { findOpenRentalConflict } from './features/rentals/rentalRules'
import {
  createRemoteRentals,
  loadRentals,
  updateRemoteRentalStatus,
  deleteRemoteRental,
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
  loadCustomerDocumentPreview,
  loadCustomers,
  type ShopSummary,
  updateRemoteCustomer,
  updateRemoteCustomerRisk,
  updateRemoteCustomerStatus,
  uploadRemoteCustomerDocuments,
} from './features/customers/customerRemote'
import {
  deleteShopHeroImage,
  loadProductsWithStock,
  type ShopSettings,
  updateShopSettings,
  loadShopSettings,
  uploadShopHeroImage,
  updateRemoteProductFeatured,
  bulkUpdateRemoteDisplayOrder,
} from './features/inventory/stockRemote'
import type {
  ProductWithStockSummary,
  FlatStockItem
} from './features/inventory/inventoryTypes'
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
  normalizeThaiPhone,
  profileStatusLabel,
  validateThaiPhone,
} from './features/customers/customerRules'
import { TextField } from './components/TextField'

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

type ViewKey = 'dashboard' | 'inventory' | 'catalog' | 'customers' | 'rentals' | 'calendar' | 'settings' | 'audit' | 'reports' | 'profile'

const demoProducts: ProductWithStockSummary[] = [] // Or load from seed if needed
const DEMO_SHOP_ID = 'shop_demo'
const DEFAULT_BRANDS = ['Precious', 'Chanel', 'Dior', 'Gucci']
const DEFAULT_CATEGORIES = ['ชุดราตรี', 'ชุดไทย', 'ชุดสูท', 'ชุดแต่งงาน']
const DEFAULT_COLORS = ['น้ำเงินมิดไนต์', 'แดงไวน์', 'ชมพูโรส', 'ทองแชมเปญ', 'ขาวมุก', 'ดำคลาสสิก']
const DEFAULT_PUBLIC_CATALOG_ENABLED = false
const LAST_SELECTED_SHOP_KEY_PREFIX = 'precious_last_shop:'
const LOCAL_CATALOG_HERO_IMAGE_KEY = 'precious_catalog_hero_image_url'
const LOCAL_CATALOG_MOBILE_HERO_IMAGE_KEY = 'precious_catalog_mobile_hero_image_url'

const statusOptions: Array<{ value: 'all' | CustomerProfileStatus | 'has_risk'; label: string }> = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'incomplete', label: profileStatusLabel.incomplete },
  { value: 'pending_review', label: profileStatusLabel.pending_review },
  { value: 'verified', label: profileStatusLabel.verified },
  { value: 'suspended', label: profileStatusLabel.suspended },
  { value: 'has_risk', label: 'มีสัญญาณความเสี่ยง' },
]

const LazyDashboardPage = lazy(async () => {
  const module = await import('./features/dashboard/DashboardPage')
  return { default: module.DashboardPage }
})

const LazyRentalsPage = lazy(async () => {
  const module = await import('./features/rentals/RentalsPage')
  return { default: module.RentalsPage }
})

const LazyCalendarPage = lazy(async () => {
  const module = await import('./features/calendar/CalendarPage')
  return { default: module.CalendarPage }
})

const LazyInventoryPage = lazy(async () => {
  const module = await import('./features/inventory/InventoryPage')
  return { default: module.InventoryPage }
})

const LazyCustomerCatalogPage = lazy(async () => {
  const module = await import('./features/catalog/CustomerCatalogPage')
  return { default: module.CustomerCatalogPage }
})

const LazyPublicCatalogRoute = lazy(async () => {
  const module = await import('./features/catalog/PublicCatalogRoute')
  return { default: module.PublicCatalogRoute }
})

const LazyCustomersPage = lazy(async () => {
  const module = await import('./features/customers/CustomersPage')
  return { default: module.CustomersPage }
})

const LazySettingsPage = lazy(async () => {
  const module = await import('./features/settings/SettingsPage')
  return { default: module.SettingsPage }
})

const LazyAuditLogPage = lazy(async () => {
  const module = await import('./features/audit/AuditLogPage')
  return { default: module.AuditLogPage }
})

const LazyReportsPage = lazy(async () => {
  const module = await import('./features/reports/ReportsPage')
  return { default: module.ReportsPage }
})

const LazyProfilePage = lazy(async () => {
  const module = await import('./features/profile/ProfilePage')
  return { default: module.ProfilePage }
})

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

function getLocalString(key: string): string | null {
  if (hasSupabaseConfig) return null
  return localStorage.getItem(key)
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('อ่านไฟล์รูปไม่สำเร็จ'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('อ่านไฟล์รูปไม่สำเร็จ'))
    reader.readAsDataURL(file)
  })
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

function getPublicCatalogKey() {
  const match = window.location.pathname.match(/^\/catalog\/([^/]+)\/?$/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

function getPublicCatalogUrl(origin: string, shop: ShopSummary | null) {
  const catalogKey = shop?.publicCatalogSlug || shop?.id
  return catalogKey ? `${origin}/catalog/${encodeURIComponent(catalogKey)}` : undefined
}

function buildCustomerDraftFromCustomer(customer: Customer): CustomerDraft {
  return {
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
  }
}

// SideNav items list is now dynamically defined inside SideNav component

function App() {
  const publicCatalogKey = getPublicCatalogKey()

  if (publicCatalogKey) {
    return (
      <Suspense fallback={<LoadingScreen title="กำลังโหลดหน้า catalog" subtitle="กำลังเตรียมรายการชุดสำหรับลูกค้า" />}>
        <LazyPublicCatalogRoute catalogKey={publicCatalogKey} />
      </Suspense>
    )
  }

  return <PrivateApp />
}

function PrivateApp() {
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
  const [products, setProducts] = useState<ProductWithStockSummary[]>(() =>
    getLocalArray('precious_products', demoProducts)
  )
  const [selectedCustomerId, setSelectedCustomerId] = useState(hasSupabaseConfig ? '' : demoCustomers[0]?.id ?? '')
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerProfileStatus | 'has_risk'>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [previewCustomerDocOwnerId, setPreviewCustomerDocOwnerId] = useState<string | null>(null)
  const [previewCustomerDocIndex, setPreviewCustomerDocIndex] = useState<number>(0)
  const [previewCustomerDocLoadingKey, setPreviewCustomerDocLoadingKey] = useState<string | null>(null)
  const [previewCustomerDocError, setPreviewCustomerDocError] = useState('')
  const googleDrivePreviewUrlsRef = useRef(new Set<string>())
  const previewCustomer = useMemo(() => {
    return customers.find((c) => c.id === previewCustomerDocOwnerId)
  }, [customers, previewCustomerDocOwnerId])
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft)
  const [draftDocuments, setDraftDocuments] = useState<Array<{ id: string; file: File; previewUrl: string }>>([])
  const [existingDocuments, setExistingDocuments] = useState<CustomerDocument[]>([])
  const [deletedDocumentIds, setDeletedDocumentIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const previewUrls = googleDrivePreviewUrlsRef.current
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
      previewUrls.clear()
    }
  }, [])

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

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [brands, setBrands] = useState<string[]>(() => getLocalArray('precious_brands', DEFAULT_BRANDS))
  const [categories, setCategories] = useState<string[]>(() => getLocalArray('precious_categories', DEFAULT_CATEGORIES))
  const [colors, setColors] = useState<string[]>(() => getLocalArray('precious_colors', DEFAULT_COLORS))
  const [publicCatalogEnabled, setPublicCatalogEnabled] = useState(DEFAULT_PUBLIC_CATALOG_ENABLED)
  const [catalogHeroImageUrl, setCatalogHeroImageUrl] = useState<string | null>(() => getLocalString(LOCAL_CATALOG_HERO_IMAGE_KEY))
  const [catalogMobileHeroImageUrl, setCatalogMobileHeroImageUrl] = useState<string | null>(() => getLocalString(LOCAL_CATALOG_MOBILE_HERO_IMAGE_KEY))
  const [isCatalogHeroUploading, setIsCatalogHeroUploading] = useState(false)
  const [isCatalogMobileHeroUploading, setIsCatalogMobileHeroUploading] = useState(false)
  const [availableShops, setAvailableShops] = useState<ShopSummary[]>([])
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null)
  const authUserIdRef = useRef<string | null>(null)
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
    localStorage.setItem('precious_public_catalog_enabled', JSON.stringify(publicCatalogEnabled))
  }, [publicCatalogEnabled])

  useEffect(() => {
    if (hasSupabaseConfig) return
    if (catalogHeroImageUrl) {
      localStorage.setItem(LOCAL_CATALOG_HERO_IMAGE_KEY, catalogHeroImageUrl)
    } else {
      localStorage.removeItem(LOCAL_CATALOG_HERO_IMAGE_KEY)
    }
  }, [catalogHeroImageUrl])

  useEffect(() => {
    if (hasSupabaseConfig) return
    if (catalogMobileHeroImageUrl) {
      localStorage.setItem(LOCAL_CATALOG_MOBILE_HERO_IMAGE_KEY, catalogMobileHeroImageUrl)
    } else {
      localStorage.removeItem(LOCAL_CATALOG_MOBILE_HERO_IMAGE_KEY)
    }
  }, [catalogMobileHeroImageUrl])

  useEffect(() => {
    if (hasSupabaseConfig) return
    localStorage.setItem('precious_products', JSON.stringify(products))
  }, [products])

  const flatStockItems = useMemo(() => {
    return products.flatMap(p => 
      p.stockItems.map(si => ({
        ...si,
        productName: p.productName,
        brand: p.brand,
        category: p.category,
        primaryColor: p.primaryColor,
        rentalTiers: p.rentalTiers,
        lateFeeRule: p.lateFeeRule,
        depositAmount: p.depositAmount,
        imageUrls: p.imageUrls,
        publicVisible: p.publicVisible,
      } as FlatStockItem))
    )
  }, [products])

  async function saveShopSettings(nextSettings: ShopSettings) {
    if (supabase && isAuthenticated && shopId) {
      await updateShopSettings(supabase, shopId, nextSettings)
    }
  }

  function getShopSettings(overrides: Partial<ShopSettings> = {}): ShopSettings {
    return {
      brands,
      categories,
      colors,
      publicCatalogEnabled,
      catalogHeroImageUrl,
      catalogMobileHeroImageUrl,
      ...overrides,
    }
  }

  const handleAddBrand = async (brand: string) => {
    const updated = [...brands, brand]
    setBrands(updated)
    if (supabase && isAuthenticated && shopId) {
      try {
        await saveShopSettings(getShopSettings({ brands: updated }))
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
        await saveShopSettings(getShopSettings({ brands: updated }))
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
        await saveShopSettings(getShopSettings({ categories: updated }))
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
        await saveShopSettings(getShopSettings({ categories: updated }))
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
        await saveShopSettings(getShopSettings({ colors: updated }))
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
        await saveShopSettings(getShopSettings({ colors: updated }))
      } catch (err) {
        console.error('Failed to save settings:', err)
        window.alert('ลบข้อมูลการตั้งค่าล้มเหลว: ' + getErrorMessage(err))
      }
    }
  }

  const handlePublicCatalogEnabledChange = async (enabled: boolean) => {
    setPublicCatalogEnabled(enabled)
    try {
      await saveShopSettings(getShopSettings({ publicCatalogEnabled: enabled }))
    } catch (err) {
      setPublicCatalogEnabled(!enabled)
      console.error('Failed to save public catalog setting:', err)
      window.alert('บันทึกการตั้งค่า public catalog ล้มเหลว: ' + getErrorMessage(err))
    }
  }

  const handleToggleFeatured = async (productId: string, isFeatured: boolean) => {
    if (!currentShop || !supabase) return
    try {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, isFeatured } : p))
      await updateRemoteProductFeatured(supabase, currentShop.id, productId, isFeatured)
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะปักหมุด')
      // revert on error (simplified)
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, isFeatured: !isFeatured } : p))
    }
  }

  const handleSaveDisplayOrder = async (orderedIds: string[]) => {
    if (!currentShop || !supabase) return
    try {
      const updates = orderedIds.map((id, index) => ({ id, displayOrder: index }))
      // Optimistic update
      setProducts(prev => {
        const orderMap = new Map(updates.map(u => [u.id, u.displayOrder]))
        return [...prev].map(p => ({
          ...p,
          displayOrder: orderMap.has(p.id) ? orderMap.get(p.id)! : p.displayOrder
        }))
      })
      await bulkUpdateRemoteDisplayOrder(supabase, updates)
      alert('บันทึกลำดับชุดสำเร็จ')
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการบันทึกลำดับชุด')
      // Ideal: reload products from server on error
    }
  }

  const handleCatalogHeroImageUpload = async (file: File) => {
    try {
      setIsCatalogHeroUploading(true)

      if (supabase && isAuthenticated && shopId) {
        const nextUrl = await uploadShopHeroImage(supabase, shopId, file, catalogHeroImageUrl)
        setCatalogHeroImageUrl(nextUrl)
        await saveShopSettings(getShopSettings({ catalogHeroImageUrl: nextUrl }))
        return
      }

      const nextUrl = await fileToDataUrl(file)
      setCatalogHeroImageUrl(nextUrl)
    } catch (error) {
      console.error('Failed to upload catalog hero image:', error)
      window.alert('อัปโหลดรูปพื้นหลังไม่สำเร็จ: ' + getErrorMessage(error))
    } finally {
      setIsCatalogHeroUploading(false)
    }
  }

  const handleCatalogHeroImageRemove = async () => {
    if (!catalogHeroImageUrl) return

    const previousUrl = catalogHeroImageUrl
    setCatalogHeroImageUrl(null)

    try {
      if (supabase && isAuthenticated) {
        setIsCatalogHeroUploading(true)
        await deleteShopHeroImage(supabase, previousUrl)
        if (shopId) {
          await saveShopSettings(getShopSettings({ catalogHeroImageUrl: null }))
        }
      }
    } catch (error) {
      setCatalogHeroImageUrl(previousUrl)
      console.error('Failed to remove catalog hero image:', error)
      window.alert('ลบรูปพื้นหลังไม่สำเร็จ: ' + getErrorMessage(error))
    } finally {
      setIsCatalogHeroUploading(false)
    }
  }

  const handleCatalogMobileHeroImageUpload = async (file: File) => {
    try {
      setIsCatalogMobileHeroUploading(true)

      if (supabase && isAuthenticated && shopId) {
        const nextUrl = await uploadShopHeroImage(supabase, shopId, file, catalogMobileHeroImageUrl, 'mobile')
        setCatalogMobileHeroImageUrl(nextUrl)
        await saveShopSettings(getShopSettings({ catalogMobileHeroImageUrl: nextUrl }))
        return
      }

      const nextUrl = await fileToDataUrl(file)
      setCatalogMobileHeroImageUrl(nextUrl)
    } catch (error) {
      console.error('Failed to upload catalog mobile hero image:', error)
      window.alert('อัปโหลดรูปพื้นหลังมือถือไม่สำเร็จ: ' + getErrorMessage(error))
    } finally {
      setIsCatalogMobileHeroUploading(false)
    }
  }

  const handleCatalogMobileHeroImageRemove = async () => {
    if (!catalogMobileHeroImageUrl) return

    const previousUrl = catalogMobileHeroImageUrl
    setCatalogMobileHeroImageUrl(null)

    try {
      if (supabase && isAuthenticated) {
        setIsCatalogMobileHeroUploading(true)
        await deleteShopHeroImage(supabase, previousUrl)
        if (shopId) {
          await saveShopSettings(getShopSettings({ catalogMobileHeroImageUrl: null }))
        }
      }
    } catch (error) {
      setCatalogMobileHeroImageUrl(previousUrl)
      console.error('Failed to remove catalog mobile hero image:', error)
      window.alert('ลบรูปพื้นหลังมือถือไม่สำเร็จ: ' + getErrorMessage(error))
    } finally {
      setIsCatalogMobileHeroUploading(false)
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
      if (!shopId) {
        window.alert('ยังไม่พบร้านสำหรับบัญชีนี้')
        return
      }

      try {
        await updateRemoteRentalStatus(supabase, shopId, ids, status)
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
      if (!shopId) {
        window.alert('ยังไม่พบร้านสำหรับบัญชีนี้')
        return
      }

      try {
        await deleteRemoteRental(supabase, shopId, ids)
        handleLoadAuditLogs()
      } catch (error) {
        window.alert(getErrorMessage(error))
        return
      }
    }

    setRentals((current) => current.filter((r) => !ids.includes(r.id)))
  }
  const [formError, setFormError] = useState('')
  const [sessionReady, setSessionReady] = useState(!hasSupabaseConfig)
  const [isAuthenticated, setIsAuthenticated] = useState(!hasSupabaseConfig)
  const [shopId, setShopId] = useState<string | null>(null)
  const [overviewShopsData, setOverviewShopsData] = useState<OverviewShopData[]>([])
  const [remoteError, setRemoteError] = useState('')
  const currentShop = availableShops.find((shop) => shop.id === shopId) ?? null

  useEffect(() => {
    if (!supabase) return

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      const nextUserId = data.session?.user.id ?? null
      const userChanged = nextUserId !== authUserIdRef.current

      authUserIdRef.current = nextUserId
      setIsAuthenticated(Boolean(data.session))
      setAuthUserId(nextUserId)
      setAuthUserEmail(data.session?.user.email ?? null)
      if (!data.session) {
        setShopsReady(true)
      } else if (userChanged) {
        setShopsReady(false)
        setAvailableShops([])
        setOverviewShopsData([])
        setShopId(null)
        setRemoteError('')
      }
      setSessionReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null
      const userChanged = nextUserId !== authUserIdRef.current

      authUserIdRef.current = nextUserId
      setIsAuthenticated(Boolean(session))
      setAuthUserId(nextUserId)
      setAuthUserEmail(session?.user.email ?? null)
      if (!session) {
        setShopsReady(true)
        setAvailableShops([])
        setOverviewShopsData([])
        setShopId(null)
        setRemoteError('')
      } else if (userChanged) {
        setShopsReady(false)
        setAvailableShops([])
        setOverviewShopsData([])
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

        if (shops.length === 1) {
          setOverviewShopsData([])
          setShopId(shops[0].id)
        } else {
          setOverviewShopsData(shops.map((shop) => ({
            shop,
            status: 'loading',
            rentals: [],
            error: '',
          })))
          setShopId(null)
        }
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

  async function handleLogout() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  useEffect(() => {
    if (!authUserId || !shopId) return
    localStorage.setItem(getLastSelectedShopKey(authUserId), shopId)
  }, [authUserId, shopId])

  useEffect(() => {
    if (!supabase || !isAuthenticated || availableShops.length <= 1 || shopId) {
      setOverviewShopsData([])
      return
    }

    let cancelled = false
    const client = supabase

    setOverviewShopsData(availableShops.map((shop) => ({
      shop,
      status: 'loading',
      rentals: [],
      error: '',
    })))

    const loadAllShopsData = async () => {
      const results = await Promise.all(
        availableShops.map(async (shop) => {
          try {
            const customers = await loadCustomers(client, shop.id)
            const products = await loadProductsWithStock(client, shop.id)
            const tempFlatStock = products.flatMap(p => 
              p.stockItems.map(si => ({
                ...si,
                productName: p.productName,
                brand: p.brand,
                category: p.category,
                primaryColor: p.primaryColor,
                rentalTiers: p.rentalTiers,
                lateFeeRule: p.lateFeeRule,
                depositAmount: p.depositAmount,
                imageUrls: p.imageUrls,
                publicVisible: p.publicVisible,
              } as FlatStockItem))
            )
            const rentals = await loadRentals(client, shop.id, customers, tempFlatStock)
            return {
              shop,
              status: 'ready' as const,
              rentals,
              error: '',
            }
          } catch (err) {
            return {
              shop,
              status: 'error' as const,
              rentals: [],
              error: getErrorMessage(err),
            }
          }
        })
      )

      if (cancelled) return

      setOverviewShopsData(results)
    }

    loadAllShopsData()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, availableShops, shopId])

  useEffect(() => {
    if (!supabase || !isAuthenticated || !shopId) return

    let cancelled = false
    const client = supabase

    setIsShopDataLoading(true)
    setRemoteError('')
    setCustomers([])
    setProducts([])
    setRentals([])
    setAuditLogs([])
    setSelectedCustomerId('')
    setFormError('')
    setIsMobileDetailOpen(false)
    setIsFormOpen(false)
    setEditingCustomerId(null)
    setPreviewCustomerDocOwnerId(null)
    setPreviewCustomerDocIndex(0)
    setExternalSelectedRentalId('')
    setExternalIsFormOpen(false)
    setExternalPickupDate('')
    setExternalReturnDate('')
    setDraft(emptyDraft)
    setDraftDocuments([])
    setExistingDocuments([])
    setDeletedDocumentIds([])
    setQuery('')
    setCurrentPage(1)
    setStatusFilter('all')
    setBrands(DEFAULT_BRANDS)
    setCategories(DEFAULT_CATEGORIES)
    setColors(DEFAULT_COLORS)
    setPublicCatalogEnabled(DEFAULT_PUBLIC_CATALOG_ENABLED)
    setCatalogHeroImageUrl(null)
    setCatalogMobileHeroImageUrl(null)

    Promise.all([
      loadCustomers(client, shopId),
      loadProductsWithStock(client, shopId),
      loadShopSettings(client, shopId),
      loadAuditLogs(client, shopId),
    ])
      .then(async ([loadedCustomers, loadedProducts, settings, loadedAuditLogs]) => {
        if (cancelled) return

        setCustomers(loadedCustomers)
        setProducts(loadedProducts)
        if (settings) {
          setPublicCatalogEnabled(settings.publicCatalogEnabled)
        }
        setAuditLogs(loadedAuditLogs)
        setSelectedCustomerId(loadedCustomers[0]?.id ?? '')

        const tempFlatStock = loadedProducts.flatMap(p => 
          p.stockItems.map(si => ({
            ...si,
            productName: p.productName,
            brand: p.brand,
            category: p.category,
            primaryColor: p.primaryColor,
            rentalTiers: p.rentalTiers,
            lateFeeRule: p.lateFeeRule,
            depositAmount: p.depositAmount,
            imageUrls: p.imageUrls,
            publicVisible: p.publicVisible,
          } as FlatStockItem))
        )

        const loadedRentals = await loadRentals(client, shopId, loadedCustomers, tempFlatStock)
        if (cancelled) return

        setRentals(loadedRentals)

        if (settings?.brands?.length) setBrands(settings.brands)
        if (settings?.categories?.length) setCategories(settings.categories)
        if (settings?.colors?.length) setColors(settings.colors)
        if (settings) setPublicCatalogEnabled(settings.publicCatalogEnabled)
        setCatalogHeroImageUrl(settings?.catalogHeroImageUrl ?? null)
        setCatalogMobileHeroImageUrl(settings?.catalogMobileHeroImageUrl ?? null)
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

  const { pageProps: inventoryPageProps } = useInventoryController({
    products,
    setProducts,
    rentals,
    brands,
    categories,
    colors,
    isSaving,
    setIsSaving,
    isAuthenticated,
    shopId,
    supabase,
    onLoadAuditLogs: handleLoadAuditLogs,
  })

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

  const selectedCustomer =
    filteredCustomers.find((customer) => customer.id === selectedCustomerId) ??
    filteredCustomers[0]

  function updateDraft(field: keyof CustomerDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
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
    setDraft(buildCustomerDraftFromCustomer(customer))
    setDraftDocuments([])
    setExistingDocuments(customer.documents || [])
    setDeletedDocumentIds([])
    setIsFormOpen(true)
  }

  function resetCustomerFormDraft() {
    setDraft(emptyDraft)
    setDraftDocuments([])
    setExistingDocuments([])
    setDeletedDocumentIds([])
  }

  function closeCustomerForm() {
    setIsFormOpen(false)
    resetCustomerFormDraft()
    setFormError('')
    setEditingCustomerId(null)
    setIsSaving(false)
  }

  function resetCustomerForm() {
    if (!editingCustomerId) {
      resetCustomerFormDraft()
      return
    }

    const customer = customers.find((entry) => entry.id === editingCustomerId)
    if (!customer) return

    setDraft(buildCustomerDraftFromCustomer(customer))
    setDraftDocuments([])
    setExistingDocuments(customer.documents || [])
    setDeletedDocumentIds([])
  }

  async function loadDocumentPreview(document: CustomerDocument, forceRefresh = false) {
    if (!supabase || (document.previewUrl && !forceRefresh)) return document

    const loadedDocument = await loadCustomerDocumentPreview(supabase, document, { forceRefresh })
    if (loadedDocument.previewUrl?.startsWith('blob:')) {
      googleDrivePreviewUrlsRef.current.add(loadedDocument.previewUrl)
    }
    return loadedDocument
  }

  async function ensureCustomerDocumentPreview(customerId: string, documentIndex: number, forceRefresh = false) {
    const customer = customers.find((entry) => entry.id === customerId)
    const document = customer?.documents[documentIndex]
    if (!customer || !document || !supabase || (document.previewUrl && !forceRefresh)) return

    const loadingKey = `${customerId}:${document.id}`
    setPreviewCustomerDocLoadingKey(loadingKey)
    setPreviewCustomerDocError('')
    try {
      const loadedDocument = await loadDocumentPreview(document, forceRefresh)
      setCustomers((current) => current.map((entry) =>
        entry.id === customerId
          ? {
              ...entry,
              documents: entry.documents.map((candidate) =>
                candidate.id === loadedDocument.id ? loadedDocument : candidate,
              ),
            }
          : entry,
      ))
    } catch (error) {
      setPreviewCustomerDocError(getErrorMessage(error))
    } finally {
      setPreviewCustomerDocLoadingKey((current) => current === loadingKey ? null : current)
    }
  }

  async function ensureExistingDocumentPreview(documentId: string) {
    const document = existingDocuments.find((entry) => entry.id === documentId)
    if (!document || document.previewUrl || !supabase) return

    try {
      const loadedDocument = await loadDocumentPreview(document)
      setExistingDocuments((current) => current.map((entry) =>
        entry.id === documentId ? loadedDocument : entry,
      ))
      setCustomers((current) => current.map((customer) => ({
        ...customer,
        documents: customer.documents.map((entry) =>
          entry.id === documentId ? loadedDocument : entry,
        ),
      })))
    } catch (error) {
      window.alert(getErrorMessage(error))
    }
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
        const originalCustomer = customers.find((c) => c.id === editingCustomerId) ?? null
        if (supabase) {
          if (!originalCustomer) {
            setFormError('ไม่พบลูกค้าที่ต้องการแก้ไข')
            return
          }

          if (deletedDocumentIds.length > 0) {
            docsPendingDelete = originalCustomer.documents.filter((doc) =>
              deletedDocumentIds.includes(doc.id)
            )
          }

          if (docsPendingDelete.length > 0) {
            await deleteRemoteCustomerDocuments(supabase, originalCustomer.shopId, docsPendingDelete)
          }

          const updatedCustomer = await updateRemoteCustomer(supabase, originalCustomer.shopId, editingCustomerId, draft)
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
          storageProvider: 'supabase_storage' as const,
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
          storageProvider: 'supabase_storage' as const,
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
        await updateRemoteCustomerStatus(supabase, selectedCustomer.shopId, selectedCustomer.id, profileStatus)
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
        await updateRemoteCustomerRisk(supabase, selectedCustomer.shopId, selectedCustomer.id, riskFlag)
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
        await archiveRemoteCustomer(supabase, selectedCustomer.shopId, selectedCustomer.id)
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
      storageProvider: 'supabase_storage',
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
    return <EmptyShopAccessScreen message={remoteError || 'ยังไม่พบร้านสำหรับบัญชีนี้'} onLogout={handleLogout} />
  }

  if (hasSupabaseConfig && availableShops.length > 1 && !shopId) {
    return (
      <MultiShopDashboardPage
        shopsData={overviewShopsData}
        onEnterShop={setShopId}
        preferredShopId={getPreferredShopId(authUserId, availableShops)}
        onLogout={handleLogout}
      />
    )
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
            className={`mobile-action-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
            title="โปรไฟล์"
            type="button"
          >
            <CircleUserRound size={20} />
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
      />
      <main className="app-shell">
        {currentShop && (
          <section className="active-shop-banner" aria-label="ร้านที่กำลังใช้งาน">
            <p className="eyebrow">ร้านที่กำลังใช้งาน</p>
            <strong>{currentShop.name}</strong>
          </section>
        )}
        {remoteError && <section className="remote-error">{remoteError}</section>}

        <Suspense fallback={<PageLoadingFallback activeTab={activeTab} />}>
          {activeTab === 'dashboard' && (
            <LazyDashboardPage
              rentals={rentals}
              onUpdateRentalStatus={handleUpdateRentalStatus}
              onNavigateToCustomers={() => setActiveTab('customers')}
              onNavigateToRentals={() => setActiveTab('rentals')}
            />
          )}

          {activeTab === 'rentals' && (
            <LazyRentalsPage
              rentals={rentals}
              customers={customers}
              stockItems={flatStockItems}
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
            <LazyCalendarPage
              rentals={rentals}
              onUpdateRentalStatus={handleUpdateRentalStatus}
              onNavigateToRentals={handleNavigateToRentals}
              onNavigateToCreateRental={handleNavigateToCreateRental}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'inventory' && (
            <LazyInventoryPage {...inventoryPageProps} onOpenCatalog={() => setActiveTab('catalog')} />
          )}

          {activeTab === 'catalog' && (
            <LazyCustomerCatalogPage
              items={products.map(p => ({
                id: p.id,
                baseSku: p.baseSku,
                productName: p.productName,
                brand: p.brand,
                category: p.category,
                primaryColor: p.primaryColor,
                publicDescription: p.publicDescription,
                rentalTiers: p.rentalTiers,
                imageUrls: p.imageUrls,
                publicVisible: p.publicVisible,
                isFeatured: p.isFeatured,
                displayOrder: p.displayOrder,
                createdAt: p.createdAt,
                sizeSummary: Object.values(
                  p.stockItems.reduce((acc, si) => {
                    if (!acc[si.size]) acc[si.size] = { size: si.size, total: 0, available: 0 }
                    acc[si.size].total += 1
                    if (si.status === 'available' && !rentals.some(r => r.costume.sku === si.sku && ['booked', 'active'].includes(r.status))) {
                      acc[si.size].available += 1
                    }
                    return acc
                  }, {} as Record<string, { size: string, total: number, available: number }>)
                )
              }))}
              rentals={rentals}
              shopName={currentShop?.name}
              publicUrl={publicCatalogEnabled ? getPublicCatalogUrl(window.location.origin, currentShop) : undefined}
              heroBackgroundUrl={catalogHeroImageUrl}
              mobileHeroBackgroundUrl={catalogMobileHeroImageUrl}
              onUploadHeroBackground={handleCatalogHeroImageUpload}
              onUploadMobileHeroBackground={handleCatalogMobileHeroImageUpload}
              onRemoveHeroBackground={handleCatalogHeroImageRemove}
              onRemoveMobileHeroBackground={handleCatalogMobileHeroImageRemove}
              isUploadingHeroBackground={isCatalogHeroUploading}
              isUploadingMobileHeroBackground={isCatalogMobileHeroUploading}
              onBackToInventory={() => setActiveTab('inventory')}
              isAdminMode={true}
              onToggleFeatured={handleToggleFeatured}
              onSaveOrder={handleSaveDisplayOrder}
            />
          )}

          {activeTab === 'customers' && (
            <LazyCustomersPage
              currentPage={currentPage}
              totalPages={totalPages}
              query={query}
              statusFilter={statusFilter}
              summary={summary}
              statusOptions={statusOptions}
              paginatedCustomers={paginatedCustomers}
              selectedCustomer={selectedCustomer}
              isMobileDetailOpen={isMobileDetailOpen}
              isFormOpen={isFormOpen}
              editingCustomerId={editingCustomerId}
              draft={draft}
              draftDocuments={draftDocuments}
              existingDocuments={existingDocuments}
              formError={formError}
              isSaving={isSaving}
              previewCustomer={previewCustomer}
              previewCustomerDocIndex={previewCustomerDocIndex}
              previewCustomerDocLoading={
                Boolean(
                  previewCustomer &&
                  previewCustomer.documents[previewCustomerDocIndex] &&
                  previewCustomerDocLoadingKey === `${previewCustomer.id}:${previewCustomer.documents[previewCustomerDocIndex].id}`,
                )
              }
              previewCustomerDocError={previewCustomerDocError}
              onOpenCreateForm={() => setIsFormOpen(true)}
              onQueryChange={setQuery}
              onStatusFilterChange={setStatusFilter}
              onCurrentPageChange={setCurrentPage}
              onSelectCustomer={setSelectedCustomerId}
              onMobileDetailOpenChange={setIsMobileDetailOpen}
              onStatusChange={updateSelectedStatus}
              onRiskChange={updateSelectedRisk}
              onArchiveSelectedCustomer={archiveSelectedCustomer}
              onDocumentUpload={addDocuments}
              onDocumentPreviewError={refreshCustomerDocumentUrls}
              onEditCustomer={openEditCustomerForm}
              onPreviewCustomerDocument={(customerId, index) => {
                setPreviewCustomerDocOwnerId(customerId)
                setPreviewCustomerDocIndex(index)
                setPreviewCustomerDocError('')
                void ensureCustomerDocumentPreview(customerId, index, true)
              }}
              onCloseForm={closeCustomerForm}
              onDraftChange={updateDraft}
              onAddDraftDocuments={addDraftDocuments}
              onExistingDocumentRemove={(documentId) => {
                setExistingDocuments((current) => current.filter((entry) => entry.id !== documentId))
                setDeletedDocumentIds((current) => [...current, documentId])
              }}
              onPreviewExistingDocument={(documentId) => {
                void ensureExistingDocumentPreview(documentId)
              }}
              onRemoveDraftDocument={removeDraftDocument}
              onResetForm={resetCustomerForm}
              onSaveCustomer={handleSaveCustomer}
              onClosePreview={() => {
                setPreviewCustomerDocOwnerId(null)
                setPreviewCustomerDocError('')
              }}
            />
          )}

          {activeTab === 'settings' && (
            <LazySettingsPage
              brands={brands}
              categories={categories}
              colors={colors}
              publicCatalogEnabled={publicCatalogEnabled}
              onAddBrand={handleAddBrand}
              onDeleteBrand={handleDeleteBrand}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddColor={handleAddColor}
              onDeleteColor={handleDeleteColor}
              onPublicCatalogEnabledChange={handlePublicCatalogEnabledChange}
            />
          )}

          {activeTab === 'audit' && (
            <LazyAuditLogPage
              auditLogs={auditLogs}
              loading={loadingAudit}
              onRefresh={handleLoadAuditLogs}
            />
          )}

          {activeTab === 'reports' && (
            <LazyReportsPage
              rentals={rentals}
              stockItems={flatStockItems}
              supabase={supabase}
              shopId={shopId}
              shopName={currentShop?.name}
            />
          )}

          {activeTab === 'profile' && (
            <LazyProfilePage
              email={authUserEmail}
              availableShops={availableShops}
              selectedShopId={shopId}
              onShopChange={setShopId}
              onLogout={hasSupabaseConfig ? handleLogout : undefined}
            />
          )}
        </Suspense>

        {activeTab !== 'dashboard' && activeTab !== 'inventory' && activeTab !== 'catalog' && activeTab !== 'customers' && activeTab !== 'rentals' && activeTab !== 'calendar' && activeTab !== 'settings' && activeTab !== 'audit' && activeTab !== 'reports' && activeTab !== 'profile' && (
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
}: {
  activeTab: ViewKey
  onTabChange: (tab: ViewKey) => void
}) {
  const items: Array<{ id: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'inventory', label: 'คลังชุด', icon: Menu },
    { id: 'catalog', label: 'หน้าลูกค้า', icon: Store },
    { id: 'customers', label: 'ลูกค้า', icon: UserRound },
    { id: 'rentals', label: 'เช่า/คืน', icon: CalendarCheck },
    { id: 'calendar', label: 'ปฏิทิน', icon: CalendarDays },
    { id: 'reports', label: 'รายงาน', icon: BarChart3 },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings },
    { id: 'audit', label: 'ประวัติระบบ', icon: History },
    { id: 'profile', label: 'โปรไฟล์', icon: CircleUserRound },
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

function EmptyShopAccessScreen({ message, onLogout }: { message: string; onLogout: () => Promise<void> }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    if (isLoggingOut) return

    setLogoutError('')
    setIsLoggingOut(true)
    try {
      await onLogout()
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'ออกจากระบบไม่สำเร็จ กรุณาลองใหม่')
      setIsLoggingOut(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="modal-panel auth-panel">
        <p className="eyebrow">Precious Shop</p>
        <h1>ยังไม่พบบัญชีร้านค้า</h1>
        <p className="subtitle">{message}</p>
        <button className="secondary-button empty-shop-logout" type="button" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
        </button>
        {logoutError && <p className="form-error" role="alert">{logoutError}</p>}
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

function PageLoadingFallback({ activeTab }: { activeTab: ViewKey }) {
  const labelMap: Record<ViewKey, string> = {
    dashboard: 'แดชบอร์ด',
    inventory: 'คลังชุด',
    catalog: 'หน้าลูกค้า',
    customers: 'ลูกค้า',
    rentals: 'เช่า/คืน',
    calendar: 'ปฏิทิน',
    settings: 'ตั้งค่า',
    audit: 'ประวัติระบบ',
    reports: 'รายงาน',
    profile: 'โปรไฟล์',
  }

  return (
    <section className="panel" aria-live="polite" style={{ padding: '32px 28px' }}>
      <p className="eyebrow">Precious Shop</p>
      <h2 style={{ marginBottom: '8px' }}>กำลังโหลดหน้า {labelMap[activeTab]}</h2>
      <p className="subtitle" style={{ marginBottom: 0 }}>ระบบจะโหลดเฉพาะหน้าที่คุณเปิดใช้งานเพื่อลดขนาด bundle เริ่มต้น</p>
    </section>
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
