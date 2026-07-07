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

  it('requires the current password before submitting', () => {
    const onChangePassword = vi.fn()

    render(
      <ProfilePage
        email="owner@example.com"
        availableShops={[shops[0]]}
        selectedShopId="shop_1"
        onShopChange={vi.fn()}
        onChangePassword={onChangePassword}
      />,
    )

    fireEvent.change(screen.getByLabelText('รหัสผ่านใหม่'), { target: { value: 'secret123' } })
    fireEvent.change(screen.getByLabelText('ยืนยันรหัสผ่านใหม่'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }))

    expect(screen.getByText('กรุณากรอกรหัสผ่านปัจจุบัน รหัสผ่านใหม่ และยืนยันรหัสผ่าน')).toBeTruthy()
    expect(onChangePassword).not.toHaveBeenCalled()
  })

  it('validates the password confirmation before submitting', () => {
    const onChangePassword = vi.fn()

    render(
      <ProfilePage
        email="owner@example.com"
        availableShops={[shops[0]]}
        selectedShopId="shop_1"
        onShopChange={vi.fn()}
        onChangePassword={onChangePassword}
      />,
    )

    fireEvent.change(screen.getByLabelText('รหัสผ่านปัจจุบัน'), { target: { value: 'old-secret' } })
    fireEvent.change(screen.getByLabelText('รหัสผ่านใหม่'), { target: { value: 'secret123' } })
    fireEvent.change(screen.getByLabelText('ยืนยันรหัสผ่านใหม่'), { target: { value: 'secret999' } })
    fireEvent.click(screen.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }))

    expect(screen.getByText('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน')).toBeTruthy()
    expect(onChangePassword).not.toHaveBeenCalled()
  })

  it('changes the current user password and shows success feedback', async () => {
    const onChangePassword = vi.fn(async () => undefined)

    render(
      <ProfilePage
        email="owner@example.com"
        availableShops={[shops[0]]}
        selectedShopId="shop_1"
        onShopChange={vi.fn()}
        onChangePassword={onChangePassword}
      />,
    )

    fireEvent.change(screen.getByLabelText('รหัสผ่านปัจจุบัน'), { target: { value: 'old-secret' } })
    fireEvent.change(screen.getByLabelText('รหัสผ่านใหม่'), { target: { value: 'secret123' } })
    fireEvent.change(screen.getByLabelText('ยืนยันรหัสผ่านใหม่'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }))

    await waitFor(() => expect(onChangePassword).toHaveBeenCalledWith('old-secret', 'secret123'))
    expect(screen.getByText('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาใช้รหัสใหม่ในการเข้าสู่ระบบครั้งถัดไป')).toBeTruthy()
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

  it('prevents repeated password changes while the request is pending', async () => {
    let finishChangePassword: (() => void) | undefined
    const onChangePassword = vi.fn(() => new Promise<void>((resolve) => { finishChangePassword = resolve }))

    render(
      <ProfilePage
        email="owner@example.com"
        availableShops={[shops[0]]}
        selectedShopId="shop_1"
        onShopChange={vi.fn()}
        onChangePassword={onChangePassword}
      />,
    )

    fireEvent.change(screen.getByLabelText('รหัสผ่านปัจจุบัน'), { target: { value: 'old-secret' } })
    fireEvent.change(screen.getByLabelText('รหัสผ่านใหม่'), { target: { value: 'secret123' } })
    fireEvent.change(screen.getByLabelText('ยืนยันรหัสผ่านใหม่'), { target: { value: 'secret123' } })

    const changePasswordButton = screen.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' })
    fireEvent.click(changePasswordButton)
    fireEvent.click(changePasswordButton)

    expect(onChangePassword).toHaveBeenCalledTimes(1)
    expect((screen.getByRole('button', { name: 'กำลังเปลี่ยนรหัสผ่าน...' }) as HTMLButtonElement).disabled).toBe(true)

    finishChangePassword?.()
    await waitFor(() => expect(onChangePassword).toHaveBeenCalledTimes(1))
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
