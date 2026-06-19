import { describe, expect, it } from 'vitest'
import { getInventoryDisplayStatus } from './inventoryStatus'
import type { StockItem } from './inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

function makeStockItem(sku: string, status: StockItem['status'] = 'available'): StockItem {
  return {
    id: `item_${sku}`,
    sku,
    serialNumber: `SN-${sku}`,
    productName: `Product ${sku}`,
    brand: 'Brand',
    category: 'Category',
    size: 'M',
    primaryColor: 'Blue',
    publicDescription: '',
    setCount: 1,
    rentalPricePerDay: 1000,
    lateFeeRule: '',
    depositAmount: 500,
    imageUrls: [],
    status,
    createdAt: new Date().toISOString(),
  }
}

function makeRental(
  sku: string,
  status: RentalOrder['status'],
  pickupDate: string,
  returnDate: string
): RentalOrder {
  return {
    id: `rental_${sku}_${pickupDate}`,
    orderCode: `ORD-${sku}-${pickupDate}`,
    customer: {
      id: 'cust_1',
      shopId: 'shop_1',
      customerCode: 'C-001',
      fullName: 'Customer Name',
      phone: '0987654321',
      phoneNormalized: '0987654321',
      lineAccount: '',
      currentAddress: '',
      notes: '',
      profileStatus: 'verified',
      riskFlag: 'none',
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bustIn: undefined,
      waistIn: undefined,
      hipIn: undefined,
      heightCm: undefined,
    },
    costume: makeStockItem(sku),
    pickupDate,
    returnDate,
    rentalPrice: 1000,
    depositAmount: 500,
    collectedAmount: 1500,
    status,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('inventory status classification helper', () => {
  const today = '2026-06-13'

  it('active/overdue today shows rented (ถูกเช่า)', () => {
    const item = makeStockItem('SKU-1')
    
    // Active today
    const rentalsActive = [
      makeRental('SKU-1', 'active', '2026-06-12', '2026-06-14')
    ]
    expect(getInventoryDisplayStatus(item, rentalsActive, today).primaryStatus).toBe('rented')

    // Overdue today
    const rentalsOverdue = [
      makeRental('SKU-1', 'overdue', '2026-06-10', '2026-06-12')
    ]
    expect(getInventoryDisplayStatus(item, rentalsOverdue, today).primaryStatus).toBe('rented')
  })

  it('repair/wash with future booked keeps repair/wash primary and includes next booked date', () => {
    const itemRepair = makeStockItem('SKU-1', 'repair')
    const itemWash = makeStockItem('SKU-2', 'wash')
    const rentals = [
      makeRental('SKU-1', 'booked', '2026-06-20', '2026-06-22'),
      makeRental('SKU-2', 'booked', '2026-06-18', '2026-06-20')
    ]

    const resRepair = getInventoryDisplayStatus(itemRepair, rentals, today)
    expect(resRepair.primaryStatus).toBe('repair')
    expect(resRepair.nextBookedRental).not.toBeNull()
    expect(resRepair.nextBookedRental?.pickupDate).toBe('2026-06-20')

    const resWash = getInventoryDisplayStatus(itemWash, rentals, today)
    expect(resWash.primaryStatus).toBe('wash')
    expect(resWash.nextBookedRental).not.toBeNull()
    expect(resWash.nextBookedRental?.pickupDate).toBe('2026-06-18')
  })

  it('future booked shows booked (มีคิวจอง)', () => {
    const item = makeStockItem('SKU-1', 'available')
    const rentals = [
      makeRental('SKU-1', 'booked', '2026-06-20', '2026-06-22')
    ]
    const result = getInventoryDisplayStatus(item, rentals, today)
    expect(result.primaryStatus).toBe('booked')
    expect(result.nextBookedRental?.pickupDate).toBe('2026-06-20')
  })

  it('returned rentals do not create booked/blocked inventory status', () => {
    const item = makeStockItem('SKU-1', 'available')
    const rentals = [
      makeRental('SKU-1', 'returned', '2026-06-20', '2026-06-22')
    ]
    const result = getInventoryDisplayStatus(item, rentals, today)
    expect(result.primaryStatus).toBe('available')
    expect(result.nextBookedRental).toBeNull()
  })

  it('multiple booked rentals choose the next upcoming date range', () => {
    const item = makeStockItem('SKU-1', 'available')
    const rentals = [
      makeRental('SKU-1', 'booked', '2026-06-25', '2026-06-27'),
      makeRental('SKU-1', 'booked', '2026-06-15', '2026-06-17'),
      makeRental('SKU-1', 'booked', '2026-06-20', '2026-06-22')
    ]
    const result = getInventoryDisplayStatus(item, rentals, today)
    expect(result.primaryStatus).toBe('booked')
    expect(result.nextBookedRental?.pickupDate).toBe('2026-06-15')
  })
})
