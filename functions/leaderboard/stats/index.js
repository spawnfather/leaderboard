const SUPABASE_URL = 'https://gzrsknywsqpfimeecydn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnNrbnl3c3FwZmltZWVjeWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzc3MDgsImV4cCI6MjA3NjY1MzcwOH0.hjBoZqa-BC41cnbknzwkM36mER2I-3gsk-hUp7CVaWA';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  if (url.pathname !== '/leaderboard/stats') {
    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
  }

  // Fetch total_servers (count) - Corrected to select=count and added Prefer header for exact count
  const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/leaderboardmain?select=count`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact',
    },
  });

  if (!countResponse.ok) {
    const errorBody = await countResponse.text();
    return new Response(JSON.stringify({ error: 'Failed to fetch total servers', details: errorBody }), { status: 500 });
  }

  const countData = await countResponse.json();
  const total_servers = countData[0].count;

  // Fetch total_members (sum) - Corrected to select=member_count.sum()
  const sumResponse = await fetch(`${SUPABASE_URL}/rest/v1/leaderboardmain?select=member_count.sum()`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!sumResponse.ok) {
    const errorBody = await sumResponse.text();
    return new Response(JSON.stringify({ error: 'Failed to fetch total members', details: errorBody }), { status: 500 });
  }

  const sumData = await sumResponse.json();
  const total_members = sumData[0].sum;

  // Fetch largest server
  const largestResponse = await fetch(`${SUPABASE_URL}/rest/v1/leaderboardmain?select=guild_id::text,server_name,member_count&order=member_count.desc&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!largestResponse.ok) {
    const errorBody = await largestResponse.text();
    return new Response(JSON.stringify({ error: 'Failed to fetch largest server', details: errorBody }), { status: 500 });
  }

  const largestData = await largestResponse.json();
  const largest_server = largestData.length > 0 ? {
    guild_id: largestData[0].guild_id,
    server_name: largestData[0].server_name,
    member_count: largestData[0].member_count
  } : null;

  // Fetch smallest server
  const smallestResponse = await fetch(`${SUPABASE_URL}/rest/v1/leaderboardmain?select=guild_id::text,server_name,member_count&order=member_count.asc&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!smallestResponse.ok) {
    const errorBody = await smallestResponse.text();
    return new Response(JSON.stringify({ error: 'Failed to fetch smallest server', details: errorBody }), { status: 500 });
  }

  const smallestData = await smallestResponse.json();
  const smallest_server = smallestData.length > 0 ? {
    guild_id: smallestData[0].guild_id,
    server_name: smallestData[0].server_name,
    member_count: smallestData[0].member_count
  } : null;

  // Compile stats
  const stats = {
    total_servers,
    total_members,
    largest_server,
    smallest_server
  };

  const prettyJson = JSON.stringify(stats, null, 2);

  return new Response(prettyJson, {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
