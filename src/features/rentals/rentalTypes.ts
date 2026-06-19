import type { Customer } from '../customers/customerTypes'
import type { StockItem } from '../inventory/inventoryTypes'

export type RentalStatus = 'booked' | 'active' | 'returned' | 'overdue'

export type RentalOrder = {
  id: string
  orderCode: string        // e.g., PR-ORD-101
  customer: Customer
  costume: StockItem
  pickupDate: string       // YYYY-MM-DD
  returnDate: string       // YYYY-MM-DD
  rentalPrice: number      // Price paid for rental
  depositAmount: number    // Deposit paid
  collectedAmount: number  // Total amount collected at the counter (customizable)
  status: RentalStatus
  notes?: string
  createdAt: string
  updatedAt: string
}
