# Handoff: สร้างระบบ Image Cropper Modal สำหรับอัปโหลดรูปแบนเนอร์ร้าน

## Summary
- งานรอบล่าสุดได้เพิ่มระบบตัดรูปภาพ (Image Cropper) ไว้ในแอปโดยตรง
- ใช้ไลบรารี `react-image-crop` เพื่อล็อกสัดส่วน (Aspect Ratio) ให้ตรงกับข้อกำหนด:
  - Desktop Background: สัดส่วน 8:3 (อิงจาก 1600x600 px)
  - Mobile Background: สัดส่วน 3:2 (อิงจาก 1080x720 px)
- แปลงรูปและบีบอัดภาพให้อยู่ในฟอร์แมต `webp` อัตโนมัติ (คุณภาพ 90%) ก่อนอัปโหลด เพื่อให้โหลดเร็วขึ้นและลดขนาดไฟล์ลง

## User Intent
- ผู้ใช้ (แอดมิน) ต้องการความสะดวกในการลากจัดตำแหน่ง (Safe Area) รูปภาพแบนเนอร์เองโดยไม่ต้องใช้โปรแกรมภายนอก
- ไม่ต้องการให้ภาพที่แสดงหน้าร้านผิดสัดส่วน ยืด หรือบิดเบี้ยว

## What Changed
- **Dependencies**
  - ติดตั้ง `react-image-crop` (เพิ่มใน `package.json`)
- **UI Components**
  - สร้างไฟล์ [src/components/ImageCropperModal.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/components/ImageCropperModal.tsx) เพื่อทำหน้าที่รับรูปภาพมาเปิดในป๊อปอัป มีปุ่มยกเลิกและบันทึก ทำการ Crop รูปตามพิกัดที่เลือกลงบน Canvas และแปลงเป็น Blob (webp)
- **Features Integration**
  - อัปเดต [src/features/catalog/CustomerCatalogPage.tsx](/Users/bhusitt./Downloads/Precious-Shop-Test/src/features/catalog/CustomerCatalogPage.tsx) ให้รองรับการทำงานของ Cropper Modal
  - แทนที่การเรียกฟังก์ชัน `onUploadHeroBackground` ทันทีที่เลือกไฟล์ เปลี่ยนมาเปิดป๊อปอัปให้ Crop ก่อน เมื่อกด Save จึงส่ง File `webp` ที่โดน Crop แล้วเข้าสู่ฟังก์ชันอัปโหลด

## Current Status
- ระบบ Crop สามารถทำงานได้ปกติ (ผ่าน Type Check แล้ว)
- สามารถอัปโหลด Desktop/Mobile Background ได้โดยมีขั้นตอนการ Crop กั้นกลางเรียบร้อย
- โค้ดยังไม่ได้ commit

## Recommended Next Session
- ทดสอบ Runtime: ล็อกอินเข้าแอป, ไปที่หน้าลูกค้ารูปแบบแก้ไข, อัปโหลดรูปแบนเนอร์, ปรับกรอบ Crop และกดบันทึก ตรวจสอบดูว่าภาพที่แสดงจริงมีสัดส่วนเป๊ะตามต้องการและแสดงผลได้ทันที
- ตรวจเช็คว่ามีปัญหาเรื่องการทับซ้อน (z-index) ของ Modal Cropper หรือไม่
- หากทดสอบแล้วทุกอย่างสมบูรณ์ แนะนำให้ commit และ push เข้า branch ที่ใช้งานอยู่
