const cachePrefix = `advent-jpii:${self.registration.scope}:`;
const cacheName = cachePrefix + 'v10-pwa12';
const appShell = new URL('./index.html', self.registration.scope).href;
const assets = [
  appShell,
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(cachePrefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!url.href.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    const root = new URL('./', self.registration.scope);
    if (url.pathname !== root.pathname && url.pathname !== new URL(appShell).pathname) return;
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(cacheName);
      return (await cache.match(appShell)) ?? Response.error();
    }));
    return;
  }
  if (!assets.some(asset => new URL(asset, self.registration.scope).href === url.href)) return;
  event.respondWith(caches.open(cacheName)
    .then(async cache => (await cache.match(request)) ?? fetch(request)));
});
