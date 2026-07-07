import { describe, expect, it } from 'vitest'
import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'
import { buildDashboardMetrics } from './dashboardMetrics'

const customer: Customer = {
  id: 'customer_1',
  shopId: 'shop_1',
  customerCode: 'CUS-001',
  fullName: 'Somjai',
  lineAccount: 'somjai-line',
  phone: '0812345678',
  phoneNormalized: '0812345678',
  currentAddress: 'Bangkok',
  notes: '',
  profileStatus: 'verified',
  riskFlag: 'none',
  documents: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

const stockItem: FlatStockItem = {
  id: 'stock_1',
  shopId: 'shop_1',
  productId: 'product_1',
  sku: 'SKU-001',
  size: 'M',
  status: 'available',
  createdAt: '2026-07-01T00:00:00.000Z',
  productName: 'Golden Dress',
  brand: 'Precious',
  category: 'Evening',
  primaryColor: 'Gold',
  rentalTiers: [{ days: 1, price: 1200 }],
  lateFeeRule: '100/day',
  depositAmount: 500,
  imageUrls: [],
  publicVisible: true,
  isFeatured: false,
  displayOrder: 0,
}

function makeRental(overrides: Partial<RentalOrder> = {}): RentalOrder {
  return {
    id: 'rental_1',
    orderCode: 'PR-ORD-260704-001',
    customer,
    costume: stockItem,
    pickupDate: '2026-07-04',
    returnDate: '2026-07-05',
    rentalPrice: 1200,
    depositAmount: 500,
    collectedAmount: 1700,
    status: 'booked',
    createdAt: '2026-07-04T00:00:00.000Z',
    updatedAt: '2026-07-04T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildDashboardMetrics', () => {
  it('keeps totalRevenue aligned with collected cash when there are no extra fines', () => {
    const metrics = buildDashboardMetrics([makeRental()], '2026-07-05')

    expect(metrics.totalRevenue).toBe(1700)
    expect(metrics.totalCashFlow).toBe(1700)
  })

  it('includes fines in revenue totals while still exposing them separately', () => {
    const metrics = buildDashboardMetrics([
      makeRental({ fineAmount: 300 }),
      makeRental({
        id: 'returned_pending',
        orderCode: 'PR-ORD-260704-002',
        status: 'returned',
        depositStatus: 'pending_return',
        depositAmount: 400,
        collectedAmount: 1400,
      }),
    ], '2026-07-05')

    expect(metrics.totalRevenue).toBe(3400)
    expect(metrics.totalFines).toBe(300)
    expect(metrics.activeHeldDeposits).toBe(900)
    expect(metrics.netRevenue).toBe(2500)
  })
})
