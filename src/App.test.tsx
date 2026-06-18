// @vitest-environment jsdom

import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const {
  loadAccessibleShops,
  loadCustomers,
  loadStockItems,
  loadShopSettings,
  loadRentals,
  loadAuditLogs,
  supabase,
} = vi.hoisted(() => ({
  loadAccessibleShops: vi.fn(),
  loadCustomers: vi.fn(),
  loadStockItems: vi.fn(),
  loadShopSettings: vi.fn(),
  loadRentals: vi.fn(),
  loadAuditLogs: vi.fn(),
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
  },
}))

vi.mock('./lib/supabase', () => ({
  hasSupabaseConfig: true,
  supabase,
}))

vi.mock('./features/customers/customerRemote', () => ({
  loadAccessibleShops,
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
  countRemoteRentalsForStockSku: vi.fn(),
  loadStockItems,
  createRemoteStockItem: vi.fn(),
  createRemoteStockItems: vi.fn(),
  deleteRemoteStockItem: vi.fn(),
  updateRemoteStockItem: vi.fn(),
  updateShopSettings: vi.fn(),
  loadShopSettings,
}))

vi.mock('./features/rentals/rentalRemote', () => ({
  createRemoteRentals: vi.fn(),
  loadRentals,
}))

vi.mock('./features/audit/auditRemote', () => ({
  loadAuditLogs,
  demoAuditLogs: [],
}))

import App from './App'

describe('App shop selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user_1' },
        },
      },
    })

    loadAccessibleShops.mockResolvedValue([
      { id: 'shop_1', name: 'Precious Siam' },
      { id: 'shop_2', name: 'Precious Silom' },
    ])
    loadCustomers.mockResolvedValue([])
    loadStockItems.mockResolvedValue([])
    loadShopSettings.mockResolvedValue(null)
    loadRentals.mockResolvedValue([])
    loadAuditLogs.mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
  })

  it('multi-shop login displays aggregate dashboard, does not show ShopSelectScreen', async () => {
    render(<App />)

    expect(await screen.findByText('หน้าแดชบอร์ดภาพรวมสาขา')).toBeTruthy()
    expect(screen.queryByText('เลือกร้านที่ต้องการเข้าใช้งาน')).toBeNull()
  })

  it('multi-shop overview loads customers/stock/rentals separately for each shop id', async () => {
    render(<App />)

    await waitFor(() => {
      expect(loadCustomers).toHaveBeenCalledWith(supabase, 'shop_1')
      expect(loadCustomers).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadStockItems).toHaveBeenCalledWith(supabase, 'shop_1')
      expect(loadStockItems).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadRentals).toHaveBeenCalledWith(supabase, 'shop_1', [], [])
      expect(loadRentals).toHaveBeenCalledWith(supabase, 'shop_2', [], [])
    })
  })

  it('enters the shop when clicking "เข้าร้านนี้" button and loads shop-mode data', async () => {
    render(<App />)

    // Wait for shops data to be loaded in overview
    await screen.findByText('หน้าแดชบอร์ดภาพรวมสาขา', {}, { timeout: 5000 })

    // Find the enter shop button for Precious Silom
    const enterButtons = await screen.findAllByRole('button', { name: /เข้าร้านนี้/ }, { timeout: 5000 })
    const enterButton = enterButtons[1]

    // Clear mocks before clicking to trace shop-mode specific calls
    loadCustomers.mockClear()
    loadStockItems.mockClear()
    loadRentals.mockClear()

    fireEvent.click(enterButton)

    await waitFor(() => {
      expect(loadCustomers).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadStockItems).toHaveBeenCalledWith(supabase, 'shop_2')
      expect(loadRentals).toHaveBeenCalledWith(supabase, 'shop_2', [], [])
    }, { timeout: 5000 })

    expect((await screen.findByLabelText('ร้านที่กำลังใช้งาน', {}, { timeout: 5000 })).textContent).toContain('Precious Silom')
  })

  it('keeps a failed overview shop available to enter', async () => {
    loadCustomers.mockImplementation((_client, selectedShopId) => {
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

    loadCustomers.mockResolvedValue([])
    fireEvent.click(enterButton!)

    await waitFor(() => {
      expect(loadCustomers).toHaveBeenCalledWith(supabase, 'shop_2')
    })
  })
})
