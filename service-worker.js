/* ==========================================================================
   SERVICE WORKER – Divine Increase Business Network
   Offline-first caching strategy with stale-while-revalidate for assets.
   ========================================================================== */

const CACHE_NAME = 'divine-increase-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install – add all critical files here
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/js/main.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/favicon-32.png',
  '/assets/icons/favicon-16.png',
  '/assets/icons/apple-touch-icon.png'
];

// Additional file extensions to cache dynamically
const CACHEABLE_EXTENSIONS = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.json'];

// ---------------------------------------------------------------------------
// INSTALL – pre-cache critical assets
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Pre-cache failed:', error);
      })
  );
});

// ---------------------------------------------------------------------------
// ACTIVATE – clean up old caches
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// ---------------------------------------------------------------------------
// FETCH – serve from cache, fallback to network, with offline fallback
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip cross-origin requests (for security and simplicity)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') {
    return;
  }

  // Skip browser-extension requests
  if (url.pathname.startsWith('/_extension/') || url.pathname.startsWith('/chrome-extension')) {
    return;
  }

  // Skip Firebase / Google / external auth requests
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) {
    return;
  }

  // Check if the request is for a cacheable asset
  const isCacheable = PRECACHE_URLS.some(path => url.pathname === path) ||
                      CACHEABLE_EXTENSIONS.some(ext => url.pathname.endsWith(ext)) ||
                      url.pathname === '/' ||
                      url.pathname === '/index.html';

  if (!isCacheable) {
    // Not cacheable – just fetch from network
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Stale-while-revalidate: return cached, then update in background
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              // Update cache with fresh response
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  })
                  .catch(() => {});
              }
              return networkResponse;
            })
            .catch(() => {
              // Network failed – return cached (already returning above)
            });

          // Return cached immediately, update in background
          return cachedResponse;
        }

        // No cache – fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses for future use
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                })
                .catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed and no cache – fallback to offline page
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            // Return a generic offline response for other assets
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-cache'
              })
            });
          });
      })
  );
});

// ---------------------------------------------------------------------------
// MESSAGE – handle skip-waiting and other messages
// ---------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') {
    self.skipWaiting();
  }
});