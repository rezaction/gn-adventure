-- GoNEST — skema dasar (Tahap 1)
-- Jalankan di Supabase: SQL Editor > New query > tempel > Run.
-- Aman dijalankan ulang (idempotent) selama belum ada data penting.

create extension if not exists pgcrypto;

-- ============ Profil & peran ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '',
  role text not null default 'admin' check (role in ('owner','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.current_role_name() returns text
language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() and active $$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(public.current_role_name(), '') = 'owner' $$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(public.current_role_name(), '') in ('owner','admin') $$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ============ Tampilan (hanya Owner yang boleh mengubah) ============
-- site_settings: brand, contact, nav, footer, theme, seo  (nilai = jsonb)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- sections: satu baris per bagian halaman. fields = jsonb (lihat docs/API.md)
create table if not exists public.sections (
  id text primary key,                 -- contoh: home.hero
  page text not null,                  -- home, packages, ...
  kind text not null default 'text',   -- hero | text | cta | list | ...
  sort int not null default 0,
  visible boolean not null default true,
  fields jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create index if not exists sections_page_sort on public.sections(page, sort);

-- riwayat versi untuk site_settings & sections
create table if not exists public.revisions (
  id bigserial primary key,
  table_name text not null,
  row_key text not null,
  data jsonb not null,
  changed_by uuid,
  changed_at timestamptz not null default now()
);
create index if not exists revisions_lookup on public.revisions(table_name, row_key, changed_at desc);

create or replace function public.log_revision() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  k := to_jsonb(old) ->> case tg_table_name when 'site_settings' then 'key' else 'id' end;
  insert into public.revisions(table_name, row_key, data, changed_by)
  values (tg_table_name, k, to_jsonb(old), auth.uid());
  -- simpan 30 versi terakhir per baris
  delete from public.revisions r
   where r.table_name = tg_table_name and r.row_key = k
     and r.id not in (select id from public.revisions
                       where table_name = tg_table_name and row_key = k
                       order by changed_at desc, id desc limit 30);
  return coalesce(new, old);
end $$;

drop trigger if exists rev_site_settings on public.site_settings;
create trigger rev_site_settings before update or delete on public.site_settings
  for each row execute function public.log_revision();
drop trigger if exists rev_sections on public.sections;
create trigger rev_sections before update or delete on public.sections
  for each row execute function public.log_revision();

drop trigger if exists upd_site_settings on public.site_settings;
create trigger upd_site_settings before update on public.site_settings
  for each row execute function public.touch_updated_at();
drop trigger if exists upd_sections on public.sections;
create trigger upd_sections before update on public.sections
  for each row execute function public.touch_updated_at();

-- ============ Konten (Admin umum + Owner: CRUD penuh) ============
-- Teks dua bahasa disimpan sebagai jsonb {"id":"...","en":"..."}

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  region text,
  tagline jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  cover text,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  kind text not null default 'open' check (kind in ('open','private','family','custom')),
  destination_id uuid references public.destinations(id) on delete set null,
  duration_days int not null default 1 check (duration_days > 0),
  price_from numeric(14,0) check (price_from is null or price_from >= 0),
  price_note jsonb not null default '{}'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  itinerary jsonb not null default '[]'::jsonb,
  included jsonb not null default '[]'::jsonb,
  excluded jsonb not null default '[]'::jsonb,
  cover text,
  gallery jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists packages_status_sort on public.packages(status, sort);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null default 'mpv',
  seats int not null default 4 check (seats > 0),
  luggage int,
  features jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb,
  price_from numeric(14,0) check (price_from is null or price_from >= 0),
  price_note jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  photo text,
  status text not null default 'available' check (status in ('available','limited','booked','maintenance')),
  available_from date,
  status_note jsonb not null default '{}'::jsonb,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- jadwal terpakai (privat; publik hanya melihat hasil lewat vehicles_available)
create table if not exists public.vehicle_blocks (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  note text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists vehicle_blocks_lookup on public.vehicle_blocks(vehicle_id, start_date, end_date);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title jsonb not null default '{}'::jsonb,
  excerpt jsonb not null default '{}'::jsonb,
  body jsonb not null default '{}'::jsonb,      -- markdown per bahasa
  category text,
  tags jsonb not null default '[]'::jsonb,
  cover text,
  seo jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  author_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_status_pub on public.articles(status, published_at desc);

create table if not exists public.promos (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  terms jsonb not null default '{}'::jsonb,
  type text not null default 'percent' check (type in ('percent','fixed','perk')),
  value numeric(14,2) not null default 0 check (value >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  quota int check (quota is null or quota > 0),
  used int not null default 0 check (used >= 0),
  image text,
  show_popup boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);
create unique index if not exists promos_code_uq on public.promos(upper(code));

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image text not null,
  title jsonb not null default '{}'::jsonb,
  caption jsonb not null default '{}'::jsonb,
  location text,
  category text not null default 'umum',
  destination_id uuid references public.destinations(id) on delete set null,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- kotak pesan (dibuat lewat API server, tidak terbuka untuk publik)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'contact' check (kind in ('contact','booking','vehicle')),
  name text not null,
  contact text not null,
  subject text,
  body text,
  payload jsonb not null default '{}'::jsonb,
  promo_code text,
  status text not null default 'new' check (status in ('new','replied','done','spam')),
  note text,
  handled_by uuid references auth.users(id),
  handled_at timestamptz,
  ip_hash text,
  lang text,
  created_at timestamptz not null default now()
);
create index if not exists messages_status_created on public.messages(status, created_at desc);
create index if not exists messages_ip on public.messages(ip_hash, created_at desc);

do $$
declare t text;
begin
  foreach t in array array['destinations','packages','vehicles','articles','promos','gallery_items'] loop
    execute format('drop trigger if exists upd_%1$s on public.%1$s', t);
    execute format('create trigger upd_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ============ Row Level Security ============
alter table public.profiles       enable row level security;
alter table public.site_settings  enable row level security;
alter table public.sections       enable row level security;
alter table public.revisions      enable row level security;
alter table public.destinations   enable row level security;
alter table public.packages       enable row level security;
alter table public.vehicles       enable row level security;
alter table public.vehicle_blocks enable row level security;
alter table public.articles       enable row level security;
alter table public.promos         enable row level security;
alter table public.gallery_items  enable row level security;
alter table public.messages       enable row level security;

-- profiles
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_owner());
drop policy if exists profiles_owner_write on public.profiles;
create policy profiles_owner_write on public.profiles for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- tampilan: publik baca, staf baca semua, hanya owner tulis
drop policy if exists settings_pub on public.site_settings;
create policy settings_pub on public.site_settings for select to anon, authenticated using (true);
drop policy if exists settings_owner on public.site_settings;
create policy settings_owner on public.site_settings for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

drop policy if exists sections_pub on public.sections;
create policy sections_pub on public.sections for select to anon, authenticated using (visible);
drop policy if exists sections_staff_read on public.sections;
create policy sections_staff_read on public.sections for select to authenticated using (public.is_staff());
drop policy if exists sections_owner on public.sections;
create policy sections_owner on public.sections for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

drop policy if exists revisions_owner on public.revisions;
create policy revisions_owner on public.revisions for select to authenticated using (public.is_owner());

-- konten: publik baca yang aktif/terbit, staf (admin umum + owner) CRUD semua
drop policy if exists destinations_pub on public.destinations;
create policy destinations_pub on public.destinations for select to anon, authenticated using (active);
drop policy if exists packages_pub on public.packages;
create policy packages_pub on public.packages for select to anon, authenticated using (status = 'published');
drop policy if exists vehicles_pub on public.vehicles;
create policy vehicles_pub on public.vehicles for select to anon, authenticated using (active);
drop policy if exists articles_pub on public.articles;
create policy articles_pub on public.articles for select to anon, authenticated
  using (status = 'published' and (published_at is null or published_at <= now()));
drop policy if exists gallery_pub on public.gallery_items;
create policy gallery_pub on public.gallery_items for select to anon, authenticated using (active);
drop policy if exists promos_pub on public.promos;
create policy promos_pub on public.promos for select to anon, authenticated
  using (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())
         and (quota is null or used < quota));

do $$
declare t text;
begin
  foreach t in array array['destinations','packages','vehicles','vehicle_blocks','articles','promos','gallery_items','messages'] loop
    execute format('drop policy if exists %1$s_staff on public.%1$s', t);
    execute format('create policy %1$s_staff on public.%1$s for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;
-- catatan: vehicle_blocks dan messages tidak punya kebijakan publik, jadi anon tidak bisa membacanya.

-- ============ Fungsi untuk publik ============
-- Cek kode promo (tidak mengubah apa pun). Dipanggil via /api/promo.
create or replace function public.validate_promo(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r public.promos%rowtype;
begin
  select * into r from public.promos
   where upper(code) = upper(trim(p_code)) and active
     and (starts_at is null or starts_at <= now())
     and (ends_at is null or ends_at >= now())
     and (quota is null or used < quota)
   limit 1;
  if not found then return jsonb_build_object('valid', false); end if;
  return jsonb_build_object('valid', true, 'code', r.code, 'title', r.title,
    'type', r.type, 'value', r.value, 'ends_at', r.ends_at, 'terms', r.terms);
end $$;

-- Pakai kode promo (menambah 'used'); hanya boleh dipanggil server (service_role).
create or replace function public.claim_promo(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.promos set used = used + 1
   where upper(code) = upper(trim(p_code)) and active
     and (starts_at is null or starts_at <= now())
     and (ends_at is null or ends_at >= now())
     and (quota is null or used < quota);
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Ketersediaan kendaraan untuk rentang tanggal tertentu.
create or replace function public.vehicles_available(p_from date, p_to date default null)
returns table(vehicle_id uuid, available boolean)
language sql stable security definer set search_path = public as $$
  select v.id,
         (v.status in ('available','limited')
          and (v.available_from is null or v.available_from <= p_from)
          and not exists (
            select 1 from public.vehicle_blocks b
             where b.vehicle_id = v.id
               and b.start_date <= coalesce(p_to, p_from)
               and b.end_date >= p_from)) as available
    from public.vehicles v
   where v.active
$$;

revoke all on function public.claim_promo(text) from public, anon, authenticated;
grant execute on function public.claim_promo(text) to service_role;
grant execute on function public.validate_promo(text) to anon, authenticated;
grant execute on function public.vehicles_available(date, date) to anon, authenticated;

-- ============ Storage (foto) ============
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select using (bucket_id = 'media');
drop policy if exists media_insert on storage.objects;
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_staff());
drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_staff());
drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_staff());
