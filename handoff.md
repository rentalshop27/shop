# Handoff: เพิ่มจุดเปลี่ยนรหัสผ่านในหน้าโปรไฟล์พนักงาน

## Summary
- งานรอบนี้แก้ปัญหาที่หน้าโปรไฟล์ยังไม่มีจุดให้พนักงานหรือผู้ใช้ที่ล็อกอินอยู่เปลี่ยนรหัสผ่านเอง
- เพิ่ม flow เปลี่ยนรหัสผ่านจริงบนหน้าโปรไฟล์ โดยผูกกับ Supabase Auth session ปัจจุบัน ไม่ใช่ mock UI
- อัปเดต knowledge graph แล้วหลังแก้โค้ด

## User Intent
- ผู้ใช้แจ้งตรงๆ ว่า "ยังไม่มีจุดให้พนักงานเปลี่ยนรหัส"
- เป้าหมายคือให้มีจุดเปลี่ยนรหัสในหน้าโปรไฟล์ที่ใช้งานได้จริงทันที

## What Changed
- [src/App.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/App.tsx)
  - เพิ่ม callback `handlePasswordChange(nextPassword)` ที่เรียก `supabase.auth.updateUser({ password: nextPassword })`
  - ส่ง prop `onChangePassword` เข้า `LazyProfilePage`
- [src/features/profile/ProfilePage.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/profile/ProfilePage.tsx)
  - เพิ่ม section "เปลี่ยนรหัสผ่าน"
  - เพิ่ม input `รหัสผ่านใหม่` และ `ยืนยันรหัสผ่านใหม่`
  - เพิ่ม validation ฝั่ง UI:
    - ต้องกรอกทั้งสองช่อง
    - รหัสผ่านอย่างน้อย 6 ตัวอักษร
    - รหัสผ่านกับการยืนยันต้องตรงกัน
  - กันการกด submit ซ้ำระหว่าง request กำลังทำงาน
  - แสดง success/error feedback ให้ผู้ใช้
- [src/index.css](/Users/bhusitt./Downloads/Precious-Shop-Test/src/index.css)
  - เพิ่ม style ของ password panel
  - ปรับ mobile layout ให้ปุ่ม submit เต็มความกว้าง
- [src/features/profile/ProfilePage.test.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/profile/ProfilePage.test.tsx)
  - เพิ่มเทสต์ validation กรณียืนยันรหัสไม่ตรง
  - เพิ่มเทสต์ submit สำเร็จ
  - เพิ่มเทสต์กันการกดซ้ำระหว่าง request pending

## Verification Already Run
- `npm test -- src/features/profile/ProfilePage.test.tsx`
- `npm run typecheck`
- `npm run build`
- `graphify update .`

## Current Status
- งานเพิ่มจุดเปลี่ยนรหัสผ่านเสร็จแล้วในโค้ดและผ่านการตรวจหลักครบ
- Build ผ่าน แต่ยังมี Vite warning เดิมเรื่อง bundle หลักใหญ่กว่า 500 kB
- ยังไม่ได้ commit

## Important Context
- หน้าโปรไฟล์เดิมมีแค่ข้อมูลบัญชี, ร้านที่เข้าถึงได้, Google OAuth, และออกจากระบบ
- โปรเจกต์นี้มีการสร้างบัญชีพนักงานด้วยรหัสผ่านอยู่แล้วในส่วน staff settings ดังนั้นการเพิ่ม self-service change password ใน profile สอดคล้องกับ auth model เดิม
- หลีกเลี่ยงการสับสนกับข้อมูลอีเมลจริงของผู้ใช้: อย่าอ้างอิง PII จาก session หรือ screenshot ใน handoff ถัดไป

## Dirty Worktree Notes
- มีไฟล์ที่เกี่ยวกับงานนี้:
  - [src/App.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/App.tsx)
  - [src/features/profile/ProfilePage.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/profile/ProfilePage.tsx)
  - [src/features/profile/ProfilePage.test.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/profile/ProfilePage.test.tsx)
  - [src/index.css](/Users/bhusitt./Downloads/Precious-Shop-Test/src/index.css)
  - `graphify-out/*` ที่ถูกอัปเดตจาก `graphify update .`
- มีการเปลี่ยนแปลงอื่นใน worktree ที่ไม่ใช่งานรอบนี้อยู่แล้ว:
  - [src/features/dashboard/dashboardMetrics.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/dashboard/dashboardMetrics.ts)
  - [src/features/dashboard/dashboardMetrics.test.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/dashboard/dashboardMetrics.test.ts)
  - `supabase/.temp/cli-latest`
  - cache ใต้ `graphify-out/cache/ast/`
- ถ้าจะ commit งานนี้ ควรแยก scope ให้ดีและตรวจอีกครั้งว่าไฟล์ dashboard ที่ค้างอยู่เป็นของผู้ใช้หรือของงานอื่น

## Recommended Next Session
1. เปิดหน้าโปรไฟล์ในเบราว์เซอร์แล้วลองเปลี่ยนรหัสผ่านจริงกับบัญชีทดสอบ เพื่อยืนยัน UX และข้อความจาก Supabase ใน runtime จริง
2. ถ้าต้องการ polish ต่อ:
   - พิจารณาเพิ่มข้อบังคับรหัสผ่านที่ชัดกว่านี้
   - พิจารณาเพิ่มช่องรหัสผ่านปัจจุบัน ถ้าทีมต้องการ flow ที่เข้มขึ้น
3. ถ้างานนี้โอเคแล้ว ให้จัดการ commit โดยระวังไม่รวมไฟล์ที่ไม่เกี่ยว

## Suggested Skills
- `handoff`
  - ถ้าต้องอัปเดต handoff นี้อีกหลังมีงานต่อเนื่อง
- `scrutinize`
  - ถ้าจะ review งานเปลี่ยนรหัสผ่านต่อในมุม regression หรือ boundary ของ auth
- `browser:control-in-app-browser`
  - ถ้าจะ smoke test หน้าโปรไฟล์และ flow เปลี่ยนรหัสผ่านบน localhost หรือ preview
