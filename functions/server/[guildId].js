// ──────────────────────────────────────────────────────────────
//  functions/server/[guildId].js
//  No npm, no build step – works on mobile
// ──────────────────────────────────────────────────────────────

// 1. Load the IIFE build of Supabase (once per isolate)
const SUPABASE_SCRIPT = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.min.js';
let supabaseClient = null;

async function getSupabase() {
  if (supabaseClient) return supabaseClient;

  // Workers cannot use <script> tags, so we fetch the script and eval it
  const res = await fetch(SUPABASE_SCRIPT);
  const code = await res.text();
  // Create a tiny function scope so `Supabase` is defined
  const init = new Function(code + '; return Supabase;');
  const Supabase = init();

  const SUPABASE_URL = 'https://gzrsknywsqpfimeecydn.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnNrbnl3c3FwZmltZWVjeWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzc3MDgsImV4cCI6MjA3NjY1MzcwOH0.hjBoZqa-BC41cnbknzwkM36mER2I-3gsk-hUp7CVaWA';

  supabaseClient = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

// ──────────────────────────────────────────────────────────────
// 2. Main request handler
// ──────────────────────────────────────────────────────────────
export async function onRequest({ params }) {
  const guildId = params.guildId;

  const supabase = await getSupabase();
  const { data: server, error } = await supabase
    .from('leaderboardmain')
    .select('guild_id, server_name, member_count, server_desc, online_count, last_updated')
    .eq('guild_id', guildId)
    .single();

  // ───── 404 ─────
  if (error || !server) {
    return new Response(notFoundHTML(), {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // ───── Render page ─────
  return new Response(renderServerHTML(server), {
    headers: { 'Content-Type': 'text/html' },
  });
}

// ──────────────────────────────────────────────────────────────
// 3. HTML templates (uses your existing /template/styles.css)
// ──────────────────────────────────────────────────────────────
function notFoundHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>404 – Server Not Found</title>
  <link rel="stylesheet" href="/template/styles.css">
</head>
<body>
  <header>
    <div class="nav-container">
      <nav><ul>
        <li><a href="/">Leaderboard</a></li>
        <li><a href="/submit">Submit Server</a></li>
      </ul></nav>
    </div>
  </header>

  <div class="toggle-container">
    <label for="dark-toggle">Dark Theme</label>
    <label class="toggle-switch">
      <input type="checkbox" id="dark-toggle">
      <span class="slider"></span>
    </label>
  </div>

  <div class="container" style="text-align:center;padding:4rem;">
    <h1>404</h1>
    <p>This server is not on the leaderboard.</p>
    <a href="/" style="color:#007bff;">Back to Leaderboard</a>
  </div>

  <footer>&copy; 2025 SpawnBoard. All rights reserved.</footer>

  <script>
    const t = document.getElementById('dark-toggle');
    if (localStorage.getItem('darkTheme')==='true') { document.body.classList.add('dark-theme'); t.checked=true; }
    t.addEventListener('change',()=>{ document.body.classList.toggle('dark-theme',t.checked); localStorage.setItem('darkTheme',t.checked); });
  </script>
</body>
</html>`;
}

function renderServerHTML(s) {
  const icon = `https://cdn.discordapp.com/icons/${s.guild_id}/${s.guild_id}.webp?size=256`;
  const fallback = 'https://cdn.discordapp.com/embed/avatars/0.png';
  const updated = new Date(s.last_updated).toLocaleString('en-US', {
    year:'numeric', month:'short', day:'numeric',
    hour:'2-digit', minute:'2-digit'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(s.server_name)} – Spawn Board</title>
  <meta property="og:title" content="${esc(s.server_name)}">
  <meta property="og:description" content="${esc(s.server_desc||'Discord server on Spawn Board')}">
  <meta property="og:image" content="${icon}">
  <link rel="stylesheet" href="/template/styles.css">
</head>
<body>
  <header>
    <div class="nav-container">
      <nav><ul>
        <li><a href="/">Leaderboard</a></li>
        <li><a href="/submit">Submit Server</a></li>
      </ul></nav>
    </div>
  </header>

  <div class="toggle-container">
    <label for="dark-toggle">Dark Theme</label>
    <label class="toggle-switch">
      <input type="checkbox" id="dark-toggle">
      <span class="slider"></span>
    </label>
  </div>

  <div class="container" style="display:flex;gap:2rem;align-items:flex-start;flex-wrap:wrap;">
    <img src="${icon}" onerror="this.src='${fallback}'"
         alt="${esc(s.server_name)}" style="width:128px;height:128px;border-radius:50%;object-fit:cover;">
    <div style="flex:1;min-width:260px;">
      <h1>${esc(s.server_name)}</h1>
      <p><strong>Members:</strong> ${s.member_count.toLocaleString()}</p>
      <p><strong>Online:</strong> ${s.online_count.toLocaleString()}</p>
      <p><strong>Last Updated:</strong> ${updated}</p>
      ${s.server_desc ? `<p>${esc(s.server_desc)}</p>` : ''}
      <p>
        <a href="https://discord.com/servers/${s.guild_id}" target="_blank" rel="noopener"
           style="color:#007bff;font-weight:600;">View on Discord</a>
      </p>
    </div>
  </div>

  <footer>&copy; 2025 SpawnBoard. All rights reserved.</footer>

  <script>
    const t = document.getElementById('dark-toggle');
    if (localStorage.getItem('darkTheme')==='true') { document.body.classList.add('dark-theme'); t.checked=true; }
    t.addEventListener('change',()=>{ document.body.classList.toggle('dark-theme',t.checked); localStorage.setItem('darkTheme',t.checked); });
  </script>
</body>
</html>`;
}

// Tiny HTML escaper
function esc(s) {
  return String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[c]);
}
