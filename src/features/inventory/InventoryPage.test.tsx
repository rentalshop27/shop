// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InventoryPage } from './InventoryPage'
import type { StockDraft, StockItem } from './inventoryTypes'

const item: StockItem = {
  id: 'stock_1',
  sku: 'PR-001',
  serialNumber: 'SN-001',
  productName: 'Midnight Gown',
  brand: 'Precious',
  category: 'ชุดราตรี',
  size: 'M',
  primaryColor: 'น้ำเงิน',
  publicDescription: '',
  setCount: 1,
  rentalPricePerDay: 2000,
  lateFeeRule: '300/day',
  depositAmount: 1000,
  imageUrls: [],
  status: 'available',
  createdAt: '2026-06-20T00:00:00.000Z',
}

const draft: StockDraft = {
  sku: '',
  serialNumber: '',
  productName: '',
  brand: '',
  category: '',
  size: '',
  primaryColor: '',
  publicDescription: '',
  setCount: '1',
  rentalPricePerDay: '',
  lateFeeRule: '',
  depositAmount: '',
  imageUrls: [],
  status: 'available',
}

function renderInventoryPage(overrides: Partial<ComponentProps<typeof InventoryPage>> = {}) {
  render(
    <InventoryPage
      items={[item]}
      query=""
      setQuery={vi.fn()}
      summary={{ total: 1, sets: 1, deposits: 1000, priced: 1 }}
      isFormOpen={false}
      isEditing={false}
      draft={draft}
      formError=""
      isSaving={false}
      onOpenForm={vi.fn()}
      onCloseForm={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onPreview={vi.fn()}
      onDraftChange={vi.fn()}
      onResetDraft={vi.fn()}
      onImageUpload={vi.fn()}
      onImageRemove={vi.fn()}
      onSave={vi.fn()}
      previewItem={null}
      previewImageIndex={0}
      onPreviewIndexChange={vi.fn()}
      onClosePreview={vi.fn()}
      brands={[]}
      categories={[]}
      colors={[]}
      rentals={[]}
      onUpdateStatus={vi.fn()}
      {...overrides}
    />,
  )
}

afterEach(() => {
  cleanup()
})

describe('InventoryPage shared CSS contract', () => {
  it('renders summary cards with the existing metric card classes and child wrappers', () => {
    renderInventoryPage()

    const totalCard = screen.getByText('รายการสต๊อก').closest('.metric-card')
    const setsCard = screen.getByText('จำนวนชุดรวม').closest('.metric-card')
    const pricedCard = screen.getByText('ตั้งราคาแล้ว').closest('.metric-card')
    const depositsCard = screen.getByText('เงินประกันรวม').closest('.metric-card')

    expect(totalCard).toHaveClass('metric-card', 'total')
    expect(totalCard?.querySelector('.metric-icon-wrapper')).not.toBeNull()
    expect(totalCard?.querySelector('.card-content')).not.toBeNull()

    expect(setsCard).toHaveClass('metric-card', 'verified')
    expect(setsCard?.querySelector('.unit')).toHaveTextContent('ชุด')
    expect(pricedCard).toHaveClass('metric-card', 'incomplete')
    expect(depositsCard).toHaveClass('metric-card', 'risk')
  })

  it('keeps required field markers inside a bold tag in the stock form', () => {
    renderInventoryPage({ isFormOpen: true })

    const productNameInput = screen.getByPlaceholderText('เช่น ชุดราตรี Midnight Starlight')
    const field = productNameInput.closest('label')

    expect(field?.querySelector('span b')).toHaveTextContent('*')
  })
})
