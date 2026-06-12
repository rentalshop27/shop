import type { RentalOrder, RentalStatus } from './rentalTypes'

export const openRentalStatuses: RentalStatus[] = ['booked', 'active', 'overdue']

export function isOpenRentalStatus(status: RentalStatus) {
  return openRentalStatuses.includes(status)
}

export function isOpenRental(rental: RentalOrder) {
  return isOpenRentalStatus(rental.status)
}

export function findOpenRentalForStockSku(rentals: RentalOrder[], stockSku: string) {
  return rentals.find((rental) => rental.costume.sku === stockSku && isOpenRental(rental))
}

export function findOpenRentalConflict(
  rentals: RentalOrder[],
  stockSkus: string[],
) {
  const uniqueSkus = new Set(stockSkus)
  for (const stockSku of uniqueSkus) {
    const conflict = findOpenRentalForStockSku(rentals, stockSku)
    if (conflict) return conflict
  }

  return undefined
}
