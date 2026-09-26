const CACHE_NAME = 'ttm-clinic-cache-v149';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), ms));
}

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Bypass Supabase API, realtime websockets, and non-GET requests
  if (event.request.method !== 'GET' || url.includes('supabase.co') || url.includes('/rest/v1/') || url.includes('/auth/v1/')) {
    return;
  }

  // 1. Navigation / HTML Requests: Instant Cache delivery with background update
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      caches.match('/index.html').then(cachedHtml => {
        const networkFetch = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put('/index.html', responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedHtml);

        // If we have cached HTML, return immediately (<50ms) and refresh in background
        if (cachedHtml) {
          networkFetch.catch(() => {});
          return cachedHtml;
        }

        return Promise.race([networkFetch, timeout(2500)]).catch(() => cachedHtml || networkFetch);
      })
    );
    return;
  }

  // 2. Static Assets & CDN libraries: Cache-First with Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);
    })
  );
});
