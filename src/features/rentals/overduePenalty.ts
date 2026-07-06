import type { FlatStockItem } from '../inventory/inventoryTypes'
import type { RentalOrder, RentalStatus } from './rentalTypes'

const MS_PER_DAY = 1000 * 60 * 60 * 24

type OverduePenaltyRental = Pick<RentalOrder, 'returnDate' | 'status'> & {
  costume: Pick<FlatStockItem, 'lateFeeRule'>
}

export type OverduePenaltySummary = {
  dueDate: string
  overdueDays: number
  dailyRate: number
  totalPenalty: number
}

function toLocalNoon(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`)
}

export function parseLateFeePerDay(lateFeeRule: string | null | undefined) {
  return Math.max(0, parseFloat(lateFeeRule || '0') || 0)
}

export function isActiveRentalStatus(status: RentalStatus) {
  return status === 'active' || status === 'overdue'
}

export function isRentalCurrentlyOverdue(
  rental: Pick<RentalOrder, 'status' | 'returnDate'>,
  todayStr: string,
) {
  return rental.status === 'overdue' || (rental.status === 'active' && rental.returnDate < todayStr)
}

export function getOverdueDays(dueDate: string, todayStr: string) {
  if (!dueDate || !todayStr || dueDate >= todayStr) {
    return 0
  }

  const diffMs = toLocalNoon(todayStr).getTime() - toLocalNoon(dueDate).getTime()
  return Math.max(0, Math.floor(diffMs / MS_PER_DAY))
}

export function getOverduePenaltySummary(
  rentals: OverduePenaltyRental[],
  todayStr: string,
  dueDateOverride?: string,
): OverduePenaltySummary | null {
  const activeRentals = rentals.filter((rental) => isActiveRentalStatus(rental.status))
  if (activeRentals.length === 0) {
    return null
  }

  const dueDate = dueDateOverride
    ?? activeRentals.reduce(
      (latest, rental) => (rental.returnDate > latest ? rental.returnDate : latest),
      activeRentals[0].returnDate,
    )

  const overdueDays = getOverdueDays(dueDate, todayStr)
  if (overdueDays <= 0) {
    return null
  }

  const dailyRate = Number(
    activeRentals.reduce((sum, rental) => sum + parseLateFeePerDay(rental.costume.lateFeeRule), 0).toFixed(2),
  )
  if (dailyRate <= 0) {
    return null
  }

  return {
    dueDate,
    overdueDays,
    dailyRate,
    totalPenalty: Number((dailyRate * overdueDays).toFixed(2)),
  }
}
