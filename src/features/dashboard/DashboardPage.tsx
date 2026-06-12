import { useState } from 'react'
import {
  BadgeCheck,
  CalendarCheck,
  Check,
  DollarSign,
  ExternalLink,
  MessageCircle,
  Phone,
  Shirt,
  ShieldAlert,
  X
} from 'lucide-react'
import type { RentalOrder, RentalStatus } from '../rentals/rentalTypes'

// Interface for Mock Data
interface RentalSchedule {
  id: string
  customerName: string
  customerCode: string
  item: string
  time: string
  status: 'pending' | 'success' | 'waiting'
}

interface OverdueRental {
  id: string
  customerName: string
  customerCode: string
  item: string
  dueDate: string
  daysOverdue: number
  phone: string
  lineAccount: string
}

interface BankSlip {
  id: string
  customerName: string
  amount: number
  time: string
  slipUrl: string
  refNo: string
}

export function DashboardPage({
  rentals,
  onUpdateRentalStatus,
  onNavigateToCustomers,
  onNavigateToRentals
}: {
  rentals: RentalOrder[]
  onUpdateRentalStatus: (id: string, status: RentalStatus) => void
  onNavigateToCustomers: () => void
  onNavigateToRentals: () => void
}) {
  // --- DYNAMIC CALCULATIONS FROM SHARED STATE ---
  const [extraRevenue, setExtraRevenue] = useState<number>(0) // baseline
  
  const dynamicRevenue = rentals
    .filter((r) => r.status === 'active' || r.status === 'returned' || r.status === 'overdue')
    .reduce((sum, r) => sum + r.rentalPrice, 0)
    
  const totalRevenue = dynamicRevenue + extraRevenue
  
  const currentlyRented = rentals.filter((r) => r.status === 'active' || r.status === 'overdue').length

  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  // Map dynamic pickups (status: booked -> pending, active today -> success)
  const pickups: RentalSchedule[] = rentals
    .filter((r) => r.status === 'booked' || (r.status === 'active' && r.pickupDate === today))
    .map((r) => ({
      id: r.id,
      customerName: r.customer.fullName,
      customerCode: r.customer.customerCode,
      item: r.costume.productName,
      time: '12:00 น.',
      status: r.status === 'active' ? 'success' : 'pending'
    }))

  // Map dynamic returns (status: active -> waiting, returned today -> success)
  const returns: RentalSchedule[] = rentals
    .filter((r) => r.status === 'active' || (r.status === 'returned' && r.returnDate === today))
    .map((r) => ({
      id: r.id,
      customerName: r.customer.fullName,
      customerCode: r.customer.customerCode,
      item: r.costume.productName,
      time: '18:00 น.',
      status: r.status === 'returned' ? 'success' : 'waiting'
    }))

  // Map dynamic overdues (status: active but date has passed, or status: overdue)
  const overdues = rentals
    .filter((r) => r.status === 'overdue' || (r.status === 'active' && new Date(r.returnDate) < new Date()))
    .map((r) => {
      const returnDateObj = new Date(r.returnDate)
      const diffTime = Math.abs(new Date().getTime() - returnDateObj.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return {
        id: r.id,
        customerName: r.customer.fullName,
        customerCode: r.customer.customerCode,
        item: r.costume.productName,
        dueDate: r.returnDate,
        daysOverdue: diffDays,
        phone: r.customer.phone,
        lineAccount: r.customer.lineAccount
      }
    })

  // Bank slips state
  const [slips, setSlips] = useState<BankSlip[]>([])

  // Modals management
  const [activeSlipToReview, setActiveSlipToReview] = useState<BankSlip | null>(null)
  const [activeContactUser, setActiveContactUser] = useState<OverdueRental | null>(null)

  // --- ACTIONS ---
  
  // Approve bank transfer slip
  const handleApproveSlip = (slipId: string, amount: number) => {
    setExtraRevenue((prev) => prev + amount)
    setSlips((prev) => prev.filter((s) => s.id !== slipId))
    setActiveSlipToReview(null)
  }

  // Reject bank transfer slip
  const handleRejectSlip = (slipId: string) => {
    setSlips((prev) => prev.filter((s) => s.id !== slipId))
    setActiveSlipToReview(null)
  }

  // Perform Pick-up action (Mark picked up)
  const handleMarkPickedUp = (pickupId: string) => {
    onUpdateRentalStatus(pickupId, 'active')
  }

  // Perform Return action (Mark returned)
  const handleMarkReturned = (returnId: string) => {
    onUpdateRentalStatus(returnId, 'returned')
  }

  // Settle overdue return
  const handleSettleOverdue = (overdueId: string) => {
    onUpdateRentalStatus(overdueId, 'returned')
    setActiveContactUser(null)
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Precious Shop</p>
          <h1>หน้าแดชบอร์ด</h1>
          <p className="subtitle">ภาพรวมร้านเช่าชุด ข้อมูลการเงิน และงานที่รอดำเนินการประจำวัน</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="secondary-button"
            type="button"
            onClick={onNavigateToCustomers}
            style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}
          >
            <ExternalLink size={18} />
            จัดการลูกค้า
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={onNavigateToRentals}
            style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', background: 'var(--text-gold)', color: '#000' }}
          >
            <CalendarCheck size={18} />
            หน้าเช่า/คืน
          </button>
        </div>
      </header>

      {/* --- TOP SUMMARY STATS WIDGETS --- */}
      <section className="dashboard-top-grid" aria-label="สถิติหลัก">
        {/* Left Side: Danger & Warning Alerts Group */}
        <div className="dashboard-group-panel">
          {/* Card 1: Overdue Returns */}
          <div
            className="dashboard-card"
            style={{ cursor: overdues.length > 0 ? 'pointer' : 'default' }}
            onClick={() => {
              if (overdues.length > 0) {
                document.getElementById('overdue-section')?.scrollIntoView({ behavior: 'smooth' })
              }
            }}
          >
            <span className="dashboard-card-label">รายการคืนเกินกำหนด</span>
            <span className={`dashboard-card-value ${overdues.length > 0 ? 'danger-color' : ''}`}>
              {overdues.length}
            </span>
            <span className="dashboard-card-subtext">ต้องติดตามลูกค้า</span>
            {overdues.length > 0 && (
              <span className="dashboard-card-badge danger">ต้องจัดการด่วน</span>
            )}
          </div>

          {/* Card 2: Pending Bank Transfer Slips */}
          <div
            className="dashboard-card"
            style={{ cursor: slips.length > 0 ? 'pointer' : 'default' }}
            onClick={() => {
              if (slips.length > 0) {
                setActiveSlipToReview(slips[0])
              }
            }}
          >
            <span className="dashboard-card-label">สลิปที่รอตรวจสอบ</span>
            <span className={`dashboard-card-value ${slips.length > 0 ? 'warning-color' : ''}`}>
              {slips.length}
            </span>
            <span className="dashboard-card-subtext">รายการโอนเงินที่ต้องตรวจ</span>
            {slips.length > 0 && (
              <span className="dashboard-card-badge warning">รอตรวจสอบ</span>
            )}
          </div>
        </div>

        {/* Right Side: Financial & Rental Summary Group */}
        <div className="dashboard-group-panel premium-gradient-bg">
          {/* Card 3: Total Cumulative Revenue */}
          <div className="dashboard-card gradient-card">
            <span className="dashboard-card-label">รายได้สะสมทั้งหมด</span>
            <span className="dashboard-card-value">
              ฿{totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
            <span className="dashboard-card-subtext">ยอดเงินที่อนุมัติแล้ว</span>
            <div className="dashboard-card-icon">
              <DollarSign size={20} />
            </div>
          </div>

          {/* Card 4: Currently Rented Sets */}
          <div className="dashboard-card gradient-card">
            <span className="dashboard-card-label">กำลังเช่าอยู่ขณะนี้</span>
            <span className="dashboard-card-value">{currentlyRented} ชุด</span>
            <span className="dashboard-card-subtext">ออกจากร้านไปแล้ว</span>
            <div className="dashboard-card-icon blue-theme">
              <Shirt size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* --- MIDDLE TABLES: TODAY'S PICKUPS & RETURNS --- */}
      <section className="dashboard-tables-grid" aria-label="งานประจำวัน">
        {/* Table 1: Pickups Today */}
        <div className="dashboard-table-panel">
          <div className="dashboard-table-header">
            <h3 className="dashboard-table-title">นัดรับ/ส่งชุดวันนี้</h3>
            <span
              className={`dashboard-table-count-badge ${
                pickups.filter((p) => p.status === 'pending').length > 0 ? 'active-count' : ''
              }`}
            >
              {pickups.filter((p) => p.status === 'pending').length} รอดำเนินการ
            </span>
          </div>

          <div className="dashboard-list-table">
            <div className="dashboard-list-row head">
              <span>ลูกค้า</span>
              <span>รายการชุด</span>
              <span>เวลา</span>
              <span>สถานะ</span>
            </div>

            {pickups.length === 0 ? (
              <div className="dashboard-empty-table-state">
                <BadgeCheck size={28} />
                ไม่มีรายการนัดรับในวันนี้
              </div>
            ) : (
              pickups.map((pickup) => (
                <div className="dashboard-list-row" key={pickup.id}>
                  <span className="dashboard-cell-customer">
                    {pickup.customerName}
                    <br />
                    <small style={{ color: '#8f847f' }}>{pickup.customerCode}</small>
                  </span>
                  <span className="dashboard-cell-item">{pickup.item}</span>
                  <span className="dashboard-cell-time">{pickup.time}</span>
                  <span>
                    {pickup.status === 'success' ? (
                      <span className="dashboard-status-tag success">รับแล้ว</span>
                    ) : (
                      <button
                        className="dashboard-action-trigger"
                        type="button"
                        onClick={() => handleMarkPickedUp(pickup.id)}
                      >
                        รับ/ส่งชุดแล้ว
                      </button>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Table 2: Returns Today */}
        <div className="dashboard-table-panel">
          <div className="dashboard-table-header">
            <h3 className="dashboard-table-title">กำหนดคืนวันนี้</h3>
            <span
              className={`dashboard-table-count-badge ${
                returns.filter((r) => r.status === 'waiting').length > 0 ? 'active-count' : ''
              }`}
            >
              {returns.filter((r) => r.status === 'waiting').length} คาดว่าจะคืน
            </span>
          </div>

          <div className="dashboard-list-table">
            <div className="dashboard-list-row head">
              <span>ลูกค้า</span>
              <span>รายการชุด</span>
              <span>เวลา</span>
              <span>สถานะ</span>
            </div>

            {returns.length === 0 ? (
              <div className="dashboard-empty-table-state">
                <BadgeCheck size={28} />
                ไม่มีรายการต้องคืนในวันนี้
              </div>
            ) : (
              returns.map((item) => (
                <div className="dashboard-list-row" key={item.id}>
                  <span className="dashboard-cell-customer">
                    {item.customerName}
                    <br />
                    <small style={{ color: '#8f847f' }}>{item.customerCode}</small>
                  </span>
                  <span className="dashboard-cell-item">{item.item}</span>
                  <span className="dashboard-cell-time">{item.time}</span>
                  <span>
                    {item.status === 'success' ? (
                      <span className="dashboard-status-tag success">คืนแล้ว</span>
                    ) : (
                      <button
                        className="dashboard-action-trigger"
                        type="button"
                        onClick={() => handleMarkReturned(item.id)}
                      >
                        คืนชุดแล้ว
                      </button>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- BOTTOM SECTION: OVERDUE RETURNS LIST --- */}
      <section
        id="overdue-section"
        className="dashboard-overdue-panel"
        aria-label="รายการคืนเกินกำหนด"
      >
        <div className="dashboard-overdue-header">
          <h3>
            <ShieldAlert size={22} />
            คืนเกินกำหนด
          </h3>
        </div>

        <div className="dashboard-list-table">
          <div className="dashboard-overdue-row head">
            <span>ลูกค้า</span>
            <span>รายการชุด</span>
            <span>กำหนดคืนเดิม</span>
            <span>จำนวนวันเกิน</span>
            <span>สถานะ</span>
            <span>จัดการ</span>
          </div>

          {overdues.length === 0 ? (
            <div className="dashboard-empty-table-state">
              <BadgeCheck size={36} style={{ color: '#34d399' }} />
              ไม่มีรายการคืนเกินกำหนดในระบบ ดีเยี่ยม!
            </div>
          ) : (
            overdues.map((item) => (
              <div className="dashboard-overdue-row" key={item.id}>
                <span className="dashboard-cell-customer">
                  {item.customerName}
                  <br />
                  <small style={{ color: '#8f847f' }}>{item.customerCode}</small>
                </span>
                <span className="dashboard-cell-item">{item.item}</span>
                <span className="dashboard-cell-time">{item.dueDate}</span>
                <span className="days-count">เกิน {item.daysOverdue} วัน</span>
                <span>
                  <span className="dashboard-status-tag pending" style={{ color: '#f1a09b', background: 'rgba(214, 83, 83, 0.12)' }}>
                    เกินกำหนด
                  </span>
                </span>
                <span>
                  <button
                    className="dashboard-action-trigger secondary"
                    type="button"
                    onClick={() => setActiveContactUser(item)}
                  >
                    ติดตามลูกค้า
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* --- MODAL 1: BANK SLIP REVIEW MODAL --- */}
      {activeSlipToReview && (
        <div className="dashboard-modal-overlay" role="dialog" aria-modal="true">
          <div className="dashboard-modal-content">
            <div className="dashboard-modal-header">
              <h3>ตรวจสลิปโอนเงิน</h3>
              <button
                className="dashboard-modal-close-btn"
                type="button"
                onClick={() => setActiveSlipToReview(null)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="dashboard-modal-body">
              <div className="slip-preview-container">
                <img
                  src={activeSlipToReview.slipUrl}
                  alt={`สลิปโอนเงินของ ${activeSlipToReview.customerName}`}
                />
              </div>

              <div className="slip-info-list">
                <div className="slip-info-item">
                  <span>ผู้โอนเงิน:</span>
                  <strong>{activeSlipToReview.customerName}</strong>
                </div>
                <div className="slip-info-item">
                  <span>รหัสอ้างอิง (Ref No.):</span>
                  <strong>{activeSlipToReview.refNo}</strong>
                </div>
                <div className="slip-info-item">
                  <span>วันเวลาในสลิป:</span>
                  <strong>{activeSlipToReview.time}</strong>
                </div>
                <div className="slip-info-item" style={{ marginTop: '8px', borderTop: '1px solid #3d312f', paddingTop: '12px' }}>
                  <span>ยอดเงินโอน:</span>
                  <strong className="amount-highlight">
                    ฿{activeSlipToReview.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            </div>

            <div className="dashboard-modal-footer">
              <button
                className="secondary-button"
                style={{ background: 'rgba(214, 83, 83, 0.1)', borderColor: 'rgba(214, 83, 83, 0.3)', color: '#f1a09b' }}
                type="button"
                onClick={() => handleRejectSlip(activeSlipToReview.id)}
              >
                สลิปไม่ถูกต้อง
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => handleApproveSlip(activeSlipToReview.id, activeSlipToReview.amount)}
              >
                <Check size={16} />
                อนุมัติยอดโอน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CUSTOMER CONTACT DETAILS --- */}
      {activeContactUser && (
        <div className="dashboard-modal-overlay" role="dialog" aria-modal="true">
          <div className="dashboard-modal-content" style={{ width: '450px' }}>
            <div className="dashboard-modal-header">
              <h3>ข้อมูลสำหรับติดต่อลูกค้า</h3>
              <button
                className="dashboard-modal-close-btn"
                type="button"
                onClick={() => setActiveContactUser(null)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="dashboard-modal-body">
              <div className="contact-info-list">
                <div className="contact-card-item">
                  <span className="contact-field-label">ชื่อลูกค้า / รหัส</span>
                  <span className="contact-field-value">
                    {activeContactUser.customerName} ({activeContactUser.customerCode})
                  </span>
                </div>

                <div className="contact-card-item">
                  <span className="contact-field-label">ชุดที่ค้างส่งคืน</span>
                  <span className="contact-field-value" style={{ color: '#ead483' }}>
                    {activeContactUser.item}
                  </span>
                  <span style={{ fontSize: '13px', color: '#f1a09b', fontWeight: 800 }}>
                    เกินกำหนดส่งคืนมาแล้ว {activeContactUser.daysOverdue} วัน (ตั้งแต่ {activeContactUser.dueDate})
                  </span>
                </div>

                <div className="contact-card-item">
                  <span className="contact-field-label">เบอร์โทรศัพท์</span>
                  <span className="contact-field-value">{activeContactUser.phone}</span>
                </div>

                <div className="contact-card-item">
                  <span className="contact-field-label">LINE Account</span>
                  <span className="contact-field-value">{activeContactUser.lineAccount}</span>
                </div>
              </div>

              <div className="contact-button-row">
                <a
                  className="contact-link-btn phone"
                  href={`tel:${activeContactUser.phone}`}
                >
                  <Phone size={16} />
                  โทรออก
                </a>
                <a
                  className="contact-link-btn line"
                  href={`https://line.me/ti/p/~${activeContactUser.lineAccount.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={16} />
                  แชท LINE
                </a>
              </div>
            </div>

            <div className="dashboard-modal-footer" style={{ borderTop: '0', paddingTop: '0' }}>
              <button
                className="primary-button"
                style={{ width: '100%', background: '#34d399', color: '#100d0d', boxShadow: 'none' }}
                type="button"
                onClick={() => handleSettleOverdue(activeContactUser.id)}
              >
                ลูกค้าส่งคืนชุดสำเร็จแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
