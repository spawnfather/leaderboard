import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function onRequestGet({ params, env }) {
  const { guildId } = params

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  const { data, error } = await supabase
    .from('leaderboardmain')
    .select('*')
    .eq('guild_id', guildId)
    .maybeSingle()

  if (error || !data) {
    return new Response(
      `<h1>Server not found</h1><p>${error?.message || 'No data found for this guild ID.'}</p>`,
      { status: 404, headers: { 'Content-Type': 'text/html' } }
    )
  }

  return new Response(renderPage(data), {
    headers: { 'Content-Type': 'text/html' },
  })
}

function renderPage(server) {
  const inviteUrl = `https://discord.gg/${server.invite_code || server.guild_id}`
  const iconUrl = server.icon_hash
    ? `https://cdn.discordapp.com/icons/${server.guild_id}/${server.icon_hash}.png?size=128`
    : null
  const formattedDate = new Date(server.last_updated).toLocaleDateString()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${server.server_name}</title>
  <link rel="stylesheet" href="/styles.css" />
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
      <div class="server-badge">
        ${
          iconUrl
            ? `<img src="${iconUrl}" alt="${server.server_name} icon" />`
            : server.server_name[0]?.toUpperCase() || '?'
        }
      </div>

      <div>
        <h1 class="server-name">${server.server_name}</h1>
        <div class="stats">
          <div class="stat">Members: ${server.member_count ?? '—'}</div>
          <div class="stat">Online: ${server.online_count ?? '—'}</div>
          <div class="stat">Updated: ${formattedDate}</div>
        </div>
      </div>

      <div class="actions">
        <a href="${inviteUrl}" target="_blank" class="btn">Join Server</a>
        <button class="btn secondary" onclick="navigator.clipboard.writeText('${inviteUrl}')">Copy Invite</button>
        <button class="btn secondary" onclick="navigator.clipboard.writeText('${server.guild_id}')">Copy ID</button>
      </div>
    </div>

    <section>
      <h2>About</h2>
      <p>${server.server_desc || 'No description provided.'}</p>
    </section>
  </main>
</body>
</html>`
}
