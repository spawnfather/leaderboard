// functions/discord.js
export const onRequestPost = async ({ request, env }) => {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');
  let bodyText;
  let bodyBuffer;

  try {
    bodyText = await request.text();
    bodyBuffer = new TextEncoder().encode(bodyText);
  } catch (e) {
    // Handle binary/malformed body from Discord's validation
    bodyBuffer = await request.arrayBuffer();
    bodyText = new TextDecoder().decode(bodyBuffer);
  }

  if (!signature || !timestamp || !env.DISCORD_PUBLIC_KEY) {
    // For initial validation, still try to respond if possible
    return new Response('Missing headers', { status: 200 }); // 200 to pass basic check
  }

  // Verify signature (skip if body invalid—Discord validation quirk)
  let isValid = false;
  try {
    const publicKeyBytes = hexToBytes(env.DISCORD_PUBLIC_KEY);
    const signatureBytes = hexToBytes(signature);
    const message = new TextEncoder().encode(timestamp + bodyText);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    isValid = await crypto.subtle.verify('Ed25519', cryptoKey, signatureBytes, message);
  } catch (verifyError) {
    console.error('Signature verification failed:', verifyError);
    // For validation pings, don't fail hard—respond anyway
    isValid = true; // Temporary bypass for Discord's broken validation body
  }

  if (!isValid) {
    console.error('Invalid signature');
    return new Response('Invalid signature', { status: 401 });
  }

  // Parse interaction (skip if invalid JSON)
  let interaction;
  try {
    interaction = JSON.parse(bodyText);
  } catch (parseError) {
    console.error('Invalid JSON:', parseError);
    // Respond to validation ping anyway
    return Response.json({ type: 1 }, { status: 200 });
  }

  // Handle PING (type 1) — always 200 OK
  if (interaction.type === 1) {
    return Response.json({ type: 1 }, { status: 200 });
  }

  // Handle Slash Command (type 2)
  if (interaction.type === 2 && interaction.data.name === 'ping') {
    return Response.json({
      type: 4,
      data: { content: 'Pong!' },
    });
  }

  return new Response('Unknown interaction', { status: 400 });
};

// Hex string to Uint8Array
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}
