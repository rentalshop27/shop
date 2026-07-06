// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from './ProfilePage'

const shops = [
  { id: 'shop_1', name: 'Precious Siam', role: 'owner' as const },
  { id: 'shop_2', name: 'Precious Silom', role: 'owner' as const },
]

afterEach(cleanup)
afterEach(() => {
  vi.unstubAllEnvs()
  window.history.replaceState({}, '', '/')
})

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

  it('shows Google OAuth setup values from env', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc123.supabase.co')
    vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://app.precious.test')
    vi.stubEnv('VITE_GOOGLE_OAUTH_CLIENT_ID', 'client-id.apps.googleusercontent.com')

    render(
      <ProfilePage
        email="owner@example.com"
        availableShops={[shops[0]]}
        selectedShopId="shop_1"
        onShopChange={vi.fn()}
      />,
    )

    expect(screen.getByText('client-id.apps.googleusercontent.com')).toBeTruthy()
    expect(screen.getByText('https://abc123.supabase.co/functions/v1/google-oauth-callback')).toBeTruthy()
    expect(screen.getByText('พร้อมเชื่อม Google สำหรับร้าน Precious Siam')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'เชื่อม Google' })).toBeTruthy()
  })

  it('shows the Google OAuth success message from the callback query string', () => {
    window.history.replaceState({}, '', '/?tab=profile&google_oauth=success&google_email=owner%40gmail.com')

    render(
      <ProfilePage
        email="owner@example.com"
        availableShops={[shops[0]]}
        selectedShopId="shop_1"
        onShopChange={vi.fn()}
      />,
    )

    expect(screen.getByText('เชื่อม Google สำเร็จแล้ว: owner@gmail.com')).toBeTruthy()
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
