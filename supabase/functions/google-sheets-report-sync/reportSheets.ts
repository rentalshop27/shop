export const REPORT_SHEETS = ['Summary', 'Rentals', 'Dress Metrics', 'Customers']

export type ShopRow = {
  id: string
  name: string
}

export type CustomerRow = {
  id: string
  customer_code: string
  full_name: string
  line_account: string | null
  phone: string
  profile_status: string
  risk_flag: string
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type StockRow = {
  id: string
  sku: string
  serial_number: string | null
  product_name: string
  brand: string | null
  category: string | null
  size: string | null
  primary_color: string | null
  rental_price_per_day: number | string
  deposit_amount: number | string
  created_at: string
}

export type RentalRow = {
  id: string
  order_code: string
  customer_id: string
  stock_item_sku: string
  pickup_date: string
  return_date: string
  rental_price: number | string
  deposit_amount: number | string
  collected_amount: number | string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type SheetData = {
  shop: ShopRow
  customers: CustomerRow[]
  stockItems: StockRow[]
  rentals: RentalRow[]
}

export function buildReportValues(data: SheetData): Record<string, unknown[][]> {
  const customerById = new Map(data.customers.map((customer) => [customer.id, customer]))
  const stockBySku = new Map(data.stockItems.map((item) => [item.sku, item]))
  const now = new Date().toISOString()
  const netRevenue = data.rentals.reduce((sum, rental) => sum + calculateNetRevenue(rental), 0)

  return {
    Summary: [
      ['Precious Shop Report'],
      ['Shop', data.shop.name],
      ['Synced At', now],
      ['Total Rentals', data.rentals.length],
      ['Net Rental Revenue', netRevenue],
      ['Stock Items', data.stockItems.length],
      ['Active Customers', data.customers.filter((customer) => !customer.archived_at).length],
      [],
      ['Status', 'Count'],
      ...countBy(data.rentals, (rental) => rental.status),
    ],
    Rentals: [
      [
        'Order Code',
        'Pickup Date',
        'Return Date',
        'Status',
        'Customer Code',
        'Customer Name',
        'Phone',
        'SKU',
        'Product Name',
        'Category',
        'Brand',
        'Rental Price',
        'Deposit',
        'Collected',
        'Net Revenue',
        'Notes',
        'Created At',
        'Updated At',
      ],
      ...data.rentals.map((rental) => {
        const customer = customerById.get(rental.customer_id)
        const stock = stockBySku.get(rental.stock_item_sku)
        return [
          rental.order_code,
          rental.pickup_date,
          rental.return_date,
          rental.status,
          customer?.customer_code ?? '',
          customer?.full_name ?? '',
          customer?.phone ?? '',
          rental.stock_item_sku,
          stock?.product_name ?? '',
          stock?.category ?? '',
          stock?.brand ?? '',
          numberValue(rental.rental_price),
          numberValue(rental.deposit_amount),
          numberValue(rental.collected_amount),
          calculateNetRevenue(rental),
          rental.notes ?? '',
          rental.created_at,
          rental.updated_at,
        ]
      }),
    ],
    'Dress Metrics': [
      [
        'SKU',
        'Product Name',
        'Brand',
        'Category',
        'Size',
        'Primary Color',
        'Rental Count',
        'Net Revenue',
        'Average Revenue',
        'Rental Price / Day',
        'Deposit',
        'Created At',
      ],
      ...data.stockItems.map((item) => {
        const itemRentals = data.rentals.filter((rental) => rental.stock_item_sku === item.sku)
        const itemRevenue = itemRentals.reduce((sum, rental) => sum + calculateNetRevenue(rental), 0)
        return [
          item.sku,
          item.product_name,
          item.brand ?? '',
          item.category ?? '',
          item.size ?? '',
          item.primary_color ?? '',
          itemRentals.length,
          itemRevenue,
          itemRentals.length > 0 ? itemRevenue / itemRentals.length : 0,
          numberValue(item.rental_price_per_day),
          numberValue(item.deposit_amount),
          item.created_at,
        ]
      }),
    ],
    Customers: [
      [
        'Customer Code',
        'Full Name',
        'Phone',
        'Line Account',
        'Profile Status',
        'Risk Flag',
        'Archived',
        'Created At',
        'Updated At',
      ],
      ...data.customers.map((customer) => [
        customer.customer_code,
        customer.full_name,
        customer.phone,
        customer.line_account ?? '',
        customer.profile_status,
        customer.risk_flag,
        customer.archived_at ? 'Yes' : 'No',
        customer.created_at,
        customer.updated_at,
      ]),
    ],
  }
}

export function buildStaleClearRanges(valuesBySheet: Record<string, unknown[][]>) {
  return REPORT_SHEETS.map((title) => {
    const writtenRowCount = Math.max(1, valuesBySheet[title]?.length ?? 0)
    return `${quoteSheetName(title)}!A${writtenRowCount + 1}:Z`
  })
}

export function quoteSheetName(title: string) {
  return `'${title.replace(/'/g, "''")}'`
}

function calculateNetRevenue(rental: RentalRow) {
  return Math.max(0, numberValue(rental.collected_amount) - numberValue(rental.deposit_amount))
}

function numberValue(value: number | string) {
  return Number(value) || 0
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>()
  items.forEach((item) => {
    const key = getKey(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))
}
