import { HttpError } from './http.js';

function cfg(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new HttpError(500, 'Server belum dikonfigurasi (SUPABASE_URL / SUPABASE_ANON_KEY)');
  return { url: env.SUPABASE_URL.replace(/\/$/, ''), anon: env.SUPABASE_ANON_KEY };
}

// Panggilan REST ke PostgREST. token = JWT pengguna (opsional); service = pakai kunci service_role.
export async function rest(env, path, { method = 'GET', body, token, service = false, prefer } = {}) {
  const { url, anon } = cfg(env);
  let key = anon;
  if (service) {
    if (!env.SUPABASE_SERVICE_KEY) throw new HttpError(500, 'SUPABASE_SERVICE_KEY belum diatur');
    key = env.SUPABASE_SERVICE_KEY;
  }
  const headers = { apikey: key, authorization: `Bearer ${token || key}` };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (prefer) headers.prefer = prefer;
  const res = await fetch(`${url}/rest/v1/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) {
    const err = new HttpError(res.status === 401 || res.status === 403 ? 403 : 502, (data && data.message) || 'Gagal membaca data');
    err.detail = data;
    throw err;
  }
  return data;
}

export const rpc = (env, fn, args, opts = {}) => rest(env, `rpc/${fn}`, { method: 'POST', body: args || {}, ...opts });

// Verifikasi JWT ke Supabase Auth, lalu ambil peran dari tabel profiles (RLS: baris sendiri).
export async function authUser(env, request) {
  const { url, anon } = cfg(env);
  const h = request.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'Silakan login');
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, authorization: `Bearer ${token}` } });
  if (!res.ok) throw new HttpError(401, 'Sesi tidak valid atau kedaluwarsa');
  const user = await res.json();
  const rows = await rest(env, `profiles?select=id,email,name,role,active&id=eq.${encodeURIComponent(user.id)}`, { token });
  const profile = Array.isArray(rows) ? rows[0] : null;
  if (!profile || !profile.active) throw new HttpError(403, 'Akun tidak memiliki akses admin');
  return { token, user, profile };
}

export async function requireStaff(env, request) { return authUser(env, request); }
export async function requireOwner(env, request) {
  const a = await authUser(env, request);
  if (a.profile.role !== 'owner') throw new HttpError(403, 'Hanya Owner yang boleh melakukan ini');
  return a;
}

// Admin API Supabase Auth (butuh service key): buat / ubah / hapus pengguna.
export async function authAdmin(env, path, { method = 'GET', body } = {}) {
  const { url } = cfg(env);
  if (!env.SUPABASE_SERVICE_KEY) throw new HttpError(500, 'SUPABASE_SERVICE_KEY belum diatur');
  const res = await fetch(`${url}/auth/v1/admin/${path}`, {
    method,
    headers: { apikey: env.SUPABASE_SERVICE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) throw new HttpError(res.status === 422 || res.status === 400 ? 400 : 502, (data && (data.msg || data.message)) || 'Gagal memproses pengguna');
  return data;
}
