// functions/api/leaderboard.js
function buildUrl(SUPABASE_URL, limit) {
  const base = `${SUPABASE_URL}/rest/v1/leaderboardmain`;
  const params = new URLSearchParams({
    select: 'guild_id,server_name,member_count,last_updated,invite_code',
    order: 'member_count.desc',
  });
  if (limit !== null) {
    params.append('limit', limit.toString());
  }
  return `${base}?${params.toString()}`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

  if (url.pathname === '/api/leaderboard/all') {
    const supabaseUrl = buildUrl(SUPABASE_URL, null);
    const res = await fetch(supabaseUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch full leaderboard' }), { 
        status: res.status, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data, count: data.length, timestamp: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    });
  }

  const topMatch = url.pathname.match(/^\/api\/leaderboard\/top\/(\d+)$/);
  if (topMatch) {
    const num = parseInt(topMatch[1], 10);
    if (num < 1 || num > 10000) {
      return new Response(JSON.stringify({ success: false, error: 'Number must be between 1 and 10,000' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    const supabaseUrl = buildUrl(SUPABASE_URL, num);
    const res = await fetch(supabaseUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch top leaderboard' }), { 
        status: res.status, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data, count: data.length, requested: num, timestamp: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    });
  }

  return new Response(JSON.stringify({ success: false, error: 'Not found' }), { 
    status: 404, 
    headers: { 'Content-Type': 'application/json' } 
  });
}
