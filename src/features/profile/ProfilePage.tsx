import { useState } from 'react'
import { Building2, Check, KeyRound, Link2, LogOut, Mail, Store, UserRound, Shield } from 'lucide-react'
import type { ShopSummary } from '../customers/customerRemote'
import { getGoogleOAuthSetupState } from '../google/googleOAuth'

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
  onLogout?: () => Promise<void>
}

export function ProfilePage({
  email,
  availableShops,
  selectedShopId,
  onShopChange,
  onLogout,
}: ProfilePageProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
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
                <p>เตรียมค่าเชื่อม Google Sheets และ Google Drive ของร้านที่เลือกอยู่</p>
              </div>
            </div>

            <div className="profile-oauth-stack">
              <div className="profile-account-row">
                <KeyRound size={20} />
                <div>
                  <span>OAuth Client ID</span>
                  <strong>{googleOAuth.clientId || 'ยังไม่ได้ตั้งค่า VITE_GOOGLE_OAUTH_CLIENT_ID'}</strong>
                </div>
              </div>

              <div className="profile-oauth-field">
                <span>Authorized redirect URI</span>
                <code>{googleOAuth.callbackUrl || 'ตั้งค่า VITE_SUPABASE_URL เพื่อสร้าง callback URL'}</code>
              </div>

              <div className="profile-oauth-field">
                <span>App return URL</span>
                <code>{googleOAuth.returnUrl || 'ตั้งค่า VITE_PUBLIC_APP_URL หรือเปิดแอปผ่านโดเมนจริง'}</code>
              </div>

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
