/* ══════════════════════════════════════════════════════════
   Service Worker — Folga Trabalhada (FT)
   PJ Tecnologia e Sistemas
   ══════════════════════════════════════════════════════════ */

var CACHE_NAME = 'ft-cache-v2';

/* Arquivos que serão salvos para uso offline */
var ARQUIVOS_CACHE = [
  './folga-trabalhada-v19-7-2-7-2.html',
  './manifest.json',
  /* Fontes e libs externas são cacheadas dinamicamente na primeira visita */
];

/* ── INSTALL: salva o HTML e manifest no cache ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ARQUIVOS_CACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE: remove caches antigos ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── FETCH: Cache First para o app, Network First para CDN externo ── */
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  if (event.request.method !== 'GET') return;

  var isExternal = url.includes('fonts.googleapis.com') ||
                   url.includes('fonts.gstatic.com') ||
                   url.includes('cdnjs.cloudflare.com');

  if (isExternal) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
