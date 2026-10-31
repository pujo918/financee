// Service Worker – Finance Tracker PWA
const CACHE_NAME = 'finance-pwa-v1';

const STATIC_ASSETS = [
    './',
    './index.html',
    './saving.html',
    './calculator.html',
    './style.css',
    './manifest.json',
    './nav-menu.js',
    './app-monthly.js',
    './app-saving.js',
    './app-calculator.js',
    './app-global-voice.js',
    './voice-parser.js',
    './images/icon-192.png',
    './images/icon-512.png',
    './images/naruto.jpeg',
    './images/naruto (12).jpg',
    './images/naruto__1_-removebg-preview.png',
    './images/naruto__2_-removebg-preview.png',
    './images/naruto__3_-removebg-preview.png',
    './images/naruto__5_-removebg-preview.png',
    './images/naruto__6_-removebg-preview.png',
    './images/naruto__10_-removebg-preview.png'
];

// Install: pre-cache all static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Pre-cache partial fail, continuing...', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Stale-While-Revalidate for local assets, network-first for external/APIs
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Skip non-GET requests or Google Apps Script Webhooks
    if (req.method !== 'GET' || url.hostname.includes('script.google.com')) {
        return;
    }

    event.respondWith(
        caches.match(req).then((cachedResponse) => {
            const fetchPromise = fetch(req).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(req, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // If offline and requesting navigation, fallback to index.html
                if (req.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });

            return cachedResponse || fetchPromise;
        })
    );
});
