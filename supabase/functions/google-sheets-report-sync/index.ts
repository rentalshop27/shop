import {
  createCorsHeaders,
  createOptionsResponse,
  functionErrorResponse,
  getDriveAccessToken,
  requireShopAccess,
} from '../_shared/googleDrive.ts'
import {
  REPORT_SHEETS,
  buildReportValues,
  buildStaleClearRanges,
  quoteSheetName,
  type CustomerRow,
  type SheetData,
  type ShopRow,
  type StockRow,
  type RentalRow,
} from './reportSheets.ts'

const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

type IntegrationRow = {
  id: string
  report_spreadsheet_id: string | null
}

type ServiceClient = Awaited<ReturnType<typeof requireShopAccess>>['supabase']

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return createOptionsResponse(request)
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...createCorsHeaders(request),
        'Content-Type': 'application/json',
      },
    })
  }

  let shopId = ''

  try {
    const body = await request.json().catch(() => ({})) as { shopId?: string }
    shopId = body.shopId?.trim() || ''
    if (!shopId) {
      return new Response(JSON.stringify({ error: 'Missing shopId' }), {
        status: 400,
        headers: {
          ...createCorsHeaders(request),
          'Content-Type': 'application/json',
        },
      })
    }

    const { supabase } = await requireShopAccess(request, shopId)
    const accessToken = await getDriveAccessToken(supabase, shopId)
    const integration = await loadIntegration(supabase, shopId)
    const data = await loadReportData(supabase, shopId)
    const spreadsheet = await getOrCreateReportSpreadsheet(
      accessToken,
      integration.report_spreadsheet_id,
      data.shop.name,
    )
    if (spreadsheet.created) {
      await saveReportSpreadsheetReference(supabase, integration.id, shopId, spreadsheet)
    }

    await ensureReportSheets(accessToken, spreadsheet.spreadsheetId, spreadsheet.sheetTitles)
    await writeReportSheets(accessToken, spreadsheet.spreadsheetId, buildReportValues(data))

    const syncedAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('shop_google_integrations')
      .update({
        report_spreadsheet_id: spreadsheet.spreadsheetId,
        report_spreadsheet_url: spreadsheet.spreadsheetUrl,
        last_sync_at: syncedAt,
        last_sync_status: 'success',
        last_sync_error: '',
        updated_at: syncedAt,
      })
      .eq('id', integration.id)
      .eq('shop_id', shopId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({
      spreadsheetId: spreadsheet.spreadsheetId,
      spreadsheetUrl: spreadsheet.spreadsheetUrl,
      syncedAt,
    }), {
      status: 200,
      headers: {
        ...createCorsHeaders(request),
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (shopId) {
      try {
        const { supabase } = await requireShopAccess(request, shopId)
        await supabase
          .from('shop_google_integrations')
          .update({
            last_sync_status: 'error',
            last_sync_error: error instanceof Error ? error.message : 'Unexpected error',
            updated_at: new Date().toISOString(),
          })
          .eq('shop_id', shopId)
          .eq('provider', 'google')
      } catch {
        // Keep the original error response.
      }
    }

    const response = functionErrorResponse(error, 'ซิงก์รายงานไป Google Sheets ไม่สำเร็จ')
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        ...createCorsHeaders(request),
      },
    })
  }
})

async function loadIntegration(supabase: ServiceClient, shopId: string) {
  const { data, error } = await supabase
    .from('shop_google_integrations')
    .select('id, report_spreadsheet_id')
    .eq('shop_id', shopId)
    .eq('provider', 'google')
    .eq('connection_status', 'connected')
    .single()

  if (error) throw error
  return data as IntegrationRow
}

async function loadReportData(supabase: ServiceClient, shopId: string): Promise<SheetData> {
  const [shopResult, customerResult, stockResult, rentalResult] = await Promise.all([
    supabase.from('shops').select('id, name').eq('id', shopId).single(),
    supabase
      .from('customers')
      .select('id, customer_code, full_name, line_account, phone, profile_status, risk_flag, archived_at, created_at, updated_at')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: true }),
    supabase
      .from('stock_items')
      .select('id, sku, serial_number, product_name, brand, category, size, primary_color, rental_price_per_day, deposit_amount, created_at')
      .eq('shop_id', shopId)
      .order('sku', { ascending: true }),
    supabase
      .from('rentals')
      .select('id, order_code, customer_id, stock_item_sku, pickup_date, return_date, rental_price, deposit_amount, collected_amount, status, deposit_status, deposit_forfeited_amount, deposit_resolution_note, deposit_resolved_at, notes, created_at, updated_at')
      .eq('shop_id', shopId)
      .order('pickup_date', { ascending: false }),
  ])

  if (shopResult.error) throw shopResult.error
  if (customerResult.error) throw customerResult.error
  if (stockResult.error) throw stockResult.error
  if (rentalResult.error) throw rentalResult.error

  return {
    shop: shopResult.data as ShopRow,
    customers: (customerResult.data ?? []) as CustomerRow[],
    stockItems: (stockResult.data ?? []) as StockRow[],
    rentals: (rentalResult.data ?? []) as RentalRow[],
  }
}

