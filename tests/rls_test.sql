\set ON_ERROR_STOP on
-- helper assert
create or replace function pg_temp.ok(cond boolean, msg text) returns void language plpgsql as
$$ begin if not coalesce(cond,false) then raise exception 'GAGAL: %', msg; end if; end $$;
grant execute on function pg_temp.ok(boolean,text) to public;

-- pengguna
insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-0000000000a1','owner@x.id'),
 ('00000000-0000-0000-0000-0000000000a2','admin@x.id'),
 ('00000000-0000-0000-0000-0000000000a3','nobody@x.id');
insert into public.profiles(id,email,name,role) values
 ('00000000-0000-0000-0000-0000000000a1','owner@x.id','Owner','owner'),
 ('00000000-0000-0000-0000-0000000000a2','admin@x.id','Admin','admin');

-- data uji (sebagai superuser)
insert into public.vehicles(slug,name,seats,status) values ('v1','MPV',6,'available'),('v2','Bus',30,'maintenance'),('v3','Hidden',4,'available');
update public.vehicles set active=false where slug='v3';
insert into public.vehicle_blocks(vehicle_id,start_date,end_date,note)
 select id,'2026-12-20','2026-12-24','rahasia' from public.vehicles where slug='v1';
insert into public.articles(slug,status,published_at) values ('a-draft','draft',null),('a-pub','published',now()-interval '1 day'),('a-future','published',now()+interval '1 day');
insert into public.promos(code,type,value,starts_at,ends_at,quota,used) values
 ('HEMAT10','percent',10,now()-interval '1 day',now()+interval '5 days',2,0),
 ('EXPIRED','percent',5,now()-interval '9 days',now()-interval '1 day',null,0),
 ('FULL','fixed',50000,null,null,1,1);
insert into public.packages(slug,status) values ('p-draft','draft'),('p-pub','published');
insert into public.messages(name,contact) values ('Tamu','08123');

-- ===== ANON =====
set role anon;
select pg_temp.ok((select count(*) from public.articles)=1, 'anon hanya melihat artikel terbit (bukan draft/masa depan)');
select pg_temp.ok((select count(*) from public.packages)=1, 'anon hanya melihat paket terbit');
select pg_temp.ok((select count(*) from public.vehicles)=2, 'anon hanya melihat kendaraan aktif');
select pg_temp.ok((select count(*) from public.promos)=1, 'anon hanya melihat promo yang berlaku');
select pg_temp.ok((select count(*) from public.vehicle_blocks)=0, 'anon tidak bisa lihat jadwal blok kendaraan');
select pg_temp.ok((select count(*) from public.messages)=0, 'anon tidak bisa lihat pesan');
select pg_temp.ok((select count(*) from public.profiles)=0, 'anon tidak bisa lihat profil');
select pg_temp.ok((select count(*) from public.site_settings)>=7, 'anon bisa baca pengaturan');
select pg_temp.ok((select count(*) from public.sections)>=7, 'anon bisa baca section tampil');
select pg_temp.ok((public.validate_promo('hemat10')->>'valid')::boolean, 'promo valid (case-insensitive)');
select pg_temp.ok(not (public.validate_promo('EXPIRED')->>'valid')::boolean, 'promo kedaluwarsa ditolak');
select pg_temp.ok(not (public.validate_promo('FULL')->>'valid')::boolean, 'promo kuota habis ditolak');
select pg_temp.ok(not (public.validate_promo('NOPE')->>'valid')::boolean, 'promo tak dikenal ditolak');
select pg_temp.ok((select available from public.vehicles_available('2026-12-22') a join public.vehicles v on v.id=a.vehicle_id where v.slug='v1')=false, 'v1 terblokir 22 Des');
select pg_temp.ok((select available from public.vehicles_available('2026-12-25') a join public.vehicles v on v.id=a.vehicle_id where v.slug='v1')=true, 'v1 kosong 25 Des');
select pg_temp.ok((select available from public.vehicles_available('2026-12-19','2026-12-21') a join public.vehicles v on v.id=a.vehicle_id where v.slug='v1')=false, 'rentang yang beririsan terblokir');
select pg_temp.ok((select available from public.vehicles_available('2026-12-25') a join public.vehicles v on v.id=a.vehicle_id where v.slug='v2')=false, 'maintenance tidak tersedia');
select pg_temp.ok((select count(*) from public.vehicles_available('2026-12-25'))=2, 'kendaraan nonaktif tidak muncul');
do $$ begin begin perform public.claim_promo('HEMAT10'); raise exception 'GAGAL: anon bisa claim_promo'; exception when insufficient_privilege then null; end; end $$;
do $$ begin begin insert into public.articles(slug) values ('x'); raise exception 'GAGAL: anon bisa insert artikel'; exception when insufficient_privilege or others then if sqlerrm like 'GAGAL%' then raise; end if; end; end $$;
reset role;

