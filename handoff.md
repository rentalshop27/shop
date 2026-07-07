# Handoff: ย้าย `products.category` จาก `text` เป็น `text[]` และ sync contract ทั้ง stack

## Summary
- งานรอบล่าสุดเปลี่ยน schema ของ `public.products.category` จากข้อความเดี่ยวเป็น `text[]` เพื่อให้การเลือกหลายหมวดหมู่ถูกเก็บเป็น array ตั้งแต่ในฐานข้อมูล
- มี migration ใหม่ [supabase/migrations/0035_product_category_array.sql](/Users/bhusitt./Downloads/Precious-Shop-Test/supabase/migrations/0035_product_category_array.sql) และ migration นี้ถูก push เข้า linked Supabase project แล้ว
- ฝั่งแอปยังคงแสดงหมวดหมู่เป็นข้อความสำหรับ UI เดิม แต่ remote boundary จะ parse/format ให้เองเพื่อให้ source of truth ใน DB เป็น array จริง

## User Intent
- ผู้ใช้ต้องการให้โครงสร้างข้อมูลหมวดหมู่หลายค่า “เป็นระเบียบตั้งแต่ในบ้าน”
- เป้าหมายไม่ใช่แค่แก้ dropdown filter แต่ต้องแก้ที่ต้นทางใน Supabase ให้รองรับหลายหมวดหมู่แบบ native

## What Changed
- Database / RPC
  - เพิ่ม migration [0035_product_category_array.sql](/Users/bhusitt./Downloads/Precious-Shop-Test/supabase/migrations/0035_product_category_array.sql)
  - migration นี้:
    - สร้าง helper SQL `public.normalize_product_categories(jsonb)`
    - แปลงข้อมูลเก่าแบบ comma-separated ให้เป็น `text[]`
    - เปลี่ยน `public.products.category` เป็น `text[]`
    - re-create `public.create_product_with_variants(...)` ให้รับ category เป็น array
  - migration history ของ remote ตอนนี้ขึ้นถึง `0035` แล้ว
- Frontend / remote boundary
  - เพิ่ม helper [src/lib/productCategories.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/src/lib/productCategories.ts)
  - อัปเดต [src/features/inventory/stockRemote.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/inventory/stockRemote.ts) ให้:
    - parse `draft.category` เป็น array ก่อน create/update
    - format `row.category` กลับเป็นข้อความตอนโหลดมาใช้ใน UI
  - อัปเดต [src/App.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/App.tsx) ให้ flat stock / catalog props ส่ง category ในรูปแบบข้อความที่ UI เดิมใช้ต่อได้
  - อัปเดต [src/features/catalog/CustomerCatalogPage.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/catalog/CustomerCatalogPage.tsx) และ [src/features/inventory/InventoryPage.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/inventory/InventoryPage.tsx) ให้ใช้ parser กลางเดียวกัน
  - อัปเดต edge function [supabase/functions/public-catalog/index.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/supabase/functions/public-catalog/index.ts) ให้รองรับ `category` ที่มาจาก DB เป็น array
- Tests
  - อัปเดต [src/features/inventory/stockRemote.test.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/inventory/stockRemote.test.ts) ให้ mock row.category เป็น array ในจุดที่เกี่ยวข้อง
  - regression test ของ public catalog split/filter ยังอยู่ที่ [src/features/catalog/CustomerCatalogPage.test.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/catalog/CustomerCatalogPage.test.tsx)

## Verification Already Run
- `npm run test -- src/features/inventory/stockRemote.test.ts src/features/catalog/CustomerCatalogPage.test.tsx`
- `npm run typecheck`
- `git diff --check`
- `graphify update .`
- `npx supabase migration list --linked`
- `npx supabase db push --linked --dry-run`
- `npx supabase db push --linked --yes`

## Current Status
- Schema จริงใน Supabase ถูกเปลี่ยนเป็น `text[]` แล้ว
- แอปฝั่ง inventory/public catalog ที่แตะในรอบนี้ถูก sync ให้ทำงานกับ schema ใหม่แล้ว
- ยังไม่ได้ commit

## Important Context
- linked project ref คือ `uelsyazppnwszxrmbpfw`
- งานรอบก่อนหน้าแก้ public catalog filter ให้ split ค่า comma-separated ที่ UI; รอบนี้ย้ายต้นเหตุไปแก้ที่ schema จริงแล้ว
- ตอนนี้ยังมีหลายส่วนใน repo ที่ “อ่าน category เป็น string เพื่อแสดงผล/รายงาน” อยู่ ซึ่งยังทำงานได้เพราะมี formatting boundary แล้ว แต่ agent ถัดไปควรตัดสินใจว่าต้องยกระดับ type model ให้เป็น array end-to-end หรือจะคง pattern “DB array, UI string” ต่อไป

