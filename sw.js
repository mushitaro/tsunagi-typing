/* ═══════════════════════════════════════
   タイピング・インベーダー — Service Worker
   同一オリジンは Cache-First（オフライン即起動）、
   外部オリジン（Google Fonts）は Network-First → Cache フォールバック。
   ═══════════════════════════════════════ */

const CACHE_NAME = 'tsunagi-typing-v7';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',

  './css/tokens.css',
  './css/layout.css',
  './css/crt.css',
  './css/components.css',

  './js/main.js',
  './js/core/canvas-resize.js',
  './js/core/event-bus.js',
  './js/core/game-loop.js',
  './js/core/input.js',
  './js/core/scene-manager.js',

  './js/data/sprite-loader.js',
  './js/data/word-loader.js',
  './js/data/sprites/palettes.json',
  './js/data/sprites/sprite-library.json',
  './js/data/words/manifest.json',
  './js/data/words/math.en.json',
  './js/data/words/math.ja.json',
  './js/data/words/sea-creatures.en.json',
  './js/data/words/sea-creatures.ja.json',
  './js/data/words/sharks.en.json',
  './js/data/words/sharks.ja.json',

  './js/romaji/kana-table.js',
  './js/romaji/plain-matcher.js',
  './js/romaji/romaji-matcher.js',

  './js/render/cannon-renderer.js',
  './js/render/laser-renderer.js',
  './js/render/particle-system.js',
  './js/render/pixel-sprite-renderer.js',
  './js/render/starfield.js',

  './js/audio/sfx.js',
  './js/audio/speech.js',

  './js/game/destruction-mapper.js',
  './js/game/scoring.js',
  './js/game/typing-session.js',
  './js/game/word-queue.js',

  './js/profile/profile-store.js',
  './js/profile/ranks.js',

  './js/ui/keyboard-overlay.js',
  './js/ui/sprite-thumbnail.js',

  './js/scenes/game-scene.js',
  './js/scenes/mode-select-scene.js',
  './js/scenes/profile-create-scene.js',
  './js/scenes/profile-select-scene.js',
  './js/scenes/results-scene.js',
  './js/scenes/title-scene.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}
