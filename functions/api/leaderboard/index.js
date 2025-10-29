// functions/api/leaderboard/[...all].js
function buildUrl(SUPABASE_URL, limit) {
  const base = `${SUPABASE_URL}/rest/v1/leaderboardmain`;
  const params = new URLSearchParams({
    select: 'guild_id,server_name,member_count,last_updated,invite_code',
    order: 'member_count.desc',
  });
  if (limit !== null) params.append('limit', limit.toString());
  return `${base}?${params.toString()}`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

  // /api/leaderboard/all
  if (url.pathname === '/api/leaderboard/all') {
    const res = await fetch(buildUrl(SUPABASE_URL, null), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data, count: data.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // /api/leaderboard/top/10
  const match = url.pathname.match(/^\/api\/leaderboard\/top\/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num < 1 || num > 10000) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid number' }), { status: 400 });
    }
    const res = await fetch(buildUrl(SUPABASE_URL, num), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data, count: data.length, requested: num }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: false, error: 'Not found' }), { status: 404 });
}
