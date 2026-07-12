# Supabase Edge Functions

ฟังก์ชันที่ใช้ใน flow นี้:

- `health` สำหรับ cron keepalive/uptime checks
- `create-shop-member`
- `google-drive-customer-documents-upload`
- `r2-images` - private R2 upload/delete proxy for product images
- `google-drive-customer-documents-delete`
- `google-drive-customer-document`

## Keepalive secrets

ตั้งค่า token เดียวกันใน Supabase Edge Functions และ GitHub Actions:

```bash
KEEPALIVE_TOKEN=replace-with-a-long-random-token
```

ใน GitHub ให้ใช้ repository secret ชื่อ:

```bash
SUPABASE_KEEPALIVE_TOKEN=replace-with-the-same-token
```

ฟังก์ชัน `health` จะใช้ค่า built-in ของ Supabase เพิ่มเติม:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Google Drive secrets

ตั้งค่าใน Supabase Dashboard > Edge Functions > Secrets หรือผ่าน CLI:

```bash
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
CENTRAL_GOOGLE_DRIVE_SHOP_ID=your-central-shop-uuid
```

ระบบใช้ refresh token ของบัญชี Google Drive ที่เชื่อมอยู่เดิมของร้านที่กำหนดใน `CENTRAL_GOOGLE_DRIVE_SHOP_ID` เป็นบัญชีกลาง จึงไม่ต้องสร้างหรือเก็บ refresh token ใหม่ใน secret และผู้ใช้ไม่ต้องกดเชื่อม Google อีก

โฟลเดอร์รูปของแต่ละร้านจะใช้ชื่อ `Precious Rental - <shop name> (<shop_id>) - Customer Documents` เพื่อกันชื่อร้านซ้ำ และหาก Drive เต็มระบบจะตอบข้อความที่ใช้งานได้แทนการค้าง

ฟังก์ชัน Google Drive จะใช้ค่า built-in ของ Supabase เพิ่มเติม:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Staff management function

ฟังก์ชัน `create-shop-member` ใช้สำหรับให้ Owner สร้างบัญชีพนักงานใหม่จากหน้า Settings และต้องถูก deploy แยกต่างหากหลัง merge โค้ด

ฟังก์ชันนี้ใช้ค่า built-in ของ Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy

```bash
supabase functions deploy health --no-verify-jwt
supabase functions deploy create-shop-member
supabase functions deploy google-drive-customer-documents-upload --no-verify-jwt
supabase functions deploy google-drive-customer-documents-delete --no-verify-jwt
supabase functions deploy google-drive-customer-document --no-verify-jwt
supabase functions deploy public-catalog --no-verify-jwt
```

`health` เป็น public endpoint สำหรับ cron ping/uptime checks:

```text
https://<project-ref>.supabase.co/functions/v1/health
```

เรียกด้วย header:

```text
x-keepalive-token: <KEEPALIVE_TOKEN>
```

## Local serve

```bash
supabase functions serve --env-file supabase/.env
```

ใส่ secret สำหรับ local dev ไว้ใน `supabase/.env`
