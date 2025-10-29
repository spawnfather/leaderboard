// ---------------------------------------------------------------
// Cloudflare Pages Function (Worker)
// Handles /api/leaderboard/all  and  /api/leaderboard/top/:num
// ---------------------------------------------------------------

/**
 * Helper: build the Supabase REST URL for a given limit.
 * @param {number|null} limit  null = no limit (all rows)
 */
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

/**
 * Main entry point – Pages Functions call `onRequest`
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

  // -------------------------------------------------------------
  // 1. /api/leaderboard/all
  // -------------------------------------------------------------
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
      return jsonError('Failed to fetch full leaderboard', res.status);
    }

    const data = await res.json();
    return jsonResponse({ data, count: data.length });
  }

  // -------------------------------------------------------------
  // 2. /api/leaderboard/top/:number
  // -------------------------------------------------------------
  const topMatch = url.pathname.match(/^\/api\/leaderboard\/top\/(\d+)$/);
  if (topMatch) {
    const num = parseInt(topMatch[1], 10);
    if (num < 1 || num > 10_000) {
      return jsonError('Number must be between 1 and 10,000', 400);
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
      return jsonError('Failed to fetch top leaderboard', res.status);
    }

    const data = await res.json();
    return jsonResponse({ data, count: data.length, requested: num });
  }

  // -------------------------------------------------------------
  // 404 – unknown path
  // -------------------------------------------------------------
  return jsonError('Not found', 404);
}

// -----------------------------------------------------------------
// Tiny helpers to keep the code tidy
// -----------------------------------------------------------------
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify({ success: true, ...body, timestamp: new Date().toISOString() }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}

function jsonError(message, status = 500) {
  return new Response(JSON.stringify({ success: false, error: message, timestamp: new Date().toISOString() }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
