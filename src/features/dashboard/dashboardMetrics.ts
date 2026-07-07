import type { RentalOrder } from '../rentals/rentalTypes'

export interface RentalSchedule {
  id: string
  customerName: string
  customerCode: string
  item: string
  time: string
  status: 'pending' | 'success' | 'waiting'
}

export interface OverdueRental {
  id: string
  customerName: string
  customerCode: string
  item: string
  dueDate: string
  daysOverdue: number
  phone: string
  lineAccount: string
}

export function getLocalDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function buildDashboardMetrics(rentals: RentalOrder[], today: string) {
  const totalCashFlow = rentals.reduce((sum, rental) => sum + rental.collectedAmount, 0)
  
  const activeHeldDeposits = rentals.reduce((sum, rental) => {
    const isRenting = rental.status === 'booked' || rental.status === 'active' || rental.status === 'overdue'
    const isPendingReturn = rental.status === 'returned' && rental.depositStatus === 'pending_return'
    
    if (isRenting || isPendingReturn) {
      return sum + (rental.depositAmount || 0)
    }
    return sum
  }, 0)

  const totalFines = rentals.reduce((sum, rental) => sum + (rental.fineAmount || 0), 0)

  const netRevenue = totalCashFlow - activeHeldDeposits + totalFines
  const totalRevenue = totalCashFlow

  const currentlyRented = rentals.filter((rental) => rental.status === 'active' || rental.status === 'overdue').length

  const pickups: RentalSchedule[] = rentals
    .filter((rental) =>
      rental.pickupDate === today &&
      (rental.status === 'booked' || rental.status === 'active')
    )
    .map((rental) => ({
      id: rental.id,
      customerName: rental.customer.fullName,
      customerCode: rental.customer.customerCode,
      item: rental.costume.productName,
      time: '12:00 น.',
      status: rental.status === 'active' ? 'success' : 'pending'
    }))

  const returns: RentalSchedule[] = rentals
    .filter((rental) =>
      rental.returnDate === today &&
      (rental.status === 'active' || rental.status === 'overdue' || rental.status === 'returned')
    )
    .map((rental) => ({
      id: rental.id,
      customerName: rental.customer.fullName,
      customerCode: rental.customer.customerCode,
      item: rental.costume.productName,
      time: '18:00 น.',
      status: rental.status === 'returned' ? 'success' : 'waiting'
    }))

  const overdues: OverdueRental[] = rentals
    .filter((rental) => rental.status === 'overdue' || (rental.status === 'active' && rental.returnDate < today))
    .map((rental) => ({
      id: rental.id,
      customerName: rental.customer.fullName,
      customerCode: rental.customer.customerCode,
      item: rental.costume.productName,
      dueDate: rental.returnDate,
      daysOverdue: getDaysOverdue(rental.returnDate, today),
      phone: rental.customer.phone,
      lineAccount: rental.customer.lineAccount
    }))

  return {
    totalRevenue,
    netRevenue,
    activeHeldDeposits,
    totalCashFlow,
    totalFines,
    currentlyRented,
    pickups,
    returns,
    overdues
  }
}

function getDaysOverdue(returnDate: string, today: string) {
  const diff = toUtcDay(today) - toUtcDay(returnDate)
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function toUtcDay(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}
