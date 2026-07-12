# Google Drive backend setup

ระบบเก็บรูปและเอกสารลูกค้าลง Google Drive ผ่าน Supabase Edge Functions ด้วยบัญชี Google กลางของระบบ ผู้ใช้และแต่ละร้านไม่ต้องเชื่อม Google จากหน้าโปรไฟล์

## ตั้งค่าครั้งเดียวสำหรับผู้ดูแลระบบ

1. สร้างหรือเลือก Google Cloud project ของระบบ และเปิด `Google Drive API`
2. ยืนยันว่า Google Drive ของบัญชีกลางเชื่อมอยู่กับร้านที่กำหนดเป็น `CENTRAL_GOOGLE_DRIVE_SHOP_ID` แล้ว
3. ตั้งค่า Edge Function secrets:

```bash
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
CENTRAL_GOOGLE_DRIVE_SHOP_ID=your-central-shop-uuid
```

4. Deploy สามฟังก์ชันเอกสารลูกค้า:

```bash
supabase functions deploy google-drive-customer-documents-upload --no-verify-jwt
supabase functions deploy google-drive-customer-documents-delete --no-verify-jwt
supabase functions deploy google-drive-customer-document --no-verify-jwt
```

ห้ามใส่ client secret หรือ refresh token ใน frontend หรือ `.env.local` หาก token ของบัญชีกลางถูกถอน ให้เชื่อมบัญชี Google ของร้านกลางนี้ใหม่เพียงครั้งเดียว

ระบบสร้างโฟลเดอร์ชื่อ `Precious Rental - <shop name> (<shop_id>) - Customer Documents` เพื่อกันร้านชื่อซ้ำ และจะแจ้งข้อความชัดเจนหากพื้นที่ Drive ของระบบเต็ม
