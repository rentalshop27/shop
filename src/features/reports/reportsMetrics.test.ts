import { describe, expect, it } from 'vitest'
import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'
import { buildGeneralStoreMetrics } from './reportsMetrics'

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
    status: 'returned',
    createdAt: '2026-07-04T00:00:00.000Z',
    updatedAt: '2026-07-04T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildGeneralStoreMetrics', () => {
  it('excludes refunded deposits from revenue and deposit held totals', () => {
    const metrics = buildGeneralStoreMetrics([
      makeRental({ depositStatus: 'returned', depositForfeitedAmount: 0 }),
    ])

    expect(metrics.totalRevenue).toBe(1200)
    expect(metrics.totalDepositHeld).toBe(0)
    expect(metrics.totalDepositRefunded).toBe(500)
    expect(metrics.totalDepositForfeited).toBe(0)
  })

  it('counts forfeited deposits as shop income', () => {
    const metrics = buildGeneralStoreMetrics([
      makeRental({
        depositStatus: 'forfeited',
        depositForfeitedAmount: 300,
      }),
    ])

    expect(metrics.totalRevenue).toBe(1500)
    expect(metrics.totalDepositHeld).toBe(0)
    expect(metrics.totalDepositRefunded).toBe(200)
    expect(metrics.totalDepositForfeited).toBe(300)
    expect(metrics.monthlyDepositSummary[0]).toEqual(expect.objectContaining({
      depositHeld: 0,
      depositRefunded: 200,
      depositForfeited: 300,
    }))
  })

  it('includes extra fines in report revenue totals', () => {
    const metrics = buildGeneralStoreMetrics([
      makeRental({
        depositStatus: 'returned',
        fineAmount: 250,
      }),
    ])

    expect(metrics.totalRevenue).toBe(1450)
    expect(metrics.avgOrderValue).toBe(1450)
    expect(metrics.monthlyRevenueTrends[0]).toEqual(expect.objectContaining({
      revenue: 1450,
    }))
  })

  it('keeps returned but unresolved deposits in held totals', () => {
    const metrics = buildGeneralStoreMetrics([makeRental()])

    expect(metrics.totalRevenue).toBe(1200)
    expect(metrics.totalDepositHeld).toBe(500)
    expect(metrics.totalDepositRefunded).toBe(0)
    expect(metrics.totalDepositForfeited).toBe(0)
  })

  it('splits multi-category rentals into separate category slices without changing total revenue', () => {
    const metrics = buildGeneralStoreMetrics([
      makeRental({
        costume: {
          ...stockItem,
          category: 'Evening, Cocktail',
        },
      }),
    ])

    expect(metrics.totalRevenue).toBe(1200)
    expect(metrics.revenueByCategory).toEqual([
      expect.objectContaining({
        category: 'Cocktail',
        revenue: 600,
        rentalCount: 1,
        percentage: 50,
      }),
      expect.objectContaining({
        category: 'Evening',
        revenue: 600,
        rentalCount: 1,
        percentage: 50,
      }),
    ])
  })
})
