# Handoff: สรุปฟีเจอร์ล่าสุด (Global Rental Defaults, Auto-Pass และ Extra Fine)

เอกสารนี้สรุปสิ่งที่ได้พัฒนาและปรับปรุงในระบบโปรเจกต์ **Precious Shop** ในรอบการพัฒนาล่าสุด โดยครอบคลุมระบบการจัดการเงินมัดจำ, ค่าปรับย้อนหลัง และการตั้งค่าเริ่มต้นส่วนกลางสำหรับคลังสินค้า

---

## 🌟 1. ฟีเจอร์ใหม่: ตั้งค่าระบบราคาและค่าปรับเริ่มต้นส่วนกลาง (Global Rental Defaults)
ช่วยให้ร้านค้าสามารถตั้งค่าแพ็กเกจราคาเช่า เงินประกัน และค่าปรับล่าช้าเป็นค่าเริ่มต้น เพื่อความสะดวกรวดเร็วในการเพิ่มคลังสินค้า

### Database & Schema
- **สร้าง Migration `0031_global_rental_defaults.sql`**: เพิ่มคอลัมน์ `default_rental_prices` (JSONB), `default_deposit` (numeric), `default_late_fine_per_day` (numeric) ในตาราง `shops`

### Application State & Data Access
- **`stockRemote.ts`**: ขยาย Type `ShopSettings` ให้รองรับฟิลด์ใหม่ และจัดการ Null-Safety/Fallback กรณีฐานข้อมูลเป็นค่าว่าง (ให้ใช้ 1 วัน 100 บาท, ประกัน 0, ค่าปรับ 200)
- **`App.tsx`**: ดึงค่า Global Defaults มาเก็บใน State (`defaultRentalPrices`, `defaultDeposit`, `defaultLateFinePerDay`) และส่ง Props ต่อไปยัง `SettingsPage` และ `useInventoryController`

### User Interface (UI / UX)
- **หน้าตั้งค่า (`SettingsPage.tsx`)**: เพิ่มกล่อง **"⚙️ ตั้งค่าระบบราคาและค่าปรับเริ่มต้น"** สำหรับแก้ไขแพ็กเกจราคาเริ่มต้นของร้าน
- **หน้าคลังสินค้า (`InventoryPage.tsx` & `useInventoryController.ts`)**:
  - **Auto Pre-fill**: ดึงค่า Global Defaults ไปกรอกรอไว้ล่วงหน้าเมื่อกด `+ เพิ่มชุดหลัก`
  - **Apply Defaults Button**: เพิ่มปุ่มวิเศษ `✨ 🔄 ดึงราคามาตรฐาน` ข้างกล่องราคาเพื่อดึงค่าส่วนกลางกลับมา
  - **Safe Edit Mode**: หากกดปุ่มวิเศษขณะแก้ไขชุดเก่า ระบบจะขึ้นหน้าต่างยืนยัน (Confirmation) เพื่อป้องกันราคาพรีเมียมเดิมถูกเขียนทับ

---

## 💰 2. ระบบ Auto-Pass สรุปเคสไร้มัดจำ และ Extra Fine Workflow
ปรับปรุงการจัดการมัดจำและการเรียกเก็บค่าปรับย้อนหลังแบบเจาะลึก

### Database & Schema
- **สร้าง Migration `0028_add_fine_to_rentals.sql`**: เพิ่มคอลัมน์ `fine_amount`, `fine_reason`, `fine_created_at` ลงในตาราง `rentals`
- ปรับปรุง `RentalOrder` และ `RentalItem` ใน `rentalTypes.ts`

### Data Access Layer (Remote)
- แมปค่าจากแถวในฐานข้อมูล กลับมาเป็น Object ใน `rentalRemote.ts`
- เพิ่มฟังก์ชัน `saveExtraFine` สำหรับอัปเดตยอดค่าปรับแบบ Idempotent (เขียนทับค่าใหม่เสมอ)

### Application State & Business Logic
- **`App.tsx` (Auto-Pass มัดจำ)**: หากปิดออเดอร์ (`returned`) และไม่มีมัดจำ (มัดจำ = 0) ระบบจะปรับสถานะเคลียร์มัดจำเป็น `returned` โดยอัตโนมัติ
- **`dashboardMetrics.ts`**: รวม `totalFines` เข้ากับ `netRevenue` (รายรับสุทธิ)
- **`customerInsights.ts` (พฤติกรรมลูกค้า)**: ลูกค้าที่มีค่าปรับย้อนหลังจะถูกหัก 2.0 ดาวแบบ Flat Rate และบวกยอดค่าปรับเข้า `totalSpent`

### User Interface (UI / UX)
- **Dashboard (`DashboardPage.tsx`)**: เพิ่มป้าย "รายได้อื่นๆ / ค่าปรับประจำเดือน"
- **หน้า Rentals (`RentalsPage.tsx`)**:
  - **ไทม์ไลน์ขั้นที่ 4**: อัปเดตสถานะเป็น "● ปิดงานสำเร็จ (ไม่มีมัดจำ)" กรณีมัดจำ 0
  - **แจ้งเตือนค่าปรับ**: แสดงข้อความสีส้มใต้ไทม์ไลน์ และในแผงควบคุมมัดจำหากออเดอร์มีค่าปรับ
  - **Deposit Control Panel**: สามารถกดปุ่ม **"⚠️ เปิดเคสเรียกเก็บค่าปรับเพิ่มย้อนหลัง"** (Extra Fine Modal) เพื่ออัปเดตยอดค่าปรับและเหตุผลได้

---

## 🚀 ถัดไป (Next Steps & Actions Required)
- [ ] รันคำสั่ง `supabase migration up` หรือ `supabase db push` บน Database ของจริงเพื่อ Apply คอลัมน์ใหม่จาก Migration `0028` และ `0031`
- [ ] ตรวจสอบความถูกต้องของการตั้งค่าในหน้า Settings หลังจากรัน Migration แล้ว (ว่า Default Fallback ทำงานถูกต้องหรือไม่)
- [ ] ทดสอบสร้างออเดอร์ไร้มัดจำ เพื่อดูพฤติกรรม Auto-Pass
- [ ] ทดสอบแก้ไขค่าปรับย้อนหลังในออเดอร์ที่ปิดไปแล้ว และตรวจสอบผลกระทบในหน้า Dashboard / Customer Profile
