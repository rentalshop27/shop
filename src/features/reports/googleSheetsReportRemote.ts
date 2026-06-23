import type { SupabaseClient } from '@supabase/supabase-js'

export type GoogleSheetsReportStatus =
  | {
      connected: false
      googleEmail: ''
      spreadsheetUrl: ''
      lastSyncAt: ''
      lastSyncStatus: 'idle'
      lastSyncError: ''
    }
  | {
      connected: true
      googleEmail: string
      spreadsheetUrl: string
      lastSyncAt: string
      lastSyncStatus: 'idle' | 'success' | 'error'
      lastSyncError: string
    }

type GoogleIntegrationRow = {
  google_email: string
  connection_status: string
  report_spreadsheet_url: string | null
  last_sync_at: string | null
  last_sync_status: 'idle' | 'success' | 'error'
  last_sync_error: string | null
}

type SyncResponse = {
  spreadsheetUrl?: string
  syncedAt?: string
}

export async function loadGoogleSheetsReportStatus(
  supabase: SupabaseClient,
  shopId: string,
): Promise<GoogleSheetsReportStatus> {
  const { data, error } = await supabase
    .from('shop_google_integrations')
    .select('google_email, connection_status, report_spreadsheet_url, last_sync_at, last_sync_status, last_sync_error')
    .eq('shop_id', shopId)
    .eq('provider', 'google')
    .maybeSingle()

  if (error) throw error
  if (!data || data.connection_status !== 'connected') {
    return disconnectedStatus()
  }

  const row = data as GoogleIntegrationRow
  return {
    connected: true,
    googleEmail: row.google_email,
    spreadsheetUrl: row.report_spreadsheet_url ?? '',
    lastSyncAt: row.last_sync_at ?? '',
    lastSyncStatus: row.last_sync_status ?? 'idle',
    lastSyncError: row.last_sync_error ?? '',
  }
}

export async function syncGoogleSheetsReport(
  supabase: SupabaseClient,
  shopId: string,
): Promise<{ spreadsheetUrl: string; syncedAt: string }> {
  const { data, error } = await supabase.functions.invoke<SyncResponse>('google-sheets-report-sync', {
    body: { shopId },
  })

  if (error) throw error

  return {
    spreadsheetUrl: data?.spreadsheetUrl ?? '',
    syncedAt: data?.syncedAt ?? new Date().toISOString(),
  }
}

export function disconnectedStatus(): GoogleSheetsReportStatus {
  return {
    connected: false,
    googleEmail: '',
    spreadsheetUrl: '',
    lastSyncAt: '',
    lastSyncStatus: 'idle',
    lastSyncError: '',
  }
}
