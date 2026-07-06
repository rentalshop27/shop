import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  Shirt,
  Trash2,
  ChevronDown,
  X,
  Pencil,
  Printer
} from 'lucide-react'
import { sanitizeNumericInput } from '../../lib/numericInput'
import type { RentalOrder, RentalShippingUpdate, RentalStatus } from './rentalTypes'
import type { DepositResolutionDraft } from './depositResolution'
import { normalizeCurrencyAmount, toCents } from './depositResolution'
import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import {
  canDeleteRentalGroup,
  findOpenRentalConflictByStockItemIds,
  getAllowedRentalEditFields,
  resolveRentalPrice,
  calculateReturnDate,
} from './rentalRules'
import { getOverduePenaltySummary } from './overduePenalty'
import { canCreateRentalForCustomer } from '../customers/customerRules'
import { calculateCustomerInsights } from './customerInsights'

function tiersAreCompatible(costumes: FlatStockItem[]): boolean {
  if (costumes.length <= 1) return true
  const refDays = costumes[0].rentalTiers.map(t => t.days).sort().join(',')
  return costumes.every(c =>
    c.rentalTiers.map(t => t.days).sort().join(',') === refDays
  )
}

function findTierByDays(costume: FlatStockItem, days: number) {
  return costume.rentalTiers.find((tier) => tier.days === days)
}

interface RentalsPageProps {
  rentals: RentalOrder[]
  customers: Customer[]
  stockItems: FlatStockItem[]
  onCreateRentals: (drafts: Omit<RentalOrder, 'id' | 'orderCode' | 'createdAt' | 'updatedAt'>[]) => boolean | Promise<boolean>
  onUpdateRentalStatus: (rentalId: string | string[], status: RentalStatus, shippingInfo?: RentalShippingUpdate) => void
  onDeleteRental?: (rentalId: string | string[]) => void
  /** ยกเลิกออเดอร์ — ปล่อยคิวปฏิทินของชุดทันที */
  onCancelRental?: (rentalId: string | string[]) => void
  /** ปิดเคสเงินมัดจำของออเดอร์หลังคืนชุด */
  onResolveDeposit?: (rentalId: string | string[], resolution: DepositResolutionDraft) => void
  /** แก้ไข field ของออเดอร์ตาม status-aware rules */
  onEditRentalFields?: (rentalId: string, patch: Record<string, unknown>, skipConflictCheck?: boolean) => Promise<boolean | void>
  /** เพิ่มค่าปรับย้อนหลังกรณีชุดพัง */
  onSaveExtraFine?: (rentalIdOrIds: string | string[], amount: number, reason: string) => Promise<void>
  canManageMoney?: boolean

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

function formatBaht(amount: string | number) {
  const num = Number(amount)
  if (!num) return '-'
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)
}

