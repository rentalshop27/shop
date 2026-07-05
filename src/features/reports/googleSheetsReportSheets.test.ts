import { describe, expect, it } from 'vitest'
import {
  buildReportValues,
  buildStaleClearRanges,
  quoteSheetName,
  type SheetData,
} from '../../../supabase/functions/google-sheets-report-sync/reportSheets'

const sheetData: SheetData = {
  shop: { id: 'shop_1', name: 'Precious Siam' },
  customers: [
    {
      id: 'customer_1',
      customer_code: 'PR-C001',
      full_name: 'Jane Customer',
      line_account: '@jane',
      phone: '0812345678',
      profile_status: 'verified',
      risk_flag: 'none',
      archived_at: null,
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-02T00:00:00.000Z',
    },
  ],
  stockItems: [
    {
      id: 'stock_1',
      sku: 'DRESS-001',
      serial_number: 'SN-001',
      product_name: 'Gold Dress',
      brand: 'Precious',
      category: 'ชุดราตรี',
      size: 'M',
      primary_color: 'ทอง',
      rental_price_per_day: '1500',
      deposit_amount: '500',
      created_at: '2026-06-01T00:00:00.000Z',
    },
  ],
  rentals: [
    {
      id: 'rental_1',
      order_code: 'PR-ORD-001',
      customer_id: 'customer_1',
      stock_item_sku: 'DRESS-001',
      pickup_date: '2026-06-20',
      return_date: '2026-06-22',
      rental_price: '1500',
      deposit_amount: '500',
      collected_amount: '2000',
      status: 'returned',
      deposit_status: 'forfeited',
      deposit_forfeited_amount: '200',
      deposit_resolution_note: 'ชุดขาด',
      deposit_resolved_at: '2026-06-22T12:00:00.000Z',
      notes: 'paid',
      created_at: '2026-06-18T00:00:00.000Z',
      updated_at: '2026-06-22T00:00:00.000Z',
    },
  ],
}

describe('Google Sheets report sheet helpers', () => {
  it('builds report tabs with joined rental, customer, and stock data', () => {
    const values = buildReportValues(sheetData)

    expect(values.Summary[1]).toEqual(['Shop', 'Precious Siam'])
    expect(values.Summary).toContainEqual(['Total Rentals', 1])
    expect(values.Summary).toContainEqual(['Net Rental Revenue', 1700])
    expect(values.Rentals[1]).toEqual([
      'PR-ORD-001',
      '2026-06-20',
      '2026-06-22',
      'returned',
      'PR-C001',
      'Jane Customer',
      '0812345678',
      'DRESS-001',
      'Gold Dress',
      'ชุดราตรี',
      'Precious',
      1500,
      500,
      'forfeited',
      200,
      'ชุดขาด',
      '2026-06-22T12:00:00.000Z',
      2000,
      1700,
      'paid',
      '2026-06-18T00:00:00.000Z',
      '2026-06-22T00:00:00.000Z',
    ])
    expect(values['Dress Metrics'][1]).toContain(1700)
    expect(values.Customers[1]).toContain('Jane Customer')
  })

  it('clears only rows below the newly written report ranges', () => {
    const values = buildReportValues(sheetData)

    expect(buildStaleClearRanges(values)).toEqual([
      "'Summary'!A11:Z",
      "'Rentals'!A3:Z",
      "'Dress Metrics'!A3:Z",
      "'Customers'!A3:Z",
    ])
  })

  it('quotes sheet names for Google Sheets ranges', () => {
    expect(quoteSheetName("Owner's Report")).toBe("'Owner''s Report'")
  })
})
