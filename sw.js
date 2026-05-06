const CACHE_NAME = 'myryde-cache-v2';
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


// --- NOVO: Limpa os caches antigos quando a versão muda ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Se o nome do cache antigo for diferente do atual (ex: v1 é diferente de v2)
          if (cache !== CACHE_NAME) {
            console.log('Apagando cache antigo:', cache);
            return caches.delete(cache); // Apaga a versão velha!
          }
        })
      );
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