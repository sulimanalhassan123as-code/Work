const CACHE_NAME = 'prophet-cache-v3'; // Bumping to v3 to destroy the old cache

self.addEventListener('install', e => {
  self.skipWaiting(); // Forces this new worker to take over immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './', 
        './index.html', 
        './style.css', 
        './script.js', 
        './manifest.json',
        './prophets.json'
      ]);
    })
  );
});

// The "sweeper" that deletes v1 and v2 caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Clearing old cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// "Network First" strategy: Always check the internet for new code first!
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
