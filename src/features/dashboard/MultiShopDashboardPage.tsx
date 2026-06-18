import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Shirt,
  Store,
  Wallet,
} from 'lucide-react'
import type { ShopSummary } from '../customers/customerRemote'
import type { RentalOrder } from '../rentals/rentalTypes'
import { buildDashboardMetrics, getLocalDateString, type RentalSchedule, type OverdueRental } from './dashboardMetrics'

export type OverviewShopStatus = 'loading' | 'ready' | 'error'

export interface OverviewShopData {
  shop: ShopSummary
  status: OverviewShopStatus
  rentals: RentalOrder[]
  error: string
}

interface MultiShopDashboardPageProps {
  shopsData: OverviewShopData[]
  onEnterShop: (shopId: string) => void
  preferredShopId: string | null
  onLogout?: () => Promise<void>
}

interface ScheduleTableProps {
  title: string
  emptyText: string
  badgeText: string
  items: RentalSchedule[]
  shopNameByRentalId: Map<string, string>
  kind: 'pickup' | 'return'
}

function ScheduleTable({
  title,
  emptyText,
  badgeText,
  items,
  shopNameByRentalId,
  kind,
}: ScheduleTableProps) {
  return (
    <div className="dashboard-table-panel multi-shop-table-panel">
      <div className="dashboard-table-header">
        <h3 className="dashboard-table-title">{title}</h3>
        <span className="dashboard-table-count-badge active-count">{badgeText}</span>
      </div>

      <div className="dashboard-list-table">
        <div className="multi-shop-list-row multi-shop-list-row-four head">
          <span>ลูกค้า</span>
          <span>รายการชุด</span>
          <span>สาขา</span>
          <span>สถานะ</span>
        </div>

        {items.length === 0 ? (
          <div className="dashboard-empty-table-state">
            <BadgeCheck size={28} />
            {emptyText}
          </div>
        ) : (
          items.map((item) => (
            <div className="multi-shop-list-row multi-shop-list-row-four" key={item.id}>
              <span className="dashboard-cell-customer" data-label="ลูกค้า">
                {item.customerName}
                <small>{item.customerCode}</small>
              </span>
              <span className="dashboard-cell-item" data-label="รายการชุด">{item.item}</span>
              <span className="multi-shop-cell-muted" data-label="สาขา">
                {shopNameByRentalId.get(item.id) ?? '-'}
              </span>
              <span data-label="สถานะ">
                {item.status === 'success' ? (
                  <span className="dashboard-status-tag success">{kind === 'pickup' ? 'รับแล้ว' : 'คืนแล้ว'}</span>
                ) : (
                  <span className="dashboard-status-tag warning">
                    {kind === 'pickup' ? 'รอดำเนินการ' : 'คาดว่าจะคืน'}
                  </span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function OverdueTable({
  items,
  shopNameByRentalId,
}: {
  items: OverdueRental[]
  shopNameByRentalId: Map<string, string>
}) {
  return (
    <section id="overdue-section" className="multi-shop-overdue-section">
      <h2 className="multi-shop-section-title">รายการคืนเกินกำหนดสะสมทุกสาขา</h2>
      <div className="dashboard-table-panel multi-shop-table-panel">
        <div className="dashboard-list-table">
          <div className="multi-shop-list-row multi-shop-list-row-five head">
            <span>ลูกค้า</span>
            <span>รายการชุด</span>
            <span>สาขา</span>
            <span>กำหนดคืน</span>
            <span>เลยกำหนด</span>
          </div>

          {items.map((item) => (
            <div className="multi-shop-list-row multi-shop-list-row-five" key={item.id}>
              <span className="dashboard-cell-customer" data-label="ลูกค้า">
                {item.customerName}
                <small>{item.customerCode}</small>
              </span>
              <span className="dashboard-cell-item" data-label="รายการชุด">{item.item}</span>
              <span className="multi-shop-cell-muted" data-label="สาขา">
                {shopNameByRentalId.get(item.id) ?? '-'}
              </span>
              <span className="multi-shop-due-date" data-label="กำหนดคืน">{item.dueDate}</span>
              <span data-label="เลยกำหนด">
                <span className="dashboard-status-tag danger">{item.daysOverdue} วัน</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function MultiShopDashboardPage({
  shopsData,
  onEnterShop,
  preferredShopId,
  onLogout,
}: MultiShopDashboardPageProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const today = getLocalDateString(new Date())

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

  const sortedShopsData = useMemo(() => {
    if (!preferredShopId) return shopsData
    return [...shopsData].sort((a, b) => {
      if (a.shop.id === preferredShopId) return -1
      if (b.shop.id === preferredShopId) return 1
      return 0
    })
  }, [shopsData, preferredShopId])

  const readyShopsData = useMemo(
    () => shopsData.filter((entry) => entry.status === 'ready'),
    [shopsData],
  )
  const failedShopsData = useMemo(
    () => shopsData.filter((entry) => entry.status === 'error'),
    [shopsData],
  )
  const isLoading = shopsData.length === 0 || shopsData.some((entry) => entry.status === 'loading')
  const allRentals = useMemo(
    () => readyShopsData.flatMap((entry) => entry.rentals),
    [readyShopsData],
  )
  const aggregatedMetrics = useMemo(
    () => buildDashboardMetrics(allRentals, today),
    [allRentals, today],
  )
  const shopNameByRentalId = useMemo(() => {
    const names = new Map<string, string>()
    readyShopsData.forEach(({ shop, rentals }) => {
      rentals.forEach((rental) => names.set(rental.id, shop.name))
    })
    return names
  }, [readyShopsData])

  return (
    <main className="multi-shop-dashboard">
      <header className="multi-shop-header">
        <div>
          <p className="eyebrow">PRECIOUS RENTAL</p>
          <h1>หน้าแดชบอร์ดภาพรวมสาขา</h1>
          <p className="subtitle">ภาพรวมผลประกอบการ รายรับ และจำนวนงานของทุกร้านค้าที่บัญชีนี้เข้าถึงได้</p>
        </div>
        {onLogout && (
          <div className="multi-shop-logout-group">
            <button className="secondary-button multi-shop-logout" onClick={handleLogout} disabled={isLoggingOut} type="button">
              {isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
            </button>
            {logoutError && <p className="multi-shop-logout-error" role="alert">{logoutError}</p>}
          </div>
        )}
      </header>

      {isLoading && (
        <div className="multi-shop-notice" role="status">
          <span className="spinner multi-shop-spinner" />
          <div>
            <strong>กำลังโหลดข้อมูลภาพรวมทุกสาขา...</strong>
            <span>ระบบจะแสดงยอดรวมเมื่อข้อมูลพร้อม</span>
          </div>
        </div>
      )}

      {failedShopsData.length > 0 && (
        <div className="multi-shop-notice multi-shop-notice-error" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>ยอดรวมนี้ยังไม่รวมข้อมูลจากบางสาขา</strong>
            {failedShopsData.map(({ shop, error }) => (
              <span key={shop.id}>{shop.name}: {error}</span>
            ))}
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          <h2 className="multi-shop-section-title">สถิติสะสมรวมทุกสาขา</h2>
          <section className="multi-shop-summary-grid" aria-label="สถิติหลัก">
            <SummaryCard icon={<FileText size={18} />} label="ใบเช่าทั้งหมด" value={allRentals.length.toLocaleString('th-TH')} theme="blue" />
            <SummaryCard icon={<Wallet size={18} />} label="รายรับสะสมรวม" value={`฿${Math.round(aggregatedMetrics.totalRevenue).toLocaleString('th-TH')}`} theme="green" />
            <SummaryCard icon={<Shirt size={18} />} label="กำลังเช่าขณะนี้" value={aggregatedMetrics.currentlyRented.toLocaleString('th-TH')} theme="blue" />
            <SummaryCard icon={<Clock size={18} />} label="คืนชุดเกินกำหนด" value={aggregatedMetrics.overdues.length.toLocaleString('th-TH')} theme="purple" danger={aggregatedMetrics.overdues.length > 0} />
            <SummaryCard icon={<ClipboardList size={18} />} label="งานวันนี้นัดรับ/นัดคืน" value={`${aggregatedMetrics.pickups.length} / ${aggregatedMetrics.returns.length}`} theme="yellow" />
          </section>
        </>
      )}

      <h2 className="multi-shop-section-title">รายชื่อสาขา</h2>
      <section className="multi-shop-grid" aria-label="รายชื่อสาขา">
        {sortedShopsData.map(({ shop, status, rentals, error }) => {
          const isPreferred = shop.id === preferredShopId
          const metrics = buildDashboardMetrics(rentals, today)

          return (
            <article key={shop.id} className={`shop-card ${isPreferred ? 'preferred' : ''}`}>
              <div>
                <div className="shop-card-heading">
                  <Store size={22} />
                  <h3>{shop.name}</h3>
                </div>
                {isPreferred && <span className="shop-badge">ร้านล่าสุด</span>}

                {status === 'loading' && <p className="shop-card-state">กำลังโหลดข้อมูลร้าน...</p>}
                {status === 'error' && (
                  <div className="shop-card-state shop-card-error">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>ข้อมูลภาพรวมของร้านนี้ไม่พร้อม</strong>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
                {status === 'ready' && (
                  <div className="metric-mini-grid">
                    <MiniMetric label="รายรับสะสม" value={`฿${Math.round(metrics.totalRevenue).toLocaleString('th-TH')}`} accent />
                    <MiniMetric label="กำลังเช่าอยู่" value={metrics.currentlyRented.toLocaleString('th-TH')} />
                    <MiniMetric label="เกินกำหนด" value={metrics.overdues.length.toLocaleString('th-TH')} danger={metrics.overdues.length > 0} />
                    <MiniMetric label="นัดรับ/คืนวันนี้" value={`${metrics.pickups.length} รับ / ${metrics.returns.length} คืน`} compact />
                  </div>
                )}
              </div>

              <button className="enter-shop-btn" type="button" onClick={() => onEnterShop(shop.id)}>
                <span>เข้าร้านนี้</span>
                <ChevronRight size={16} />
              </button>
            </article>
          )
        })}
      </section>

      {!isLoading && (
        <>
          <h2 className="multi-shop-section-title">งานรอดำเนินการสะสมทุกสาขา</h2>
          <section className="multi-shop-tables-grid" aria-label="งานประจำวัน">
            <ScheduleTable
              title="นัดรับชุดวันนี้รวมทุกร้าน"
              emptyText="ไม่มีรายการนัดรับในวันนี้"
              badgeText={`${aggregatedMetrics.pickups.filter((item) => item.status === 'pending').length} รอดำเนินการ`}
              items={aggregatedMetrics.pickups}
              shopNameByRentalId={shopNameByRentalId}
              kind="pickup"
            />
            <ScheduleTable
              title="กำหนดคืนวันนี้รวมทุกร้าน"
              emptyText="ไม่มีรายการต้องคืนในวันนี้"
              badgeText={`${aggregatedMetrics.returns.filter((item) => item.status === 'waiting').length} คาดว่าจะคืน`}
              items={aggregatedMetrics.returns}
              shopNameByRentalId={shopNameByRentalId}
              kind="return"
            />
          </section>
          {aggregatedMetrics.overdues.length > 0 && (
            <OverdueTable items={aggregatedMetrics.overdues} shopNameByRentalId={shopNameByRentalId} />
          )}
        </>
      )}
    </main>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  theme,
  danger = false,
}: {
  icon: ReactNode
  label: string
  value: string
  theme: 'blue' | 'green' | 'purple' | 'yellow'
  danger?: boolean
}) {
  return (
    <div className="dashboard-card multi-shop-summary-card">
      <div className={`multi-shop-summary-icon ${theme}`}>{icon}</div>
      <div>
        <span className="dashboard-card-label">{label}</span>
        <span className={`dashboard-card-value ${danger ? 'danger-color' : ''}`}>{value}</span>
      </div>
    </div>
  )
}

function MiniMetric({
  label,
  value,
  accent = false,
  danger = false,
  compact = false,
}: {
  label: string
  value: string
  accent?: boolean
  danger?: boolean
  compact?: boolean
}) {
  return (
    <div className="metric-mini-item">
      <span className="metric-mini-label">{label}</span>
      <span className={`metric-mini-value ${accent ? 'accent' : ''} ${danger ? 'danger-color' : ''} ${compact ? 'compact' : ''}`}>
        {value}
      </span>
    </div>
  )
}
