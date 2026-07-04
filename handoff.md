# Handoff Report: Rentals Page Hybrid Table & UI Redesign

**Branch:** `codex/test-sandbox`
**อัปเดตล่าสุด:** 2026-07-04

---

## สรุปภาพรวม (Overview)

การอัปเดตในรอบนี้มุ่งเน้นที่การยกเครื่อง UI/UX ของหน้ารายการเช่าชุด (`RentalsPage.tsx`) ใหม่ทั้งหมด เพื่อรองรับ Workflow การทำงานของร้านเช่าชุดที่ต้องดูข้อมูลออเดอร์จำนวนมาก (100-200 ออเดอร์ต่อวัน) ได้อย่างรวดเร็ว โดยเปลี่ยนจากตารางธรรมดามาเป็น **Hybrid Table + Rich Detail Panel** และเพิ่ม **Interactive KPI Dashboard**

## รายละเอียดสิ่งที่ทำเสร็จแล้ว (Completed Work)

### 1. Interactive KPI Dashboard (ส่วนบน)
เพิ่มกล่องตัวเลข 5 กล่องด้านบนเพื่อสรุปสถานะออเดอร์:
- 📦 **วันนี้** (ออเดอร์ที่ถูกสร้างในวันนี้)
- 🟢 **กำลังเช่า** (สถานะ `active`)
- 🟠 **คืนวันนี้** (ออเดอร์ที่ถึงกำหนดคืนในวันนี้)
- 🔴 **เลยกำหนดคืน** (ออเดอร์ `active` ที่เลยกำหนด `returnDate`)
- 🚨 **เลยกำหนดส่ง** (ออเดอร์ `booked` ที่เลยกำหนด `pickupDate`)
**✨ หมัดเด็ด:** กล่องเหล่านี้ทำหน้าที่เป็น **Interactive Filter** เมื่อคลิกที่กล่อง ตารางด้านล่างจะกรองข้อมูลตามสถานะนั้นๆ ทันที

### 2. Hybrid Table / Mini-Card List (แผงด้านซ้าย)
เปลี่ยนการแสดงผลจากตารางแนวยาวเป็น **Mini-Card** ที่อัดแน่นข้อมูลสำคัญในพื้นที่จำกัด:
- ย่อหมายเลขออเดอร์ (จาก `PR-ORD-60704-003` เหลือ `#60704-003`)
- โชว์ Thumbnail รูปชุดชัดเจน (ถ้าไม่มีรูปจะแสดงไอคอน 👕 แทน)
- โชว์ยอดรวมสุทธิเป็นตัวเลขกลมๆ ก้อนเดียว
- แสดงชื่อลูกค้า วันรับ-คืน และสถานะเป็น Badge อย่างชัดเจน

### 3. Smart Search (รองรับ Barcode)
- อัปเกรดช่องค้นหาให้ฉลาดขึ้น หากพิมพ์เศษของหมายเลขออเดอร์ (เช่น `#003` หรือ `003`) หรือใช้เครื่องยิงบาร์โค้ด
- ระบบจะทำการค้นหาและ **เลือกออเดอร์นั้นพร้อมเปิดแถบรายละเอียดด้านขวาให้ทันที** โดยไม่ต้องกด Enter ช่วยลดเวลาทำงานของพนักงาน

### 4. Rich Detail Panel (แผงด้านขวา)
จัดกลุ่มข้อมูลอย่างเป็นระเบียบ แบ่งเป็นส่วนๆ ให้อ่านง่าย:
- **แถบเครื่องมือหลัก:** แสดงป้ายสถานะและปุ่ม Action หลัก (เช่น `รับชุด`, `คืนชุด`, `พิมพ์แท็ก`) 
- **ข้อมูลลูกค้า:** แสดงชื่อ รูปโปรไฟล์ย่อ เบอร์โทร และเพิ่มโครงสร้างสำหรับ Customer Insight (เช่น จำนวนครั้งที่เช่า, Late Return, ระดับลูกค้าแบบ 5 ดาว) *หมายเหตุ: ปัจจุบันข้อมูล Insight ยังเป็น Mockup*
- **ข้อมูลการเช่า & ชำระเงิน:** 
  - **✨ หมัดเด็ด:** หากลูกค้าชำระเงินครบ 100% แล้ว (ยอดเก็บ >= ยอดสุทธิหลังหักส่วนลด) จะมีป้าย **[ 💰 ชำระครบแล้ว 100% ]** ปรากฏขึ้นเพื่อเป็นการให้ไฟเขียวกับไรเดอร์/พนักงานก่อนปล่อยชุด
- **Timeline ออเดอร์:** เปลี่ยนประวัติสถานะให้เป็นเส้น Timeline แนวดิ่งสไตล์ GitHub
- **ชุดที่เช่า:** รายการชุดพร้อมรูปภาพและข้อมูลขนาด (ไซส์/สี/SKU) พร้อมปุ่มแก้ไข (ถ้ามีสิทธิ์)
- **ขนาดตัวลูกค้า:** อก เอว สะโพก ความสูง
- **การจัดส่ง:** เพิ่มปุ่มการส่งแบบต่างๆ (Grab, EMS, รับหน้าร้าน)
- **จัดการเงินมัดจำ & ยกเลิกออเดอร์:** ย้ายมาไว้ส่วนท้ายสุดอย่างเป็นระเบียบ

