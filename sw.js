const CACHE_NAME = 'roi-des-animaux-v1.28';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css?v=1.28',
  './game.js?v=1.28',
  './manifest.json',
  './assets/logo_horizontal.jpg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/card_back.jpg',
  './assets/card_chameleon.jpg',
  './assets/card_crab.jpg',
  './assets/card_crocodile.jpg',
  './assets/card_hermit_crab.jpg',
  './assets/card_lion.jpg',
  './assets/card_monkey.jpg',
  './assets/card_octopus.jpg',
  './assets/card_parrot.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
