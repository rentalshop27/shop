// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'
import { ReportsPage } from './ReportsPage'
import { exportDressReportsToCSV, exportRentalsToCSV } from '../../utils/exportUtils'

vi.mock('../../utils/exportUtils', () => ({
  exportDressReportsToCSV: vi.fn(),
  exportRentalsToCSV: vi.fn(),
}))

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

const stockItems: FlatStockItem[] = [
  {
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
  },
  {
    id: 'stock_2',
    shopId: 'shop_1',
    productId: 'product_2',
    sku: 'SKU-002',
    size: 'S',
    status: 'available',
    createdAt: '2026-07-01T00:00:00.000Z',
    productName: 'Silver Dress',
    brand: 'Precious',
    category: 'Cocktail',
    primaryColor: 'Silver',
    rentalTiers: [{ days: 1, price: 900 }],
    lateFeeRule: '100/day',
    depositAmount: 400,
    imageUrls: [],
    publicVisible: true,
    isFeatured: false,
    displayOrder: 1,
  },
]

const rentals: RentalOrder[] = [
  {
    id: 'rental_1',
    orderCode: 'PR-ORD-260704-001',
    customer,
    costume: stockItems[0],
    pickupDate: '2026-07-04',
    returnDate: '2026-07-05',
    rentalPrice: 1200,
    depositAmount: 500,
    collectedAmount: 1700,
    status: 'returned',
    createdAt: '2026-07-04T08:00:00.000Z',
    updatedAt: '2026-07-04T08:00:00.000Z',
  },
  {
    id: 'rental_2',
    orderCode: 'PR-ORD-260705-001',
    customer,
    costume: stockItems[1],
    pickupDate: '2026-07-05',
    returnDate: '2026-07-06',
    rentalPrice: 900,
    depositAmount: 400,
    collectedAmount: 1300,
    status: 'returned',
    createdAt: '2026-07-05T08:00:00.000Z',
    updatedAt: '2026-07-05T08:00:00.000Z',
  },
]

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ReportsPage export', () => {
  it('exports the visible dress report rows and no longer shows Google Sheets copy', () => {
    const exportDressReportsToCSVMock = vi.mocked(exportDressReportsToCSV)

    render(
      <ReportsPage
        rentals={rentals}
        stockItems={stockItems}
        shopName="Precious Siam"
      />,
    )

    expect(screen.queryByText(/Google Sheets/i)).toBeNull()

    fireEvent.change(screen.getByPlaceholderText('ค้นหาชื่อชุด หรือ SKU...'), {
      target: { value: 'Golden' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }))

    expect(exportDressReportsToCSVMock).toHaveBeenCalledTimes(1)
    expect(exportRentalsToCSV).not.toHaveBeenCalled()
    expect(exportDressReportsToCSVMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          stockItem: expect.objectContaining({ sku: 'SKU-001' }),
        }),
      ]),
      'Precious-Siam-dress-report-2026-07-01-to-2026-07-07.csv',
    )
    expect(exportDressReportsToCSVMock.mock.calls[0][0]).toHaveLength(1)
  })

  it('exports raw rentals from the general tab', () => {
    render(
      <ReportsPage
        rentals={rentals}
        stockItems={stockItems}
        shopName="Precious Siam"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'รายงานยอดเช่า / รายได้รวม' }))
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }))

    expect(exportRentalsToCSV).toHaveBeenCalledTimes(1)
    expect(exportDressReportsToCSV).not.toHaveBeenCalled()
    expect(exportRentalsToCSV).toHaveBeenCalledWith(rentals, 'Precious-Siam-rentals-all.csv')
  })
})
