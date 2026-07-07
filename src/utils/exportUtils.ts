import type { RentalOrder } from '../features/rentals/rentalTypes'
import type { DressReportItem } from '../features/reports/reportsMetrics'
import { calculateNetRentalRevenue } from '../features/reports/reportsMetrics'

function downloadCsv(headers: string[], rows: Array<Array<string | number>>, filename: string) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const cellString = String(cell)
        if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
          return `"${cellString.replace(/"/g, '""')}"`
        }
        return cellString
      }).join(','),
    ),
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportRentalsToCSV(rentals: RentalOrder[], filename: string) {
  const headers = [
    'รหัสออเดอร์',
    'ชื่อลูกค้า',
    'วันที่ทำรายการ',
    'ยอดรับเงินรวมทั้งบิล',
    'ค่ามัดจำ (ที่อมไว้)',
    'ค่ามัดจำที่ริบจริง',
    'ค่าปรับย้อนหลัง (Extra Fine)',
    'รายได้สุทธิของร้าน',
    'เหตุผลการปรับ/ยึด'
  ]

  const rows = rentals.map(rental => {
    const forfeited = rental.depositForfeitedAmount ?? 0
    const fine = rental.fineAmount ?? 0
    const netRevenue = calculateNetRentalRevenue(rental)

    const reasons = [rental.depositResolutionNote, rental.fineReason]
      .filter(Boolean)
      .join(' / ')

    return [
      rental.orderCode || rental.id,
      rental.customer.fullName,
      rental.createdAt.split('T')[0], // YYYY-MM-DD
      rental.collectedAmount.toFixed(2),
      rental.depositAmount.toFixed(2),
      forfeited.toFixed(2),
      fine.toFixed(2),
      netRevenue.toFixed(2),
      reasons || '-'
    ]
  })

  downloadCsv(headers, rows, filename)
}

export function exportDressReportsToCSV(rows: DressReportItem[], filename: string) {
  const headers = [
    'SKU',
    'ชื่อชุด',
    'แบรนด์',
    'หมวดหมู่',
    'ไซซ์',
    'จำนวนเช่า',
    'รายได้รวม',
    'เฉลี่ยต่อครั้ง',
    'วันเช่าสะสม',
    'วันว่าง',
    'วันทั้งหมด',
    'อัตราว่าง (%)',
  ]

  const csvRows = rows.map((item) => [
    item.stockItem.sku,
    item.stockItem.productName,
    item.stockItem.brand || '-',
    item.stockItem.category || '-',
    item.stockItem.size || '-',
    item.rentalCount,
    item.totalRevenue.toFixed(2),
    item.averageRevenue.toFixed(2),
    item.rentedDays,
    item.emptyDays,
    item.totalDays,
    item.emptyRate.toFixed(1),
  ])

  downloadCsv(headers, csvRows, filename)
}
