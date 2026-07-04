alter table public.rentals
  add column shipping_method text,       -- เก็บค่า 'grab' หรือ 'thailand_post'
  add column tracking_number text,       -- เก็บเลขพัสดุสำหรับไปรษณีย์ไทย
  add column return_tracking_note text,  -- เก็บข้อมูลรับคืน แยกจากเลขพัสดุขาไป
  add column shipping_cost numeric(10,2) default 0.00; -- เก็บค่าส่งจริง (เผื่อคิดแยก)
