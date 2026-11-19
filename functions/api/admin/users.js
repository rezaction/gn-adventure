import { json, handle, readJson, HttpError } from '../../_lib/http.js';
import { rest, requireOwner, authAdmin } from '../../_lib/supabase.js';

const ROLES = ['owner', 'admin'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nostore = { 'cache-control': 'no-store' };

// Hanya Owner. Admin umum dibuat/diatur dari sini (butuh kunci service di server).
export const onRequestGet = handle(async ({ env, request }) => {
  const { token } = await requireOwner(env, request);
  const rows = await rest(env, 'profiles?select=id,email,name,role,active,created_at&order=created_at.asc', { token });
  return json({ ok: true, data: rows }, 200, nostore);
});

export const onRequestPost = handle(async ({ env, request }) => {
  await requireOwner(env, request);
  const b = await readJson(request, 2000);
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 80) : '';
  const role = ROLES.includes(b.role) ? b.role : 'admin';
  if (!EMAIL.test(email)) throw new HttpError(400, 'Email tidak valid');
  if (name.length < 2) throw new HttpError(400, 'Nama minimal 2 karakter');
  if (typeof b.password !== 'string' || b.password.length < 10) throw new HttpError(400, 'Kata sandi minimal 10 karakter');
  const created = await authAdmin(env, 'users', { method: 'POST', body: { email, password: b.password, email_confirm: true } });
  try {
    await rest(env, 'profiles', { method: 'POST', service: true, body: { id: created.id, email, name, role, active: true } });
  } catch (e) {
    await authAdmin(env, `users/${created.id}`, { method: 'DELETE' }).catch(() => {}); // batalkan agar tidak ada akun yatim
    throw e;
  }
  return json({ ok: true, id: created.id }, 201, nostore);
});

export const onRequestPatch = handle(async ({ env, request }) => {
  const { profile: me } = await requireOwner(env, request);
  const b = await readJson(request, 2000);
  if (!UUID.test(b.id || '')) throw new HttpError(400, 'id tidak valid');
  const patch = {};
  if (typeof b.name === 'string') patch.name = b.name.trim().slice(0, 80);
  if (b.role !== undefined) { if (!ROLES.includes(b.role)) throw new HttpError(400, 'Peran tidak valid'); patch.role = b.role; }
  if (b.active !== undefined) patch.active = !!b.active;
  if (b.id === me.id && ((patch.role && patch.role !== 'owner') || patch.active === false)) throw new HttpError(400, 'Kamu tidak bisa menurunkan atau menonaktifkan akunmu sendiri');
  if (b.password !== undefined) {
    if (typeof b.password !== 'string' || b.password.length < 10) throw new HttpError(400, 'Kata sandi minimal 10 karakter');
    await authAdmin(env, `users/${b.id}`, { method: 'PUT', body: { password: b.password } });
  }
  if (Object.keys(patch).length) await rest(env, `profiles?id=eq.${b.id}`, { method: 'PATCH', service: true, body: patch });
  return json({ ok: true }, 200, nostore);
});

export const onRequestDelete = handle(async ({ env, request }) => {
  const { profile: me } = await requireOwner(env, request);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!UUID.test(id)) throw new HttpError(400, 'id tidak valid');
  if (id === me.id) throw new HttpError(400, 'Kamu tidak bisa menghapus akunmu sendiri');
  await authAdmin(env, `users/${id}`, { method: 'DELETE' }); // profil ikut terhapus (on delete cascade)
  return json({ ok: true }, 200, nostore);
});
