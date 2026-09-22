-- =========================================================================
-- TTM Booking System (ระบบนัดและบริหารคลินิกการแพทย์แผนไทย)
-- Database Schema for Supabase (PostgreSQL)
-- โรงพยาบาลนราธิวาสราชนครินทร์
-- =========================================================================

-- 1. Appointments Table (ตารางคิวนัดหมายคนไข้)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    patient_name TEXT NOT NULL,
    citizen_or_hn TEXT,
    phone TEXT NOT NULL,
    medical_scheme TEXT DEFAULT 'บัตรทอง',
    book_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    main_service TEXT NOT NULL,
    extra_services JSONB DEFAULT '[]'::jsonb,
    assistant_id TEXT,
    assistant_nick TEXT,
    status TEXT DEFAULT '⚪ ว่าง',
    slots_occupied JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup by date, phone, HN
CREATE INDEX IF NOT EXISTS idx_appointments_book_date ON public.appointments(book_date);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_citizen_or_hn ON public.appointments(citizen_or_hn);

-- Migration Alters if table already exists
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS medical_scheme TEXT DEFAULT 'บัตรทอง';

-- 2. Assistants Table (ตารางรายชื่อผู้ช่วยแพทย์แผนไทย)
CREATE TABLE IF NOT EXISTS public.assistants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nickname TEXT NOT NULL,
    gender TEXT DEFAULT 'หญิง', -- 'หญิง' | 'ชาย'
    phone TEXT,
    email TEXT,
    role TEXT DEFAULT 'staff', -- 'staff' | 'admin' | 'user'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration Alters if table already exists
ALTER TABLE public.assistants ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'หญิง';
ALTER TABLE public.assistants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.assistants ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.assistants ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff';
ALTER TABLE public.assistants DROP COLUMN IF EXISTS password;
CREATE INDEX IF NOT EXISTS idx_assistants_phone ON public.assistants(phone);
CREATE INDEX IF NOT EXISTS idx_assistants_email ON public.assistants(email);


-- 2.5 Main Services Table (ตารางประเภทหัตถการหลัก)
CREATE TABLE IF NOT EXISTS public.main_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    icon TEXT DEFAULT '💆‍♂️',
    "desc" TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    price_label TEXT,
    duration_slots NUMERIC DEFAULT 1,
    duration_min NUMERIC DEFAULT 60,
    target_audience TEXT DEFAULT 'all', -- 'all' (ทุกคน) | 'staff_only' (เฉพาะเจ้าหน้าที่)
    active BOOLEAN DEFAULT true,
    color TEXT DEFAULT 'bg-herbal-100 text-herbal-800 border-herbal-200',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_main_services_active ON public.main_services(active);

-- 3. Extra Services Table (ตารางบริการเสริมและหัตถการ)
CREATE TABLE IF NOT EXISTS public.extra_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tag TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    asst_percent NUMERIC DEFAULT 60,
    hospital_percent NUMERIC DEFAULT 40,
    share60 NUMERIC NOT NULL DEFAULT 0,
    target_audience TEXT DEFAULT 'all', -- 'all' (ทุกคน) | 'staff_only' (เฉพาะเจ้าหน้าที่)
    two_slots BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    color TEXT DEFAULT 'bg-slate-100 text-slate-800 border border-slate-200',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration Alters for Extra Services
ALTER TABLE public.extra_services ADD COLUMN IF NOT EXISTS asst_percent NUMERIC DEFAULT 60;
ALTER TABLE public.extra_services ADD COLUMN IF NOT EXISTS hospital_percent NUMERIC DEFAULT 40;
ALTER TABLE public.extra_services ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all';

-- 4. Slot Configurations Table (ตารางการตั้งค่าโควต้าและเปิด/ปิดรอบเวลา)
CREATE TABLE IF NOT EXISTS public.slot_configs (
    id TEXT PRIMARY KEY,
    scope TEXT NOT NULL, -- 'daily' หรือ 'monthly'
    config_key TEXT NOT NULL, -- เช่น '2026-09-09' หรือ '2026-09'
    slots_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Users Table (ตารางบัญชีผู้ใช้งาน, เจ้าหน้าที่ และผู้ดูแลระบบ)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    auth_user_id UUID UNIQUE,
    role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'staff' | 'admin'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration for existing installations created before Supabase Auth integration.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE public.users DROP COLUMN IF EXISTS password;

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id)
    WHERE auth_user_id IS NOT NULL;

