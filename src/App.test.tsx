// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

  it('asks the user to choose a shop before loading multi-shop data', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(await screen.findByText('เลือกร้านที่ต้องการเข้าใช้งาน')).toBeTruthy()
    expect(loadCustomers).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Precious Silom/ }))

    await waitFor(() => {
      expect(loadCustomers).toHaveBeenCalledWith(supabase, 'shop_2')
    })
    expect(loadStockItems).toHaveBeenCalledWith(supabase, 'shop_2')
    expect(loadRentals).toHaveBeenCalledWith(supabase, 'shop_2', [], [])
    expect((await screen.findByLabelText('ร้านที่กำลังใช้งาน')).textContent).toContain('Precious Silom')
  })
})
