/* @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'
import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

const customer: Customer = {
  id: 'customer_1',
  shopId: 'shop_1',
  customerCode: 'CUS-001',
  fullName: 'Somjai',
  lineAccount: '',
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

const rental: RentalOrder = {
  id: 'rental_1',
  orderCode: 'PR-ORD-260704-001',
  customer,
  costume: stockItem,
  pickupDate: '2026-07-04',
  returnDate: '2026-07-05',
  rentalPrice: 1200,
  depositAmount: 500,
  collectedAmount: 1700,
  status: 'booked',
  createdAt: '2026-07-04T00:00:00.000Z',
  updatedAt: '2026-07-04T00:00:00.000Z',
}

describe('DashboardPage', () => {
  it('hides financial cards in the staff dashboard variant', () => {
    render(
      <DashboardPage
        rentals={[rental]}
        onUpdateRentalStatus={vi.fn()}
        onNavigateToCustomers={vi.fn()}
        onNavigateToRentals={vi.fn()}
        showFinancials={false}
      />,
    )

    expect(screen.queryByText('รายรับสุทธิประจำเดือน')).toBeNull()
    expect(screen.getByText('รายการคืนเกินกำหนด')).toBeTruthy()
    expect(screen.getByText('กำลังเช่าอยู่ขณะนี้')).toBeTruthy()
  })
})
