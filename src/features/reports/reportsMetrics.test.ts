import { describe, expect, it } from 'vitest'
import type { StockItem } from '../../App'
import type { Customer } from '../customers/customerTypes'
import type { RentalOrder, RentalStatus } from '../rentals/rentalTypes'
import {
  buildDressReportsData,
  buildGeneralStoreMetrics,
  buildReportsDateRange,
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
})
