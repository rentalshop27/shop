import { useState, useMemo } from 'react'
import {
  TrendingUp,
  Wallet,
  Calendar,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  Shirt,
  Sparkles,
  ArrowRight,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import type { RentalOrder } from '../rentals/rentalTypes'
import type { StockItem } from '../../App'
import './ReportsPage.css'

// Helper to format currency
function formatBaht(value: number) {
  return `฿${value.toLocaleString('th-TH', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

// Helper to convert date string to UTC timestamp (ms) to avoid timezone offsets
function toUtcDay(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

// Helper to get number of days between two dates inclusive
function getDaysBetween(startStr: string, endStr: string) {
  const start = toUtcDay(startStr)
  const end = toUtcDay(endStr)
  if (end < start) return 0
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
}

// Helper to calculate overlap days between a rental period and a range period
function getOverlapDays(
  rentStartStr: string, rentEndStr: string,
  rangeStartStr: string, rangeEndStr: string
) {
  const rentStart = toUtcDay(rentStartStr)
  const rentEnd = toUtcDay(rentEndStr)
  const rangeStart = toUtcDay(rangeStartStr)
  const rangeEnd = toUtcDay(rangeEndStr)

  const overlapStart = Math.max(rentStart, rangeStart)
  const overlapEnd = Math.min(rentEnd, rangeEnd)

  if (overlapEnd < overlapStart) return 0
  return Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1
}

// Date helper to get string YYYY-MM-DD
function getLocalDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

interface DressReportItem {
  stockItem: StockItem
  rentalCount: number
  totalRevenue: number
  averageRevenue: number
  rentedDays: number
  totalDays: number
  emptyDays: number
  emptyRate: number
}

type SortField = 'rentalCount' | 'totalRevenue' | 'emptyDays' | 'emptyRate'
type SortOrder = 'asc' | 'desc'

export function ReportsPage({
  rentals,
  stockItems,
}: {
  rentals: RentalOrder[]
  stockItems: StockItem[]
}) {
  const [activeSubTab, setActiveSubTab] = useState<'dresses' | 'general'>('dresses')

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [colorFilter, setColorFilter] = useState('all')

  // Date Range Filter States
  const [dateRangeMode, setDateRangeMode] = useState<'all' | '30days' | 'this_month' | '90days' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Sort States
  const [sortField, setSortField] = useState<SortField>('rentalCount')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Get current date as string
  const todayStr = useMemo(() => getLocalDateString(new Date()), [])

  // Categories, Brands, Sizes, Colors list from stockItems for dropdowns
  const categoriesList = useMemo(() => {
    return Array.from(new Set(stockItems.map(item => item.category).filter(Boolean))).sort()
  }, [stockItems])

  const brandsList = useMemo(() => {
    return Array.from(new Set(stockItems.map(item => item.brand).filter(Boolean))).sort()
  }, [stockItems])

  const sizesList = useMemo(() => {
    return Array.from(new Set(stockItems.map(item => item.size).filter(Boolean))).sort()
  }, [stockItems])

  const colorsList = useMemo(() => {
    return Array.from(new Set(stockItems.map(item => item.primaryColor).filter(Boolean))).sort()
  }, [stockItems])

  // Resolve active Date Range
  const activeDateRange = useMemo(() => {
    const end = todayStr
    let start = '2020-01-01' // default earliest date

    if (dateRangeMode === '30days') {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      start = getLocalDateString(d)
    } else if (dateRangeMode === 'this_month') {
      const d = new Date()
      start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    } else if (dateRangeMode === '90days') {
      const d = new Date()
      d.setDate(d.getDate() - 90)
      start = getLocalDateString(d)
    } else if (dateRangeMode === 'custom') {
      if (customStartDate) start = customStartDate
      if (customEndDate) return { start, end: customEndDate }
    } else {
      // 'all' time: Find the earliest creation date of stock items or pickup date of rentals
      const creationDates = stockItems.map(item => item.createdAt ? item.createdAt.substring(0, 10) : '').filter(Boolean)
      const rentalDates = rentals.map(r => r.pickupDate).filter(Boolean)
      const allDates = [...creationDates, ...rentalDates].sort()
      if (allDates.length > 0) {
        start = allDates[0]
      } else {
        start = getLocalDateString(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // 1 year ago fallback
      }
    }
    return { start, end }
  }, [dateRangeMode, customStartDate, customEndDate, stockItems, rentals, todayStr])

  // Calculate stats for all dresses in the selected date range
  const dressReportsData = useMemo<DressReportItem[]>(() => {
    const { start: rangeStart, end: rangeEnd } = activeDateRange

    return stockItems.map(item => {
      // 1. Resolve item creation date
      const itemCreatedStr = item.createdAt ? item.createdAt.substring(0, 10) : ''
      // Effective start is the later of rangeStart or item.createdAt
      const effectiveStart = itemCreatedStr && itemCreatedStr > rangeStart ? itemCreatedStr : rangeStart

      let totalDays = 0
      if (effectiveStart <= rangeEnd) {
        totalDays = getDaysBetween(effectiveStart, rangeEnd)
      }

      // 2. Filter rentals for this stock item that overlap with the range
      const itemRentals = rentals.filter(rental => rental.costume.sku === item.sku)

      let rentalCount = 0
      let totalRevenue = 0
      let rentedDays = 0

      itemRentals.forEach(rental => {
        // We only consider rental orders that fall/overlap with [effectiveStart, rangeEnd]
        const overlap = getOverlapDays(rental.pickupDate, rental.returnDate, effectiveStart, rangeEnd)
        
        if (overlap > 0) {
          // Check if rental is inside range
          // Let's count it as a rental in this period
          rentalCount++
          
          // Calculate Net Revenue = collectedAmount - depositAmount
          // If collectedAmount isn't fully paid or custom, use actual net amount paid
          const netRev = Math.max(0, rental.collectedAmount - rental.depositAmount)
          totalRevenue += netRev
          
          // Add overlap days to rented days
          rentedDays += overlap
        }
      })

      // Adjust rented days to not exceed total active days
      rentedDays = Math.min(totalDays, rentedDays)
      const emptyDays = Math.max(0, totalDays - rentedDays)
      const emptyRate = totalDays > 0 ? (emptyDays / totalDays) * 100 : 0
      const averageRevenue = rentalCount > 0 ? totalRevenue / rentalCount : 0

      return {
        stockItem: item,
        rentalCount,
        totalRevenue,
        averageRevenue,
        rentedDays,
        totalDays,
        emptyDays,
        emptyRate
      }
    })
  }, [stockItems, rentals, activeDateRange])

  // Apply Search, Category, Brand, Size, Color Filters
  const filteredDressReports = useMemo(() => {
    return dressReportsData.filter(item => {
      // Search match (name or SKU)
      const matchSearch =
        searchQuery.trim() === '' ||
        item.stockItem.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.stockItem.sku.toLowerCase().includes(searchQuery.toLowerCase())

      // Category match
      const matchCategory =
        categoryFilter === 'all' ||
        item.stockItem.category === categoryFilter

      // Brand match
      const matchBrand =
        brandFilter === 'all' ||
        item.stockItem.brand === brandFilter

      // Size match
      const matchSize =
        sizeFilter === 'all' ||
        item.stockItem.size === sizeFilter

      // Color match
      const matchColor =
        colorFilter === 'all' ||
        item.stockItem.primaryColor === colorFilter

      return matchSearch && matchCategory && matchBrand && matchSize && matchColor
    })
  }, [dressReportsData, searchQuery, categoryFilter, brandFilter, sizeFilter, colorFilter])

  // Apply Sorting
  const sortedDressReports = useMemo(() => {
    const sorted = [...filteredDressReports]
    sorted.sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      // Tie breaker by SKU
      if (valA === valB) {
        return a.stockItem.sku.localeCompare(b.stockItem.sku)
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1
      } else {
        return valA < valB ? 1 : -1
      }
    })
    return sorted
  }, [filteredDressReports, sortField, sortOrder])

  // Dynamic Highlight Cards (Based on CURRENTLY FILTERED list or ALL list? Usually based on filtered list is cooler!)
  const topStats = useMemo(() => {
    // 1. Most Rented (ชุดที่ถูกเช่าบ่อยที่สุด)
    let mostRented: DressReportItem | null = null
    // 2. Highest Revenue (ชุดที่ทำรายได้สูงสุด)
    let highestRevenue: DressReportItem | null = null
    // 3. Least Rented (ชุดที่ไม่ค่อยถูกเช่า / เช่าน้อยสุด)
    let leastRented: DressReportItem | null = null

    if (dressReportsData.length > 0) {
      // Find top performance from all dresses (to remain stable)
      const sortedByRent = [...dressReportsData].sort((a, b) => b.rentalCount - a.rentalCount)
      const sortedByRev = [...dressReportsData].sort((a, b) => b.totalRevenue - a.totalRevenue)
      const sortedByRentAsc = [...dressReportsData].sort((a, b) => a.rentalCount - b.rentalCount)

      if (sortedByRent[0]?.rentalCount > 0) {
        mostRented = sortedByRent[0]
      }
      if (sortedByRev[0]?.totalRevenue > 0) {
        highestRevenue = sortedByRev[0]
      }
      // Least rented can be 0 or small number
      leastRented = sortedByRentAsc[0] || null
    }

    return { mostRented, highestRevenue, leastRented }
  }, [dressReportsData])

  // General Store Revenue Metrics (Tab 2)
  const generalStoreMetrics = useMemo(() => {
    const totalRentalsCount = rentals.length
    const totalRevenue = rentals.reduce((sum, r) => sum + Math.max(0, r.collectedAmount - r.depositAmount), 0)
    const avgOrderValue = totalRentalsCount > 0 ? totalRevenue / totalRentalsCount : 0

    // Group rentals by status
    const statusCounts = rentals.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalRentalsCount,
      totalRevenue,
      avgOrderValue,
      statusCounts
    }
  }, [rentals])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc') // default to desc for new fields
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
  };

  return (
    <div className="reports-page-container">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <p className="eyebrow">REPORTS & ANALYTICS</p>
          <h1>รายงานและสถิติ</h1>
          <p className="subtitle">วิเคราะห์ข้อมูลรายได้ ยอดเช่า และประสิทธิภาพของชุดในร้าน</p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="reports-tab-switcher">
          <button
            className={`reports-subtab-btn ${activeSubTab === 'dresses' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('dresses')}
            type="button"
          >
            <Shirt size={18} />
            <span>รายงานชุดขายดี / ชุดทำเงิน</span>
          </button>
          <button
            className={`reports-subtab-btn ${activeSubTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('general')}
            type="button"
          >
            <BarChart3 size={18} />
            <span>รายงานยอดเช่า / รายได้รวม</span>
          </button>
        </div>
      </header>

      {/* TAB 1: DRESSES REPORTS */}
      {activeSubTab === 'dresses' && (
        <>
          {/* Top 3 Highlight Cards */}
          <section className="reports-highlight-grid" aria-label="ชุดเด่น">
            {/* 1. Most Rented */}
            <div className="report-highlight-card gold-border">
              <div className="card-badge gold-bg">
                <Sparkles size={14} />
                <span>เช่าบ่อยที่สุด</span>
              </div>
              {topStats.mostRented ? (
                <div className="highlight-content">
                  <div className="highlight-img">
                    {topStats.mostRented.stockItem.imageUrls?.[0] ? (
                      <img src={topStats.mostRented.stockItem.imageUrls[0]} alt={topStats.mostRented.stockItem.productName} />
                    ) : (
                      <div className="placeholder-img"><Shirt size={24} /></div>
                    )}
                  </div>
                  <div className="highlight-details">
                    <h3>{topStats.mostRented.stockItem.productName}</h3>
                    <p className="sku-code">{topStats.mostRented.stockItem.sku}</p>
                    <div className="highlight-metrics">
                      <div>
                        <span className="label">จำนวนครั้งที่เช่า</span>
                        <span className="value gold-color">{topStats.mostRented.rentalCount} ครั้ง</span>
                      </div>
                      <div>
                        <span className="label">รายได้รวม</span>
                        <span className="value">{formatBaht(topStats.mostRented.totalRevenue)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="no-data-text">ไม่มีข้อมูลการเช่าในช่วงนี้</p>
              )}
            </div>

            {/* 2. Highest Revenue */}
            <div className="report-highlight-card green-border">
              <div className="card-badge green-bg">
                <Wallet size={14} />
                <span>รายได้สูงสุด</span>
              </div>
              {topStats.highestRevenue ? (
                <div className="highlight-content">
                  <div className="highlight-img">
                    {topStats.highestRevenue.stockItem.imageUrls?.[0] ? (
                      <img src={topStats.highestRevenue.stockItem.imageUrls[0]} alt={topStats.highestRevenue.stockItem.productName} />
                    ) : (
                      <div className="placeholder-img"><Shirt size={24} /></div>
                    )}
                  </div>
                  <div className="highlight-details">
                    <h3>{topStats.highestRevenue.stockItem.productName}</h3>
                    <p className="sku-code">{topStats.highestRevenue.stockItem.sku}</p>
                    <div className="highlight-metrics">
                      <div>
                        <span className="label">รายได้รวม</span>
                        <span className="value green-color">{formatBaht(topStats.highestRevenue.totalRevenue)}</span>
                      </div>
                      <div>
                        <span className="label">จำนวนครั้งที่เช่า</span>
                        <span className="value">{topStats.highestRevenue.rentalCount} ครั้ง</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="no-data-text">ไม่มีข้อมูลรายได้ในช่วงนี้</p>
              )}
            </div>

            {/* 3. Least Rented / Cold Dress */}
            <div className="report-highlight-card gray-border">
              <div className="card-badge gray-bg">
                <Clock size={14} />
                <span>เช่าน้อยที่สุด / ว่างเยอะ</span>
              </div>
              {topStats.leastRented ? (
                <div className="highlight-content">
                  <div className="highlight-img">
                    {topStats.leastRented.stockItem.imageUrls?.[0] ? (
                      <img src={topStats.leastRented.stockItem.imageUrls[0]} alt={topStats.leastRented.stockItem.productName} />
                    ) : (
                      <div className="placeholder-img"><Shirt size={24} /></div>
                    )}
                  </div>
                  <div className="highlight-details">
                    <h3>{topStats.leastRented.stockItem.productName}</h3>
                    <p className="sku-code">{topStats.leastRented.stockItem.sku}</p>
                    <div className="highlight-metrics">
                      <div>
                        <span className="label">เช่าไปเพียง</span>
                        <span className="value warning-color">{topStats.leastRented.rentalCount} ครั้ง</span>
                      </div>
                      <div>
                        <span className="label">อัตราว่าง</span>
                        <span className="value">{topStats.leastRented.emptyRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="no-data-text">ไม่มีข้อมูลชุดในระบบ</p>
              )}
            </div>
          </section>

          {/* Search & Filters Section */}
          <section className="reports-filter-section" aria-label="ตัวกรองรายงาน">
            {/* Line 1: Search & Date Range */}
            <div className="filter-row-1">
              <div className="search-box-container">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อชุด หรือ SKU..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="reports-search-input"
                />
              </div>

              <div className="date-range-container">
                <Calendar size={18} className="calendar-icon" />
                <select
                  value={dateRangeMode}
                  onChange={e => setDateRangeMode(e.target.value as any)}
                  className="reports-select-input date-mode-select"
                >
                  <option value="all">ทั้งหมด (ตั้งแต่เปิดร้าน)</option>
                  <option value="30days">30 วันล่าสุด</option>
                  <option value="this_month">เดือนนี้</option>
                  <option value="90days">90 วันล่าสุด</option>
                  <option value="custom">กำหนดช่วงเวลาเอง...</option>
                </select>

                {dateRangeMode === 'custom' && (
                  <div className="custom-date-inputs">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="reports-date-input"
                      aria-label="วันที่เริ่มต้น"
                    />
                    <ArrowRight size={14} className="date-connector" />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="reports-date-input"
                      aria-label="วันที่สิ้นสุด"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Line 2: Advanced Dropdowns */}
            <div className="filter-row-2">
              <div className="dropdown-item">
                <label>หมวดหมู่</label>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="reports-select-input">
                  <option value="all">ทั้งหมด</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="dropdown-item">
                <label>แบรนด์</label>
                <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="reports-select-input">
                  <option value="all">ทั้งหมด</option>
                  {brandsList.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="dropdown-item">
                <label>ไซซ์</label>
                <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)} className="reports-select-input">
                  <option value="all">ทั้งหมด</option>
                  {sizesList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="dropdown-item">
                <label>สีหลัก</label>
                <select value={colorFilter} onChange={e => setColorFilter(e.target.value)} className="reports-select-input">
                  <option value="all">ทั้งหมด</option>
                  {colorsList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <button
                className="clear-filter-btn"
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
                  setBrandFilter('all')
                  setSizeFilter('all')
                  setColorFilter('all')
                  setDateRangeMode('all')
                }}
                type="button"
                title="ล้างตัวกรองทั้งหมด"
              >
                <RefreshCw size={16} />
                <span>รีเซ็ตตัวกรอง</span>
              </button>
            </div>

            {/* Active Range Info Bar */}
            <div className="active-range-info">
              <Info size={14} />
              <span>
                กำลังแสดงรายงานวิเคราะห์ตั้งแต่วันที่ <strong>{activeDateRange.start}</strong> ถึง <strong>{activeDateRange.end}</strong>
              </span>
            </div>
          </section>

          {/* Reports Grid/Table Section */}
          <section className="reports-table-container">
            <div className="reports-table-header-row">
              <h2>สถิติชุดเช่าในระบบ ({sortedDressReports.length} ชุด)</h2>
              <div className="legend-indicator">
                <span className="dot gold"></span> เช่าบ่อย (≥ 5 ครั้ง)
                <span className="dot green"></span> รายได้ดี (≥ ฿5,000)
                <span className="dot gray"></span> เช่าน้อย (0-1 ครั้ง)
              </div>
            </div>

            {/* Grid Table */}
            <div className="rep-table" role="table" aria-label="ตารางรายงานชุดเช่า">
              <div className="rep-row rep-head" role="row">
                <span>รูป</span>
                <span>SKU</span>
                <span>ชื่อชุด</span>
                <span className="sortable-header" onClick={() => handleSort('rentalCount')} role="columnheader">
                  จำนวนเช่า {getSortIcon('rentalCount')}
                </span>
                <span className="sortable-header" onClick={() => handleSort('totalRevenue')} role="columnheader">
                  รายได้รวม {getSortIcon('totalRevenue')}
                </span>
                <span>เฉลี่ย/ครั้ง</span>
                <span>วันเช่าสะสม</span>
                <span className="sortable-header" onClick={() => handleSort('emptyDays')} role="columnheader">
                  วันว่าง {getSortIcon('emptyDays')}
                </span>
                <span className="sortable-header" onClick={() => handleSort('emptyRate')} role="columnheader">
                  อัตราว่าง {getSortIcon('emptyRate')}
                </span>
              </div>

              {sortedDressReports.length === 0 ? (
                <div className="no-reports-data">
                  <Shirt size={48} className="no-data-icon" />
                  <p>ไม่พบข้อมูลชุดที่ตรงกับตัวกรองของคุณ</p>
                  <small>ลองเปลี่ยนคีย์เวิร์ด หรือรีเซ็ตตัวกรองใหม่</small>
                </div>
              ) : (
                sortedDressReports.map(item => {
                  // Badges indicators
                  const isTopRented = item.rentalCount >= 5
                  const isTopRevenue = item.totalRevenue >= 5000
                  const isLowRented = item.rentalCount <= 1

                  let rowBorderClass = ''
                  if (isTopRented && isTopRevenue) rowBorderClass = 'super-premium'
                  else if (isTopRented) rowBorderClass = 'gold-status'
                  else if (isTopRevenue) rowBorderClass = 'green-status'
                  else if (isLowRented) rowBorderClass = 'cold-status'

                  return (
                    <div className={`rep-row ${rowBorderClass}`} key={item.stockItem.id} role="row">
                      {/* Image */}
                      <div className="rep-img-cell">
                        {item.stockItem.imageUrls?.[0] ? (
                          <img src={item.stockItem.imageUrls[0]} alt={item.stockItem.productName} />
                        ) : (
                          <div className="placeholder-thumbnail"><Shirt size={16} /></div>
                        )}
                      </div>

                      {/* SKU */}
                      <strong className="rep-sku-cell">{item.stockItem.sku}</strong>

                      {/* Product Name & details */}
                      <div className="rep-name-cell">
                        <span className="product-name">{item.stockItem.productName}</span>
                        <span className="product-meta">
                          {[item.stockItem.brand, item.stockItem.category, item.stockItem.size].filter(Boolean).join(' | ')}
                        </span>
                      </div>

                      {/* Rental Count */}
                      <div className="rep-count-cell">
                        <span className={`count-badge ${isTopRented ? 'high' : isLowRented ? 'low' : ''}`}>
                          {item.rentalCount} ครั้ง
                        </span>
                      </div>

                      {/* Total Revenue */}
                      <div className="rep-revenue-cell">
                        <span className={`revenue-text ${isTopRevenue ? 'high' : ''}`}>
                          {formatBaht(item.totalRevenue)}
                        </span>
                      </div>

                      {/* Average Revenue per Rental */}
                      <div className="rep-avg-cell text-muted">
                        {formatBaht(item.averageRevenue)}
                      </div>

                      {/* Rented Days */}
                      <div className="rep-rentdays-cell text-center">
                        {item.rentedDays} วัน
                      </div>

                      {/* Empty Days */}
                      <div className="rep-empty-cell text-center">
                        <span className={item.emptyDays > 15 ? 'warning-text' : ''}>
                          {item.emptyDays} วัน
                        </span>
                        <small className="days-total-text">/ {item.totalDays} วัน</small>
                      </div>

                      {/* Empty Rate % */}
                      <div className="rep-rate-cell">
                        <div className="progress-bar-container">
                          <div
                            className={`progress-bar ${item.emptyRate > 75 ? 'danger' : item.emptyRate < 30 ? 'success' : 'warning'}`}
                            style={{ width: `${item.emptyRate}%` }}
                          />
                        </div>
                        <span className="rate-value">{item.emptyRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </>
      )}

      {/* TAB 2: GENERAL STORE REVENUE REPORTS */}
      {activeSubTab === 'general' && (
        <div className="general-reports-panel">
          <section className="general-overview-grid">
            <div className="overview-metric-card">
              <div className="card-icon-round green-bg">
                <Wallet size={24} />
              </div>
              <div className="card-info">
                <span className="card-label">รายได้สุทธิร้านค้ารวม</span>
                <h2 className="card-value green-color">{formatBaht(generalStoreMetrics.totalRevenue)}</h2>
                <p className="card-sub">คำนวณจาก (ยอดรับชำระทั้งหมด - ค่าประกัน) จากใบเช่าทั้งหมดในระบบ</p>
              </div>
            </div>

            <div className="overview-metric-card gold-bg-opacity">
              <div className="card-icon-round gold-bg">
                <TrendingUp size={24} />
              </div>
              <div className="card-info">
                <span className="card-label">จำนวนการเช่ารวมทั้งหมด</span>
                <h2 className="card-value gold-color">{generalStoreMetrics.totalRentalsCount} ครั้ง</h2>
                <p className="card-sub">จำนวนใบเช่าที่เกิดขึ้นแล้วทั้งหมดในฐานข้อมูล</p>
              </div>
            </div>

            <div className="overview-metric-card purple-bg-opacity">
              <div className="card-icon-round purple-bg">
                <Sparkles size={24} />
              </div>
              <div className="card-info">
                <span className="card-label">รายได้เฉลี่ยต่อบิลเช่า</span>
                <h2 className="card-value purple-color">{formatBaht(generalStoreMetrics.avgOrderValue)}</h2>
                <p className="card-sub">รายได้จากการเช่าเฉลี่ยต่อหนึ่งรายการเช่า</p>
              </div>
            </div>
          </section>

          <section className="status-breakdown-section">
            <h2>สัดส่วนสถานะใบเช่าในระบบ</h2>
            <div className="status-breakdown-grid">
              <div className="status-item booked">
                <span className="status-dot warning"></span>
                <span className="status-label">จองแล้ว (รอส่งมอบ):</span>
                <strong>{generalStoreMetrics.statusCounts['booked'] || 0} รายการ</strong>
              </div>
              <div className="status-item active">
                <span className="status-dot info"></span>
                <span className="status-label">ใช้งานอยู่ (เช่าออกไป):</span>
                <strong>{generalStoreMetrics.statusCounts['active'] || 0} รายการ</strong>
              </div>
              <div className="status-item overdue">
                <span className="status-dot danger"></span>
                <span className="status-label">เกินกำหนดส่งคืน:</span>
                <strong className="danger-color">{generalStoreMetrics.statusCounts['overdue'] || 0} รายการ</strong>
              </div>
              <div className="status-item returned">
                <span className="status-dot success"></span>
                <span className="status-label">ส่งคืนเรียบร้อยแล้ว:</span>
                <strong>{generalStoreMetrics.statusCounts['returned'] || 0} รายการ</strong>
              </div>
            </div>
          </section>

          {/* Informational Widget */}
          <section className="reports-upcoming-notice">
            <div className="notice-icon">
              <Info size={28} />
            </div>
            <div className="notice-content">
              <h3>ระบบวิเคราะห์เชิงลึกกำลังพัฒนาเพิ่มเติม</h3>
              <p>
                ในเฟสถัดไปของหน้ารายงานรวม ระบบจะเพิ่มกราฟเส้นแสดงแนวโน้มรายได้รายเดือน (Monthly Revenue Trends),
                สัดส่วนรายได้แยกตามประเภทชุด (Revenue by Category Pie Chart), และรายงานสรุปเงินประกันค้างคืนสะสมในแต่ละเดือน
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
