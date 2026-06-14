/* InfluexAI PWA Service Worker */
const CACHE_VERSION = "influexai-v2";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const SHELL_URLS = ["/", "/offline.html"];

const STATIC_URLS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable.png",
  "/badge-72.png",
  "/favicon.ico",
];

function isNavigation(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" && request.headers.get("accept")?.includes("text/html"))
  );
}

function isApi(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith("/api/");
}

function shouldCacheResponse(request, response) {
  if (request.method !== "GET") return false;
  if (!response || !response.ok || response.status !== 200) return false;
  if (response.status === 206) return false;

  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  return true;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)),
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_URLS)),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("influexai-") && k !== SHELL_CACHE && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (isApi(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isNavigation(request)) {
    event.respondWith(navigationHandler(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function navigationHandler(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/dashboard")) {
    try {
      return await fetch(request);
    } catch {
      const offline = await caches.match("/offline.html");
      if (offline) return offline;
      return new Response("Offline", { status: 503, statusText: "Offline" });
    }
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    if (shouldCacheResponse(request, response)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match("/offline.html");
    if (offline) return offline;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (shouldCacheResponse(request, response)) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached ?? (await fetchPromise) ?? new Response("", { status: 504 });
}

/* --- Push notifications (Web Push) --- */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = { title: "InfluexAI", body: "", url: "/dashboard" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      data: { url: data.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = event.notification.data?.url || "/dashboard";
  const target = new URL(raw, self.location.origin).href;

  if (!target.startsWith(self.location.origin)) {
    event.waitUntil(
      clients.openWindow
        ? clients.openWindow(`${self.location.origin}/dashboard`)
        : Promise.resolve()
    );
    return;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(target);
      })
  );
});

/* --- Background Sync: generation queue --- */

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-generations") {
    event.waitUntil(notifyClientsSync());
  }
});

async function notifyClientsSync() {
  const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of all) {
    client.postMessage({ type: "SYNC_GENERATIONS" });
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
