import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  Shirt,
  Trash2
} from 'lucide-react'
import type { RentalOrder, RentalStatus } from './rentalTypes'
import type { Customer } from '../customers/customerTypes'
import type { StockItem } from '../../App'

interface RentalsPageProps {
  rentals: RentalOrder[]
  customers: Customer[]
  stockItems: StockItem[]
  onCreateRental: (draft: Omit<RentalOrder, 'id' | 'orderCode' | 'createdAt' | 'updatedAt'>) => void
  onUpdateRentalStatus: (rentalId: string, status: RentalStatus) => void
  onDeleteRental?: (rentalId: string) => void

  // Optional external controls
  externalSelectedRentalId?: string
  onSelectRental?: (id: string) => void
  externalIsFormOpen?: boolean
  onFormOpenChange?: (open: boolean) => void
  externalPickupDate?: string
  externalReturnDate?: string
  onClearExternalDates?: () => void
}

export function RentalsPage({
  rentals,
  customers,
  stockItems,
  onCreateRental,
  onUpdateRentalStatus,
  onDeleteRental,

  // Optional external controls
  externalSelectedRentalId,
  onSelectRental,
  externalIsFormOpen,
  onFormOpenChange,
  externalPickupDate,
  externalReturnDate,
  onClearExternalDates
}: RentalsPageProps) {
  // Navigation / Selected rental
  const [localSelectedRentalId, setLocalSelectedRentalId] = useState<string>('')
  const selectedRentalId = onSelectRental ? (externalSelectedRentalId || '') : localSelectedRentalId
  const setSelectedRentalId = (id: string) => {
    if (onSelectRental) {
      onSelectRental(id)
    } else {
      setLocalSelectedRentalId(id)
    }
  }
  
  // Search & Filter
  const [orderQuery, setOrderQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RentalStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Form states
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  const [costumeSearch, setCostumeSearch] = useState('')
  const [selectedCostume, setSelectedCostume] = useState<StockItem | null>(null)
  const [showCostumeDropdown, setShowCostumeDropdown] = useState(false)

  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [rentalPrice, setRentalPrice] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [collectedAmount, setCollectedAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  
  const [localIsFormOpen, setLocalIsFormOpen] = useState(false)
  const isFormOpen = onFormOpenChange ? (externalIsFormOpen || false) : localIsFormOpen
  const setIsFormOpen = (open: boolean) => {
    if (onFormOpenChange) {
      onFormOpenChange(open)
    } else {
      setLocalIsFormOpen(open)
    }
  }

  // Effect to prefill dates when form opens externally
  useEffect(() => {
    if (isFormOpen) {
      let consumed = false
      if (externalPickupDate) {
        setPickupDate(externalPickupDate)
        consumed = true
      }
      if (externalReturnDate) {
        setReturnDate(externalReturnDate)
        consumed = true
      }
      if (consumed && onClearExternalDates) {
        onClearExternalDates()
      }
    }
  }, [isFormOpen, externalPickupDate, externalReturnDate, onClearExternalDates])

  // Autocomplete Suggestions
  const filteredCustomersSuggestions = useMemo(() => {
    const query = customerSearch.trim().toLowerCase()
    if (!query) return []
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(query) ||
        c.customerCode.toLowerCase().includes(query) ||
        c.phone.includes(query)
    )
  }, [customers, customerSearch])

  const filteredCostumesSuggestions = useMemo(() => {
    const query = costumeSearch.trim().toLowerCase()
    if (!query) return []
    return stockItems.filter(
      (item) =>
        item.productName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
    )
  }, [stockItems, costumeSearch])

  // Sync pricing when costume is selected
  useEffect(() => {
    if (selectedCostume) {
      setRentalPrice(selectedCostume.rentalPricePerDay.toString())
      setDepositAmount(selectedCostume.depositAmount.toString())
      setCollectedAmount((selectedCostume.rentalPricePerDay + selectedCostume.depositAmount).toString())
    } else {
      setRentalPrice('')
      setDepositAmount('')
      setCollectedAmount('')
    }
  }, [selectedCostume])

  // Recalculate default collected amount if price or deposit changes
  const handlePriceOrDepositChange = (priceVal: string, depVal: string) => {
    const p = parseFloat(priceVal) || 0
    const d = parseFloat(depVal) || 0
    setCollectedAmount((p + d).toString())
  }

  // Filter rentals list
  const filteredRentals = useMemo(() => {
    const query = orderQuery.trim().toLowerCase()
    return rentals.filter((rental) => {
      const matchesStatus = statusFilter === 'all' || rental.status === statusFilter
      const searchable = [
        rental.orderCode,
        rental.customer.fullName,
        rental.customer.customerCode,
        rental.costume.productName,
        rental.costume.sku
      ]
        .join(' ')
        .toLowerCase()
      
      return matchesStatus && (!query || searchable.includes(query))
    })
  }, [rentals, orderQuery, statusFilter])

  // Paginated rentals
  const paginatedRentals = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRentals.slice(startIndex, startIndex + pageSize)
  }, [filteredRentals, currentPage, pageSize])

  const totalPages = Math.ceil(filteredRentals.length / pageSize) || 1

  // Set default selected rental
  const selectedRental = useMemo(() => {
    return rentals.find((r) => r.id === selectedRentalId) ?? filteredRentals[0] ?? rentals[0]
  }, [rentals, selectedRentalId, filteredRentals])

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!selectedCustomer) {
      setFormError('กรุณาเลือกผู้เช่า')
      return
    }
    if (!selectedCostume) {
      setFormError('กรุณาเลือกแบบชุด')
      return
    }
    if (!pickupDate) {
      setFormError('กรุณาระบุวันที่จอง/รับชุด')
      return
    }
    if (!returnDate) {
      setFormError('กรุณาระบุวันที่คืน')
      return
    }
    if (new Date(returnDate) < new Date(pickupDate)) {
      setFormError('วันที่คืนต้องอยู่หลังวันที่จอง/รับชุด')
      return
    }

    const price = parseFloat(rentalPrice) || 0
    const deposit = parseFloat(depositAmount) || 0
    const collected = parseFloat(collectedAmount) || (price + deposit)

    onCreateRental({
      customer: selectedCustomer,
      costume: selectedCostume,
      pickupDate,
      returnDate,
      rentalPrice: price,
      depositAmount: deposit,
      collectedAmount: collected,
      status: 'booked',
      notes
    })

    // Reset Form
    setSelectedCustomer(null)
    setCustomerSearch('')
    setSelectedCostume(null)
    setCostumeSearch('')
    setPickupDate('')
    setReturnDate('')
    setNotes('')
    setIsFormOpen(false)
  }

  // Formatting currency helper
  const formatBaht = (value: number) => {
    return `฿${value.toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`
  }

  // Get status translation
  const getStatusBadge = (status: RentalStatus) => {
    switch (status) {
      case 'booked':
        return <span className="status-pill warning">จอง</span>
      case 'active':
        return <span className="status-pill success" style={{ background: 'rgba(218, 165, 32, 0.15)', color: '#ead483', border: '1px solid rgba(218, 165, 32, 0.3)' }}>ใช้งานอยู่</span>
      case 'returned':
        return <span className="status-pill success">คืนแล้ว</span>
      case 'overdue':
        return <span className="status-pill danger">เกินกำหนด</span>
      default:
        return <span className="status-pill muted">{status}</span>
    }
  }

  // Date formatted display e.g. "2026-06-11 to 2026-06-13"
  const formatDateRange = (start: string, end: string) => {
    return `${start} to ${end}`
  }

  // Fallback Red/Midnight Dress Image if none
  const sampleDressImage = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80'

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Precious Shop</p>
          <h1>หน้าเช่าชุด</h1>
          <p className="subtitle">ลงทะเบียนจองชุด จัดทำประวัติการเช่า ติดตามช่วงรับชุดและส่งคืน</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setIsFormOpen(true)}>
          <Plus size={22} />
          สร้างใบเช่าชุด
        </button>
      </header>

      {/* RENTALS WORKSPACE */}
      <section className="customer-grid">
        {/* Left Side: Orders Table and Filter Bar */}
        <div className="panel customer-list-panel">
          <div className="toolbar">
            <label className="search-box">
              <Search size={22} />
              <input
                value={orderQuery}
                onChange={(e) => { setOrderQuery(e.target.value); setCurrentPage(1); }}
                placeholder="ค้นหาด้วยรหัสออเดอร์ ชื่อลูกค้า หรือรหัสชุด..."
              />
            </label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="booked">จอง (รอส่งมอบ)</option>
              <option value="active">ใช้งานอยู่ (กำลังใช้งาน)</option>
              <option value="returned">คืนแล้ว</option>
              <option value="overdue">เกินกำหนดคืน</option>
            </select>
          </div>

          <div className="customer-table" role="table" aria-label="รายการออเดอร์เช่าชุด">
            <div className="table-row table-head" role="row" style={{ gridTemplateColumns: '105px 1.1fr 1.4fr 125px 95px 32px', minWidth: '700px' }}>
              <span>รหัสออเดอร์</span>
              <span>ลูกค้า</span>
              <span>ช่วงเช่า</span>
              <span>ค่าปรับ / เงินประกัน</span>
              <span>สถานะ</span>
              <span></span>
            </div>

            {paginatedRentals.map((rental) => (
              <button
                className={`table-row table-button ${rental.id === selectedRental?.id ? 'selected' : ''}`}
                key={rental.id}
                role="row"
                type="button"
                onClick={() => setSelectedRentalId(rental.id)}
                style={{ gridTemplateColumns: '105px 1.1fr 1.4fr 125px 95px 32px', minWidth: '700px' }}
              >
                <strong>{rental.orderCode}</strong>
                <span>
                  {rental.customer.fullName}
                  <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>
                    {rental.customer.lineAccount ? `LINE: ${rental.customer.lineAccount}` : rental.customer.customerCode}
                  </small>
                </span>
                <span style={{ fontSize: '13px' }}>
                  {formatDateRange(rental.pickupDate, rental.returnDate)}
                </span>
                <span>
                  {formatBaht(rental.rentalPrice)}
                  <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>
                    มัดจำ: {formatBaht(rental.depositAmount)}
                  </small>
                </span>
                {getStatusBadge(rental.status)}
                <ChevronRight size={18} className="arrow-icon" />
              </button>
            ))}

            {paginatedRentals.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                ไม่มีรายการเช่าชุดในระบบ
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
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
          )}
        </div>

        {/* Right Side: Order & Customer Detail View */}
        {selectedRental && (
          <aside className="panel detail-panel" style={{ width: '100%', maxWidth: '420px' }}>
            <div className="profile-card-top">
              <div className="profile-card-info">
                <div className="profile-avatar">
                  {selectedRental.customer.fullName.slice(0, 2).toLowerCase()}
                </div>
                <div className="profile-meta">
                  <h2>รายละเอียดโปรไฟล์ลูกค้า</h2>
                  <p>
                    <strong>{selectedRental.customer.fullName}</strong> ({selectedRental.customer.phone})
                  </p>
                  <p>LINE: {selectedRental.customer.lineAccount || '-'}</p>
                </div>
              </div>
              {getStatusBadge(selectedRental.status)}
            </div>

            {/* Measurements Grid */}
            <section className="detail-section" style={{ marginTop: '20px' }}>
              <div className="section-title-row">
                <h3 style={{ fontSize: '15px', color: '#fff', margin: 0 }}>ขนาดสัดส่วน</h3>
              </div>
              <div className="measurement-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>รอบอก</span>
                  <strong style={{ fontSize: '16px', color: '#fff' }}>
                    {selectedRental.customer.bustIn ? `${selectedRental.customer.bustIn}"` : '-'}
                  </strong>
                </div>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>รอบเอว</span>
                  <strong style={{ fontSize: '16px', color: '#fff' }}>
                    {selectedRental.customer.waistIn ? `${selectedRental.customer.waistIn}"` : '-'}
                  </strong>
                </div>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>สะโพก</span>
                  <strong style={{ fontSize: '16px', color: '#fff' }}>
                    {selectedRental.customer.hipIn ? `${selectedRental.customer.hipIn}"` : '-'}
                  </strong>
                </div>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>ส่วนสูง</span>
                  <strong style={{ fontSize: '16px', color: '#fff' }}>
                    {selectedRental.customer.heightCm ? `${selectedRental.customer.heightCm} cm` : '-'}
                  </strong>
                </div>
              </div>
            </section>

            {/* Costume Detail Item */}
            <section className="detail-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '12px' }}>รายการออเดอร์และวงจรสินค้า</h3>
              <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', alignItems: 'center' }}>
                <img
                  src={sampleDressImage}
                  alt={selectedRental.costume.productName}
                  style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff' }}>
                    {selectedRental.costume.productName}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    รหัส: {selectedRental.costume.sku} | <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#4169e1' }}></span>
                      {selectedRental.costume.primaryColor}
                    </span>
                  </p>
                  <div style={{ marginTop: '8px' }}>
                    {selectedRental.status === 'booked' && (
                      <span className="status-pill warning" style={{ fontSize: '11px', padding: '4px 8px' }}>สถานะ รอส่งมอบ</span>
                    )}
                    {selectedRental.status === 'active' && (
                      <span className="status-pill success" style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(218, 165, 32, 0.15)', color: '#ead483' }}>สถานะ ใช้งานอยู่</span>
                    )}
                    {selectedRental.status === 'returned' && (
                      <span className="status-pill success" style={{ fontSize: '11px', padding: '4px 8px' }}>สถานะ ส่งคืนแล้ว</span>
                    )}
                    {selectedRental.status === 'overdue' && (
                      <span className="status-pill danger" style={{ fontSize: '11px', padding: '4px 8px' }}>สถานะ เกินกำหนด</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '18px', color: 'var(--text-gold)', display: 'block' }}>
                    {formatBaht(selectedRental.rentalPrice)}
                  </strong>
                  {selectedRental.depositAmount > 0 && (
                    <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      ประกัน: {formatBaht(selectedRental.depositAmount)}
                    </small>
                  )}
                </div>
              </div>
            </section>

            {/* Lifecycle Controls */}
            <section className="detail-section controls-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '12px' }}>การควบคุมและจัดส่ง</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {selectedRental.status === 'booked' && (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => onUpdateRentalStatus(selectedRental.id, 'active')}
                    style={{ width: '100%', fontSize: '14px', background: 'var(--text-gold)', color: '#000' }}
                  >
                    ส่งมอบชุด (ขนส่ง)
                  </button>
                )}
                {(selectedRental.status === 'active' || selectedRental.status === 'overdue') && (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => onUpdateRentalStatus(selectedRental.id, 'returned')}
                    style={{ width: '100%', fontSize: '14px', background: 'var(--success-color)', borderColor: 'var(--success-color)', color: '#fff' }}
                  >
                    รับคืนชุด (รับคืน)
                  </button>
                )}
                {selectedRental.status === 'returned' && (
                  <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--success-color)', background: 'var(--success-bg)', borderRadius: '8px', padding: '12px', fontWeight: 600 }}>
                    ออเดอร์นี้สิ้นสุดแล้ว (คืนชุดเรียบร้อย)
                  </div>
                )}

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    const nextStatusMap: Record<RentalStatus, RentalStatus> = {
                      booked: 'active',
                      active: 'overdue',
                      overdue: 'returned',
                      returned: 'booked'
                    }
                    onUpdateRentalStatus(selectedRental.id, nextStatusMap[selectedRental.status])
                  }}
                  style={{ fontSize: '14px' }}
                >
                  เปลี่ยนสถานะถัดไป
                </button>
              </div>

              {onDeleteRental && (
                <button
                  className="archive-button"
                  type="button"
                  onClick={() => {
                    if (window.confirm(`ต้องการลบใบเช่า ${selectedRental.orderCode} ใช่หรือไม่?`)) {
                      onDeleteRental(selectedRental.id)
                    }
                  }}
                  style={{ marginTop: '16px' }}
                >
                  <Trash2 size={16} />
                  ลบใบเช่านี้
                </button>
              )}
            </section>
          </aside>
        )}
      </section>

      {/* CREATE RENTAL FORM MODAL */}
      {isFormOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="สร้างใบเช่าชุดใหม่" style={{ maxWidth: '650px', width: '100%' }}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Rental Order</p>
                <h2>ลงทะเบียนเช่าชุดใหม่</h2>
              </div>
              <button className="ghost-button" type="button" onClick={() => setIsFormOpen(false)}>
                ปิด
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* SELECT CUSTOMER AUTOCOMPLETE */}
              <div style={{ position: 'relative' }}>
                <label className="field">
                  <span>ผู้เช่าชุด (พิมพ์ชื่อ หรือ รหัสลูกค้า)<b style={{ color: 'red' }}> *</b></span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={customerSearch}
                      placeholder="เช่น pun, PR-C001"
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setSelectedCustomer(null)
                        setShowCustomerDropdown(true)
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                    />
                    <Search size={18} style={{ position: 'absolute', right: '16px', color: 'var(--text-muted)' }} />
                  </div>
                </label>

                {showCustomerDropdown && filteredCustomersSuggestions.length > 0 && (
                  <ul style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', listStyle: 'none', padding: '6px 0', margin: '4px 0 0',
                    zIndex: 999, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
                  }}>
                    {filteredCustomersSuggestions.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(c)
                            setCustomerSearch(`${c.fullName} (${c.customerCode})`)
                            setShowCustomerDropdown(false)
                          }}
                          style={{
                            width: '100%', textAlign: 'left', background: 'none', border: 0,
                            padding: '10px 16px', color: '#fff', cursor: 'pointer', transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(223, 183, 80, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <strong>{c.fullName}</strong> ({c.customerCode}) - LINE: {c.lineAccount || '-'} | โทร: {c.phone}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {selectedCustomer && (
                  <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>เลือกสำเร็จ:</span> {selectedCustomer.fullName} ({selectedCustomer.customerCode})
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                        รอบอก: {selectedCustomer.bustIn ? `${selectedCustomer.bustIn}"` : '-'} | 
                        รอบเอว: {selectedCustomer.waistIn ? `${selectedCustomer.waistIn}"` : '-'} | 
                        สะโพก: {selectedCustomer.hipIn ? `${selectedCustomer.hipIn}"` : '-'} | 
                        สูง: {selectedCustomer.heightCm ? `${selectedCustomer.heightCm} cm` : '-'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SELECT COSTUME AUTOCOMPLETE */}
              <div style={{ position: 'relative' }}>
                <label className="field">
                  <span>เลือกแบบชุด (พิมพ์ชื่อ หรือ SKU)<b style={{ color: 'red' }}> *</b></span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={costumeSearch}
                      placeholder="เช่น Midnight, PR-8130"
                      onChange={(e) => {
                        setCostumeSearch(e.target.value)
                        setSelectedCostume(null)
                        setShowCostumeDropdown(true)
                      }}
                      onFocus={() => setShowCostumeDropdown(true)}
                    />
                    <Shirt size={18} style={{ position: 'absolute', right: '16px', color: 'var(--text-muted)' }} />
                  </div>
                </label>

                {showCostumeDropdown && filteredCostumesSuggestions.length > 0 && (
                  <ul style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', listStyle: 'none', padding: '6px 0', margin: '4px 0 0',
                    zIndex: 999, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
                  }}>
                    {filteredCostumesSuggestions.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCostume(item)
                            setCostumeSearch(`${item.productName} (${item.sku})`)
                            setShowCostumeDropdown(false)
                          }}
                          style={{
                            width: '100%', textAlign: 'left', background: 'none', border: 0,
                            padding: '10px 16px', color: '#fff', cursor: 'pointer', transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(223, 183, 80, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <strong>{item.productName}</strong> ({item.sku}) - ไซส์: {item.size} | ค่าเช่า: {formatBaht(item.rentalPricePerDay)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {selectedCostume && (
                  <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(223, 183, 80, 0.05)', border: '1px solid rgba(223, 183, 80, 0.2)', borderRadius: '8px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>เลือกสำเร็จ:</span> {selectedCostume.productName} ({selectedCostume.sku})
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                      สี: {selectedCostume.primaryColor} | ไซส์: {selectedCostume.size} | ค่าปรับ: {selectedCostume.lateFeeRule || '-'}
                    </div>
                  </div>
                )}
              </div>

              {/* RENTAL PERIOD DATES */}
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label className="field">
                  <span>วันที่จอง / รับชุด<b style={{ color: 'red' }}> *</b></span>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>วันที่คืน<b style={{ color: 'red' }}> *</b></span>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </label>
              </div>

              {/* FINANCIAL SETTINGS */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-gold)', margin: '0 0 12px' }}>สรุปข้อมูลการเงิน</h3>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label className="field">
                    <span>ราคาเช่าต่อครั้ง</span>
                    <input
                      type="number"
                      value={rentalPrice}
                      placeholder="0"
                      onChange={(e) => {
                        setRentalPrice(e.target.value)
                        handlePriceOrDepositChange(e.target.value, depositAmount)
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>ค่ามัดจำ / ประกัน</span>
                    <input
                      type="number"
                      value={depositAmount}
                      placeholder="0"
                      onChange={(e) => {
                        setDepositAmount(e.target.value)
                        handlePriceOrDepositChange(rentalPrice, e.target.value)
                      }}
                    />
                  </label>
                </div>
                
                <div style={{ marginTop: '16px' }}>
                  <label className="field">
                    <span>ราคารวมเก็บหน้างาน</span>
                    <input
                      type="number"
                      value={collectedAmount}
                      placeholder="0"
                      onChange={(e) => setCollectedAmount(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              {/* NOTES */}
              <label className="field">
                <span>หมายเหตุ</span>
                <textarea
                  value={notes}
                  rows={2}
                  placeholder="เช่น ลูกค้ารับเองหน้าร้าน, ช่องทาง LINE"
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>

              {formError && <p className="form-error">{formError}</p>}

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  style={{ background: 'var(--text-gold)', color: '#000' }}
                >
                  บันทึกการเช่า
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
