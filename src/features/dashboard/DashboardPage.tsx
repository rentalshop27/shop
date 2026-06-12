import { useState } from 'react'
import {
  BadgeCheck,
  CalendarCheck,
  ExternalLink,
  MessageCircle,
  Phone,
  Shirt,
  ShieldAlert,
  X,
  Clock,
  Wallet,
  UserRound,
  ChevronRight,
  ClipboardList,
  ShoppingBag,
  Undo2
} from 'lucide-react'
import type { RentalOrder, RentalStatus } from '../rentals/rentalTypes'
import { buildDashboardMetrics, getLocalDateString, type OverdueRental } from './dashboardMetrics'

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
  const today = getLocalDateString(new Date())
  const { totalRevenue, currentlyRented, pickups, returns, overdues } = buildDashboardMetrics(rentals, today)

  // Modals management
  const [activeContactUser, setActiveContactUser] = useState<OverdueRental | null>(null)

  // --- ACTIONS ---
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
          <p className="eyebrow">PRECIOUS SHOP</p>
          <h1>หน้าแดชบอร์ด</h1>
          <p className="subtitle">ภาพรวมร้านเช่าชุด ข้อมูลการเงิน และงานที่รอดำเนินการประจำวัน</p>
        </div>
        
        {/* Desktop Header Actions */}
        <div className="header-action-group desktop-only-actions" style={{ display: 'flex', gap: '12px' }}>
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

        {/* Mobile Header Actions */}
        <div className="mobile-only-actions-grid">
          <button
            className="mobile-action-card-btn customer-btn"
            type="button"
            onClick={onNavigateToCustomers}
          >
            <span className="btn-left-content">
              <UserRound className="btn-icon" size={20} />
              <span>จัดการลูกค้า</span>
            </span>
            <ChevronRight className="btn-chevron" size={16} />
          </button>
          <button
            className="mobile-action-card-btn rental-btn"
            type="button"
            onClick={onNavigateToRentals}
          >
            <span className="btn-left-content">
              <CalendarCheck className="btn-icon" size={20} />
              <span>หน้าเช่า/คืน</span>
            </span>
            <ChevronRight className="btn-chevron" size={16} />
          </button>
        </div>
      </header>

      {/* --- TOP SUMMARY STATS WIDGETS --- */}
      <section className="dashboard-top-grid" aria-label="สถิติหลัก">
        {/* Left Side: Danger Alerts Group */}
        <div className="dashboard-group-panel">
          <div
            className="dashboard-card"
            style={{ cursor: overdues.length > 0 ? 'pointer' : 'default' }}
            onClick={() => {
              if (overdues.length > 0) {
                document.getElementById('overdue-section')?.scrollIntoView({ behavior: 'smooth' })
              }
            }}
          >
            <div className="dashboard-card-icon purple-theme">
              <Clock size={20} />
            </div>
            <span className="dashboard-card-label">รายการคืนเกินกำหนด</span>
            <span className={`dashboard-card-value ${overdues.length > 0 ? 'danger-color' : ''}`}>
              {overdues.length}
            </span>
            <span className="dashboard-card-subtext">ต้องติดตามลูกค้า</span>
            {overdues.length > 0 && (
              <span className="dashboard-card-badge danger">ต้องจัดการด่วน</span>
            )}
          </div>

        </div>

        {/* Right Side: Financial & Rental Summary Group */}
        <div className="dashboard-group-panel premium-gradient-bg">
          {/* Card 3: Total Cumulative Revenue */}
          <div className="dashboard-card gradient-card">
            <div className="dashboard-card-icon green-theme">
              <Wallet size={20} />
            </div>
            <span className="dashboard-card-label">ยอดรับชำระสะสม</span>
            <span className="dashboard-card-value">
              ฿{Math.round(totalRevenue).toLocaleString('th-TH')}
            </span>
            <span className="dashboard-card-subtext">ยอดเงินที่บันทึกรับชำระแล้ว</span>
          </div>

          {/* Card 4: Currently Rented Sets */}
          <div className="dashboard-card gradient-card">
            <div className="dashboard-card-icon blue-theme">
              <Shirt size={20} />
            </div>
            <span className="dashboard-card-label">กำลังเช่าอยู่ขณะนี้</span>
            <span className="dashboard-card-value">{currentlyRented}</span>
            <span className="dashboard-card-subtext">ชุดที่อยู่ระหว่างการเช่า</span>
          </div>
        </div>
      </section>

      {/* --- MOBILE ONLY: งานวันนี้ (Today's Tasks Summary) --- */}
      <section className="mobile-only-today-tasks">
        <div className="section-header">
          <div className="section-title">
            <ClipboardList className="section-header-icon" size={20} />
            <h2>งานวันนี้</h2>
          </div>
          <button onClick={onNavigateToRentals} className="view-all-link">
            ดูทั้งหมด <ChevronRight size={14} style={{ marginLeft: '2px' }} />
          </button>
        </div>

        <div className="task-list">
          <div className="task-item" onClick={onNavigateToRentals}>
            <div className="task-item-left">
              <div className="task-icon-wrapper yellow">
                <ShoppingBag size={18} />
              </div>
              <div className="task-info">
                <span className="task-title">นัดรับชุดวันนี้</span>
                <span className="task-subtext">ลูกค้า <span className="highlight-count">{pickups.filter((p) => p.status === 'pending').length}</span> รายการ</span>
              </div>
            </div>
            <div className="task-item-right">
              <span className="task-count yellow">{pickups.filter((p) => p.status === 'pending').length}</span>
              <ChevronRight size={16} className="chevron-icon" />
            </div>
          </div>

          <div className="task-item" onClick={onNavigateToRentals}>
            <div className="task-item-left">
              <div className="task-icon-wrapper blue">
                <Undo2 size={18} />
              </div>
              <div className="task-info">
                <span className="task-title">คืนชุดวันนี้</span>
                <span className="task-subtext">ลูกค้า <span className="highlight-count">{returns.filter((r) => r.status === 'waiting').length}</span> รายการ</span>
              </div>
            </div>
            <div className="task-item-right">
              <span className="task-count blue">{returns.filter((r) => r.status === 'waiting').length}</span>
              <ChevronRight size={16} className="chevron-icon" />
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

      {/* --- MODAL: CUSTOMER CONTACT DETAILS --- */}
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