-- ===== NOBODY (login tapi bukan staf) =====
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';
select pg_temp.ok((select count(*) from public.messages)=0, 'non-staf tidak bisa lihat pesan');
select pg_temp.ok((select count(*) from public.articles)=1, 'non-staf = publik');
do $$ begin begin update public.site_settings set value='{}' where key='brand'; if found then raise exception 'GAGAL: non-staf mengubah brand'; end if; end; end $$;
reset role;

-- ===== ADMIN UMUM =====
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
select pg_temp.ok((select count(*) from public.articles)=3, 'admin umum melihat semua artikel');
select pg_temp.ok((select count(*) from public.messages)=1, 'admin umum melihat pesan');
select pg_temp.ok((select count(*) from public.vehicle_blocks)=1, 'admin umum melihat blok kendaraan');
insert into public.promos(code,title,type,value) values ('BARU','{"id":"Baru"}','percent',15);
insert into public.vehicles(slug,name,seats) values ('v9','Baru',4);
update public.vehicles set status='booked' where slug='v1';
insert into public.vehicle_blocks(vehicle_id,start_date,end_date) select id,'2027-01-01','2027-01-02' from public.vehicles where slug='v9';
delete from public.articles where slug='a-draft';
insert into public.gallery_items(image) values ('x.webp');
insert into public.packages(slug,status) values ('p-baru','draft');
insert into public.destinations(slug,name) values ('bali','Bali');
update public.messages set status='replied';
-- tampilan: tidak boleh
update public.site_settings set value='{"x":1}' where key='brand';
select pg_temp.ok((select value ? 'x' from public.site_settings where key='brand')=false, 'admin umum TIDAK bisa ubah brand');
update public.sections set visible=false where id='home.hero';
select pg_temp.ok((select visible from public.sections where id='home.hero')=true, 'admin umum TIDAK bisa ubah section');
do $$ begin begin insert into public.sections(id,page) values ('x.y','x'); raise exception 'GAGAL: admin umum insert section'; exception when others then if sqlerrm like 'GAGAL%' then raise; end if; end; end $$;
do $$ begin begin insert into public.profiles(id,role) values ('00000000-0000-0000-0000-0000000000a3','owner'); raise exception 'GAGAL: admin umum bikin profil owner'; exception when others then if sqlerrm like 'GAGAL%' then raise; end if; end; end $$;
select pg_temp.ok((select count(*) from public.profiles)=1, 'admin umum hanya melihat profil sendiri');
select pg_temp.ok((select count(*) from public.revisions)=0, 'admin umum tidak melihat riwayat');
-- storage
insert into storage.objects(bucket_id,name) values ('media','a/b.webp');
reset role;

-- ===== OWNER =====
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
update public.sections set visible=false, fields = jsonb_set(fields,'{heading,id}','"Baru"') where id='home.hero';
select pg_temp.ok((select visible from public.sections where id='home.hero')=false, 'owner bisa ubah section');
select pg_temp.ok((select count(*) from public.sections where visible)=6, 'section tersembunyi dihitung benar');
update public.site_settings set value = value || '{"name":"GoNEST X"}' where key='brand';
select pg_temp.ok((select count(*) from public.revisions where table_name='sections' and row_key='home.hero')=1, 'riwayat versi section tercatat');
select pg_temp.ok((select count(*) from public.revisions where table_name='site_settings' and row_key='brand')=1, 'riwayat versi brand tercatat');
select pg_temp.ok((select count(*) from public.profiles)=2, 'owner melihat semua profil');
insert into public.profiles(id,email,role) values ('00000000-0000-0000-0000-0000000000a3','nobody@x.id','admin');
select pg_temp.ok((select count(*) from public.articles)=2, 'owner CRUD artikel (a-draft sudah dihapus admin)');
reset role;

-- nonaktifkan admin -> kehilangan akses
update public.profiles set active=false where email='admin@x.id';
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
select pg_temp.ok((select count(*) from public.messages)=0, 'admin nonaktif kehilangan akses');
reset role;

-- service_role: claim promo
set role service_role;
select pg_temp.ok(public.claim_promo('HEMAT10'), 'claim #1 berhasil');
select pg_temp.ok(public.claim_promo('HEMAT10'), 'claim #2 berhasil');
select pg_temp.ok(not public.claim_promo('HEMAT10'), 'claim #3 ditolak (kuota 2)');
reset role;
select pg_temp.ok(not (public.validate_promo('HEMAT10')->>'valid')::boolean, 'promo habis setelah kuota terpakai');
-- batas riwayat 30
do $$ declare i int; begin for i in 1..40 loop update public.site_settings set value=value||jsonb_build_object('n',i) where key='seo'; end loop; end $$;
select pg_temp.ok((select count(*) from public.revisions where table_name='site_settings' and row_key='seo')=30, 'riwayat dibatasi 30 versi');