-- 6. Audit Logs Table (ตารางประวัติการเข้าสู่ระบบและบันทึกกิจกรรมย้อนหลัง)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'EDIT_PATIENT' | 'BOOK_QUEUE' | 'CANCEL_QUEUE' | 'CHANGE_STATUS' | 'CHANGE_ASSISTANT' | 'CONFIG_SYSTEM' | 'FAILED_LOGIN'
    description TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration Alters for Security & IP Tracking
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS client_ip TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_ip TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users DROP COLUMN IF EXISTS password;
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON public.audit_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON public.audit_logs(ip_address);

-- 7. Reviews Table (ตารางการประเมินความพึงพอใจและรีวิวให้คะแนนดาว)
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    appointment_id TEXT,
    patient_name TEXT NOT NULL,
    phone TEXT,
    assistant_id TEXT,
    assistant_name TEXT,
    service_name TEXT,
    rating_overall INTEGER NOT NULL DEFAULT 5, -- 1 ถึง 5 ดาว
    rating_service INTEGER DEFAULT 5, -- 1 ถึง 5
    rating_cleanliness INTEGER DEFAULT 5, -- 1 ถึง 5
    rating_outcome INTEGER DEFAULT 5, -- 1 ถึง 5
    nps_recommend TEXT DEFAULT 'recommend', -- 'recommend' | 'neutral' | 'not_recommend'
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating_overall ON public.reviews(rating_overall);
CREATE INDEX IF NOT EXISTS idx_reviews_assistant_id ON public.reviews(assistant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_phone ON public.reviews(phone);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ข้อมูลบัญชีและข้อมูลผู้ป่วยต้องผ่าน Supabase Auth/RLS เสมอ
-- =========================================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.main_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access for appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public insert access for appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public update access for appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public delete access for appointments" ON public.appointments;

DROP POLICY IF EXISTS "Allow public all access for assistants" ON public.assistants;
DROP POLICY IF EXISTS "Allow public all access for main_services" ON public.main_services;
DROP POLICY IF EXISTS "Allow public all access for extra_services" ON public.extra_services;
DROP POLICY IF EXISTS "Allow public all access for slot_configs" ON public.slot_configs;
DROP POLICY IF EXISTS "Allow public all access for users" ON public.users;
DROP POLICY IF EXISTS "Allow public all access for audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow public all access for reviews" ON public.reviews;
DROP POLICY IF EXISTS "main_services_public_select" ON public.main_services;
DROP POLICY IF EXISTS "main_services_staff_admin_all" ON public.main_services;
DROP POLICY IF EXISTS "users_self_select" ON public.users;
DROP POLICY IF EXISTS "users_self_insert" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;
DROP POLICY IF EXISTS "users_staff_admin_all" ON public.users;
DROP POLICY IF EXISTS "appointments_anon_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_staff_admin_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_staff_admin_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_staff_admin_delete" ON public.appointments;
DROP POLICY IF EXISTS "assistants_public_select" ON public.assistants;
DROP POLICY IF EXISTS "assistants_staff_admin_select" ON public.assistants;
DROP POLICY IF EXISTS "assistants_staff_admin_write" ON public.assistants;
DROP POLICY IF EXISTS "catalog_public_select" ON public.extra_services;
DROP POLICY IF EXISTS "catalog_staff_admin_write" ON public.extra_services;
DROP POLICY IF EXISTS "slots_public_select" ON public.slot_configs;
DROP POLICY IF EXISTS "slots_staff_admin_write" ON public.slot_configs;
DROP POLICY IF EXISTS "audit_staff_admin_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_staff_admin_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "reviews_public_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_public_select" ON public.reviews;
DROP POLICY IF EXISTS "reviews_staff_admin_select" ON public.reviews;
DROP POLICY IF EXISTS "reviews_staff_admin_write" ON public.reviews;

-- Role is deliberately read from app_metadata, which users cannot edit.
CREATE POLICY "users_self_select" ON public.users FOR SELECT
    USING (auth.uid() = auth_user_id);
CREATE POLICY "users_self_insert" ON public.users FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id AND role = 'user');
CREATE POLICY "users_self_update" ON public.users FOR UPDATE
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id AND role = 'user');
CREATE POLICY "users_staff_admin_all" ON public.users FOR ALL
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'))
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));

CREATE POLICY "appointments_anon_insert" ON public.appointments FOR INSERT
    TO anon, authenticated WITH CHECK (true);
