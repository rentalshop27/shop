// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StockItem } from '../../App'
import type { Customer } from '../customers/customerTypes'
import type { RentalOrder } from './rentalTypes'
import { RentalsPage } from './RentalsPage'

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

function makeStockItem(imageUrls: string[]): StockItem {
  return {
    id: 'stock_1',
    sku: 'S1-01',
    serialNumber: 'SN-001',
    productName: 'Evening Gown',
    brand: 'Precious',
    category: 'ชุดราตรี',
    size: 'M',
    primaryColor: 'น้ำเงินมิดไนต์',
    publicDescription: '',
    setCount: 1,
    rentalPricePerDay: 2000,
    lateFeeRule: '300/day',
    depositAmount: 1000,
    imageUrls,
    createdAt: '2026-06-11T00:00:00.000Z',
    status: 'available',
  }
}

function makeRental(imageUrls: string[]): RentalOrder {
  return {
    id: 'rental_1',
    orderCode: 'PR-ORD-101',
    customer,
    costume: makeStockItem(imageUrls),
    pickupDate: '2026-06-12',
    returnDate: '2026-06-15',
    rentalPrice: 2000,
    depositAmount: 1000,
    collectedAmount: 3000,
    status: 'booked',
    notes: '',
    createdAt: '2026-06-11T00:00:00.000Z',
    updatedAt: '2026-06-11T00:00:00.000Z',
  }
}

function renderRentalsPage(rental: RentalOrder) {
  render(
    <RentalsPage
      rentals={[rental]}
      customers={[customer]}
      stockItems={[rental.costume]}
      onCreateRentals={vi.fn()}
      onUpdateRentalStatus={vi.fn()}
      onSelectRental={vi.fn()}
      externalSelectedRentalId={rental.orderCode}
    />,
  )
}

afterEach(() => {
  cleanup()
})

function getOrderItemsSection() {
  const heading = screen.getByText('รายการออเดอร์และวงจรสินค้า')
  const section = heading.closest('section')

  if (!section) {
    throw new Error('Order items section not found')
  }

  return within(section)
}

describe('RentalsPage image display', () => {
  it('shows a placeholder instead of a fake image when the costume has no image', () => {
    renderRentalsPage(makeRental([]))

    const orderItems = getOrderItemsSection()

    expect(orderItems.getByLabelText('ยังไม่มีรูปสินค้า')).toBeInTheDocument()
    expect(orderItems.queryByAltText('Evening Gown')).not.toBeInTheDocument()
  })

  it('renders the real costume image when one exists', () => {
    renderRentalsPage(makeRental(['https://cdn.example.com/real-dress.jpg']))

    const orderItems = getOrderItemsSection()
    const image = orderItems.getByAltText('Evening Gown')

    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://cdn.example.com/real-dress.jpg')
    expect(orderItems.queryByLabelText('ยังไม่มีรูปสินค้า')).not.toBeInTheDocument()
  })
})
