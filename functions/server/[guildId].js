export async function onRequestGet() {
  return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Server Profile</title>
  <link rel="stylesheet" href="/styles.css" />

  <!-- Supabase Client (UMD version) -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>

  <style>
    .profile-container { max-width: 980px; margin: 24px auto; padding: 24px; border-radius: 12px; background: white; box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
    .profile-header { display: flex; gap: 20px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
    .server-badge { width: 96px; height: 96px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: white; background: linear-gradient(135deg, #007bff 0%, #00b4ff 100%); overflow: hidden; }
    .server-badge img { width: 100%; height: 100%; object-fit: cover; }
    .server-name { font-size: 22px; font-weight: 700; margin: 0 0 6px 0; }
    .stats { display:flex; gap:12px; flex-wrap:wrap; margin-top:8px; }
    .stat { background: rgba(0,123,255,0.06); border-radius: 8px; padding: 10px 12px; font-weight: 600; font-size: 14px; color: #007bff; }
    .actions { display:flex; gap:12px; align-items:center; margin-left:auto; }
    .btn { padding:10px 14px; border-radius:8px; border:none; cursor:pointer; font-weight:600; background:#007bff; color:white; text-decoration:none; }
    .btn.secondary { background:transparent; color:#007bff; border:1px solid rgba(0,123,255,0.16); }
    .description { margin-top:14px; color:#333; line-height:1.5; }
    body.dark-theme .stat { background: rgba(187, 222, 251, 0.06); color: #bbdefb; }
    body.dark-theme .server-badge { background: linear-gradient(135deg, #6c63ff 0%, #00b4ff 100%); }
  </style>
</head>
<body>
  <div class="nav-container">
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/servers">Servers</a></li>
      </ul>
    </nav>
  </div>

  <main class="profile-container">
    <div class="profile-header">
      <div class="server-badge" id="serverBadge">?</div>

      <div>
        <h1 class="server-name" id="serverName">Loading...</h1>
        <div class="stats">
          <div class="stat" id="memberCount">Members: —</div>
          <div class="stat" id="onlineCount">Online: —</div>
          <div class="stat" id="lastUpdated">Updated: —</div>
        </div>
      </div>

      <div class="actions">
        <a id="joinBtn" href="#" target="_blank" class="btn">Join Server</a>
        <button id="copyInviteBtn" class="btn secondary">Copy Invite</button>
        <button id="copyIdBtn" class="btn secondary">Copy ID</button>
      </div>
    </div>

    <section>
      <h2>About</h2>
      <p class="description" id="serverDesc">Loading description...</p>
    </section>
  </main>

  <script>
    (async function () {
      // Create Supabase client from environment variables
      const SUPABASE_URL = 'https://gzrsknywsqpfimeecydn.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnNrbnl3c3FwZmltZWVjeWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzc3MDgsImV4cCI6MjA3NjY1MzcwOH0.hjBoZqa-BC41cnbknzwkM36mER2I-3gsk-hUp7CVaWA';
      const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // Extract guild ID from the URL
      const guildId = window.location.pathname.split('/').pop();

      // Fetch the server info
      const { data, error } = await supabase
        .from('leaderboardmain')
        .select('*')
        .eq('guild_id', guildId)
        .maybeSingle();

      if (error || !data) {
        document.getElementById('serverName').textContent = 'Server not found';
        document.getElementById('serverDesc').textContent = 'No server data available.';
        console.error(error);
        return;
      }

      const server = data;
      const inviteUrl = 'https://discord.gg/' + (server.invite_code || guildId);

      // Fill in content
      document.getElementById('serverName').textContent = server.server_name;
      document.getElementById('memberCount').textContent = 'Members: ' + (server.member_count ?? '—');
      document.getElementById('onlineCount').textContent = 'Online: ' + (server.online_count ?? '—');
      document.getElementById('lastUpdated').textContent = 'Updated: ' + new Date(server.last_updated).toLocaleDateString();
      document.getElementById('serverDesc').textContent = server.server_desc || 'No description provided.';

      // Server badge (icon or fallback)
      const badge = document.getElementById('serverBadge');
      if (server.icon_hash) {
        const img = document.createElement('img');
        img.src = \`https://cdn.discordapp.com/icons/\${server.guild_id}/\${server.icon_hash}.png?size=128\`;
        img.alt = server.server_name;
        img.onerror = () => badge.textContent = server.server_name[0].toUpperCase();
        badge.textContent = '';
        badge.appendChild(img);
      } else {
        badge.textContent = server.server_name[0].toUpperCase();
      }

      // Buttons
      const joinBtn = document.getElementById('joinBtn');
      joinBtn.href = inviteUrl;

      document.getElementById('copyInviteBtn').onclick = () => {
        navigator.clipboard.writeText(inviteUrl);
        alert('Invite link copied!');
      };

      document.getElementById('copyIdBtn').onclick = () => {
        navigator.clipboard.writeText(server.guild_id);
        alert('Server ID copied!');
      };
    })();
  </script>
</body>
</html>
  `, {
    headers: { 'Content-Type': 'text/html' },
  })
}
