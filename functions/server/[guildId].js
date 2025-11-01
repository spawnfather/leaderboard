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
  const icon = s.icon_hash ? `https://cdn.discordapp.com/icons/${s.guild_id}/${s.icon_hash}.webp?size=256` : 'https://cdn.discordapp.com/embed/avatars/0.png';

  const banner = s.banner_hash ? `https://cdn.discordapp.com/banners/${s.guild_id}/${s.banner_hash}.webp?size=1024` : null;
  
  const fallback = 'https://cdn.discordapp.com/embed/avatars/0.png';
  const updated = new Date(s.last_updated).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta property="og:title" content="${esc(s.server_name)} – Spawn Board">
  <meta property="og:description" content="${s.server_desc ? esc(s.server_desc).substring(0, 200) : 'A Discord server on Spawn Board'}">
  <meta property="og:image" content="${icon}">
  <meta property="og:url" content="https://spawnboard.pages.dev/server/${s.guild_id}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(s.server_name)} – Spawn Board</title>
  <link rel="stylesheet" href="/template/styles.css">
  <!-- Load Supabase IIFE -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
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

  <div class="container">
    ${banner ? `
      <div style="width:100%;height:200px;border-radius:12px;overflow:hidden;margin-bottom:1.5rem;background:#000;">
        <img src="${banner}" 
             alt="Server banner" 
             style="width:100%;height:100%;object-fit:cover;"
             onerror="this.style.display='none'; this.parentElement.style.background='#2c2c2c';">
      </div>
    ` : ''}

    <div style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;">
      <img src="${icon}" 
           alt="Server icon" 
           style="width:128px;height:128px;border-radius:50%;object-fit:cover;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.2);">

      <div style="flex:1;min-width:260px;">
        <h1 style="margin:0 0 12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:2rem;">
          ${esc(s.server_name)}
          ${s.verified ? '<span style="background:#5865F2;color:white;padding:3px 10px;border-radius:6px;font-size:13px;font-weight:600;">Verified</span>' : ''}
          ${s.premium_tier ? `<span style="background:#F47B67;color:white;padding:3px 10px;border-radius:6px;font-size:13px;font-weight:600;">Boost Tier ${s.premium_tier}</span>` : ''}
        </h1>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;font-size:15px;">
          <p><strong>Members:</strong> ${s.member_count.toLocaleString()}</p>
          <p><strong>Online:</strong> ${s.online_count.toLocaleString()}</p>
          <p><strong>Updated:</strong> ${updated}</p>
        </div>

        ${s.server_desc ? `<p style="margin:20px 0;line-height:1.7;font-size:16px;color:#444;">${esc(s.server_desc)}</p>` : ''}

        <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;">
          <a href="https://discord.com/invite/${s.invite_code}" 
             target="_blank" rel="noopener" 
             style="background:#5865F2;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
            Join Server
          </a>

          ${s.invite_code ? `
            <button onclick="navigator.clipboard.writeText('https://discord.gg/${esc(s.invite_code)}')" 
                    style="background:#43b581;color:white;padding:12px 24px;border:none;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;">
              Copy Invite
            </button>
          ` : ''}

          <button onclick="navigator.clipboard.writeText('${s.guild_id}')" 
                  style="background:#666;color:white;padding:12px 24px;border:none;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;">
            Copy ID
          </button>
        </div>
      </div>
    </div>
  </div>

  <footer>&copy; 2025 SpawnBoard. All rights reserved.</footer>

  <script>
    // Dark mode
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
