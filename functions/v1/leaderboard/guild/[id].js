import { supabase } from '../../../_supabase.js';
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
  const { id } = context.params;
  if (!/^\d+$/.test(id)) return json({ error: 'Invalid guild_id' }, 400);

  const { data, error } = await supabase
    .from('leaderboardmain')
    .select('guild_id, server_name, last_updated, invite_code')
    .eq('guild_id', id)
    .single();

  if (!data) return json({ error: 'Guild not found' }, 404);
  if (error) return json({ error: error.message }, 500);
  return json({ data });
}
