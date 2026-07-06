# Handoff: ระบบเพิ่มและจัดการพนักงาน (Staff Management)

## Summary
- รอบการทำงานนี้ได้ทำการพัฒนาระบบจัดการสิทธิ์พนักงาน (Staff Management) ขึ้นมาใหม่ทั้งหมด เพื่อให้เจ้าของร้านสามารถเชิญและจัดการพนักงานได้จากหน้าต่าง "ตั้งค่าระบบ" (Settings)
- ระบบถูกออกแบบมาให้เจ้าของร้านสามารถสร้างบัญชีให้พนักงานได้ด้วยอีเมลและรหัสผ่านชั่วคราว โดยพนักงานไม่ต้องสมัครเอง
- มีการใช้ Supabase Edge Function และ Service Role Key พร้อมการตรวจสอบ JWT อย่างเคร่งครัด เพื่อความปลอดภัยสูงสุดในการสร้างบัญชี

## User Intent
- ต้องการเปลี่ยนจากข้อความ Placeholder (กำลังพัฒนาสำหรับเฟสถัดไป) เป็นระบบที่สามารถใช้งานได้จริง
- เน้นความปลอดภัยเป็นหลัก โดยให้เจ้าของร้าน (Owner) เป็นคนสร้างบัญชีพนักงานเท่านั้น และมีการป้องกันปัญหา Orphaned Auth Users (บัญชีผีดิบ) หากการบันทึกสิทธิ์ผิดพลาด
- ต้องการ UI/UX ที่สะดวกต่อเจ้าของร้านในการส่งมอบบัญชีให้พนักงาน เช่น มี Popup สรุปข้อมูลที่สามารถกดคัดลอก (Copy) ไปส่งทางไลน์ได้ทันที

## What Changed

### 1. ระบบ Backend และความปลอดภัย (Edge Function & Migrations)
- **[NEW]** สร้าง Edge Function `create-shop-member` 
  - ยืนยันตัวตนด้วย JWT ของผู้ส่ง Request เพื่อตรวจสอบว่าเป็น Owner ของร้านนั้นจริงๆ ก่อนเรียกใช้สิทธิ์ลัด (Service Role Key)
  - ครอบคำสั่ง Insert ข้อมูลลง `shop_members` ด้วย `try/catch` หากไม่สำเร็จจะสั่ง `admin.deleteUser` ทันทีเพื่อล้างบัญชีผีดิบ
- **[NEW]** ไฟล์ Migration `0034_manage_shop_members.sql`
  - เพิ่ม RPC `get_shop_members` สำหรับ Join ข้อมูลจาก `auth.users` เพื่อดึงอีเมลมาแสดงผล
  - เพิ่ม RPC `remove_shop_member` สำหรับลบสิทธิ์พนักงาน (ป้องกันการลบ Owner คนสุดท้าย)

### 2. Application Logic Layer
- **[NEW]** ไฟล์ `src/features/settings/shopMembersRemote.ts`
  - เพิ่ม Service สำหรับติดต่อกับ Backend ทั้ง RPC และ Edge Function (`createShopMember`, `getShopMembers`, `removeShopMember`)

### 3. ปรับปรุงหน้า UI ตั้งค่า (`src/features/settings/SettingsPage.tsx` & `App.tsx`)
- **[MODIFY]** ลบ `StaffPermissionsPlaceholder` และแทนที่ด้วย `StaffSettingsTab`
- **[MODIFY]** เพิ่มฟอร์มรับอีเมล รหัสผ่านชั่วคราว และเลือกระดับสิทธิ์ (Staff / Manager)
- **[MODIFY]** เพิ่มหน้าต่าง Alert สรุปผลหลังสร้างบัญชีสำเร็จ พร้อมปุ่ม **"คัดลอกข้อความเพื่อส่ง"** ที่จัดรูปแบบเนื้อหา (ลิงก์, อีเมล, รหัสผ่าน) ไว้ให้เรียบร้อย
- **[MODIFY]** เพิ่มรายการแสดงรายชื่อพนักงานทั้งหมดในร้าน พร้อมปุ่มลบพนักงาน

## Verification Already Run
- ทดสอบ Edge Function Logic และความครอบคลุมของ `try/catch` เรียบร้อย
- ตรวจสอบ Component UI, Loading State และการดักจับข้อผิดพลาดเรียบร้อย

## Recommended Next Session
1. **Apply Migration และ Deploy Edge Function:** ในเซิร์ฟเวอร์จริง หรือระบบ Local ของคุณด้วยคำสั่ง:
   ```bash
   supabase migration up
   supabase functions deploy create-shop-member
   ```
2. **ทดสอบใช้งานจริง:** ลองสร้างพนักงานใหม่ผ่านหน้า UI จากนั้นนำอีเมลและรหัสผ่านชั่วคราวไปทดลองล็อกอินเข้าระบบ เพื่อตรวจสอบสิทธิ์การเข้าถึงเมนูและข้อมูลต่างๆ
3. **ตรวจสอบ Repository:** รันคำสั่ง `graphify update .` เพื่ออัปเดตเอกสารโครงสร้าง และทำการ Commit การเปลี่ยนแปลงขึ้น Git
