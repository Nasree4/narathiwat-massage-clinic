# ระบบนัดและบริหารคลินิกการแพทย์แผนไทย โรงพยาบาลนราธิวาสราชนครินทร์ (TTM Booking System)

ระบบจองคิวและบริหารจัดการคลินิกการแพทย์แผนไทย รองรับการทำงานแบบ Single-Page Application (SPA) เชื่อมต่อฐานข้อมูล **Supabase (PostgreSQL + Realtime)** และพร้อม Deploy ขึ้น **Vercel** ทันที

---

## 🚀 ขั้นตอนการติดตั้งและเชื่อมต่อ Supabase

### 1. สร้างโปรเจกต์บน Supabase
1. เข้าไปที่ [https://supabase.com](https://supabase.com) และเข้าสู่ระบบ (หรือ Sign Up ฟรี)
2. กดปุ่ม **"New Project"**
3. ตั้งชื่อโปรเจกต์ เช่น `ttm-booking-system` และกำหนด Database Password
4. เลือก Region: **Singapore (ap-southeast-1)** เพื่อความรวดเร็วในการรับส่งข้อมูลในไทย

### 2. รัน SQL สร้างตารางฐานข้อมูล
1. ไปที่เมนู **SQL Editor** ในแถบซ้ายมือของ Supabase Dashboard
2. กด **"New query"**
3. เปิดไฟล์ `supabase-schema.sql` ในโปรเจกต์นี้ คัดลอกเนื้อหาทั้งหมด แล้วนำมาวางในช่อง SQL Editor
4. กดปุ่ม **"Run"** เพื่อสร้างตาราง `appointments`, `assistants`, `extra_services`, `slot_configs` พร้อมเปิดใช้งาน Realtime อัตโนมัติ

### 3. คัดลอก API Keys มาใส่ในระบบ
1. ไปที่ **Project Settings** -> **API**
2. คัดลอกค่า:
   - **Project URL** (เช่น `https://xyzcompany.supabase.co`)
   - **Project API Keys (`anon` `public`)** (คีย์สาธารณะ)
3. เปิดหน้าเว็บระบบ เข้าแท็บ **"จัดการระบบ"** -> ยืนยันตัวตนด้วยบัญชี Supabase Auth -> ไปที่แท็บ **"⚡ Supabase"**
4. วาง URL และ Anon Key ลงในช่อง แล้วกด **"บันทึก & เชื่อมต่อ Supabase"**

### 4. ตั้งค่าบัญชีผู้ใช้และสิทธิ์

- ระบบล็อกอินใช้ **Supabase Auth** แล้ว ไม่ใช้คอลัมน์รหัสผ่านใน `public.users`
- ผู้ใช้ทั่วไปสมัครผ่านหน้าเว็บได้ และอาจต้องยืนยันอีเมลตามการตั้งค่า Supabase
- สร้างบัญชีเจ้าหน้าที่/ผู้ดูแลผ่าน Supabase Dashboard แล้วผูก `auth_user_id` ใน `public.users`
- กำหนด `app_metadata.role` (`user`, `staff` หรือ `admin`) ผ่านฝั่งผู้ดูแลเท่านั้น ห้ามให้ผู้ใช้แก้เอง
- ห้ามนำ `service_role` key ไปใส่ใน HTML หรือ JavaScript; ใช้เฉพาะ `anon public key`
- บัญชีเดิมที่เก็บรหัสผ่านแบบเดิมต้องสร้างบัญชี Auth ใหม่และผูก `auth_user_id`

### 5. ย้ายบัญชีเดิม

1. สร้างบัญชีเดิมในเมนู **Authentication -> Users** ด้วยอีเมลเดิม
2. รันไฟล์ `supabase-auth-migration.sql` ใน SQL Editor
3. ตรวจสอบว่า `public.users.auth_user_id` ถูกผูกกับบัญชี Auth และ `app_metadata.role` ถูกตั้งค่าแล้ว
4. ทดสอบด้วยบัญชี `user`, `staff` และ `admin` แยกกัน

ไฟล์ migration จะไม่สร้างบัญชี Auth และจะไม่กู้คืนรหัสผ่านเดิม เพราะ Supabase ไม่อนุญาตให้ย้ายรหัสผ่านแบบ plain text เข้า Auth

---

## 🌐 ขั้นตอนการ Deploy ขึ้น Vercel

### วิธีที่ 1: Deploy ผ่าน GitHub (แนะนำ)
1. อัปโหลดโฟลเดอร์โปรเจกต์นี้ขึ้น GitHub Repository ของท่าน
2. เข้าไปที่ [https://vercel.com](https://vercel.com) แล้วกด **"Add New..."** -> **"Project"**
3. เลือก Repository ที่อัปโหลดไว้
4. กดปุ่ม **"Deploy"** โดยไม่ต้องตั้งค่า Build Settings เพิ่มเติม (ระบบเป็น Static HTML)

### วิธีที่ 2: Deploy ผ่าน Vercel CLI
1. เปิด Command Prompt หรือ PowerShell ในโฟลเดอร์นี้
2. ติดตั้ง Vercel CLI (ถ้ายังไม่มี):
   ```bash
   npm i -g vercel
   ```
3. รันคำสั่ง:
   ```bash
   vercel
   ```
4. ทำตามขั้นตอนบนหน้าจอเพื่อ Deploy ขึ้น Cloud ทันที

---

## 📁 โครงสร้างไฟล์ในโปรเจกต์

- `index.html` - หน้าเว็บหลักของระบบ (รองรับทั้งคนไข้และเจ้าหน้าที่)
- `logo.png` - ตราสัญลักษณ์ โรงพยาบาลนราธิวาสราชนครินทร์
- `supabase-schema.sql` - ไฟล์คำสั่ง SQL สร้างตารางและ RLS บน Supabase
- `vercel.json` - ไฟล์ตั้งค่า Routing และ Security Headers ของ Vercel
- `README.md` - เอกสารคู่มือการติดตั้งและการใช้งาน

> ก่อนใช้งานจริง ให้ลบหรือย้ายไฟล์ `Password.txt` ออกจากโฟลเดอร์ deploy และตรวจสอบ RLS ใน Supabase Dashboard
