const SUPABASE_URL = 'https://gzrsknywsqpfimeecydn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnNrbnl3c3FwZmltZWVjeWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzc3MDgsImV4cCI6MjA3NjY1MzcwOH0.hjBoZqa-BC41cnbknzwkM36mER2I-3gsk-hUp7CVaWA';

export async function onRequest(context) {
  const { amount } = context.params;  // [amount] is dynamic
  const limit = parseInt(amount, 10);

  if (isNaN(limit) || limit <= 0 || limit > 100) {  // Safe limits
    const errorJson = JSON.stringify({ error: 'Invalid amount (1-100)' }, null, 2);
    return new Response(errorJson, {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboardmain?select=*&order=member_count.desc&limit=${limit}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorJson = JSON.stringify({ error: 'Failed to fetch data' }, null, 2);
    return new Response(errorJson, {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const data = await response.json();

  // Pretty-print the successful response
  const prettyJson = JSON.stringify(data, null, 2);

  return new Response(prettyJson, {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
