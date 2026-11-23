# Panduan Deploy GoNEST — Tahap 1

Semua gratis: GitHub, Supabase (free), Cloudflare Pages (free). Tanpa kartu kredit.

## 1. GitHub
1. Buat repo baru (private juga boleh), mis. `gonest`.
2. Ekstrak ZIP ini, lalu dari foldernya: `git init && git add . && git commit -m "Tahap 1" && git branch -M main && git remote add origin <url-repo> && git push -u origin main`.

## 2. Supabase
1. supabase.com > New project. Region: **Southeast Asia (Singapore)**. Simpan password database.
2. SQL Editor: jalankan isi `supabase/migrations/001_schema.sql`, lalu `002_seed.sql` (berurutan; aman dijalankan ulang).
3. Authentication > Users > **Add user** (centang Auto Confirm): email + kata sandi kamu sebagai Owner. Salin **UID**-nya.
4. SQL Editor, jadikan dia Owner:
   ```sql
   insert into profiles (id, email, name, role, active)
   values ('UID-DARI-LANGKAH-3', 'emailmu@contoh.com', 'Nama Kamu', 'owner', true);
   ```
5. Authentication > Providers > Email: matikan **Enable sign ups** (pengguna hanya dibuat oleh Owner).
6. Settings > API: catat **Project URL**, **anon key**, **service_role key** (rahasia, jangan dibagikan).

## 3. Cloudflare Pages
1. Workers & Pages > Create > Pages > Connect to Git > pilih repo.
2. Build command: kosong. Build output directory: `public`. Framework: None.
3. Settings > Variables and Secrets (Production), isi:
   - `SUPABASE_URL` (teks), `SUPABASE_ANON_KEY` (teks)
   - `SUPABASE_SERVICE_KEY` (**Secret**), `IP_SALT` (**Secret**, teks acak panjang)
4. Deploy ulang setelah variabel diisi.
5. Buka `https://<proyek>.pages.dev/admin/` dan masuk dengan akun Owner.

## 4. Keepalive (agar Supabase gratis tidak ter-pause)
Repo GitHub > Settings > Secrets and variables > Actions: tambah `SUPABASE_URL` dan `SUPABASE_ANON_KEY`. Jalankan sekali manual di tab Actions > keepalive > Run workflow; harus hijau.

## Checklist uji pertama
- `/api/config` mengembalikan `ok: true`.
- `/admin/` bisa login; menu Pengguna muncul untuk Owner.
- Tambah satu Admin umum; login sebagai dia: menu Pengguna dan Tampilan tidak ada.
- `/api/content/settings` mengembalikan brand + kontak.

## Catatan jujur
Kode diuji dengan Postgres lokal (skema + RLS), 46 tes API dengan Supabase tiruan, dan uji browser admin. Supabase dan Cloudflare asli belum bisa dijalankan dari sini, jadi deploy pertama mungkin butuh penyesuaian kecil. Kirim pesan galatnya, saya perbaiki.

## Tahap 2: tambahan
- Tidak ada variabel baru. Cukup push ke GitHub; Cloudflare Pages deploy otomatis.
- Opsional untuk melihat tampilan terisi: jalankan `supabase/sample/sample_data.sql` (3 paket + 3 kendaraan contoh). Hapus nanti dari admin setelah Tahap 3.
- Login Owner > **Section & teks** untuk ubah teks tiap bagian dan foto hero; **Pengaturan situs** untuk logo, kontak, menu, footer, warna, animasi, dan tombol chat.
- Setelah mengubah, situs publik bisa butuh 1-2 menit untuk berubah (cache).
