/* Stackadoo service worker — installable + fully offline, but always fresh when online.
   Strategy: NETWORK-FIRST (try the network, fall back to cache offline). A normal reload always
   picks up the latest version while online, and the WHOLE game still works with no Wi-Fi —
   including the CDN libraries (Three.js, fonts, Firebase), which we now cache too. After one
   online load the game runs offline. Saves live in localStorage and are untouched by this.
   Updates: a new sw.js takes over as soon as it installs (skipWaiting + clients.claim), but it
   never reloads a page — a kid mid-game keeps playing and gets the new build on the next load.
   Bump CACHE on a release to clear old offline copies. Strategy test: tests/sw-strategy.cjs */
const CACHE = 'stackadoo-v311';
// Page loads (/, /play, /play.html) wait at most this long for the network before an offline
// copy is used. Without a saved copy we keep waiting for the network (a slow first load).
const NAV_TIMEOUT_MS = 3000;

// The critical pieces the game needs to even start — precached on install so a first offline
// launch works. Cross-origin entries (Three.js / fonts / Firebase) are stored as opaque copies.
const PRECACHE = [
  'play.html', 'manifest.json', 'google-signin.js', 'interior-art.js?v=283-ready', 'textures/oak-store-v1.jpg?v=280',
  'lib/GLTFLoader.js',                       // 🎨 avatar model loader (avatars/*.glb cache on first use)
  'arcade/voiddrift.html',                   // 🚀 the arcade cabinet (self-contained, plays offline)
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(
    // Fetch cross-origin entries with CORS so we can actually SEE the status. The old
    // no-cors fetch returned an OPAQUE response - status always 0, success and failure
    // indistinguishable - and cached it blindly. A captive-portal page or an error body
    // could be stored *as if it were the Firebase SDK*, and then served from cache on
    // every later network hiccup, leaving `typeof firebase === "undefined"` forever.
    // Now: only a genuine 200 is cached. A miss just means no offline copy, and
    // network-first fetches it live.
    PRECACHE.map(u => fetch(new Request(u, u.indexOf('http') === 0 ? { mode: 'cors' } : { mode: 'same-origin', cache: 'reload' }))
      .then(r => { if (r && r.ok && r.type !== 'opaque') return c.put(u, r); })
      .catch(() => {}))
  )));
});

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

function isAuthUrl(url) {
  // Never intercept Google / Firebase Auth / GIS / token APIs. Serving play.html (or a stale
  // opaque cache) for these is what breaks "Continue with Google".
  return /accounts\.google\.com|googleapis\.com|gstatic\.com\/identity|identitytoolkit|securetoken\.googleapis|firebaseapp\.com|firebaseio\.com|firebasestorage\.googleapis|gsi\/client|recaptcha|gstatic\.com\/recaptcha|google\.com\/recaptcha/.test(url);
}

// The game page answers on several URLs: '/play' (the pretty URL GitHub Pages and Cloudflare
// serve and the installed app opens), '/play.html' and '/'. '/play' used to fall through to the
// generic handler below, which read it through the 10-minute HTTP cache and saved a stale copy.
function pagePath(req) {
  try {
    const p = new URL(req.url).pathname.replace(/\/+$/, '') || '/';
    if (p === '/' || p === '/index.html') return '/';
    if (p === '/play' || p === '/play.html' || p.endsWith('/play.html') || p.endsWith('/play')) return 'play';
  } catch (e) {}
  return null;
}

function isPlayHtml(req) { return pagePath(req) !== null; }

// Cache key for the offline copy of each page. '/play' and '/play.html' share one copy.
function pageCacheKey(req) { return pagePath(req) === '/' ? './' : 'play.html'; }

function patchPlayHtml(text) {
  if (!text || text.indexOf('google-signin.js') >= 0) return text;
  text = text.replace(
    'firebase-firestore-compat.js"></script>',
    'firebase-firestore-compat.js"></script>\n<script src="https://accounts.google.com/gsi/client" async defer></script>'
  );
  if (text.indexOf('</body>') >= 0) text = text.replace('</body>', '<script src="google-signin.js"></script>\n</body>');
  else text += '\n<script src="google-signin.js"></script>\n';
  return text;
}

function htmlResponse(text, extra) {
  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' };
  return new Response(text, { headers: extra || headers });
}

function servePage(text) { return htmlResponse(patchPlayHtml(text)); }

// NETWORK-FIRST for page loads: always ask the server (revalidating past the HTTP cache), save a
// fresh offline copy when it answers, and only use the saved copy when offline or when the
// network takes longer than NAV_TIMEOUT_MS. A game already running is never reloaded: a new
// deploy is picked up on the next page load.
function handleNavigation(req) {
  const key = pageCacheKey(req);
  const fromCache = () => caches.open(CACHE)
    .then(c => c.match(key).then(r => r || (key !== 'play.html' ? c.match('play.html') : r)))
    .then(r => r || caches.match(key)).catch(() => null);
  let net;
  try { net = fetch(req, { cache: 'no-cache' }); } catch (e) { net = fetch(req); }
  const network = net.then(resp => {
    if (!resp || resp.type === 'opaqueredirect' || resp.status === 0) return resp;   // redirect: let the browser follow it
    if (!resp.ok) return resp;
    return resp.text().then(t => {
      if (!resp.redirected) {
        caches.open(CACHE).then(c => c.put(key, new Response(t, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))).catch(() => {});
      }
      return servePage(t);
    });
  });
  const offline = () => fromCache().then(c => c ? c.text().then(servePage) : Response.error());
  return new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done) { done = true; resolve(r); } };
    const timer = setTimeout(() => {
      fromCache().then(c => { if (c) c.text().then(t => finish(servePage(t))); });   // slow network: use the saved copy
    }, NAV_TIMEOUT_MS);
    network.then(r => { clearTimeout(timer); finish(r); },
                 () => { clearTimeout(timer); offline().then(finish, () => finish(Response.error())); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (isAuthUrl(req.url)) return;          // let the browser talk to Google / Firebase directly

  if (isPlayHtml(req) && (req.mode === 'navigate' || req.destination === 'document')) {
    e.respondWith(handleNavigation(req));
    return;
  }

  e.respondWith(
    fetch(req).then(resp => {
      if (resp && resp.ok && resp.type !== 'opaque') {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => caches.match(req).then(c => {
      if (c) return c;
      if (req.mode === 'navigate') return caches.match('play.html');
      return Response.error();
    }))
  );
});
