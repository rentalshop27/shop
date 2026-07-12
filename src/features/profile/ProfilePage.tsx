import { useState } from 'react'
import { Building2, Check, LogOut } from 'lucide-react'
import type { ShopSummary } from '../customers/customerRemote'
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
        </div>
      </section>
    </main>
  )
}
