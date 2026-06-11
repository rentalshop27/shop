import { describe, expect, it } from 'vitest'
import type { Customer } from './customerTypes'
import {
  canAddMoreDocuments,
  canCreateRentalForCustomer,
  findPhoneDuplicate,
  normalizeThaiPhone,
  validateThaiPhone,
} from './customerRules'

const baseCustomer: Customer = {
  id: 'cus_1',
  shopId: 'shop_1',
  customerCode: 'PR-C001',
  fullName: 'pun',
  lineAccount: '@sad',
  phone: '0987654321',
  phoneNormalized: '0987654321',
  currentAddress: '',
  notes: '',
  profileStatus: 'verified',
  riskFlag: 'none',
  documents: [],
  createdAt: '2026-06-11T00:00:00.000Z',
  updatedAt: '2026-06-11T00:00:00.000Z',
}

describe('customer rules', () => {
  it('normalizes Thai phone numbers for duplicate checks', () => {
    expect(normalizeThaiPhone('098-765 4321')).toBe('0987654321')
    expect(validateThaiPhone('098-765 4321')).toBe(true)
    expect(validateThaiPhone('12323')).toBe(false)
  })

  it('blocks duplicate active customers by normalized phone', () => {
    const duplicate = findPhoneDuplicate([baseCustomer], '098-765 4321')

    expect(duplicate.kind).toBe('phone')
    if (duplicate.kind === 'phone') {
      expect(duplicate.customer.customerCode).toBe('PR-C001')
    }
  })

  it('allows at most five customer documents', () => {
    expect(canAddMoreDocuments(4)).toBe(true)
    expect(canAddMoreDocuments(5)).toBe(false)
    expect(canAddMoreDocuments(3, 3)).toBe(false)
  })

  it('blocks new rentals for suspended customers only', () => {
    expect(
      canCreateRentalForCustomer({ ...baseCustomer, profileStatus: 'suspended' }).allowed,
    ).toBe(false)
    expect(
      canCreateRentalForCustomer({ ...baseCustomer, profileStatus: 'pending_review' }).allowed,
    ).toBe(true)
  })
})

