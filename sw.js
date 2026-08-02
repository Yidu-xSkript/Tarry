const CACHE = "tarry-v3";;
// ponytail: precache the shell, the two small lookup files, and psalm — the only
// book a prayer session itself opens. The other 130 book files are ~34 MB raw and
// are cached individually on first visit by the fetch handler below, so install
// stays fast and nothing blows the storage quota. Upgrade path: add the rest here
// if a cold study lookup on a plane ever actually bites.
const SHELL = ['.', 'index.html', 'style.css', 'app.js', 'lib.js',
  'manifest.webmanifest', 'icon-512.png',
  'data/VERSIONS.json', 'data/strongs.json', 'data/xrefs.json',
  'data/bsb/psalm.json', 'data/kjv/psalm.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Cache-first. This app must work with no signal, and none of its data is live.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => hit))
  );
});
