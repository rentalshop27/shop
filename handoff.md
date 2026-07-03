# Handoff Report: Rental Tier Pricing Redesign

## สรุปภาพรวม (Overview)
การอัปเดตระบบในรอบนี้คือการเปลี่ยนผ่านจากระบบเช่าที่ใช้ **ราคาต่อวันแบบตายตัว (Fixed Daily Price)** ไปสู่ระบบ **แพ็กเกจระยะเวลาเช่า (Rental Tier Packages)** เพื่อรองรับการตั้งราคาเหมาจ่ายตามจำนวนวันที่เช่า (เช่น 3 วัน 1,000 บาท, 7 วัน 2,500 บาท) ซึ่งได้ปรับปรุงครอบคลุมตั้งแต่ระดับฐานข้อมูล ไปจนถึงหน้า UI จัดการคลังสินค้าและหน้าสร้างออเดอร์เช่า

## รายละเอียดสิ่งที่ทำเสร็จแล้ว (Completed Work)

### 1. Database & Migrations
- **สร้าง Migration `0021_rental_tiers.sql`**: เปลี่ยนฟิลด์ `rental_price_per_day` แบบเดิม ให้กลายเป็นคอลัมน์ `rental_tiers` แบบ **JSONB** ในตาราง `products` เพื่อเก็บ Array ของออบเจกต์ (เช่น `[{"days": 1, "price": 1000}]`)
- เพิ่ม Check Constraint เพื่อการันตีว่าข้อมูลใน `rental_tiers` จะต้องเป็นรูปแบบ Array เสมอ เพื่อความสมบูรณ์ของข้อมูล (Data Integrity)

### 2. TypeScript Types & Core Rules
- **อัปเดต `InventoryTypes.ts`**: แก้ไขโครงสร้าง Type ของ `Product`, `ProductDraft` และ `FlatStockItem` ให้ใช้ `rentalTiers: RentalTier[]` แทนของเดิม
- **สร้าง `rentalRules.ts`**: รวบรวม Business Logic หลักสำหรับระบบเช่า ได้แก่
  - `resolveRentalPrice(tiers, days)`: ดึงราคาที่เหมาะสมตามระยะเวลาที่เช่า
  - `calculateReturnDate(pickup, days)`: คำนวณวันคืนสินค้าโดยอ้างอิงเที่ยงวัน (T12:00:00 UTC) เพื่อป้องกันปัญหา Timezone ทำให้วันที่คลาดเคลื่อน

### 3. API & Controller
- **อัปเดต `stockRemote.ts`**: ปรับแต่ง Data Mapping ขาไปและขากลับจาก Supabase ให้รองรับการอ่าน/เขียน JSONB `rental_tiers`
- ทำการลบฟิลด์ราคาและค่ามัดจำออกจากตอน INSERT ตาราง `stock_items` ภายใน RPC `create_product_with_variants` ให้สอดคล้องกับโครงสร้างใหม่ (ที่เคยลบฟิลด์พวกนี้ออกไปใน Migration เก่า)
- **อัปเดต `useInventoryController.ts`**: ดัดแปลง Data Flow ใน State ของ Draft เพื่อรองรับฟอร์มใหม่

### 4. User Interface (UI Redesign)
- **Inventory Form (`InventoryPage.tsx`)**:
  - เปลี่ยนช่องกรอกราคาเช่าต่อวัน เป็น **Dynamic Tier Builder** (ฟอร์มแบบเพิ่ม/ลบ แถวจำนวนวันและราคาได้)
  - ปรับการแสดงผลหน้าการ์ดและตารางสินค้าให้แสดงช่วงราคาแบบ `ต่ำสุด – สูงสุด`
- **Rental Order Form (`RentalsPage.tsx`)**:
  - สร้างปุ่ม **Package Choice Chips** ให้พนักงานกดเลือกแพ็กเกจแทนการกรอกวันคืนแบบ manual
  - เชื่อมระบบ **Reverse Reactive Logic**: เมื่อกดเลือกแพ็กเกจ (เช่น 3 วัน) ระบบจะคำนวณและเติมวันที่คืนชุดอัตโนมัติ
  - เพิ่ม **Custom Mode Fallback**: หากเลือกหลายชุดที่แพ็กเกจวันเช่าไม่ตรงกัน ระบบจะสลับไปที่โหมด Custom ให้พนักงานเลือกวันและระบุราคาด้วยตนเอง 
  - จัด Layout สรุปการเงินใหม่ แยก Base Price (จากแพ็กเกจ) กับ Override Price ออกจากกัน

### 5. Catalog & Customer View
- **Customer Catalog (`CustomerCatalogPage.tsx`)**:
  - ปรับ Logic การเรียงลำดับ (Sort by Price) ให้หาค่าจากราคาแพ็กเกจที่ต่ำที่สุดมาใช้ 
  - อัปเดต UI ให้แสดงช่วงราคาสินค้า (`formatTierRange`) เหมือนหน้าระบบจัดการ

### 6. Testing & Graphify
- ไล่ปรับแก้ Mock Data ใน Test Files ทั้งหมดให้ตรงกับ Type ใหม่ ทำให้ `npm run build` และ `npm test` **ผ่านครบ 100%**
- รันคำสั่ง `graphify update .` เพื่ออัปเดตระบบกราฟให้สัมพันธ์กับโค้ดล่าสุดเรียบร้อย
- ทำการ Commit และ Push ไปที่ Branch `codex/test-sandbox` สำเร็จ

## สิ่งที่สามารถทำต่อได้ในอนาคต (Next Steps)
- การนำข้อมูล `rental_tiers` ไปคำนวณส่วนลดเพิ่มเติมแบบขั้นบันได
- การผูกแพ็กเกจเข้ากับระบบ Customer Portal เพื่อให้ลูกค้าเลือกกดเช่าได้สะดวกขึ้น
- ตรวจสอบระบบ Analytics ว่าควรเก็บ Log ค่าเช่าแยกตามแต่ละ Tier ไหม เพื่อดูสถิติแพ็กเกจยอดฮิต
