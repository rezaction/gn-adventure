# API GoNEST

Semua respons JSON `{ ok: true, ... }` atau `{ ok: false, error }`. Siap dipakai aplikasi mobile.

## Publik
| Endpoint | Fungsi |
|---|---|
| `GET /api/config` | URL Supabase + anon key (untuk login admin) |
| `GET /api/content/{settings,sections,packages,vehicles,articles,promos,gallery,destinations}` | Konten terbit/aktif, cache edge |
| `GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD` | Kendaraan tersedia pada rentang tanggal |
| `POST /api/promo` | Cek kode promo `{code}` (maks 20/menit) |
| `POST /api/message` | Kirim pesan (honeypot, validasi, maks 5 per 10 menit per IP), opsional klaim promo |
| `GET /api/image/{path}` | Proksi Storage Supabase, cache 1 tahun |

## Admin (header `Authorization: Bearer <JWT Supabase>`)
| Endpoint | Peran | Fungsi |
|---|---|---|
| `GET /api/admin/me` | staf | Profil + peran |
| `GET/POST/PATCH/DELETE /api/admin/users` | Owner | Kelola pengguna (tidak bisa menurunkan/menghapus diri sendiri) |

Operasi CRUD konten dilakukan lewat Supabase (RLS): staf penuh untuk artikel, promo, kendaraan, paket, galeri, pesan; hanya Owner untuk `site_settings`, `sections`, `profiles`.

## Skema teks dua bahasa
`{"id":"...","en":"..."}`.

## Field section (Owner)
Tabel `sections`: `id` (mis. `home.hero`), `page`, `kind`, `sort`, `visible`, `fields` (jsonb).
Isi `fields` yang dipakai seed: `eyebrow`, `heading`, `heading2` (opsional), `description`, `cta1`, `cta2` (opsional), foto hero dan teks kecil di foto (opsional; kunci final ditetapkan di Tahap 2). Semua teks berupa objek `{id,en}`.
