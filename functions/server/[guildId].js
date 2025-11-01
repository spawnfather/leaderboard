const SUPABASE_URL = 'https://gzrsknywsqpfimeecydn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnNrbnl3c3FwZmltZWVjeWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzc3MDgsImV4cCI6MjA3NjY1MzcwOH0.hjBoZqa-BC41cnbknzwkM36mER2I-3gsk-hUp7CVaWA';

export async function onRequest({ params }) {
  const guildId = params.guildId;

  // Try to get from Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboardmain?guild_id=eq.${guildId}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok || res.status === 204) {
      return new Response(notFoundHTML(), { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    const [server] = await res.json();
    if (!server) {
      return new Response(notFoundHTML(), { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    return new Response(renderPage(server), { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    console.error(err);
    return new Response(errorHTML(), { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}

// ──────────────────────────────────────────────────────────────
// HTML with inline Supabase client (IIFE) + fetch
// ──────────────────────────────────────────────────────────────
function renderPage(s) {
  // -------------------------------------------------
  // 1. Avatar fallback (text + background color)
  // -------------------------------------------------
  const words = (s.server_name || '').trim().split(/\s+/);
  const initials = words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : (words[0]?.slice(0, 2) || '??').toUpperCase();

  // Simple hash → hue for a consistent colour per server
  let hash = 0;
  for (let i = 0; i < s.guild_id.length; i++) hash = (hash * 31 + s.guild_id.charCodeAt(i)) & 0xffffffff;
  const hue = Math.abs(hash) % 360;
  const avatarStyle = `background:hsl(${hue},70%,55%);color:#fff;`;

  const updated = new Date(s.last_updated).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // -------------------------------------------------
  // 2. HTML (no <img> tags, fully responsive)
  // -------------------------------------------------
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(s.server_name)} – Spawn Board</title>
  <link rel="stylesheet" href="/template/styles.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
  <style>
    /* -------------------------------------------------
       Profile-page specific overrides (kept tiny)
       ------------------------------------------------- */
    .profile-layout{display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;max-width:1200px;margin:0 auto;padding:1.5rem;}
    .avatar{display:flex;align-items:center;justify-content:center;width:128px;height:128px;border-radius:50%;font-size:3rem;font-weight:700;
            text-shadow:0 1px 2px rgba(0,0,0,.3);flex-shrink:0;}
    .info{flex:1;min-width:260px;}
    .info h1{margin:0 0 .5rem;font-size:2.2rem;color:#007bff;}
    .info p{margin:0.4rem 0;font-size:1rem;}
    .info a{color:#007bff;font-weight:600;text-decoration:none;}
    .info a:hover{text-decoration:underline;}
    @media(max-width:600px){.avatar{width:96px;height:96px;font-size:2.2rem;}}
  </style>
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
      <input type="checkbox" id="dark-toggle"><span class="slider"></span>
    </label>
  </div>

  <section class="profile-layout">
    <!-- Text avatar -->
    <div class="avatar" style="${avatarStyle}">${esc(initials)}</div>

    <div class="info">
      <h1>${esc(s.server_name)}</h1>
      <p><strong>Members:</strong> ${s.member_count.toLocaleString()}</p>
      <p><strong>Online:</strong> ${s.online_count.toLocaleString()}</p>
      <p><strong>Updated:</strong> ${updated}</p>
      ${s.server_desc ? `<p>${esc(s.server_desc)}</p>` : ''}
      <p><a href="https://discord.com/servers/${s.guild_id}" target="_blank" rel="noopener">
        View on Discord
      </a></p>
    </div>
  </section>

  <footer>© 2025 SpawnBoard. All rights reserved.</footer>

  <script>
    // Dark-mode toggle (unchanged)
    const t = document.getElementById('dark-toggle');
    if (localStorage.getItem('darkTheme') === 'true') {
      document.body.classList.add('dark-theme'); t.checked = true;
    }
    t.addEventListener('change', () => {
      document.body.classList.toggle('dark-theme', t.checked);
      localStorage.setItem('darkTheme', t.checked);
    });
  </script>
</body>
</html>`;
}

function notFoundHTML() {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>404</title><link rel="stylesheet" href="/template/styles.css"></head>
<body><div class="container" style="text-align:center;padding:4rem;">
  <h1>404</h1><p>Server not found.</p>
  <a href="/" style="color:#007bff;">Back</a>
</div></body></html>`;
}

function errorHTML() {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Error</title><link rel="stylesheet" href="/template/styles.css"></head>
<body><div class="container" style="text-align:center;padding:4rem;">
  <h1>Error</h1><p>Could not load server.</p>
  <a href="/" style="color:#007bff;">Back</a>
</div></body></html>`;
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[c]);
}
