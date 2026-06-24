import type { RentalOrder, RentalStatus } from '../rentals/rentalTypes'
import type { StockItem } from '../inventory/inventoryTypes'

export type DateRangeMode = 'all' | '30days' | 'this_month' | '90days' | 'custom'

export interface DateRange {
  start: string
  end: string
}

export interface DressReportItem {
  stockItem: StockItem
  rentalCount: number
  totalRevenue: number
  averageRevenue: number
  rentedDays: number
  totalDays: number
  emptyDays: number
  emptyRate: number
}

export interface GeneralStoreMetrics {
  totalRentalsCount: number
  totalRevenue: number
  avgOrderValue: number
  statusCounts: Partial<Record<RentalStatus, number>>
  monthlyRevenueTrends: MonthlyRevenueTrend[]
  revenueByCategory: CategoryRevenueSlice[]
  monthlyDepositSummary: MonthlyDepositSummary[]
  totalDepositCollected: number
  totalDepositHeld: number
  totalDepositInReturnedOrders: number
}

export interface MonthlyRevenueTrend {
  month: string
  revenue: number
  rentalCount: number
}

export interface CategoryRevenueSlice {
  category: string
  revenue: number
  rentalCount: number
  percentage: number
}

export interface MonthlyDepositSummary {
  month: string
  depositCollected: number
  depositHeld: number
  depositInReturnedOrders: number
  rentalCount: number
}

