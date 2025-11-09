// functions/discord.js
export const onRequestPost = async ({ request, env }) => {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');
  let bodyText;

  try {
    bodyText = await request.text();
  } catch {
    return new Response('Bad body', { status: 400 });
  }

  if (!signature || !timestamp || !env.DISCORD_PUBLIC_KEY) {
    return new Response('Missing auth', { status: 400 });
  }

  // Verify signature
  let isValid = false;
  try {
    const publicKey = hexToBytes(env.DISCORD_PUBLIC_KEY);
    const sig = hexToBytes(signature);
    const msg = new TextEncoder().encode(timestamp + bodyText);
    const key = await crypto.subtle.importKey('raw', publicKey, { name: 'Ed25519' }, false, ['verify']);
    isValid = await crypto.subtle.verify('Ed25519', key, sig, msg);
  } catch {
    return new Response('Invalid signature', { status: 401 });
  }

  if (!isValid) return new Response('Invalid', { status: 401 });

  let interaction;
  try {
    interaction = JSON.parse(bodyText);
  } catch {
    return Response.json({ type: 1 }, { status: 200 });
  }

  // === PING ===
  if (interaction.type === 1) {
    return Response.json({ type: 1 });
  }

  // === SLASH COMMANDS ===
  if (interaction.type === 2) {
    const { name } = interaction.data;

    // /ping
    if (name === 'ping') {
      return Response.json({
        type: 4,
        data: { content: 'Pong!' },
      });
    }

    // /submit
    if (name === 'submit') {
      const options = interaction.data.options || [];
      const link = options.find(o => o.name === 'link')?.value || '';
      const description = options.find(o => o.name === 'description')?.value || 'No description.';

      const inviteMatch = link.match(/discord(?:app)?\.com\/invite\/([a-zA-Z0-9-]+)|discord\.gg\/([a-zA-Z0-9-]+)/i);
      const inviteCode = inviteMatch ? (inviteMatch[1] || inviteMatch[2]) : null;

      if (!inviteCode) {
        return Response.json({
          type: 4,
          data: { content: 'Please provide a valid Discord invite link (e.g. discord.gg/abc123)' },
        });
      }

      let inviteData;
      try {
        const res = await fetch(`https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`, {
          headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
        });
        inviteData = await res.json();

        if (res.status !== 200) {
          return Response.json({
            type: 4,
            data: { content: 'Could not fetch invite. Is it valid and not expired?' },
          });
        }
      } catch (e) {
        return Response.json({
          type: 4,
          data: { content: 'Failed to check invite. Try again later.' },
        });
      }

      const expiresAt = inviteData.expires_at;
      if (expiresAt && new Date(expiresAt) < new Date()) {
        return Response.json({
          type: 4,
          data: { content: `This invite has **expired** on ${new Date(expiresAt).toLocaleString()}.` },
        });
      }

      const serverName = inviteData.guild?.name || 'Unknown Server';
      const memberCount = inviteData.approximate_member_count || 'Unknown';

      const embed = {
        title: 'New Server Submission',
        color: 0x209af5,
        thumbnail: {
          url: 'https://i.ibb.co/vvMrJXY8/Your-paragraph-text-removebg-preview.png'
        },
        fields: [
          { name: 'Server', value: `**${serverName}**`, inline: true },
          { name: 'Members', value: `${memberCount}`, inline: true },
          { name: 'Link', value: `https://discord.gg/${inviteCode}`, inline: false },
          { name: 'Expires', value: expiresAt ? new Date(expiresAt).toLocaleString() : 'Never', inline: true },
          { name: 'Description', value: description, inline: false },
          { name: 'Submitted By', value: `<@${interaction.member.user.id}>`, inline: false },
        ],
        timestamp: new Date().toISOString(),
      };

      await fetch(env.SUBMISSION_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });

      return Response.json({
        type: 4,
        data: { content: 'Server submitted successfully!', flags: 64 },
      });
    }

    // /leaderboard
    if (name === 'leaderboard') {
      let servers = [];
      try {
        const res = await fetch('https://spawnboard.pages.dev/leaderboard/top/7');
        if (res.ok) servers = await res.json();
      } catch (e) {
        return Response.json({
          type: 4,
          data: { content: 'Failed to load leaderboard. Try again later.' },
        });
      }

      if (servers.length === 0) {
        return Response.json({
          type: 4,
          data: { content: 'No servers on the leaderboard yet!' },
        });
      }

      const medal = (i) => {
        switch (i) {
          case 0: return ':first_place:';
          case 1: return ':second_place:';
          case 2: return ':third_place:';
          default: return `:medal:`;
        }
      };

      const description = servers
        .map((s, i) => `${medal(i)} **${s.name}** >> ${s.members.toLocaleString()} members`)
        .join('\n\n');

      const embed = {
        title: 'Top Spawnism Servers',
        description,
        color: 0x209af5,
        footer: { text: 'Want to see more?' },
        timestamp: new Date().toISOString(),
      };

      return Response.json({
        type: 4,
        data: {
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 5,
                  label: 'View Full Leaderboard',
                  url: 'https://spawnboard.pages.dev',
                },
              ],
            },
          ],
        },
      });
    }
  }

  return new Response('Unknown interaction', { status: 400 });
};

// Hex → Uint8Array
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}
