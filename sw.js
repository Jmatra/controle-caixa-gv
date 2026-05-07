'use strict';

const CACHE_APP = 'caixa-gv-app-v2';
const CACHE_STATIC = 'caixa-gv-static-v2';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-120.png',
  './icon-152.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];

const STATIC_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
];

const SKIP_HOSTS = [
  'firebaseio.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'googleapis.com',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_APP)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => ![CACHE_APP, CACHE_STATIC].includes(key))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Nunca cachear Firebase/Auth/API: dados financeiros precisam vir da rede.
  if (SKIP_HOSTS.some(host => url.hostname.includes(host))) return;

  // CDN/fontes: cache-first com atualização normal pelo versionamento do cache.
  if (STATIC_HOSTS.some(host => url.hostname.includes(host))) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response && response.status === 200) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Navegação/app shell: network-first com fallback no cache.
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      caches.open(CACHE_APP).then(cache =>
        fetch(event.request)
          .then(response => {
            if (response && response.status === 200) cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cache.match(event.request).then(cached => cached || cache.match('./index.html')))
      )
    );
    return;
  }

  // Demais arquivos locais: stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_APP).then(cache =>
      cache.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(response => {
          if (response && response.status === 200) cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    )
  );
});
