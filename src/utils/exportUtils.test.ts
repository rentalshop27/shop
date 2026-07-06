// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Customer } from '../features/customers/customerTypes'
import type { FlatStockItem } from '../features/inventory/inventoryTypes'
import type { RentalOrder } from '../features/rentals/rentalTypes'
import { exportRentalsToCSV } from './exportUtils'

const customer: Customer = {
  id: 'customer_1',
  shopId: 'shop_1',
  customerCode: 'CUS-001',
  fullName: 'Somjai, "VIP"',
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
    createdAt: '2026-07-04T08:00:00.000Z',
    updatedAt: '2026-07-04T08:00:00.000Z',
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('exportRentalsToCSV', () => {
  it('exports Thai-safe CSV rows using fullName and shared net revenue math', async () => {
    let exportedBlob: Blob | undefined

    vi.stubGlobal('alert', vi.fn())
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((blob: Blob) => {
        exportedBlob = blob
        return 'blob:test'
      }),
      revokeObjectURL: vi.fn(),
    })

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    exportRentalsToCSV([
      makeRental({
        depositStatus: 'forfeited',
        depositForfeitedAmount: 300,
        fineAmount: 200,
        fineReason: 'ชุดมีรอย',
        depositResolutionNote: 'หักค่าซ่อม',
      }),
    ], 'report.csv')

    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(exportedBlob).toBeInstanceOf(Blob)
    expect(Array.from(new Uint8Array(await exportedBlob!.arrayBuffer()).slice(0, 3))).toEqual([0xef, 0xbb, 0xbf])
    expect(await exportedBlob!.text()).toContain('"Somjai, ""VIP"""')
    expect(await exportedBlob!.text()).toContain('1700.00,500.00,300.00,200.00,1700.00,หักค่าซ่อม / ชุดมีรอย')
  })
})
