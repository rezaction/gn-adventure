import { json, handle } from '../../_lib/http.js';
import { authUser } from '../../_lib/supabase.js';
export const onRequestGet = handle(async ({ env, request }) => {
  const { profile } = await authUser(env, request);
  return json({ ok: true, profile }, 200, { 'cache-control': 'no-store' });
});
