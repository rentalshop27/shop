import { describe, expect, it } from 'vitest'
import type { StockItem } from '../../App'
import type { Customer } from '../customers/customerTypes'
import type { RentalOrder, RentalStatus } from '../rentals/rentalTypes'
import { buildDashboardMetrics } from './dashboardMetrics'

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
  createdAt: '2026-06-11T00:00:00.000Z',
}

function makeRental(
  id: string,
  status: RentalStatus,
  dates: { pickupDate: string; returnDate: string },
  collectedAmount = 3200,
): RentalOrder {
  return {
    id,
    orderCode: `PR-ORD-${id}`,
    customer,
    costume: { ...stockItem, id: `stock_${id}`, sku: `SKU-${id}` },
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

describe('buildDashboardMetrics', () => {
  it('only includes pickups and returns scheduled for today', () => {
    const metrics = buildDashboardMetrics(
      [
        makeRental('pickup_today', 'booked', { pickupDate: '2026-06-13', returnDate: '2026-06-15' }),
        makeRental('pickup_future', 'booked', { pickupDate: '2026-06-14', returnDate: '2026-06-16' }),
        makeRental('return_today', 'active', { pickupDate: '2026-06-10', returnDate: '2026-06-13' }),
        makeRental('return_future', 'active', { pickupDate: '2026-06-10', returnDate: '2026-06-14' }),
      ],
      '2026-06-13',
    )

    expect(metrics.pickups.map((rental) => rental.id)).toEqual(['pickup_today'])
    expect(metrics.returns.map((rental) => rental.id)).toEqual(['return_today'])
  })

  it('does not mark active rentals due today as overdue', () => {
    const metrics = buildDashboardMetrics(
      [
        makeRental('due_today', 'active', { pickupDate: '2026-06-10', returnDate: '2026-06-13' }),
        makeRental('past_due', 'active', { pickupDate: '2026-06-10', returnDate: '2026-06-12' }),
      ],
      '2026-06-13',
    )

    expect(metrics.overdues.map((rental) => rental.id)).toEqual(['past_due'])
    expect(metrics.overdues[0].daysOverdue).toBe(1)
  })

  it('uses collected amount for the payment total', () => {
    const metrics = buildDashboardMetrics(
      [
        makeRental('booked_paid', 'booked', { pickupDate: '2026-06-14', returnDate: '2026-06-16' }, 3000),
        makeRental('returned_discounted', 'returned', { pickupDate: '2026-06-10', returnDate: '2026-06-13' }, 900),
      ],
      '2026-06-13',
    )

    expect(metrics.totalRevenue).toBe(3900)
  })
})
