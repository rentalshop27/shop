import { useState, useMemo } from 'react'
import {
  Search,
  History,
  ArrowRight,
  Database,
  PlusCircle,
  Edit,
  Trash2,
  X,
  FileText
} from 'lucide-react'
import type { AuditLog } from './auditRemote'

interface AuditLogPageProps {
  auditLogs: AuditLog[]
  loading?: boolean
  onRefresh?: () => Promise<void>
}

const tableTranslations: Record<string, string> = {
  customers: 'ลูกค้า (Customers)',
  customer_documents: 'เอกสารลูกค้า (Customer Documents)',
  rentals: 'รายการเช่าชุด (Rentals)',
  shops: 'ร้านค้า (Shops)',
  shop_members: 'สมาชิกในร้าน (Shop Members)'
}

const actionTranslations: Record<string, string> = {
  INSERT: 'เพิ่มข้อมูล',
  UPDATE: 'แก้ไขข้อมูล',
  DELETE: 'ลบข้อมูล'
}

const fieldTranslations: Record<string, string> = {
  // Customer fields
  full_name: 'ชื่อ-นามสกุล',
  phone: 'เบอร์โทรศัพท์',
  phone_normalized: 'เบอร์โทร (ระบบ)',
  line_account: 'LINE Account',
  current_address: 'ที่อยู่ปัจจุบัน',
  notes: 'หมายเหตุ',
  profile_status: 'สถานะโปรไฟล์',
  risk_flag: 'ระดับความเสี่ยง',
  bust_in: 'รอบอก (นิ้ว)',
  waist_in: 'รอบเอว (นิ้ว)',
  hip_in: 'สะโพก (นิ้ว)',
  height_cm: 'ส่วนสูง (ซม.)',
  archived_at: 'วันที่ยกเลิกถาวร',
  created_at: 'วันที่สร้าง',
  updated_at: 'วันที่แก้ไขล่าสุด',
  
  // Rental fields
  order_code: 'รหัสออเดอร์',
  customer_id: 'รหัสลูกค้า',
  stock_item_sku: 'SKU ชุด',
  pickup_date: 'วันที่จอง/รับ',
  return_date: 'วันที่คืน',
  rental_price: 'ราคาเช่า',
  deposit_amount: 'เงินประกัน/มัดจำ',
  collected_amount: 'เงินที่เก็บมาแล้ว',
  status: 'สถานะการเช่า',

  // Customer documents
  storage_path: 'ที่เก็บไฟล์เอกสาร',
  sort_order: 'ลำดับรูปภาพ'
}

const ignoredKeys = ['id', 'shop_id', 'created_at', 'updated_at', 'owner_user_id', 'user_id', 'customer_id', 'archived_at']

