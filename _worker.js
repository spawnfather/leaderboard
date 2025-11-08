// worker.js
import { verifyKey } from 'discord-interactions';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('POST only', { status: 405 });

    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const rawBody = await request.clone().arrayBuffer();

    const isValid = await verifyKey(
      rawBody,
      signature,
      timestamp,
      env.DISCORD_PUBLIC_KEY
    );

    if (!isValid) return new Response('Invalid signature', { status: 401 });

    const interaction = await request.json();
    const startTime = Date.now();

    // PING (required by Discord)
    if (interaction.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // /ping command
    if (interaction.type === 2 && interaction.data.name === 'ping') {
      const latency = Date.now() - startTime;

      return new Response(JSON.stringify({
        type: 4,
        data: {
          content: `Pong!\nLatency: **${latency} ms**`
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      type: 4,
      data: { content: 'Unknown command.' }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
