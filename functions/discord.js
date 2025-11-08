// functions/discord.js
export const onRequestPost = async ({ request, env }) => {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');
  const bodyRaw = await request.clone().arrayBuffer();

  if (!signature || !timestamp || !env.DISCORD_PUBLIC_KEY) {
    return new Response('Missing headers or key', { status: 400 });
  }

  // Convert public key from hex to Uint8Array
  const publicKey = hexToUint8Array(env.DISCORD_PUBLIC_KEY);
  const signatureUint8 = hexToUint8Array(signature);
  const message = new TextEncoder().encode(timestamp + new TextDecoder().decode(bodyRaw));

  // Verify signature using Web Crypto
  const isValid = await crypto.subtle.verify(
    'NODE-ED25519',
    await crypto.subtle.importKey('raw', publicKey, { name: 'NODE-ED25519' }, false, ['verify']),
    signatureUint8,
    message
  );

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const interaction = JSON.parse(new TextDecoder().decode(bodyRaw));

  // PING → PONG
  if (interaction.type === 1) {
    return Response.json({ type: 1 });
  }

  // /ping command
  if (interaction.type === 2 && interaction.data.name === 'ping') {
    return Response.json({
      type: 4,
      data: { content: 'Pong!' },
    });
  }

  return new Response('Unknown', { status: 400 });
};

// Helper: hex string → Uint8Array
function hexToUint8Array(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}
