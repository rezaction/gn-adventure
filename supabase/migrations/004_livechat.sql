-- Live chat: percakapan pengunjung <-> admin. Pengunjung TIDAK mengakses tabel langsung;
-- semua lewat Pages Functions (/api/chat) dengan token acak per percakapan (disimpan sebagai hash).
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  name text not null check (char_length(name) between 2 and 80),
  contact text check (contact is null or char_length(contact) <= 120),
  lang text not null default 'id' check (lang in ('id','en')),
  status text not null default 'open' check (status in ('open','closed')),
  unread_staff int not null default 0,
  last_msg_at timestamptz not null default now(),
  last_text text,
  ip_hash text,
  created_at timestamptz not null default now()
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender text not null check (sender in ('visitor','staff')),
  body text not null check (char_length(body) between 1 and 2000),
  staff_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_thread_idx on public.chat_messages(thread_id, created_at);
create index if not exists chat_threads_last_idx on public.chat_threads(last_msg_at desc);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
drop policy if exists chat_threads_staff on public.chat_threads;
create policy chat_threads_staff on public.chat_threads for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists chat_messages_staff on public.chat_messages;
create policy chat_messages_staff on public.chat_messages for all to authenticated using (public.is_staff()) with check (public.is_staff());

grant select, insert, update, delete on public.chat_threads, public.chat_messages to authenticated;
grant all on public.chat_threads, public.chat_messages to service_role;

-- Pengaturan live chat disimpan di pengaturan "chat" (kunci "live"); aman dijalankan ulang.
update public.site_settings set value = value || jsonb_build_object('live', $j${"enabled":true,"label":{"id":"Live chat","en":"Live chat"},"welcome":{"id":"Halo! Ada yang bisa kami bantu? Tulis pertanyaanmu, admin akan membalas di sini.","en":"Hi! How can we help? Write your question and our admin will reply here."},"offline":{"id":"Admin sedang tidak online. Tinggalkan nomor WhatsApp atau email, kami balas begitu kembali.","en":"Our admin is offline. Leave your WhatsApp number or email and we will reply as soon as we are back."},"start_hour":8,"end_hour":21}$j$::jsonb)
 where key = 'chat' and not (value ? 'live');
