// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InventoryPage } from './InventoryPage'
import { useInventoryController } from './useInventoryController'
import type { StockItem } from './inventoryTypes'

const stockItems: StockItem[] = [
  {
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
  },
  {
    id: 'stock_2',
    sku: 'PR-002',
    serialNumber: 'SN-002',
    productName: 'Emerald Dress',
    brand: 'Precious',
    category: 'ชุดราตรี',
    size: 'S',
    primaryColor: 'เขียว',
    publicDescription: '',
    setCount: 1,
    rentalPricePerDay: 2500,
    lateFeeRule: '400/day',
    depositAmount: 1200,
    imageUrls: [],
    status: 'available',
    createdAt: '2026-06-20T00:00:00.000Z',
  },
]

function TestHarness({ items = stockItems }: { items?: StockItem[] }) {
  const [currentStockItems, setCurrentStockItems] = useState(items)
  const [isSaving, setIsSaving] = useState(false)
  const { pageProps } = useInventoryController({
    stockItems: currentStockItems,
    setStockItems: setCurrentStockItems,
    rentals: [],
    brands: [],
    categories: [],
    colors: [],
    isSaving,
    setIsSaving,
    isAuthenticated: false,
    shopId: null,
    supabase: null,
    onLoadAuditLogs: vi.fn(),
  })

  return <InventoryPage {...pageProps} onOpenCatalog={vi.fn()} />
}

function SwitchableShopHarness() {
  const [shopId, setShopId] = useState('shop_1')
  const [currentStockItems, setCurrentStockItems] = useState(stockItems)
  const [isSaving, setIsSaving] = useState(false)
  const { pageProps } = useInventoryController({
    stockItems: currentStockItems,
    setStockItems: setCurrentStockItems,
    rentals: [],
    brands: [],
    categories: [],
    colors: [],
    isSaving,
    setIsSaving,
    isAuthenticated: true,
    shopId,
    supabase: null,
    onLoadAuditLogs: vi.fn(),
  })

  return (
    <>
      <button type="button" onClick={() => setShopId('shop_2')}>สลับร้านทดสอบ</button>
      <InventoryPage {...pageProps} onOpenCatalog={vi.fn()} />
    </>
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('useInventoryController', () => {
  it('filters visible stock items with inventory-owned search state', async () => {
    const user = userEvent.setup()
    render(<TestHarness />)

    await user.type(screen.getByPlaceholderText(/ค้นหาด้วย SKU/), 'emerald')

    expect(screen.getByText('Emerald Dress')).toBeInTheDocument()
    expect(screen.queryByText('Midnight Gown')).not.toBeInTheDocument()
  })

  it('opens the stock form with the selected item draft when editing', async () => {
    const user = userEvent.setup()
    render(<TestHarness />)

    await user.click(screen.getByRole('button', { name: 'แก้ไข PR-002' }))

    expect(screen.getByRole('heading', { name: 'แก้ไขสินค้าในคลังชุด' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Emerald Dress')).toBeInTheDocument()
    expect(screen.getByDisplayValue('PR-002')).toBeInTheDocument()
  })

  it('creates a local stock item through the extracted save path', async () => {
    const user = userEvent.setup()
    render(<TestHarness items={[]} />)

    await user.click(screen.getByRole('button', { name: 'เพิ่มสต๊อก' }))
    await user.type(screen.getByLabelText(/ชื่อสินค้า/), 'Ruby Dress')
    await user.type(screen.getByLabelText(/SKU\/รหัสสต๊อก/), 'PR-003')
    await user.click(screen.getByRole('button', { name: 'บันทึกสต๊อก' }))

    expect(screen.getByText('Ruby Dress')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'เพิ่มสินค้าเข้าคลังชุด' })).not.toBeInTheDocument()
  })

  it('removes a confirmed local stock item through the extracted delete path', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TestHarness />)

    await user.click(screen.getByRole('button', { name: 'ลบ PR-001' }))

    expect(screen.queryByText('Midnight Gown')).not.toBeInTheDocument()
    expect(screen.getByText('Emerald Dress')).toBeInTheDocument()
  })

  it('resets inventory-owned state when the active shop changes', async () => {
    const user = userEvent.setup()
    render(<SwitchableShopHarness />)

    const search = screen.getByPlaceholderText(/ค้นหาด้วย SKU/)
    await user.type(search, 'emerald')
    await user.click(screen.getByRole('button', { name: 'สลับร้านทดสอบ' }))

    expect(search).toHaveValue('')
  })
})
