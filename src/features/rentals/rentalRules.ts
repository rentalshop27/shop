import type { RentalOrder, RentalStatus } from './rentalTypes'

export const openRentalStatuses: RentalStatus[] = ['booked', 'active', 'overdue']

export function isOpenRentalStatus(status: RentalStatus) {
  return openRentalStatuses.includes(status)
}

export function isOpenRental(rental: RentalOrder) {
  return isOpenRentalStatus(rental.status)
}

export function isDateOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  if (!startA || !endA || !startB || !endB) return false
  return startA <= endB && endA >= startB
}

export function hasRentalConflict(
  rental: RentalOrder,
  pickupDate: string,
  returnDate: string,
): boolean {
  if (!isOpenRental(rental)) return false
  return isDateOverlap(rental.pickupDate, rental.returnDate, pickupDate, returnDate)
}

export function findConflictingRentalForStockSku(
  rentals: RentalOrder[],
  stockSku: string,
  pickupDate: string,
  returnDate: string,
) {
  return rentals.find(
    (rental) =>
      rental.costume.sku === stockSku &&
      hasRentalConflict(rental, pickupDate, returnDate)
  )
}

export function findOpenRentalForStockSku(rentals: RentalOrder[], stockSku: string) {
  return rentals.find((rental) => rental.costume.sku === stockSku && isOpenRental(rental))
}

export function findOpenRentalConflict(
  rentals: RentalOrder[],
  stockSkus: string[],
  pickupDate?: string,
  returnDate?: string,
) {
  if (!pickupDate || !returnDate) return undefined
  const uniqueSkus = new Set(stockSkus)
  for (const stockSku of uniqueSkus) {
    const conflict = findConflictingRentalForStockSku(rentals, stockSku, pickupDate, returnDate)
    if (conflict) return conflict
  }

  return undefined
}

