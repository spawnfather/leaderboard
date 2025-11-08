// _worker.js — Native Discord verification (no external libs needed)
export default {
  async fetch(request, env) {
    // Log for debugging
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);

    if (request.method !== 'POST') {
      console.log('Non-POST request');
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    console.log('Signature present:', !!signature);
    console.log('Timestamp present:', !!timestamp);

    if (!signature || !timestamp) {
      console.log('Missing signature/timestamp');
      return new Response('Missing headers', { status: 401 });
    }

    // Get raw body for verification
    const rawBody = await request.arrayBuffer();
    const bodyString = new TextDecoder().decode(rawBody);
    console.log('Body length:', bodyString.length);

    // Verify signature with native Ed25519
    const isValid = await verifyDiscordRequest(
      rawBody,
      signature,
      timestamp,
      env.DISCORD_PUBLIC_KEY
    );

    if (!isValid) {
      console.log('Signature invalid');
      return new Response('Invalid signature', { status: 401 });
    }

    let interaction;
    try {
      interaction = JSON.parse(bodyString);
    } catch (error) {
      console.log('Invalid JSON:', error.message);
      return new Response('Invalid JSON', { status: 400 });
    }

    const startTime = Date.now();
    console.log('Interaction type:', interaction.type);

    // PING HANDLER — Responds with { type: 1 } immediately (critical for verification!)
    if (interaction.type === 1) {
      console.log('PING received — responding');
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // /ping command
    if (interaction.type === 2 && interaction.data.name === 'ping') {
      const latency = Date.now() - startTime;
      console.log('PING command — latency:', latency);

      return new Response(JSON.stringify({
        type: 4,
        data: {
          content: `Pong!\nLatency: **${latency} ms**`
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Unknown command
    return new Response(JSON.stringify({
      type: 4,
      data: { content: 'Unknown command.' }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Native Ed25519 verification (from Discord's official sample)
async function verifyDiscordRequest(rawBody, signature, timestamp, publicKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(timestamp + new TextDecoder().decode(rawBody));
  const keyData = hexToUint8Array(publicKey);
  const sigData = hexToUint8Array(signature);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'Ed25519', namedCurve: 'Ed25519' },
    false,
    ['verify']
  );

  return crypto.subtle.verify('Ed25519', cryptoKey, sigData, data);
}

function hexToUint8Array(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}
