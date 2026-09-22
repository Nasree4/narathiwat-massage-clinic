# คู่มือโครงสร้างระบบแบบแยกโมดูล (Modularization Architecture Guide)

ระบบคลินิกการแพทย์แผนไทย (TTM Booking System) ได้รับการปรับโครงสร้างโค้ดเป็นแบบ **Modularization Architecture** ตั้งแต่เวอร์ชัน **v5.4.0** เป็นต้นไป เพื่อให้ง่ายต่อการพัฒนา ดูแลรักษา และขยายฟีเจอร์ในอนาคต โดยที่ยังคงความเข้ากันได้ 100% ไม่สูญเสียฟังก์ชันใดๆ และไม่ติดปัญหา CORS เมื่อเปิดไฟล์แบบ local

---

## 📁 โครงสร้างโฟลเดอร์ (Directory Structure)

```
d:/TTM Booking System/
├── src/
│   ├── template.html              # HTML markup + CSS + Tailwind + CDN dependencies ทั้งหมด
│   ├── index.dev.html             # ไฟล์สำหรับเปิดทดสอบแบบแยกไฟล์ script ใน browser
│   └── js/                        # โมดูล JavaScript ย่อย 15 ไฟล์ (อ่านง่าย แก้ไขง่าย)
│       ├── 01_constants_and_state.js         # เวอร์ชัน, ค่าคงที่ระบบ, LocalStorage keys, Time slots
│       ├── 02_notifications_and_alerts.js    # ระบบแจ้งเตือน, เสียง, Toast notification
│       ├── 03_time_tracking_and_lifecycle.js # ระบบจับเวลาคนไข้ & ติดตามสถานะ
│       ├── 04_settings_theme_and_shifts.js   # ธีม 3D, สองภาษา (TH/EN), การตั้งค่ารอบเวลา, Rate limiting
│       ├── 05_supabase_and_sync.js           # Supabase client, Realtime subscription, ซิงค์คลาวด์
│       ├── 06_auth_and_rbac.js               # ระบบล็อกอิน, สิทธิ์เข้าถึง (Admin, Staff, Patient)
│       ├── 07_ui_components_and_reviews.js   # นาฬิกา Hero, บันทึก Audit trail, ระบบรีวิวความพึงพอใจ
│       ├── 08_staff_selection_and_schemes.js # ตัวเลือกหมอนวด (Quick Chips), สิทธิ์การรักษา
│       ├── 09_appointment_desk_and_queue.js  # โต๊ะคิวห้องนวด, เปลี่ยนเวลา/เพศ, เรียกชื่อ, จัดการบริการ
│       ├── 10_canvas_slip_generator.js       # ระบบสร้างสลิปนัดหมายความเร็วสูง (Direct Canvas)
│       ├── 11_patients_directory.js          # ทำเนียบคนไข้, ค้นหาประวัติการรักษา
│       ├── 12_assistant_shifts_and_roster.js # ตารางเวรหมอนวด, เช็คชื่อ, Modal หมอนวด, ประวัตินวดแบ่งรายเดือน, Export Excel
│       ├── 13_services_crud.js               # จัดการรายการหัตถการหลัก & บริการเสริม
│       ├── 14_pwa_and_lifecycle.js           # Service Worker, การตรวจจับออฟไลน์ & อัปเดตข้ามเครื่อง
│       ├── 15_booking_wizard_and_app_init.js # Wizard จองคิว 5 ขั้นตอน & DOMContentLoaded Lifecycle
│       └── modules.json                      # บันทึกรายชื่อโมดูลและคำอธิบาย
│
├── scripts/
│   ├── build.js                   # บิลด์โมดูลรวมเป็น index.html และ dist/
│   ├── watch.js                   # เฝ้าดูการแก้ไขไฟล์ใน src/ แล้ว rebuild อัตโนมัติใน 0.2 วินาที
│   ├── verify_integrity.js        # ตรวจสอบไวยากรณ์ (Syntax) และตรวจสอบฟังก์ชันใน HTML แบบ 100%
│   └── slice_modules.js           # สคริปต์สำรองสำหรับตัดแบ่งโมดูล
│
├── index.html                     # ไฟล์ Production Bundle (เปิดใช้งานได้ทันที)
├── dist/index.html                # ไฟล์ Distribution สำหรับ Deploy ขึ้น Vercel
├── sw.js                          # Service Worker (Cache v135)
└── package.json                   # คำสั่ง npm scripts
```

---

## 🛠️ คำสั่งที่ใช้ในการทำงาน (Commands)

| คำสั่ง | ความหมาย |
|---|---|
| `npm run build` | ประกอบไฟล์จาก `src/js/*.js` และ `src/template.html` พร้อมตรวจความถูกต้อง และส่งออกไปที่ `index.html`, `dist/` |
| `npm run watch` (หรือ `npm run dev`) | เปิดโหมด Watch — เมื่อแก้ไขไฟล์ใน `src/` ระบบจะ Rebuild ทันทีใน 0.2 วินาที |
| `npm run check` | ตรวจสอบ Syntax และตรวจสอบว่าฟังก์ชันทั้งหมดที่ HTML เรียก (`onclick`, `onchange` ฯลฯ) มีอยู่จริงใน JS ครบ 100% |

> **หมายเหตุสำหรับ Windows PowerShell:** หากรัน `npm` แล้วติด Execution Policy ให้ใช้ `npm.cmd run build` หรือ `node scripts/build.js` แทนได้ทันที

---

## 💡 วิธีการแก้ไขโค้ดต่อไป (How to Edit & Maintain)

1. **ต้องการแก้ไขส่วนใด ให้เปิดไฟล์โมดูลที่เกี่ยวข้องใน `src/js/`** ได้โดยตรง ไม่ต้องเลื่อนหาในไฟล์ 25,000 บรรทัดอีกต่อไป:
   - ปรับแต่งตารางเวร / หมอนวด / ประวัติรายเดือน / Export Excel: แก้ไขที่ `src/js/12_assistant_shifts_and_roster.js`
   - ปรับแต่งคิวหน้าห้อง / เสียงเรียก / สถานะคิว: แก้ไขที่ `src/js/09_appointment_desk_and_queue.js`
   - ปรับแต่งขั้นตอนการจองคิว (Wizard): แก้ไขที่ `src/js/15_booking_wizard_and_app_init.js`
   - ปรับแต่งดีไซน์โครงสร้างหน้าเว็บ: แก้ไขที่ `src/template.html`
2. **เมื่อแก้ไขเสร็จ ให้รัน:**
   ```bash
   npm.cmd run build
   ```
   ระบบจะตรวจสอบความถูกต้อง หากไม่มีข้อผิดพลาดจะอัปเดต `index.html` และ `dist/` ให้โดยอัตโนมัติ
3. **ตรวจสอบความปลอดภัย:**
   หากมีใครเผลอลบฟังก์ชันที่ปุ่มใน HTML ใช้งานอยู่ ระบบ Build จะแจ้งเตือนชื่อฟังก์ชันทันที และปฏิเสธการ Build เพื่อป้องกันข้อผิดพลาดในระบบจริง
