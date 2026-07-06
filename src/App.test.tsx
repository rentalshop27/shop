// @vitest-environment jsdom

import { render, screen, waitFor, fireEvent, cleanup, act, within } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const {
  loadAccessibleShops,
  loadCustomerSummaries,
  loadCustomers,
  loadStockItemsForRentalMapping,
  loadProductsWithStock,
  loadShopSettings,
  loadRentals,
  loadAuditLogs,
  loadPublicCatalog,
  updateShopSettings,
  authStateChange,
  supabase,
} = vi.hoisted(() => {
  const authStateChange = {
    callback: null as null | ((event: string, session: { user: { id: string; email?: string } } | null) => void),
  }

  return {
    loadAccessibleShops: vi.fn(),
    loadCustomerSummaries: vi.fn(),
    loadCustomers: vi.fn(),
    loadStockItemsForRentalMapping: vi.fn(),
    loadProductsWithStock: vi.fn(),
    loadShopSettings: vi.fn(),
    loadRentals: vi.fn(),
    loadAuditLogs: vi.fn(),
    loadPublicCatalog: vi.fn(),
    updateShopSettings: vi.fn(),
    authStateChange,
    supabase: {
      auth: {
        getSession: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn((callback) => {
          authStateChange.callback = callback
          return {
            data: {
              subscription: {
                unsubscribe: vi.fn(),
              },
            },
          }
        }),
      },
    },
  }
})

vi.mock('./lib/supabase', () => ({
  hasSupabaseConfig: true,
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'anon-key',
  supabase,
}))

vi.mock('./features/catalog/publicCatalogRemote', () => ({
  loadPublicCatalog,
}))

vi.mock('./features/customers/customerRemote', () => ({
  loadAccessibleShops,
  loadCustomerSummaries,
  loadCustomers,
  archiveRemoteCustomer: vi.fn(),
  createRemoteCustomer: vi.fn(),
  deleteRemoteCustomerDocuments: vi.fn(),
  updateRemoteCustomer: vi.fn(),
  updateRemoteCustomerRisk: vi.fn(),
  updateRemoteCustomerStatus: vi.fn(),
  uploadRemoteCustomerDocuments: vi.fn(),
}))

vi.mock('./features/inventory/stockRemote', () => ({
  DEFAULT_SHOP_RENTAL_PRICES: [{ days: 1, price: 100 }],
  DEFAULT_SHOP_DEPOSIT: 0,
  DEFAULT_SHOP_LATE_FINE_PER_DAY: 200,
  countRemoteRentalsForProduct: vi.fn(),
  countRemoteRentalsForStockItem: vi.fn(),
  loadStockItemsForRentalMapping,
  loadProductsWithStock,
  createProductWithVariants: vi.fn(),
  addStockToVariant: vi.fn(),
  deleteRemoteProduct: vi.fn(),
  deleteRemoteStockItem: vi.fn(),
  updateRemoteProduct: vi.fn(),
    updateRemoteProductPublicVisibility: vi.fn(),
    updateRemoteStockItemStatus: vi.fn(),
    updateShopSettings,
    loadShopSettings,
  }))

vi.mock('./features/rentals/rentalRemote', () => ({
  createRemoteRentals: vi.fn(),
  loadRentals,
  updateRemoteRentalStatus: vi.fn(),
  deleteRemoteRental: vi.fn(),
}))

vi.mock('./features/audit/auditRemote', () => ({
  loadAuditLogs,
  demoAuditLogs: [],
}))

import App from './App'

function makeShopSettings(overrides: Partial<{
  defaultRentalPrices: Array<{ days: number; price: number }>
  defaultDeposit: number
  defaultLateFinePerDay: number
}> = {}) {
  return {
    brands: ['Precious'],
    categories: ['ชุดราตรี'],
    colors: ['แดง'],
    publicCatalogEnabled: false,
    catalogHeroImageUrl: null,
    catalogMobileHeroImageUrl: null,
    defaultRentalPrices: [{ days: 1, price: 100 }],
    defaultDeposit: 500,
    defaultLateFinePerDay: 200,
    ...overrides,
  }
}

