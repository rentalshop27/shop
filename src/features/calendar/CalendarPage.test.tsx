// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StockItem } from '../inventory/inventoryTypes'
import type { Customer } from '../customers/customerTypes'
import type { RentalOrder } from '../rentals/rentalTypes'
import { CalendarPage } from './CalendarPage'

const customer: Customer = {
  id: 'cus_1',
  shopId: 'shop_1',
  customerCode: 'PR-C001',
  fullName: 'นนท์',
  lineAccount: '',
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

function getTodayString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const date = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

function makeStockItem(overrides: Partial<StockItem> = {}): StockItem {
  return {
    id: overrides.id ?? 'stock_1',
    sku: overrides.sku ?? 'S1-01',
    serialNumber: 'SN-001',
    productName: overrides.productName ?? 'Evening Gown',
    brand: 'Precious',
    category: 'ชุดราตรี',
    size: 'M',
    primaryColor: 'น้ำเงินมิดไนต์',
    publicDescription: '',
    setCount: 1,
    rentalPricePerDay: 2000,
    lateFeeRule: '300/day',
    depositAmount: 1000,
    imageUrls: [],
    createdAt: '2026-06-11T00:00:00.000Z',
    status: 'available',
  }
}

function makeRental(overrides: Partial<RentalOrder> = {}): RentalOrder {
  return {
    id: overrides.id ?? 'rental_1',
    orderCode: overrides.orderCode ?? 'PR-ORD-260613-001-1',
    customer,
    costume: overrides.costume ?? makeStockItem(),
    pickupDate: overrides.pickupDate ?? getTodayString(),
    returnDate: overrides.returnDate ?? getTodayString(),
    rentalPrice: overrides.rentalPrice ?? 2000,
    depositAmount: overrides.depositAmount ?? 1000,
    collectedAmount: overrides.collectedAmount ?? 3000,
    status: overrides.status ?? 'active',
    notes: overrides.notes ?? '',
    createdAt: overrides.createdAt ?? '2026-06-11T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-06-11T00:00:00.000Z',
  }
}

function renderCalendarPage(rentals: RentalOrder[], onUpdateRentalStatus = vi.fn()) {
  render(
    <CalendarPage
      rentals={rentals}
      onUpdateRentalStatus={onUpdateRentalStatus}
      onNavigateToRentals={vi.fn()}
      onNavigateToCreateRental={vi.fn()}
      onNavigateToTab={vi.fn()}
    />,
  )

  return { onUpdateRentalStatus }
}

afterEach(() => {
  cleanup()
})

describe('CalendarPage lifecycle controls', () => {
  it('returns only active or overdue line items in a mixed-status group', async () => {
    const user = userEvent.setup()
    const onUpdateRentalStatus = vi.fn()

    renderCalendarPage([
      makeRental({
        id: 'active_rental',
        orderCode: 'PR-ORD-260613-002-1',
        status: 'active',
      }),
      makeRental({
        id: 'returned_rental',
        orderCode: 'PR-ORD-260613-002-2',
        status: 'returned',
        costume: makeStockItem({ id: 'stock_2', sku: 'S1-02', productName: 'Second Gown' }),
      }),
    ], onUpdateRentalStatus)

    await user.click(screen.getByRole('button', { name: /รับคืนชุด/ }))

    expect(onUpdateRentalStatus).toHaveBeenCalledWith(['active_rental'], 'returned')
    expect(onUpdateRentalStatus).toHaveBeenCalledTimes(1)
  })
})
