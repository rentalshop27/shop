# Supabase Edge Functions

ฟังก์ชันที่ใช้ใน flow นี้:

- `health` สำหรับ cron keepalive/uptime checks
- `create-shop-member`
- `google-oauth-start`
- `google-oauth-callback`
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

## Google OAuth secrets

ตั้งค่าใน Supabase Dashboard > Edge Functions > Secrets หรือผ่าน CLI:

```bash
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_OAUTH_STATE_SECRET=replace-with-a-long-random-secret
```

ฟังก์ชัน Google OAuth จะใช้ค่า built-in ของ Supabase เพิ่มเติม:

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
supabase functions deploy google-oauth-start --no-verify-jwt
supabase functions deploy google-oauth-callback --no-verify-jwt
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
