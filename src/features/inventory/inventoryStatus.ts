import type { StockItem, StockItemStatus } from './inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

export function getInventoryDisplayStatus(
  item: StockItem,
  rentals: RentalOrder[],
  today: string
): {
  primaryStatus: 'rented' | 'booked' | StockItemStatus
  nextBookedRental: RentalOrder | null
} {
  const isRented = (rentals || []).some((rental) => {
    return (
      rental.costume.sku === item.sku &&
      ((rental.status === 'active' && rental.pickupDate <= today && rental.returnDate >= today) ||
       (rental.status === 'overdue' && rental.pickupDate <= today))
    )
  })

  // Get next upcoming booked rental (earliest pickupDate, status is booked)
  const bookedRentals = (rentals || [])
    .filter((rental) => rental.costume.sku === item.sku && rental.status === 'booked')
    .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate))
  const nextBookedRental = bookedRentals[0] || null

  let primaryStatus: 'rented' | 'booked' | StockItemStatus
  if (isRented) {
    primaryStatus = 'rented'
  } else if (item.status === 'repair' || item.status === 'wash') {
    primaryStatus = item.status
  } else if (nextBookedRental) {
    primaryStatus = 'booked'
  } else {
    primaryStatus = item.status || 'available'
  }

  return { primaryStatus, nextBookedRental }
}
