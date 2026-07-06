export type ShopRole = 'owner' | 'manager' | 'staff'

export interface ShopPermissions {
  role: ShopRole
  canViewFinancials: boolean
  canViewReports: boolean
  canViewAuditLogs: boolean
  canAccessSettings: boolean
  canManageShopSettings: boolean
  canManageStaff: boolean
  canManageMoney: boolean
  canManageDestructiveActions: boolean
}

export function normalizeShopRole(role: string | null | undefined): ShopRole {
  if (role === 'owner' || role === 'manager' || role === 'staff') return role
  return 'staff'
}

export function getShopPermissions(role: string | null | undefined): ShopPermissions {
  const normalizedRole = normalizeShopRole(role)

  return {
    role: normalizedRole,
    canViewFinancials: normalizedRole !== 'staff',
    canViewReports: normalizedRole !== 'staff',
    canViewAuditLogs: normalizedRole !== 'staff',
    canAccessSettings: normalizedRole !== 'staff',
    canManageShopSettings: normalizedRole === 'owner',
    canManageStaff: normalizedRole === 'owner',
    canManageMoney: normalizedRole === 'owner' || normalizedRole === 'manager',
    canManageDestructiveActions: normalizedRole === 'owner' || normalizedRole === 'manager',
  }
}
