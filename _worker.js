/* multiview — Pages Advanced Mode function.
 *
 * Routes:
 *   /api/live?channel=UC... | ?video=ID  → current live video + status
 *   /api/frame?id=ID&live=1              → cached live still
 *   /api/error                           → privacy-light client error log
 *   everything else                      → static assets
 *
 * This file is deployed from dist/ by both direct upload and Wrangler. It is
 * the Advanced Mode equivalent of a Pages Functions folder.
 */
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36';
const CHANNEL = /^UC[A-Za-z0-9_-]{20,}$/;
const VIDEO = /^[A-Za-z0-9_-]{11}$/;

function json(body, status = 200, maxAge = 120) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=' + maxAge,
    },
  });
}

async function liveForChannel(channel) {
  const res = await fetch('https://www.youtube.com/channel/' + channel + '/live', {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.8' },
    redirect: 'follow',
  });
  if (!res.ok) return { channel, live: false, status: res.status };
  const html = await res.text();
  const canonical = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})"/);
  const id = canonical ? canonical[1] : (html.match(/"videoId":"([A-Za-z0-9_-]{11})"/) || [])[1];
  if (!id) return { channel, live: false, status: 404 };
  return { channel, live: true, videoId: id, frame: '/api/frame?id=' + id + '&live=1' };
}

async function liveForVideo(video) {
  const head = await fetch('https://i.ytimg.com/vi/' + video + '/maxresdefault_live.jpg', { method: 'HEAD' });
  return { video, live: head.ok, videoId: video, frame: head.ok ? '/api/frame?id=' + video + '&live=1' : null };
}

async function handleLive(request) {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;
  const url = new URL(request.url);
  const channel = url.searchParams.get('channel') || '';
  const video = url.searchParams.get('video') || '';
  let body;
  try {
    if (channel && CHANNEL.test(channel)) body = await liveForChannel(channel);
    else if (video && VIDEO.test(video)) body = await liveForVideo(video);
    else body = { error: 'pass channel=UC… or video=ID' };
  } catch (error) {
    body = { error: 'lookup failed', detail: String(error && error.message || error).slice(0, 120) };
  }
  const response = json(body, body.error ? 400 : 200);
  if (!body.error) await cache.put(request, response.clone());
  return response;
}

async function handleFrame(request) {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  const live = url.searchParams.get('live') === '1';
  if (!VIDEO.test(id)) return new Response('bad id', { status: 400 });
  const sizes = live
    ? ['maxresdefault_live.jpg', 'maxres2.jpg', 'mq2.jpg', 'hqdefault.jpg']
    : ['maxres2.jpg', 'mq2.jpg', 'hqdefault.jpg'];
  for (const file of sizes) {
    const upstream = await fetch('https://i.ytimg.com/vi/' + id + '/' + file);
    if (upstream.ok) {
      const response = new Response(upstream.body, {
        status: 200,
        headers: {
          'content-type': upstream.headers.get('content-type') || 'image/jpeg',
          'cache-control': 'public, max-age=120',
          'x-frame-source': file,
        },
      });
      await cache.put(request, response.clone());
      return response;
    }
  }
  return new Response('frame unavailable', { status: 404 });
}

async function handleError(request) {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  let body;
  try { body = await request.json(); } catch { return new Response(null, { status: 204 }); }
  const clean = {
    at: new Date().toISOString(),
    kind: String(body.kind || 'error').slice(0, 20),
    message: String(body.message || '').slice(0, 500),
    stack: String(body.stack || '').slice(0, 2000),
    path: String(body.path || '').slice(0, 200),
    build: String(body.build || '').slice(0, 40),
  };
  console.error('client-error ' + JSON.stringify(clean));
  return new Response(null, { status: 204 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/live') return handleLive(request);
    if (url.pathname === '/api/frame') return handleFrame(request);
    if (url.pathname === '/api/error') return handleError(request);
    if (url.pathname.startsWith('/api/')) return new Response('not found', { status: 404 });
    if (env && env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('not found', { status: 404 });
  },
};