CREATE POLICY "appointments_staff_admin_select" ON public.appointments FOR SELECT
    TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));
CREATE POLICY "appointments_staff_admin_update" ON public.appointments FOR UPDATE
    TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'))
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));
CREATE POLICY "appointments_staff_admin_delete" ON public.appointments FOR DELETE
    TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));

CREATE POLICY "assistants_staff_admin_select" ON public.assistants FOR SELECT
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));
CREATE POLICY "assistants_staff_admin_write" ON public.assistants FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'))
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));

CREATE POLICY "main_catalog_public_select" ON public.main_services FOR SELECT
    TO anon, authenticated USING (true);
CREATE POLICY "main_catalog_staff_admin_write" ON public.main_services FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'))
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));

CREATE POLICY "catalog_public_select" ON public.extra_services FOR SELECT
    TO anon, authenticated USING (true);
CREATE POLICY "catalog_staff_admin_write" ON public.extra_services FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'))
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));
CREATE POLICY "slots_public_select" ON public.slot_configs FOR SELECT
    TO anon, authenticated USING (true);
CREATE POLICY "slots_staff_admin_write" ON public.slot_configs FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'))
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));

CREATE POLICY "audit_staff_admin_select" ON public.audit_logs FOR SELECT
    TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));
CREATE POLICY "audit_staff_admin_insert" ON public.audit_logs FOR INSERT
    TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));

CREATE POLICY "reviews_public_insert" ON public.reviews FOR INSERT
    TO anon, authenticated WITH CHECK (true);
CREATE POLICY "reviews_staff_admin_select" ON public.reviews FOR SELECT
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));
CREATE POLICY "reviews_staff_admin_update" ON public.reviews FOR UPDATE
    TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'))
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));
CREATE POLICY "reviews_staff_admin_delete" ON public.reviews FOR DELETE
    TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin'));

-- Safe public projections used by the booking UI.  They never expose patient PII.
CREATE OR REPLACE VIEW public.public_appointment_slots AS
SELECT id, book_date, time_slot, assistant_id, assistant_nick, status, slots_occupied
FROM public.appointments;
GRANT SELECT ON public.public_appointment_slots TO anon, authenticated;

CREATE OR REPLACE VIEW public.public_assistants AS
SELECT id, name, nickname, gender, role, active, created_at
FROM public.assistants
WHERE active = true;
GRANT SELECT ON public.public_assistants TO anon, authenticated;

CREATE OR REPLACE VIEW public.public_reviews AS
SELECT id, assistant_name, service_name, rating_overall, rating_service,
       rating_cleanliness, rating_outcome, nps_recommend, comment, created_at