describe('App shop selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.history.pushState({}, '', '/')
    authStateChange.callback = null

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user_1', email: 'owner@example.com' },
        },
      },
    })

    loadAccessibleShops.mockResolvedValue([
      { id: 'shop_1', name: 'Precious Siam', publicCatalogSlug: 'precious-siam' },
      { id: 'shop_2', name: 'Precious Silom', publicCatalogSlug: 'precious-silom' },
    ])
    loadCustomerSummaries.mockResolvedValue([])
    loadCustomers.mockResolvedValue([])
    loadStockItemsForRentalMapping.mockResolvedValue([])
    loadProductsWithStock.mockResolvedValue([])
    loadShopSettings.mockResolvedValue(null)
    loadRentals.mockResolvedValue([])
    loadAuditLogs.mockResolvedValue([])
    loadPublicCatalog.mockResolvedValue({
      shop: { id: 'shop_1', name: 'Precious Siam' },
      items: [
        {
          productName: 'Public Ruby Dress',
          brand: 'Precious',
          category: 'ชุดราตรี',
          size: 'M',
          primaryColor: 'แดง',
          publicDescription: 'ชุดสำหรับออกงาน',
          setCount: 1,
          rentalPricePerDay: 2200,
          imageUrls: [],
          status: 'available',
          publicVisible: true,
          availabilityStatus: 'available',
          createdAt: '2026-06-29T00:00:00.000Z',
        },
      ],
    })
    updateShopSettings.mockResolvedValue(undefined)
    supabase.auth.signOut.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    cleanup()
  })

  it('loads the multi-shop overview with lightweight data', async () => {
    render(<App />)

    await waitFor(() => {
      expect(loadCustomerSummaries).toHaveBeenCalledWith(supabase, 'shop_1')
      expect(loadCustomerSummaries).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadStockItemsForRentalMapping).toHaveBeenCalledWith(supabase, 'shop_1')
      expect(loadStockItemsForRentalMapping).toHaveBeenCalledWith(supabase, 'shop_2')
    })

    expect(loadCustomers).not.toHaveBeenCalled()
    expect(loadProductsWithStock).not.toHaveBeenCalled()
  })

  it('multi-shop login displays aggregate dashboard, does not show ShopSelectScreen', async () => {
    document.documentElement.scrollTop = 900
    document.body.scrollTop = 900

    render(<App />)

    expect(await screen.findByText('หน้าแดชบอร์ดภาพรวมสาขา')).toBeTruthy()
    expect(screen.queryByText('เลือกร้านที่ต้องการเข้าใช้งาน')).toBeNull()
    expect(document.documentElement.scrollTop).toBe(0)
    expect(document.body.scrollTop).toBe(0)
  })

  it('opens public catalog routes without starting the authenticated app shell', async () => {
    window.history.pushState({}, '', '/catalog/precious-siam')

    render(<App />)

    expect(await screen.findByText('Public Ruby Dress')).toBeTruthy()
    expect(loadPublicCatalog).toHaveBeenCalledWith('precious-siam')
    expect(supabase.auth.getSession).not.toHaveBeenCalled()
    expect(screen.queryByText('ร้านที่กำลังใช้งาน')).toBeNull()
  })

  it('multi-shop overview loads summaries/stock mapping/rentals separately for each shop id', async () => {
    render(<App />)

    await waitFor(() => {
      expect(loadCustomerSummaries).toHaveBeenCalledWith(supabase, 'shop_1')
      expect(loadCustomerSummaries).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadStockItemsForRentalMapping).toHaveBeenCalledWith(supabase, 'shop_1')
      expect(loadStockItemsForRentalMapping).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadRentals).toHaveBeenCalledWith(supabase, 'shop_1', [], [])
      expect(loadRentals).toHaveBeenCalledWith(supabase, 'shop_2', [], [])
    })
  })

  it('enters the shop when clicking "เข้าร้านนี้" button and loads shop-mode data', async () => {
    render(<App />)

    // Wait for shops data to be loaded in overview
    await screen.findByText('หน้าแดชบอร์ดภาพรวมสาขา', {}, { timeout: 5000 })
    document.documentElement.scrollTop = 900
    document.body.scrollTop = 900

    // Find the enter shop button for Precious Silom
    const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ }, { timeout: 5000 })
    const enterButton = enterButtons[1]

    // Clear mocks before clicking to trace shop-mode specific calls
    loadCustomers.mockClear()
    loadProductsWithStock.mockClear()
    loadRentals.mockClear()

    fireEvent.click(enterButton)

    await waitFor(() => {
      expect(loadCustomers).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadProductsWithStock).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadRentals).toHaveBeenCalledWith(supabase, 'shop_2', [], [])
    }, { timeout: 5000 })

    expect((await screen.findByLabelText('ร้านที่กำลังใช้งาน', {}, { timeout: 5000 })).textContent).toContain('Precious Silom')
    expect(document.documentElement.scrollTop).toBe(0)
    expect(document.body.scrollTop).toBe(0)
  })

  it('keeps rendering when Safari rejects localStorage writes', async () => {
    const storageSetItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
      })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      render(<App />)

      const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ })
      fireEvent.click(enterButtons[0])

      expect(await screen.findByLabelText('ร้านที่กำลังใช้งาน')).toBeTruthy()
      expect(screen.queryByText('เปิดหน้าแอปไม่สำเร็จ')).toBeNull()
    } finally {
      storageSetItem.mockRestore()
      warn.mockRestore()
    }
  })

  it('opens profile with the authenticated email and no legacy shop select', async () => {
    render(<App />)

    const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ })
    fireEvent.click(enterButtons[0])
    await screen.findByLabelText('ร้านที่กำลังใช้งาน')

    fireEvent.click(screen.getAllByRole('button', { name: 'โปรไฟล์' })[0])

    expect(await screen.findByText('owner@example.com')).toBeTruthy()
    expect(screen.queryByText('สลับร้าน')).toBeNull()
    expect(screen.queryByText('ร้านที่ใช้งาน')).toBeNull()
  })

  it('switches shops from profile and reloads data for the selected shop', async () => {
    render(<App />)

    const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ })
    fireEvent.click(enterButtons[0])
    await screen.findByLabelText('ร้านที่กำลังใช้งาน')
    fireEvent.click(screen.getAllByRole('button', { name: 'โปรไฟล์' })[0])

    loadCustomers.mockClear()
    loadProductsWithStock.mockClear()
    loadShopSettings.mockClear()
    loadAuditLogs.mockClear()
    loadRentals.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Precious Silom' }))

    await waitFor(() => {
      expect(loadCustomers).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadProductsWithStock).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadShopSettings).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadAuditLogs).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadRentals).toHaveBeenCalledWith(supabase, 'shop_2', [], [])
    })

    expect((await screen.findByLabelText('ร้านที่กำลังใช้งาน')).textContent).toContain('Precious Silom')
    expect(screen.getByRole('heading', { name: 'โปรไฟล์' })).toBeTruthy()
  })

  it('preserves the inventory search when navigating away and back', async () => {
    render(<App />)

    const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ })
    fireEvent.click(enterButtons[0])
    await screen.findByLabelText('ร้านที่กำลังใช้งาน')

    fireEvent.click(screen.getAllByRole('button', { name: 'คลังชุด' })[0])
    const search = await screen.findByPlaceholderText(/ค้นหาด้วยรหัสหลัก/)
    fireEvent.change(search, { target: { value: 'emerald' } })

    fireEvent.click(screen.getAllByRole('button', { name: 'แดชบอร์ด' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: 'คลังชุด' })[0])

    expect((screen.getByPlaceholderText(/ค้นหาด้วยรหัสหลัก/) as HTMLInputElement).value).toBe('emerald')
  })

  it('keeps shop rental defaults unchanged when editing a new inventory draft', async () => {
    loadShopSettings.mockResolvedValue(makeShopSettings({
      defaultRentalPrices: [
        { days: 1, price: 100 },
        { days: 3, price: 250 },
      ],
    }))

    render(<App />)

    const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ })
    fireEvent.click(enterButtons[0])
    await screen.findByLabelText('ร้านที่กำลังใช้งาน')

    fireEvent.click(screen.getAllByRole('button', { name: 'คลังชุด' })[0])
    fireEvent.click(await screen.findByRole('button', { name: 'เพิ่มชุดหลัก' }))

    fireEvent.change(screen.getByDisplayValue('250'), { target: { value: '999' } })

    fireEvent.click(screen.getAllByRole('button', { name: 'ตั้งค่า' })[0])

    expect(await screen.findByDisplayValue('250')).toBeTruthy()
    expect(screen.queryByDisplayValue('999')).toBeNull()
  })

  it('prefills inventory late fine defaults as numbers without unit text', async () => {
    loadShopSettings.mockResolvedValue(makeShopSettings({ defaultLateFinePerDay: 200 }))

    render(<App />)

    const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ })
    fireEvent.click(enterButtons[0])
    await screen.findByLabelText('ร้านที่กำลังใช้งาน')

    fireEvent.click(screen.getAllByRole('button', { name: 'คลังชุด' })[0])
    fireEvent.click(await screen.findByRole('button', { name: 'เพิ่มชุดหลัก' }))

    const lateFineInput = screen.getByLabelText('เกณฑ์ค่าปรับล่าช้า') as HTMLInputElement
    expect(lateFineInput.value).toBe('200')
    expect(screen.queryByDisplayValue('200 บาท/วัน')).toBeNull()
  })

  it('uses global rental default fallbacks when shop settings are empty', async () => {
    loadShopSettings.mockResolvedValue(null)

    render(<App />)

    const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ })
    fireEvent.click(enterButtons[0])
    await screen.findByLabelText('ร้านที่กำลังใช้งาน')

    fireEvent.click(screen.getAllByRole('button', { name: 'ตั้งค่า' })[0])

    expect(await screen.findByDisplayValue('100')).toBeTruthy()
    expect(screen.getByDisplayValue('200')).toBeTruthy()
  })

  it('keeps only the ready settings sections interactive', async () => {
    loadShopSettings.mockResolvedValue(makeShopSettings())

    render(<App />)

    const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ })
    fireEvent.click(enterButtons[0])
    await screen.findByLabelText('ร้านที่กำลังใช้งาน')

    fireEvent.click(screen.getAllByRole('button', { name: 'ตั้งค่า' })[0])

    const tabList = await screen.findByRole('tablist', { name: 'Settings tabs' })
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(tabList.querySelectorAll('[role="tab"]')).toHaveLength(2)

    for (const label of ['สิทธิ์พนักงาน', 'การแจ้งเตือน', 'เชื่อมต่อระบบ']) {
      const matchingButtons = screen.getAllByRole('button', { name: new RegExp(label) })
      expect(matchingButtons.length).toBeGreaterThan(0)
      matchingButtons.forEach((button) => {
        expect((button as HTMLButtonElement).disabled).toBe(true)
        expect(button.getAttribute('role')).toBeNull()
      })
    }
  })

  it('lets settings switch to inventory from the in-page tab list', async () => {
    loadShopSettings.mockResolvedValue(makeShopSettings())

    render(<App />)

    const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ })
    fireEvent.click(enterButtons[0])
    await screen.findByLabelText('ร้านที่กำลังใช้งาน')

    fireEvent.click(screen.getAllByRole('button', { name: 'ตั้งค่า' })[0])

    const tabList = await screen.findByRole('tablist', { name: 'Settings tabs' })
    fireEvent.click(within(tabList).getByRole('tab', { name: 'ตัวเลือกสินค้า' }))

    expect(await screen.findByRole('button', { name: 'เพิ่มแบรนด์' })).toBeTruthy()
    expect(screen.queryByLabelText('เงินประกัน (มัดจำ) เริ่มต้น (บาท)')).toBeNull()
  })

  it('reverts default deposit when saving shop settings fails', async () => {
    loadShopSettings.mockResolvedValue(makeShopSettings({ defaultDeposit: 500 }))
    updateShopSettings.mockRejectedValueOnce(new Error('save failed'))
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    try {
      render(<App />)

      const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ })
      fireEvent.click(enterButtons[0])
      await screen.findByLabelText('ร้านที่กำลังใช้งาน')

      fireEvent.click(screen.getAllByRole('button', { name: 'ตั้งค่า' })[0])

      const depositInput = await screen.findByLabelText('เงินประกัน (มัดจำ) เริ่มต้น (บาท)') as HTMLInputElement
      fireEvent.change(depositInput, { target: { value: '999' } })

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('save failed'))
      })

      await waitFor(() => {
        expect(depositInput.value).toBe('500')
      })
    } finally {
      alertSpy.mockRestore()
    }
  })

  it('allows an authenticated user without shop access to retry a failed logout', async () => {
    loadAccessibleShops.mockResolvedValue([])
    supabase.auth.signOut.mockResolvedValue({ error: new Error('logout unavailable') })
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'ออกจากระบบ' }))

    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
    expect((await screen.findByRole('alert')).textContent).toContain('logout unavailable')
    expect((screen.getByRole('button', { name: 'ออกจากระบบ' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('keeps a failed overview shop available to enter', async () => {
    loadCustomerSummaries.mockImplementation((_client, selectedShopId) => {
      if (selectedShopId === 'shop_2') {
        return Promise.reject(new Error('customers unavailable'))
      }
      return Promise.resolve([])
    })

    render(<App />)

    expect(await screen.findByText('Precious Silom')).toBeTruthy()
    expect(await screen.findByText(/ข้อมูลภาพรวมของร้านนี้ไม่พร้อม/)).toBeTruthy()

    const shopCard = screen.getByText('Precious Silom').closest('.shop-card')
    const enterButton = shopCard?.querySelector<HTMLButtonElement>('button')
    expect(enterButton).toBeTruthy()

    loadCustomerSummaries.mockResolvedValue([])
    fireEvent.click(enterButton!)

    await waitFor(() => {
      expect(loadCustomers).toHaveBeenCalledWith(supabase, 'shop_2')
    })
  })

  it('keeps the selected shop when the existing session refreshes', async () => {
    render(<App />)

    const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ })
    fireEvent.click(enterButtons[1])

    expect((await screen.findByLabelText('ร้านที่กำลังใช้งาน')).textContent).toContain('Precious Silom')
    expect(loadAccessibleShops).toHaveBeenCalledTimes(1)

    act(() => {
      authStateChange.callback?.('TOKEN_REFRESHED', { user: { id: 'user_1' } })
    })

    expect(screen.queryByText('กำลังตรวจสอบร้านค้า')).toBeNull()
    expect(screen.getByLabelText('ร้านที่กำลังใช้งาน').textContent).toContain('Precious Silom')
    expect(loadAccessibleShops).toHaveBeenCalledTimes(1)
  })
})
