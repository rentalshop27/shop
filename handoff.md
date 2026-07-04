# Handoff Report: Order Editing Logic, Deposit Lifecycle, Cancel & Print Tag

**Branch:** `codex/test-sandbox`
**อัปเดตล่าสุด:** 2026-07-04

---

## สรุปภาพรวม (Overview)

การอัปเดตในรอบนี้เพิ่ม 4 ฟีเจอร์หลักที่ปิดลูปการทำงานของระบบเช่าชุดให้ครบวงจร:

1. **Order Editing Modal (Status-Aware)** — แก้ไขออเดอร์โดยมีกฎล็อกตามสถานะ
2. **Deposit Return Lifecycle** — ติดตามสถานะเงินมัดจำหลังคืนชุด
3. **Cancel Order** — ยกเลิกออเดอร์พร้อมปลดล็อกคิวปฏิทินทันที
4. **Print Tag** — พิมพ์ใบแท็กชุด 4×6 นิ้ว (Thermal Label) สำหรับแขวนชุด

---

## รายละเอียดสิ่งที่ทำเสร็จแล้ว (Completed Work)

### 1. Database Migration

#### `0024_order_edit_and_deposit.sql`
- **เพิ่ม `'cancelled'` เข้า enum `public.rental_status`** โดยใช้ `ALTER TYPE ... ADD VALUE IF NOT EXISTS`
- **เพิ่มคอลัมน์ `deposit_status`** (`text`, nullable) พร้อม check constraint รับค่าได้ 3 ค่า:
  - `pending_return` — รอคืนมัดจำ
  - `returned` — คืนเงินมัดจำให้ลูกค้าแล้ว
  - `forfeited` — ยึดมัดจำ (ชุดพัง/หักค่าปรับ)

> ⚠️ **ต้อง deploy migration นี้ใน Supabase ก่อน** ไม่เช่นนั้น frontend จะส่ง status `cancelled` ไม่ผ่าน DB constraint

---

### 2. TypeScript Types (`rentalTypes.ts`)

| เพิ่ม | รายละเอียด |
|---|---|
| `'cancelled'` ใน `RentalStatus` | union type ครบ: `booked \| active \| returned \| overdue \| cancelled` |
| `DepositStatus` (type ใหม่) | `'pending_return' \| 'returned' \| 'forfeited'` |
| `depositStatus?: DepositStatus` ใน `RentalOrder` | ฟิลด์ optional สำหรับ lifecycle มัดจำ |

---

### 3. Remote Layer (`rentalRemote.ts`)

| ฟังก์ชัน | ใช้ทำอะไร |
|---|---|
| `mapRentalRow()` | เพิ่ม map `deposit_status` จาก DB → `depositStatus` ใน object |
| `toRentalInsert()` | เพิ่ม `deposit_status` ในการ insert |
| **NEW** `updateRemoteRentalDeposit()` | อัปเดต `deposit_status` ของ rental หลายแถวพร้อมกัน |
| **NEW** `updateRemoteRentalFields()` | Partial patch ฟิลด์ต่างๆ ของออเดอร์ (ใช้ใน Edit Modal) รองรับ: `stock_item_id`, `pickup_date`, `return_date`, `rental_price`, `deposit_amount`, `collected_amount`, `shipping_cost`, `notes`, `return_tracking_note` |

---

### 4. Application State (`App.tsx`)

เพิ่ม handlers 3 ตัว และต่อ props ลง `<LazyRentalsPage>`:

| Handler | Logic |
|---|---|
| `handleCancelRental` | เรียก `updateRemoteRentalStatus(..., 'cancelled')` → set state ใน memory |
| `handleUpdateRentalDeposit` | เรียก `updateRemoteRentalDeposit()` → set `depositStatus` ใน state |
| `handleEditRentalFields` | Validate calendar conflict (exclude self) → เรียก `updateRemoteRentalFields()` → merge patch ลง state |

Props ใหม่ที่ส่งลงใน `<LazyRentalsPage>`:
```tsx
onCancelRental={handleCancelRental}
onUpdateDepositStatus={handleUpdateRentalDeposit}
onEditRentalFields={handleEditRentalFields}
```

---

### 5. RentalsPage UI (`RentalsPage.tsx`)

#### A. Status-Aware Order Editing Modal

- เพิ่ม state `editingRentalId`, `editMode` (`'full' | 'limited'`), `editFormError`
- ฟังก์ชัน `openEditModal(rental, mode)` — Pre-fill form ทุก field จากออเดอร์ที่เลือก
- `handleSubmit()` ถูก fork เป็น 2 branches:
  - **Edit branch** (เมื่อ `editingRentalId` มีค่า): route ตาม `editMode`
  - **Create branch**: ตรรกะเดิมทั้งหมด (ไม่กระทบ)

**กฎ Edit Mode ตามสถานะ:**

| สถานะ | ปุ่มที่ปรากฏ | Field ที่แก้ได้ |
|---|---|---|
| `booked` / `overdue` | ✏️ แก้ไขออเดอร์ (ทอง) | ทุก field รวมชุด, วันรับ-คืน, ราคา, โน้ต |
| `active` | ✏️ แก้ไข (จำกัด) (น้ำเงิน) | เฉพาะวันคืน, ราคา Override, ยอดเก็บ, โน้ต |
| `returned` / `cancelled` | ไม่มีปุ่ม | Read-only |

Calendar conflict check ใน `handleEditRentalFields()` — exclude ออเดอร์ตัวเองออกก่อนเช็ค

#### B. Deposit Return Lifecycle

