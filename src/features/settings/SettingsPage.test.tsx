/* @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SettingsPage } from './SettingsPage'

function renderSettingsPage(canManageShopSettings: boolean, canManageStaff: boolean, activeTab: 'general' | 'inventory' | 'staff') {
  return render(
    <SettingsPage
      shopId={null}
      canManageShopSettings={canManageShopSettings}
      canManageStaff={canManageStaff}
      brands={['Precious']}
      categories={['ชุดราตรี']}
      colors={['แดง']}
      publicCatalogEnabled={false}
      onAddBrand={vi.fn()}
      onDeleteBrand={vi.fn()}
      onAddCategory={vi.fn()}
      onDeleteCategory={vi.fn()}
      onAddColor={vi.fn()}
      onDeleteColor={vi.fn()}
      onPublicCatalogEnabledChange={vi.fn()}
      defaultRentalPrices={[{ days: 1, price: 1000 }]}
      onUpdateDefaultRentalPrices={vi.fn()}
      defaultDeposit={500}
      onUpdateDefaultDeposit={vi.fn()}
      defaultLateFinePerDay={100}
      onUpdateDefaultLateFinePerDay={vi.fn()}
      activeTab={activeTab}
      onTabChange={vi.fn()}
    />,
  )
}

describe('SettingsPage', () => {
  it('renders the staff management panel when only team permissions are available', () => {
    renderSettingsPage(false, true, 'staff')

    expect(screen.getByRole('tab', { name: 'สิทธิ์พนักงาน' })).toBeTruthy()
    expect(screen.getByText('เพิ่มพนักงานใหม่')).toBeTruthy()
    expect(screen.getByText('ไม่มีรายชื่อพนักงาน')).toBeTruthy()
    expect(screen.queryByText('ตั้งค่าทั่วไป')).toBeNull()
  })
})
