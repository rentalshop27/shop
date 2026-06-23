import { describe, expect, it, vi } from 'vitest'
import {
  disconnectedStatus,
  loadGoogleSheetsReportStatus,
  syncGoogleSheetsReport,
} from './googleSheetsReportRemote'

function createQueryMock(result: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  }
  return query
}

describe('googleSheetsReportRemote', () => {
  it('loads connected report spreadsheet status for the selected shop', async () => {
    const query = createQueryMock({
      data: {
        google_email: 'owner@gmail.com',
        connection_status: 'connected',
        report_spreadsheet_url: 'https://docs.google.com/spreadsheets/d/sheet_1',
        last_sync_at: '2026-06-23T10:00:00.000Z',
        last_sync_status: 'success',
        last_sync_error: '',
      },
      error: null,
    })
    const supabase = {
      from: vi.fn(() => query),
    }

    const status = await loadGoogleSheetsReportStatus(supabase as never, 'shop_1')

    expect(supabase.from).toHaveBeenCalledWith('shop_google_integrations')
    expect(query.eq).toHaveBeenCalledWith('shop_id', 'shop_1')
    expect(status).toEqual({
      connected: true,
      googleEmail: 'owner@gmail.com',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet_1',
      lastSyncAt: '2026-06-23T10:00:00.000Z',
      lastSyncStatus: 'success',
      lastSyncError: '',
    })
  })

  it('returns disconnected status when the shop has no Google integration', async () => {
    const query = createQueryMock({ data: null, error: null })
    const supabase = {
      from: vi.fn(() => query),
    }

    await expect(loadGoogleSheetsReportStatus(supabase as never, 'shop_1')).resolves.toEqual(disconnectedStatus())
  })

  it('invokes the report sync function with the selected shop id', async () => {
    const invoke = vi.fn(() => Promise.resolve({
      data: {
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet_1',
        syncedAt: '2026-06-23T10:00:00.000Z',
      },
      error: null,
    }))
    const supabase = {
      functions: { invoke },
    }

    const result = await syncGoogleSheetsReport(supabase as never, 'shop_1')

    expect(invoke).toHaveBeenCalledWith('google-sheets-report-sync', {
      body: { shopId: 'shop_1' },
    })
    expect(result.spreadsheetUrl).toBe('https://docs.google.com/spreadsheets/d/sheet_1')
  })
})
