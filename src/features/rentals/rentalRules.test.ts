import { describe, expect, it } from 'vitest'
import type { RentalOrder } from './rentalTypes'
import {
  canDeleteRentalGroup,
  findOpenRentalConflictByStockItemIds,
  getAllowedRentalEditFields,
} from './rentalRules'
import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'

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
    shippingCost: 150,
    collectedAmount: 1850,
    status: 'booked',
    createdAt: '2026-07-04T00:00:00.000Z',
    updatedAt: '2026-07-04T00:00:00.000Z',
    ...overrides,
  }
}

describe('rentalRules', () => {
  it('checks create conflicts against stock item ids', () => {
    const rentals = [
      makeRental({
        costume: {
          ...stockItem,
          sku: 'SKU-LEGACY-001',
        },
      }),
    ]

    const conflict = findOpenRentalConflictByStockItemIds(rentals, ['stock_1'], '2026-07-04', '2026-07-06')

    expect(conflict?.id).toBe('rental_1')
  })

  it('limits active-rental edits to date and notes fields', () => {
    expect(getAllowedRentalEditFields('active')).toEqual([
      'return_date',
      'notes',
      'return_tracking_note',
    ])
  })

  it('only allows deleting cancelled rental groups', () => {
    expect(canDeleteRentalGroup([makeRental({ status: 'cancelled' })])).toBe(true)
    expect(canDeleteRentalGroup([makeRental({ status: 'active' })])).toBe(false)
  })
})
