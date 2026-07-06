# Handoff: Settings Page Redesign

เอกสารนี้สรุปการเปลี่ยนแปลงของแพตช์ล่าสุดที่โฟกัสเฉพาะการปรับหน้า **Settings** ให้ใช้งานง่ายขึ้นและรองรับการขยายระบบในอนาคต โดยไม่ได้เพิ่ม migration หรือเปลี่ยน business logic ของระบบเช่าในรอบนี้

---

## 🎨 1. ฟีเจอร์ใหม่: Settings Page Redesign (Vertical Tabs Architecture)
ปรับปรุงหน้าต่างการตั้งค่า (Settings) ให้ใช้รูปแบบโครงสร้าง **Vertical Tabs** (เมนูซ้าย / เนื้อหาขวา) เพื่อรองรับการขยายตัวของระบบตั้งค่าในอนาคต เช่น การจัดการสิทธิ์พนักงาน

### โครงสร้าง UI/UX และ Accessibility
- **Responsive Layout**: หน้าจอแบ่งสัดส่วน `280px` : `1fr` โดยใช้ Grid Layout (ในไฟล์ `src/index.css`) สำหรับหน้าจอเล็ก (< 900px) เมนูด้านซ้ายจะเปลี่ยนเป็น Horizontal Scroll ด้านบนโดยอัตโนมัติ
- **State Management ป้องกัน Draft หาย**: ออกแบบโดยเก็บ Form State ทั้งหมดไว้ที่ตัวแม่ (`SettingsPage.tsx`) เพื่อให้การสลับแท็บไปมาระหว่าง "ตั้งค่าทั่วไป" และ "ตัวเลือกสินค้า" ไม่ทำให้ข้อความที่พิมพ์ค้างไว้สูญหาย
- **Accessibility (a11y)**: ใช้ `role="tab"`, `role="tablist"`, `aria-controls`, และ `aria-selected` เฉพาะแท็บที่กดใช้งานได้จริง ส่วน "สิทธิ์พนักงาน" แสดงเป็นปุ่ม disabled แยกต่างหากเพื่อไม่ให้ screen reader เข้าใจว่าเป็น panel ที่เปิดได้แล้ว
- **Staff Entry (Coming Soon)**: เตรียมตำแหน่งของเมนู "สิทธิ์พนักงาน" ไว้พร้อมป้าย Badge "เร็ว ๆ นี้" เพื่อบอกทิศทางของฟีเจอร์ถัดไปโดยไม่หลอกว่าเปิดใช้งานได้แล้ว

---

## 🌟 2. สิ่งที่หน้า Settings นี้ยังเชื่อมกับของเดิมในระบบ
แพตช์นี้ไม่ได้เปลี่ยน schema หรือ business rule ของฟีเจอร์ด้านล่าง แต่หน้า Settings ใหม่ยังคงแสดงและเรียกใช้งานข้อมูลเดิมผ่าน flow เดิมของแอป

- **Global Rental Defaults**: ค่ามาตรฐานเรื่องราคาเช่า มัดจำ และค่าปรับรายวันยังบันทึกผ่าน `ShopSettings` และ `updateShopSettings()` ตามเดิม
- **Public Catalog Toggle**: สวิตช์เปิด/ปิด public catalog ยังใช้ callback เดิมและไม่ได้เปลี่ยน contract
- **Inventory Option Lists**: การเพิ่ม/ลบแบรนด์ ประเภทชุด และสีหลักยังวิ่งผ่าน save path เดิมจาก `App.tsx` ไปยัง `stockRemote.ts`

---

## 🚀 ถัดไป (Next Steps & Actions Required)
- [ ] ทดสอบ UI ในหน้า Settings (Desktop / Mobile) หลังจากปรับโครงสร้างใหม่เป็น Vertical Tabs เพื่อตรวจสอบความถูกต้องของการสลับ Panel
- [ ] ทดสอบว่าการแก้ค่า default rental, public catalog และ inventory options ยังบันทึกได้ครบผ่าน save path เดิม
- [ ] หากจะ deploy ไป environment ใหม่หรือฐานข้อมูลที่ยังไม่เคยตามฟีเจอร์เก่า ให้ตรวจสอบแยกอีกครั้งว่า migration ก่อนหน้านี้ของ `default_rental_prices`, `default_deposit`, `default_late_fine_per_day` และระบบ fine/deposit ถูก apply แล้ว
- [ ] (Phase ถัดไป) เตรียมเริ่มพัฒนาหน้าและระบบจัดการ **สิทธิ์พนักงาน (Staff Management)** ตามโครงสร้างที่วางไว้ใน Settings Page
