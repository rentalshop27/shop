# Precious Shop

ระบบหลังร้านสำหรับร้านเช่าชุด Precious Shop รุ่น V1

## Features

- หน้าแดชบอร์ด คลังชุด รายชื่อลูกค้า เช่า/คืน ปฏิทิน ตั้งค่า และประวัติ Audit
- ค้นหาด้วยชื่อ เบอร์โทร รหัสลูกค้า หรือ LINE/account
- กันลูกค้าซ้ำด้วยเบอร์โทรไทย 10 หลัก
- สถานะโปรไฟล์ 4 แบบ: ข้อมูลไม่ครบ, รอตรวจ, ตรวจแล้ว, ระงับ
- เก็บสัดส่วนลูกค้า: รอบอก/เอว/สะโพกเป็นนิ้ว และส่วนสูงเป็นเซนติเมตร
- อัปโหลดรูปเอกสาร/บัตรประชาชนสูงสุด 5 รูป
- จัดการคลังชุด รูปชุด ราคาเช่า เงินประกัน และใบเช่า
- Supabase Auth, RLS, private Storage และ SQL migration
- Demo mode ทำงานได้ทันทีถ้ายังไม่ใส่ Supabase env

## Development

```bash
npm install
npm run dev
```

เปิด `http://127.0.0.1:5173/`

## Supabase

1. รัน SQL ใน `supabase/migrations/` ตามลำดับเลขไฟล์ทั้งหมดที่มีอยู่ในโฟลเดอร์
2. สร้าง owner user ใน Supabase Auth
3. สร้าง `shops` และ `shop_members` ให้ user คนนั้นเป็น owner
4. คัดลอก `.env.example` เป็น `.env.local`
5. ใส่ค่า:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

อย่าใส่ service role key ใน frontend หรือ Cloudflare Pages

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- SPA fallback อยู่ที่ `public/_redirects`

## Verification

```bash
npm run test
npm run lint
npm run build
```
