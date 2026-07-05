import type { DepositStatus } from './rentalTypes'

export type DepositAllocationInput = {
  id: string
  depositAmount: number
}

export type DepositAllocation = {
  id: string
  forfeitedAmount: number
}

export type DepositResolutionDraft =
  | {
      depositStatus: Extract<DepositStatus, 'returned'>
      note?: string
    }
  | {
      depositStatus: Extract<DepositStatus, 'forfeited'>
      forfeitedAmount: number
      note: string
    }

export function toCents(amount: number) {
  return Math.round((Number(amount) || 0) * 100)
}

export function fromCents(cents: number) {
  return Number((cents / 100).toFixed(2))
}

export function normalizeCurrencyAmount(amount: number) {
  return fromCents(toCents(amount))
}

export function allocateForfeitedDeposit(
  rentals: DepositAllocationInput[],
  totalForfeitedAmount: number,
): DepositAllocation[] {
  const depositRows = rentals.filter((rental) => rental.depositAmount > 0)
  const totalDepositCents = depositRows.reduce((sum, rental) => sum + toCents(rental.depositAmount), 0)
  const targetCents = toCents(totalForfeitedAmount)

  if (depositRows.length === 0 || totalDepositCents <= 0 || targetCents <= 0) {
    return rentals.map((rental) => ({ id: rental.id, forfeitedAmount: 0 }))
  }

  let allocatedCents = 0
  const depositRowIds = new Set(depositRows.map((rental) => rental.id))
  const allocationById = new Map<string, number>()

  depositRows.forEach((rental, index) => {
    const isLastDepositRow = index === depositRows.length - 1
    const amountCents = isLastDepositRow
      ? targetCents - allocatedCents
      : Math.round((targetCents * toCents(rental.depositAmount)) / totalDepositCents)

    allocationById.set(rental.id, amountCents)
    allocatedCents += amountCents
  })

  return rentals.map((rental) => ({
    id: rental.id,
    forfeitedAmount: depositRowIds.has(rental.id) ? fromCents(allocationById.get(rental.id) ?? 0) : 0,
  }))
}
