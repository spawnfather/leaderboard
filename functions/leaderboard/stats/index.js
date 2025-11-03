const SUPABASE_URL = 'https://gzrsknywsqpfimeecydn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnNrbnl3c3FwZmltZWVjeWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzc3MDgsImV4cCI6MjA3NjY1MzcwOH0.hjBoZqa-BC41cnbknzwkM36mER2I-3gsk-hUp7CVaWA';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  if (url.pathname !== '/leaderboard/stats') {
    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
  }

  // Fetch all necessary data in one query: guild_id, server_name, member_count, ordered by member_count desc
  const dataResponse = await fetch(`${SUPABASE_URL}/rest/v1/leaderboardmain?select=guild_id::text,server_name,member_count&order=member_count.desc`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!dataResponse.ok) {
    const errorBody = await dataResponse.text();
    return new Response(JSON.stringify({ error: 'Failed to fetch data', details: errorBody }), { status: 500 });
  }

  const data = await dataResponse.json();

  // Calculate total_servers
  const total_servers = data.length;

  // Calculate total_members
  const total_members = data.reduce((acc, row) => acc + (row.member_count || 0), 0);

  // Largest server (first in desc ordered list)
  const largest_server = data.length > 0 ? {
    guild_id: data[0].guild_id,
    server_name: data[0].server_name,
    member_count: data[0].member_count
  } : null;

  // Smallest server (last in desc ordered list)
  const smallest_server = data.length > 0 ? {
    guild_id: data[data.length - 1].guild_id,
    server_name: data[data.length - 1].server_name,
    member_count: data[data.length - 1].member_count
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
