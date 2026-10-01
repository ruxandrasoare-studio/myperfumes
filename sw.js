// Bump VERSION whenever you change index.html so phones pick up the update.
const VERSION = "layer-v9";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.hostname === "api.anthropic.com") return; // never cache AI calls
  const isFont = url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com");
  if (e.request.mode === "navigate") {
    // App page: try network for updates, fall back to cache offline
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put("index.html", c)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  if (isFont || url.origin === location.origin) {
    // Cache-first for fonts and app files
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return r;
    })));
  }
});
