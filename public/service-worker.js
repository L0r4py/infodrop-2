// public/service-worker.js

const CACHE_NAME = 'infodrop-v1';
const urlsToCache = [
    '/',
    '/static/css/main.css',
    '/static/js/main.js',
    '/manifest.json',
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png'
];

// Installation du Service Worker
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Installation...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Mise en cache des ressources');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activation...');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Stratégie de cache : Network First avec fallback
self.addEventListener('fetch', event => {
    const { request } = event;

    // Ne pas cacher les requêtes POST
    if (request.method !== 'GET') return;

    // API calls - Network Only
    if (request.url.includes('/api/') || request.url.includes('supabase')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({ error: 'Hors ligne' }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            })
        );
        return;
    }

    // Assets statiques - Cache First
    if (request.url.includes('/static/')) {
        event.respondWith(
            caches.match(request).then(response => {
                return response || fetch(request).then(fetchResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
        return;
    }

    // HTML - Network First avec fallback
    event.respondWith(
        fetch(request)
            .then(response => {
                // Clone la réponse car elle ne peut être utilisée qu'une fois
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                return caches.match(request).then(response => {
                    if (response) {
                        return response;
                    }

                    // Page offline par défaut
                    return caches.match('/offline.html').catch(() => {
                        return new Response('Hors ligne', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/html'
                            })
                        });
                    });
                });
            })
    );
});

// Gestion des notifications push
self.addEventListener('push', event => {
    console.log('[ServiceWorker] Push reçu');

    const options = {
        body: event.data ? event.data.text() : 'Nouvel article disponible !',
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Lire',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Fermer',
                icon: '/icons/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('INFODROP', options)
    );
});

// Gestion des clics sur notification
self.addEventListener('notificationclick', event => {
    console.log('[ServiceWorker] Clic sur notification');

    event.notification.close();

    if (event.action === 'explore') {
        clients.openWindow('/');
    }
});

// Background Sync pour les actions offline
self.addEventListener('sync', event => {
    console.log('[ServiceWorker] Background sync:', event.tag);

    if (event.tag === 'sync-articles') {
        event.waitUntil(syncArticles());
    }
});

async function syncArticles() {
    try {
        // Récupérer les actions en attente depuis IndexedDB
        // et les synchroniser avec le serveur
        console.log('[ServiceWorker] Synchronisation des articles...');
    } catch (error) {
        console.error('[ServiceWorker] Erreur sync:', error);
    }
}