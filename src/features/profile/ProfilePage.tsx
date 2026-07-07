import { useState } from 'react'
import { Building2, Check, Link2, LogOut } from 'lucide-react'
import type { ShopSummary } from '../customers/customerRemote'
import { getGoogleOAuthSetupState, type GoogleOAuthConnection } from '../google/googleOAuth'
import { TextField } from '../../components/TextField'

const ROLE_LABELS: Record<string, string> = {
  owner: 'เจ้าของร้าน (Owner)',
  manager: 'ผู้จัดการ (Manager)',
  staff: 'พนักงาน (Staff)',
}

interface ProfilePageProps {
  email: string | null
  availableShops: ShopSummary[]
  selectedShopId: string | null
  googleOAuthConnection?: GoogleOAuthConnection | null
  isGoogleOAuthConnectionLoading?: boolean
  onShopChange: (shopId: string | null) => void
  onChangePassword?: (currentPassword: string, nextPassword: string) => Promise<void>
  onStartGoogleOAuth?: (shopId: string) => Promise<void>
  onLogout?: () => Promise<void>
}

export function ProfilePage({
  email,
  availableShops,
  selectedShopId,
  googleOAuthConnection = null,
  isGoogleOAuthConnectionLoading = false,
  onShopChange,
  onChangePassword,
  onStartGoogleOAuth,
  onLogout,
}: ProfilePageProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isStartingGoogleOAuth, setIsStartingGoogleOAuth] = useState(false)
  const [googleOAuthActionError, setGoogleOAuthActionError] = useState('')
  const currentShop = availableShops.find((shop) => shop.id === selectedShopId) ?? null
  const googleOAuth = getGoogleOAuthSetupState(selectedShopId)
  const googleOAuthResult = (() => {
    if (typeof window === 'undefined') return null

    const params = new URLSearchParams(window.location.search)
    const status = params.get('google_oauth')
    if (!status) return null

    if (status === 'success') {
      const googleEmail = params.get('google_email') || ''
      return {
        tone: 'ready' as const,
        message: googleEmail
          ? `เชื่อม Google สำเร็จแล้ว: ${googleEmail}`
          : 'เชื่อม Google สำเร็จแล้ว',
      }
    }

    const reason = params.get('reason') || 'unknown_error'
    return {
      tone: 'warning' as const,
      message: `เชื่อม Google ไม่สำเร็จ: ${reason}`,
    }
  })()

  async function handleLogout() {
    if (!onLogout || isLoggingOut) return

    setLogoutError('')
    setIsLoggingOut(true)
    try {
      await onLogout()
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'ออกจากระบบไม่สำเร็จ กรุณาลองใหม่')
      setIsLoggingOut(false)
    }
  }

  function handleCurrentPasswordChange(value: string) {
    setCurrentPassword(value)
    setPasswordError('')
    setPasswordSuccess('')
  }

  function handleNewPasswordChange(value: string) {
    setNewPassword(value)
    setPasswordError('')
    setPasswordSuccess('')
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value)
    setPasswordError('')
    setPasswordSuccess('')
  }

  async function handlePasswordChange() {
    if (!onChangePassword || isChangingPassword) return

    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('กรุณากรอกรหัสผ่านปัจจุบัน รหัสผ่านใหม่ และยืนยันรหัสผ่าน')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    setIsChangingPassword(true)
    try {
      await onChangePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาใช้รหัสใหม่ในการเข้าสู่ระบบครั้งถัดไป')
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setIsChangingPassword(false)
    }
  }

  async function handleStartGoogleOAuth() {
    if (!onStartGoogleOAuth || !selectedShopId || isStartingGoogleOAuth) return

    setGoogleOAuthActionError('')
    setIsStartingGoogleOAuth(true)
    try {
      await onStartGoogleOAuth(selectedShopId)
    } catch (error) {
      setGoogleOAuthActionError(error instanceof Error ? error.message : 'เริ่มเชื่อม Google ไม่สำเร็จ กรุณาลองใหม่')
      setIsStartingGoogleOAuth(false)
    }
  }

  const googleStatusTone = googleOAuthResult?.tone
    ?? (googleOAuthConnection?.status === 'connected' ? 'ready' : googleOAuthConnection?.status === 'error' ? 'warning' : 'muted')
  const googleStatusLabel = isGoogleOAuthConnectionLoading
    ? 'กำลังตรวจสอบ...'
    : googleOAuthConnection?.status === 'connected'
      ? 'เชื่อมต่อแล้ว'
      : googleOAuthConnection?.status === 'error'
        ? 'เชื่อมต่อมีปัญหา'
        : googleOAuthConnection?.status === 'revoked'
          ? 'ต้องเชื่อมต่อใหม่'
          : 'ยังไม่ได้เชื่อมต่อ'
  const googleConnectionMessage = googleOAuthResult?.message
    ?? (googleOAuthConnection?.status === 'connected' && googleOAuthConnection.googleEmail
      ? `บัญชีที่เชื่อมอยู่: ${googleOAuthConnection.googleEmail}`
      : '')

  return (
    <main className="profile-page">
      <section className="profile-header">
        <div>
          <p className="eyebrow">PROFILE</p>
          <h1>โปรไฟล์</h1>
          <p className="subtitle">จัดการบัญชี ร้านที่เข้าใช้งาน และการเชื่อมต่อระบบ</p>
        </div>

        {currentShop && (
          <div className="active-store-chip">
            <span style={{ color: 'var(--text-muted)' }}>ร้านที่ใช้งานอยู่:</span>
            <strong>{currentShop.name}</strong>
          </div>
        )}
      </section>

      <section className="profile-grid">
        <div className="profile-left">
          <div className="profile-card">
            <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', color: 'var(--text-bright)' }}>ข้อมูลบัญชี</h2>

            <div className="account-row">
              <span>อีเมล</span>
              <strong>{email || 'โหมดทดลอง'}</strong>
            </div>

            {currentShop && (
              <>
                <div className="account-row">
                  <span>ร้านที่กำลังใช้งาน</span>
                  <strong>{currentShop.name}</strong>
                </div>
                <div className="account-row">
                  <span>ตำแหน่ง (Role)</span>
                  <strong>{ROLE_LABELS[currentShop.role] || currentShop.role}</strong>
                </div>
              </>
            )}

            {onLogout && (
              <div style={{ marginTop: '24px' }}>
                <button className="profile-logout-button" style={{ width: '100%' }} type="button" onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOut size={18} />
                  {isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
                </button>
                {logoutError && <p className="profile-logout-error" role="alert" style={{ marginTop: '8px' }}>{logoutError}</p>}
              </div>
            )}
          </div>

          <div className="profile-card">
            <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', color: 'var(--text-bright)' }}>ร้านที่เข้าถึงได้</h2>

            <div className="profile-shop-list">
              {availableShops.length === 0 && (
                <p className="profile-shop-empty">เชื่อมต่อบัญชีร้านค้าเพื่อดูและสลับร้านที่เข้าถึงได้</p>
              )}
              {availableShops.map((shop) => {
                const isCurrent = shop.id === selectedShopId
                return (
                  <button
                    className={`profile-shop-option ${isCurrent ? 'active' : ''}`}
                    key={shop.id}
                    type="button"
                    onClick={() => onShopChange(shop.id)}
                    disabled={isCurrent}
                    aria-pressed={isCurrent}
                    style={isCurrent ? { border: '1px solid rgba(218, 179, 90, 0.45)' } : {}}
                  >
                    <span className="profile-shop-name">{shop.name}</span>
                    {isCurrent && <span className="profile-current-badge"><Check size={15} /> กำลังใช้งาน</span>}
                  </button>
                )
              })}
            </div>

            {availableShops.length > 1 && (
              <button className="secondary-button profile-overview-button" style={{ marginTop: '16px' }} type="button" onClick={() => onShopChange(null)}>
                <Building2 size={18} />
                กลับภาพรวมทุกร้าน
              </button>
            )}
          </div>
        </div>

        <div className="profile-right">
          {onChangePassword && (
            <div className="profile-card">
              <h2 style={{ fontSize: '18px', margin: '0 0 8px 0', color: 'var(--text-bright)' }}>ความปลอดภัย</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>เปลี่ยนรหัสผ่านสำหรับเข้าใช้งานระบบ</p>

              <div className="profile-password-form">
                <TextField
                  label="รหัสผ่านปัจจุบัน"
                  value={currentPassword}
                  type="password"
                  placeholder="รหัสผ่านปัจจุบัน"
                  disabled={isChangingPassword}
                  onChange={handleCurrentPasswordChange}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                  <TextField
                    label="รหัสผ่านใหม่"
                    value={newPassword}
                    type="password"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    disabled={isChangingPassword}
                    onChange={handleNewPasswordChange}
                  />
                  <TextField
                    label="ยืนยันรหัสผ่านใหม่"
                    value={confirmPassword}
                    type="password"
                    placeholder="กรอกรหัสเดิมอีกครั้ง"
                    disabled={isChangingPassword}
                    onChange={handleConfirmPasswordChange}
                  />
                </div>

                {passwordError && <p className="form-error" role="alert" style={{ margin: '4px 0 0' }}>{passwordError}</p>}
                {passwordSuccess && <p className="profile-password-success" role="status" style={{ margin: '4px 0 0' }}>{passwordSuccess}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button className="primary-button" type="button" onClick={handlePasswordChange} disabled={isChangingPassword}>
                    {isChangingPassword ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentShop?.role === 'owner' && (
            <div className="profile-card">
              <h2 style={{ fontSize: '18px', margin: '0 0 8px 0', color: 'var(--text-bright)' }}>Google OAuth</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>เชื่อม Google Drive เพื่อ sync เอกสารของร้าน</p>

              <div className="profile-oauth-stack">
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                    สถานะ: <strong style={{ color: googleStatusTone === 'ready' ? 'var(--text-bright)' : 'var(--text-muted)' }}>
                      {googleStatusLabel}
                    </strong>
                  </span>

                  <button
                    className={`primary-button ${!googleOAuth.canStartOAuth ? 'disabled' : ''}`}
                    style={{ width: 'fit-content' }}
                    type="button"
                    aria-disabled={!googleOAuth.canStartOAuth}
                    onClick={handleStartGoogleOAuth}
                    disabled={!googleOAuth.canStartOAuth || isStartingGoogleOAuth}
                  >
                    <Link2 size={18} />
                    {isStartingGoogleOAuth
                      ? 'กำลังเปิด Google...'
                      : googleOAuthConnection?.status === 'connected' || googleOAuthResult?.tone === 'ready'
                        ? 'เชื่อม Google ใหม่'
                        : 'เชื่อม Google'}
                  </button>
                </div>

                <div
                  className={`profile-oauth-note ${googleOAuth.canStartOAuth ? 'ready' : 'warning'}`}
                  role="status"
                  style={{ marginTop: '8px' }}
                >
                  <strong style={{ display: 'block', marginBottom: '4px' }}>คำเตือน:</strong>
                  {!googleOAuth.hasSelectedShop
                    ? 'เลือกร้านก่อน แล้วค่อยใช้ค่าชุดนี้สำหรับปุ่มเชื่อม Google ของร้านนั้น'
                    : 'ตั้งค่า env และ callback URL ให้ตรงกับ Google Cloud ก่อนใช้งาน'}
                </div>

                {googleConnectionMessage && (
                  <div className={`profile-oauth-note ${googleStatusTone === 'ready' ? 'ready' : 'warning'}`} role="status">
                    {googleConnectionMessage}
                  </div>
                )}

                {googleOAuthActionError && (
                  <div className="profile-oauth-note warning" role="alert">
                    {googleOAuthActionError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
