// ── SAGA Engenharia Service Worker ──────────────────────────────────────────
const CACHE_NAME = 'saga-engenharia-v1'

// Recursos críticos para funcionar offline (shell do app)
const PRECACHE_URLS = [
    '/',
    '/dashboard',
    '/manifest.json',
    '/ico-branco.png',
    '/ico-cinza.png',
    '/logo-preferencial-branco.png',
    '/logo-preferencial-cinza.png',
]

// ── Install: pré-cacheia o shell ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS).catch(() => {
                // Se algum asset falhar, continua mesmo assim
            })
        }).then(() => self.skipWaiting())
    )
})

// ── Activate: remove caches antigos ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    )
})

// ── Fetch: Network First para API, Cache First para assets ───────────────────
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url)

    // Ignora requests não GET e requests para APIs externas (Supabase, etc.)
    if (event.request.method !== 'GET') return
    if (url.hostname.includes('supabase.co')) return
    if (url.hostname.includes('openmeteo') || url.hostname.includes('open-meteo')) return

    // Para navegação (páginas): Network First com fallback para cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Salva no cache se for resposta válida
                    if (response.ok) {
                        const clone = response.clone()
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
                    }
                    return response
                })
                .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/dashboard')))
        )
        return
    }

    // Para assets estáticos (imagens, JS, CSS): Cache First
    if (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.woff2')
    ) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached
                return fetch(event.request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone()
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
                    }
                    return response
                })
            })
        )
        return
    }

    // Para todo o resto: Network First simples
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    )
})

// ── Push notifications (futuro) ──────────────────────────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return
    const data = event.data.json()
    self.registration.showNotification(data.title || 'SAGA Engenharia', {
        body: data.body || '',
        icon: '/ico-branco.png',
        badge: '/ico-branco.png',
        tag: data.tag || 'saga-notification',
    })
})
