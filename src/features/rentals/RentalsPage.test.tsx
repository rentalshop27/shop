// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StockItem } from '../inventory/inventoryTypes'
import type { Customer } from '../customers/customerTypes'
import type { RentalOrder } from './rentalTypes'
import { RentalsPage } from './RentalsPage'

type RentalDraft = Omit<RentalOrder, 'id' | 'orderCode' | 'createdAt' | 'updatedAt'>
type CreateRentalsHandler = (drafts: RentalDraft[]) => boolean | Promise<boolean>

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

function makeStockItem(imageUrls: string[], overrides: Partial<StockItem> = {}): StockItem {
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
    imageUrls,
    createdAt: '2026-06-11T00:00:00.000Z',
    status: 'available',
  }
}

function makeRental(imageUrls: string[], overrides: Partial<RentalOrder> = {}): RentalOrder {
  const costume = overrides.costume ?? makeStockItem(imageUrls)

  return {
    id: overrides.id ?? 'rental_1',
    orderCode: overrides.orderCode ?? 'PR-ORD-101',
    customer,
    costume,
    pickupDate: overrides.pickupDate ?? '2026-06-12',
    returnDate: overrides.returnDate ?? '2026-06-15',
    rentalPrice: overrides.rentalPrice ?? 2000,
    depositAmount: overrides.depositAmount ?? 1000,
    collectedAmount: overrides.collectedAmount ?? 3000,
    status: overrides.status ?? 'booked',
    notes: overrides.notes ?? '',
    createdAt: overrides.createdAt ?? '2026-06-11T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-06-11T00:00:00.000Z',
  }
}

function renderRentalsPage(
  rentalsOrRental: RentalOrder | RentalOrder[],
  onUpdateRentalStatus = vi.fn(),
  options: {
    customers?: Customer[]
    stockItems?: StockItem[]
    onCreateRentals?: CreateRentalsHandler
  } = {},
) {
  const rentals = Array.isArray(rentalsOrRental) ? rentalsOrRental : [rentalsOrRental]

  render(
    <RentalsPage
      rentals={rentals}
      customers={options.customers ?? [customer]}
      stockItems={options.stockItems ?? rentals.map((rental) => rental.costume)}
      onCreateRentals={options.onCreateRentals ?? vi.fn(() => true)}
      onUpdateRentalStatus={onUpdateRentalStatus}
      onSelectRental={vi.fn()}
      externalSelectedRentalId={rentals[0].orderCode}
    />,
  )

  return { onUpdateRentalStatus }
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

describe('RentalsPage grouped rental display', () => {
  it('shows the full date range for grouped line items', () => {
    renderRentalsPage([
      makeRental([], {
        id: 'rental_1',
        orderCode: 'PR-ORD-260613-001-1',
        pickupDate: '2026-06-12',
        returnDate: '2026-06-14',
      }),
      makeRental([], {
        id: 'rental_2',
        orderCode: 'PR-ORD-260613-001-2',
        pickupDate: '2026-06-10',
        returnDate: '2026-06-16',
        costume: makeStockItem([], { id: 'stock_2', sku: 'S1-02', productName: 'Second Gown' }),
      }),
    ])

    expect(screen.getByText('2026-06-10 to 2026-06-16')).toBeInTheDocument()
  })

  it('calculates discounts against rental plus deposit totals', () => {
    renderRentalsPage(
      makeRental([], {
        rentalPrice: 2000,
        depositAmount: 1000,
        collectedAmount: 2500,
      })
    )

    expect(screen.getAllByText('ลด: ฿500').length).toBeGreaterThan(0)
  })

  it('returns only active or overdue line items in a mixed-status group', async () => {
    const user = userEvent.setup()
    const onUpdateRentalStatus = vi.fn()
    renderRentalsPage([
      makeRental([], {
        id: 'active_rental',
        orderCode: 'PR-ORD-260613-002-1',
        status: 'active',
      }),
      makeRental([], {
        id: 'returned_rental',
        orderCode: 'PR-ORD-260613-002-2',
        status: 'returned',
        costume: makeStockItem([], { id: 'stock_2', sku: 'S1-02', productName: 'Second Gown' }),
      }),
    ], onUpdateRentalStatus)

    await user.click(screen.getByRole('button', { name: 'รับคืนชุด (รับคืน)' }))

    expect(onUpdateRentalStatus).toHaveBeenCalledWith(['active_rental'], 'returned')
  })
})

describe('RentalsPage customer rental guard', () => {
  it('blocks rental creation for suspended customers', async () => {
    const user = userEvent.setup()
    const onCreateRentals = vi.fn(() => true)
    const existingRental = makeRental([])
    const availableCostume = makeStockItem([], {
      id: 'stock_2',
      sku: 'S1-02',
      productName: 'Second Gown',
    })
    const suspendedCustomer: Customer = { ...customer, profileStatus: 'suspended' }

    renderRentalsPage(existingRental, vi.fn(), {
      customers: [suspendedCustomer],
      stockItems: [existingRental.costume, availableCostume],
      onCreateRentals,
    })

    await user.click(screen.getByRole('button', { name: 'สร้างใบเช่าชุด' }))
    await user.click(screen.getByPlaceholderText('เช่น pun, PR-C001'))
    await user.click(screen.getByRole('button', { name: /นนท์.*PR-C001/ }))
    await user.click(screen.getByPlaceholderText('เช่น Midnight, PR-8130'))
    await user.click(screen.getByRole('button', { name: /Second Gown/ }))

    fireEvent.change(screen.getByLabelText(/วันที่รับชุด/), {
      target: { value: '2026-06-12' },
    })
    fireEvent.change(screen.getByLabelText(/วันที่คืน/), {
      target: { value: '2026-06-15' },
    })

    await user.click(screen.getByRole('button', { name: 'บันทึกการเช่า' }))

    expect(screen.getByText('ลูกค้าถูกระงับ ไม่สามารถสร้างรายการเช่าใหม่ได้')).toBeInTheDocument()
    expect(onCreateRentals).not.toHaveBeenCalled()
  })
})
