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
  ListTodo
} from 'lucide-react'
import type { RentalOrder, RentalStatus } from '../rentals/rentalTypes'

interface CalendarPageProps {
  rentals: RentalOrder[]
  onUpdateRentalStatus: (rentalId: string, status: RentalStatus) => void
  onNavigateToRentals: (rentalId: string) => void
  onNavigateToCreateRental: (pickupDate: string, returnDate: string) => void
}

const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

export function CalendarPage({
  rentals,
  onUpdateRentalStatus,
  onNavigateToRentals,
  onNavigateToCreateRental
}: CalendarPageProps) {
  // Calendar View states
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return toLocalDateStr(new Date())
  })
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [listCurrentPage, setListCurrentPage] = useState(1)
  const listPageSize = 10

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
    if (!selectedDateStr) return { pickups: [], returns: [], ongoing: [] }
    return rentalsByDate[selectedDateStr] ?? { pickups: [], returns: [], ongoing: [] }
  }, [selectedDateStr, rentalsByDate])

  // Filter rentals for Timeline Schedule View based on query
  const filteredTimelineRentals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const list = [...rentals]

    // Sort by pickup date ascending
    list.sort((a, b) => a.pickupDate.localeCompare(b.pickupDate))

    if (!query) return list

    return list.filter((r) => {
      return (
        r.orderCode.toLowerCase().includes(query) ||
        r.customer.fullName.toLowerCase().includes(query) ||
        r.costume.productName.toLowerCase().includes(query) ||
        r.costume.sku.toLowerCase().includes(query) ||
        r.pickupDate.includes(query) ||
        r.returnDate.includes(query)
      )
    })
  }, [rentals, searchQuery])

  // Paginated rentals for timeline schedule list view
  const paginatedListRentals = useMemo(() => {
    const startIndex = (listCurrentPage - 1) * listPageSize
    return filteredTimelineRentals.slice(startIndex, startIndex + listPageSize)
  }, [filteredTimelineRentals, listCurrentPage])

  const listTotalPages = Math.ceil(filteredTimelineRentals.length / listPageSize) || 1

  // Get status tag mapping
  const getStatusBadge = (status: RentalStatus) => {
    switch (status) {
      case 'booked':
        return <span className="status-pill warning" style={{ fontSize: '12px', padding: '4px 10px' }}>จอง</span>
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

  return (
    <div className="calendar-page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">Precious Shop</p>
          <h1>หน้าปฏิทินเช่า/คืน</h1>
          <p className="subtitle">ปฏิทินตรวจสอบรายการจอง รับ/ส่งชุด และส่งคืนเสื้อผ้าประจำเดือน</p>
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
                    const dayEvents = rentalsByDate[dateStr] || { pickups: [], returns: [], ongoing: [] }
                    
                    // Apply search query filter to badges
                    const filteredPickups = dayEvents.pickups.filter(r => 
                      !searchQuery || 
                      r.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.costume.productName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    const filteredReturns = dayEvents.returns.filter(r => 
                      !searchQuery || 
                      r.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.costume.productName.toLowerCase().includes(searchQuery.toLowerCase())
                    )

                    const isDaySelected = selectedDateStr === dateStr
                    const isDayToday = isToday(dateStr)

                    const displayedCount = Math.min(filteredPickups.length, 2) + Math.min(filteredReturns.length, 2)
                    const totalCount = filteredPickups.length + filteredReturns.length
                    const overflowCount = totalCount - displayedCount

                    const ariaLabelText = `วันที่ ${dayNumber} ${isCurrentMonth ? thaiMonths[month] : ''} ${isDayToday ? '(วันนี้)' : ''}${filteredPickups.length > 0 ? `, รับ/ส่งชุด ${filteredPickups.length} รายการ` : ''}${filteredReturns.length > 0 ? `, คืนชุด ${filteredReturns.length} รายการ` : ''}${dayEvents.ongoing.length > 0 ? `, อยู่ระหว่างเช่า ${dayEvents.ongoing.length} รายการ` : ''}`

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
                          {dayEvents.ongoing.length > 0 && (
                            <span 
                              title={`${dayEvents.ongoing.length} ชุดกำลังเช่า`}
                              style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }}
                            />
                          )}
                        </div>

                        {/* Events list */}
                        <div className="cell-events-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'hidden' }}>
                          
                          {/* Pickups */}
                          {filteredPickups.slice(0, 2).map((rental) => (
                            <div
                              key={`pickup-${rental.id}`}
                              style={{
                                fontSize: '10px',
                                background: 'rgba(245, 158, 11, 0.08)',
                                borderLeft: '3px solid var(--warning-color)',
                                color: 'var(--warning-color)',
                                padding: '2px 4px',
                                borderRadius: '2px',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden'
                              }}
                              title={`📦 รับ/ส่ง: ${rental.customer.fullName} - ${rental.costume.productName}`}
                            >
                              📦 {rental.customer.fullName.split(' ')[0]}
                            </div>
                          ))}

                          {/* Returns */}
                          {filteredReturns.slice(0, 2).map((rental) => {
                            let badgeBg = 'rgba(16, 185, 129, 0.08)'
                            let borderCol = 'var(--success-color)'
                            let textCol = 'var(--success-color)'

                            if (rental.status === 'overdue') {
                              badgeBg = 'rgba(239, 68, 68, 0.08)'
                              borderCol = 'var(--danger-color)'
                              textCol = 'var(--danger-color)'
                            } else if (rental.status === 'booked') {
                              badgeBg = 'rgba(245, 158, 11, 0.08)'
                              borderCol = 'var(--warning-color)'
                              textCol = 'var(--warning-color)'
                            }

                            return (
                              <div
                                key={`return-${rental.id}`}
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
                                title={`↩️ คืน: ${rental.customer.fullName} - ${rental.costume.productName}`}
                              >
                                ↩️ {rental.customer.fullName.split(' ')[0]}
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
                  const dayEvents = rentalsByDate[dateStr] || { pickups: [], returns: [], ongoing: [] }
                  
                  // Apply search query filter to weekly view badges
                  const filteredPickups = dayEvents.pickups.filter(r => 
                    !searchQuery || 
                    r.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.costume.productName.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  const filteredReturns = dayEvents.returns.filter(r => 
                    !searchQuery || 
                    r.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.costume.productName.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  const filteredOngoing = dayEvents.ongoing.filter(r => 
                    !searchQuery || 
                    r.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.costume.productName.toLowerCase().includes(searchQuery.toLowerCase())
                  )

                  const isDaySelected = selectedDateStr === dateStr
                  const isDayToday = isToday(dateStr)

                  const ariaLabelText = `วันที่ ${date.getDate()} ${thaiMonths[date.getMonth()]} ${dayName}, รับ/ส่งชุด ${filteredPickups.length} รายการ, คืนชุด ${filteredReturns.length} รายการ`

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
                            {filteredPickups.map((r) => (
                              <span
                                key={`pk-${r.id}`}
                                className="status-pill warning"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'rgba(245, 158, 11, 0.08)' }}
                              >
                                <span>📦 รับ/ส่งชุด:</span>
                                <strong>{r.customer.fullName}</strong>
                                <small>({r.costume.sku})</small>
                              </span>
                            ))}

                            {/* Returns */}
                            {filteredReturns.map((r) => (
                              <span
                                key={`rt-${r.id}`}
                                className="status-pill success"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '12px',
                                  background: r.status === 'overdue' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                  color: r.status === 'overdue' ? 'var(--danger-color)' : 'var(--success-color)',
                                  borderColor: r.status === 'overdue' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
                                }}
                              >
                                <span>↩️ คืนชุด:</span>
                                <strong>{r.customer.fullName}</strong>
                                <small>({r.costume.sku})</small>
                              </span>
                            ))}

                            {/* Ongoing count */}
                            {filteredOngoing.length > 0 && (
                              <span
                                className="status-pill muted"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'rgba(139, 92, 246, 0.08)', color: '#a78bfa', borderColor: 'rgba(139, 92, 246, 0.2)' }}
                              >
                                <span>👗 ค้างเช่า:</span>
                                <strong>{filteredOngoing.length} ชุด</strong>
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
              
              {/* Category 1: PICKUPS (นัดรับ/ส่งชุด) */}
              <div>
                <h3 style={{ fontSize: '14px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '10px', display: 'flex', justifyItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--warning-color)' }}>📦</span>
                  รายการรับ/ส่งชุด ({selectedDayRentals.pickups.length})
                </h3>
                
                {selectedDayRentals.pickups.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0' }}>ไม่มีกำหนดรับ/ส่งชุดในวันนี้</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedDayRentals.pickups.map((rental) => (
                      <div key={`pk-detail-${rental.id}`} className={`event-detail-item-card status-${rental.status}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '14px', color: '#fff' }}>{rental.orderCode}</strong>
                          {getStatusBadge(rental.status)}
                        </div>
                        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-bright)' }}>
                          <div><User size={13} style={{ display: 'inline', marginRight: '6px' }} /> {rental.customer.fullName}</div>
                          <div><Shirt size={13} style={{ display: 'inline', marginRight: '6px' }} /> {rental.costume.productName} ({rental.costume.sku})</div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                          <button
                            className="secondary-button"
                            onClick={() => onNavigateToRentals(rental.id)}
                            aria-label={`ดูรายละเอียดใบเช่าชุด ${rental.orderCode}`}
                            style={{ flex: 1, minHeight: '32px', fontSize: '12px', padding: '0 8px' }}
                          >
                            <Eye size={12} /> ดูใบเช่าชุด
                          </button>
                          
                          {rental.status === 'booked' && (
                            <button
                              className="primary-button"
                              onClick={() => onUpdateRentalStatus(rental.id, 'active')}
                              aria-label={`ดำเนินการส่งมอบชุดสำหรับใบเช่า ${rental.orderCode}`}
                              style={{ flex: 1, minHeight: '32px', fontSize: '12px', padding: '0 8px', background: 'var(--text-gold)', color: '#000' }}
                            >
                              <Check size={12} /> ส่งมอบชุด
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category 2: RETURNS (กำหนดคืนชุด) */}
              <div style={{ marginTop: '12px' }}>
                <h3 style={{ fontSize: '14px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '10px', display: 'flex', justifyItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--success-color)' }}>↩️</span>
                  รายการคืนชุด ({selectedDayRentals.returns.length})
                </h3>
                
                {selectedDayRentals.returns.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0' }}>ไม่มีกำหนดคืนชุดในวันนี้</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedDayRentals.returns.map((rental) => (
                      <div key={`rt-detail-${rental.id}`} className={`event-detail-item-card status-${rental.status}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '14px', color: '#fff' }}>{rental.orderCode}</strong>
                          {getStatusBadge(rental.status)}
                        </div>
                        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-bright)' }}>
                          <div><User size={13} style={{ display: 'inline', marginRight: '6px' }} /> {rental.customer.fullName}</div>
                          <div><Shirt size={13} style={{ display: 'inline', marginRight: '6px' }} /> {rental.costume.productName} ({rental.costume.sku})</div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                          <button
                            className="secondary-button"
                            onClick={() => onNavigateToRentals(rental.id)}
                            aria-label={`ดูรายละเอียดใบเช่าชุด ${rental.orderCode}`}
                            style={{ flex: 1, minHeight: '32px', fontSize: '12px', padding: '0 8px' }}
                          >
                            <Eye size={12} /> ดูใบเช่าชุด
                          </button>
                          
                          {(rental.status === 'active' || rental.status === 'overdue') && (
                            <button
                              className="primary-button"
                              onClick={() => onUpdateRentalStatus(rental.id, 'returned')}
                              aria-label={`ดำเนินการรับคืนชุดสำหรับใบเช่า ${rental.orderCode}`}
                              style={{ flex: 1, minHeight: '32px', fontSize: '12px', padding: '0 8px', background: 'var(--success-color)', borderColor: 'var(--success-color)', color: '#fff' }}
                            >
                              <Check size={12} /> รับคืนชุด
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category 3: ONGOING (ค้างเช่าอยู่ในบ้าน) */}
              <div style={{ marginTop: '12px' }}>
                <h3 style={{ fontSize: '14px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '10px', display: 'flex', justifyItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#8b5cf6' }}>👗</span>
                  รายการอยู่ระหว่างการเช่า ({selectedDayRentals.ongoing.length})
                </h3>
                
                {selectedDayRentals.ongoing.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0' }}>ไม่มีชุดอยู่ระหว่างเช่าในวันนี้</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedDayRentals.ongoing.map((rental) => (
                      <div key={`og-detail-${rental.id}`} className={`event-detail-item-card status-${rental.status}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '14px', color: '#fff' }}>{rental.orderCode}</strong>
                          {getStatusBadge(rental.status)}
                        </div>
                        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-bright)' }}>
                          <div><User size={13} style={{ display: 'inline', marginRight: '6px' }} /> {rental.customer.fullName}</div>
                          <div><Shirt size={13} style={{ display: 'inline', marginRight: '6px' }} /> {rental.costume.productName} ({rental.costume.sku})</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                            ช่วงเวลา: {rental.pickupDate} ถึง {rental.returnDate}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                          <button
                            className="secondary-button"
                            onClick={() => onNavigateToRentals(rental.id)}
                            aria-label={`ดูรายละเอียดใบเช่าชุด ${rental.orderCode}`}
                            style={{ width: '100%', minHeight: '32px', fontSize: '12px', padding: '0 8px' }}
                          >
                            <Eye size={12} /> ดูใบเช่าชุด
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Day Actions */}
              {selectedDayRentals.pickups.length === 0 && selectedDayRentals.returns.length === 0 && selectedDayRentals.ongoing.length === 0 && (
                <div style={{ padding: '30px 10px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <Clock size={32} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>ไม่มีนัดหมายในวันที่เลือก</span>
                  <button
                    className="primary-button"
                    onClick={() => triggerCreateRentalForDate(selectedDateStr)}
                    style={{ fontSize: '13px', minHeight: '36px', background: 'rgba(223, 183, 80, 0.05)', border: '1px solid var(--border-gold)', color: 'var(--text-gold)' }}
                  >
                    <Plus size={16} /> สร้างใบเช่าวันนี้
                  </button>
                </div>
              )}

            </div>
          </aside>
        )}

        {/* TIMELINE / LIST VIEW (รายการเช่าทั้งหมด) */}
        {viewMode === 'list' && (
          <div className="panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>
                รายการจองและเช่าทั้งหมด ({filteredTimelineRentals.length} รายการ)
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

            <div className="customer-table" role="table" aria-label="รายการจองเช่าชุด">
              <div className="table-row table-head" role="row" style={{ gridTemplateColumns: '120px 1fr 1.5fr 160px 120px 140px 80px', minWidth: '800px' }}>
                <span>รหัสออเดอร์</span>
                <span>ลูกค้า</span>
                <span>รายการชุด</span>
                <span>วันที่นัดรับ/ส่ง</span>
                <span>วันที่กำหนดคืน</span>
                <span>สถานะ</span>
                <span>การจัดการ</span>
              </div>

              {paginatedListRentals.map((rental) => (
                <div
                  className="table-row"
                  key={rental.id}
                  role="row"
                  style={{ gridTemplateColumns: '120px 1fr 1.5fr 160px 120px 140px 80px', minWidth: '800px', minHeight: '60px' }}
                >
                  <strong style={{ color: 'var(--text-gold)' }}>{rental.orderCode}</strong>
                  <span>
                    {rental.customer.fullName}
                    <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>{rental.customer.customerCode}</small>
                  </span>
                  <span>
                    {rental.costume.productName}
                    <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>SKU: {rental.costume.sku} | ไซส์: {rental.costume.size}</small>
                  </span>
                  <span>{formatThaiDate(rental.pickupDate)}</span>
                  <span>{formatThaiDate(rental.returnDate)}</span>
                  <span>{getStatusBadge(rental.status)}</span>
                  <span>
                    <button
                      className="secondary-button"
                      onClick={() => onNavigateToRentals(rental.id)}
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
