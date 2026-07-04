// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StockManagementDrawer } from './StockManagementDrawer'
import type { ProductWithStockSummary, FlatStockItem } from './inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'
import type { Customer } from '../customers/customerTypes'

afterEach(cleanup)

const stockItem: ProductWithStockSummary['stockItems'][number] = {
  id: 'stock_1',
  shopId: 'shop_1',
  productId: 'product_1',
  sku: 'oommm-S-01',
  size: 'S',
  status: 'available',
  createdAt: '2026-07-01T00:00:00.000Z',
}

const product: ProductWithStockSummary = {
  id: 'product_1',
  baseSku: 'oommm',
  productName: 'ppp',
  brand: '',
  category: '',
  primaryColor: '',
  publicDescription: '',
  rentalTiers: [{ days: 1, price: 0 }],
  lateFeeRule: '',
  depositAmount: 0,
  imageUrls: [],
  publicVisible: true,
  isFeatured: false,
  displayOrder: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
  stockItems: [stockItem],
}

const customer: Customer = {
  id: 'customer_1',
  shopId: 'shop_1',
  customerCode: 'C-001',
  fullName: 'Test Customer',
  lineAccount: '',
  phone: '0800000000',
  phoneNormalized: '0800000000',
  currentAddress: '',
  notes: '',
  profileStatus: 'verified',
  riskFlag: 'none',
  documents: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

function makeRental(status: RentalOrder['status']): RentalOrder {
  return {
    id: 'rental_1',
    orderCode: 'PR-001',
    customer,
    costume: {
      ...(stockItem as FlatStockItem),
      productName: product.productName,
      brand: product.brand,
      category: product.category,
      primaryColor: product.primaryColor,
      rentalTiers: product.rentalTiers,
      lateFeeRule: product.lateFeeRule,
      depositAmount: product.depositAmount,
      imageUrls: product.imageUrls,
      publicVisible: product.publicVisible,
      isFeatured: product.isFeatured,
      displayOrder: product.displayOrder,
    },
    pickupDate: '2026-07-03',
    returnDate: '2026-07-05',
    rentalPrice: 0,
    depositAmount: 0,
    collectedAmount: 0,
    status,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  }
}

describe('StockManagementDrawer', () => {
  it('shows the rental-derived status in the stock status selector', () => {
    render(
      <StockManagementDrawer
        product={product}
        rentals={[makeRental('active')]}
        today="2026-07-04"
        isSaving={false}
        onClose={vi.fn()}
        onAddStock={vi.fn()}
        onDeleteVariant={vi.fn()}
        onUpdateStatus={vi.fn()}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'สถานะของ oommm-S-01' })).toHaveValue('rented')
    expect(screen.getByRole('option', { name: 'ถูกเช่า' })).toBeDisabled()
  })
})
