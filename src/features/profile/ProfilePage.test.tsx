// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from './ProfilePage'

const shops = [
  { id: 'shop_1', name: 'Precious Siam' },
  { id: 'shop_2', name: 'Precious Silom' },
]

afterEach(cleanup)

describe('ProfilePage', () => {
  it('shows the account and current shop', () => {
    render(
      <ProfilePage
        email="owner@example.com"
        availableShops={shops}
        selectedShopId="shop_1"
        onShopChange={vi.fn()}
      />,
    )

    expect(screen.getByText('owner@example.com')).toBeTruthy()
    expect(screen.getAllByText('Precious Siam').length).toBeGreaterThan(0)
    expect(screen.getByText('กำลังใช้งาน')).toBeTruthy()
  })

  it('switches shops and can return to the multi-shop overview', () => {
    const onShopChange = vi.fn()
    render(
      <ProfilePage
        email="owner@example.com"
        availableShops={shops}
        selectedShopId="shop_1"
        onShopChange={onShopChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Precious Silom/ }))
    expect(onShopChange).toHaveBeenCalledWith('shop_2')

    fireEvent.click(screen.getByRole('button', { name: 'กลับภาพรวมทุกร้าน' }))
    expect(onShopChange).toHaveBeenCalledWith(null)
  })

  it('does not show the overview action for a single shop', () => {
    render(
      <ProfilePage
        email="owner@example.com"
        availableShops={[shops[0]]}
        selectedShopId="shop_1"
        onShopChange={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'กลับภาพรวมทุกร้าน' })).toBeNull()
  })

  it('shows demo messaging without a logout action', () => {
    render(
      <ProfilePage
        email={null}
        availableShops={[]}
        selectedShopId={null}
        onShopChange={vi.fn()}
      />,
    )

    expect(screen.getByText('โหมดทดลอง')).toBeTruthy()
    expect(screen.getByText('โหมดทดลองยังไม่มีข้อมูลร้าน')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'ออกจากระบบ' })).toBeNull()
  })

  it('prevents repeated logout clicks while logout is pending', async () => {
    let finishLogout: (() => void) | undefined
    const onLogout = vi.fn(() => new Promise<void>((resolve) => { finishLogout = resolve }))
    render(
      <ProfilePage
        email="owner@example.com"
        availableShops={shops}
        selectedShopId="shop_1"
        onShopChange={vi.fn()}
        onLogout={onLogout}
      />,
    )

    const logoutButton = screen.getByRole('button', { name: 'ออกจากระบบ' })
    fireEvent.click(logoutButton)
    fireEvent.click(logoutButton)

    expect(onLogout).toHaveBeenCalledTimes(1)
    expect((screen.getByRole('button', { name: 'กำลังออกจากระบบ...' }) as HTMLButtonElement).disabled).toBe(true)

    finishLogout?.()
    await waitFor(() => expect(onLogout).toHaveBeenCalledTimes(1))
  })
})
