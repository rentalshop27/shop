import { useState, useMemo } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  FileImage,
  FileText,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { TextField } from '../../components/TextField'
import {
  canCreateRentalForCustomer,
  formatMeasurements,
  profileStatusLabel,
  profileStatusTone,
  sanitizeThaiPhoneInput,
} from './customerRules'
import type {
  Customer,
  CustomerDocument,
  CustomerDraft,
  CustomerProfileStatus,
  RiskFlag,
} from './customerTypes'
import type { RentalOrder } from '../rentals/rentalTypes'
import { calculateCustomerInsights } from '../rentals/customerInsights'

type StatusFilter = 'all' | CustomerProfileStatus | 'has_risk'

type DraftCustomerDocument = {
  id: string
  file: File
  previewUrl: string
}

type CustomersPageProps = {
  currentPage: number
  totalPages: number
  query: string
  statusFilter: StatusFilter
  summary: {
    total: number
    verified: number
    risk: number
    incomplete: number
  }
  statusOptions: Array<{ value: StatusFilter; label: string }>
  paginatedCustomers: Customer[]
  rentals: RentalOrder[]
  selectedCustomer?: Customer
  isMobileDetailOpen: boolean
  isFormOpen: boolean
  editingCustomerId: string | null
  draft: CustomerDraft
  draftDocuments: DraftCustomerDocument[]
  existingDocuments: CustomerDocument[]
  formError: string
  isSaving: boolean
  previewCustomer?: Customer
  previewCustomerDocIndex: number
  previewCustomerDocLoading: boolean
  previewCustomerDocError: string
  onOpenCreateForm: () => void
  onQueryChange: (value: string) => void
  onStatusFilterChange: (value: StatusFilter) => void
  onCurrentPageChange: Dispatch<SetStateAction<number>>
  onSelectCustomer: (customerId: string) => void
  onMobileDetailOpenChange: Dispatch<SetStateAction<boolean>>
  onStatusChange: (status: CustomerProfileStatus) => void
  onRiskChange: (riskFlag: RiskFlag) => void
  onApproveCustomerDocuments: () => void
  onArchiveSelectedCustomer?: () => void
  onDocumentUpload: (files: FileList | null) => void
  onDocumentPreviewError: (customerId: string) => void
  onEditCustomer: (customer: Customer) => void
  onPreviewCustomerDocument: (customerId: string, index: number) => void
  onCloseForm: () => void
  onDraftChange: (field: keyof CustomerDraft, value: string) => void
  onAddDraftDocuments: (files: FileList | null) => void
  onExistingDocumentRemove: (documentId: string) => void
  onPreviewExistingDocument: (documentId: string) => void
  onRemoveDraftDocument: (documentId: string) => void
  onResetForm: () => void
  onSaveCustomer: () => void
  onClosePreview: () => void
  onNavigateToCreateRental?: (customerId: string) => void
}

