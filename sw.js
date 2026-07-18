'use strict';

// ⚠️ SERVICE WORKER DE LIMPEZA (kill-switch) — versão sem loop.
// Não faz cache. Apaga caches antigos e se desregistra UMA vez.
// NÃO recarrega as abas (isso causava loop). O usuário recarrega manualmente.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (e) {}
    try {
      await self.registration.unregister();
    } catch (e) {}
    // NÃO chama clients.navigate nem reload — evita loop de recarga.
  })());
});

// Nunca intercepta requisições: tudo vai direto para a rede.
self.addEventListener('fetch', () => {
  return;
});
