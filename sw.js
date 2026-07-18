// ─────────────────────────────────────────────────────────────────────────────
//  sw.js — Service Worker para Controle de Caixa GV
//  Estratégia:
//    • Network-first para o HTML principal (sempre busca a versão mais
//      recente; cai para o cache só se a rede falhar/demorar — evita
//      ficar preso numa versão antiga em cache)
//    • Cache-first para os demais recursos do shell (raramente mudam)
//    • Network-only para Firebase (dados sempre frescos)
//    • Responde SKIP_WAITING para troca imediata de versão
// ─────────────────────────────────────────────────────────────────────────────

// ⚠️ IMPORTANTE: o navegador só percebe que há uma versão nova do
// Service Worker quando o conteúdo de sw.js muda byte a byte. Mudar
// SÓ o index.html (sem tocar aqui) faria o navegador continuar servindo
// o HTML antigo via cache — mas como o HTML principal usa NETWORK-FIRST,
// isso não é mais um problema para ele. Ainda assim, a cada atualização
// grande, é boa prática mudar o número abaixo (ex.: v1 → v2) para
// forçar a limpeza dos caches antigos no 'activate'.
const CACHE_NAME = 'caixa-gv-v10';

// Recursos do shell que devem ser cacheados na instalação
const SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-120.png',
  './icon-152.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];

// Domínios que NUNCA devem passar pelo cache (sempre network)
const NETWORK_ONLY_HOSTS = [
  'firebaseio.com',
  'firebase.google.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'googleapis.com',
];

// ── Install: cacheia o shell ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(SHELL_URLS).catch(err => {
        // Se algum recurso não estiver disponível na instalação (ex: offline),
        // ignora silenciosamente — o cache será preenchido na próxima vez.
        console.warn('[SW] Shell cache parcial:', err.message);
      });
    })
  );
  // Assume controle imediatamente quando o HTML mandar SKIP_WAITING
  self.skipWaiting();
});

// ── Activate: remove caches antigos ──────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => {
      // Avisa a página que o SW novo assumiu
      self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }));
      });
      return self.clients.claim();
    })
  );
});

// ── Fetch: intercepta requisições ────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1) Requisições não-GET → sempre network (PUT/PATCH/DELETE no Firebase)
  if (event.request.method !== 'GET') return;

  // 2) Firebase e APIs externas → sempre network, sem cache
  if (NETWORK_ONLY_HOSTS.some(host => url.hostname.includes(host))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3) Parâmetros anti-cache (_fresh, _v) → sempre network, sem guardar
  if (url.searchParams.has('_fresh') || url.searchParams.has('_v')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 4) Protocolo não-http (blob:, chrome-extension:, etc.) → ignora
  if (!url.protocol.startsWith('http')) return;

  // 5) HTML principal → NETWORK-FIRST: sempre tenta buscar a versão mais
  //    recente na rede primeiro, e só usa o cache se a rede falhar
  //    (offline ou timeout). Isso garante que ninguém fique preso numa
  //    versão antiga — assim que você publica um index.html novo no
  //    GitHub Pages, todos passam a receber a versão nova no próximo
  //    carregamento, sem precisar limpar cache manualmente.
  const ehHtmlPrincipal = url.pathname.endsWith('index.html') || url.pathname.endsWith('/');
  if (ehHtmlPrincipal) {
    event.respondWith(
      Promise.race([
        fetch(event.request, { cache: 'no-store' }),
        // Não deixa a rede lenta travar o carregamento indefinidamente —
        // depois de 4s sem resposta, cai para o cache (se existir).
        new Promise((_, reject) => setTimeout(() => reject(new Error('sw-timeout')), 4000))
      ])
        .then(response => {
          if (response.ok && url.origin === self.location.origin) {
            const respClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // 6) Demais recursos do shell (ícones, manifest, fontes, CDN) → Cache-first
  //    com fallback para network — esses raramente mudam.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Não estava no cache → busca na rede e cacheia
      return fetch(event.request).then(response => {
        // Só cacheia respostas válidas de mesma origem
        if (
          response.ok &&
          response.type !== 'opaque' &&
          url.origin === self.location.origin
        ) {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        }
        return response;
      }).catch(() => {
        // Offline e sem cache → tenta servir o HTML principal como fallback
        return caches.match('./index.html');
      });
    })
  );
});

// ── Message: SKIP_WAITING enviado pelo HTML ───────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
