const SUPABASE_URL = 'https://gzrsknywsqpfimeecydn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnNrbnl3c3FwZmltZWVjeWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzc3MDgsImV4cCI6MjA3NjY1MzcwOH0.hjBoZqa-BC41cnbknzwkM36mER2I-3gsk-hUp7CVaWA';

export async function onRequest({ params }) {
  const guildId = params.guildId;

  // Try to get from Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboardmain?guild_id=eq.${guildId}&select=*,guild_id::text`, {
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
  const updated = new Date(s.last_updated).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Generate icon URL (fallback to default Discord placeholder)
  const iconUrl = s.icon_hash 
    ? `https://cdn.discordapp.com/icons/${s.guild_id}/${s.icon_hash}.webp?size=256`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  // Generate banner URL (only if banner_hash exists)
  const bannerUrl = s.banner_hash 
    ? `https://cdn.discordapp.com/banners/${s.guild_id}/${s.banner_hash}.webp?size=1024`
    : null;

  // Fallback banner if none (soft gradient – works in light/dark mode)
  const fallbackBannerStyle = bannerUrl ? '' : `
    background: linear-gradient(135deg, #5865F2 0%, #00C09A 100%);
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(s.server_name)} – Spawn Board</title>

  
  <meta name="title" content="${esc(s.server_name)} @ SpawnBoard" />
  <meta name="description" content="Join this server and many others on the Spawnism Leaderboard only located at SpawnBoard!" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://spawnboard.pages.dev/" />
  <meta property="og:title" content="${esc(s.server_name)} @ SpawnBoard" />
  <meta property="og:image" content="https://i.ibb.co/qMZM2P5P/SPAWN-BOARD.png" />
  <meta property="og:description" content="Join this server and many others on the Spawnism Leaderboard only located at SpawnBoard!" />


  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="https://spawnboard.pages.dev/" />
  <meta property="twitter:title" content="${esc(s.server_name)} @ SpawnBoard" />
  <meta property="twitter:image" content="https://i.ibb.co/qMZM2P5P/SPAWN-BOARD.png" />
  <meta property="twitter:description" content="Join this server and many others on the Spawnism Leaderboard only located at SpawnBoard!" />

  <link rel="stylesheet" href="/template/styles.css">
  <!-- Load Supabase IIFE -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
  <style>
    /* Hero header with banner + centered icon */
    .hero-header {
      position: relative;
      width: 100%;
      height: 240px;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 2rem;
      ${fallbackBannerStyle}
    }
    ${bannerUrl ? `.hero-header { background-image: url('${bannerUrl}'); }` : ''}
    
    .hero-header::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.35); /* Subtle overlay for text readability */
      backdrop-filter: blur(2px);
    }
    
    .icon-wrapper {
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%) translateY(50%);
      z-index: 2;
    }
    
    .server-icon {
      width: 148px;
      height: 148px;
      border-radius: 50%;
      object-fit: cover;
      border: 6px solid var(--bg-color, #ffffff);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      transition: transform 0.2s ease;
    }
    
    .server-icon:hover {
      transform: scale(1.05);
    }
    
    /* Dark mode adjustments */
    .dark-theme .hero-header::before {
      background: rgba(0,0,0,0.5);
    }
    
    @media (max-width: 480px) {
      .hero-header { height: 180px; }
      .server-icon { width: 120px; height: 120px; }
    }
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

  <div class="container">
      <!-- Banner + Icon Hero -->
      <div class="hero-header">
        <div class="icon-wrapper">
          <img src="${iconUrl}" alt="${esc(s.server_name)} icon" class="server-icon"
               onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png';">
        </div>
      </div>
      
      <!-- Server Details (shifted down to account for overlapping icon) -->
      <div style="margin-top: 80px;"> <!-- Clears the overhanging icon -->
        <h1 style="text-align:center; margin-bottom:1rem;">${esc(s.server_name)}</h1>
        <p><strong>Members:</strong> ${s.member_count.toLocaleString()}</p>
        <p><strong>Online:</strong> ${s.online_count.toLocaleString()}</p>
        <p><strong>Updated:</strong> ${updated}</p>
        ${s.server_desc ? `<p style="overflow-wrap: break-word; word-wrap: break-word;">${esc(s.server_desc)}</p>` : ''}
        <p><a href="/privacy" target="_blank" rel="noopener" style="color:#007bff;font-weight:600;">Learn More...</a></p>
        <div style="display:flex;gap:1rem;margin-top:1rem;flex-wrap:wrap;">
          <button style="flex:1; min-width:120px; padding:8px 16px;" onclick="copyToClipboard('${esc(s.guild_id)}')">Copy ID</button>
          <button style="flex:1; min-width:120px; padding:8px 16px;" onclick="copyToClipboard('${esc(s.invite_code)}')">Copy Invite</button>
        </div>
        <button style="width:100%; margin-top:1rem; padding:8px 16px;" onclick="window.open('https://discord.gg/${esc(s.invite_code)}', '_blank')">Join Server</button>
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

    // Copy to clipboard function
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy.');
      });
    }
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
