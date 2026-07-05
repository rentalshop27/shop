# Handoff: ระบบ Auto-Pass สรุปเคสไร้มัดจำ และ Extra Fine Workflow

เอกสารนี้สรุปสิ่งที่ได้พัฒนาและปรับปรุงในระบบเกี่ยวกับการจัดการเงินมัดจำ (Deposit) และการปรับยอดเรียกเก็บค่าปรับย้อนหลัง (Extra Fine) ในโปรเจกต์ **Precious Shop**

---

## 📂 1. Database & Schema
- **สร้าง Migration:** เพิ่มไฟล์ `0028_add_fine_to_rentals.sql` 
  - เพิ่มคอลัมน์ `fine_amount` (numeric), `fine_reason` (text), `fine_created_at` (timestamptz) เข้าไปในตาราง `rentals`
  
- **ปรับปรุง Types:** อัปเดต `RentalOrder` และ `RentalItem` ในไฟล์ `src/features/rentals/rentalTypes.ts` ให้รองรับฟิลด์ `fineAmount`, `fineReason`, `fineCreatedAt`

## 📡 2. Data Access Layer (Remote)
- **อัปเดต Mapping:** ใน `src/features/rentals/rentalRemote.ts` ทำการ map ค่าจากแถวในฐานข้อมูล (`fine_amount` ฯลฯ) กลับไปเป็น Object ใน Frontend
- **ฟังก์ชัน `saveExtraFine`:** เพิ่มฟังก์ชันสำหรับอัปเดตยอดค่าปรับและเหตุผลลงใน Supabase โดยลักษณะการบันทึกจะเป็นแบบ **Idempotent** (Overwrite ค่าเก่าด้วยค่าใหม่เสมอ)

## 🖥️ 3. Application State & Business Logic
- **`App.tsx`**: 
  - เพิ่ม logic ใน `handleUpdateRentalStatus` สำหรับ **Auto-Pass มัดจำ**: หากแอดมินปรับสถานะออเดอร์เป็น `returned` ระบบจะสแกนหา `rentals` ภายในออเดอร์นั้นที่มียอดมัดจำเท่ากับ `0` (ไม่มีมัดจำ) และทำการส่ง request แจ้งเคลียร์มัดจำเป็น `returned` (คืนมัดจำแล้ว) ทันที
  - เพิ่ม `handleSaveExtraFine` สำหรับอัปเดตค่าปรับผ่าน UI กลับไปยัง API และ State ของ React

- **`dashboardMetrics.ts`**:
  - สร้างตัวแปรยอดรวมค่าปรับ `totalFines` โดยดึงค่าผลรวมของ `fineAmount` จากออเดอร์ทั้งหมด
  - นำยอด `totalFines` ไปบวกเข้ากับ `netRevenue` (รายรับสุทธิ) ของร้านค้าเพื่อการคำนวณที่ถูกต้อง

- **`customerInsights.ts` (พฤติกรรมลูกค้า)**:
  - เพิ่มเงื่อนไขการหักดาว: หากลูกค้าเคยมียอดค่าปรับย้อนหลัง (`fineAmount > 0`) ระบบจะหักลบ **2.0 ดาว แบบ Flat Rate** ในฟังก์ชันคำนวณ Credit Score ($F_{penalty}$)
  - บวกยอด `fineAmount` เข้าไปรวมใน `totalSpent` (ยอดใช้จ่ายรวมของลูกค้า)

## 🎨 4. User Interface (UI / UX)
- **Dashboard (`DashboardPage.tsx`)**:
  - ปรับปรุง Financial Widget โดยแบ่งคอลัมน์เพิ่ม เพื่อแสดงป้าย **"รายได้อื่นๆ / ค่าปรับประจำเดือน"** ทำให้ร้านค้าสามารถแทร็กรายได้ส่วนนี้แยกต่างหากได้อย่างชัดเจน

- **หน้า Rentals (`RentalsPage.tsx`)**:
  - **ไทม์ไลน์ขั้นที่ 4**: อัปเดตเงื่อนไขให้รองรับกรณี `depositAmount === 0` โดยถ้าปิดงานแล้วจะขึ้นชื่อสถานะว่า **"● ปิดงานสำเร็จ (ไม่มีมัดจำ)"** โดยอัตโนมัติ
  - **แจ้งเตือนค่าปรับ**: หากออเดอร์ไหนมีค่าปรับย้อนหลัง จะมี Footnote ตัวอักษรสีส้มโผล่ขึ้นมาใต้ไทม์ไลน์ระบุว่า *(⚠️ มีค่าปรับเพิ่มเติม ฿X - [เหตุผล])*
  - **Deposit Control Panel (แผงควบคุมมัดจำ)**: 
    - ปรับเงื่อนไขการเรนเดอร์ให้แสดงแผงนี้เสมอ แม้ว่ายอดมัดจำจะเป็น 0 เพื่อให้เห็นป้ายสถานะปิดงานสำเร็จ
    - กรณีปกติที่ไม่มีค่าปรับ ป้ายจะเขียนว่า "✅ ปิดงานสำเร็จ (ไม่มีมัดจำ)"
    - กรณีที่มีค่าปรับ ป้ายจะเปลี่ยนเป็นกล่องสีส้มแจ้งเตือนภัย "🚫 ปิดงาน (มีค่าปรับ ฿...)"
    - เพิ่มปุ่มรอง (Secondary Button) **"⚠️ เปิดเคสเรียกเก็บค่าปรับเพิ่มย้อนหลัง"** เป็นปุ่มเส้นขอบ/สีส้ม 
  - **Extra Fine Modal**: เมื่อกดปุ่ม Secondary จะแสดงแบบฟอร์มให้กรอกยอดเงินปรับ และเหตุผลเพิ่มเติม และปุ่ม Save ซึ่งการกด Save ซ้ำจะเป็นการแก้ยอดเก่า (Idempotent update)

---

## 🚀 ถัดไป (Next Steps & Actions Required)
- [ ] รันคำสั่ง `supabase migration up` บน Database ของจริงเพื่อ Apply คอลัมน์ `fine_amount`
- [ ] ทดสอบสร้างออเดอร์ไม่มีมัดจำ และคืนออเดอร์ เพื่อดูพฤติกรรม Auto-Pass
- [ ] ทดสอบแก้ไขค่าปรับย้อนหลังในออเดอร์ที่ปิดไปแล้ว และตรวจสอบผลกระทบใน Dashboard / Customer Profile
