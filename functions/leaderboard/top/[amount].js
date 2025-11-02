export async function onRequest(context) {
  const { amount } = context.params;  // [amount] is dynamic
  const limit = parseInt(amount, 10);

  if (isNaN(limit) || limit <= 0 || limit > 100) {  // Safe limits
    return new Response(JSON.stringify({ error: 'Invalid amount (1-100)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = 'https://gzrsknywsqpfimeecydn.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnNrbnl3c3FwZmltZWVjeWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzc3MDgsImV4cCI6MjA3NjY1MzcwOH0.hjBoZqa-BC41cnbknzwkM36mER2I-3gsk-hUp7CVaWA';

  const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?select=*&order=member_count.desc&limit=${limit}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), { status: 500 });
  }

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
