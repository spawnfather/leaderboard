import { supabase } from '../../_supabase.js';
function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
export const onRequestOptions = () => json(null, 204);

export async function onRequest(context) {
  const n = parseInt(context.params.n, 10);
  if (isNaN(n) || n < 1 || n > 100) return json({ error: 'n must be 1-100' }, 400);

  const { data, error } = await supabase
    .from('leaderboardmain')
    .select('guild_id, server_name, last_updated, invite_code')
    .order('last_updated', { ascending: false })
    .limit(n);

  if (error) return json({ error: error.message }, 500);
  return json({ data });
}
