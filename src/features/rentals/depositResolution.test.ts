import { describe, expect, it } from 'vitest'
import { allocateForfeitedDeposit, normalizeCurrencyAmount, toCents } from './depositResolution'

describe('allocateForfeitedDeposit', () => {
  it('puts rounding remainder on the last deposit row', () => {
    const allocations = allocateForfeitedDeposit(
      [
        { id: 'rental_1', depositAmount: 33.33 },
        { id: 'rental_2', depositAmount: 33.33 },
        { id: 'rental_3', depositAmount: 33.34 },
      ],
      100,
    )

    expect(allocations).toEqual([
      { id: 'rental_1', forfeitedAmount: 33.33 },
      { id: 'rental_2', forfeitedAmount: 33.33 },
      { id: 'rental_3', forfeitedAmount: 33.34 },
    ])
    expect(allocations.reduce((sum, item) => sum + item.forfeitedAmount, 0)).toBe(100)
  })

  it('prorates uneven deposits by deposit weight', () => {
    expect(allocateForfeitedDeposit(
      [
        { id: 'rental_1', depositAmount: 100 },
        { id: 'rental_2', depositAmount: 300 },
      ],
      200,
    )).toEqual([
      { id: 'rental_1', forfeitedAmount: 50 },
      { id: 'rental_2', forfeitedAmount: 150 },
    ])
  })

  it('keeps exact totals for partial forfeiture', () => {
    const allocations = allocateForfeitedDeposit(
      [
        { id: 'rental_1', depositAmount: 500 },
        { id: 'rental_2', depositAmount: 500 },
        { id: 'rental_3', depositAmount: 500 },
      ],
      100,
    )

    expect(allocations).toEqual([
      { id: 'rental_1', forfeitedAmount: 33.33 },
      { id: 'rental_2', forfeitedAmount: 33.33 },
      { id: 'rental_3', forfeitedAmount: 33.34 },
    ])
  })

  it('does not allocate forfeiture to zero-deposit rows', () => {
    expect(allocateForfeitedDeposit(
      [
        { id: 'free_row', depositAmount: 0 },
        { id: 'paid_row', depositAmount: 500 },
      ],
      120,
    )).toEqual([
      { id: 'free_row', forfeitedAmount: 0 },
      { id: 'paid_row', forfeitedAmount: 120 },
    ])
  })

  it('returns zero allocations when there is no positive deposit', () => {
    expect(allocateForfeitedDeposit(
      [
        { id: 'rental_1', depositAmount: 0 },
        { id: 'rental_2', depositAmount: 0 },
      ],
      100,
    )).toEqual([
      { id: 'rental_1', forfeitedAmount: 0 },
      { id: 'rental_2', forfeitedAmount: 0 },
    ])
  })

  it('normalizes sub-cent values to zero cents until they round up to one satang', () => {
    expect(toCents(0.001)).toBe(0)
    expect(toCents(0.004)).toBe(0)
    expect(toCents(0.005)).toBe(1)
    expect(normalizeCurrencyAmount(0.005)).toBe(0.01)
  })
})
