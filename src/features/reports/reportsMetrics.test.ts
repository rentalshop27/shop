import { describe, expect, it } from 'vitest'
import type { StockItem } from '../inventory/inventoryTypes'
import type { Customer } from '../customers/customerTypes'
import type { RentalOrder, RentalStatus } from '../rentals/rentalTypes'
import {
  buildMonthlyDepositSummary,
  buildMonthlyRevenueTrends,
  buildDressReportsData,
  buildGeneralStoreMetrics,
  buildReportsDateRange,
  buildRevenueByCategory,
} from './reportsMetrics'

const customer: Customer = {
  id: 'cus_1',
  shopId: 'shop_1',
  customerCode: 'PR-C001',
  fullName: 'นนท์',
  lineAccount: '@non',
  phone: '0987654321',
  phoneNormalized: '0987654321',
  currentAddress: '',
  notes: '',
  profileStatus: 'verified',
  riskFlag: 'none',
  documents: [],
  createdAt: '2026-06-11T00:00:00.000Z',
  updatedAt: '2026-06-11T00:00:00.000Z',
}

const stockItem: StockItem = {
  id: 'stock_1',
  sku: 'SKU-001',
  serialNumber: 'SN-001',
  productName: 'Midnight Dress',
  brand: 'Precious',
  category: 'ชุดราตรี',
  size: 'M',
  primaryColor: 'น้ำเงิน',
  publicDescription: '',
  setCount: 1,
  rentalPricePerDay: 1200,
  lateFeeRule: '300/day',
  depositAmount: 2000,
  imageUrls: [],
  createdAt: '2026-06-01T00:00:00.000Z',
  status: 'available',
}

function makeRental(
  id: string,
  dates: { pickupDate: string; returnDate: string },
  status: RentalStatus = 'booked',
  collectedAmount = 3200,
): RentalOrder {
  return {
    id,
    orderCode: `PR-ORD-${id}`,
    customer,
    costume: stockItem,
    pickupDate: dates.pickupDate,
    returnDate: dates.returnDate,
    rentalPrice: 1200,
    depositAmount: 2000,
    collectedAmount,
    status,
    notes: '',
    createdAt: '2026-06-11T00:00:00.000Z',
    updatedAt: '2026-06-11T00:00:00.000Z',
  }
}

describe('reports metrics', () => {
  it('counts rental revenue by pickup date while keeping overlap days for utilization', () => {
    const [report] = buildDressReportsData(
      [stockItem],
      [
        makeRental('june_pickup', { pickupDate: '2026-06-30', returnDate: '2026-07-02' }, 'returned', 3200),
        makeRental('july_pickup', { pickupDate: '2026-07-05', returnDate: '2026-07-06' }, 'returned', 4200),
      ],
      { start: '2026-07-01', end: '2026-07-31' },
    )

    expect(report.rentalCount).toBe(1)
    expect(report.totalRevenue).toBe(2200)
    expect(report.rentedDays).toBe(4)
  })

  it('extends the all-time range to future bookings so dress and store totals agree', () => {
    const rentals = [
      makeRental('past', { pickupDate: '2026-06-05', returnDate: '2026-06-06' }, 'returned', 3200),
      makeRental('future', { pickupDate: '2026-07-10', returnDate: '2026-07-12' }, 'booked', 3200),
    ]
    const activeDateRange = buildReportsDateRange({
      mode: 'all',
      customStartDate: '',
      customEndDate: '',
      stockItems: [stockItem],
      rentals,
      todayStr: '2026-06-17',
    })
    const [dressReport] = buildDressReportsData([stockItem], rentals, activeDateRange)
    const storeMetrics = buildGeneralStoreMetrics(rentals)

    expect(activeDateRange).toEqual({ start: '2026-06-01', end: '2026-07-12' })
    expect(dressReport.rentalCount).toBe(2)
    expect(dressReport.totalRevenue).toBe(storeMetrics.totalRevenue)
  })

  it('builds monthly revenue trends by pickup month and fills empty months', () => {
    const trends = buildMonthlyRevenueTrends([
      makeRental('june', { pickupDate: '2026-06-15', returnDate: '2026-06-16' }, 'returned', 3200),
      makeRental('august', { pickupDate: '2026-08-02', returnDate: '2026-08-03' }, 'returned', 4200),
    ])

    expect(trends).toEqual([
      { month: '2026-06', revenue: 1200, rentalCount: 1 },
      { month: '2026-07', revenue: 0, rentalCount: 0 },
      { month: '2026-08', revenue: 2200, rentalCount: 1 },
    ])
  })

  it('groups net revenue by costume category for the category pie chart', () => {
    const accessoryStock: StockItem = {
      ...stockItem,
      id: 'stock_2',
      sku: 'SKU-002',
      category: 'เครื่องประดับ',
    }
    const accessoryRental = {
      ...makeRental('accessory', { pickupDate: '2026-06-18', returnDate: '2026-06-18' }, 'returned', 2700),
      costume: accessoryStock,
      rentalPrice: 700,
    }

    const slices = buildRevenueByCategory([
      makeRental('dress_1', { pickupDate: '2026-06-15', returnDate: '2026-06-16' }, 'returned', 3200),
      makeRental('dress_2', { pickupDate: '2026-06-17', returnDate: '2026-06-18' }, 'returned', 4200),
      accessoryRental,
    ])

    expect(slices).toHaveLength(2)
    expect(slices[0]).toMatchObject({ category: 'ชุดราตรี', revenue: 3400, rentalCount: 2 })
    expect(slices[0].percentage).toBeCloseTo(82.93)
    expect(slices[1]).toMatchObject({ category: 'เครื่องประดับ', revenue: 700, rentalCount: 1 })
    expect(slices[1].percentage).toBeCloseTo(17.07)
  })

  it('summarizes monthly deposits without implying returned orders prove cash refunds', () => {
    const summary = buildMonthlyDepositSummary([
      makeRental('booked', { pickupDate: '2026-06-10', returnDate: '2026-06-11' }, 'booked', 3200),
      makeRental('returned', { pickupDate: '2026-06-20', returnDate: '2026-06-21' }, 'returned', 3200),
      makeRental('overdue', { pickupDate: '2026-08-01', returnDate: '2026-08-02' }, 'overdue', 3200),
    ])

    expect(summary).toEqual([
      { month: '2026-06', depositCollected: 4000, depositHeld: 2000, depositInReturnedOrders: 2000, rentalCount: 2 },
      { month: '2026-07', depositCollected: 0, depositHeld: 0, depositInReturnedOrders: 0, rentalCount: 0 },
      { month: '2026-08', depositCollected: 2000, depositHeld: 2000, depositInReturnedOrders: 0, rentalCount: 1 },
    ])
  })
})
