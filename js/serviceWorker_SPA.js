const CACHE_NAME = "dynamic-app-cache";
const INDEX_URL = "/"; // Base app shell, always served for valid app paths
const STATIC_ASSETS = ["/js/serviceWorkerHelpers.js"];

self.addEventListener("install", event => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(err => {
            console.error("Error adding static assets to cache:", err);
        }))
    );

});

self.addEventListener("activate", event => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })()
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    if (isPagePath(url)) {
        // Handle requests for app "pages" (e.g., "/", "/app/...") with Stale-While-Revalidate
        event.respondWith(handlePageRequest());
    } else {
        // Handle other resources (e.g., images, scripts, etc.) with Stale-While-Revalidate
        event.respondWith(staleWhileRevalidate(event.request));
    }
});

// Handle valid "pages" paths (always returning index.html)
async function handlePageRequest() {
    const cache = await caches.open(CACHE_NAME);

    // Serve cached index.html file for all page-related paths
    const cachedIndex = await cache.match(INDEX_URL);
    if (cachedIndex) {
        // If cached version exists, serve it while updating in the background
        fetch(INDEX_URL)
            .then(networkResponse => {
                if (networkResponse.ok) {
                    //console.log("Updating cached index.html file.");
                    cache.put(INDEX_URL, networkResponse.clone());
                }
            })
            .catch(err => {
                //console.warn("Failed to fetch updated index.html:", err);
            });
        return cachedIndex;
    }

    // If index.html is missing in cache, fetch it directly
    //console.log("index.html missing from cache. Fetching from network.");
    return fetch(INDEX_URL)
        .then(networkResponse => {
            if (networkResponse.ok) {
                cache.put(INDEX_URL, networkResponse.clone());
                return networkResponse;
            } else {
                console.error("Failed to fetch index.html from network:", networkResponse.status);
                return new Response("Unable to fetch index.html and it's not cached.", {
                    status: 503,
                });
            }
        })
        .catch(() =>
            new Response("App offline and index.html not found in cache.", { status: 503 })
        );
}

/**
 * Implement Stale-While-Revalidate caching strategy:
 * Serve cached content immediately, fetch & update cache in background.
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);

    // Try to serve the cached response first
    const cachedResponse = await cache.match(request);
    const cachedClone = cachedResponse?.clone();
    const fetchPromise = fetch(request, { cache: "reload" })
        .then(async networkResponse => {
            if (networkResponse.ok) {
                //console.log(`Stale-While-Revalidate: Updating cache for ${request.url}`);
                await cache.put(request, networkResponse.clone());

                if (cachedClone) {
                    const networkClone = networkResponse.clone();
                    await responsesAreEqual(cachedClone, networkClone).then(isEqual => {
                        // Notify clients of updates only when changes are detected
                        if (!isEqual) {
                            notifyClientsUpdate(request.url);
                        }
                    });
                }
            } else {
                //console.warn(`Network response was not OK for ${request.url}:`, networkResponse.status);
            }
            return networkResponse;
        })
        .catch(err => {
            //console.error(`Network fetch failed for ${request.url}:`, err);
            return null; // Let the fallback take over if possible
        });

    // Serve the cached response immediately, fallback to network response
    return cachedResponse || (await fetchPromise) || new Response("Resource unavailable offline.", { status: 503 });
}

// Define app-specific page detection
function isPagePath(url) {
    const path = url.pathname;
    return path === "/" || path === "/app" || path.startsWith("/app/");
}

/**
 * Compare two responses (cached and network).
 * Perform binary comparison between their bodies.
 */
async function responsesAreEqual(cachedResponse, networkResponse) {
    const cachedText = await cachedResponse.text();
    const networkText = await networkResponse.text();
    return cachedText === networkText;
}

/**
 * Notify all connected clients about changes in the resource.
 */
async function notifyClientsUpdate(url) {
    const clients = await self.clients.matchAll({ type: "window" });

    for (const client of clients) {
        client.postMessage({
            type: "RESOURCE_UPDATED",
            resource: url,
        });
    }
}

// For debugging
async function logCachedContent() {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    console.log("Cached content:");
    keys.forEach(request => console.log(request.url));
}