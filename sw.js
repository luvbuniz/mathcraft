/* Stackadoo service worker — installable + fully offline, but always fresh when online.
   Strategy: NETWORK-FIRST (try the network, fall back to cache offline). A normal reload always
   picks up the latest version while online, and the WHOLE game still works with no Wi-Fi —
   including the CDN libraries (Three.js, fonts, Firebase), which we now cache too. After one
   online load the game runs offline. Saves live in localStorage and are untouched by this. */
const CACHE = 'stackadoo-v187';

// The critical pieces the game needs to even start — precached on install so a first offline
// launch works. Cross-origin entries (Three.js / fonts / Firebase) are stored as opaque copies.
const PRECACHE = [
  'play.html', 'manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(
    PRECACHE.map(u => fetch(new Request(u, { mode: 'no-cors' })).then(r => c.put(u, r)).catch(() => {}))
  )));
});

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Network-first for EVERYTHING (same- and cross-origin) so the game + its CDN libraries all
  // cache for offline use. When the network is down, serve the cached copy (or the app shell).
  e.respondWith(
    fetch(req).then(resp => {
      if (resp && (resp.ok || resp.type === 'opaque')) {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('play.html') : undefined)))
  );
});
