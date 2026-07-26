// Bump the version on each deploy that changes caching behavior so the
// activate handler evicts stale caches and clients pick up the new SW.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `agnes-forge-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `agnes-static-${CACHE_VERSION}`;

// Static assets to pre-cache. Each is cached individually (see install) so a
// single missing/404 asset never fails the whole install.
const STATIC_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - pre-cache static assets, tolerating individual failures.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) =>
      Promise.all(
        STATIC_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('SW: failed to pre-cache', url, err);
          })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// Activate event - clean up caches from previous versions.
self.addEventListener('activate', (event) => {
  const keep = [CACHE_NAME, STATIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!keep.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests: always network-only. Never cache API responses — the Cache
  // API cannot key on POST bodies, so caching would serve one request's result
  // for a different request. Just pass through and surface a clear error offline.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(
        () => new Response(
          JSON.stringify({ error: 'You appear to be offline.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Navigation requests (HTML documents): network-first so users always get the
  // latest build; fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/'))
      )
    );
    return;
  }

  // Static assets & other GETs: cache-first with background fill. Next.js emits
  // content-hashed filenames, so cache-first is safe for those chunks.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (response.status === 200 && request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      });
    }).catch(() => new Response('Offline', { status: 503 }))
  );
});

// Handle background sync (placeholder)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-history') {
    event.waitUntil(Promise.resolve());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
    };
    event.waitUntil(
      self.registration.showNotification('Agnes Forge', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
