-- Hak akses tingkat tabel untuk Data API Supabase. Di proyek baru, tabel buatan SQL tidak otomatis
-- terbuka ke peran API, sehingga muncul "permission denied for table ...". Keamanan baris tetap dijaga RLS.
grant usage on schema public to anon, authenticated, service_role;

grant select on public.site_settings, public.sections, public.destinations, public.packages,
  public.vehicles, public.articles, public.promos, public.gallery_items to anon;

grant select, insert, update, delete on public.profiles, public.site_settings, public.sections,
  public.destinations, public.packages, public.vehicles, public.vehicle_blocks, public.articles,
  public.promos, public.gallery_items, public.messages to authenticated;
grant select on public.revisions to authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