## Open Follow-up Work
1. ตรวจ flow runtime จริงในหน้า inventory:
   - สร้าง/แก้ไขชุดที่เลือกหลายหมวดหมู่
   - refresh หน้าแล้วดูว่าค่าเดิมยังกลับมาแสดงถูก
2. ตรวจ public catalog runtime จริง:
   - สินค้าที่มีหลายหมวดหมู่ต้องยัง filter ได้ทีละหมวด
   - modal/detail ต้องไม่แสดงค่าซ้ำหรือ comma แปลก
3. ตัดสินใจเรื่อง type contract ระยะถัดไป:
   - ตอนนี้ `Product.category` ใน TypeScript หลายจุดยังเป็น `string`
   - ถ้าจะ harden เพิ่ม อาจต้องเปลี่ยน `inventoryTypes.ts`, reports/export helpers, และ test fixtures ให้รองรับ model array ชัดเจนขึ้น
4. ตรวจ surfaces ที่ยังแตะ category ทางอ้อมแต่ยังไม่ได้ refactor ในรอบนี้:
   - [src/features/reports/ReportsPage.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/reports/ReportsPage.tsx)
   - [src/features/reports/reportsMetrics.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/reports/reportsMetrics.ts)
   - [src/utils/exportUtils.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/src/utils/exportUtils.ts)
   - [supabase/functions/google-sheets-report-sync/index.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/supabase/functions/google-sheets-report-sync/index.ts)
   - [supabase/functions/google-sheets-report-sync/reportSheets.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/supabase/functions/google-sheets-report-sync/reportSheets.ts)

## Dirty Worktree Notes
- ไฟล์ที่เกี่ยวกับงานรอบนี้:
  - [src/lib/productCategories.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/src/lib/productCategories.ts)
  - [src/App.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/App.tsx)
  - [src/features/inventory/stockRemote.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/inventory/stockRemote.ts)
  - [src/features/inventory/stockRemote.test.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/inventory/stockRemote.test.ts)
  - [src/features/inventory/InventoryPage.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/inventory/InventoryPage.tsx)
  - [src/features/catalog/CustomerCatalogPage.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/catalog/CustomerCatalogPage.tsx)
  - [src/features/catalog/CustomerCatalogPage.test.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/catalog/CustomerCatalogPage.test.tsx)
  - [supabase/functions/public-catalog/index.ts](/Users/bhusitt./Downloads/Precious-Shop-Test/supabase/functions/public-catalog/index.ts)
  - [supabase/migrations/0035_product_category_array.sql](/Users/bhusitt./Downloads/Precious-Shop-Test/supabase/migrations/0035_product_category_array.sql)
- มีไฟล์ค้างจากงานอื่นที่ผมไม่ได้สรุปว่าเสร็จหรือพร้อม commit:
  - [src/features/profile/ProfilePage.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/profile/ProfilePage.tsx)
  - `graphify-out/*`
  - `graphify-out/cache/ast/*`
- มีการแก้ migration เก่าใน worktree ด้วย:
  - [supabase/migrations/0017_parent_child_inventory.sql](/Users/bhusitt./Downloads/Precious-Shop-Test/supabase/migrations/0017_parent_child_inventory.sql)
  - [supabase/migrations/0021_rental_tiers.sql](/Users/bhusitt./Downloads/Precious-Shop-Test/supabase/migrations/0021_rental_tiers.sql)
  - [supabase/migrations/0033_shop_member_roles_and_permissions.sql](/Users/bhusitt./Downloads/Precious-Shop-Test/supabase/migrations/0033_shop_member_roles_and_permissions.sql)
  - เหล่านี้เป็นการ sync local source ให้สอดคล้องกับ contract ใหม่ แต่ remote ใช้งานจริงผ่าน `0035` ไปแล้ว

## Recommended Next Session
1. เปิดแอปแล้ว smoke test inventory create/edit + public catalog ด้วยสินค้าที่มีหลายหมวดหมู่จริง
2. ถ้าผล runtime ผ่าน ให้จัดระเบียบ diff ก่อน commit:
   - แยกไฟล์ profile ออกจากงานนี้ถ้าไม่เกี่ยว
   - ตัดสินใจว่าจะเก็บการแก้ migration เก่าไว้ด้วยหรือไม่
3. ถ้าจะ harden ต่อ ให้ไล่ category contract ใน reports/export/Google Sheets sync ที่ยังเป็น string-centric

## Suggested Skills
- `handoff`
  - ถ้าจะอัปเดต handoff นี้อีกหลัง smoke test หรือหลังแยก diff
- `scrutinize`
  - ถ้าจะ review ว่าการเปลี่ยนจาก `text` เป็น `text[]` ยังมี contract drift ค้างใน reports/export/functions หรือไม่
- `browser:control-in-app-browser`
  - ถ้าจะทดสอบ flow สร้างสินค้า/แก้สินค้าและ public catalog จริงบน localhost หรือ preview