function toUtcDay(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function getDaysBetween(startStr: string, endStr: string) {
  const start = toUtcDay(startStr)
  const end = toUtcDay(endStr)
  if (end < start) return 0
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
}

function getOverlapDays(
  rentStartStr: string,
  rentEndStr: string,
  rangeStartStr: string,
  rangeEndStr: string,
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

function getLocalDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isDateInRange(dateStr: string, range: DateRange) {
  return dateStr >= range.start && dateStr <= range.end
}

function calculateNetRentalRevenue(rental: RentalOrder) {
  return Math.max(0, rental.collectedAmount - rental.depositAmount)
}

function getMonthKey(dateStr: string) {
  return dateStr.substring(0, 7)
}

function addMonths(month: string, count: number) {
  const [year, monthIndex] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthIndex - 1 + count, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function buildMonthRange(months: string[]) {
  if (months.length === 0) return []

  const sortedMonths = [...months].sort()
  const start = sortedMonths[0]
  const end = sortedMonths[sortedMonths.length - 1]
  const range: string[] = []

  for (let month = start; month <= end; month = addMonths(month, 1)) {
    range.push(month)
  }

  return range
}

export function buildMonthlyRevenueTrends(rentals: RentalOrder[]): MonthlyRevenueTrend[] {
  const monthTotals = new Map<string, MonthlyRevenueTrend>()

  rentals.forEach((rental) => {
    const month = getMonthKey(rental.pickupDate)
    const current = monthTotals.get(month) ?? { month, revenue: 0, rentalCount: 0 }
    current.revenue += calculateNetRentalRevenue(rental)
    current.rentalCount += 1
    monthTotals.set(month, current)
  })

  return buildMonthRange(Array.from(monthTotals.keys())).map((month) => (
    monthTotals.get(month) ?? { month, revenue: 0, rentalCount: 0 }
  ))
}

export function buildRevenueByCategory(rentals: RentalOrder[]): CategoryRevenueSlice[] {
  const categoryTotals = new Map<string, Omit<CategoryRevenueSlice, 'percentage'>>()

  rentals.forEach((rental) => {
    const category = rental.costume.category || 'ไม่ระบุหมวดหมู่'
    const current = categoryTotals.get(category) ?? { category, revenue: 0, rentalCount: 0 }
    current.revenue += calculateNetRentalRevenue(rental)
    current.rentalCount += 1
    categoryTotals.set(category, current)
  })

  const totalRevenue = Array.from(categoryTotals.values()).reduce((sum, item) => sum + item.revenue, 0)

  return Array.from(categoryTotals.values())
    .map((item) => ({
      ...item,
      percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || a.category.localeCompare(b.category))
}

export function buildMonthlyDepositSummary(rentals: RentalOrder[]): MonthlyDepositSummary[] {
  const monthTotals = new Map<string, MonthlyDepositSummary>()

  rentals.forEach((rental) => {
    const month = getMonthKey(rental.pickupDate)
    const current = monthTotals.get(month) ?? {
      month,
      depositCollected: 0,
      depositHeld: 0,
      depositInReturnedOrders: 0,
      rentalCount: 0,
    }
    current.depositCollected += rental.depositAmount
    if (rental.status === 'returned') {
      current.depositInReturnedOrders += rental.depositAmount
    } else {
      current.depositHeld += rental.depositAmount
    }
    current.rentalCount += 1
    monthTotals.set(month, current)
  })

  return buildMonthRange(Array.from(monthTotals.keys())).map((month) => (
    monthTotals.get(month) ?? {
      month,
      depositCollected: 0,
      depositHeld: 0,
      depositInReturnedOrders: 0,
      rentalCount: 0,
    }
  ))
}

export function buildReportsDateRange({
  mode,
  customStartDate,
  customEndDate,
  stockItems,
  rentals,
  todayStr,
}: {
  mode: DateRangeMode
  customStartDate: string
  customEndDate: string
  stockItems: StockItem[]
  rentals: RentalOrder[]
  todayStr: string
}): DateRange {
  const end = todayStr
  let start = '2020-01-01'

  if (mode === '30days') {
    const d = new Date(`${todayStr}T00:00:00`)
    d.setDate(d.getDate() - 30)
    start = getLocalDateString(d)
  } else if (mode === 'this_month') {
    const [year, month] = todayStr.split('-')
    start = `${year}-${month}-01`
  } else if (mode === '90days') {
    const d = new Date(`${todayStr}T00:00:00`)
    d.setDate(d.getDate() - 90)
    start = getLocalDateString(d)
  } else if (mode === 'custom') {
    if (customStartDate) start = customStartDate
    return { start, end: customEndDate || end }
  } else {
    const creationDates = stockItems.map(item => item.createdAt ? item.createdAt.substring(0, 10) : '').filter(Boolean)
    const rentalDates = rentals.flatMap(rental => [rental.pickupDate, rental.returnDate].filter(Boolean))
    const allDates = [...creationDates, ...rentalDates].sort()
    if (allDates.length > 0) {
      start = allDates[0]
      return { start, end: [end, allDates[allDates.length - 1]].sort()[1] }
    }
    start = getLocalDateString(new Date(toUtcDay(todayStr) - 365 * 24 * 60 * 60 * 1000))
  }

  return { start, end }
}

export function buildDressReportsData(
  stockItems: StockItem[],
  rentals: RentalOrder[],
  activeDateRange: DateRange,
): DressReportItem[] {
  const { start: rangeStart, end: rangeEnd } = activeDateRange

  return stockItems.map(item => {
    const itemCreatedStr = item.createdAt ? item.createdAt.substring(0, 10) : ''
    const effectiveStart = itemCreatedStr && itemCreatedStr > rangeStart ? itemCreatedStr : rangeStart

    let totalDays = 0
    if (effectiveStart <= rangeEnd) {
      totalDays = getDaysBetween(effectiveStart, rangeEnd)
    }

    const itemRentals = rentals.filter(rental => rental.costume.sku === item.sku)

    let rentalCount = 0
    let totalRevenue = 0
    let rentedDays = 0

    itemRentals.forEach(rental => {
      const overlap = getOverlapDays(rental.pickupDate, rental.returnDate, effectiveStart, rangeEnd)
      if (overlap > 0) {
        rentedDays += overlap
      }

      if (isDateInRange(rental.pickupDate, activeDateRange)) {
        rentalCount++
        totalRevenue += calculateNetRentalRevenue(rental)
      }
    })

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
}

export function buildGeneralStoreMetrics(rentals: RentalOrder[]): GeneralStoreMetrics {
  const totalRentalsCount = rentals.length
  const totalRevenue = rentals.reduce((sum, rental) => sum + calculateNetRentalRevenue(rental), 0)
  const avgOrderValue = totalRentalsCount > 0 ? totalRevenue / totalRentalsCount : 0
  const monthlyRevenueTrends = buildMonthlyRevenueTrends(rentals)
  const revenueByCategory = buildRevenueByCategory(rentals)
  const monthlyDepositSummary = buildMonthlyDepositSummary(rentals)
  const totalDepositCollected = rentals.reduce((sum, rental) => sum + rental.depositAmount, 0)
  const totalDepositHeld = rentals.reduce((sum, rental) => (
    rental.status === 'returned' ? sum : sum + rental.depositAmount
  ), 0)
  const totalDepositInReturnedOrders = totalDepositCollected - totalDepositHeld

  const statusCounts = rentals.reduce((acc, rental) => {
    acc[rental.status] = (acc[rental.status] || 0) + 1
    return acc
  }, {} as Partial<Record<RentalStatus, number>>)

  return {
    totalRentalsCount,
    totalRevenue,
    avgOrderValue,
    statusCounts,
    monthlyRevenueTrends,
    revenueByCategory,
    monthlyDepositSummary,
    totalDepositCollected,
    totalDepositHeld,
    totalDepositInReturnedOrders,
  }
}