export function CustomersPage({
  currentPage,
  totalPages,
  query,
  statusFilter,
  summary,
  statusOptions,
  paginatedCustomers,
  rentals,
  selectedCustomer,
  isMobileDetailOpen,
  isFormOpen,
  editingCustomerId,
  draft,
  draftDocuments,
  existingDocuments,
  formError,
  isSaving,
  previewCustomer,
  previewCustomerDocIndex,
  previewCustomerDocLoading,
  previewCustomerDocError,
  onOpenCreateForm,
  onQueryChange,
  onStatusFilterChange,
  onCurrentPageChange,
  onSelectCustomer,
  onMobileDetailOpenChange,
  onStatusChange,
  onRiskChange,
  onApproveCustomerDocuments,
  onArchiveSelectedCustomer,
  onDocumentUpload,
  onDocumentPreviewError,
  onEditCustomer,
  onPreviewCustomerDocument,
  onCloseForm,
  onDraftChange,
  onAddDraftDocuments,
  onExistingDocumentRemove,
  onPreviewExistingDocument,
  onRemoveDraftDocument,
  onResetForm,
  onSaveCustomer,
  onClosePreview,
  onNavigateToCreateRental,
}: CustomersPageProps) {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Precious Shop</p>
          <h1>รายชื่อลูกค้า</h1>
          <p className="subtitle">ตรวจสอบข้อมูลลูกค้า จัดการสัดส่วน และทบทวนสถานะโปรไฟล์</p>
        </div>
        <button className="primary-button" type="button" onClick={onOpenCreateForm}>
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
            onStatusFilterChange('all')
            onCurrentPageChange(1)
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
            onStatusFilterChange('verified')
            onCurrentPageChange(1)
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
            onStatusFilterChange('has_risk')
            onCurrentPageChange(1)
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
            onStatusFilterChange('incomplete')
            onCurrentPageChange(1)
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
                onChange={(event) => {
                  onQueryChange(event.target.value)
                  onCurrentPageChange(1)
                }}
                placeholder="ค้นหาด้วยชื่อ เบอร์โทร รหัสลูกค้า หรือ LINE"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => {
                onStatusFilterChange(event.target.value as StatusFilter)
                onCurrentPageChange(1)
              }}
            >
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
                  onSelectCustomer(customer.id)
                  onMobileDetailOpenChange(true)
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
              onClick={() => onCurrentPageChange((page) => Math.max(page - 1, 1))}
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="page-number-box">{currentPage}</div>
            <button
              className="pagination-btn"
              disabled={currentPage >= totalPages}
              onClick={() => onCurrentPageChange((page) => Math.min(page + 1, totalPages))}
              type="button"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {selectedCustomer && (
          <div
            className={`customer-detail-wrapper ${isMobileDetailOpen ? 'mobile-open' : ''}`}
            onClick={() => onMobileDetailOpenChange(false)}
          >
            <div className="customer-detail-content" onClick={(event) => event.stopPropagation()}>
              <CustomerDetail
                customer={selectedCustomer}
                onStatusChange={onStatusChange}
                onRiskChange={onRiskChange}
                onApproveCustomerDocuments={onApproveCustomerDocuments}
                onArchive={onArchiveSelectedCustomer}
                onDocumentUpload={onDocumentUpload}
                onDocumentPreviewError={onDocumentPreviewError}
                onEdit={() => onEditCustomer(selectedCustomer)}
                onClose={() => onMobileDetailOpenChange(false)}
                onPreviewDocument={(index) => onPreviewCustomerDocument(selectedCustomer.id, index)}
                rentals={rentals}
                onNavigateToCreateRental={onNavigateToCreateRental}
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
              <button className="ghost-button" type="button" onClick={onCloseForm} disabled={isSaving}>
                ปิด
              </button>
            </div>

            <div className="form-grid">
              <TextField label="ชื่อ-นามสกุล" value={draft.fullName} onChange={(value) => onDraftChange('fullName', value)} required disabled={isSaving} />
              <TextField
                label="เบอร์โทรศัพท์"
                value={draft.phone}
                onChange={(value) => onDraftChange('phone', sanitizeThaiPhoneInput(value))}
                inputMode="numeric"
                required
                disabled={isSaving}
              />
              <TextField label="ชื่อแอคเคา/LINE" value={draft.lineAccount} onChange={(value) => onDraftChange('lineAccount', value)} disabled={isSaving} />
              <label className="field">
                <span>สถานะโปรไฟล์</span>
                <select value={draft.profileStatus} onChange={(event) => onDraftChange('profileStatus', event.target.value)} disabled={isSaving}>
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
                  onChange={(event) => onDraftChange('currentAddress', event.target.value)}
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
                  onChange={(event) => onDraftChange('notes', event.target.value)}
                  rows={3}
                  disabled={isSaving}
                  spellCheck={false}
                  autoCapitalize="off"
                  translate="no"
                />
              </label>
              <TextField label='รอบอก (นิ้ว)' value={draft.bustIn} onChange={(value) => onDraftChange('bustIn', value)} inputMode="decimal" disabled={isSaving} />
              <TextField label='รอบเอว (นิ้ว)' value={draft.waistIn} onChange={(value) => onDraftChange('waistIn', value)} inputMode="decimal" disabled={isSaving} />
              <TextField label='สะโพก (นิ้ว)' value={draft.hipIn} onChange={(value) => onDraftChange('hipIn', value)} inputMode="decimal" disabled={isSaving} />
              <TextField label="ส่วนสูง (ซม.)" value={draft.heightCm} onChange={(value) => onDraftChange('heightCm', value)} inputMode="decimal" disabled={isSaving} />
              <label className="field">
                <span>สัญญาณความเสี่ยง</span>
                <select value={draft.riskFlag} onChange={(event) => onDraftChange('riskFlag', event.target.value)} disabled={isSaving}>
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
                    onChange={(event) => onAddDraftDocuments(event.target.files)}
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
                    <figure
                      key={doc.id}
                      style={{
                        position: 'relative',
                        margin: 0,
                        cursor: !doc.previewUrl ? 'pointer' : undefined,
                      }}
                      onClick={() => {
                        if (!doc.previewUrl) {
                          onPreviewExistingDocument(doc.id)
                        }
                      }}
                    >
                      {doc.previewUrl ? (
                        <img src={doc.previewUrl} alt={`เอกสารเดิมที่ ${index + 1}`} />
                      ) : (
                        <div className="file-placeholder">
                          <FileImage />
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={(event) => {
                          event.stopPropagation()
                          onExistingDocumentRemove(doc.id)
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
                        onClick={() => onRemoveDraftDocument(doc.id)}
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
              <button className="secondary-button" type="button" disabled={isSaving} onClick={onResetForm}>
                {editingCustomerId ? 'รีเซ็ตค่าเดิม' : 'ล้างฟอร์ม'}
              </button>
              <button className="primary-button" type="button" onClick={onSaveCustomer} disabled={isSaving}>
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
          onClick={onClosePreview}
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
                onClick={onClosePreview}
              >
                ปิด
              </button>
            </div>

            <div className="document-preview-stage">
              {previewCustomerDocLoading ? (
                <div className="file-placeholder document-preview-placeholder">
                  <FileImage size={48} />
                  <span>กำลังโหลดรูปตัวอย่าง...</span>
                </div>
              ) : previewCustomer.documents[previewCustomerDocIndex]?.previewUrl ? (
                <img
                  src={previewCustomer.documents[previewCustomerDocIndex].previewUrl}
                  alt={`เอกสารลูกค้า รูปที่ ${previewCustomerDocIndex + 1} ของ ${previewCustomer.fullName}`}
                />
              ) : (
                <div className="file-placeholder document-preview-placeholder">
                  <FileImage size={48} />
                  <span>{previewCustomerDocError || 'ยังไม่มีรูปตัวอย่าง กดรูปย่อเพื่อโหลดอีกครั้ง'}</span>
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
                    onClick={() => onPreviewCustomerDocument(previewCustomer.id, index)}
                  >
                    {previewCustomerDocLoading && index === previewCustomerDocIndex ? (
                      <div className="file-placeholder" style={{ height: '100%' }}>
                        <FileImage size={20} />
                      </div>
                    ) : doc.previewUrl ? (
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
  )
}

function CustomerDetail({
  customer,
  onStatusChange,
  onRiskChange,
  onApproveCustomerDocuments,
  onArchive,
  onDocumentUpload,
  onDocumentPreviewError,
  onEdit,
  onClose,
  onPreviewDocument,
  rentals,
  onNavigateToCreateRental,
}: {
  customer: Customer
  onStatusChange: (status: CustomerProfileStatus) => void
  onRiskChange: (riskFlag: RiskFlag) => void
  onApproveCustomerDocuments: () => void
  onArchive?: () => void
  onDocumentUpload: (files: FileList | null) => void
  onDocumentPreviewError: (customerId: string) => void
  onEdit: () => void
  onClose?: () => void
  onPreviewDocument?: (index: number) => void
  rentals: RentalOrder[]
  onNavigateToCreateRental?: (customerId: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'contact' | 'history'>('contact')

  const customerInsights = useMemo(() => {
    return calculateCustomerInsights(customer, rentals, new Date().toISOString().split('T')[0])
  }, [customer, rentals])

  const formatBaht = (value: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
  }

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h2 style={{ margin: 0 }}>{customer.fullName}</h2>
              {customer.riskFlag === 'has_risk' ? (
                <span className="status-pill danger" style={{ margin: 0 }}>มีสัญญาณความเสี่ยง</span>
              ) : (
                <StatusPill status={customer.profileStatus} />
              )}
            </div>
            <p style={{ margin: 0 }}>รหัส: {customer.customerCode}</p>
            <p style={{ margin: 0 }}>LINE: {customer.lineAccount || '-'}</p>
          </div>
        </div>
      </div>

      <div className={`rental-guard ${rentalGuard.allowed ? 'warn' : 'block'}`}>
        {rentalGuard.allowed ? <AlertTriangle size={18} /> : <ShieldAlert size={18} />}
        {rentalGuard.message || 'ลูกค้าพร้อมสร้างรายการเช่า'}
      </div>

      <section className="detail-section" style={{ marginTop: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="section-title-row" style={{ marginBottom: '12px' }}>
          <h3 style={{ margin: 0 }}>ตรวจสอบหลักฐานยืนยันตัวตน</h3>
          <span>{customer.documents.length}/5 รูป</span>
        </div>
        <div className="document-grid" style={{ marginBottom: '16px' }}>
          {customer.documents.length === 0 && (
            <div className="empty-doc">
              <FileImage size={28} />
              ยังไม่มีรูปเอกสาร
            </div>
          )}
          {customer.documents.map((document, index) => (
            <figure
              key={document.id}
              onClick={() => {
                onPreviewDocument?.(index)
              }}
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
                  <span>แตะเพื่อโหลด</span>
                </div>
              )}
              <figcaption>รูปที่ {document.sortOrder}</figcaption>
            </figure>
          ))}
        </div>
        <label className="upload-box" style={{ marginBottom: '16px' }}>
          <Camera size={20} />
          อัปโหลดรูปเอกสาร/บัตรประชาชน (เลือกพร้อมกันได้หลายรูป)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => onDocumentUpload(event.target.files)}
          />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            className="primary-button"
            type="button"
            onClick={onApproveCustomerDocuments}
            disabled={customer.documents.length === 0 || customer.profileStatus === 'verified'}
            style={{
              minHeight: '40px',
              fontSize: '14px',
              background: (customer.documents.length === 0 || customer.profileStatus === 'verified') ? 'var(--bg-card)' : 'var(--success-color)',
              opacity: (customer.documents.length === 0 || customer.profileStatus === 'verified') ? 0.5 : 1,
              cursor: (customer.documents.length === 0 || customer.profileStatus === 'verified') ? 'not-allowed' : 'pointer',
            }}
          >
            {customer.profileStatus === 'verified' ? 'อนุมัติแล้ว' : 'อนุมัติ'}
          </button>
          <button
            className={customer.profileStatus === 'suspended' ? "secondary-button" : "danger-button"}
            type="button"
            onClick={() => { onStatusChange(customer.profileStatus === 'suspended' ? 'pending_review' : 'suspended'); }}
            style={{ minHeight: '40px', fontSize: '14px', background: customer.profileStatus === 'suspended' ? 'var(--bg-card)' : 'var(--danger-color)' }}
          >
            {customer.profileStatus === 'suspended' ? 'ปลดบล็อกลูกค้า' : 'บล็อกลูกค้า'}
          </button>
        </div>
      </section>

      <div className="tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginTop: '16px', paddingBottom: '8px', overflowX: 'auto' }}>
        <button className={`ghost-button ${activeTab === 'contact' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('contact')} style={{ background: activeTab === 'contact' ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
          📝 ข้อมูลติดต่อ
        </button>
        <button className={`ghost-button ${activeTab === 'history' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('history')} style={{ background: activeTab === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
          📜 ประวัติการเช่า
        </button>
      </div>

      {activeTab === 'contact' && (
        <>
          <section className="detail-section" style={{ marginTop: '16px' }}>
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

          <section className="detail-section controls-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', margin: 0 }}>
              <span style={{ fontSize: '16px' }}>🔒</span> ข้อมูลความปลอดภัยระบบ
            </h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginTop: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <input
                type="checkbox"
                checked={customer.riskFlag === 'has_risk'}
                onChange={(e) => onRiskChange(e.target.checked ? 'has_risk' : 'none')}
                style={{ width: '18px', height: '18px', accentColor: 'var(--danger-color)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', userSelect: 'none' }}>ติดเครื่องหมายเฝ้าระวังภัย (Flag as Risky User)</span>
            </label>
          </section>
        </>
      )}

      {activeTab === 'history' && (
        <section className="detail-section" style={{ marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>เช่าทั้งหมด</div>
              <div style={{ fontSize: '13px', color: 'var(--text-bright)', fontWeight: 600 }}>{customerInsights.rentalCount} ครั้ง</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>คืนครบแล้ว</div>
              <div style={{ fontSize: '13px', color: 'var(--success-color)', fontWeight: 600 }}>{customerInsights.completedRentalCount}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ค้างคืนตอนนี้</div>
              <div style={{ fontSize: '13px', color: 'var(--warning-color)', fontWeight: 600 }}>{customerInsights.activeOverdueCount}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ยึดมัดจำ</div>
              <div style={{ fontSize: '13px', color: customerInsights.depositForfeitedCount > 0 ? 'var(--warning-color)' : 'var(--success-color)', fontWeight: 600 }}>{customerInsights.depositForfeitedCount}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ยอดสุทธิ</div>
              <div style={{ fontSize: '13px', color: 'var(--text-bright)', fontWeight: 600 }}>{formatBaht(customerInsights.totalSpent)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ระดับลูกค้า</div>
              <div aria-label={`ระดับลูกค้า ${customerInsights.starRating} จาก 5`} style={{ fontSize: '13px', color: 'var(--text-gold)', fontWeight: 600 }}>{customerInsights.starDisplay}</div>
            </div>
          </div>

          <h3 style={{ marginTop: '16px', marginBottom: '8px' }}>รายการเช่าของลูกค้านี้</h3>
          <div className="rental-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rentals.filter(r => r.customer.id === customer.id).length === 0 ? (
              <div className="empty-state" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                ยังไม่มีประวัติการเช่า
              </div>
            ) : (
              rentals.filter(r => r.customer.id === customer.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(r => (
                <div key={r.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                      {r.id.includes('-') ? `#${r.id.split('-').pop()}` : `#${r.id}`}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.pickupDate} - {r.returnDate}</span>
                  </div>
                  <span className={`status-pill ${r.status}`} style={{ fontSize: '12px', padding: '2px 8px' }}>
                    {r.status === 'booked' ? 'จอง' : r.status === 'active' ? 'กำลังเช่า' : r.status === 'returned' ? 'คืนแล้ว' : r.status === 'overdue' ? 'เกินกำหนด' : 'ยกเลิก'}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <button
        className="primary-button"
        style={{ width: '100%', marginTop: '24px', minHeight: '48px', fontSize: '15px' }}
        type="button"
        onClick={() => onNavigateToCreateRental?.(customer.id)}
      >
        <Plus size={20} />
        สร้างรายการเช่าใหม่ให้ลูกค้านี้
      </button>
      <div
        className="detail-action-buttons"
        style={{
          display: 'grid',
          gridTemplateColumns: onArchive ? '1fr 1fr' : '1fr',
          gap: '12px',
          marginTop: '24px',
        }}
      >
        <button className="secondary-button" type="button" onClick={onEdit} style={{ minHeight: '44px', width: '100%', gap: '8px' }}>
          <Pencil size={18} />
          แก้ไขข้อมูล
        </button>
        {onArchive && (
          <button className="archive-button" type="button" onClick={onArchive} style={{ minHeight: '44px', width: '100%', gap: '8px', marginTop: 0 }}>
            <Trash2 size={18} />
            ลบลูกค้า
          </button>
        )}
      </div>
    </aside>
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