async function saveReportSpreadsheetReference(
  supabase: ServiceClient,
  integrationId: string,
  shopId: string,
  spreadsheet: { spreadsheetId: string; spreadsheetUrl: string },
) {
  const { error } = await supabase
    .from('shop_google_integrations')
    .update({
      report_spreadsheet_id: spreadsheet.spreadsheetId,
      report_spreadsheet_url: spreadsheet.spreadsheetUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId)
    .eq('shop_id', shopId)

  if (error) throw error
}

async function createSpreadsheet(accessToken: string, shopName: string) {
  const response = await fetch(GOOGLE_SHEETS_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `${shopName} - Precious Reports`,
        locale: 'th_TH',
        timeZone: 'Asia/Bangkok',
      },
      sheets: REPORT_SHEETS.map((title) => ({ properties: { title } })),
    }),
  })

  if (!response.ok) {
    throw new Error(`Google Sheets create failed: ${response.status}`)
  }

  const result = await response.json() as {
    spreadsheetId: string
    spreadsheetUrl: string
  }

  return {
    spreadsheetId: result.spreadsheetId,
    spreadsheetUrl: result.spreadsheetUrl,
    sheetTitles: REPORT_SHEETS,
    created: true,
  }
}

async function getOrCreateReportSpreadsheet(
  accessToken: string,
  spreadsheetId: string | null,
  shopName: string,
) {
  if (!spreadsheetId) {
    return createSpreadsheet(accessToken, shopName)
  }

  try {
    return {
      ...(await getSpreadsheet(accessToken, spreadsheetId)),
      created: false,
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Google Sheets load failed: 404')) {
      return createSpreadsheet(accessToken, shopName)
    }
    throw error
  }
}

async function getSpreadsheet(accessToken: string, spreadsheetId: string) {
  const url = new URL(`${GOOGLE_SHEETS_API}/${spreadsheetId}`)
  url.searchParams.set('fields', 'spreadsheetId,spreadsheetUrl,sheets.properties.title')

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(`Google Sheets load failed: ${response.status}`)
  }

  const result = await response.json() as {
    spreadsheetId: string
    spreadsheetUrl: string
    sheets?: Array<{ properties?: { title?: string } }>
  }

  return {
    spreadsheetId: result.spreadsheetId,
    spreadsheetUrl: result.spreadsheetUrl,
    sheetTitles: (result.sheets ?? []).map((sheet) => sheet.properties?.title).filter(Boolean) as string[],
  }
}

async function ensureReportSheets(accessToken: string, spreadsheetId: string, existingTitles: string[]) {
  const missingTitles = REPORT_SHEETS.filter((title) => !existingTitles.includes(title))
  if (missingTitles.length === 0) return

  const response = await fetch(`${GOOGLE_SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: missingTitles.map((title) => ({
        addSheet: { properties: { title } },
      })),
    }),
  })

  if (!response.ok) {
    throw new Error(`Google Sheets tab update failed: ${response.status}`)
  }
}

async function writeReportSheets(accessToken: string, spreadsheetId: string, valuesBySheet: Record<string, unknown[][]>) {
  const updateResponse = await fetch(`${GOOGLE_SHEETS_API}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: REPORT_SHEETS.map((title) => ({
        range: `${quoteSheetName(title)}!A1`,
        values: valuesBySheet[title] ?? [[]],
      })),
    }),
  })

  if (!updateResponse.ok) {
    throw new Error(`Google Sheets write failed: ${updateResponse.status}`)
  }

  const clearResponse = await fetch(`${GOOGLE_SHEETS_API}/${spreadsheetId}/values:batchClear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ranges: buildStaleClearRanges(valuesBySheet),
    }),
  })

  if (!clearResponse.ok) {
    throw new Error(`Google Sheets stale clear failed: ${clearResponse.status}`)
  }
}
