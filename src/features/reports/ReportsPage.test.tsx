// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
