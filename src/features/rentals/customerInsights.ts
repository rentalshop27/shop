import type { Customer } from '../customers/customerTypes'
import type { RentalOrder } from './rentalTypes'

export type CustomerInsights = {
  rentalCount: number
  completedRentalCount: number
  activeOverdueCount: number
  depositForfeitedCount: number
  hasFines: boolean
  totalSpent: number
  starRating: number
  starDisplay: string
}

function getOrderGroupCode(orderCode: string) {
  if (/^PR-ORD-\d{6}-\d{3}-\d+$/.test(orderCode)) {
    return orderCode.replace(/-\d+$/, '')
  }
  if (/^PR-ORD-(?!\d{6}-\d{3}$)\d+-\d+$/.test(orderCode)) {
    return orderCode.replace(/-\d+$/, '')
  }
  return orderCode
}

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value))
}

const roundToHalf = (value: number) => {
  return Math.round(value * 2) / 2
}

export function formatStarRating(rating: number) {
  const safeRating = clamp(roundToHalf(rating), 1, 5)
  const fullStars = Math.floor(safeRating)
  const hasHalfStar = safeRating % 1 !== 0
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0))

  return `${'★'.repeat(fullStars)}${hasHalfStar ? '½' : ''}${'☆'.repeat(emptyStars)}`
}

export function calculateCustomerStarRating(
  customer: Customer,
  metrics: Pick<CustomerInsights, 'rentalCount' | 'activeOverdueCount' | 'depositForfeitedCount' | 'hasFines'>
) {
  let score = 5

  if (customer.profileStatus !== 'verified') {
    score -= 1
  }
  if (customer.riskFlag === 'has_risk') {
    score -= 2
  }

  score -= metrics.activeOverdueCount * 0.5
  score -= metrics.depositForfeitedCount
  
  if (metrics.hasFines) {
    score -= 2.0
  }

  if (metrics.rentalCount >= 20) {
    score += 0.75
  } else if (metrics.rentalCount >= 10) {
    score += 0.5
  } else if (metrics.rentalCount >= 5) {
    score += 0.25
  }

  return clamp(roundToHalf(score), 1, 5)
}

export function calculateCustomerInsights(
  customer: Customer,
  rentals: RentalOrder[],
  today: string
): CustomerInsights {
  const customerRentals = rentals.filter((rental) => rental.customer.id === customer.id)
  const groups = new Map<string, RentalOrder[]>()
  customerRentals.forEach((rental) => {
    const key = getOrderGroupCode(rental.orderCode)
    groups.set(key, [...(groups.get(key) ?? []), rental])
  })
  const groupedRentals = Array.from(groups.values())
  const activeOverdueCount = customerRentals.filter(
    (rental) => rental.status === 'overdue' || (rental.status === 'active' && rental.returnDate < today)
  ).length
  const completedRentalCount = groupedRentals.filter((group) => {
    const depositRows = group.filter((rental) => rental.depositAmount > 0)
    return group.every((rental) => rental.status === 'returned') && (
      depositRows.length === 0 ||
      depositRows.every((rental) => rental.depositStatus === 'returned' || rental.depositStatus === 'forfeited')
    )
  }).length
  const depositForfeitedCount = groupedRentals.filter((group) =>
    group.some((rental) => rental.depositStatus === 'forfeited')
  ).length
  const hasFines = customerRentals.some((rental) => (rental.fineAmount ?? 0) > 0)
  const totalSpent = customerRentals.reduce(
    (sum, rental) =>
      sum
      + Math.max(0, rental.collectedAmount - rental.depositAmount)
      + (rental.depositForfeitedAmount ?? 0)
      + (rental.fineAmount ?? 0),
    0
  )
  const metrics = {
    rentalCount: groupedRentals.length,
    completedRentalCount,
    activeOverdueCount,
    depositForfeitedCount,
    hasFines,
    totalSpent,
  }
  const starRating = calculateCustomerStarRating(customer, metrics)

  return {
    ...metrics,
    starRating,
    starDisplay: formatStarRating(starRating),
  }
}
