import { useState } from 'react'
import { Building2, Check, KeyRound, Link2, LogOut, Mail, Store, UserRound, Shield } from 'lucide-react'
import type { ShopSummary } from '../customers/customerRemote'
import { getGoogleOAuthSetupState } from '../google/googleOAuth'
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
  onShopChange: (shopId: string | null) => void
  onChangePassword?: (currentPassword: string, nextPassword: string) => Promise<void>
  onLogout?: () => Promise<void>
}

export function ProfilePage({
  email,
  availableShops,
  selectedShopId,
  onShopChange,
  onChangePassword,
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

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>โปรไฟล์</h1>
          <p className="subtitle">จัดการบัญชี ร้านที่กำลังใช้งาน และการเข้าสู่ระบบ</p>
        </div>
      </header>

      <div className="profile-grid">
        <section className="panel profile-panel" aria-labelledby="account-title">
          <div className="profile-panel-heading">
            <span className="profile-icon"><UserRound size={22} /></span>
            <div>
              <h2 id="account-title">ข้อมูลบัญชี</h2>
              <p>บัญชีที่กำลังเข้าสู่ระบบ</p>
            </div>
          </div>

          <div className="profile-account-row">
            <Mail size={20} />
            <div>
              <span>อีเมล</span>
              <strong>{email || 'โหมดทดลอง'}</strong>
            </div>
          </div>

          {currentShop && (
            <>
              <div className="profile-account-row">
                <Store size={20} />
                <div>
                  <span>ร้านที่กำลังใช้งาน</span>
                  <strong>{currentShop.name}</strong>
                </div>
              </div>
              <div className="profile-account-row">
                <Shield size={20} />
                <div>
                  <span>ตำแหน่ง (Role)</span>
                  <strong>{ROLE_LABELS[currentShop.role] || currentShop.role}</strong>
                </div>
              </div>
            </>
          )}
        </section>

        {onChangePassword && (
          <section className="panel profile-panel profile-password-panel" aria-labelledby="password-title">
            <div className="profile-panel-heading">
              <span className="profile-icon"><KeyRound size={22} /></span>
              <div>
                <h2 id="password-title">เปลี่ยนรหัสผ่าน</h2>
                <p>อัปเดตรหัสผ่านของบัญชีที่กำลังเข้าสู่ระบบอยู่ตอนนี้</p>
              </div>
            </div>

            <div className="profile-password-form">
              <p className="profile-password-note">
                รหัสใหม่จะมีผลกับบัญชีนี้ทันที และควรแจ้งพนักงานให้ใช้รหัสใหม่ในการเข้าสู่ระบบครั้งถัดไป
              </p>

              <div className="form-grid profile-password-grid">
                <TextField
                  label="รหัสผ่านปัจจุบัน"
                  value={currentPassword}
                  type="password"
                  placeholder="กรอกรหัสที่ใช้เข้าสู่ระบบตอนนี้"
                  disabled={isChangingPassword}
                  onChange={handleCurrentPasswordChange}
                />
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

              {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
              {passwordSuccess && <p className="profile-password-success" role="status">{passwordSuccess}</p>}

              <div className="profile-password-actions">
                <button className="primary-button" type="button" onClick={handlePasswordChange} disabled={isChangingPassword}>
                  {isChangingPassword ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="panel profile-panel" aria-labelledby="shops-title">
          <div className="profile-panel-heading">
            <span className="profile-icon"><Building2 size={22} /></span>
            <div>
              <h2 id="shops-title">ร้านที่เข้าถึงได้</h2>
              <p>
                {availableShops.length === 0
                  ? 'โหมดทดลองยังไม่มีข้อมูลร้าน'
                  : availableShops.length > 1
                    ? 'เลือกร้านที่ต้องการเข้าใช้งาน'
                    : 'บัญชีนี้เข้าถึงร้านเดียว'}
              </p>
            </div>
          </div>

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
                >
                  <span className="profile-shop-mark"><Store size={20} /></span>
                  <span className="profile-shop-name">{shop.name}</span>
                  {isCurrent && <span className="profile-current-badge"><Check size={15} /> กำลังใช้งาน</span>}
                </button>
              )
            })}
          </div>

          {availableShops.length > 1 && (
            <button className="secondary-button profile-overview-button" type="button" onClick={() => onShopChange(null)}>
              <Building2 size={18} />
              กลับภาพรวมทุกร้าน
            </button>
          )}
        </section>

        {(!currentShop || currentShop.role !== 'staff') && (
          <section className="panel profile-panel" aria-labelledby="google-title">
            <div className="profile-panel-heading">
              <span className="profile-icon"><Link2 size={22} /></span>
              <div>
                <h2 id="google-title">Google OAuth</h2>
                <p>เตรียมค่าเชื่อม Google Drive ของร้านที่เลือกอยู่</p>
              </div>
            </div>

            <div className="profile-oauth-stack">
              <div className="profile-oauth-actions">
                <a
                  className={`primary-button profile-connect-button ${!googleOAuth.canStartOAuth ? 'disabled' : ''}`}
                  href={googleOAuth.startUrl || undefined}
                  aria-disabled={!googleOAuth.canStartOAuth}
                  onClick={(event) => {
                    if (!googleOAuth.canStartOAuth) {
                      event.preventDefault()
                    }
                  }}
                >
                  <Link2 size={18} />
                  เชื่อม Google
                </a>
              </div>

              <div
                className={`profile-oauth-note ${googleOAuth.canStartOAuth ? 'ready' : 'warning'}`}
                role="status"
              >
                {googleOAuth.canStartOAuth
                  ? `พร้อมเชื่อม Google สำหรับร้าน ${currentShop?.name || ''}`.trim()
                  : !googleOAuth.hasSelectedShop
                    ? 'เลือกร้านก่อน แล้วค่อยใช้ค่าชุดนี้สำหรับปุ่มเชื่อม Google ของร้านนั้น'
                    : 'ตั้งค่า env ให้ครบก่อน แล้วค่อยนำ callback URL นี้ไปใส่ใน Google Cloud'}
              </div>

              {googleOAuthResult && (
                <div className={`profile-oauth-note ${googleOAuthResult.tone}`} role="status">
                  {googleOAuthResult.message}
                </div>
              )}
            </div>
          </section>
        )}

        {onLogout && (
          <section className="panel profile-panel profile-logout-panel" aria-labelledby="logout-title">
            <div>
              <h2 id="logout-title">ออกจากระบบ</h2>
              <p>ออกจากบัญชีนี้บนอุปกรณ์ปัจจุบัน</p>
            </div>
            <button className="profile-logout-button" type="button" onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut size={18} />
              {isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
            </button>
            {logoutError && <p className="profile-logout-error" role="alert">{logoutError}</p>}
          </section>
        )}
      </div>
    </>
  )
}