export function AuditLogPage({ auditLogs, loading = false, onRefresh }: AuditLogPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<'all' | AuditLog['action']>('all')
  const [tableFilter, setTableFilter] = useState<'all' | string>('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  // Calculations for stats
  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const logsToday = auditLogs.filter(log => new Date(log.createdAt).toDateString() === today)
    
    return {
      total: auditLogs.length,
      today: logsToday.length,
      inserts: auditLogs.filter(log => log.action === 'INSERT').length,
      updates: auditLogs.filter(log => log.action === 'UPDATE').length,
      deletes: auditLogs.filter(log => log.action === 'DELETE').length
    }
  }, [auditLogs])

  // Filtered audit logs list
  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return auditLogs.filter((log) => {
      const matchesAction = actionFilter === 'all' || log.action === actionFilter
      const matchesTable = tableFilter === 'all' || log.tableName === tableFilter
      
      const tableLabel = tableTranslations[log.tableName] || log.tableName
      const actionLabel = actionTranslations[log.action] || log.action
      
      const searchable = [
        log.userEmail || '',
        log.tableName,
        tableLabel,
        log.action,
        actionLabel,
        log.recordId
      ].join(' ').toLowerCase()

      return matchesAction && matchesTable && (!query || searchable.includes(query))
    })
  }, [auditLogs, searchQuery, actionFilter, tableFilter])

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredLogs.slice(startIndex, startIndex + pageSize)
  }, [filteredLogs, currentPage, pageSize])

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1

  // Format date display helper
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Get action badge styling
  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'INSERT':
        return (
          <span className="status-pill success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <PlusCircle size={12} />
            {actionTranslations[action]}
          </span>
        )
      case 'UPDATE':
        return (
          <span className="status-pill warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <Edit size={12} />
            {actionTranslations[action]}
          </span>
        )
      case 'DELETE':
        return (
          <span className="status-pill danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={12} />
            {actionTranslations[action]}
          </span>
        )
      default:
        return <span className="status-pill muted">{action}</span>
    }
  }

  // Helper to format values for display
  const formatValue = (val: any) => {
    if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>
    if (typeof val === 'boolean') return val ? 'True' : 'False'
    return String(val)
  }

  // Helper to determine what actually changed
  const getDiffItems = (log: AuditLog) => {
    const { action, oldData, newData } = log
    const items: Array<{ field: string; oldVal: any; newVal: any }> = []

    if (action === 'INSERT' && newData) {
      Object.keys(newData).forEach(key => {
        if (!ignoredKeys.includes(key)) {
          items.push({ field: key, oldVal: null, newVal: newData[key] })
        }
      })
    } else if (action === 'DELETE' && oldData) {
      Object.keys(oldData).forEach(key => {
        if (!ignoredKeys.includes(key)) {
          items.push({ field: key, oldVal: oldData[key], newVal: null })
        }
      })
    } else if (action === 'UPDATE' && oldData && newData) {
      const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]))
      allKeys.forEach(key => {
        if (!ignoredKeys.includes(key) && JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          items.push({ field: key, oldVal: oldData[key], newVal: newData[key] })
        }
      })
    }
    return items
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Audit Logs</p>
          <h1>ประวัติการใช้งานและตรวจสอบ</h1>
          <p className="subtitle">ตรวจสอบประวัติการลงทะเบียน แก้ไข หรือลบข้อมูลในระบบแยกตามรายผู้ใช้งาน</p>
        </div>
        {onRefresh && (
          <button className="secondary-button" type="button" onClick={onRefresh} disabled={loading}>
            <History size={18} />
            รีเฟรชประวัติ
          </button>
        )}
      </header>

      {/* STATS STRIP */}
      <section className="system-strip">
        <div className="metric-card total">
          <div className="metric-icon-wrapper">
            <Database size={24} />
          </div>
          <div className="card-content">
            <span>กิจกรรมทั้งหมด</span>
            <strong>
              {stats.total} <span className="unit">รายการ</span>
            </strong>
          </div>
        </div>
        
        <div className="metric-card total" style={{ borderColor: 'rgba(96, 165, 250, 0.15)' }}>
          <div className="metric-icon-wrapper" style={{ background: 'rgba(96, 165, 250, 0.06)', border: '1px solid rgba(96, 165, 250, 0.2)', color: '#60a5fa' }}>
            <Edit size={24} />
          </div>
          <div className="card-content">
            <span>แก้ไขข้อมูล</span>
            <strong>
              {stats.updates} <span className="unit">ครั้ง</span>
            </strong>
          </div>
        </div>

        <div className="metric-card verified">
          <div className="metric-icon-wrapper">
            <PlusCircle size={24} />
          </div>
          <div className="card-content">
            <span>เพิ่มข้อมูลใหม่</span>
            <strong>
              {stats.inserts} <span className="unit">รายการ</span>
            </strong>
          </div>
        </div>

        <div className="metric-card risk">
          <div className="metric-icon-wrapper">
            <Trash2 size={24} />
          </div>
          <div className="card-content">
            <span>ลบข้อมูล</span>
            <strong>
              {stats.deletes} <span className="unit">รายการ</span>
            </strong>
          </div>
        </div>
      </section>

      {/* WORKSPACE */}
      <div className="panel customer-list-panel">
        {/* Filters Toolbar */}
        <div className="toolbar" style={{ gridTemplateColumns: '1fr 180px 180px' }}>
          <label className="search-box">
            <Search size={22} />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="ค้นหาตามอีเมล, ตารางข้อมูล, หรือ รหัสคีย์..."
            />
          </label>
          
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value as any); setCurrentPage(1); }}
            aria-label="ประเภทกิจกรรม"
          >
            <option value="all">ทุกกิจกรรม</option>
            <option value="INSERT">เพิ่มข้อมูล (INSERT)</option>
            <option value="UPDATE">แก้ไขข้อมูล (UPDATE)</option>
            <option value="DELETE">ลบข้อมูล (DELETE)</option>
          </select>

          <select
            value={tableFilter}
            onChange={(e) => { setTableFilter(e.target.value); setCurrentPage(1); }}
            aria-label="ตารางข้อมูล"
          >
            <option value="all">ทุกตารางข้อมูล</option>
            <option value="customers">ลูกค้า (Customers)</option>
            <option value="customer_documents">เอกสารลูกค้า</option>
            <option value="rentals">เช่า/คืน (Rentals)</option>
          </select>
        </div>

        {/* Audit Logs Table */}
        <div className="customer-table" role="table" aria-label="ประวัติการบันทึกระบบ">
          <div
            className="table-row table-head"
            role="row"
            style={{ gridTemplateColumns: '170px 220px 100px 170px 1fr 100px', minWidth: '850px' }}
          >
            <span>วัน-เวลาที่แก้ไข</span>
            <span>ผู้ดำเนินการ (User)</span>
            <span>กิจกรรม</span>
            <span>ตารางข้อมูล</span>
            <span>รหัสอ้างอิงข้อมูล (Record ID)</span>
            <span style={{ textAlign: 'center' }}>รายละเอียด</span>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              กำลังโหลดข้อมูลประวัติ...
            </div>
          ) : paginatedLogs.map((log) => (
            <div
              className="table-row"
              key={log.id}
              role="row"
              style={{ gridTemplateColumns: '170px 220px 100px 170px 1fr 100px', minWidth: '850px', fontSize: '13px' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{formatDateTime(log.createdAt)}</span>
              <strong style={{ fontSize: '14px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.userEmail || 'System (ระบบ)'}
              </strong>
              {getActionBadge(log.action)}
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{tableTranslations[log.tableName] || log.tableName}</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '12px' }}>{log.recordId}</span>
              <button
                className="secondary-button"
                type="button"
                style={{ minHeight: '32px', padding: '0 10px', fontSize: '12px', justifySelf: 'center' }}
                onClick={() => setSelectedLog(log)}
              >
                ดูข้อมูล
              </button>
            </div>
          ))}

          {!loading && paginatedLogs.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              ไม่พบประวัติการแก้ไขตามเงื่อนไขที่เลือก
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="pagination-footer">
            <button
              className="pagination-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              type="button"
            >
              <ChevronLeftIcon />
            </button>
            <div className="page-number-box">{currentPage}</div>
            <button
              className="pagination-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              type="button"
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>

      {/* DETAIL DIFF MODAL */}
      {selectedLog && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedLog(null)}>
          <section
            className="modal-panel"
            aria-label="รายละเอียดประวัติการแก้ไข"
            style={{ maxWidth: '650px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <History size={14} /> Audit Trail Log
                </p>
                <h2>รายละเอียดการบันทึกประวัติ</h2>
              </div>
              <button className="ghost-button" type="button" onClick={() => setSelectedLog(null)} aria-label="ปิด">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>ผู้ดำเนินการ (User)</span>
                <strong style={{ color: '#fff', fontSize: '14px' }}>{selectedLog.userEmail || 'System'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>วัน-เวลาที่ทำรายการ</span>
                <strong style={{ color: '#fff' }}>{formatDateTime(selectedLog.createdAt)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>ประเภทกิจกรรม</span>
                {getActionBadge(selectedLog.action)}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>ตารางข้อมูล</span>
                <strong style={{ color: 'var(--text-gold)' }}>{tableTranslations[selectedLog.tableName] || selectedLog.tableName}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>รหัสอ้างอิงข้อมูล (Record ID)</span>
                <code style={{ color: '#cbd5e1', fontSize: '12px', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                  {selectedLog.recordId}
                </code>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} /> รายละเอียดฟิลด์ที่เปลี่ยนแปลง
              </h3>

              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-input)' }}>
                {getDiffItems(selectedLog).length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    ไม่มีข้อมูลฟิลด์ที่มีการเปลี่ยนแปลง (หรือเป็นฟิลด์ระบบทั่วไป)
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px 16px', fontWeight: 600 }}>ชื่อฟิลด์</th>
                        {selectedLog.action !== 'INSERT' && <th style={{ padding: '10px 16px', fontWeight: 600 }}>ข้อมูลเดิม (ก่อนแก้ไข)</th>}
                        {selectedLog.action !== 'DELETE' && <th style={{ padding: '10px 16px', fontWeight: 600 }}>ข้อมูลใหม่ (หลังแก้ไข)</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {getDiffItems(selectedLog).map((item) => (
                        <tr key={item.field} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 600, color: '#fff' }}>
                            {fieldTranslations[item.field] || item.field}
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 400 }}>{item.field}</span>
                          </td>
                          
                          {selectedLog.action !== 'INSERT' && (
                            <td style={{ padding: '10px 16px', color: selectedLog.action === 'UPDATE' ? '#f87171' : 'inherit', textDecoration: selectedLog.action === 'UPDATE' ? 'line-through' : 'none', background: selectedLog.action === 'DELETE' ? 'rgba(239, 68, 68, 0.03)' : 'none' }}>
                              {formatValue(item.oldVal)}
                            </td>
                          )}

                          {selectedLog.action !== 'DELETE' && (
                            <td style={{ padding: '10px 16px', color: selectedLog.action === 'UPDATE' ? '#34d399' : 'inherit', background: selectedLog.action === 'INSERT' ? 'rgba(16, 185, 129, 0.03)' : 'none' }}>
                              {selectedLog.action === 'UPDATE' && <ArrowRight size={12} style={{ marginRight: '6px', color: 'var(--text-muted)', display: 'inline-block', verticalAlign: 'middle' }} />}
                              {formatValue(item.newVal)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="primary-button" type="button" onClick={() => setSelectedLog(null)} style={{ background: 'var(--text-gold)', color: '#000' }}>
                ตกลง / ปิดหน้าต่าง
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  )
}
