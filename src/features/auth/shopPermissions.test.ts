import { describe, expect, it } from 'vitest'
import { getShopPermissions, normalizeShopRole } from './shopPermissions'

describe('shopPermissions', () => {
  it('fails closed for missing or unknown roles', () => {
    expect(normalizeShopRole(null)).toBe('staff')
    expect(normalizeShopRole('legacy_owner')).toBe('staff')

    const permissions = getShopPermissions(undefined)
    expect(permissions.role).toBe('staff')
    expect(permissions.canManageMoney).toBe(false)
    expect(permissions.canManageDestructiveActions).toBe(false)
    expect(permissions.canAccessSettings).toBe(false)
  })

  it('keeps manager destructive permissions without owner-only settings access', () => {
    const permissions = getShopPermissions('manager')

    expect(permissions.role).toBe('manager')
    expect(permissions.canManageMoney).toBe(true)
    expect(permissions.canManageDestructiveActions).toBe(true)
    expect(permissions.canManageShopSettings).toBe(false)
  })
})
