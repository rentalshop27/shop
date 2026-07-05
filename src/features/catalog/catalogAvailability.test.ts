import { describe, expect, it } from 'vitest'
import { buildCatalogSizeSummary } from './catalogAvailability'
import type { RentalOrder } from '../rentals/rentalTypes'
import type { StockItem } from '../inventory/inventoryTypes'
import type { Customer } from '../customers/customerTypes'

const customer: Customer = {
  id: 'customer_1',
  shopId: 'shop_1',
  customerCode: 'CUS-001',
  fullName: 'Somjai',
  lineAccount: '',
  phone: '0812345678',
  phoneNormalized: '0812345678',
  currentAddress: '',
  notes: '',
  profileStatus: 'verified',
  riskFlag: 'none',
  documents: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

const stockItems: StockItem[] = [
  {
    id: 'stock_1',
    shopId: 'shop_1',
    productId: 'product_1',
    sku: 'SKU-001',
    size: 'M',
    status: 'available',
    createdAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'stock_2',
    shopId: 'shop_1',
    productId: 'product_1',
    sku: 'SKU-002',
    size: 'M',
    status: 'available',
    createdAt: '2026-07-01T00:00:00.000Z',
  },
]

function makeRental(overrides: Partial<RentalOrder> = {}): RentalOrder {
  return {
    id: 'rental_1',
    orderCode: 'PR-ORD-260705-001',
    customer,
    costume: {
      ...stockItems[0],
      productName: 'Ruby Dress',
      brand: 'Precious',
      category: 'Evening',
      primaryColor: 'Red',
      rentalTiers: [{ days: 1, price: 2200 }],
      lateFeeRule: '',
      depositAmount: 5000,
      imageUrls: [],
      publicVisible: true,
      isFeatured: false,
      displayOrder: 0,
    },
    pickupDate: '2026-07-03',
    returnDate: '2026-07-04',
    rentalPrice: 2200,
    depositAmount: 5000,
    collectedAmount: 7200,
    status: 'booked',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildCatalogSizeSummary', () => {
  it('keeps overdue stock items unavailable in the admin catalog summary', () => {
    const summary = buildCatalogSizeSummary(
      stockItems,
      [makeRental({ status: 'overdue' })],
      '2026-07-05',
    )

    expect(summary).toEqual([{ size: 'M', total: 2, available: 1 }])
  })

  it('counts future booked stock items as unavailable for the affected size', () => {
    const summary = buildCatalogSizeSummary(
      stockItems,
      [makeRental({ status: 'booked', pickupDate: '2026-07-10', returnDate: '2026-07-12' })],
      '2026-07-05',
    )

    expect(summary).toEqual([{ size: 'M', total: 2, available: 1 }])
  })
})
