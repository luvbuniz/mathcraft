/* Stackadoo web beta service worker (scope /beta/). It exists so the site-wide /sw.js (the old game) stops
   controlling the beta pages: that worker copied every beta download (about 230 MB) into its own cache.
   No fetch handler on purpose: requests go straight to the network / browser. The game files themselves are
   kept on the device by beta.js in Cache Storage ('stackadoo-beta-<buildVersion>') and Unity's IndexedDB cache. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  try {   // remove beta files the old worker stored in its caches (its own entries are left alone)
    for (const name of await caches.keys()) {
      if (name.startsWith('stackadoo-beta-')) continue;
      const cache = await caches.open(name);
      for (const req of await cache.keys()) if (new URL(req.url).pathname.startsWith('/beta/')) await cache.delete(req);
    }
  } catch (e) {}
  await self.clients.claim();
})()));
