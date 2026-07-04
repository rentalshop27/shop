-- Migration 0024: Order edit & deposit lifecycle
-- 1. เพิ่ม 'cancelled' เข้า enum rental_status
alter type public.rental_status add value if not exists 'cancelled';

-- 2. เพิ่ม deposit_status column สำหรับ lifecycle ของเงินมัดจำ
--    null = ยังไม่เกี่ยวข้อง (เช่น ออเดอร์ยังไม่ถูก return หรือไม่มีมัดจำ)
--    pending_return = รอคืนมัดจำ
--    returned       = คืนมัดจำให้ลูกค้าแล้ว
--    forfeited      = ยึดมัดจำ (ชุดพัง / หักค่าปรับ)
alter table public.rentals
  add column if not exists deposit_status text
    check (deposit_status in ('pending_return', 'returned', 'forfeited'))
    default null;
