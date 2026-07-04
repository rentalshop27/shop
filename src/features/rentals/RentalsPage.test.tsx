/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RentalsPage } from './RentalsPage'
import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import type { RentalOrder } from './rentalTypes'

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

describe('RentalsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-05T10:00:00.000Z'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows the overdue-delivery badge based on the live date', () => {
    render(
      <RentalsPage
        rentals={[makeRental()]}
        customers={[customer]}
        stockItems={[stockItem]}
        onCreateRentals={vi.fn()}
        onUpdateRentalStatus={vi.fn()}
      />
    )

    expect(screen.getAllByText(/เลยกำหนดส่ง/)).not.toHaveLength(0)
  })

  it('requires a non-empty Thailand Post tracking number before status update', () => {
    const onUpdateRentalStatus = vi.fn()
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('   ')
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(
      <RentalsPage
        rentals={[makeRental()]}
        customers={[customer]}
        stockItems={[stockItem]}
        onCreateRentals={vi.fn()}
        onUpdateRentalStatus={onUpdateRentalStatus}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /ส่งไปรษณีย์ไทยแล้ว/ }))

    expect(promptSpy).toHaveBeenCalledTimes(1)
    expect(alertSpy).toHaveBeenCalledWith('กรุณากรอกเลขพัสดุก่อนบันทึกการส่งไปรษณีย์ไทย')
    expect(onUpdateRentalStatus).not.toHaveBeenCalled()
  })
})
