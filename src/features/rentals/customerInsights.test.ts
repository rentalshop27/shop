import { describe, expect, it } from 'vitest'
import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import type { RentalOrder } from './rentalTypes'
import { calculateCustomerInsights } from './customerInsights'

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

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    ...customer,
    ...overrides,
  }
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
    shippingCost: 150,
    collectedAmount: 1850,
    status: 'returned',
    createdAt: '2026-07-04T00:00:00.000Z',
    updatedAt: '2026-07-04T00:00:00.000Z',
    ...overrides,
  }
}

describe('calculateCustomerInsights', () => {
  it('keeps a verified customer with clean completed rentals at five stars', () => {
    const insights = calculateCustomerInsights(
      customer,
      [
        makeRental({ depositStatus: 'returned' }),
        makeRental({ id: 'rental_2', orderCode: 'PR-ORD-260704-002', depositStatus: 'returned' }),
      ],
      '2026-07-05'
    )

    expect(insights.rentalCount).toBe(2)
    expect(insights.completedRentalCount).toBe(2)
    expect(insights.totalSpent).toBe(2700)
    expect(insights.starRating).toBe(5)
    expect(insights.starDisplay).toBe('★★★★★')
  })

  it('penalizes risk customers without dropping below one star', () => {
    const riskCustomer = makeCustomer({ riskFlag: 'has_risk', profileStatus: 'suspended' })
    const insights = calculateCustomerInsights(
      riskCustomer,
      [
        makeRental({ customer: riskCustomer, status: 'overdue', depositStatus: 'forfeited' }),
        makeRental({ id: 'rental_2', orderCode: 'PR-ORD-260704-002', customer: riskCustomer, status: 'overdue', depositStatus: 'forfeited' }),
        makeRental({ id: 'rental_3', orderCode: 'PR-ORD-260704-003', customer: riskCustomer, status: 'overdue', depositStatus: 'forfeited' }),
      ],
      '2026-07-05'
    )

    expect(insights.activeOverdueCount).toBe(3)
    expect(insights.depositForfeitedCount).toBe(3)
    expect(insights.starRating).toBe(1)
  })

  it('counts active rentals past return date as current overdue rentals', () => {
    const insights = calculateCustomerInsights(
      customer,
      [
        makeRental({ status: 'active', returnDate: '2026-07-04' }),
        makeRental({ id: 'rental_2', status: 'active', returnDate: '2026-07-05' }),
      ],
      '2026-07-05'
    )

    expect(insights.activeOverdueCount).toBe(1)
    expect(insights.starRating).toBe(4.5)
    expect(insights.starDisplay).toBe('★★★★½')
  })

  it('counts forfeited deposits separately from no-show assumptions', () => {
    const insights = calculateCustomerInsights(
      customer,
      [makeRental({ depositStatus: 'forfeited' })],
      '2026-07-05'
    )

    expect(insights.depositForfeitedCount).toBe(1)
    expect(insights.starRating).toBe(4)
  })

  it('adds extra fines into total spent while applying the flat star penalty', () => {
    const insights = calculateCustomerInsights(
      customer,
      [makeRental({ depositStatus: 'returned', fineAmount: 300, fineReason: 'ชุดเสียหาย' })],
      '2026-07-05'
    )

    expect(insights.totalSpent).toBe(1650)
    expect(insights.starRating).toBe(3)
  })

  it('counts returned rentals as completed only after deposit resolution', () => {
    const insights = calculateCustomerInsights(
      customer,
      [
        makeRental({ id: 'line_1', orderCode: 'PR-ORD-260704-010-1', depositStatus: 'returned' }),
        makeRental({ id: 'line_2', orderCode: 'PR-ORD-260704-010-2' }),
        makeRental({ id: 'line_3', orderCode: 'PR-ORD-260704-011-1', depositStatus: 'forfeited' }),
        makeRental({ id: 'line_4', orderCode: 'PR-ORD-260704-011-2', depositStatus: 'forfeited' }),
      ],
      '2026-07-05'
    )

    expect(insights.rentalCount).toBe(2)
    expect(insights.completedRentalCount).toBe(1)
    expect(insights.depositForfeitedCount).toBe(1)
  })

  it('handles a new customer with no rental history', () => {
    const newCustomer = makeCustomer({ id: 'customer_new' })
    const insights = calculateCustomerInsights(newCustomer, [], '2026-07-05')

    expect(insights.rentalCount).toBe(0)
    expect(insights.completedRentalCount).toBe(0)
    expect(insights.activeOverdueCount).toBe(0)
    expect(insights.depositForfeitedCount).toBe(0)
    expect(insights.totalSpent).toBe(0)
    expect(insights.starRating).toBe(5)
  })
})
