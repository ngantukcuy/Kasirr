-- ============================================================
-- FIX: Tabel "profiles" tidak punya RLS policy sama sekali
-- ============================================================
-- MASALAH:
-- RLS aktif di tabel profiles (biasanya default saat bikin tabel lewat
-- Supabase Dashboard), tapi tidak ada satupun CREATE POLICY untuk tabel
-- ini di seluruh project. RLS ON + policy nol = SEMUA akses diblokir,
-- termasuk user membaca baris profilnya sendiri.
--
-- Akibatnya: setiap query "select('*').eq('id', userId).maybeSingle()"
-- di js/app.js (dipakai saat login & cek sesi) tidak pernah menemukan
-- baris apapun (walau barisnya ada di DB) → PostgREST balas 406,
-- lalu app.js berpikir "profil belum ada" dan mencoba upsert ulang.
--
-- Jalankan file ini di Supabase Dashboard → SQL Editor. Aman dijalankan
-- berkali-kali (pakai DROP POLICY IF EXISTS dulu).
-- ============================================================

-- 0. Pastikan RLS aktif (no-op kalau sudah aktif)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Pastikan fungsi get_user_role() ada (dipakai policy admin di bawah).
--    SECURITY DEFINER supaya fungsi ini sendiri tidak kena RLS saat
--    membaca role user yang sedang login (hindari infinite recursion).
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Bersihkan policy lama (kalau ada sisa percobaan sebelumnya)
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- 3. SELECT: setiap user login boleh baca profilnya sendiri
--    (wajib — ini yang dipakai saat login/cek sesi di js/app.js)
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 4. SELECT: owner & manager boleh baca SEMUA profile
--    (dipakai halaman pages/pengguna.html untuk kelola karyawan)
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

-- 5. INSERT: user boleh bikin baris profilnya sendiri
--    (dipakai saat registrasi & self-heal profile di _loadProfile)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 6. UPDATE: user boleh update profilnya sendiri (ganti nama, dll)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 7. UPDATE: owner & manager boleh update profile user lain
--    (dipakai pages/pengguna.html untuk ganti role / nonaktifkan akun)
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('owner', 'manager'))
  WITH CHECK (get_user_role() IN ('owner', 'manager'));
