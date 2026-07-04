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

function clickMetric(label: string) {
  const metric = screen
    .getAllByText(label)
    .map((element) => element.closest('.metric-card'))
    .find(Boolean)
  if (!metric) {
    throw new Error(`Metric "${label}" was not rendered`)
  }
  fireEvent.click(metric)
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

  it('filters the list to rentals returning today when the return KPI is clicked', () => {
    render(
      <RentalsPage
        rentals={[
          makeRental({
            id: 'return_today',
            orderCode: 'PR-ORD-260704-RET',
            status: 'active',
            returnDate: '2026-07-05',
          }),
          makeRental({
            id: 'return_later',
            orderCode: 'PR-ORD-260704-LTR',
            status: 'active',
            returnDate: '2026-07-06',
          }),
        ]}
        customers={[customer]}
        stockItems={[stockItem]}
        onCreateRentals={vi.fn()}
        onUpdateRentalStatus={vi.fn()}
      />
    )

    clickMetric('คืนวันนี้')

    expect(screen.getByRole('row', { name: /#260704-RET/ })).toBeTruthy()
    expect(screen.queryByRole('row', { name: /#260704-LTR/ })).toBeNull()
  })

  it('includes active rentals past their return date in the overdue-return KPI filter', () => {
    render(
      <RentalsPage
        rentals={[
          makeRental({
            id: 'active_overdue',
            orderCode: 'PR-ORD-260704-OVR',
            status: 'active',
            returnDate: '2026-07-04',
          }),
          makeRental({
            id: 'active_current',
            orderCode: 'PR-ORD-260704-CUR',
            status: 'active',
            returnDate: '2026-07-05',
          }),
        ]}
        customers={[customer]}
        stockItems={[stockItem]}
        onCreateRentals={vi.fn()}
        onUpdateRentalStatus={vi.fn()}
      />
    )

    clickMetric('เลยกำหนดคืน')

    expect(screen.getByRole('row', { name: /#260704-OVR/ })).toBeTruthy()
    expect(screen.queryByRole('row', { name: /#260704-CUR/ })).toBeNull()
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

    fireEvent.click(screen.getByRole('button', { name: /ส่งไปรษณีย์ไทย/ }))

    expect(promptSpy).toHaveBeenCalledTimes(1)
    expect(alertSpy).toHaveBeenCalledWith('กรุณากรอกเลขพัสดุก่อนบันทึกการส่งไปรษณีย์ไทย')
    expect(onUpdateRentalStatus).not.toHaveBeenCalled()
  })

  it('uses Messenger as the quick delivery action instead of Grab', () => {
    const onUpdateRentalStatus = vi.fn()

    render(
      <RentalsPage
        rentals={[makeRental()]}
        customers={[customer]}
        stockItems={[stockItem]}
        onCreateRentals={vi.fn()}
        onUpdateRentalStatus={onUpdateRentalStatus}
      />
    )

    expect(screen.queryByText(/Grab/)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /เรียก Messenger/ }))

    expect(onUpdateRentalStatus).toHaveBeenCalledWith(
      ['rental_1'],
      'active',
      { method: 'messenger' }
    )
  })

  it('renders customer insights from rental history instead of mock values', () => {
    render(
      <RentalsPage
        rentals={[
          makeRental({
            id: 'returned',
            orderCode: 'PR-ORD-260704-001',
            status: 'returned',
            collectedAmount: 1850,
            depositAmount: 500,
          }),
          makeRental({
            id: 'active_overdue',
            orderCode: 'PR-ORD-260704-002',
            status: 'active',
            returnDate: '2026-07-04',
            collectedAmount: 1700,
            depositAmount: 500,
            depositStatus: 'forfeited',
          }),
        ]}
        customers={[customer]}
        stockItems={[stockItem]}
        onCreateRentals={vi.fn()}
        onUpdateRentalStatus={vi.fn()}
      />
    )

    expect(screen.getByText('เช่าทั้งหมด')).toBeTruthy()
    expect(screen.getByText('2 ครั้ง')).toBeTruthy()
    expect(screen.getByText('คืนครบแล้ว')).toBeTruthy()
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('ยอดสุทธิ')).toBeTruthy()
    expect(screen.getByText('฿2,550')).toBeTruthy()
    expect(screen.queryByText('15 ครั้ง')).toBeNull()
    expect(screen.queryByText('Late Return')).toBeNull()
    expect(screen.queryByText('No Show')).toBeNull()
  })
})
