/* @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarPage } from './CalendarPage'
import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

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
    orderCode: 'PR-ORD-260701-001',
    customer,
    costume: stockItem,
    pickupDate: '2026-07-01',
    returnDate: '2026-07-02',
    rentalPrice: 1200,
    depositAmount: 500,
    collectedAmount: 1700,
    status: 'active',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-06T10:00:00.000Z'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows overdue status in the all-rentals list for active rentals past return date', () => {
    render(
      <CalendarPage
        rentals={[makeRental()]}
        onUpdateRentalStatus={vi.fn()}
        onNavigateToRentals={vi.fn()}
        onNavigateToCreateRental={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /รายการทั้งหมด/ }))

    expect(screen.getByText('เลยกำหนดคืน')).toBeTruthy()
  })

  it('shows the overdue summary in the day detail panel', () => {
    render(
      <CalendarPage
        rentals={[makeRental()]}
        onUpdateRentalStatus={vi.fn()}
        onNavigateToRentals={vi.fn()}
        onNavigateToCreateRental={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /วันที่ 2 .*คืนชุด 1 ใบเช่า/ }))

    expect(screen.getByText('ออเดอร์เกินกำหนดคืน')).toBeInTheDocument()
    expect(screen.getByText('4 วัน')).toBeInTheDocument()
    expect(screen.getByText('฿100 / วัน')).toBeInTheDocument()
    expect(screen.getByText('฿400')).toBeInTheDocument()
  })

  it('does not mark returned or cancelled rentals as overdue', () => {
    render(
      <CalendarPage
        rentals={[
          makeRental({ id: 'returned', orderCode: 'PR-ORD-260701-RET', status: 'returned' }),
          makeRental({ id: 'cancelled', orderCode: 'PR-ORD-260701-CAN', status: 'cancelled' }),
        ]}
        onUpdateRentalStatus={vi.fn()}
        onNavigateToRentals={vi.fn()}
        onNavigateToCreateRental={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /รายการทั้งหมด/ }))

    expect(screen.queryByText('เลยกำหนดคืน')).toBeNull()
  })
})
