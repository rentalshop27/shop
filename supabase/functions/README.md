# Supabase Edge Functions for Google OAuth

ฟังก์ชันที่ใช้ใน flow นี้:

- `google-oauth-start`
- `google-oauth-callback`

## Required secrets

ตั้งค่าใน Supabase Dashboard > Edge Functions > Secrets หรือผ่าน CLI:

```bash
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_OAUTH_STATE_SECRET=replace-with-a-long-random-secret
```

ฟังก์ชันจะใช้ค่า built-in ของ Supabase เพิ่มเติม:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy

```bash
supabase functions deploy google-oauth-start --no-verify-jwt
supabase functions deploy google-oauth-callback --no-verify-jwt
```

## Local serve

```bash
supabase functions serve --env-file supabase/.env
```

ใส่ secret สำหรับ local dev ไว้ใน `supabase/.env`
