self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('prophet-cache-v1').then(cache => {
      return cache.addAll(['./', './index.html', './style.css', './script.js', './manifest.json']);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
