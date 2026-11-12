/* multiview.cc — app-shell service worker.
 *
 * Only the local shell is ever cached, and only same-origin GETs for those exact
 * paths. Stream traffic, iframes, fonts and every third-party request pass
 * straight through untouched.
 *
 * Strategy is network-first: a reload always tries the server, so a new build is
 * picked up immediately. The cache exists only to keep the interface opening when
 * the server is down. Bump CACHE when the shell file list changes.
 */

const CACHE = 'multiview-shell-v39';

const SHELL = [
  './',
  './index.html',
  './404.html',
  './help.html',
  './legal.html',
  './manifest.webmanifest',
  './LICENSE',
  './styles.css',
  './sources.js',
  './dashboard.js',
  './app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

const SHELL_PATHS = new Set(
  SHELL.map((path) => new URL(path, self.location).pathname)
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const pretty = request.mode === 'navigate' && (url.pathname === '/help' || url.pathname === '/tv');
  if (!SHELL_PATHS.has(url.pathname) && !pretty) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        /* Exact match only: an old ?v= cache entry must never satisfy a new
           versioned asset after a deploy. The versioned URL is cached on first
           successful load. */
        let cached = await caches.match(request);
        /* A navigation may carry a query (?tv=1) that is not a cache key —
           fall back to the shell document for the same path. Keep exact
           matching for versioned scripts and styles. */
        if (!cached && request.mode === 'navigate') {
          if (url.pathname === '/help') cached = await caches.match('./help.html');
          else if (url.pathname === '/tv') cached = await caches.match('./');
          else cached = await caches.match(url.pathname);
        }
        if (cached) return cached;
        throw new Error('offline and not cached');
      }
    })()
  );
});
