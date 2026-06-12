import { describe, expect, it } from 'vitest'
import type { Customer } from '../customers/customerTypes'
import type { StockItem } from '../../App'
import type { RentalOrder, RentalStatus } from './rentalTypes'
import {
  findOpenRentalConflict,
  findOpenRentalForStockSku,
  isOpenRentalStatus,
} from './rentalRules'

const customer: Customer = {
  id: 'cus_1',
  shopId: 'shop_1',
  customerCode: 'PR-C001',
  fullName: 'pun',
  lineAccount: '@pun',
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

function makeRental(status: RentalStatus): RentalOrder {
  return {
    id: `rental_${status}`,
    orderCode: `PR-ORD-${status}`,
    customer,
    costume: stockItem,
    pickupDate: '2026-06-12',
    returnDate: '2026-06-15',
    rentalPrice: 1200,
    depositAmount: 2000,
    collectedAmount: 3200,
    status,
    notes: '',
    createdAt: '2026-06-11T00:00:00.000Z',
    updatedAt: '2026-06-11T00:00:00.000Z',
  }
}

describe('rental rules', () => {
  it.each(['booked', 'active', 'overdue'] as RentalStatus[])(
    'treats %s rentals as open',
    (status) => {
      expect(isOpenRentalStatus(status)).toBe(true)
      expect(findOpenRentalForStockSku([makeRental(status)], 'SKU-001')?.status).toBe(status)
    },
  )

  it('allows stock to be rented again after the previous rental is returned', () => {
    expect(isOpenRentalStatus('returned')).toBe(false)
    expect(findOpenRentalForStockSku([makeRental('returned')], 'SKU-001')).toBeUndefined()
  })

  it('finds conflicts for selected stock SKUs', () => {
    const conflict = findOpenRentalConflict([makeRental('active')], ['SKU-001'])

    expect(conflict?.orderCode).toBe('PR-ORD-active')
  })
})
