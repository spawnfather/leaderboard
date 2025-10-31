// functions/server/[guildId].js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://gzrsknywsqpfimeecydn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnNrbnl3c3FwZmltZWVjeWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzc3MDgsImV4cCI6MjA3NjY1MzcwOH0.hjBoZqa-BC41cnbknzwkM36mER2I-3gsk-hUp7CVaWA';

export const onRequest = async ({ params }) => {
  const guildId = params.guildId;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: server, error } = await supabase
    .from('leaderboardmain')
    .select('guild_id, server_name, member_count, server_desc, online_count, last_updated')
    .eq('guild_id', guildId)
    .single();

  // 404 Page
  if (error || !server) {
    return new Response(get404Page(), {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new Response(renderServerPage(server), {
    headers: { 'Content-Type': 'text/html' },
  });
};

// 404 Page using template/styles.css
function get404Page() {
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

// Server Page — uses template/styles.css
function renderServerPage(server) {
  const iconUrl = `https://cdn.discordapp.com/icons/${server.guild_id}/${server.guild_id}.webp?size=256`;
  const fallback = 'https://cdn.discordapp.com/embed/avatars/0.png';
  const updated = new Date(server.last_updated).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${e(server.server_name)} – Spawn Board</title>
  <meta property="og:title" content="${e(server.server_name)}">
  <meta property="og:description" content="${e(server.server_desc || 'Discord server on Spawn Board')}">
  <meta property="og:image" content="${iconUrl}">
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
    <img src="${iconUrl}" onerror="this.src='${fallback}'"
         alt="${e(server.server_name)}" style="width:128px;height:128px;border-radius:50%;object-fit:cover;">
    <div style="flex:1;min-width:260px;">
      <h1>${e(server.server_name)}</h1>
      <p><strong>Members:</strong> ${server.member_count.toLocaleString()}</p>
      <p><strong>Online:</strong> ${server.online_count.toLocaleString()}</p>
      <p><strong>Last Updated:</strong> ${updated}</p>
      ${server.server_desc ? `<p>${e(server.server_desc)}</p>` : ''}
      <p>
        <a href="https://discord.com/servers/${server.guild_id}" target="_blank" rel="noopener"
           style="color:#007bff;font-weight:600;">View on Discord</a>
      </p>
    </div>
  </div>

  <footer>&copy; 2025 SpawnBoard. All rights reserved.</footer>

  <script>
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

function e(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[c]);
}
