import { useState } from 'react'
import { Building2, Check, LogOut, Mail, Store, UserRound } from 'lucide-react'
import type { ShopSummary } from '../customers/customerRemote'

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
            <div className="profile-account-row">
              <Store size={20} />
              <div>
                <span>ร้านที่กำลังใช้งาน</span>
                <strong>{currentShop.name}</strong>
              </div>
            </div>
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
