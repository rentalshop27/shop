import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  Shirt,
  Trash2,
  ChevronDown,
  X
} from 'lucide-react'
import type { RentalOrder, RentalStatus } from './rentalTypes'
import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import { findOpenRentalConflict } from './rentalRules'
import { canCreateRentalForCustomer } from '../customers/customerRules'

interface RentalsPageProps {
  rentals: RentalOrder[]
  customers: Customer[]
  stockItems: FlatStockItem[]
  onCreateRentals: (drafts: Omit<RentalOrder, 'id' | 'orderCode' | 'createdAt' | 'updatedAt'>[]) => boolean | Promise<boolean>
  onUpdateRentalStatus: (rentalId: string | string[], status: RentalStatus) => void
  onDeleteRental?: (rentalId: string | string[]) => void

  // Optional external controls
  externalSelectedRentalId?: string
  onSelectRental?: (id: string) => void
  externalIsFormOpen?: boolean
  onFormOpenChange?: (open: boolean) => void
  externalPickupDate?: string
  externalReturnDate?: string
  onClearExternalDates?: () => void
}

const getTodayString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function RentalsPage({
  rentals,
  customers,
  stockItems,
  onCreateRentals,
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

  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false)

  // Auto-open detail panel on mobile if an external selected rental is provided
  useEffect(() => {
    if (externalSelectedRentalId) {
      setIsMobileDetailOpen(true)
    }
  }, [externalSelectedRentalId])
  
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
  const [selectedCostumes, setSelectedCostumes] = useState<FlatStockItem[]>([])
  const [showCostumeDropdown, setShowCostumeDropdown] = useState(false)

  const [pickupDate, setPickupDate] = useState(getTodayString())
  const [returnDate, setReturnDate] = useState('')
  const [rentalPrice, setRentalPrice] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [discountAmount, setDiscountAmount] = useState('0')
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

  // Refs for click outside handling
  const customerContainerRef = useRef<HTMLDivElement>(null)
  const costumeContainerRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerContainerRef.current && !customerContainerRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false)
      }
      if (costumeContainerRef.current && !costumeContainerRef.current.contains(event.target as Node)) {
        setShowCostumeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
    const activeCustomers = customers.filter((c) => !c.archivedAt)
    const isSelectedMatch = selectedCustomer && query === `${selectedCustomer.fullName} (${selectedCustomer.customerCode})`.toLowerCase()
    
    if (!query || isSelectedMatch) {
      return activeCustomers
    }
    
    return activeCustomers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(query) ||
        c.customerCode.toLowerCase().includes(query) ||
        c.phone.includes(query)
    )
  }, [customers, customerSearch, selectedCustomer])

  const filteredCostumesSuggestions = useMemo(() => {
    const query = costumeSearch.trim().toLowerCase()
    
    const availableCostumes = stockItems.filter(
      (item) =>
        !selectedCostumes.some((selected) => selected.id === item.id) &&
        !findOpenRentalConflict(rentals, [item.sku], pickupDate, returnDate)
    )

    if (!query) {
      return availableCostumes
    }
    
    return availableCostumes.filter(
      (item) =>
        item.productName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
    )
  }, [stockItems, rentals, costumeSearch, selectedCostumes, pickupDate, returnDate])

  // Sync pricing when costumes are selected
  useEffect(() => {
    if (selectedCostumes.length > 0) {
      const totalRentalPrice = selectedCostumes.reduce((sum, item) => sum + item.rentalPricePerDay, 0)
      const totalDeposit = selectedCostumes.reduce((sum, item) => sum + item.depositAmount, 0)
      setRentalPrice(totalRentalPrice.toString())
      setDepositAmount(totalDeposit.toString())
      setDiscountAmount('0')
      setCollectedAmount((totalRentalPrice + totalDeposit).toString())
    } else {
      setRentalPrice('')
      setDepositAmount('')
      setDiscountAmount('0')
      setCollectedAmount('')
    }
  }, [selectedCostumes])

  const parseMoneyInput = (value: string) => {
    return parseFloat(value) || 0
  }

  const syncCollectedAmount = (priceVal: string, depVal: string, discountVal: string) => {
    const p = parseFloat(priceVal) || 0
    const d = parseFloat(depVal) || 0
    const discount = parseMoneyInput(discountVal)
    setCollectedAmount(Math.max(0, p + d - discount).toString())
  }

  const syncDiscountAmount = (priceVal: string, depVal: string, collectedVal: string) => {
    const p = parseMoneyInput(priceVal)
    const d = parseMoneyInput(depVal)
    const collected = parseMoneyInput(collectedVal)
    setDiscountAmount(Math.max(0, p + d - collected).toString())
  }

  const splitAmountByWeights = (total: number, weights: number[]) => {
    if (weights.length === 0) return []

    const safeTotal = Number.isFinite(total) ? total : 0
    const positiveWeightTotal = weights.reduce((sum, weight) => sum + Math.max(weight, 0), 0)
    let assignedTotal = 0

    return weights.map((weight, index) => {
      if (index === weights.length - 1) {
        return Number((safeTotal - assignedTotal).toFixed(2))
      }

      const share = positiveWeightTotal > 0
        ? (Math.max(weight, 0) / positiveWeightTotal) * safeTotal
        : safeTotal / weights.length
      const roundedShare = Number(share.toFixed(2))
      assignedTotal += roundedShare
      return roundedShare
    })
  }

  const getOrderGroupCode = (orderCode: string) => {
    if (/^PR-ORD-\d{6}-\d{3}-\d+$/.test(orderCode)) {
      return orderCode.replace(/-\d+$/, '')
    }
    if (/^PR-ORD-\d{6}-\d{3}$/.test(orderCode)) {
      return orderCode
    }
    if (/^PR-ORD-\d+-\d+$/.test(orderCode)) {
      return orderCode.replace(/-\d+$/, '')
    }
    return orderCode
  }

  // Helper to get status of grouped rentals based on priority: overdue > active > booked > returned
  const getGroupStatus = (groupItems: RentalOrder[]): RentalStatus => {
    if (groupItems.some((r) => r.status === 'overdue')) return 'overdue'
    if (groupItems.some((r) => r.status === 'active')) return 'active'
    if (groupItems.some((r) => r.status === 'booked')) return 'booked'
    return 'returned'
  }

  const getTransitionableRentalIds = (groupItems: RentalOrder[], fromStatuses: RentalStatus[]) => {
    return groupItems
      .filter((rental) => fromStatuses.includes(rental.status))
      .map((rental) => rental.id)
  }

  const updateRentalStatuses = (
    groupItems: RentalOrder[],
    fromStatuses: RentalStatus[],
    nextStatus: RentalStatus
  ) => {
    const ids = getTransitionableRentalIds(groupItems, fromStatuses)
    if (ids.length === 0) return
    onUpdateRentalStatus(ids, nextStatus)
  }

  // Group line-item order codes such as PR-ORD-101-1 back into one displayed order.
  const groupedRentals = useMemo(() => {
    const groups: Record<string, RentalOrder[]> = {}
    rentals.forEach((r) => {
      const groupCode = getOrderGroupCode(r.orderCode)
      if (!groups[groupCode]) {
        groups[groupCode] = []
      }
      groups[groupCode].push(r)
    })

    return Object.keys(groups).map((orderCode) => {
      const groupItems = groups[orderCode]
      const first = groupItems[0]
      const totalPrice = groupItems.reduce((sum, r) => sum + r.rentalPrice, 0)
      const totalDeposit = groupItems.reduce((sum, r) => sum + r.depositAmount, 0)
      const totalCollected = groupItems.reduce((sum, r) => sum + r.collectedAmount, 0)
      const groupStatus = getGroupStatus(groupItems)
      const notes = groupItems.map((r) => r.notes).filter(Boolean).join('\n')
      const pickupDate = groupItems.reduce(
        (earliest, rental) => (rental.pickupDate < earliest ? rental.pickupDate : earliest),
        first.pickupDate
      )
      const returnDate = groupItems.reduce(
        (latest, rental) => (rental.returnDate > latest ? rental.returnDate : latest),
        first.returnDate
      )
      const createdAt = groupItems.reduce(
        (earliest, rental) => (rental.createdAt < earliest ? rental.createdAt : earliest),
        first.createdAt
      )
      const updatedAt = groupItems.reduce(
        (latest, rental) => (rental.updatedAt > latest ? rental.updatedAt : latest),
        first.updatedAt
      )

      return {
        id: first.id, // For backward compatibility
        orderCode,
        customer: first.customer,
        pickupDate,
        returnDate,
        rentalPrice: totalPrice, // Sum for compatibility with list display
        depositAmount: totalDeposit, // Sum for compatibility with list display
        collectedAmount: totalCollected, // Sum for compatibility with list display
        status: groupStatus,
        notes,
        createdAt,
        updatedAt,
        rentals: groupItems
      }
    })
  }, [rentals])

  // Filter grouped rentals list
  const filteredGroupedRentals = useMemo(() => {
    const query = orderQuery.trim().toLowerCase()
    return groupedRentals.filter((group) => {
      const matchesStatus = statusFilter === 'all' || group.status === statusFilter
      
      const costumeSearchable = group.rentals.map((r) => `${r.costume.productName} ${r.costume.sku}`).join(' ')
      const searchable = [
        group.orderCode,
        group.customer.fullName,
        group.customer.customerCode,
        costumeSearchable
      ]
        .join(' ')
        .toLowerCase()
      
      return matchesStatus && (!query || searchable.includes(query))
    })
  }, [groupedRentals, orderQuery, statusFilter])

  // Paginated rentals
  const paginatedRentals = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredGroupedRentals.slice(startIndex, startIndex + pageSize)
  }, [filteredGroupedRentals, currentPage, pageSize])

  const totalPages = Math.ceil(filteredGroupedRentals.length / pageSize) || 1

  // Set default selected rental group (represented as selectedRental for compatibility)
  const selectedRental = useMemo(() => {
    let group = groupedRentals.find((g) => g.orderCode === selectedRentalId)
    if (!group) {
      group = groupedRentals.find((g) => g.rentals.some((r) => r.id === selectedRentalId))
    }
    return group ?? filteredGroupedRentals[0] ?? groupedRentals[0]
  }, [groupedRentals, selectedRentalId, filteredGroupedRentals])

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!selectedCustomer) {
      setFormError('กรุณาเลือกผู้เช่า')
      return
    }
    const customerRentalGuard = canCreateRentalForCustomer(selectedCustomer)
    if (!customerRentalGuard.allowed) {
      setFormError(customerRentalGuard.message || 'ไม่สามารถสร้างรายการเช่าสำหรับลูกค้ารายนี้ได้')
      return
    }
    if (selectedCostumes.length === 0) {
      setFormError('กรุณาเลือกแบบชุดอย่างน้อย 1 ชุด')
      return
    }
    if (!pickupDate) {
      setFormError('กรุณาระบุวันที่รับชุด')
      return
    }
    if (!returnDate) {
      setFormError('กรุณาระบุวันที่คืน')
      return
    }
    if (new Date(returnDate) < new Date(pickupDate)) {
      setFormError('วันที่คืนต้องอยู่หลังวันที่รับชุด')
      return
    }
    const openRentalConflict = findOpenRentalConflict(
      rentals,
      selectedCostumes.map((item) => item.sku),
      pickupDate,
      returnDate,
    )
    if (openRentalConflict) {
      setFormError(`ชุด ${openRentalConflict.costume.sku} มีคิวจองหรืออยู่ระหว่างเช่าในช่วงวันที่ระบุแล้ว (${openRentalConflict.orderCode}) ไม่สามารถเช่าซ้ำได้`)
      return
    }

    // Warning for repair or wash status items
    const repairOrWashCostumes = selectedCostumes.filter(
      (item) => item.status === 'repair' || item.status === 'wash'
    )
    if (repairOrWashCostumes.length > 0) {
      const itemsWarningList = repairOrWashCostumes
        .map((item) => `ชุด ${item.sku} มีสถานะเป็น "${item.status === 'repair' ? 'ซ่อม' : 'ซัก'}"`)
        .join('\n')
      const confirmed = window.confirm(
        `${itemsWarningList}\nคุณยืนยันที่จะบันทึกใบเช่าสำหรับชุดดังกล่าวต่อไปหรือไม่?`
      )
      if (!confirmed) {
        return
      }
    }

    const price = parseFloat(rentalPrice) || 0
    const deposit = parseFloat(depositAmount) || 0
    const collected = parseFloat(collectedAmount)
    const collectedTotal = Number.isFinite(collected) ? collected : price + deposit

    const priceShares = splitAmountByWeights(price, selectedCostumes.map((item) => item.rentalPricePerDay))
    const depositShares = splitAmountByWeights(deposit, selectedCostumes.map((item) => item.depositAmount))
    const collectedShares = splitAmountByWeights(
      collectedTotal,
      selectedCostumes.map((item) => item.rentalPricePerDay + item.depositAmount)
    )

    const drafts = selectedCostumes.map((item, index) => {
      return {
        customer: selectedCustomer,
        costume: item,
        pickupDate,
        returnDate,
        rentalPrice: priceShares[index],
        depositAmount: depositShares[index],
        collectedAmount: collectedShares[index],
        status: 'booked' as RentalStatus,
        notes
      }
    })

    const saved = await onCreateRentals(drafts)
    if (!saved) {
      return
    }

    // Reset Form
    setSelectedCustomer(null)
    setCustomerSearch('')
    setSelectedCostumes([])
    setCostumeSearch('')
    setPickupDate(getTodayString())
    setReturnDate('')
    setDiscountAmount('0')
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

  const getDiscountAmount = (price: number, deposit: number, collected: number) => {
    return Math.max(0, Number((price + deposit - collected).toFixed(2)))
  }

  // Get status translation
  const getStatusBadge = (status: RentalStatus) => {
    switch (status) {
      case 'booked':
        return <span className="status-pill warning">รอส่งมอบ</span>
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

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Precious Shop</p>
          <h1>หน้าเช่าชุด</h1>
          <p className="subtitle">บันทึกข้อมูลการเช่าชุด จัดทำประวัติการเช่า ติดตามช่วงรับ/ส่งชุดและส่งคืน</p>
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
              onChange={(e) => { setStatusFilter(e.target.value as 'all' | RentalStatus); setCurrentPage(1); }}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="booked">รอส่งมอบ</option>
              <option value="active">ใช้งานอยู่ (กำลังใช้งาน)</option>
              <option value="returned">คืนแล้ว</option>
              <option value="overdue">เกินกำหนดคืน</option>
            </select>
          </div>

          <div className="customer-table" role="table" aria-label="รายการออเดอร์เช่าชุด">
            <div className="table-row table-head rental-table-row" role="row">
              <span>รหัสออเดอร์</span>
              <span>ลูกค้า</span>
              <span>ช่วงเช่า</span>
              <span>ยอดเก็บจริง</span>
              <span>สถานะ</span>
              <span></span>
            </div>

            {paginatedRentals.map((rental) => (
              <button
                className={`table-row table-button rental-table-row ${rental.orderCode === selectedRental?.orderCode ? 'selected' : ''}`}
                key={rental.orderCode}
                role="row"
                type="button"
                onClick={() => {
                  setSelectedRentalId(rental.orderCode)
                  setIsMobileDetailOpen(true)
                }}
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
                  {formatBaht(rental.collectedAmount)}
                  {getDiscountAmount(rental.rentalPrice, rental.depositAmount, rental.collectedAmount) > 0 ? (
                    <small style={{ display: 'block', color: 'var(--success-color)', fontSize: '11px' }}>
                      ลด: {formatBaht(getDiscountAmount(rental.rentalPrice, rental.depositAmount, rental.collectedAmount))}
                    </small>
                  ) : (
                    <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>
                      มัดจำ: {formatBaht(rental.depositAmount)}
                    </small>
                  )}
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
          <div className={`customer-detail-wrapper ${isMobileDetailOpen ? 'mobile-open' : ''}`} onClick={() => setIsMobileDetailOpen(false)}>
            <div className="customer-detail-content" onClick={(e) => e.stopPropagation()}>
              <aside className="panel detail-panel" style={{ width: '100%' }}>
                <button className="close-detail-btn" type="button" onClick={() => setIsMobileDetailOpen(false)} aria-label="ปิด">
                  <X size={20} />
                </button>
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

                {/* Costume Detail Items */}
                <section className="detail-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '12px' }}>รายการออเดอร์และวงจรสินค้า</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedRental.rentals.map((r) => {
                      const costumeImageUrl = r.costume.imageUrls.find((url) => url.trim().length > 0)

                      return (
                        <div
                          key={r.id}
                          style={{
                            display: 'flex',
                            gap: '16px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '16px',
                            alignItems: 'center'
                          }}
                        >
                        {costumeImageUrl ? (
                          <img
                            src={costumeImageUrl}
                            alt={r.costume.productName}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                          />
                        ) : (
                          <div
                            aria-label="ยังไม่มีรูปสินค้า"
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              background: 'rgba(255, 255, 255, 0.02)',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              flexShrink: 0,
                              fontSize: '10px',
                              textAlign: 'center',
                              lineHeight: 1.2
                            }}
                          >
                            <Shirt size={16} />
                            <span>ไม่มีรูป</span>
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#fff' }}>
                            {r.costume.productName}
                          </h4>
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                            รหัส: {r.costume.sku} | <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#4169e1' }}></span>
                              {r.costume.primaryColor}
                            </span>
                          </p>
                          <div style={{ marginTop: '6px' }}>
                            {getStatusBadge(r.status)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '16px', color: 'var(--text-gold)', display: 'block' }}>
                            {formatBaht(r.collectedAmount)}
                          </strong>
                          {getDiscountAmount(r.rentalPrice, r.depositAmount, r.collectedAmount) > 0 && (
                            <small style={{ color: 'var(--success-color)', fontSize: '11px', display: 'block' }}>
                              ลด: {formatBaht(getDiscountAmount(r.rentalPrice, r.depositAmount, r.collectedAmount))}
                            </small>
                          )}
                          {r.depositAmount > 0 && (
                            <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                              ประกัน: {formatBaht(r.depositAmount)}
                            </small>
                          )}
                        </div>
                      </div>
                      )
                    })}
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
                        onClick={() => updateRentalStatuses(selectedRental.rentals, ['booked'], 'active')}
                        style={{ width: '100%', fontSize: '14px', background: 'var(--text-gold)', color: '#000' }}
                      >
                        ส่งมอบชุด (ขนส่ง)
                      </button>
                    )}
                    {(selectedRental.status === 'active' || selectedRental.status === 'overdue') && (
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => updateRentalStatuses(selectedRental.rentals, ['active', 'overdue'], 'returned')}
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

                    {selectedRental.status !== 'returned' && (
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => {
                          const currentStatus = selectedRental.status
                          if (currentStatus === 'returned') return
                          const nextTransitionMap: Record<Exclude<RentalStatus, 'returned'>, {
                            from: RentalStatus[]
                            to: RentalStatus
                          }> = {
                            booked: { from: ['booked'], to: 'active' },
                            active: { from: ['active'], to: 'overdue' },
                            overdue: { from: ['overdue'], to: 'returned' }
                          }
                          const transition = nextTransitionMap[currentStatus]
                          updateRentalStatuses(selectedRental.rentals, transition.from, transition.to)
                        }}
                        style={{ fontSize: '14px' }}
                      >
                        เปลี่ยนสถานะถัดไป
                      </button>
                    )}
                  </div>

                  {onDeleteRental && (
                    <button
                      className="archive-button"
                      type="button"
                      onClick={() => {
                        if (window.confirm(`ต้องการลบใบเช่า ${selectedRental.orderCode} ใช่หรือไม่?`)) {
                          onDeleteRental(selectedRental.rentals.map((r) => r.id))
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
            </div>
          </div>
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
              <div ref={customerContainerRef} style={{ position: 'relative' }}>
                <label className="field">
                  <span>ผู้เช่าชุด (พิมพ์ชื่อ หรือ รหัสลูกค้า)<b style={{ color: 'red' }}> *</b></span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      value={customerSearch}
                      placeholder="เช่น pun, PR-C001"
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setSelectedCustomer(null)
                        setShowCustomerDropdown(true)
                      }}
                      onFocus={(e) => {
                        e.target.select()
                        setShowCustomerDropdown(true)
                      }}
                      style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowCustomerDropdown(!showCustomerDropdown)
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ChevronDown
                        size={18}
                        style={{
                          transform: showCustomerDropdown ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s'
                        }}
                      />
                    </button>
                  </div>
                </label>

                {showCustomerDropdown && (
                  filteredCustomersSuggestions.length > 0 ? (
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
                  ) : (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', padding: '12px 16px', margin: '4px 0 0',
                      zIndex: 999, color: 'var(--text-muted)', fontSize: '13px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
                    }}>
                      ไม่พบข้อมูลผู้เช่า
                    </div>
                  )
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
              <div ref={costumeContainerRef} style={{ position: 'relative' }}>
                <label className="field">
                  <span>เลือกแบบชุด (พิมพ์ชื่อ หรือ SKU)<b style={{ color: 'red' }}> *</b></span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Shirt size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      value={costumeSearch}
                      placeholder="เช่น Midnight, PR-8130"
                      onChange={(e) => {
                        setCostumeSearch(e.target.value)
                        setShowCostumeDropdown(true)
                      }}
                      onFocus={(e) => {
                        e.target.select()
                        setShowCostumeDropdown(true)
                      }}
                      style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowCostumeDropdown(!showCostumeDropdown)
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ChevronDown
                        size={18}
                        style={{
                          transform: showCostumeDropdown ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s'
                        }}
                      />
                    </button>
                  </div>
                </label>

                {showCostumeDropdown && (
                  filteredCostumesSuggestions.length > 0 ? (
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
                              setSelectedCostumes([...selectedCostumes, item])
                              setCostumeSearch('')
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
                  ) : (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', padding: '12px 16px', margin: '4px 0 0',
                      zIndex: 999, color: 'var(--text-muted)', fontSize: '13px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
                    }}>
                      ไม่พบข้อมูลแบบชุด
                    </div>
                  )
                )}

                {selectedCostumes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-gold)', fontWeight: 600 }}>
                      ชุดที่เลือกไว้ ({selectedCostumes.length} ชุด):
                    </div>
                    {selectedCostumes.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '10px 12px',
                          background: 'rgba(223, 183, 80, 0.05)',
                          border: '1px solid rgba(223, 183, 80, 0.2)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong>{item.productName}</strong> ({item.sku})
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                            สี: {item.primaryColor} | ไซส์: {item.size} | ค่าเช่า: {formatBaht(item.rentalPricePerDay)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCostumes(selectedCostumes.filter((c) => c.id !== item.id))
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger-color)',
                            cursor: 'pointer',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title="ลบออก"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RENTAL PERIOD DATES */}
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label className="field">
                  <span>วันที่รับชุด<b style={{ color: 'red' }}> *</b></span>
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
                        syncCollectedAmount(e.target.value, depositAmount, discountAmount)
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
                        syncCollectedAmount(rentalPrice, e.target.value, discountAmount)
                      }}
                    />
                  </label>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label className="field">
                    <span>ส่วนลด</span>
                    <input
                      type="number"
                      value={discountAmount}
                      placeholder="0"
                      min="0"
                      onChange={(e) => {
                        setDiscountAmount(e.target.value)
                        syncCollectedAmount(rentalPrice, depositAmount, e.target.value)
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
                      onChange={(e) => {
                        setCollectedAmount(e.target.value)
                        syncDiscountAmount(rentalPrice, depositAmount, e.target.value)
                      }}
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
