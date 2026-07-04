import { useState, useMemo, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Eye,
  Check,
  Clock,
  User,
  Shirt,
  Calendar as CalendarIcon,
  RefreshCw,
  ListTodo,
  History,
  Settings
} from 'lucide-react'
import type { RentalOrder, RentalStatus } from '../rentals/rentalTypes'

interface CalendarPageProps {
  rentals: RentalOrder[]
  onUpdateRentalStatus: (rentalId: string | string[], status: RentalStatus) => void
  onNavigateToRentals: (rentalId: string) => void
  onNavigateToCreateRental: (pickupDate: string, returnDate: string) => void
  onNavigateToTab?: (tab: 'dashboard' | 'inventory' | 'customers' | 'rentals' | 'calendar' | 'settings' | 'audit') => void
}

type DayRentalBuckets = {
  pickups: RentalOrder[]
  returns: RentalOrder[]
  ongoing: RentalOrder[]
}

type GroupedRentalOrder = {
  id: string
  orderCode: string
  customer: RentalOrder['customer']
  pickupDate: string
  returnDate: string
  rentalPrice: number
  depositAmount: number
  collectedAmount: number
  status: RentalStatus
  notes: string
  createdAt: string
  updatedAt: string
  rentals: RentalOrder[]
}

type DayRentalCategory = 'pickup' | 'return' | 'ongoing'

type GroupedDayRentalBuckets = {
  pickups: GroupedRentalOrder[]
  returns: GroupedRentalOrder[]
  ongoing: GroupedRentalOrder[]
}

type SelectedDayRentalGroup = GroupedRentalOrder & {
  dayCategories: DayRentalCategory[]
}

const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
const emptyDayRentals: DayRentalBuckets = { pickups: [], returns: [], ongoing: [] }

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

function getDisplayDayRentals(
  dayEvents: DayRentalBuckets,
  dateStr: string,
  todayStr: string
): DayRentalBuckets {
  if (dateStr !== todayStr || dayEvents.pickups.length === 0) {
    return dayEvents
  }

  const ongoingIds = new Set(dayEvents.ongoing.map((rental) => rental.id))
  const ongoing = [...dayEvents.ongoing]
  const pickups = dayEvents.pickups.filter((rental) => {
    const shouldShowAsOngoing =
      (rental.status === 'active' || rental.status === 'overdue') &&
      rental.pickupDate === dateStr &&
      rental.returnDate > dateStr

    if (!shouldShowAsOngoing) {
      return true
    }

    if (!ongoingIds.has(rental.id)) {
      ongoing.push(rental)
      ongoingIds.add(rental.id)
    }
    return false
  })

  return {
    pickups,
    returns: dayEvents.returns,
    ongoing
  }
}

function getOrderGroupCode(orderCode: string) {
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

function getGroupStatus(groupItems: RentalOrder[]): RentalStatus {
  if (groupItems.some((rental) => rental.status === 'overdue')) return 'overdue'
  if (groupItems.some((rental) => rental.status === 'active')) return 'active'
  if (groupItems.some((rental) => rental.status === 'booked')) return 'booked'
  if (groupItems.some((rental) => rental.status === 'returned')) return 'returned'
  if (groupItems.every((rental) => rental.status === 'cancelled')) return 'cancelled'
  return 'returned'
}

function groupRentalsByOrder(rentalItems: RentalOrder[]): GroupedRentalOrder[] {
  if (rentalItems.length === 0) return []

  const groups: Record<string, RentalOrder[]> = {}

  rentalItems.forEach((rental) => {
    const groupCode = getOrderGroupCode(rental.orderCode)
    if (!groups[groupCode]) {
      groups[groupCode] = []
    }
    groups[groupCode].push(rental)
  })

  return Object.entries(groups)
    .map(([orderCode, groupedItems]) => {
      const first = groupedItems[0]
      const pickupDate = groupedItems.reduce(
        (earliest, rental) => (rental.pickupDate < earliest ? rental.pickupDate : earliest),
        first.pickupDate
      )
      const returnDate = groupedItems.reduce(
        (latest, rental) => (rental.returnDate > latest ? rental.returnDate : latest),
        first.returnDate
      )
      const createdAt = groupedItems.reduce(
        (earliest, rental) => (rental.createdAt < earliest ? rental.createdAt : earliest),
        first.createdAt
      )
      const updatedAt = groupedItems.reduce(
        (latest, rental) => (rental.updatedAt > latest ? rental.updatedAt : latest),
        first.updatedAt
      )
      const notes = groupedItems
        .map((rental) => rental.notes?.trim())
        .filter((note): note is string => Boolean(note))
        .join('\n')

      return {
        id: first.id,
        orderCode,
        customer: first.customer,
        pickupDate,
        returnDate,
        rentalPrice: groupedItems.reduce((sum, rental) => sum + rental.rentalPrice, 0),
        depositAmount: groupedItems.reduce((sum, rental) => sum + rental.depositAmount, 0),
        collectedAmount: groupedItems.reduce((sum, rental) => sum + rental.collectedAmount, 0),
        status: getGroupStatus(groupedItems),
        notes,
        createdAt,
        updatedAt,
        rentals: groupedItems
      }
    })
    .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate) || a.orderCode.localeCompare(b.orderCode))
}

function groupDayRentals(dayEvents: DayRentalBuckets): GroupedDayRentalBuckets {
  return {
    pickups: groupRentalsByOrder(dayEvents.pickups),
    returns: groupRentalsByOrder(dayEvents.returns),
    ongoing: groupRentalsByOrder(dayEvents.ongoing)
  }
}

function matchesRentalGroupQuery(group: GroupedRentalOrder, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  const searchable = [
    group.orderCode,
    group.customer.fullName,
    group.customer.customerCode,
    group.customer.phone,
    group.customer.lineAccount ?? '',
    group.pickupDate,
    group.returnDate,
    group.rentals.map((rental) => `${rental.costume.productName} ${rental.costume.sku} ${rental.costume.primaryColor} ${rental.costume.size}`).join(' ')
  ]
    .join(' ')
    .toLowerCase()

  return searchable.includes(normalizedQuery)
}

function getGroupShortLabel(group: GroupedRentalOrder) {
  const firstName = group.customer.fullName.split(' ')[0] || group.customer.fullName
  return group.rentals.length > 1 ? `${firstName} x${group.rentals.length}` : firstName
}

function getGroupCostumeSummary(group: GroupedRentalOrder) {
  return group.rentals.map((rental) => rental.costume.sku).join(', ')
}

