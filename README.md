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
VITE_PUBLIC_APP_URL=http://127.0.0.1:5173
VITE_GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

อย่าใส่ service role key ใน frontend หรือ Cloudflare Pages

## Google OAuth

ดูขั้นตอนสร้าง Google Cloud project, เปิด APIs และตั้งค่า OAuth client ได้ที่ `docs/google-oauth-setup.md`

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- SPA fallback อยู่ที่ `public/_redirects`

## Supabase Keepalive Cron

ถ้าต้องการมี cron ping เพื่อช่วยลดโอกาสโปรเจกต์ Free ถูก pause:

1. สร้าง token ยาว ๆ เช่น `openssl rand -hex 32`
2. ตั้ง Supabase Edge Function secret ชื่อ `KEEPALIVE_TOKEN`
3. ตั้ง GitHub repository variable ชื่อ `SUPABASE_PROJECT_URL`
4. ตั้ง GitHub repository secret ชื่อ `SUPABASE_KEEPALIVE_TOKEN`
5. deploy Edge Function `health`
6. push workflow นี้ขึ้น GitHub

```bash
supabase secrets set KEEPALIVE_TOKEN=replace-with-a-long-random-token
supabase functions deploy health --no-verify-jwt
```

ตั้งค่า `SUPABASE_PROJECT_URL` เป็นค่าแบบนี้:

```bash
https://your-project-ref.supabase.co
```

workflow จะยิง `https://<project-ref>.supabase.co/functions/v1/health` ทุก 12 ชั่วโมง และสั่งรันเองได้จาก `workflow_dispatch`
ฟังก์ชันนี้เช็ก token จาก header แล้วอ่าน `public.shops` แบบเบา ๆ ผ่าน Supabase REST เพื่อให้ ping แตะ hosted database จริง

## Verification

```bash
npm run test
npm run lint
npm run build
```