### 5. Stylesheets (`index.css`)
- อัปเดตโครงสร้าง Grid Layout จากเดิมไปใช้ `grid-template-columns: minmax(0, 1.7fr) 420px;` 
- เพิ่มคลาส CSS ใหม่จำนวนมาก: `.hybrid-table-row`, `.mini-card-thumbnail`, `.metric-card.interactive`, `.vertical-timeline`, `.payment-badge-green` ฯลฯ

---

## สิ่งที่ต้องทำต่อไป (Next Steps / TODOs)

- [x] **Customer Insight Logic / Customer Star Rating:** เปลี่ยน Mockup ในแผงด้านขวาให้เป็นข้อมูลจริงจากประวัติการเช่า และทำสูตรระดับลูกค้า 5 ดาวให้ใช้งานได้จริง
  - **สถานะล่าสุด:** ทำ v1 แล้วใน `src/features/rentals/customerInsights.ts` และ render จริงใน `src/features/rentals/RentalsPage.tsx`
  - **ข้อมูลที่ใช้ใน v1 โดยไม่เพิ่ม DB column:**
    - `Customer.profileStatus`, `Customer.riskFlag`, `Customer.documents`, `Customer.archivedAt`
    - `RentalOrder.customer.id`, `status`, `pickupDate`, `returnDate`, `depositStatus`, `collectedAmount`, `depositAmount`, `shippingCost`
  - **งาน v1 ที่ทำแล้ว:**
    - สร้าง helper ใหม่ `src/features/rentals/customerInsights.ts`
    - คำนวณ `rentalCount` จาก rental ทั้งหมดของลูกค้าคนเดียวกัน
    - คำนวณ `completedRentalCount` จาก `status === 'returned'`
    - คำนวณ `activeOverdueCount` จาก `status === 'overdue'` หรือ `status === 'active' && returnDate < today`
    - คำนวณ `depositForfeitedCount` จาก `depositStatus === 'forfeited'`
    - คำนวณ `totalSpent` จาก `collectedAmount - depositAmount`
    - คำนวณ `starRating` จากสูตรกลางเดียวกัน แล้ว render เป็นดาวจริงแทน mock
  - **สูตรเริ่มต้นที่เสนอสำหรับ v1:**
    - เริ่มที่ 5 ดาว
    - ถ้า `profileStatus !== 'verified'` หัก 1 ดาว
    - ถ้า `riskFlag === 'has_risk'` หัก 2 ดาว
    - active/overdue ที่เลยวันคืน หัก 0.5 ต่อครั้ง
    - deposit forfeited หัก 1 ต่อครั้ง
    - ลูกค้าที่เช่าครบ 5/10/20 ครั้งอาจบวกคืนบางส่วน แต่คะแนนสุดท้ายต้องไม่เกิน 5 และไม่ต่ำกว่า 1
  - **ข้อมูลที่ยังขาดถ้าต้องการสูตรแม่นขึ้นใน v2:**
    - `actual_returned_at` หรือ `returned_at` เพื่อรู้ว่ารายการที่ `status === 'returned'` เคยคืนช้าจริงหรือไม่
    - `cancelled_at` และ `cancel_reason` เพื่อแยก `cancelled` ปกติออกจาก no-show
    - field สำหรับ incident/damage หรือ note ที่เป็น structured data ถ้าจะหักดาวจากชุดเสียหาย ไม่ควรเดาจากข้อความ notes
  - **งาน DB v2 ที่ควรวางแผน:**
    - เพิ่ม migration ให้ตาราง `rentals` มี `actual_returned_at`, `cancelled_at`, `cancel_reason`
    - อัปเดต `src/features/rentals/rentalTypes.ts`
    - อัปเดต `src/features/rentals/rentalRemote.ts` ให้ map/load/save field ใหม่
    - อัปเดต action คืนชุด/ยกเลิกออเดอร์ใน `src/App.tsx` หรือ handler ที่เกี่ยวข้องให้บันทึก timestamp/เหตุผล
  - **Acceptance Criteria:**
    - [x] Customer Insight ในหน้าเช่าไม่มีค่า hard-coded mock เหลืออยู่
    - [x] ลูกค้าคนเดียวกันในหลายออเดอร์ได้ rental count และ star rating เดียวกัน
    - [x] มี unit test สำหรับ helper สูตรดาว ครอบคลุม verified customer, risk customer, overdue, deposit forfeited, และลูกค้าใหม่
    - [x] UI แสดงชื่อ metric ให้ตรงกับข้อเท็จจริง เช่น `ค้างคืนตอนนี้` และ `ยึดมัดจำ` แทนการอ้าง `Late Return` / `No Show`
- [x] **Print Tag CSS:** ปรับ CSS `@media print` สำหรับฟังก์ชัน "พิมพ์แท็ก" แล้ว
  - ล็อก `@page` / wrapper / tag เป็นขนาด 4x6 นิ้ว
  - ซ่อน UI ปกติระหว่าง print และแสดงเฉพาะ `.print-tag-wrapper`
  - เพิ่ม `print-color-adjust`, overflow guard, และ `break-inside: avoid` ให้ block สำคัญ
- [x] **Database / Backend Sync:** ตรวจสอบและเพิ่ม regression test แล้วว่า thumbnail ใน Mini-Card ได้ `imageUrls` จากข้อมูล stock/product ที่ backend โหลดไว้
  - `loadRentals()` hydrate `rental.costume` จาก `stockItems` ด้วย `stock_item_id`
  - รองรับ legacy fallback ด้วย `stock_item_sku`
  - Test อยู่ที่ `src/features/rentals/rentalRemote.test.ts`
