'use strict';

// ⚠️ SERVICE WORKER DE LIMPEZA (kill-switch)
// Esta versão NÃO faz cache de nada. Ela existe apenas para desfazer o cache
// antigo que estava servindo uma versão incompleta do index.html.
// Ao ativar, apaga todos os caches e se desregistra, forçando o navegador a
// buscar sempre a versão mais recente direto do servidor (GitHub Pages).

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Apaga todos os caches existentes
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    // Assume controle de todas as abas
    await self.clients.claim();
    // Desregistra este próprio service worker
    await self.registration.unregister();
    // Recarrega todas as abas abertas para pegarem a versão nova do servidor
    const clientes = await self.clients.matchAll({ type: 'window' });
    clientes.forEach(c => c.navigate(c.url));
  })());
});

// Enquanto ativo, nunca serve do cache: sempre busca da rede.
self.addEventListener('fetch', event => {
  // Não intercepta nada — deixa o navegador buscar direto do servidor.
  return;
});
