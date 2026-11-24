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

## Tahap 2: bentuk data yang dipakai situs
- `sections.fields` hero: `eyebrow, heading, heading2, description, cta1{label,href}, cta2, image` (path Storage, mis. `site/abc.webp`, atau URL), `image_alt, image_text`. Jenis `list` menambah `items[{title,text}]`.
- `site_settings`: `brand{go,nest,tagline,logo}`, `contact`, `nav{items[{label,href,visible}],cta}`, `footer{about,columns[{title,links[]}],copyright}`, `theme{palette,ambient{enabled,mode,intensity,tint}}`, `chat`.
- `packages.itinerary`: `[{title:{id,en}, text:{id,en}}]`; `highlights/included/excluded`: `[{id,en}]`.
- Gambar: simpan path Storage; situs memuatnya lewat `/api/image/<path>` (cache panjang).
- Animasi latar: `mode` = `auto|leaves|rain|snow|off`. Pratinjau: tambahkan `?ambient=snow` ke alamat situs.

## Tautan sementara
Halaman Kendaraan, Destinasi, Jurnal, Kontak, dan Booking belum ada (Tahap 3-4). Tautan menu ke sana otomatis diarahkan ke bagian di beranda (`GN.href` di `public/js/core.js`). Hapus dari daftar `FALLBACK` saat halamannya jadi.

## Tahap 3
- Halaman publik baru: `/vehicles/` (cek ketersediaan per tanggal lewat `/api/availability`), `/gallery/` (desktop: indeks destinasi + pratinjau saat disorot; HP: chip + strip; semua: lightbox), `/journal/` dan `/journal/?slug=...` (isi Markdown ringan).
- Promo: kartu di beranda (`#promo`), tombol salin kode dan klaim via WhatsApp, popup otomatis untuk promo bertanda "Tampilkan sebagai popup". Pengaturan popup ada di `site_settings.promo_popup` (`enabled, delay_seconds, scroll_percent, once_per_session, snooze_days`).
- Admin umum dan Owner: menu Konten (Paket trip, Kendaraan + tanggal terpakai, Promo & kode, Artikel, Galeri + unggah banyak foto, Destinasi). Foto otomatis diperkecil ke WebP.
- Kendaraan: status tampil manual + tabel `vehicle_blocks` (tanggal terpakai) yang dipakai `vehicles_available`.
- Galeri: kolom `category` menjadi indeks destinasi di halaman galeri.

## Tahap 4
- `/contact/`: form Tanya / Booking trip / Sewa kendaraan -> `POST /api/message` (honeypot, batas kirim, kode promo opsional). Dukungan tautan `?package=slug`, `?vehicle=slug`, `?promo=KODE`, `?kind=booking`.
- Admin **Kotak masuk** (`#/pesan`): filter status (Baru, Dibalas, Selesai, Spam), detail pesan, tombol balas WhatsApp/email, catatan internal, lencana jumlah pesan baru (diperbarui tiap menit).
- Owner: **Riwayat versi** pada editor section dan pengaturan (30 versi terakhir, tombol Pulihkan).
- SEO: `/sitemap.xml` dan `/robots.txt` dinamis, canonical + Open Graph, JSON-LD (TravelAgency, TouristTrip + Offer, Article).
- Keamanan: CSP untuk halaman publik (`public/_headers`), CSP admin, cache JS/CSS 10 menit.
- Unggah gambar: semua format yang bisa dibaca browser diterima, diperkecil maks. 1600 px dan dikompres ke WebP (JPEG bila WebP tidak didukung).

## Live chat
`POST /api/chat` `{action:"start", name, contact?, body, lang}` -> `{ok, id, token}` (simpan `id` + `token`; hanya hash token yang disimpan di server).
`POST /api/chat` `{action:"send", id, token, body}` -> `{ok}`.
`GET /api/chat?id=&token=` -> `{ok, status:"open|closed", messages:[{id,sender:"visitor|staff",body,created_at}]}` (polling 4-15 detik).
Batas laju: 3 percakapan/10 menit per IP, 20 pesan/menit, 30 pesan/10 menit per percakapan. Field `hp` adalah honeypot.
Admin membaca/membalas lewat tabel `chat_threads` dan `chat_messages` (RLS: hanya staf), memakai JWT Supabase seperti tabel lain; aplikasi HP nantinya memakai jalur yang sama.
