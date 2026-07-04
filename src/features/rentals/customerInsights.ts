import type { Customer } from '../customers/customerTypes'
import type { RentalOrder } from './rentalTypes'

export type CustomerInsights = {
  rentalCount: number
  completedRentalCount: number
  activeOverdueCount: number
  depositForfeitedCount: number
  totalSpent: number
  starRating: number
  starDisplay: string
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
  metrics: Pick<CustomerInsights, 'rentalCount' | 'activeOverdueCount' | 'depositForfeitedCount'>
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
  const activeOverdueCount = customerRentals.filter(
    (rental) => rental.status === 'overdue' || (rental.status === 'active' && rental.returnDate < today)
  ).length
  const depositForfeitedCount = customerRentals.filter((rental) => rental.depositStatus === 'forfeited').length
  const totalSpent = customerRentals.reduce(
    (sum, rental) => sum + Math.max(0, rental.collectedAmount - rental.depositAmount),
    0
  )
  const metrics = {
    rentalCount: customerRentals.length,
    completedRentalCount: customerRentals.filter((rental) => rental.status === 'returned').length,
    activeOverdueCount,
    depositForfeitedCount,
    totalSpent,
  }
  const starRating = calculateCustomerStarRating(customer, metrics)

  return {
    ...metrics,
    starRating,
    starDisplay: formatStarRating(starRating),
  }
}