แสดงกล่อง "สถานะเงินมัดจำ" เฉพาะเมื่อ:
- สถานะ = `returned`
- ออเดอร์มี `depositAmount > 0`
- prop `onUpdateDepositStatus` ถูกส่งมา

สถานะที่แสดง:
- `null` / `pending_return` → `⏳ รอดำเนินการ` + ปุ่ม **💸 ยืนยันคืนมัดจำ** และ **⚠️ ยึดมัดจำ** (มี confirm dialog)
- `returned` → `✅ คืนมัดจำแล้ว`
- `forfeited` → `🚫 ยึดมัดจำไว้`

#### C. Cancel Order Button

- แสดงเฉพาะ `booked` และ `overdue`
- ต้องกด confirm **2 รอบ** ก่อนดำเนินการ
- หลัง cancel → status = `cancelled`, ชุดกลับมาว่างในปฏิทินทันที (`cancelled` ไม่ถูกนับเป็น open rental)

#### D. Print Tag Button 🖨️

- ปุ่มเล็กๆ มุมขวาบนของ detail panel (ปรากฏทุกสถานะ)
- เรียก `window.print()` → CSS `@media print` ซ่อนทุกอย่าง แสดงเฉพาะ `.print-tag`
- เนื้อหาใบแท็ก:
  - ชื่อร้าน + รหัสออเดอร์
  - ชื่อลูกค้า, เบอร์, LINE
  - สัดส่วน (อก/เอว/สะโพก/สูง)
  - ชุดที่เช่า (ชื่อ + SKU + สี + ไซส์) — รองรับหลายชุดในออเดอร์เดียว
  - วันรับ → วันคืน
  - โน้ตช่างเย็บ (ถ้ามี)
  - วันที่พิมพ์

#### E. UI Additions อื่นๆ
- สถานะ `cancelled` มี badge ใหม่ (strikethrough + muted)
- Filter dropdown เพิ่มตัวเลือก "ยกเลิกแล้ว"

---

### 6. CSS / Print Styles (`index.css`)

> ⚠️ **TODO ที่ยังต้องทำ:** เพิ่ม `@media print` styles และ `.print-tag` layout ใน `index.css`

สิ่งที่ต้องเพิ่ม:

```css
/* ── Print Tag: ซ่อนทุกอย่างยกเว้น print tag ── */
@media print {
  @page {
    size: 4in 6in;
    margin: 0;
  }

  body > * { display: none !important; }

  .print-tag-wrapper {
    display: block !important;
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: #fff;
    padding: 12px;
  }

  .print-tag {
    font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
    color: #000;
    width: 4in;
    min-height: 6in;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 13px;
  }

  .print-tag-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    font-size: 16px;
  }

  .print-tag-code { font-size: 11px; color: #555; }

  .print-tag-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #777;
    margin-bottom: 2px;
  }

  .print-tag-value { font-weight: 700; font-size: 15px; }
  .print-tag-sub { font-size: 11px; color: #444; }

  .print-tag-measurements {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    background: #f5f5f5;
    border-radius: 6px;
    padding: 8px;
    text-align: center;
  }

  .print-tag-measurements span { font-size: 10px; color: #777; display: block; }
  .print-tag-measurements strong { font-size: 14px; }

  .print-tag-dates {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    background: #f0f0f0;
    border-radius: 6px;
    padding: 8px;
    text-align: center;
  }

  .print-tag-dates span { font-size: 10px; color: #777; display: block; }
  .print-tag-dates strong { font-size: 14px; }

  .print-tag-notes {
    border: 1px dashed #ccc;
    border-radius: 6px;
    padding: 8px;
  }

  .print-tag-notes-text { font-size: 13px; line-height: 1.6; }

  .print-tag-footer {
    margin-top: auto;
    font-size: 10px;
    color: #aaa;
    text-align: right;
  }

  /* ซ่อน print-tag-wrapper ในหน้าจอปกติ */
  .print-tag-wrapper { display: none; }
}
```

---

## Architecture Notes

### Calendar Conflict Check — Cancelled Orders
`findOpenRentalConflict()` ใน `rentalRules.ts` นับเฉพาะ `openRentalStatuses = ['booked', 'active', 'overdue']` ซึ่งไม่รวม `cancelled` อยู่แล้ว ✅

`handleEditRentalFields()` ใน App.tsx ก็ filter เฉพาะ `['booked', 'active', 'overdue']` ก่อนเช็ค conflict เช่นกัน ✅

Calendar View ควร filter `cancelled` ออกจากการเรนเดอร์แถบสี (**TODO ถ้ายังไม่ได้ทำ**)

### Deposit Forfeited → รายได้
ยอด `forfeited` ควรถูกนับรวมเป็นรายรับสุทธิใน Report ระยะถัดไป (ไม่ได้ทำในรอบนี้)

### Edit Modal — Active Status Override ราคา
เมื่อแก้ไขออเดอร์ `active` (ขยายวันเช่า) ระบบ **ไม่คำนวณราคาอัตโนมัติ** แอดมินต้องพิมพ์ตัวเลขค่าต่อเวลาลงในช่อง Override เอง (ตาม design decision)

---

## สิ่งที่ยังต้อง Deploy / TODO

| รายการ | สถานะ |
|---|---|
| Deploy migration `0024_order_edit_and_deposit.sql` ใน Supabase | ⏳ ยังไม่ได้ทำ |
| เพิ่ม `@media print` + `.print-tag` CSS ใน `index.css` | ⏳ ยังไม่ได้ทำ |
| Filter `cancelled` ออกจาก Calendar View render | ⏳ ควรตรวจสอบ |
| Build + push branch | ⏳ ยังไม่ได้ทำ |
