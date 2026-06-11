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
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  UserRound,
} from 'lucide-react'
import './index.css'
import { DashboardPage } from './features/dashboard/DashboardPage'
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

const statusOptions: Array<{ value: 'all' | CustomerProfileStatus; label: string }> = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'incomplete', label: profileStatusLabel.incomplete },
  { value: 'pending_review', label: profileStatusLabel.pending_review },
  { value: 'verified', label: profileStatusLabel.verified },
  { value: 'suspended', label: profileStatusLabel.suspended },
]

// SideNav items list is now dynamically defined inside SideNav component

function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [customers, setCustomers] = useState<Customer[]>(demoCustomers)
  const [selectedCustomerId, setSelectedCustomerId] = useState(demoCustomers[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerProfileStatus>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft)
  const [formError, setFormError] = useState('')
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

  const selectedCustomer =
    activeCustomers.find((customer) => customer.id === selectedCustomerId) ??
    filteredCustomers[0] ??
    activeCustomers[0]

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
          <DashboardPage onNavigateToCustomers={() => setActiveTab('customers')} />
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
              <MetricCard label="ลูกค้าทั้งหมด" value={`${summary.total}`} icon={<UserRound />} />
              <MetricCard label="ตรวจแล้ว" value={`${summary.verified}`} icon={<BadgeCheck />} />
              <MetricCard label="ข้อมูลไม่ครบ" value={`${summary.incomplete}`} icon={<AlertTriangle />} />
              <MetricCard label="มีสัญญาณความเสี่ยง" value={`${summary.risk}`} icon={<ShieldAlert />} />
            </section>

            {!hasSupabaseConfig && (
              <section className="config-note">
                <LockKeyhole size={18} />
                โหมดตัวอย่าง: ใส่ `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` เพื่อเชื่อม Supabase จริง
              </section>
            )}

            {hasSupabaseConfig && (
              <section className="config-note">
                <LockKeyhole size={18} />
                {isLoadingRemote ? 'กำลังโหลดข้อมูลจาก Supabase...' : 'เชื่อม Supabase แล้ว ใช้ private storage และ RLS'}
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
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="ค้นหาด้วยชื่อ เบอร์โทร รหัสลูกค้า หรือ LINE..."
                    />
                  </label>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
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
                    <span>สัญญาณความเสี่ยง</span>
                  </div>
                  {filteredCustomers.map((customer) => (
                    <button
                      className={`table-row table-button ${customer.id === selectedCustomer?.id ? 'selected' : ''}`}
                      key={customer.id}
                      role="row"
                      type="button"
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <strong>{customer.customerCode}</strong>
                      <span>{customer.fullName}</span>
                      <span>{customer.phoneNormalized}</span>
                      <StatusPill status={customer.profileStatus} />
                      <span>{customer.riskFlag === 'has_risk' ? 'มี' : 'ไม่มี'}</span>
                    </button>
                  ))}
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

        {activeTab !== 'dashboard' && activeTab !== 'customers' && (
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
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const items = [
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

  return (
    <aside className="panel detail-panel">
      <div className="detail-top">
        <div>
          <h2>{customer.fullName}</h2>
          <p>
            รหัส: {customer.customerCode} | LINE: {customer.lineAccount || '-'}
          </p>
        </div>
        <StatusPill status={customer.profileStatus} />
      </div>

      <div className={`rental-guard ${rentalGuard.allowed ? 'warn' : 'block'}`}>
        {rentalGuard.allowed ? <AlertTriangle size={18} /> : <ShieldAlert size={18} />}
        {rentalGuard.message || 'ลูกค้าพร้อมสร้างรายการเช่า'}
      </div>

      <section className="detail-section">
        <h3>ข้อมูลติดต่อ</h3>
        <div className="contact-card">
          <div>
            <span>เบอร์โทร:</span>
            <strong>{customer.phoneNormalized}</strong>
          </div>
          <div>
            <span>การเชื่อมต่อ LINE:</span>
            <strong>{customer.lineAccount || '-'}</strong>
          </div>
          <div className="wide-info">
            <span>ที่อยู่ปัจจุบัน:</span>
            <strong>{customer.currentAddress || '-'}</strong>
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

      <section className="detail-section">
        <h3>หมายเหตุ</h3>
        <p className="notes-box">{customer.notes || 'ยังไม่มีหมายเหตุ'}</p>
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

function MetricCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
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
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  type?: InputHTMLAttributes<HTMLInputElement>['type']
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
