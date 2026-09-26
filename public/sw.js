importScripts("/sw-policy.js");

const CACHE = "diary-shell-v2";
const SHELL = ["/offline", "/icons/192", "/icons/512"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method === "GET" &&
    url.origin === self.location.origin &&
    request.mode === "navigate"
  ) {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  if (!self.DiaryCachePolicy.shouldCache(request, url, self.location.origin)) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const fetched = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || fetched;
    }),
  );
});
