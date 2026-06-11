import { useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registered successfully:', r)
    },
    onRegisterError(error) {
      console.error('SW registration failed:', error)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      console.log('A new version is available!')
    }
  }, [needRefresh])

  if (!needRefresh) return null

  return (
    <div className="pwa-update-popup-container">
      <div className="pwa-update-popup-card">
        <div className="pwa-update-popup-icon-wrapper">
          <RefreshCw className="pwa-update-popup-icon" />
        </div>
        <div className="pwa-update-popup-content">
          <h4 className="pwa-update-popup-title">อัปเดตเวอร์ชันใหม่!</h4>
          <p className="pwa-update-popup-desc">
            มีฟีเจอร์และประสิทธิภาพใหม่พร้อมใช้งาน กดปุ่มอัปเดตเพื่อเข้าสู่เวอร์ชันล่าสุด
          </p>
          <div className="pwa-update-popup-actions">
            <button
              className="pwa-update-btn-confirm"
              onClick={() => updateServiceWorker(true)}
            >
              อัปเดตตอนนี้
            </button>
            <button
              className="pwa-update-btn-cancel"
              onClick={() => setNeedRefresh(false)}
            >
              ไว้ทีหลัง
            </button>
          </div>
        </div>
        <button
          className="pwa-update-popup-close-btn"
          onClick={() => setNeedRefresh(false)}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
