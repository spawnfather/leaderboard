// functions/discord.js
import { verifyKey } from 'discord-interactions';

export const onRequestPost = async ({ request, env }) => {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');
  const body = await request.text();

  // Verify Discord's request
  const isValid = verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const interaction = JSON.parse(body);

  // PING → PONG
  if (interaction.type === 1) {
    return Response.json({ type: 1 });
  }

  // Slash command: /ping
  if (interaction.type === 2 && interaction.data.name === 'ping') {
    return Response.json({
      type: 4,
      data: { content: 'Pong!' },
    });
  }

  return new Response('Unhandled', { status: 400 });
};
