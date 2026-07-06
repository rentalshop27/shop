/* @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InventoryPage } from './InventoryPage'
import type { ProductWithStockSummary } from './inventoryTypes'

const product: ProductWithStockSummary = {
  id: 'product_1',
  baseSku: 'SKU-001',
  productName: 'Golden Dress',
  brand: 'Precious',
  category: 'Evening',
  primaryColor: 'Gold',
  publicDescription: '',
  rentalTiers: [{ days: 1, price: 1200 }],
  lateFeeRule: '100',
  depositAmount: 500,
  imageUrls: [],
  publicVisible: true,
  isFeatured: false,
  displayOrder: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
  stockItems: [],
}

describe('InventoryPage', () => {
  beforeEach(() => {
    window.localStorage.setItem('inventoryViewMode', 'card')
  })

  it('hides product delete controls when no destructive handler is provided', () => {
    render(
      <InventoryPage
        products={[product]}
        query=""
        setQuery={vi.fn()}
        summary={{ total: 0, sets: 1, deposits: 500, priced: 1 }}
        isFormOpen={false}
        isEditing={false}
        draft={{
          baseSku: '',
          productName: '',
          brand: '',
          category: '',
          primaryColor: '',
          publicDescription: '',
          rentalTiers: [{ days: 1, price: 0 }],
          lateFeeRule: '',
          depositAmount: '',
          imageUrls: [],
          publicVisible: false,
          isFeatured: false,
          displayOrder: 0,
          variants: [],
        }}
        formError=""
        isSaving={false}
        onOpenForm={vi.fn()}
        onCloseForm={vi.fn()}
        onEdit={vi.fn()}
        onAddStock={vi.fn()}
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
        onTogglePublicVisibility={vi.fn()}
        onOpenCatalog={vi.fn()}
        defaultRentalPrices={[{ days: 1, price: 1200 }]}
        defaultDeposit={500}
        defaultLateFinePerDay={100}
      />,
    )

    expect(screen.queryByTitle('ลบชุดหลัก')).toBeNull()
  })
})
