/* Stackadoo service worker — installable + fully offline, but always fresh when online.
   Strategy: NETWORK-FIRST (try the network, fall back to cache offline). A normal reload always
   picks up the latest version while online, and the WHOLE game still works with no Wi-Fi —
   including the CDN libraries (Three.js, fonts, Firebase), which we now cache too. After one
   online load the game runs offline. Saves live in localStorage and are untouched by this. */
const CACHE = 'stackadoo-v269';

// The critical pieces the game needs to even start — precached on install so a first offline
// launch works. Cross-origin entries (Three.js / fonts / Firebase) are stored as opaque copies.
const PRECACHE = [
  'play.html', 'manifest.json', 'google-signin.js',
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
    PRECACHE.map(u => fetch(new Request(u, { mode: 'no-cors' })).then(r => c.put(u, r)).catch(() => {}))
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

function isPlayHtml(req) {
  try {
    const u = new URL(req.url);
    return u.pathname === '/' || u.pathname === '/play.html' || u.pathname.endsWith('/play.html');
  } catch (e) { return false; }
}

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

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (isAuthUrl(req.url)) return;          // let the browser talk to Google / Firebase directly

  if (isPlayHtml(req) && (req.mode === 'navigate' || (req.destination === 'document') || req.url.indexOf('play.html') >= 0)) {
    e.respondWith(
      fetch(req).then(resp => resp.text().then(t => {
        const patched = patchPlayHtml(t);
        const out = htmlResponse(patched);
        caches.open(CACHE).then(c => c.put(req, out.clone())).catch(() => {});
        return out;
      })).catch(() => caches.match(req).then(c => {
        if (!c) return caches.match('play.html').then(async p => {
          if (!p) return Response.error();
          return htmlResponse(patchPlayHtml(await p.text()));
        });
        return c.text().then(t => htmlResponse(patchPlayHtml(t)));
      }))
    );
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
