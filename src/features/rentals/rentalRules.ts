import type { RentalOrder, RentalStatus } from './rentalTypes'
import type { RentalTier } from '../inventory/inventoryTypes'

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

// ── Forward Logic: given rental days → resolve price from tiers ──

/**
 * Resolves the rental price for a given number of days using:
 * 1. Exact match — finds a tier where `days === rentalDays`
 * 2. Ceil fallback — finds the nearest tier where `days > rentalDays` (round up)
 * 3. Returns null if no tier can cover the requested duration
 */
export function resolveRentalPrice(tiers: RentalTier[], rentalDays: number): number | null {
  if (!tiers || tiers.length === 0) return null

  // 1. Exact match
  const exact = tiers.find((t) => t.days === rentalDays)
  if (exact) return exact.price

  // 2. Ceil fallback — nearest tier that covers the duration
  const higher = tiers
    .filter((t) => t.days > rentalDays)
    .sort((a, b) => a.days - b.days)
  if (higher.length > 0) return higher[0].price

  // 3. No tier covers the duration → caller must handle (manual override)
  return null
}

// ── Reverse Logic: given package days → compute return date ──

/**
 * Calculates the return date by adding packageDays to startDateStr.
 *
 * Uses T12:00:00 suffix to avoid UTC midnight → local timezone drift.
 * Without this, `new Date('2026-07-02')` parses as UTC midnight which
 * in UTC+7 becomes 2026-07-01T07:00:00 local, causing off-by-one errors.
 */
export function calculateReturnDate(startDateStr: string, packageDays: number): string {
  if (!startDateStr) return ''
  // Append T12:00:00 (noon) to avoid timezone-induced day shift
  const startDate = new Date(`${startDateStr}T12:00:00`)
  startDate.setDate(startDate.getDate() + packageDays)
  return startDate.toISOString().split('T')[0]
}