export function CalendarPage({
  rentals,
  onUpdateRentalStatus,
  onNavigateToRentals,
  onNavigateToCreateRental,
  onNavigateToTab
}: CalendarPageProps) {
  // Calendar View states
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return toLocalDateStr(new Date())
  })
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderCode, setSelectedOrderCode] = useState('')
  const [listCurrentPage, setListCurrentPage] = useState(1)
  const listPageSize = 10
  const todayStr = toLocalDateStr(new Date())

  // Mobile states
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Reset list page to 1 on search query change
  useEffect(() => {
    setListCurrentPage(1)
  }, [searchQuery])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Go to today
  const handleGoToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDateStr(toLocalDateStr(today))
  }

  // Prev month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  // Next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Prev week
  const handlePrevWeek = () => {
    const d = new Date(currentDate.getTime())
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  // Next week
  const handleNextWeek = () => {
    const d = new Date(currentDate.getTime())
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  // Format Date for UI e.g., "11 มิถุนายน 2569"
  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const y = parseInt(parts[0]) + 543 // Buddhist Era
    const m = thaiMonths[parseInt(parts[1]) - 1]
    const d = parseInt(parts[2])
    return `${d} ${m} ${y}`
  }

  // Generate calendar days for monthly grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const startDayOfWeek = firstDay.getDay() // 0 to 6
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days = []

    // Prev Month Padding Days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const prevMonthDate = new Date(year, month - 1, d)
      days.push({
        date: prevMonthDate,
        dateStr: toLocalDateStr(prevMonthDate),
        dayNumber: d,
        isCurrentMonth: false
      })
    }

    // Current Month Days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const currDate = new Date(year, month, d)
      days.push({
        date: currDate,
        dateStr: toLocalDateStr(currDate),
        dayNumber: d,
        isCurrentMonth: true
      })
    }

    // Next Month Padding Days
    const remainingCells = 42 - days.length
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonthDate = new Date(year, month + 1, d)
      days.push({
        date: nextMonthDate,
        dateStr: toLocalDateStr(nextMonthDate),
        dayNumber: d,
        isCurrentMonth: false
      })
    }

    return days
  }, [year, month])

  // Get start/end dates of the current week (for week view)
  const currentWeekDays = useMemo(() => {
    const tempDate = new Date(currentDate)
    const day = tempDate.getDay()
    const diff = tempDate.getDate() - day // adjust to sunday
    const sunday = new Date(tempDate.setDate(diff))
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const wDate = new Date(sunday)
      wDate.setDate(sunday.getDate() + i)
      days.push({
        date: wDate,
        dateStr: toLocalDateStr(wDate),
        dayName: thaiDays[i]
      })
    }
    return days
  }, [currentDate])

  // Calculate the bounds of the visible range for performance optimization
  const visibleRange = useMemo(() => {
    let startStr: string
    let endStr: string
    
    if (viewMode === 'month' && calendarDays.length > 0) {
      startStr = calendarDays[0].dateStr
      endStr = calendarDays[calendarDays.length - 1].dateStr
    } else if (viewMode === 'week' && currentWeekDays.length > 0) {
      startStr = currentWeekDays[0].dateStr
      endStr = currentWeekDays[currentWeekDays.length - 1].dateStr
    } else {
      // List view or fallback: cover the current date's month range
      const firstDay = new Date(year, month - 1, 1)
      const lastDay = new Date(year, month + 2, 0)
      startStr = toLocalDateStr(firstDay)
      endStr = toLocalDateStr(lastDay)
    }

    // Ensure selectedDateStr is also covered
    if (selectedDateStr) {
      if (!startStr || selectedDateStr < startStr) startStr = selectedDateStr
      if (!endStr || selectedDateStr > endStr) endStr = selectedDateStr
    }

    return { startStr, endStr }
  }, [viewMode, calendarDays, currentWeekDays, selectedDateStr, year, month])

  // Filter and index rentals by date (within visible bounds for performance)
  const rentalsByDate = useMemo(() => {
    const index: Record<string, { pickups: RentalOrder[]; returns: RentalOrder[]; ongoing: RentalOrder[] }> = {}
    const { startStr, endStr } = visibleRange
    
    const isDateInRange = (dateStr: string) => {
      return dateStr >= startStr && dateStr <= endStr
    }

    rentals.forEach((rental) => {
      if (rental.status === 'cancelled') return

      // Pickups
      if (rental.pickupDate && isDateInRange(rental.pickupDate)) {
        if (!index[rental.pickupDate]) {
          index[rental.pickupDate] = { pickups: [], returns: [], ongoing: [] }
        }
        index[rental.pickupDate].pickups.push(rental)
      }
      
      // Returns
      if (rental.returnDate && isDateInRange(rental.returnDate)) {
        if (!index[rental.returnDate]) {
          index[rental.returnDate] = { pickups: [], returns: [], ongoing: [] }
        }
        index[rental.returnDate].returns.push(rental)
      }

      // Ongoing range (days strictly between pickup and return)
      if (rental.pickupDate && rental.returnDate) {
        if (rental.pickupDate < endStr && rental.returnDate > startStr) {
          const overlapStart = rental.pickupDate > startStr ? rental.pickupDate : startStr
          const overlapEnd = rental.returnDate < endStr ? rental.returnDate : endStr
          
          const current = new Date(overlapStart)
          const end = new Date(overlapEnd)
          
          if (toLocalDateStr(current) === rental.pickupDate) {
            current.setDate(current.getDate() + 1)
          }
          
          while (current < end) {
            const dateStr = toLocalDateStr(current)
            if (dateStr === rental.returnDate) break
            
            if (isDateInRange(dateStr)) {
              if (!index[dateStr]) {
                index[dateStr] = { pickups: [], returns: [], ongoing: [] }
              }
              index[dateStr].ongoing.push(rental)
            }
            current.setDate(current.getDate() + 1)
          }
        }
      }
    })

    return index
  }, [rentals, visibleRange])

  // Find selected day rentals
  const selectedDayRentals = useMemo(() => {
    if (!selectedDateStr) return emptyDayRentals
    const dayEvents = rentalsByDate[selectedDateStr] ?? emptyDayRentals
    return getDisplayDayRentals(dayEvents, selectedDateStr, todayStr)
  }, [selectedDateStr, rentalsByDate, todayStr])

  const groupedSelectedDayRentals = useMemo(() => {
    return groupDayRentals(selectedDayRentals)
  }, [selectedDayRentals])

  const selectedDayRentalGroups = useMemo<SelectedDayRentalGroup[]>(() => {
    const groups = new Map<string, SelectedDayRentalGroup>()

    const appendGroups = (items: GroupedRentalOrder[], category: DayRentalCategory) => {
      items.forEach((group) => {
        const existing = groups.get(group.orderCode)
        if (existing) {
          if (!existing.dayCategories.includes(category)) {
            existing.dayCategories.push(category)
          }
          return
        }

        groups.set(group.orderCode, {
          ...group,
          dayCategories: [category]
        })
      })
    }

    appendGroups(groupedSelectedDayRentals.pickups, 'pickup')
    appendGroups(groupedSelectedDayRentals.returns, 'return')
    appendGroups(groupedSelectedDayRentals.ongoing, 'ongoing')

    return Array.from(groups.values()).sort(
      (a, b) => a.pickupDate.localeCompare(b.pickupDate) || a.orderCode.localeCompare(b.orderCode)
    )
  }, [groupedSelectedDayRentals])

  const selectedCalendarRental = useMemo(() => {
    return selectedDayRentalGroups.find((group) => group.orderCode === selectedOrderCode) ?? selectedDayRentalGroups[0] ?? null
  }, [selectedDayRentalGroups, selectedOrderCode])

  // Today's Rentals calculations for mobile persistent today's list
  const todayRentals = useMemo(() => {
    const dayEvents = rentalsByDate[todayStr] ?? emptyDayRentals
    return getDisplayDayRentals(dayEvents, todayStr, todayStr)
  }, [rentalsByDate, todayStr])

  const groupedTodayRentals = useMemo(() => {
    return groupDayRentals(todayRentals)
  }, [todayRentals])

  const todayRentalGroups = useMemo<SelectedDayRentalGroup[]>(() => {
    const groups = new Map<string, SelectedDayRentalGroup>()

    const appendGroups = (items: GroupedRentalOrder[], category: DayRentalCategory) => {
      items.forEach((group) => {
        const existing = groups.get(group.orderCode)
        if (existing) {
          if (!existing.dayCategories.includes(category)) {
            existing.dayCategories.push(category)
          }
          return
        }

        groups.set(group.orderCode, {
          ...group,
          dayCategories: [category]
        })
      })
    }

    appendGroups(groupedTodayRentals.pickups, 'pickup')
    appendGroups(groupedTodayRentals.returns, 'return')
    appendGroups(groupedTodayRentals.ongoing, 'ongoing')

    return Array.from(groups.values()).sort(
      (a, b) => a.pickupDate.localeCompare(b.pickupDate) || a.orderCode.localeCompare(b.orderCode)
    )
  }, [groupedTodayRentals])

  const selectedMobileRental = useMemo(() => {
    if (!selectedOrderCode) return null
    let found = selectedDayRentalGroups.find((g) => g.orderCode === selectedOrderCode)
    if (found) return found
    found = todayRentalGroups.find((g) => g.orderCode === selectedOrderCode)
    return found || null
  }, [selectedDayRentalGroups, todayRentalGroups, selectedOrderCode])

  useEffect(() => {
    if (selectedDayRentalGroups.length === 0) {
      if (selectedOrderCode) {
        setSelectedOrderCode('')
      }
      return
    }

    if (!selectedDayRentalGroups.some((group) => group.orderCode === selectedOrderCode)) {
      setSelectedOrderCode(selectedDayRentalGroups[0].orderCode)
    }
  }, [selectedDayRentalGroups, selectedOrderCode])

  // Filter rentals for Timeline Schedule View based on query
  const filteredTimelineRentals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const list = [...groupRentalsByOrder(rentals)]

    // Sort by pickup date ascending
    list.sort((a, b) => a.pickupDate.localeCompare(b.pickupDate))

    if (!query) return list

    return list.filter((group) => matchesRentalGroupQuery(group, query))
  }, [rentals, searchQuery])

  // Paginated rentals for timeline schedule list view
  const paginatedListRentals = useMemo(() => {
    const startIndex = (listCurrentPage - 1) * listPageSize
    return filteredTimelineRentals.slice(startIndex, startIndex + listPageSize)
  }, [filteredTimelineRentals, listCurrentPage])

  const listTotalPages = Math.ceil(filteredTimelineRentals.length / listPageSize) || 1

  const formatBaht = (value: number) => {
    return `฿${value.toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`
  }

  const getDiscountAmount = (price: number, collected: number) => {
    return Math.max(0, Number((price - collected).toFixed(2)))
  }

  const openRentalGroup = (group: GroupedRentalOrder) => {
    onNavigateToRentals(group.rentals[0]?.id ?? group.id)
  }

  const updateRentalGroupStatus = (
    group: GroupedRentalOrder,
    fromStatuses: RentalStatus[],
    nextStatus: RentalStatus
  ) => {
    const ids = group.rentals
      .filter((rental) => fromStatuses.includes(rental.status))
      .map((rental) => rental.id)

    if (ids.length === 0) return
    onUpdateRentalStatus(ids, nextStatus)
  }

  const getDayCategoryLabel = (category: DayRentalCategory) => {
    switch (category) {
      case 'pickup':
        return 'รับ/ส่งวันนี้'
      case 'return':
        return 'คืนวันนี้'
      case 'ongoing':
        return 'อยู่ระหว่างเช่า'
      default:
        return category
    }
  }

  // Get status tag mapping
  const getStatusBadge = (status: RentalStatus) => {
    switch (status) {
      case 'booked':
        return <span className="status-pill warning" style={{ fontSize: '12px', padding: '4px 10px' }}>รอส่งมอบ</span>
      case 'active':
        return <span className="status-pill success" style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(218, 165, 32, 0.15)', color: '#ead483', border: '1px solid rgba(218, 165, 32, 0.3)' }}>กำลังเช่า</span>
      case 'returned':
        return <span className="status-pill success" style={{ fontSize: '12px', padding: '4px 10px' }}>คืนแล้ว</span>
      case 'overdue':
        return <span className="status-pill danger" style={{ fontSize: '12px', padding: '4px 10px' }}>เกินกำหนด</span>
      default:
        return <span className="status-pill muted" style={{ fontSize: '12px', padding: '4px 10px' }}>{status}</span>
    }
  }

  // Create new rental redirect helper
  const triggerCreateRentalForDate = (dateStr: string) => {
    // Return date defaults to 3 days after pickup date
    const pickup = new Date(dateStr)
    const returnDt = new Date(pickup)
    returnDt.setDate(pickup.getDate() + 3)
    
    onNavigateToCreateRental(
      dateStr,
      toLocalDateStr(returnDt)
    )
  }

  const isToday = (dateStr: string) => {
    return dateStr === toLocalDateStr(new Date())
  }

  const getStableTime = (orderCode: string) => {
    const codeNum = parseInt(orderCode.split('-').pop() ?? '0') || 0
    const times = ['09:00 น.', '10:00 น.', '11:30 น.', '13:00 น.', '14:30 น.', '16:00 น.', '17:30 น.']
    if (codeNum === 1) return '10:00 น.'
    if (codeNum === 4) return '14:30 น.'
    if (codeNum === 5) return '16:00 น.'
    return times[codeNum % times.length]
  }

  // Mobile Render Helper Functions
  const renderMobileRentalCard = (group: SelectedDayRentalGroup) => {
    return (
      <div
        key={group.orderCode}
        className="mobile-rental-item-card"
        onClick={() => {
          setSelectedOrderCode(group.orderCode)
          setIsMobileDetailOpen(true)
        }}
      >
        <div className="mobile-rental-left">
          <strong style={{ fontSize: '14px', color: '#fff' }}>{group.orderCode}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} />
            {group.customer.fullName}
          </span>
          <div className="mobile-badge-row">
            {group.dayCategories.map((cat) => (
              <span key={cat} className={`mobile-badge ${cat}`}>
                {getDayCategoryLabel(cat)}
              </span>
            ))}
          </div>
        </div>
        <div className="mobile-rental-right">
          {getStatusBadge(group.status)}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{group.rentals.length} ชุด</span>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>
    )
  }

  const renderMobileListView = () => {
    return (
      <div className="mobile-list-view" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0, textAlign: 'left' }}>
            รายการใบเช่าทั้งหมด ({filteredTimelineRentals.length} ใบเช่า)
          </h2>
          <label className="search-box" style={{ minHeight: '36px', padding: '0 12px', background: 'var(--bg-card)' }}>
            <Search size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อชุด, รหัสออเดอร์, ชื่อลูกค้า..."
              style={{ fontSize: '13px' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {paginatedListRentals.map((group) => {
            const categories: DayRentalCategory[] = []
            if (group.pickupDate === todayStr) categories.push('pickup')
            if (group.returnDate === todayStr) categories.push('return')
            if (todayStr > group.pickupDate && todayStr < group.returnDate) categories.push('ongoing')

            const groupWithCats = {
              ...group,
              dayCategories: categories
            }

            return renderMobileRentalCard(groupWithCats)
          })}

          {filteredTimelineRentals.length === 0 && (
             <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
               ไม่พบรายการเช่าชุดที่ค้นหา
             </div>
          )}
        </div>

        {listTotalPages > 1 && (
          <div className="pagination-footer" style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <button
              className="pagination-btn"
              disabled={listCurrentPage <= 1}
              onClick={() => setListCurrentPage((p) => Math.max(p - 1, 1))}
              type="button"
              style={{ minHeight: '32px', width: '32px', padding: 0 }}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="page-number-box" style={{ height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>{listCurrentPage}</div>
            <button
              className="pagination-btn"
              disabled={listCurrentPage >= listTotalPages}
              onClick={() => setListCurrentPage((p) => Math.min(p + 1, listTotalPages))}
              type="button"
              style={{ minHeight: '32px', width: '32px', padding: 0 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderMobileDetailContent = (group: SelectedDayRentalGroup) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
        {/* Customer Meta */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="profile-avatar" style={{ width: '44px', height: '44px', fontSize: '15px' }}>
            {group.customer.fullName.slice(0, 2).toLowerCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 700 }}>
              {group.customer.fullName}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              โทร: {group.customer.phone} | LINE: {group.customer.lineAccount || '-'}
            </p>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>ช่วงเช่า</span>
            <strong style={{ fontSize: '13px', color: '#fff', display: 'block', marginTop: '2px' }}>
              {formatThaiDate(group.pickupDate)} - {formatThaiDate(group.returnDate)}
            </strong>
          </div>
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>ยอดเก็บจริง</span>
            <strong style={{ fontSize: '13px', color: 'var(--text-gold)', display: 'block', marginTop: '2px' }}>
              {formatBaht(group.collectedAmount)}
            </strong>
          </div>
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>มัดจำรวม</span>
            <strong style={{ fontSize: '13px', color: '#fff', display: 'block', marginTop: '2px' }}>
              {formatBaht(group.depositAmount)}
            </strong>
          </div>
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>จำนวนชุด</span>
            <strong style={{ fontSize: '13px', color: '#fff', display: 'block', marginTop: '2px' }}>
              {group.rentals.length} ชุด
            </strong>
          </div>
        </div>

        {/* Sizing Info */}
        <div>
          <h4 style={{ fontSize: '13px', color: '#fff', margin: '0 0 8px', fontWeight: 700 }}>ขนาดสัดส่วน</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>อก</span>
              <strong style={{ fontSize: '13px', color: '#fff' }}>
                {group.customer.bustIn ? `${group.customer.bustIn}"` : '-'}
              </strong>
            </div>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>เอว</span>
              <strong style={{ fontSize: '13px', color: '#fff' }}>
                {group.customer.waistIn ? `${group.customer.waistIn}"` : '-'}
              </strong>
            </div>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>สะโพก</span>
              <strong style={{ fontSize: '13px', color: '#fff' }}>
                {group.customer.hipIn ? `${group.customer.hipIn}"` : '-'}
              </strong>
            </div>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>สูง</span>
              <strong style={{ fontSize: '13px', color: '#fff' }}>
                {group.customer.heightCm ? `${group.customer.heightCm}` : '-'}
              </strong>
            </div>
          </div>
        </div>

        {/* Items in order */}
        <div>
          <h4 style={{ fontSize: '13px', color: '#fff', margin: '0 0 8px', fontWeight: 700 }}>รายการชุดในใบเช่า</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {group.rentals.map((rental) => (
              <div
                key={rental.id}
                style={{
                  display: 'grid',
                  gap: '6px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: '#fff' }}>
                      {rental.costume.productName}
                    </h5>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                      SKU: {rental.costume.sku} | สี: {rental.costume.primaryColor} | ไซส์: {rental.costume.size}
                    </p>
                  </div>
                  {getStatusBadge(rental.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {group.notes && (
          <div>
            <h4 style={{ fontSize: '13px', color: '#fff', margin: '0 0 4px', fontWeight: 700 }}>หมายเหตุ</h4>
            <p style={{ margin: 0, color: 'var(--text-bright)', whiteSpace: 'pre-wrap', fontSize: '12px', background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
               {group.notes}
            </p>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                openRentalGroup(group)
                setIsMobileDetailOpen(false)
              }}
              style={{ fontSize: '13px', minHeight: '38px' }}
            >
              <Eye size={14} /> ดูใบเช่าชุด
            </button>

            {group.status === 'booked' && (
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  updateRentalGroupStatus(group, ['booked'], 'active')
                  setIsMobileDetailOpen(false)
                }}
                style={{ fontSize: '13px', minHeight: '38px', background: 'var(--text-gold)', color: '#000' }}
              >
                <Check size={14} /> ส่งมอบชุด
              </button>
            )}

            {(group.status === 'active' || group.status === 'overdue') && (
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  updateRentalGroupStatus(group, ['active', 'overdue'], 'returned')
                  setIsMobileDetailOpen(false)
                }}
                style={{ fontSize: '13px', minHeight: '38px', background: 'var(--success-color)', borderColor: 'var(--success-color)', color: '#fff' }}
              >
                <Check size={14} /> รับคืนชุด
              </button>
            )}
          </div>

          {group.status === 'returned' && (
            <div style={{ textAlign: 'center', color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 600 }}>
              ใบเช่านี้สิ้นสุดแล้ว (คืนชุดเรียบร้อย)
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="mobile-calendar-container">
        {/* Brand Top Bar */}
        <div className="mobile-brand-header">
          <div className="mobile-brand-logo">
            <span className="brand-precious">PRECIOUS</span>
            <span className="brand-rental">RENTAL</span>
          </div>
          <div className="mobile-header-actions">
            <button 
              type="button" 
              className="header-icon-btn" 
              onClick={() => onNavigateToTab?.('settings')} 
              title="ตั้งค่า"
            >
              <Settings size={20} />
            </button>
            <button 
              type="button" 
              className="header-icon-btn" 
              onClick={() => onNavigateToTab?.('audit')} 
              title="ประวัติระบบ"
            >
              <History size={20} />
            </button>
          </div>
        </div>

        {/* Page Title Header */}
        <div className="mobile-calendar-header" style={{ textAlign: 'left' }}>
          <span className="eyebrow" style={{ color: 'var(--text-gold)' }}>PRECIOUS SHOP</span>
          <h1 style={{ color: '#fff' }}>หน้าปฏิทินเช่า/คืน</h1>
          <p className="subtitle">
            ปฏิทินตรวจสอบรายการเช่า รับ/ส่งชุด และส่งคืนเสื้อผ้าประจำเดือน
          </p>
        </div>

        {/* Segment Control Tab Bar */}
        <div className="mobile-segment-control">
          <button
            type="button"
            className={`segment-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            <CalendarIcon size={16} />
            <span>รายเดือน</span>
          </button>
          <button
            type="button"
            className={`segment-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            <RefreshCw size={16} />
            <span>รายสัปดาห์</span>
          </button>
          <button
            type="button"
            className={`segment-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <ListTodo size={16} />
            <span>รายการทั้งหมด</span>
          </button>
        </div>

        {/* Quick Action Button */}
        <button
          type="button"
          className="mobile-action-card"
          onClick={() => triggerCreateRentalForDate(selectedDateStr || todayStr)}
        >
          <div className="action-card-left">
            <Plus size={18} className="gold-icon" />
            <span>สร้างใบเช่าจากปฏิทิน</span>
          </div>
          <ChevronRight size={18} className="gold-icon" />
        </button>

        {/* Weekly View Date Strip */}
        {viewMode === 'week' && (
          <div className="mobile-week-navigator" style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={handlePrevWeek} className="secondary-button" style={{ minHeight: '32px', padding: '0 8px', borderRadius: '6px' }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-gold)' }}>
                {`สัปดาห์ที่ ${currentWeekDays[0].date.getDate()} - ${currentWeekDays[6].date.getDate()} ${thaiMonths[currentWeekDays[6].date.getMonth()]} ${currentWeekDays[6].date.getFullYear() + 543}`}
              </span>
              <button type="button" onClick={handleNextWeek} className="secondary-button" style={{ minHeight: '32px', padding: '0 8px', borderRadius: '6px' }}>
                <ChevronRight size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {currentWeekDays.map(({ date, dateStr, dayName }) => {
                const isSel = selectedDateStr === dateStr
                const isTod = isToday(dateStr)
                const dayEventsCount = (rentalsByDate[dateStr]?.pickups.length ?? 0) + (rentalsByDate[dateStr]?.returns.length ?? 0)
                
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(dateStr)}
                    className="mobile-week-day-btn"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSel ? 'var(--border-gold)' : isTod ? 'rgba(223, 183, 80, 0.3)' : 'transparent',
                      background: isSel ? 'rgba(223, 183, 80, 0.15)' : isTod ? 'rgba(223, 183, 80, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <span style={{ fontSize: '10px', color: isSel ? 'var(--text-gold)' : 'var(--text-muted)', fontWeight: 600 }}>{dayName}</span>
                    <strong style={{ fontSize: '15px', color: isSel ? 'var(--text-gold)' : '#fff', marginTop: '2px' }}>{date.getDate()}</strong>
                    {dayEventsCount > 0 && (
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fbbf24', position: 'absolute', bottom: '4px' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Monthly Calendar Grid Card */}
        {viewMode === 'month' && (
          <div className="mobile-calendar-card">
            {/* Month Navigator Header */}
            <div className="mobile-month-nav">
              <div className="month-nav-left">
                <button type="button" onClick={handlePrevMonth} className="nav-arrow-btn">
                  <ChevronLeft size={18} />
                </button>
                <span className="month-year-label">
                  {thaiMonths[month]} {year + 543}
                </span>
                <button type="button" onClick={handleNextMonth} className="nav-arrow-btn">
                  <ChevronRight size={18} />
                </button>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setCurrentDate(new Date())
                  setSelectedDateStr(toLocalDateStr(new Date()))
                }} 
                className="today-pill-btn"
              >
                วันนี้
              </button>
            </div>

            {/* Weekday headers */}
            <div className="mobile-week-days">
              {thaiDays.map((d, idx) => (
                <span key={d} className={`week-day-cell ${idx === 0 ? 'sun' : idx === 6 ? 'sat' : ''}`}>
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="mobile-calendar-grid">
              {calendarDays.map(({ date, dateStr, isCurrentMonth }) => {
                const dayNumber = date.getDate()
                const rawDayEvents = rentalsByDate[dateStr] ?? emptyDayRentals
                const dayEvents = getDisplayDayRentals(rawDayEvents, dateStr, todayStr)
                const groupedDayEvents = groupDayRentals(dayEvents)
                
                const filteredPickups = groupedDayEvents.pickups.filter((group) => matchesRentalGroupQuery(group, searchQuery))
                const filteredReturns = groupedDayEvents.returns.filter((group) => matchesRentalGroupQuery(group, searchQuery))
                
                const isSel = selectedDateStr === dateStr
                const isTod = isToday(dateStr)

                const pickupsCount = filteredPickups.length
                const returnsCount = filteredReturns.length

                return (
                  <button
                    key={dateStr}
                    type="button"
                    className={`mobile-day-cell ${isCurrentMonth ? 'current-month' : 'other-month'} ${isSel ? 'selected' : ''} ${isTod ? 'today' : ''}`}
                    onClick={() => setSelectedDateStr(dateStr)}
                  >
                    <span className="day-number-text">{dayNumber}</span>
                    
                    {/* Badge/Dot Indicators */}
                    <div className="indicator-container">
                      {pickupsCount > 0 && returnsCount === 0 && (
                        <span className="indicator-pill pickup">● {pickupsCount} เช่า</span>
                      )}
                      {returnsCount > 0 && pickupsCount === 0 && (
                        <span className="indicator-pill return">● {returnsCount} คืน</span>
                      )}
                      {pickupsCount > 0 && returnsCount > 0 && (
                        <span className="indicator-dot both" />
                      )}
                      {pickupsCount === 0 && returnsCount === 0 && isTod && (
                        <span className="indicator-dot today-dot" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mobile-legend">
              <span className="legend-item"><span className="legend-dot pickup" />เช่า</span>
              <span className="legend-item"><span className="legend-dot return" />คืน</span>
              <span className="legend-item"><span className="legend-dot both" />ทั้งเช่าและคืน</span>
            </div>
          </div>
        )}

        {/* Selected Date Appointments Card */}
        {viewMode !== 'list' && (
          <div className="mobile-appointment-card">
            <div className="mobile-card-header">
              <div className="mobile-card-icon-container">
                <CalendarIcon size={20} />
              </div>
              <div className="mobile-card-title-block">
                <span className="mobile-card-title">รายการนัดหมายประจำวัน</span>
                <strong className="mobile-card-date">
                  {formatThaiDate(selectedDateStr)}
                </strong>
              </div>
              <button 
                type="button" 
                className="mobile-card-count-badge"
                onClick={() => setViewMode('list')}
              >
                <span>{selectedDayRentalGroups.length} รายการ</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="mobile-card-body">
              {selectedDayRentalGroups.length === 0 ? (
                <div className="mobile-empty-state-body">
                  <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '8px' }}>
                    <rect x="25" y="30" width="70" height="70" rx="12" fill="#8b5cf6" fillOpacity="0.15" />
                    <rect x="25" y="30" width="70" height="70" rx="12" stroke="#8b5cf6" strokeWidth="2" />
                    <path d="M25 48H95" stroke="#8b5cf6" strokeWidth="2" />
                    <rect x="38" y="22" width="6" height="12" rx="3" fill="#8b5cf6" />
                    <rect x="76" y="22" width="6" height="12" rx="3" fill="#8b5cf6" />
                    <circle cx="42" cy="62" r="3" fill="#a78bfa" />
                    <circle cx="60" cy="62" r="3" fill="#a78bfa" />
                    <circle cx="78" cy="62" r="3" fill="#a78bfa" />
                    <circle cx="42" cy="78" r="3" fill="#a78bfa" />
                    <circle cx="60" cy="78" r="3" fill="#a78bfa" />
                    <circle cx="78" cy="78" r="3" fill="#a78bfa" />
                    <circle cx="85" cy="85" r="18" fill="#0c0e17" stroke="#8b5cf6" strokeWidth="2" />
                    <path d="M85 75V85H93" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                    <path d="M15 50L17 54L21 55L17 56L15 60L13 56L9 55L13 54L15 50Z" fill="#a78bfa" fillOpacity="0.6" />
                    <path d="M105 35L106.5 38L109.5 38.5L106.5 39L105 42L103.5 39L100.5 38.5L103.5 38L105 35Z" fill="#a78bfa" fillOpacity="0.8" />
                  </svg>
                  <strong style={{ fontSize: '15px', color: '#fff', marginTop: '8px', marginBottom: '4px' }}>ไม่มีนัดหมายในวันที่เลือก</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', display: 'block' }}>สร้างใบเช่าสำหรับวันนี้ เพื่อเพิ่มรายการนัดหมายของคุณ</span>
                  <button
                    type="button"
                    className="mobile-gradient-btn"
                    onClick={() => triggerCreateRentalForDate(selectedDateStr)}
                  >
                    <Plus size={16} />
                    <span>สร้างใบเช่าวันนี้</span>
                  </button>
                </div>
              ) : (
                <div className="mobile-appointment-list">
                  {selectedDayRentalGroups.map((group) => {
                    const statusClass = group.status === 'returned' || group.status === 'active' ? 'accent-green' : group.status === 'booked' ? 'accent-gold' : 'accent-red'
                    
                    return (
                      <div
                        key={group.orderCode}
                        className={`mobile-appointment-item ${statusClass}`}
                        onClick={() => {
                          setSelectedOrderCode(group.orderCode)
                          setIsMobileDetailOpen(true)
                        }}
                      >
                        <div className="appointment-item-left">
                          <strong className="appointment-order-code">{group.orderCode}</strong>
                          <div className="appointment-customer-info">
                            <User size={13} className="gray-icon" />
                            <span>{group.customer.fullName}</span>
                          </div>
                        </div>
                        <div className="appointment-item-right">
                          <span className={`appointment-status-badge ${group.status}`}>
                            {group.status === 'returned' ? 'คืนแล้ว' : group.status === 'active' ? 'กำลังเช่า' : group.status === 'booked' ? 'รอส่งมอบ' : 'เกินกำหนด'}
                          </span>
                          <span className="appointment-time-text">{getStableTime(group.orderCode)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {selectedDayRentalGroups.length > 0 && (
              <button
                type="button"
                className="mobile-see-all-link"
                onClick={() => setViewMode('list')}
              >
                ดูรายการทั้งหมดของวันนี้ <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* Timeline / All list view on mobile */}
        {viewMode === 'list' && renderMobileListView()}

        {/* Bottom Details Sheet Modal */}
        {isMobileDetailOpen && selectedMobileRental && (
          <div className="mobile-detail-modal-overlay" onClick={() => setIsMobileDetailOpen(false)}>
            <div className="mobile-detail-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="modal-header">
                <h3>รายละเอียดใบเช่า {selectedMobileRental.orderCode}</h3>
                <button type="button" className="close-btn" onClick={() => setIsMobileDetailOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                {/* Render Details content (Sizing, costumes list, controls) */}
                {renderMobileDetailContent(selectedMobileRental)}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="calendar-page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">Precious Shop</p>
          <h1>หน้าปฏิทินเช่า/คืน</h1>
          <p className="subtitle">ปฏิทินตรวจสอบรายการเช่า รับ/ส่งชุด และส่งคืนเสื้อผ้าประจำเดือน</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* View Mode Toggle */}
          <div className="view-mode-toggles" style={{ display: 'flex', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px' }}>
            <button
              className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
              aria-pressed={viewMode === 'month'}
            >
              <CalendarIcon size={16} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} />
              รายเดือน
            </button>
            <button
              className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
              aria-pressed={viewMode === 'week'}
            >
              <RefreshCw size={16} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} />
              รายสัปดาห์
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
            >
              <ListTodo size={16} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} />
              รายการทั้งหมด
            </button>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => triggerCreateRentalForDate(selectedDateStr || toLocalDateStr(new Date()))}
            style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}
          >
            <Plus size={20} />
            สร้างใบเช่าจากปฏิทิน
          </button>
        </div>
      </header>

      {/* Main Calendar Section */}
      <div className="calendar-content-layout" style={{ display: 'grid', gridTemplateColumns: viewMode !== 'list' ? 'minmax(0, 1.8fr) 420px' : '1fr', gap: '24px', marginTop: '16px' }}>
        
        {/* Left Side: Calendar Board */}
        {viewMode !== 'list' && (
          <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Calendar Controls */}
            <div className="calendar-navigator" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="secondary-button"
                  onClick={viewMode === 'month' ? handlePrevMonth : handlePrevWeek}
                  style={{ minHeight: '38px', padding: '0 12px' }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="secondary-button"
                  onClick={handleGoToToday}
                  style={{ minHeight: '38px', fontSize: '14px', padding: '0 14px' }}
                >
                  วันนี้
                </button>
                <button
                  className="secondary-button"
                  onClick={viewMode === 'month' ? handleNextMonth : handleNextWeek}
                  style={{ minHeight: '38px', padding: '0 12px' }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {viewMode === 'month' ? (
                  `${thaiMonths[month]} ${year + 543}`
                ) : (
                  `สัปดาห์ที่ ${currentWeekDays[0].date.getDate()} - ${currentWeekDays[6].date.getDate()} ${thaiMonths[currentWeekDays[6].date.getMonth()]} ${currentWeekDays[6].date.getFullYear() + 543}`
                )}
              </h2>

              {/* Muted Search Box */}
              <label className="search-box" style={{ minHeight: '38px', width: '240px', padding: '0 12px' }}>
                <Search size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อชุด/ลูกค้า..."
                  style={{ fontSize: '13px' }}
                />
              </label>
            </div>

            {/* MONTHLY VIEW GRID */}
            {viewMode === 'month' && (
              <div className="monthly-grid-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Week Day Labels */}
                <div className="week-day-labels" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '8px' }}>
                  {thaiDays.map((d, index) => (
                    <div key={d} style={{ color: index === 0 ? 'var(--danger-color)' : index === 6 ? '#5c85d6' : 'var(--text-muted)', fontSize: '14px', fontWeight: 700, padding: '8px 0' }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Cells Grid */}
                <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(110px, 1fr)', gap: '1px', background: 'var(--border-color)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  {calendarDays.map(({ dateStr, dayNumber, isCurrentMonth }) => {
                    const rawDayEvents = rentalsByDate[dateStr] ?? emptyDayRentals
                    const dayEvents = getDisplayDayRentals(rawDayEvents, dateStr, todayStr)
                    const groupedDayEvents = groupDayRentals(dayEvents)
                    
                    // Apply search query filter to badges
                    const filteredPickups = groupedDayEvents.pickups.filter((group) => matchesRentalGroupQuery(group, searchQuery))
                    const filteredReturns = groupedDayEvents.returns.filter((group) => matchesRentalGroupQuery(group, searchQuery))

                    const isDaySelected = selectedDateStr === dateStr
                    const isDayToday = isToday(dateStr)

                    const displayedCount = Math.min(filteredPickups.length, 2) + Math.min(filteredReturns.length, 2)
                    const totalCount = filteredPickups.length + filteredReturns.length
                    const overflowCount = totalCount - displayedCount

                    const ariaLabelText = `วันที่ ${dayNumber} ${isCurrentMonth ? thaiMonths[month] : ''} ${isDayToday ? '(วันนี้)' : ''}${filteredPickups.length > 0 ? `, รับ/ส่งชุด ${filteredPickups.length} ใบเช่า` : ''}${filteredReturns.length > 0 ? `, คืนชุด ${filteredReturns.length} ใบเช่า` : ''}${groupedDayEvents.ongoing.length > 0 ? `, อยู่ระหว่างเช่า ${groupedDayEvents.ongoing.length} ใบเช่า` : ''}`

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedDateStr(dateStr)}
                        className={`calendar-cell ${isCurrentMonth ? 'curr-month' : 'other-month'} ${isDaySelected ? 'selected' : ''} ${isDayToday ? 'today' : ''}`}
                        tabIndex={0}
                        role="button"
                        aria-label={ariaLabelText}
                        aria-pressed={isDaySelected}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedDateStr(dateStr)
                            e.preventDefault()
                          }
                        }}
                      >
                        {/* Day Number Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span
                            className={`day-number ${isDayToday ? 'today-badge' : ''}`}
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: isCurrentMonth 
                                ? (isDayToday ? '#000' : '#fff') 
                                : 'var(--text-muted)',
                              background: isDayToday ? 'var(--text-gold)' : 'transparent',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {dayNumber}
                          </span>
                          
                          {/* Mini indicator dot if there are ongoing rentals */}
                          {groupedDayEvents.ongoing.length > 0 && (
                            <span 
                              title={`${groupedDayEvents.ongoing.length} ใบเช่ากำลังดำเนินอยู่`}
                              style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }}
                            />
                          )}
                        </div>

                        {/* Events list */}
                        <div className="cell-events-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'hidden' }}>
                          
                          {/* Pickups */}
                          {filteredPickups.slice(0, 2).map((group) => {
                            let badgeBg = 'rgba(245, 158, 11, 0.08)'
                            let borderCol = 'var(--warning-color)'
                            let textCol = 'var(--warning-color)'
                            let icon = '📦'

                            if (group.status === 'active') {
                              badgeBg = 'rgba(218, 165, 32, 0.08)'
                              borderCol = 'rgba(218, 165, 32, 0.6)'
                              textCol = '#ead483'
                              icon = '✅'
                            } else if (group.status === 'returned') {
                              badgeBg = 'rgba(16, 185, 129, 0.08)'
                              borderCol = 'var(--success-color)'
                              textCol = 'var(--success-color)'
                              icon = '✅'
                            } else if (group.status === 'overdue') {
                              badgeBg = 'rgba(239, 68, 68, 0.08)'
                              borderCol = 'var(--danger-color)'
                              textCol = 'var(--danger-color)'
                              icon = '⚠️'
                            }

                            return (
                              <div
                                key={`pickup-${group.orderCode}`}
                                style={{
                                  fontSize: '10px',
                                  background: badgeBg,
                                  borderLeft: `3px solid ${borderCol}`,
                                  color: textCol,
                                  padding: '2px 4px',
                                  borderRadius: '2px',
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden'
                                }}
                                title={`📦 รับ/ส่ง: ${group.orderCode} - ${group.customer.fullName} (${getGroupCostumeSummary(group)})`}
                              >
                                {icon} {getGroupShortLabel(group)}
                              </div>
                            )
                          })}

                          {/* Returns */}
                          {filteredReturns.slice(0, 2).map((group) => {
                            let badgeBg = 'rgba(16, 185, 129, 0.08)'
                            let borderCol = 'var(--success-color)'
                            let textCol = 'var(--success-color)'
                            let icon = '↩️'

                            if (group.status === 'overdue') {
                              badgeBg = 'rgba(239, 68, 68, 0.08)'
                              borderCol = 'var(--danger-color)'
                              textCol = 'var(--danger-color)'
                              icon = '⚠️'
                            } else if (group.status === 'booked') {
                              badgeBg = 'rgba(245, 158, 11, 0.08)'
                              borderCol = 'var(--warning-color)'
                              textCol = 'var(--warning-color)'
                              icon = '↩️'
                            } else if (group.status === 'active') {
                              badgeBg = 'rgba(218, 165, 32, 0.08)'
                              borderCol = 'rgba(218, 165, 32, 0.6)'
                              textCol = '#ead483'
                              icon = '↩️'
                            } else if (group.status === 'returned') {
                              badgeBg = 'rgba(16, 185, 129, 0.08)'
                              borderCol = 'var(--success-color)'
                              textCol = 'var(--success-color)'
                              icon = '✅'
                            }

                            return (
                              <div
                                key={`return-${group.orderCode}`}
                                style={{
                                  fontSize: '10px',
                                  background: badgeBg,
                                  borderLeft: `3px solid ${borderCol}`,
                                  color: textCol,
                                  padding: '2px 4px',
                                  borderRadius: '2px',
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden'
                                }}
                                title={`↩️ คืน: ${group.orderCode} - ${group.customer.fullName} (${getGroupCostumeSummary(group)})`}
                              >
                                {icon} {getGroupShortLabel(group)}
                              </div>
                            );
                          })}

                          {/* Overflow text */}
                          {overflowCount > 0 && (
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', paddingLeft: '4px', fontWeight: 600 }}>
                              +{overflowCount} รายการ
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* WEEKLY VIEW LIST */}
            {viewMode === 'week' && (
              <div className="weekly-schedule-list" style={{ display: 'grid', gap: '12px', flex: 1 }}>
                {currentWeekDays.map(({ date, dateStr, dayName }) => {
                  const rawDayEvents = rentalsByDate[dateStr] ?? emptyDayRentals
                  const dayEvents = getDisplayDayRentals(rawDayEvents, dateStr, todayStr)
                  const groupedDayEvents = groupDayRentals(dayEvents)
                  
                  // Apply search query filter to weekly view badges
                  const filteredPickups = groupedDayEvents.pickups.filter((group) => matchesRentalGroupQuery(group, searchQuery))
                  const filteredReturns = groupedDayEvents.returns.filter((group) => matchesRentalGroupQuery(group, searchQuery))
                  const filteredOngoing = groupedDayEvents.ongoing.filter((group) => matchesRentalGroupQuery(group, searchQuery))

                  const isDaySelected = selectedDateStr === dateStr
                  const isDayToday = isToday(dateStr)

                  const ariaLabelText = `วันที่ ${date.getDate()} ${thaiMonths[date.getMonth()]} ${dayName}, รับ/ส่งชุด ${filteredPickups.length} ใบเช่า, คืนชุด ${filteredReturns.length} ใบเช่า`

                  return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedDateStr(dateStr)}
                        className={`weekly-day-row ${isDaySelected ? 'selected' : ''} ${isDayToday ? 'today' : ''}`}
                        tabIndex={0}
                        role="button"
                        aria-label={ariaLabelText}
                        aria-pressed={isDaySelected}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedDateStr(dateStr)
                            e.preventDefault()
                          }
                        }}
                      >
                      {/* Left Side: Date Title */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '12px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>
                          {dayName}
                        </span>
                        <strong style={{ fontSize: '20px', color: isDayToday ? 'var(--text-gold)' : '#fff' }}>
                          {date.getDate()} {thaiMonths[date.getMonth()].slice(0, 3)}
                        </strong>
                        <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          {date.getFullYear() + 543}
                        </small>
                      </div>

                      {/* Right Side: Badges list for the day */}
                      <div style={{ paddingLeft: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        {filteredPickups.length === 0 && filteredReturns.length === 0 && filteredOngoing.length === 0 ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>ไม่มีรายการเช่าหรือส่งคืน</span>
                        ) : (
                          <>
                            {/* Pickups */}
                            {filteredPickups.map((group) => {
                              let badgeBg = 'rgba(245, 158, 11, 0.08)'
                              let borderCol = 'rgba(245, 158, 11, 0.2)'
                              let textCol = 'var(--warning-color)'
                              let label = '📦 รับ/ส่งชุด:'

                              if (group.status === 'active') {
                                badgeBg = 'rgba(218, 165, 32, 0.08)'
                                borderCol = 'rgba(218, 165, 32, 0.3)'
                                textCol = '#ead483'
                                label = '✅ รับมอบแล้ว:'
                              } else if (group.status === 'returned') {
                                badgeBg = 'rgba(16, 185, 129, 0.08)'
                                borderCol = 'rgba(16, 185, 129, 0.2)'
                                textCol = 'var(--success-color)'
                                label = '✅ รับมอบแล้ว:'
                              } else if (group.status === 'overdue') {
                                badgeBg = 'rgba(239, 68, 68, 0.08)'
                                borderCol = 'rgba(239, 68, 68, 0.2)'
                                textCol = 'var(--danger-color)'
                                label = '⚠️ เลยกำหนดส่งมอบ:'
                              }

                              return (
                                <span
                                  key={`pk-${group.orderCode}`}
                                  className="status-pill"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px',
                                    background: badgeBg,
                                    color: textCol,
                                    borderColor: borderCol,
                                    borderWidth: '1px',
                                    borderStyle: 'solid'
                                  }}
                                >
                                  <span>{label}</span>
                                  <strong>{group.customer.fullName}</strong>
                                  <small>({getGroupCostumeSummary(group)})</small>
                                </span>
                              )
                            })}

                            {/* Returns */}
                            {filteredReturns.map((group) => {
                              let badgeBg = 'rgba(16, 185, 129, 0.08)'
                              let borderCol = 'rgba(16, 185, 129, 0.2)'
                              let textCol = 'var(--success-color)'
                              let label = '↩️ คืนชุด:'

                              if (group.status === 'overdue') {
                                badgeBg = 'rgba(239, 68, 68, 0.08)'
                                borderCol = 'rgba(239, 68, 68, 0.2)'
                                textCol = 'var(--danger-color)'
                                label = '⚠️ เลยกำหนดคืน:'
                              } else if (group.status === 'booked') {
                                badgeBg = 'rgba(245, 158, 11, 0.08)'
                                borderCol = 'rgba(245, 158, 11, 0.2)'
                                textCol = 'var(--warning-color)'
                                label = '↩️ รอคืน (ยังไม่รับชุด):'
                              } else if (group.status === 'active') {
                                badgeBg = 'rgba(218, 165, 32, 0.08)'
                                borderCol = 'rgba(218, 165, 32, 0.3)'
                                textCol = '#ead483'
                                label = '↩️ กำหนดคืน:'
                              } else if (group.status === 'returned') {
                                badgeBg = 'rgba(16, 185, 129, 0.08)'
                                borderCol = 'rgba(16, 185, 129, 0.2)'
                                textCol = 'var(--success-color)'
                                label = '✅ คืนเรียบร้อย:'
                              }

                              return (
                                <span
                                  key={`rt-${group.orderCode}`}
                                  className="status-pill"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px',
                                    background: badgeBg,
                                    color: textCol,
                                    borderColor: borderCol,
                                    borderWidth: '1px',
                                    borderStyle: 'solid'
                                  }}
                                >
                                  <span>{label}</span>
                                  <strong>{group.customer.fullName}</strong>
                                  <small>({getGroupCostumeSummary(group)})</small>
                                </span>
                              )
                            })}

                            {/* Ongoing count */}
                            {filteredOngoing.length > 0 && (
                              <span
                                className="status-pill muted"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'rgba(139, 92, 246, 0.08)', color: '#a78bfa', borderColor: 'rgba(139, 92, 246, 0.2)' }}
                              >
                                <span>👗 ค้างเช่า:</span>
                                <strong>{filteredOngoing.length} ใบเช่า</strong>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Right Side Panel / Detail Drawer: Showing details for selected day */}
        {viewMode !== 'list' && (
          <aside className="panel detail-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignSelf: 'start' }}>
            <div className="profile-card-top" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span className="eyebrow" style={{ fontSize: '11px' }}>รายการนัดหมายประจำวัน</span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-gold)', margin: '4px 0 0' }}>
                  {formatThaiDate(selectedDateStr)}
                </h2>
              </div>
              {isToday(selectedDateStr) && (
                <span className="status-pill success" style={{ fontSize: '11px', padding: '4px 8px' }}>วันนี้</span>
              )}
            </div>

            <div className="selected-day-details-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '600px' }}>
              {selectedDayRentalGroups.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <Clock size={32} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>ไม่มีนัดหมายในวันที่เลือก</span>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => triggerCreateRentalForDate(selectedDateStr)}
                    style={{ fontSize: '13px', minHeight: '36px', background: 'rgba(223, 183, 80, 0.05)', border: '1px solid var(--border-gold)', color: 'var(--text-gold)' }}
                  >
                    <Plus size={16} /> สร้างใบเช่าวันนี้
                  </button>
                </div>
              ) : (
                <>
                  <section className="detail-section">
                    <div className="section-title-row" style={{ marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '15px', color: '#fff', margin: 0 }}>รายการใบเช่าในวันนี้ ({selectedDayRentalGroups.length})</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedDayRentalGroups.map((group) => {
                        const isSelected = selectedCalendarRental?.orderCode === group.orderCode

                        return (
                          <button
                            key={group.orderCode}
                            className="secondary-button"
                            type="button"
                            onClick={() => setSelectedOrderCode(group.orderCode)}
                            style={{
                              width: '100%',
                              minHeight: 'auto',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              padding: '14px',
                              borderRadius: '12px',
                              background: isSelected ? 'rgba(223, 183, 80, 0.08)' : 'var(--bg-input)',
                              borderColor: isSelected ? 'var(--border-gold)' : 'var(--border-color)'
                            }}
                          >
                            <div style={{ display: 'grid', gap: '6px', textAlign: 'left' }}>
                              <strong style={{ fontSize: '15px', color: '#fff' }}>{group.orderCode}</strong>
                              <span style={{ fontSize: '13px', color: 'var(--text-bright)' }}>
                                <User size={13} style={{ display: 'inline', marginRight: '6px' }} />
                                {group.customer.fullName}
                              </span>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {group.dayCategories.map((category) => (
                                  <span
                                    key={`${group.orderCode}-${category}`}
                                    className="status-pill muted"
                                    style={{
                                      fontSize: '11px',
                                      padding: '4px 8px',
                                      background: category === 'pickup'
                                        ? 'rgba(245, 158, 11, 0.08)'
                                        : category === 'return'
                                          ? 'rgba(16, 185, 129, 0.08)'
                                          : 'rgba(139, 92, 246, 0.08)',
                                      color: category === 'pickup'
                                        ? 'var(--warning-color)'
                                        : category === 'return'
                                          ? 'var(--success-color)'
                                          : '#a78bfa',
                                      borderColor: category === 'pickup'
                                        ? 'rgba(245, 158, 11, 0.2)'
                                        : category === 'return'
                                          ? 'rgba(16, 185, 129, 0.2)'
                                          : 'rgba(139, 92, 246, 0.2)'
                                    }}
                                  >
                                    {getDayCategoryLabel(category)}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gap: '8px', justifyItems: 'end' }}>
                              {getStatusBadge(group.status)}
                              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{group.rentals.length} ชุด</small>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  {selectedCalendarRental && (
                    <>
                      <section className="detail-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <div className="profile-card-top">
                          <div className="profile-card-info">
                            <div className="profile-avatar">
                              {selectedCalendarRental.customer.fullName.slice(0, 2).toLowerCase()}
                            </div>
                            <div className="profile-meta">
                              <h2 style={{ marginBottom: '4px' }}>ใบเช่า {selectedCalendarRental.orderCode}</h2>
                              <p>
                                <strong>{selectedCalendarRental.customer.fullName}</strong> ({selectedCalendarRental.customer.phone})
                              </p>
                              <p>LINE: {selectedCalendarRental.customer.lineAccount || '-'}</p>
                            </div>
                          </div>
                          {getStatusBadge(selectedCalendarRental.status)}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '18px' }}>
                          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>ช่วงเช่า</span>
                            <strong style={{ fontSize: '14px', color: '#fff' }}>
                              {formatThaiDate(selectedCalendarRental.pickupDate)} - {formatThaiDate(selectedCalendarRental.returnDate)}
                            </strong>
                          </div>
                          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>ยอดเก็บจริง</span>
                            <strong style={{ fontSize: '14px', color: 'var(--text-gold)' }}>{formatBaht(selectedCalendarRental.collectedAmount)}</strong>
                          </div>
                          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>มัดจำรวม</span>
                            <strong style={{ fontSize: '14px', color: '#fff' }}>{formatBaht(selectedCalendarRental.depositAmount)}</strong>
                          </div>
                          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>จำนวนชุด</span>
                            <strong style={{ fontSize: '14px', color: '#fff' }}>{selectedCalendarRental.rentals.length} ชุด</strong>
                          </div>
                        </div>
                      </section>

                      <section className="detail-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <div className="section-title-row">
                          <h3 style={{ fontSize: '15px', color: '#fff', margin: 0 }}>ขนาดสัดส่วน</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
                          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>รอบอก</span>
                            <strong style={{ fontSize: '16px', color: '#fff' }}>
                              {selectedCalendarRental.customer.bustIn ? `${selectedCalendarRental.customer.bustIn}"` : '-'}
                            </strong>
                          </div>
                          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>รอบเอว</span>
                            <strong style={{ fontSize: '16px', color: '#fff' }}>
                              {selectedCalendarRental.customer.waistIn ? `${selectedCalendarRental.customer.waistIn}"` : '-'}
                            </strong>
                          </div>
                          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>สะโพก</span>
                            <strong style={{ fontSize: '16px', color: '#fff' }}>
                              {selectedCalendarRental.customer.hipIn ? `${selectedCalendarRental.customer.hipIn}"` : '-'}
                            </strong>
                          </div>
                          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>ส่วนสูง</span>
                            <strong style={{ fontSize: '16px', color: '#fff' }}>
                              {selectedCalendarRental.customer.heightCm ? `${selectedCalendarRental.customer.heightCm} cm` : '-'}
                            </strong>
                          </div>
                        </div>
                      </section>

                      <section className="detail-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '12px' }}>รายการชุดในใบเช่า</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {selectedCalendarRental.rentals.map((rental) => (
                            <div
                              key={rental.id}
                              style={{
                                display: 'grid',
                                gap: '10px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '14px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                                <div>
                                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#fff' }}>
                                    <Shirt size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    {rental.costume.productName}
                                  </h4>
                                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    SKU: {rental.costume.sku} | สี: {rental.costume.primaryColor} | ไซส์: {rental.costume.size}
                                  </p>
                                </div>
                                {getStatusBadge(rental.status)}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                <div>
                                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>ค่าเช่า</span>
                                  <strong style={{ color: '#fff', fontSize: '13px' }}>{formatBaht(rental.rentalPrice)}</strong>
                                </div>
                                <div>
                                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>มัดจำ</span>
                                  <strong style={{ color: '#fff', fontSize: '13px' }}>{formatBaht(rental.depositAmount)}</strong>
                                </div>
                                <div>
                                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>เก็บจริง</span>
                                  <strong style={{ color: 'var(--text-gold)', fontSize: '13px' }}>{formatBaht(rental.collectedAmount)}</strong>
                                </div>
                              </div>
                              {getDiscountAmount(rental.rentalPrice, rental.collectedAmount) > 0 && (
                                <small style={{ color: 'var(--success-color)', fontSize: '11px' }}>
                                  ส่วนลดรายการนี้: {formatBaht(getDiscountAmount(rental.rentalPrice, rental.collectedAmount))}
                                </small>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>

                      {selectedCalendarRental.notes && (
                        <section className="detail-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                          <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '8px' }}>หมายเหตุ</h3>
                          <p style={{ margin: 0, color: 'var(--text-bright)', whiteSpace: 'pre-wrap', fontSize: '13px' }}>
                            {selectedCalendarRental.notes}
                          </p>
                        </section>
                      )}

                      <section className="detail-section controls-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '12px' }}>การควบคุมใบเช่า</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => openRentalGroup(selectedCalendarRental)}
                            style={{ fontSize: '14px' }}
                          >
                            <Eye size={14} /> ดูใบเช่าชุด
                          </button>

                          {selectedCalendarRental.status === 'booked' && (
                            <button
                              className="primary-button"
                              type="button"
                              onClick={() => updateRentalGroupStatus(selectedCalendarRental, ['booked'], 'active')}
                              style={{ width: '100%', fontSize: '14px', background: 'var(--text-gold)', color: '#000' }}
                            >
                              <Check size={14} /> ส่งมอบชุด
                            </button>
                          )}

                          {(selectedCalendarRental.status === 'active' || selectedCalendarRental.status === 'overdue') && (
                            <button
                              className="primary-button"
                              type="button"
                              onClick={() => updateRentalGroupStatus(selectedCalendarRental, ['active', 'overdue'], 'returned')}
                              style={{ width: '100%', fontSize: '14px', background: 'var(--success-color)', borderColor: 'var(--success-color)', color: '#fff' }}
                            >
                              <Check size={14} /> รับคืนชุด
                            </button>
                          )}
                        </div>

                        {selectedCalendarRental.status === 'returned' && (
                          <div style={{ marginTop: '12px', textAlign: 'center', color: 'var(--success-color)', background: 'var(--success-bg)', borderRadius: '8px', padding: '12px', fontWeight: 600 }}>
                            ใบเช่านี้สิ้นสุดแล้ว (คืนชุดเรียบร้อย)
                          </div>
                        )}
                      </section>
                    </>
                  )}
                </>
              )}
            </div>
          </aside>
        )}

        {/* TIMELINE / LIST VIEW (รายการเช่าทั้งหมด) */}
        {viewMode === 'list' && (
          <div className="panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>
                รายการใบเช่าทั้งหมด ({filteredTimelineRentals.length} ใบเช่า)
              </h2>

              <label className="search-box" style={{ minHeight: '38px', width: '300px', padding: '0 12px' }}>
                <Search size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อชุด, รหัสออเดอร์, ชื่อลูกค้า..."
                  style={{ fontSize: '13px' }}
                />
              </label>
            </div>

            <div className="customer-table" role="table" aria-label="รายการเช่าชุด">
              <div className="table-row table-head" role="row" style={{ gridTemplateColumns: '120px 1fr 1.7fr 150px 120px 120px 90px', minWidth: '860px' }}>
                <span>รหัสออเดอร์</span>
                <span>ลูกค้า</span>
                <span>รายการชุด</span>
                <span>วันที่นัดรับ/ส่ง</span>
                <span>วันที่กำหนดคืน</span>
                <span>สถานะ</span>
                <span>การจัดการ</span>
              </div>

              {paginatedListRentals.map((group) => (
                <div
                  className="table-row"
                  key={group.orderCode}
                  role="row"
                  style={{ gridTemplateColumns: '120px 1fr 1.7fr 150px 120px 120px 90px', minWidth: '860px', minHeight: '60px' }}
                >
                  <strong style={{ color: 'var(--text-gold)' }}>{group.orderCode}</strong>
                  <span>
                    {group.customer.fullName}
                    <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>{group.customer.customerCode}</small>
                  </span>
                  <span>
                    {group.rentals
                      .slice(0, 2)
                      .map((rental) => rental.costume.productName)
                      .join(', ')}
                    {group.rentals.length > 2 && ` และอีก ${group.rentals.length - 2} ชุด`}
                    <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>
                      SKU: {getGroupCostumeSummary(group)}
                    </small>
                  </span>
                  <span>{formatThaiDate(group.pickupDate)}</span>
                  <span>{formatThaiDate(group.returnDate)}</span>
                  <span>{getStatusBadge(group.status)}</span>
                  <span>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => openRentalGroup(group)}
                      style={{ minHeight: '32px', padding: '0 10px', fontSize: '12px' }}
                      title="ดูใบเช่าชุด"
                    >
                      <Eye size={14} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />
                      เปิดดู
                    </button>
                  </span>
                </div>
              ))}

              {filteredTimelineRentals.length === 0 && (
                <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  ไม่พบรายการเช่าชุดที่ค้นหา
                </div>
              )}
            </div>

            {/* List Pagination Footer */}
            {listTotalPages > 1 && (
              <div className="pagination-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                <button
                  className="pagination-btn"
                  disabled={listCurrentPage <= 1}
                  onClick={() => setListCurrentPage((p) => Math.max(p - 1, 1))}
                  type="button"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="page-number-box">{listCurrentPage}</div>
                <button
                  className="pagination-btn"
                  disabled={listCurrentPage >= listTotalPages}
                  onClick={() => setListCurrentPage((p) => Math.min(p + 1, listTotalPages))}
                  type="button"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
