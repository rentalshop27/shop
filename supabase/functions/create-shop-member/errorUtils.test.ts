import { describe, expect, it } from 'vitest'
import { getErrorMessage, isDuplicateUserError } from './errorUtils'

describe('create-shop-member error utils', () => {
  it('extracts plain object database errors instead of falling back to Unexpected error', () => {
    expect(
      getErrorMessage({
        message: 'new row for relation "shop_members" violates check constraint "shop_members_role_check"',
        details: 'Failing row contains (shop-id, user-id, manager).',
        hint: 'Run the latest migration before creating manager/staff accounts.',
      }),
    ).toBe(
      'new row for relation "shop_members" violates check constraint "shop_members_role_check"\n'
      + 'Failing row contains (shop-id, user-id, manager).\n'
      + 'Run the latest migration before creating manager/staff accounts.',
    )
  })

  it('detects duplicate user errors from non-Error payloads', () => {
    expect(
      isDuplicateUserError({
        message: 'A user with this email has already been registered',
      }),
    ).toBe(true)
  })
})
