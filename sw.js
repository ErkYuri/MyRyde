const CACHE_NAME = 'ryde-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js'
];

// Instala o Service Worker e guarda os arquivos em cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercepta as requisições: se tiver sem internet, devolve do cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});