import type { RentalOrder } from '../features/rentals/rentalTypes'
import { calculateNetRentalRevenue } from '../features/reports/reportsMetrics'

export function exportRentalsToCSV(rentals: RentalOrder[], filename: string) {
  // 1. Define headers
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

  // 2. Map data to rows
  const rows = rentals.map(rental => {
    const forfeited = rental.depositForfeitedAmount ?? 0
    const fine = rental.fineAmount ?? 0
    const netRevenue = calculateNetRentalRevenue(rental)

    // combined notes for reasons
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

  // 3. Convert to CSV string (handling quotes for commas/newlines in fields)
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        const cellString = String(cell)
        if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
          return `"${cellString.replace(/"/g, '""')}"`
        }
        return cellString
      }).join(',')
    )
  ].join('\n')

  // 4. Create Blob with BOM for Thai support in Excel
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // 5. Trigger download
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
