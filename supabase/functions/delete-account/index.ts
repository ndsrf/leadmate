// Deletes the calling user's account. Deleting the auth.users row cascades to public.dogs.
// Deploy with: supabase functions deploy delete-account
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const authorization = req.headers.get('Authorization');
  if (!authorization) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  // who is calling: the user's own token, never a client-supplied id
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const { data, error } = await asUser.auth.getUser();
  if (error || !data.user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error: failed } = await admin.auth.admin.deleteUser(data.user.id);
  if (failed) return new Response(JSON.stringify({ error: failed.message }), { status: 500, headers: cors });
  return new Response(JSON.stringify({ deleted: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
