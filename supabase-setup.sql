-- 1. สร้างตาราง locations
CREATE TABLE IF NOT EXISTS public.locations (
    id TEXT PRIMARY KEY,
    type_id INTEGER NOT NULL,
    province_th TEXT NOT NULL,
    province_en TEXT,
    secondary_province_th TEXT,
    secondary_province_en TEXT,
    title TEXT NOT NULL,
    sub_title TEXT,
    region TEXT,
    details TEXT,
    supervisor TEXT,
    year_added TEXT,
    is_school BOOLEAN DEFAULT false,
    network_leader TEXT,
    network_members JSONB DEFAULT '[]'::jsonb,
    website_url TEXT,
    website_label TEXT,
    drive_doc_url TEXT,
    drive_doc_title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. เปิด RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- 3. ล้าง policy เก่า (ถ้าเคยรันแบบเปิดทุกคนไปแล้ว)
DROP POLICY IF EXISTS "Public Read" ON public.locations;
DROP POLICY IF EXISTS "Public Insert" ON public.locations;
DROP POLICY IF EXISTS "Public Update" ON public.locations;
DROP POLICY IF EXISTS "Public Delete" ON public.locations;

-- 4. ทุกคนอ่านได้ / เฉพาะผู้ที่ล็อกอินเท่านั้นที่เขียน-แก้-ลบได้
CREATE POLICY "Public Read" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Admin Insert" ON public.locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin Update" ON public.locations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Delete" ON public.locations FOR DELETE TO authenticated USING (true);

-- 5. เปิด Realtime (ถ้าเคยรันแล้วขึ้น error "already member" ข้ามบรรทัดนี้ได้)
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;

-- 6. เพิ่มคอลัมน์ศึกษานิเทศก์ผู้ดูแล (สำหรับตารางที่สร้างไว้แล้ว)
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS supervisor TEXT;
