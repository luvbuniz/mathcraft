/* Stackadoo service worker — installable + offline, but always fresh when online.
   Strategy: NETWORK-FIRST (try the network, fall back to cache offline). This means a
   normal reload always picks up the latest version while you're online, and the game
   still works with no Wi-Fi. Saves live in localStorage and are untouched by this. */
const CACHE = 'stackadoo-v143';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;   // let cross-origin (analytics) pass straight through
  e.respondWith(
    fetch(req).then(resp => {
      if (resp && (resp.ok || resp.type === 'opaque')) {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => caches.match(req))   // offline → serve the cached copy
  );
});