function formatTierRange(tiers: { price: number }[]) {
  if (!tiers || tiers.length === 0) return '-'
  if (tiers.length === 1) return formatBaht(tiers[0].price)
  const prices = tiers.map(t => t.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return formatBaht(min)
  return `${formatBaht(min)} – ${formatBaht(max)}`
}

const thaiMonthShortNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function formatThaiShortDate(dateStr: string) {
  if (!dateStr) return '-'
  const [yearText, monthText, dayText] = dateStr.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  if (!year || !month || !day || !thaiMonthShortNames[month - 1]) {
    return dateStr
  }

  return `${day} ${thaiMonthShortNames[month - 1]} ${year + 543}`
}

export function RentalsPage({
  rentals,
  customers,
  stockItems,
  onCreateRentals,
  onUpdateRentalStatus,
  onDeleteRental,
  onCancelRental,
  onResolveDeposit,
  onEditRentalFields,
  onSaveExtraFine,
  canManageMoney = true,

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
  const [isDeliveryMethodModalOpen, setIsDeliveryMethodModalOpen] = useState(false)
  const [isForfeitDepositOpen, setIsForfeitDepositOpen] = useState(false)
  const [forfeitMode, setForfeitMode] = useState<'full' | 'partial'>('full')
  const [forfeitAmount, setForfeitAmount] = useState('')
  const [forfeitNote, setForfeitNote] = useState('')
  const [forfeitError, setForfeitError] = useState('')

  const [isExtraFineOpen, setIsExtraFineOpen] = useState(false)
  const [extraFineAmount, setExtraFineAmount] = useState('')
  const [extraFineReason, setExtraFineReason] = useState('')
  const [extraFineError, setExtraFineError] = useState('')

  // Auto-open detail panel on mobile if an external selected rental is provided
  useEffect(() => {
    if (externalSelectedRentalId) {
      setIsMobileDetailOpen(true)
    }
  }, [externalSelectedRentalId])

  // Search & Filter
  const [orderQuery, setOrderQuery] = useState('')
  type RentalListFilter = 'all' | RentalStatus | 'created_today' | 'returning_today' | 'overdue_return' | 'overdue_shipping'
  const [statusFilter, setStatusFilter] = useState<RentalListFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Edit modal state
  // editMode: 'full' = booked/overdue (แก้ได้ทุก field), 'limited' = active (แก้เฉพาะวันคืน/notes)
  const [editingRentalId, setEditingRentalId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<'full' | 'limited'>('full')
  const [editFormError, setEditFormError] = useState('')

  // Form states

  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  const [costumeSearch, setCostumeSearch] = useState('')
  const [selectedCostumes, setSelectedCostumes] = useState<FlatStockItem[]>([])
  const [showCostumeDropdown, setShowCostumeDropdown] = useState(false)

  const [selectedTierDays, setSelectedTierDays] = useState<number | 'custom' | null>(null)
  const [basePriceFromTier, setBasePriceFromTier] = useState<number>(0)

  const [pickupDate, setPickupDate] = useState(getTodayString())
  const [returnDate, setReturnDate] = useState('')
  const [rentalPrice, setRentalPrice] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [discountAmount, setDiscountAmount] = useState('0')
  const [shippingCost, setShippingCost] = useState('0')
  const [collectedAmount, setCollectedAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  const [localIsFormOpen, setLocalIsFormOpen] = useState(false)
  const moneyActionDisabledReason = 'เฉพาะผู้จัดการเท่านั้นที่มีสิทธิ์จัดการยอดเงิน'
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
        !findOpenRentalConflictByStockItemIds(rentals, [item.id], pickupDate, returnDate)
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
    if (selectedCostumes.length === 0) {
      setSelectedTierDays(null)
      setBasePriceFromTier(0)
      setRentalPrice('')
      setDepositAmount('')
      setDiscountAmount('0')
      setShippingCost('0')
      setCollectedAmount('')
      return
    }

    if (!tiersAreCompatible(selectedCostumes)) {
      setSelectedTierDays('custom')
    } else {
      if (typeof selectedTierDays === 'number') {
        const allCostumesHaveSelectedTier = selectedCostumes.every((costume) => findTierByDays(costume, selectedTierDays))
        if (!allCostumesHaveSelectedTier) {
          setSelectedTierDays(null)
        }
      }
    }

    const totalDeposit = selectedCostumes.reduce((sum, item) => sum + item.depositAmount, 0)
    setDepositAmount(totalDeposit.toString())
  }, [selectedCostumes, selectedTierDays])

  useEffect(() => {
    if (selectedCostumes.length === 0) return

    if (typeof selectedTierDays === 'number') {
      const tier = selectedCostumes[0]?.rentalTiers.find((candidate) => candidate.days === selectedTierDays)
      if (tier) {
        if (pickupDate) {
          setReturnDate(calculateReturnDate(pickupDate, tier.days))
        }

        let totalBasePrice = 0
        for (const costume of selectedCostumes) {
          totalBasePrice += findTierByDays(costume, selectedTierDays)?.price || 0
        }

        setBasePriceFromTier(totalBasePrice)
        setRentalPrice(totalBasePrice.toString())

        const totalDeposit = selectedCostumes.reduce((sum, item) => sum + item.depositAmount, 0)
        setDiscountAmount('0')
        setShippingCost('0')
        setCollectedAmount((totalBasePrice + totalDeposit).toString())
      }
    }
  }, [selectedTierDays, pickupDate, selectedCostumes])

  const parseMoneyInput = (value: string) => {
    return parseFloat(value) || 0
  }

  const syncCollectedAmount = (priceVal: string, depVal: string, discountVal: string, shipVal: string) => {
    const p = parseFloat(priceVal) || 0
    const d = parseFloat(depVal) || 0
    const discount = parseMoneyInput(discountVal)
    const ship = parseMoneyInput(shipVal)
    setCollectedAmount(Math.max(0, p + d + ship - discount).toString())
  }

  const syncDiscountAmount = (priceVal: string, depVal: string, collectedVal: string, shipVal: string) => {
    const p = parseMoneyInput(priceVal)
    const d = parseMoneyInput(depVal)
    const ship = parseMoneyInput(shipVal)
    const collected = parseMoneyInput(collectedVal)
    setDiscountAmount(Math.max(0, p + d + ship - collected).toString())
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
    if (/^PR-ORD-(?!\d{6}-\d{3}$)\d+-\d+$/.test(orderCode)) {
      return orderCode.replace(/-\d+$/, '')
    }
    return orderCode
  }

  // Helper to get status of grouped rentals based on priority: overdue > active > booked > returned
  const getGroupStatus = (groupItems: RentalOrder[]): RentalStatus => {
    if (groupItems.some((r) => r.status === 'overdue')) return 'overdue'
    if (groupItems.some((r) => r.status === 'active')) return 'active'
    if (groupItems.some((r) => r.status === 'booked')) return 'booked'
    if (groupItems.some((r) => r.status === 'returned')) return 'returned'
    if (groupItems.every((r) => r.status === 'cancelled')) return 'cancelled'
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
    nextStatus: RentalStatus,
    shippingInfo?: RentalShippingUpdate
  ) => {
    const ids = getTransitionableRentalIds(groupItems, fromStatuses)
    if (ids.length > 0) {
      onUpdateRentalStatus(ids, nextStatus, shippingInfo)
    }
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
      const totalShippingCost = groupItems.reduce((sum, r) => sum + (r.shippingCost ?? 0), 0)
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
        shippingCost: totalShippingCost,
        collectedAmount: totalCollected, // Sum for compatibility with list display
        status: groupStatus,
        notes,
        createdAt,
        updatedAt,
        rentals: groupItems
      }
    })
  }, [rentals])


  const todayStr = getTodayString()
  const stats = React.useMemo(() => {
    let todayTotal = 0
    let activeTotal = 0
    let returningToday = 0
    let overdueReturnTotal = 0
    let overdueShippingTotal = 0

    groupedRentals.forEach(group => {
      // Create at date check
      if (group.createdAt && group.createdAt.startsWith(todayStr)) {
        todayTotal++
      }
      if (group.status === 'active') activeTotal++
      if (group.status === 'overdue' || (group.status === 'active' && group.returnDate < todayStr)) {
        overdueReturnTotal++
      }
      if ((group.status === 'active' || group.status === 'overdue') && group.returnDate === todayStr) {
        returningToday++
      }
      if (group.status === 'booked' && group.pickupDate < todayStr) {
        overdueShippingTotal++
      }
    })

    return { todayTotal, activeTotal, returningToday, overdueReturnTotal, overdueShippingTotal }
  }, [groupedRentals, todayStr])

  // Filter grouped rentals list
  const filteredGroupedRentals = useMemo(() => {
    const query = orderQuery.trim().toLowerCase()
    return groupedRentals.filter((group) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'created_today' && Boolean(group.createdAt?.startsWith(todayStr))) ||
        (statusFilter === 'returning_today' && (group.status === 'active' || group.status === 'overdue') && group.returnDate === todayStr) ||
        (statusFilter === 'overdue_return' && (group.status === 'overdue' || (group.status === 'active' && group.returnDate < todayStr))) ||
        (statusFilter === 'overdue_shipping' && group.status === 'booked' && group.pickupDate < todayStr) ||
        group.status === statusFilter

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
  }, [groupedRentals, orderQuery, statusFilter, todayStr])

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

  const selectedCustomerInsights = useMemo(() => {
    if (!selectedRental) return null
    return calculateCustomerInsights(selectedRental.customer, rentals, todayStr)
  }, [selectedRental, rentals, todayStr])

  const selectedDepositRows = useMemo(() => {
    return selectedRental?.rentals ?? []
  }, [selectedRental])
  const selectedDepositTotal = useMemo(() => {
    return selectedDepositRows.reduce((sum, rental) => sum + rental.depositAmount, 0)
  }, [selectedDepositRows])
  const selectedDepositResolved = selectedDepositRows.length > 0 && selectedDepositRows.every(
    (rental) => rental.depositAmount === 0 || rental.depositStatus === 'returned' || rental.depositStatus === 'forfeited'
  )
  const selectedDepositForfeitedTotal = selectedDepositRows.reduce(
    (sum, rental) => sum + (rental.depositForfeitedAmount ?? 0),
    0
  )
  const selectedDepositWasForfeited = selectedDepositRows.some((rental) => rental.depositStatus === 'forfeited')

  const selectedShippingMethod = selectedRental?.rentals.find((rental) => rental.shippingMethod)?.shippingMethod
  const selectedOverdueSummary = useMemo(() => (
    selectedRental
      ? getOverduePenaltySummary(selectedRental.rentals, todayStr, selectedRental.returnDate)
      : null
  ), [selectedRental, todayStr])

  useEffect(() => {
    setIsForfeitDepositOpen(false)
    setForfeitMode('full')
    setForfeitAmount(selectedDepositTotal ? String(selectedDepositTotal) : '')
    setForfeitNote('')
    setForfeitError('')
  }, [selectedRental?.orderCode, selectedDepositTotal])

  useEffect(() => {
    setIsExtraFineOpen(false)
    setExtraFineAmount('')
    setExtraFineReason('')
    setExtraFineError('')
  }, [selectedRental?.orderCode])

  const closeDeliveryMethodModal = () => setIsDeliveryMethodModalOpen(false)

  const handleConfirmEmsDelivery = () => {
    if (!selectedRental) return
    const tracking = window.prompt('กรุณากรอกเลขพัสดุ (Tracking Number):')
    if (tracking && tracking.trim()) {
      updateRentalStatuses(selectedRental.rentals, ['booked'], 'active', {
        method: 'thailand_post',
        trackingNumber: tracking.trim()
      })
      closeDeliveryMethodModal()
    } else {
      window.alert('กรุณากรอกเลขพัสดุก่อนบันทึกการส่งไปรษณีย์ไทย')
    }
  }

  const handleRefundDeposit = () => {
    if (!selectedRental || !onResolveDeposit) return
    if (window.confirm('ยืนยันว่าคืนเงินมัดจำให้ลูกค้าแล้ว?')) {
      onResolveDeposit(selectedDepositRows.map((rental) => rental.id), { depositStatus: 'returned' })
    }
  }

  const openForfeitDeposit = () => {
    setForfeitMode('full')
    setForfeitAmount(selectedDepositTotal ? String(selectedDepositTotal) : '')
    setForfeitNote('')
    setForfeitError('')
    setIsForfeitDepositOpen(true)
  }

  const handleSubmitForfeitDeposit = () => {
    if (!selectedRental || !onResolveDeposit) return
    const rawAmount = Number(forfeitAmount)
    const amountCents = toCents(rawAmount)
    const amount = normalizeCurrencyAmount(rawAmount)
    const note = forfeitNote.trim()

    if (!Number.isFinite(rawAmount) || amountCents <= 0) {
      setForfeitError('กรุณากรอกจำนวนเงินที่ยึดมากกว่า 0')
      return
    }
    if (amount > selectedDepositTotal) {
      setForfeitError('จำนวนเงินที่ยึดต้องไม่เกินยอดมัดจำทั้งหมด')
      return
    }
    if (!note) {
      setForfeitError('กรุณาระบุเหตุผลการยึดมัดจำ')
      return
    }

    onResolveDeposit(selectedDepositRows.map((rental) => rental.id), {
      depositStatus: 'forfeited',
      forfeitedAmount: amount,
      note,
    })
    setIsForfeitDepositOpen(false)
  }

  const handleConfirmStorefrontPickup = () => {
    if (!selectedRental) return
    updateRentalStatuses(selectedRental.rentals, ['booked'], 'active', { method: 'store_pickup' })
    closeDeliveryMethodModal()
  }

  const handleConfirmMessengerDelivery = () => {
    if (!selectedRental) return
    updateRentalStatuses(selectedRental.rentals, ['booked'], 'active', { method: 'messenger' })
    closeDeliveryMethodModal()
  }

  // Handle Form Submission (create OR edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setEditFormError('')

    // ─────────────────────────────────────────────────────────────
    // EDIT MODE — ส่ง patch ตาม editMode rules แทนการสร้างใหม่
    // ─────────────────────────────────────────────────────────────
    if (editingRentalId && onEditRentalFields) {
      if (!returnDate) {
        setEditFormError('กรุณาระบุวันที่คืน')
        return
      }
      if (new Date(returnDate) < new Date(pickupDate)) {
        setEditFormError('วันที่คืนต้องอยู่หลังวันที่รับชุด')
        return
      }

      if (editMode === 'full') {
        // full edit: ส่งทุก field รวมถึงชุดและวันรับ
        if (selectedCostumes.length === 0) {
          setEditFormError('กรุณาเลือกแบบชุดอย่างน้อย 1 ชุด')
          return
        }
        const costume = selectedCostumes[0]
        const patch: Record<string, unknown> = {
          stock_item_id: costume.id,
          stock_item_sku: costume.sku,
          pickup_date: pickupDate,
          return_date: returnDate,
          rental_price: parseFloat(rentalPrice) || 0,
          deposit_amount: parseFloat(depositAmount) || 0,
          collected_amount: parseFloat(collectedAmount) || 0,
          shipping_cost: parseFloat(shippingCost) || 0,
          notes,
        }
        const saved = await onEditRentalFields(editingRentalId, patch, false)
        if (!saved) return
      } else {
        // limited edit (active): เฉพาะวันคืน, notes, returnTrackingNote
        const patch: Record<string, unknown> = {
          return_date: returnDate,
          notes,
        }
        // ตรวจ return_date conflict ก่อน
        const saved = await onEditRentalFields(editingRentalId, patch, false)
        if (!saved) return
      }

      resetRentalForm()
      setIsFormOpen(false)
      return
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE MODE — ตรรกะเดิม
    // ─────────────────────────────────────────────────────────────
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
    const openRentalConflict = findOpenRentalConflictByStockItemIds(
      rentals,
      selectedCostumes.map((item) => item.id),
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
    const ship = parseFloat(shippingCost) || 0
    const collected = parseFloat(collectedAmount)
    const collectedTotal = Number.isFinite(collected) ? collected : price + deposit + ship

    const pickup = new Date(`${pickupDate}T12:00:00`)
    const ret = new Date(`${returnDate}T12:00:00`)
    const diffTime = Math.abs(ret.getTime() - pickup.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const rentalDays = diffDays > 0 ? diffDays : 1

    const priceWeights = selectedCostumes.map((item) =>
      resolveRentalPrice(item.rentalTiers, rentalDays) ?? 1
    )
    const priceShares = splitAmountByWeights(price, priceWeights)

    const depositWeights = selectedCostumes.map((item) => item.depositAmount || 1)
    const depositShares = splitAmountByWeights(deposit, depositWeights)

    // Distribute shipping cost evenly or proportional to price? We can use price weights
    const shipShares = splitAmountByWeights(ship, priceWeights)

    const collectedWeights = selectedCostumes.map((item, i) => priceWeights[i] + (item.depositAmount || 0))
    const collectedShares = splitAmountByWeights(collectedTotal, collectedWeights)

    const drafts = selectedCostumes.map((item, index) => {
      return {
        customer: selectedCustomer,
        costume: item,
        pickupDate,
        returnDate,
        rentalPrice: priceShares[index],
        depositAmount: depositShares[index],
        shippingCost: shipShares[index],
        collectedAmount: collectedShares[index],
        status: 'booked' as RentalStatus,
        notes
      }
    })

    const saved = await onCreateRentals(drafts)
    if (!saved) {
      return
    }

    resetRentalForm()
    setIsFormOpen(false)
  }

  // Formatting currency helper
  const formatBaht = (value: number) => {
    return `฿${value.toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`
  }

  const getDiscountAmount = (price: number, deposit: number, shipping: number, collected: number) => {
    return Math.max(0, Number((price + deposit + shipping - collected).toFixed(2)))
  }

  // Get status translation
  const getStatusBadge = (status: RentalStatus, pickupDate?: string) => {
    if (status === 'booked' && pickupDate) {
      const todayStr = getTodayString()
      if (pickupDate < todayStr) {
        return <span className="status-pill danger" style={{ fontWeight: 'bold' }}>🚨 เลยกำหนดส่ง</span>
      }
    }

    switch (status) {
      case 'booked':
        return <span className="status-pill warning">รอส่งมอบ</span>
      case 'active':
        return <span className="status-pill success" style={{ background: 'rgba(218, 165, 32, 0.15)', color: '#ead483', border: '1px solid rgba(218, 165, 32, 0.3)' }}>ใช้งานอยู่</span>
      case 'returned':
        return <span className="status-pill success">คืนแล้ว</span>
      case 'overdue':
        return <span className="status-pill danger">เกินกำหนด</span>
      case 'cancelled':
        return <span className="status-pill muted" style={{ textDecoration: 'line-through', opacity: 0.6 }}>❌ ยกเลิกแล้ว</span>
      default:
        return <span className="status-pill muted">{status}</span>
    }
  }

  /** เปิด Edit Modal และ pre-fill form ด้วยข้อมูลออเดอร์ปัจจุบัน */
  const openEditModal = (rental: RentalOrder, mode: 'full' | 'limited') => {
    setEditingRentalId(rental.id)
    setEditMode(mode)
    setEditFormError('')
    // Pre-fill form with existing values
    setSelectedCustomer(rental.customer)
    setCustomerSearch(`${rental.customer.fullName} (${rental.customer.customerCode})`)
    const costumeItem = stockItems.find((s) => s.id === rental.costume.id) ?? null
    setSelectedCostumes(costumeItem ? [costumeItem] : [])
    setCostumeSearch('')
    setPickupDate(rental.pickupDate)
    setReturnDate(rental.returnDate)
    setRentalPrice(String(rental.rentalPrice))
    setDepositAmount(String(rental.depositAmount))
    setShippingCost(String(rental.shippingCost ?? 0))
    setCollectedAmount(String(rental.collectedAmount))
    setSelectedTierDays('custom')
    setBasePriceFromTier(0)
    const disc = Math.max(0, rental.rentalPrice + rental.depositAmount + (rental.shippingCost ?? 0) - rental.collectedAmount)
    setDiscountAmount(String(disc))
    setNotes(rental.notes ?? '')
    setIsFormOpen(true)
  }

  const resetRentalForm = () => {
    setEditingRentalId(null)
    setEditMode('full')
    setEditFormError('')
    setFormError('')
    setSelectedCustomer(null)
    setCustomerSearch('')
    setSelectedCostumes([])
    setCostumeSearch('')
    setSelectedTierDays(null)
    setBasePriceFromTier(0)
    setPickupDate(getTodayString())
    setReturnDate('')
    setRentalPrice('')
    setDepositAmount('')
    setShippingCost('0')
    setCollectedAmount('')
    setDiscountAmount('0')
    setNotes('')
  }

  const openCreateModal = () => {
    resetRentalForm()
    setIsFormOpen(true)
  }

  const activeRentalAllowedFields = getAllowedRentalEditFields('active')
  const isLimitedMoneyLocked = editMode === 'limited' && Boolean(activeRentalAllowedFields)

  const closeRentalForm = () => {
    resetRentalForm()
    setIsFormOpen(false)
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
        <button className="primary-button" type="button" onClick={openCreateModal}>
          <Plus size={22} />
          สร้างใบเช่าชุด
        </button>
      </header>

      {/* KPI DASHBOARD */}
      <div className="system-strip" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div
          className={`metric-card interactive total ${statusFilter === 'created_today' ? 'active-filter' : ''}`}
          onClick={() => { setStatusFilter('created_today'); setOrderQuery(''); setCurrentPage(1); }}
        >
          <div className="metric-icon-wrapper">
            <span style={{ fontSize: '20px' }}>📦</span>
          </div>
          <div className="card-content">
            <span>วันนี้</span>
            <strong>{stats.todayTotal}</strong>
          </div>
        </div>

        <div
          className={`metric-card interactive verified ${statusFilter === 'active' ? 'active-filter' : ''}`}
          onClick={() => { setStatusFilter('active'); setOrderQuery(''); setCurrentPage(1); }}
        >
          <div className="metric-icon-wrapper">
            <span style={{ fontSize: '20px' }}>🟢</span>
          </div>
          <div className="card-content">
            <span>กำลังเช่า</span>
            <strong>{stats.activeTotal}</strong>
          </div>
        </div>

        <div
          className={`metric-card interactive incomplete ${statusFilter === 'returning_today' ? 'active-filter' : ''}`}
          onClick={() => { setStatusFilter('returning_today'); setOrderQuery(''); setCurrentPage(1); }}
        >
          <div className="metric-icon-wrapper">
            <span style={{ fontSize: '20px' }}>🟠</span>
          </div>
          <div className="card-content">
            <span>คืนวันนี้</span>
            <strong>{stats.returningToday}</strong>
          </div>
        </div>

        <div
          className={`metric-card interactive risk ${statusFilter === 'overdue_return' ? 'active-filter' : ''}`}
          onClick={() => { setStatusFilter('overdue_return'); setOrderQuery(''); setCurrentPage(1); }}
        >
          <div className="metric-icon-wrapper">
            <span style={{ fontSize: '20px' }}>🔴</span>
          </div>
          <div className="card-content">
            <span>เลยกำหนดคืน</span>
            <strong>{stats.overdueReturnTotal}</strong>
          </div>
        </div>

        <div
          className={`metric-card interactive risk ${statusFilter === 'overdue_shipping' ? 'active-filter' : ''}`}
          onClick={() => { setStatusFilter('overdue_shipping'); setOrderQuery(''); setCurrentPage(1); }}
        >
          <div className="metric-icon-wrapper">
            <span style={{ fontSize: '20px' }}>🚨</span>
          </div>
          <div className="card-content">
            <span>เลยกำหนดส่ง</span>
            <strong>{stats.overdueShippingTotal}</strong>
          </div>
        </div>
      </div>

      {/* RENTALS WORKSPACE */}
      <section className="customer-grid">
        {/* Left Side: Orders Table and Filter Bar */}
        <div className="panel customer-list-panel">
          <div className="toolbar">
            <label className="search-box">
              <Search size={22} />
              <input
                value={orderQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setOrderQuery(val);
                  setCurrentPage(1);

                  const exactMatch = groupedRentals.find(g =>
                    g.orderCode.toLowerCase() === val.toLowerCase() ||
                    g.orderCode.toLowerCase().replace(/^pr-ord-/, '').replace(/^#/, '') === val.toLowerCase().replace(/^#/, '')
                  );
                  if (exactMatch && val.trim().length >= 3) {
                    setSelectedRentalId(exactMatch.orderCode);
                    setIsMobileDetailOpen(true);
                  }
                }}
                placeholder="ค้นหาด้วยรหัสออเดอร์ ชื่อลูกค้า หรือรหัสชุด..."
              />
            </label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as RentalListFilter); setOrderQuery(''); setCurrentPage(1); }}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="created_today">สร้างวันนี้</option>
              <option value="returning_today">คืนวันนี้</option>
              <option value="booked">รอส่งมอบ</option>
              <option value="active">ใช้งานอยู่ (กำลังใช้งาน)</option>
              <option value="returned">คืนแล้ว</option>
              <option value="overdue_return">เลยกำหนดคืน</option>
              <option value="overdue_shipping">เลยกำหนดส่ง</option>
              <option value="overdue">เกินกำหนดคืน</option>
              <option value="cancelled">ยกเลิกแล้ว</option>
            </select>
          </div>

          <div className="customer-table" style={{ background: 'transparent', border: 'none' }} role="table" aria-label="รายการออเดอร์เช่าชุด">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {paginatedRentals.map((rental) => {
              const mainCostume = rental.rentals[0]?.costume;
              const imageUrl = mainCostume?.imageUrls?.find((url) => url.trim().length > 0);
              const shortOrderId = rental.orderCode.replace(/^PR-ORD-/, '#');

              return (
              <button
                className={`panel table-button hybrid-table-row ${rental.orderCode === selectedRental?.orderCode ? 'selected' : ''}`}
                key={rental.orderCode}
                role="row"
                type="button"
                onClick={() => {
                  setSelectedRentalId(rental.orderCode)
                  setIsMobileDetailOpen(true)
                }}
                style={{ display: 'grid', textAlign: 'left' }}
              >
                {/* Thumbnail */}
                <div className="mini-card-thumbnail">
                  {imageUrl ? (
                    <img src={imageUrl} alt={mainCostume?.productName} />
                  ) : (
                    <div className="mini-card-placeholder"><Shirt size={16}/></div>
                  )}
                </div>
                {/* Details */}
                <div className="mini-card-content">
                  <div className="mini-card-top">
                    <strong className="order-id">{shortOrderId}</strong>
                    <span className="dress-name">{mainCostume?.productName}</span>
                  </div>
                  <div className="mini-card-mid">
                    <span className="customer-name">{rental.customer.fullName}</span>
                    <span className="rental-dates">{formatDateRange(rental.pickupDate, rental.returnDate)}</span>
                  </div>
                  <div className="mini-card-bottom">
                    {getStatusBadge(rental.status, rental.pickupDate)}
                    <strong className="total-amount">{formatBaht(rental.collectedAmount)}</strong>
                  </div>
                </div>
                <ChevronRight size={18} className="arrow-icon" />
              </button>
            )})}
            </div>
            {paginatedRentals.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px', marginTop: '8px' }}>
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
              <aside className="panel detail-panel rental-detail-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
                <button className="close-detail-btn" type="button" onClick={() => setIsMobileDetailOpen(false)} aria-label="ปิด" style={{ alignSelf: 'flex-end', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>

                {selectedOverdueSummary && (
                  <section className="overdue-alert-card" aria-label="Overdue Alert">
                    <div className="overdue-alert-header">
                      <strong>ออเดอร์เกินกำหนดคืน</strong>
                      <span>Overdue Alert</span>
                    </div>
                    <div className="overdue-alert-grid">
                      <div className="overdue-alert-item">
                        <span>เกินกำหนดมาแล้ว</span>
                        <strong>{selectedOverdueSummary.overdueDays} วัน</strong>
                        <small>กำหนดคืน {formatThaiShortDate(selectedOverdueSummary.dueDate)}</small>
                      </div>
                      <div className="overdue-alert-item">
                        <span>เกณฑ์ค่าปรับชุดนี้</span>
                        <strong>{formatBaht(selectedOverdueSummary.dailyRate)} / วัน</strong>
                      </div>
                      <div className="overdue-alert-item highlight">
                        <span>ยอดค่าปรับสะสมปัจจุบัน</span>
                        <strong>{formatBaht(selectedOverdueSummary.totalPenalty)}</strong>
                      </div>
                    </div>
                  </section>
                )}

                {/* Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusBadge(selectedRental.status, selectedRental.pickupDate)}
                    <strong style={{ color: 'var(--text-bright)', fontSize: '18px' }}>
                      {selectedRental.orderCode.replace(/^PR-ORD-/, '#')}
                    </strong>
	                  </div>
	                  <div style={{ display: 'flex', gap: '8px' }}>
	                    {/* Primary Actions based on status */}
	                    {selectedRental.status === 'booked' && (
	                      <button
	                        className="primary-button"
	                        type="button"
	                        onClick={() => setIsDeliveryMethodModalOpen(true)}
	                        style={{ background: '#00B14F', borderColor: '#00B14F', color: '#fff', padding: '6px 12px', minHeight: '32px', fontSize: '13px' }}
	                      >
	                        ส่งมอบชุด
	                      </button>
	                    )}
	                    {(selectedRental.status === 'active' || selectedRental.status === 'overdue') && (
	                      <button
	                        className="primary-button"
	                        type="button"
	                        onClick={() => updateRentalStatuses(selectedRental.rentals, ['active', 'overdue'], 'returned')}
                        style={{ background: '#007BFF', borderColor: '#007BFF', color: '#fff', padding: '6px 12px', minHeight: '32px', fontSize: '13px' }}
                      >
	                        คืนชุด
	                      </button>
	                    )}
	                    {(selectedRental.status === 'booked' || selectedRental.status === 'active' || selectedRental.status === 'overdue') && (
	                      <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px' }}></div>
	                    )}
	                    <button
                      type="button"
                      title="พิมพ์ใบแท็กชุด"
                      onClick={() => window.print()}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px'
                      }}
                    >
                      <Printer size={14} /> พิมพ์แท็ก
                    </button>
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

                {/* ข้อมูลลูกค้า (Customer Info) */}
                <section className="detail-section">
                  <h3 style={{ fontSize: '15px', color: '#fff', margin: '0 0 12px' }}>ข้อมูลลูกค้า</h3>
                  <div className="profile-card-top" style={{ padding: 0, background: 'transparent', border: 'none' }}>
                    <div className="profile-card-info" style={{ width: '100%' }}>
                      <div className="profile-avatar">
                        {selectedRental.customer.fullName.slice(0, 2).toLowerCase()}
                      </div>
                      <div className="profile-meta" style={{ flex: 1 }}>
                        <p>
                          <strong style={{ fontSize: '16px' }}>{selectedRental.customer.fullName}</strong>
                        </p>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>📞 {selectedRental.customer.phone}</span>
                          <span style={{ color: '#00B900', fontSize: '13px' }}>💬 {selectedRental.customer.lineAccount || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Insight */}
                  {selectedCustomerInsights && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginTop: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>เช่าทั้งหมด</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-bright)', fontWeight: 600 }}>{selectedCustomerInsights.rentalCount} ครั้ง</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>คืนครบแล้ว</div>
                      <div style={{ fontSize: '13px', color: 'var(--success-color)', fontWeight: 600 }}>{selectedCustomerInsights.completedRentalCount}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ค้างคืนตอนนี้</div>
                      <div style={{ fontSize: '13px', color: 'var(--warning-color)', fontWeight: 600 }}>{selectedCustomerInsights.activeOverdueCount}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ยึดมัดจำ</div>
                      <div style={{ fontSize: '13px', color: selectedCustomerInsights.depositForfeitedCount > 0 ? 'var(--warning-color)' : 'var(--success-color)', fontWeight: 600 }}>{selectedCustomerInsights.depositForfeitedCount}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ยอดสุทธิ</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-bright)', fontWeight: 600 }}>{formatBaht(selectedCustomerInsights.totalSpent)}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ระดับลูกค้า</div>
                      <div aria-label={`ระดับลูกค้า ${selectedCustomerInsights.starRating} จาก 5`} style={{ fontSize: '13px', color: 'var(--text-gold)', fontWeight: 600 }}>{selectedCustomerInsights.starDisplay}</div>
                    </div>
                  </div>
                  )}
                  {/* Deposit return controls */}
                  {selectedRental.status === 'returned' && onResolveDeposit && (
                    <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                        💰 จัดการเงินมัดจำ
                      </div>
                      {selectedDepositResolved ? (
                        <>
                          <div
                            role="status"
                            style={{
                              padding: '9px 10px',
                              borderRadius: '6px',
                              border: selectedRental.rentals.some(r => (r.fineAmount ?? 0) > 0) || selectedDepositWasForfeited ? '1px solid rgba(249, 115, 22, 0.55)' : '1px solid rgba(16, 185, 129, 0.45)',
                              background: selectedRental.rentals.some(r => (r.fineAmount ?? 0) > 0) || selectedDepositWasForfeited ? 'rgba(249, 115, 22, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                              color: selectedRental.rentals.some(r => (r.fineAmount ?? 0) > 0) || selectedDepositWasForfeited ? '#fb923c' : 'var(--success-color)',
                              fontSize: '12px',
                              fontWeight: 700,
                              textAlign: 'center'
                            }}
                          >
                            {selectedRental.rentals.some(r => (r.fineAmount ?? 0) > 0)
                              ? `🚫 ปิดงาน (มีค่าปรับ ฿${selectedRental.rentals.reduce((sum, r) => sum + (r.fineAmount ?? 0), 0)})`
                              : (selectedDepositWasForfeited
                                  ? `🚫 ยึดมัดจำ (${formatBaht(selectedDepositForfeitedTotal)})`
                                  : (selectedDepositTotal === 0 ? '✅ ปิดงานสำเร็จ (ไม่มีมัดจำ)' : '✅ คืนมัดจำแล้ว'))}
                          </div>
                          {onSaveExtraFine && (
                            <div style={{ marginTop: '8px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!canManageMoney) return
                                  const currentFine = selectedRental.rentals.reduce((sum, r) => sum + (r.fineAmount ?? 0), 0)
                                  const currentReason = selectedRental.rentals.find(r => (r.fineAmount ?? 0) > 0)?.fineReason ?? ''
                                  setExtraFineAmount(currentFine > 0 ? String(currentFine) : '')
                                  setExtraFineReason(currentReason)
                                  setIsExtraFineOpen(!isExtraFineOpen)
                                }}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid rgba(249, 115, 22, 0.3)',
                                  color: '#fb923c',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  cursor: canManageMoney ? 'pointer' : 'not-allowed',
                                  opacity: canManageMoney ? 1 : 0.45,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                aria-disabled={!canManageMoney}
                                title={!canManageMoney ? moneyActionDisabledReason : undefined}
                              >
                                ⚠️ เปิดเคสเรียกเก็บค่าปรับเพิ่มย้อนหลัง
                              </button>
                            </div>
                          )}
                          {canManageMoney && isExtraFineOpen && (
                            <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(249, 115, 22, 0.35)', background: 'rgba(249, 115, 22, 0.06)' }}>
                              {(() => {
                                const returnDateObj = new Date(selectedRental.returnDate);
                                const todayObj = new Date(getTodayString());
                                const diffTime = todayObj.getTime() - returnDateObj.getTime();
                                const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const mainCostume = selectedRental.rentals[0]?.costume;
                                const lateFeeRule = parseFloat(mainCostume?.lateFeeRule || '0') || 0;
                                const suggestedFine = Math.max(0, overdueDays) * lateFeeRule;

                                return (
                                  <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.15)', border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                      ชุด: {mainCostume?.productName || mainCostume?.sku || '-'} (เกณฑ์ปรับเลท: ฿{lateFeeRule} / วัน)
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                      สถานะ: {overdueDays > 0 ? `เกินกำหนดมาแล้ว ${overdueDays} วัน` : 'ยังไม่เกินกำหนด หรือ คืนตรงเวลา'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#fb923c', marginTop: '6px', fontWeight: 600 }}>
                                      💡 ยอดคำนวณตามเกณฑ์แนะนำ: ฿{suggestedFine}
                                    </div>
                                  </div>
                                );
                              })()}
                              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                จำนวนเงินค่าปรับ (฿)
                              </label>
                              <input
                                aria-label="จำนวนเงินค่าปรับ (฿)"
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                value={extraFineAmount}
                                onChange={(e) => setExtraFineAmount(sanitizeNumericInput(e.target.value))}
                                style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: '#fff' }}
                              />
                              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                หมายเหตุ/เหตุผล
                              </label>
                              <textarea
                                aria-label="หมายเหตุ/เหตุผล"
                                value={extraFineReason}
                                onChange={(e) => setExtraFineReason(e.target.value)}
                                rows={2}
                                placeholder="เช่น ซิปแตก, คราบไวน์ซักไม่ออก"
                                style={{ width: '100%', resize: 'vertical', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: '#fff' }}
                              />
                              {extraFineError && <div role="alert" style={{ color: '#fca5a5', fontSize: '11px', marginBottom: '8px' }}>{extraFineError}</div>}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const amount = parseFloat(extraFineAmount) || 0
                                    if (amount <= 0 && extraFineReason.trim() === '') {
                                      setExtraFineError('กรุณากรอกยอดเงินหรือเหตุผล')
                                      return
                                    }
                                    try {
                                      await onSaveExtraFine!(selectedRental.rentals.map((rental) => rental.id), amount, extraFineReason)
                                      setIsExtraFineOpen(false)
                                      setExtraFineError('')
                                    } catch {
                                      setExtraFineError('เกิดข้อผิดพลาดในการบันทึกค่าปรับ')
                                    }
                                  }}
                                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.5)', background: 'rgba(249, 115, 22, 0.18)', color: '#fb923c', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                                >
                                  บันทึกค่าปรับ
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!canManageMoney) return
                                handleRefundDeposit()
                              }}
                              style={{
                                padding: '8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.4)',
                                background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success-color)',
                                cursor: canManageMoney ? 'pointer' : 'not-allowed',
                                opacity: canManageMoney ? 1 : 0.45,
                                fontSize: '12px', fontWeight: 600
                              }}
                              aria-disabled={!canManageMoney}
                              title={!canManageMoney ? moneyActionDisabledReason : undefined}
                            >
                              💸 คืนมัดจำแล้ว
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!canManageMoney) return
                                openForfeitDeposit()
                              }}
                              style={{
                                padding: '8px', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.4)',
                                background: 'rgba(249, 115, 22, 0.08)', color: '#f97316',
                                cursor: canManageMoney ? 'pointer' : 'not-allowed',
                                opacity: canManageMoney ? 1 : 0.45,
                                fontSize: '12px', fontWeight: 600
                              }}
                              aria-disabled={!canManageMoney}
                              title={!canManageMoney ? moneyActionDisabledReason : undefined}
                            >
                              ⚠️ ยึดมัดจำ
                            </button>
                          </div>
                          {canManageMoney && isForfeitDepositOpen && (
                            <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(249, 115, 22, 0.35)', background: 'rgba(249, 115, 22, 0.06)' }}>
                              <div style={{ fontSize: '12px', color: 'var(--text-bright)', fontWeight: 700, marginBottom: '8px' }}>
                                ต้องการยึดมัดจำเต็มจำนวน หรือยึดบางส่วน?
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForfeitMode('full')
                                    setForfeitAmount(String(selectedDepositTotal))
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '7px',
                                    borderRadius: '6px',
                                    border: forfeitMode === 'full' ? '1px solid #fb923c' : '1px solid var(--border-color)',
                                    background: forfeitMode === 'full' ? 'rgba(249, 115, 22, 0.18)' : 'rgba(255,255,255,0.03)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  เต็มจำนวน
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setForfeitMode('partial')}
                                  style={{
                                    flex: 1,
                                    padding: '7px',
                                    borderRadius: '6px',
                                    border: forfeitMode === 'partial' ? '1px solid #fb923c' : '1px solid var(--border-color)',
                                    background: forfeitMode === 'partial' ? 'rgba(249, 115, 22, 0.18)' : 'rgba(255,255,255,0.03)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  บางส่วน
                                </button>
                              </div>
                              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                จำนวนเงินที่ยึด/ปรับ
                              </label>
                              <input
                                aria-label="จำนวนเงินที่ยึด/ปรับ"
                                type="number"
                                min="0"
                                max={selectedDepositTotal}
                                step="0.01"
                                value={forfeitAmount}
                                onChange={(event) => {
                                  setForfeitMode('partial')
                                  setForfeitAmount(event.target.value)
                                }}
                                style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: '#fff' }}
                              />
                              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                หมายเหตุเหตุผลการยึด
                              </label>
                              <textarea
                                aria-label="หมายเหตุเหตุผลการยึด"
                                value={forfeitNote}
                                onChange={(event) => setForfeitNote(event.target.value)}
                                rows={2}
                                placeholder="เช่น ชุดขาด, คราบไวนิล"
                                style={{ width: '100%', resize: 'vertical', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: '#fff' }}
                              />
                              {forfeitError && <div role="alert" style={{ color: '#fca5a5', fontSize: '11px', marginBottom: '8px' }}>{forfeitError}</div>}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={handleSubmitForfeitDeposit}
                                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.5)', background: 'rgba(249, 115, 22, 0.18)', color: '#fb923c', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                                >
                                  บันทึกยึดมัดจำ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsForfeitDepositOpen(false)}
                                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </section>

                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

                {/* ข้อมูลการเช่า (Rental Info) & Payment */}
                <section className="detail-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '15px', color: '#fff', margin: 0 }}>ข้อมูลการเช่า</h3>
                    {selectedRental.collectedAmount > 0 && selectedRental.collectedAmount >= (selectedRental.rentalPrice + selectedRental.depositAmount + (selectedRental.shippingCost ?? 0) - (getDiscountAmount(selectedRental.rentalPrice, selectedRental.depositAmount, selectedRental.shippingCost ?? 0, selectedRental.collectedAmount) || 0)) && (
                      <div className="payment-badge-green">💰 ชำระครบแล้ว 100%</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>วันที่รับชุด</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-bright)', fontWeight: 600 }}>{selectedRental.pickupDate}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>วันที่คืนชุด</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-bright)', fontWeight: 600 }}>{selectedRental.returnDate}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <span>ค่าเช่าสุทธิ</span>
                      <span>{formatBaht(selectedRental.rentalPrice)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <span>มัดจำประกันชุด</span>
                      <span>{formatBaht(selectedRental.depositAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <span>ค่าจัดส่ง</span>
                      <span>{formatBaht(selectedRental.shippingCost ?? 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-gold)', fontWeight: 700, marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed var(--border-color)' }}>
                      <span>ยอดเก็บสุทธิ</span>
                      <span>{formatBaht(selectedRental.collectedAmount)}</span>
                    </div>
                  </div>
                </section>

                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

                {/* Timeline */}
                <section className="detail-section">
                  <h3 style={{ fontSize: '15px', color: '#fff', margin: '0 0 12px' }}>Timeline ออเดอร์</h3>
                  <div className="vertical-timeline">
                    <div className={`timeline-item active`}>
                      <div className="timeline-icon">●</div>
                      <div className="timeline-content">
                        <div className="timeline-title">สร้างออเดอร์ & ชำระมัดจำ</div>
                        <div className="timeline-date">{selectedRental.createdAt.split('T')[0]}</div>
                      </div>
                    </div>
                    <div className={`timeline-item ${selectedRental.status === 'active' || selectedRental.status === 'returned' || selectedRental.status === 'overdue' ? 'active' : ''}`}>
                      <div className="timeline-icon">{selectedRental.status === 'active' || selectedRental.status === 'returned' || selectedRental.status === 'overdue' ? '●' : '○'}</div>
                      <div className="timeline-content">
                        <div className="timeline-title">รับชุด</div>
                        <div className="timeline-date">{selectedRental.pickupDate}</div>
                      </div>
                    </div>
                    <div className={`timeline-item ${selectedRental.status === 'returned' ? 'active' : ''}`}>
                      <div className="timeline-icon">{selectedRental.status === 'returned' ? '●' : '○'}</div>
                      <div className="timeline-content">
                        <div className="timeline-title">คืนชุด (ตรวจสภาพ)</div>
                        <div className="timeline-date">{selectedRental.returnDate}</div>
                      </div>
                    </div>
                    <div className={`timeline-item ${selectedRental.status === 'returned' && selectedRental.rentals.every(r => r.depositAmount === 0 || r.depositStatus === 'returned' || r.depositStatus === 'forfeited') ? 'active' : ''}`}>
                      <div className="timeline-icon">{selectedRental.status === 'returned' && selectedRental.rentals.every(r => r.depositAmount === 0 || r.depositStatus === 'returned' || r.depositStatus === 'forfeited') ? '●' : '○'}</div>
                      <div className="timeline-content">
                        <div className="timeline-title">
                          {selectedRental.rentals.reduce((sum, r) => sum + r.depositAmount, 0) === 0
                            ? 'ปิดงานสำเร็จ (ไม่มีมัดจำ)'
                            : 'ซัก & ปิดงาน (เคลียร์มัดจำ)'}
                        </div>
                        <div className="timeline-date">
                          {selectedRental.status === 'returned' && selectedRental.rentals.every(r => r.depositAmount === 0 || r.depositStatus === 'returned' || r.depositStatus === 'forfeited')
                            ? (selectedRental.rentals[0]?.depositResolvedAt ? selectedRental.rentals[0].depositResolvedAt.split('T')[0] : getTodayString())
                            : '-'}
                        </div>
                        {selectedRental.rentals.some(r => (r.fineAmount ?? 0) > 0) && (
                          <div style={{ fontSize: '11px', color: '#fb923c', marginTop: '4px' }}>
                            (⚠️ มีค่าปรับเพิ่มเติม ฿{selectedRental.rentals.reduce((sum, r) => sum + (r.fineAmount ?? 0), 0)} - {selectedRental.rentals.find(r => (r.fineAmount ?? 0) > 0)?.fineReason})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

                {/* ชุดที่เช่า (Rented Dress) */}
                <section className="detail-section">
                  <h3 style={{ fontSize: '15px', color: '#fff', margin: '0 0 12px' }}>ชุดที่เช่า</h3>
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
                            padding: '12px',
                            alignItems: 'center'
                          }}
                        >
                          {costumeImageUrl ? (
                            <img
                              src={costumeImageUrl}
                              alt={r.costume.productName}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'rgba(255, 255, 255, 0.02)',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Shirt size={16} />
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#fff' }}>
                              {r.costume.productName}
                            </h4>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                              {r.costume.sku} | ไซส์: {r.costume.size} | สี: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: r.costume.primaryColor }}></span>{r.costume.primaryColor}</span>
                            </p>
                          </div>
                          {onEditRentalFields && (r.status === 'booked' || r.status === 'overdue' || r.status === 'active') && (
                            <button
                              type="button"
                              onClick={() => openEditModal(r, r.status === 'active' ? 'limited' : 'full')}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                fontSize: '12px'
                              }}
                            >
                              <Pencil size={14} /> แก้ไข
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>

                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

                {/* ขนาดตัว (Measurements) */}
                <section className="detail-section">
                  <h3 style={{ fontSize: '15px', color: '#fff', margin: '0 0 12px' }}>ขนาดตัว (ลูกค้า)</h3>
                  <div className="measurement-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
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

                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

                {/* หมายเหตุ (Notes) */}
                <section className="detail-section">
                  <h3 style={{ fontSize: '15px', color: '#fff', margin: '0 0 12px' }}>หมายเหตุ</h3>
                  <div style={{ background: 'var(--bg-input)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: selectedRental.notes ? '#fff' : 'var(--text-muted)' }}>
                    {selectedRental.notes || 'ไม่มีหมายเหตุ'}
                  </div>
                </section>

                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

                {/* การจัดส่ง (Shipping Options/Controls) */}
                <section className="detail-section controls-section">
                  <h3 style={{ fontSize: '15px', color: '#fff', margin: '0 0 12px' }}>การจัดส่ง</h3>
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {selectedRental.status === 'booked'
                      ? 'กดปุ่มส่งมอบชุดด้านบนเพื่อเลือก EMS, รับหน้าร้าน หรือ Messenger'
                      : selectedShippingMethod
                        ? `วิธีจัดส่ง: ${selectedShippingMethod}`
                        : 'ยังไม่มีข้อมูลวิธีจัดส่ง'}
                  </div>
                </section>

                {/* Cancel Order / Delete Section */}
                {((selectedRental.status === 'booked' || selectedRental.status === 'overdue') && onCancelRental) && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`ยืนยันยกเลิกออเดอร์ ${selectedRental.orderCode}?`) && window.confirm('กดยืนยันอีกครั้งเพื่อยกเลิก')) {
                          onCancelRental(selectedRental.rentals.map(r => r.id))
                        }
                      }}
                      style={{
                        width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger-color)', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 600
                      }}
                    >
                      ❌ ยกเลิกออเดอร์
                    </button>
                  </div>
                )}
                {onDeleteRental && canDeleteRentalGroup(selectedRental.rentals) && (
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
              </aside>
            </div>
          </div>
        )}
      </section>

      {/* HIDDEN PRINT TAG — only visible during window.print() */}
      {selectedRental && (
        <div className="print-tag-wrapper" aria-hidden="true">
          <div className="print-tag">
            <div className="print-tag-header">
              <strong>PRECIOUS RENTAL</strong>
              <span className="print-tag-code">{selectedRental.orderCode}</span>
            </div>
            <div className="print-tag-customer">
              <div className="print-tag-label">ลูกค้า</div>
              <div className="print-tag-value">{selectedRental.customer.fullName}</div>
              <div className="print-tag-sub">{selectedRental.customer.phone}{selectedRental.customer.lineAccount ? ` | LINE: ${selectedRental.customer.lineAccount}` : ''}</div>
            </div>
            <div className="print-tag-measurements">
              <div><span>อก</span><strong>{selectedRental.customer.bustIn ? `${selectedRental.customer.bustIn}"` : '-'}</strong></div>
              <div><span>เอว</span><strong>{selectedRental.customer.waistIn ? `${selectedRental.customer.waistIn}"` : '-'}</strong></div>
              <div><span>สะโพก</span><strong>{selectedRental.customer.hipIn ? `${selectedRental.customer.hipIn}"` : '-'}</strong></div>
              <div><span>สูง</span><strong>{selectedRental.customer.heightCm ? `${selectedRental.customer.heightCm}cm` : '-'}</strong></div>
            </div>
            {selectedRental.rentals.map((r) => (
              <div key={r.id} className="print-tag-costume">
                <div className="print-tag-label">ชุด</div>
                <div className="print-tag-value">{r.costume.productName}</div>
                <div className="print-tag-sub">SKU: {r.costume.sku} | สี: {r.costume.primaryColor} | ไซส์: {r.costume.size}</div>
              </div>
            ))}
            <div className="print-tag-dates">
              <div><span>รับชุด</span><strong>{selectedRental.pickupDate}</strong></div>
              <div><span>คืนชุด</span><strong>{selectedRental.returnDate}</strong></div>
            </div>
            {selectedRental.notes && (
              <div className="print-tag-notes">
                <div className="print-tag-label">โน้ตช่างเย็บ</div>
                <div className="print-tag-notes-text">{selectedRental.notes}</div>
              </div>
            )}
            <div className="print-tag-footer">
              พิมพ์เมื่อ {new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      )}


      {/* DELIVERY METHOD MODAL */}
      {isDeliveryMethodModalOpen && selectedRental && (
        <div className="modal-backdrop" role="presentation" onClick={closeDeliveryMethodModal}>
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="เลือกวิธีจัดส่ง"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px', width: '100%' }}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Delivery Method</p>
                <h2>เลือกวิธีจัดส่ง</h2>
              </div>
              <button className="ghost-button" type="button" onClick={closeDeliveryMethodModal}>
                ปิด
              </button>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              <button
                className="primary-button"
                type="button"
                onClick={handleConfirmEmsDelivery}
                style={{ width: '100%', background: 'rgba(255,193,7,0.12)', borderColor: 'rgba(255,193,7,0.5)', color: '#ffd24d', justifyContent: 'flex-start', padding: '12px 14px' }}
              >
                📦 EMS
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleConfirmStorefrontPickup}
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-color)', color: '#fff', justifyContent: 'flex-start', padding: '12px 14px' }}
              >
                🏪 รับหน้าร้าน
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleConfirmMessengerDelivery}
                style={{ width: '100%', background: 'rgba(16,185,129,0.14)', borderColor: 'rgba(16,185,129,0.5)', color: '#34d399', justifyContent: 'flex-start', padding: '12px 14px' }}
              >
                🚚 Messenger
              </button>
            </div>
          </section>
        </div>
      )}

      {/* CREATE / EDIT RENTAL FORM MODAL */}
      {isFormOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label={editingRentalId ? 'แก้ไขใบเช่าชุด' : 'สร้างใบเช่าชุดใหม่'} style={{ maxWidth: '650px', width: '100%' }}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Rental Order</p>
                <h2>{editingRentalId ? (editMode === 'limited' ? 'แก้ไขออเดอร์แบบจำกัด' : 'แก้ไขออเดอร์') : 'ลงทะเบียนเช่าชุดใหม่'}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={closeRentalForm}>
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
                      readOnly={Boolean(editingRentalId)}
                      onChange={(e) => {
                        if (editingRentalId) return
                        setCustomerSearch(e.target.value)
                        setSelectedCustomer(null)
                        setShowCustomerDropdown(true)
                      }}
                      onFocus={(e) => {
                        e.target.select()
                        if (!editingRentalId) {
                          setShowCustomerDropdown(true)
                        }
                      }}
                      style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                    />
                    {!editingRentalId && (
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
                    )}
                  </div>
                </label>

                {!editingRentalId && showCustomerDropdown && (
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
                      readOnly={editMode === 'limited'}
                      onChange={(e) => {
                        if (editMode === 'limited') return
                        setCostumeSearch(e.target.value)
                        setShowCostumeDropdown(true)
                      }}
                      onFocus={(e) => {
                        e.target.select()
                        if (editMode !== 'limited') {
                          setShowCostumeDropdown(true)
                        }
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

                {editMode !== 'limited' && showCostumeDropdown && (
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
                            <strong>{item.productName}</strong> ({item.sku}) - ไซส์: {item.size} | ค่าเช่า: {formatTierRange(item.rentalTiers)}
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
                            สี: {item.primaryColor} | ไซส์: {item.size} | ค่าเช่า: {formatTierRange(item.rentalTiers)}
                          </div>
                        </div>
	                        {editMode !== 'limited' && (
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
	                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PACKAGE CHOICE CHIPS */}
	              {!editingRentalId && selectedCostumes.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label className="field" style={{ marginBottom: '12px' }}>
                    <span>เลือกแพ็กเกจระยะเวลาเช่า<b style={{ color: 'red' }}> *</b></span>
                  </label>
                  {!tiersAreCompatible(selectedCostumes) ? (
                    <div style={{ color: 'var(--warning-color)', fontSize: '13px', background: 'rgba(218, 165, 32, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ⚠️ ชุดที่เลือกมีแพ็กเกจวันไม่ตรงกัน — กรุณากำหนดวันเองครับ
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedCostumes[0]?.rentalTiers.map((tier) => {
                        const isSelected = selectedTierDays === tier.days
                        return (
                          <button
                            key={tier.days}
                            type="button"
                            onClick={() => setSelectedTierDays(tier.days)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '20px',
                              border: `1px solid ${isSelected ? 'var(--text-gold)' : 'var(--border-color)'}`,
                              background: isSelected ? 'rgba(218, 165, 32, 0.1)' : 'var(--surface-sunken)',
                              color: isSelected ? 'var(--text-gold)' : '#fff',
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {isSelected ? '✓ ' : '○ '}แพ็กเกจ {tier.days} วัน : {formatBaht(tier.price)}
                          </button>
                        )
                      })}
                      <button
                        type="button"
                        onClick={() => setSelectedTierDays('custom')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: `1px solid ${selectedTierDays === 'custom' ? 'var(--text-gold)' : 'var(--border-color)'}`,
                          background: selectedTierDays === 'custom' ? 'rgba(218, 165, 32, 0.1)' : 'var(--surface-sunken)',
                          color: selectedTierDays === 'custom' ? 'var(--text-gold)' : '#fff',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {selectedTierDays === 'custom' ? '✓ ' : '○ '}กำหนดวันเอง (Custom)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* RENTAL PERIOD DATES */}
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label className="field">
                  <span>วันที่รับชุด<b style={{ color: 'red' }}> *</b></span>
	                  <input
	                    type="date"
	                    value={pickupDate}
	                    readOnly={editMode === 'limited'}
	                    style={editMode === 'limited' ? { backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)' } : undefined}
	                    onChange={(e) => setPickupDate(e.target.value)}
	                  />
                </label>
                <label className="field">
                  <span>วันที่คืน<b style={{ color: 'red' }}> *</b></span>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    readOnly={typeof selectedTierDays === 'number'}
                    style={typeof selectedTierDays === 'number' ? { backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)' } : undefined}
                  />
                </label>
              </div>

              {/* FINANCIAL SETTINGS */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-gold)', margin: '0 0 12px' }}>สรุปข้อมูลการเงิน</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <label className="field">
                    <span>ราคาตามแพ็กเกจ (Base)</span>
                    <input
                      type="text"
                      value={formatBaht(basePriceFromTier)}
                      readOnly
                      style={{ backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
                    />
                  </label>
                  <label className="field">
                    <span>ราคาปรับแต่ง (Override)</span>
                    <input
                      type="number"
                      value={rentalPrice}
                      placeholder="0"
                      readOnly={isLimitedMoneyLocked}
                      style={isLimitedMoneyLocked ? { backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)' } : undefined}
                      onChange={(e) => {
                        if (isLimitedMoneyLocked) return
                        setRentalPrice(e.target.value)
                        syncCollectedAmount(e.target.value, depositAmount, discountAmount, shippingCost)
                      }}
                    />
                  </label>
                </div>

                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <label className="field">
                    <span>ค่ามัดจำ / ประกัน</span>
                    <input
	                    type="number"
	                    value={depositAmount}
	                    placeholder="0"
	                    readOnly={editMode === 'limited'}
	                    style={editMode === 'limited' ? { backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)' } : undefined}
	                    onChange={(e) => {
	                      if (editMode === 'limited') return
	                      setDepositAmount(e.target.value)
	                      syncCollectedAmount(rentalPrice, e.target.value, discountAmount, shippingCost)
	                    }}
                    />
                  </label>
                  <label className="field">
                    <span>ค่าจัดส่ง</span>
                    <input
	                    type="number"
	                    value={shippingCost}
	                    placeholder="0"
	                    min="0"
	                    readOnly={editMode === 'limited'}
	                    style={editMode === 'limited' ? { backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)' } : undefined}
	                    onChange={(e) => {
	                      if (editMode === 'limited') return
	                      setShippingCost(e.target.value)
	                      syncCollectedAmount(rentalPrice, depositAmount, discountAmount, e.target.value)
	                    }}
                    />
                  </label>
                  <label className="field">
                    <span>ส่วนลด</span>
                    <input
                      type="number"
                      value={discountAmount}
                      placeholder="0"
                      min="0"
                      readOnly={isLimitedMoneyLocked}
                      style={isLimitedMoneyLocked ? { backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)' } : undefined}
                      onChange={(e) => {
                        if (isLimitedMoneyLocked) return
                        setDiscountAmount(e.target.value)
                        syncCollectedAmount(rentalPrice, depositAmount, e.target.value, shippingCost)
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
                      readOnly={isLimitedMoneyLocked}
                      style={isLimitedMoneyLocked ? { backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)' } : undefined}
                      onChange={(e) => {
                        if (isLimitedMoneyLocked) return
                        setCollectedAmount(e.target.value)
                        syncDiscountAmount(rentalPrice, depositAmount, e.target.value, shippingCost)
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

	              {(formError || editFormError) && <p className="form-error">{editFormError || formError}</p>}

              <div className="modal-actions">
	                <button
	                  className="secondary-button"
	                  type="button"
	                  onClick={closeRentalForm}
	                >
                  ยกเลิก
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  style={{ background: 'var(--text-gold)', color: '#000' }}
                >
	                  {editingRentalId ? 'บันทึกการแก้ไข' : 'บันทึกการเช่า'}
	                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
