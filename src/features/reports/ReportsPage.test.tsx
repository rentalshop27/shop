// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Customer } from '../customers/customerTypes'
import type { StockItem } from '../inventory/inventoryTypes'
import type { RentalOrder, RentalStatus } from '../rentals/rentalTypes'
import { ReportsPage } from './ReportsPage'
import {
  loadGoogleSheetsReportStatus,
  syncGoogleSheetsReport,
} from './googleSheetsReportRemote'

vi.mock('./googleSheetsReportRemote', async () => {
  const actual = await vi.importActual<typeof import('./googleSheetsReportRemote')>('./googleSheetsReportRemote')
  return {
    ...actual,
    loadGoogleSheetsReportStatus: vi.fn(),
    syncGoogleSheetsReport: vi.fn(),
  }
})

const supabase = {} as never

const customer: Customer = {
  id: 'cus_1',
  shopId: 'shop_1',
  customerCode: 'PR-C001',
  fullName: 'นนท์',
  lineAccount: '@non',
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

const stockItem: StockItem = {
  id: 'stock_1',
  sku: 'SKU-001',
  serialNumber: 'SN-001',
  productName: 'Midnight Dress',
  brand: 'Precious',
  category: 'ชุดราตรี',
  size: 'M',
  primaryColor: 'น้ำเงิน',
  publicDescription: '',
  setCount: 1,
  rentalPricePerDay: 1200,
  lateFeeRule: '300/day',
  depositAmount: 2000,
  imageUrls: [],
  createdAt: '2026-06-01T00:00:00.000Z',
  status: 'available',
}

function makeRental(
  id: string,
  dates: { pickupDate: string; returnDate: string },
  status: RentalStatus = 'booked',
  collectedAmount = 3200,
): RentalOrder {
  return {
    id,
    orderCode: `PR-ORD-${id}`,
    customer,
    costume: stockItem,
    pickupDate: dates.pickupDate,
    returnDate: dates.returnDate,
    rentalPrice: 1200,
    depositAmount: 2000,
    collectedAmount,
    status,
    notes: '',
    createdAt: '2026-06-11T00:00:00.000Z',
    updatedAt: '2026-06-11T00:00:00.000Z',
  }
}

afterEach(cleanup)
afterEach(() => {
  vi.clearAllMocks()
})

describe('ReportsPage Google Sheets panel', () => {
  it('shows disconnected messaging and disables sync before Google is connected', async () => {
    vi.mocked(loadGoogleSheetsReportStatus).mockResolvedValue({
      connected: false,
      googleEmail: '',
      spreadsheetUrl: '',
      lastSyncAt: '',
      lastSyncStatus: 'idle',
      lastSyncError: '',
    })

    render(
      <ReportsPage
        rentals={[]}
        stockItems={[]}
        supabase={supabase}
        shopId="shop_1"
        shopName="Precious Siam"
      />,
    )

    await waitFor(() => expect(screen.getByText('ยังไม่ได้เชื่อม Google ในหน้าโปรไฟล์')).toBeTruthy())
    expect((screen.getByRole('button', { name: 'ซิงก์ไป Google Sheets' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('syncs and reveals the Google Sheet link when connected', async () => {
    vi.mocked(loadGoogleSheetsReportStatus).mockResolvedValue({
      connected: true,
      googleEmail: 'owner@gmail.com',
      spreadsheetUrl: '',
      lastSyncAt: '',
      lastSyncStatus: 'idle',
      lastSyncError: '',
    })
    vi.mocked(syncGoogleSheetsReport).mockResolvedValue({
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet_1',
      syncedAt: '2026-06-23T10:00:00.000Z',
    })

    render(
      <ReportsPage
        rentals={[]}
        stockItems={[]}
        supabase={supabase}
        shopId="shop_1"
        shopName="Precious Siam"
      />,
    )

    await waitFor(() => expect(screen.getByText(/เชื่อมกับ owner@gmail.com/)).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'ซิงก์ไป Google Sheets' }))

    await waitFor(() => expect(syncGoogleSheetsReport).toHaveBeenCalledWith(supabase, 'shop_1'))
    const link = await screen.findByRole('link', { name: 'เปิดชีต' })
    expect(link.getAttribute('href')).toBe('https://docs.google.com/spreadsheets/d/sheet_1')
  })
})

describe('ReportsPage general analytics', () => {
  it('renders the implemented report widgets instead of the backlog placeholder', () => {
    render(
      <ReportsPage
        rentals={[
          makeRental('booked', { pickupDate: '2026-06-10', returnDate: '2026-06-11' }, 'booked', 3200),
          makeRental('returned', { pickupDate: '2026-06-20', returnDate: '2026-06-21' }, 'returned', 4200),
        ]}
        stockItems={[stockItem]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'รายงานยอดเช่า / รายได้รวม' }))

    expect(screen.queryByText('ระบบวิเคราะห์เชิงลึกกำลังพัฒนาเพิ่มเติม')).toBeNull()
    expect(screen.getByRole('heading', { name: 'แนวโน้มรายได้รายเดือน' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'สัดส่วนรายได้ตามหมวดหมู่' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'สรุปเงินประกันรายเดือน' })).toBeTruthy()
    expect(screen.getByText('ออเดอร์คืนชุดแล้ว')).toBeTruthy()
    expect(screen.getByText('คืนชุดแล้ว ฿2,000')).toBeTruthy()
  })
})
