import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// Fallback for static files
export default {
  async fetch(request, env, ctx) {
    try {
      return await getAssetFromKV(request, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
      });
    } catch (e) {
      return new Response('Not Found', { status: 404 });
    }
  }
};