FROM public.reviews;
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- Resolve a phone identifier without granting table access or returning PII.
CREATE OR REPLACE FUNCTION public.resolve_auth_email_by_phone(lookup_phone TEXT)
RETURNS TABLE (email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT u.email
    FROM public.users AS u
    WHERE regexp_replace(u.phone, '[^0-9]', '', 'g') =
          regexp_replace(lookup_phone, '[^0-9]', '', 'g')
      AND u.active = true
      AND u.email IS NOT NULL
    LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.resolve_auth_email_by_phone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_auth_email_by_phone(TEXT) TO anon, authenticated;

-- Create a profile when Supabase Auth creates an account.  The frontend then
-- upserts the same row with the latest profile fields after sign-up.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, auth_user_id, name, phone, email, role, active)
    VALUES (
        'usr-' || NEW.id::text,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', 'ผู้รับบริการ'),
        NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
        NEW.email,
        COALESCE(NEW.raw_app_meta_data ->> 'role', 'user'),
        true
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =========================================================================
-- ENABLE SUPABASE REALTIME
-- เปิดการส่งข้อมูลสดผ่าน WebSocket สำหรับตารางนัดหมาย, ผู้ช่วย, ประวัติ และรีวิว
-- =========================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'assistants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.assistants;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'main_services'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.main_services;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'extra_services'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_services;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'audit_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'reviews'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
    END IF;
END $$;

-- =========================================================================
-- SEED INITIAL DATA (ข้อมูลตั้งต้น)
-- =========================================================================

-- Seed Assistants
INSERT INTO public.assistants (id, name, nickname, gender, phone, email, role, active)
VALUES 
    ('asst-1', 'น.ส. นัสรีน ดือราแม', 'นัสรีน', 'หญิง', '0800000011', 'nasreen@ttm.clinic', 'staff', true),
    ('asst-2', 'น.ส. มีนี สาและ', 'มีนี', 'หญิง', '0800000012', 'meenee@ttm.clinic', 'staff', true),
    ('asst-3', 'น.ส. ฟาตีเมาะห์ ยะลา', 'ฟา', 'หญิง', '0800000013', 'fa@ttm.clinic', 'staff', true),
    ('asst-4', 'นาย เลาะห์ มามุ', 'เลาะห์', 'ชาย', '0800000014', 'loh@ttm.clinic', 'staff', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Main Services (ประเภทหัตถการหลัก)
INSERT INTO public.main_services (id, name, title, icon, "desc", price, price_label, duration_slots, duration_min, target_audience, active, color)
VALUES
    ('main-massage', 'จองนวด', 'จองนวด (ตรวจรักษา/นวดบำบัด/ประคบสมุนไพร)', '💆‍♂️', 'ตรวจรักษา นวดบำบัดและประคบสมุนไพร บรรเทาอาการปวดกล้ามเนื้อและข้อต่อ', 200, '200 บาท', 1, 60, 'all', true, 'bg-herbal-100 text-herbal-800 border-herbal-200'),
    ('main-postpartum', 'จองฟื้นฟูหลังคลอด', 'จองฟื้นฟูหลังคลอด (บริบาลมารดาหลังคลอด/ทับหม้อเกลือ)', '🤱', 'บริบาลมารดาหลังคลอด ทับหม้อเกลือ อบสมุนไพร ประคบ ขับน้ำคาวปลา ฟื้นฟูสุขภาพ', 0, 'บริการเฉพาะทาง', 1, 60, 'all', true, 'bg-purple-100 text-purple-800 border-purple-200')
ON CONFLICT (id) DO NOTHING;

-- Seed Extra Services
INSERT INTO public.extra_services (id, name, tag, price, share60, two_slots, active, color)
VALUES
    ('svc-body', 'นวดตัว', '[ตัว]', 300, 180, true, true, 'bg-emerald-100 text-emerald-800 border border-emerald-200'),
    ('svc-foot', 'นวดเท้า', '[เท้า]', 200, 120, true, true, 'bg-blue-100 text-blue-800 border border-blue-200'),
    ('svc-herbal', 'อบสมุนไพร', '[อบ]', 150, 90, false, true, 'bg-purple-100 text-purple-800 border border-purple-200'),
    ('svc-belly', 'นวดท้อง', '[ท้อง]', 100, 60, false, true, 'bg-amber-100 text-amber-800 border border-amber-200')
ON CONFLICT (id) DO NOTHING;

-- Auth accounts must be created in Supabase Auth; do not seed passwords here.

-- Seed Initial Reviews (ตัวอย่างการประเมินความพึงพอใจ)
INSERT INTO public.reviews (id, appointment_id, patient_name, phone, assistant_id, assistant_name, service_name, rating_overall, rating_service, rating_cleanliness, rating_outcome, nps_recommend, comment, created_at)
VALUES
    ('rev-1', 'apt-demo-1', 'นาย สมชาย ผู้รับบริการ', '0812345678', 'asst-1', 'นัสรีน (น.ส. นัสรีน ดือราแม)', 'นวดตัว', 5, 5, 5, 5, 'recommend', 'คุณหมอนวดดีมาก อาการปวดหลังและไหล่ดีขึ้นชัดเจน คลินิกสะอาดมากครับ', timezone('utc'::text, now() - interval '2 days')),
    ('rev-2', 'apt-demo-2', 'นาง อามีนะห์ เจ๊ะมะ', '0898765432', 'asst-2', 'มีนี (น.ส. มีนี สาและ)', 'นวดเท้า + อบสมุนไพร', 5, 5, 4, 5, 'recommend', 'บริการสุภาพ ยิ้มแย้มแจ่มใส กลิ่นสมุนไพรหอมผ่อนคลาย ประทับใจมากค่ะ', timezone('utc'::text, now() - interval '1 day')),
    ('rev-3', 'apt-demo-3', 'นาย รอซาลี ยูโซ๊ะ', '0865554321', 'asst-4', 'เลาะห์ (นาย เลาะห์ มามุ)', 'นวดตัว', 4, 4, 5, 4, 'recommend', 'นวดคลายเส้นได้ตรงจุด น้ำหนักมือกำลังดี จะกลับมาใช้บริการอีกแน่นอนครับ', timezone('utc'::text, now() - interval '6 hours'))
ON CONFLICT (id) DO NOTHING;
