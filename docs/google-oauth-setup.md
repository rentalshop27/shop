# Google OAuth Setup

ใช้เอกสารนี้ตอนสร้าง Google OAuth app สำหรับเชื่อม Google Sheets ต่อร้าน และใช้ Google Drive สำหรับเก็บรูป/เอกสารลูกค้า

## 1. สร้าง Google Cloud Project

1. เปิด Google Cloud Console
2. สร้าง project ใหม่สำหรับ Precious Shop
3. เปิดใช้งาน `Google Sheets API`
4. เปิดใช้งาน `Google Drive API`

## 2. ตั้งค่า OAuth consent screen

1. ไปที่ `APIs & Services` > `OAuth consent screen`
2. เลือกประเภทแอปตามบัญชีที่ใช้
3. ใส่ชื่อแอปและอีเมล support
4. เพิ่ม scope ที่ต้องใช้:
   - `.../auth/spreadsheets`
   - `.../auth/drive.file`
   - `.../auth/userinfo.email`

## 3. สร้าง OAuth client

1. ไปที่ `APIs & Services` > `Credentials`
2. กด `Create credentials` > `OAuth client ID`
3. เลือก `Web application`
4. ใส่ `Authorized JavaScript origins`
   - local: `http://127.0.0.1:5173`
   - production: URL หน้าเว็บจริงของแอป
5. ใส่ `Authorized redirect URIs`
   - local/prod callback: `<VITE_SUPABASE_URL>/functions/v1/google-oauth-callback`

## 4. ใส่ค่าในแอป

เพิ่มค่าตาม `.env.example`

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PUBLIC_APP_URL=http://127.0.0.1:5173
VITE_GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

## 5. ค่า secret สำหรับ Edge Functions

รอบถัดไปจะต้องเพิ่ม secret ฝั่ง Supabase Functions ด้วย:

```bash
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
```

## หมายเหตุ

- `VITE_GOOGLE_OAUTH_CLIENT_ID` เป็นค่าที่ frontend มองเห็นได้
- `GOOGLE_OAUTH_CLIENT_SECRET` ต้องอยู่เฉพาะใน Edge Function secrets เท่านั้น
- สิทธิ์ชุดนี้ใช้ทั้ง Google Sheets และ Google Drive
- ถ้า callback URL ใน Google Cloud ไม่ตรงเป๊ะ ปุ่มเชื่อม Google จะใช้งานไม่ได้
