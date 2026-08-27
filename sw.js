const CACHE = 'brasil-vidros-v1';
const ASSETS = [
  './',
  './index.html',
  './VidrosEditor.html',
  './AgendaMedicao.html',
  './AgendaObras.html',
  './GestaoObras.html',
  './CronogramaObras.html',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600&display=swap',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap',
];

// Install: cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', e => {
  // Skip non-GET and Firebase/external API requests
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.hostname.includes('firebase') ||
     url.hostname.includes('googleapis.com') && url.pathname.includes('firebasejs')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) {
        // Return cached, but also update in background
        const fetchPromise = fetch(e.request).then(fresh => {
          caches.open(CACHE).then(cache => cache.put(e.request, fresh.clone()));
          return fresh;
        }).catch(() => {});
        return cached;
      }
      // Not cached: fetch and cache
      return fetch(e.request).then(res => {
        if(!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
