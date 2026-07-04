import type { Customer } from '../customers/customerTypes'
import type { FlatStockItem } from '../inventory/inventoryTypes'

export type RentalStatus = 'booked' | 'active' | 'returned' | 'overdue'

export type RentalShippingUpdate = {
  method?: 'grab' | 'thailand_post' | string
  trackingNumber?: string
  returnTrackingNote?: string
}

export type RentalOrder = {
  id: string
  orderCode: string        // e.g., PR-ORD-101
  customer: Customer
  costume: FlatStockItem
  pickupDate: string       // YYYY-MM-DD
  returnDate: string       // YYYY-MM-DD
  rentalPrice: number      // Price paid for rental
  depositAmount: number    // Deposit paid
  collectedAmount: number  // Total amount collected at the counter (customizable)
  status: RentalStatus
  shippingMethod?: 'grab' | 'thailand_post' | string
  trackingNumber?: string
  returnTrackingNote?: string
  shippingCost?: number
  notes?: string
  createdAt: string
  updatedAt: string
}
