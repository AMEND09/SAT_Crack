// Service Worker for SAT Crack
const CACHE_NAME = 'sat-crack-v1.2';

// Resources to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/topics.html',
  '/practice.html',
  '/profile.html',
  '/css/styles.css',
  '/css/loading.css',
  '/js/main.js',
  '/js/app.js',
  '/js/loaders.js',
  '/js/cache-utils.js',
  '/js/content-loader.js',
  '/js/performance-monitor.js',
  '/js/tab-manager.js',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/manifest.json'
];

// Assets that should be cached immediately on install
const CRITICAL_ASSETS = [
  '/index.html',
  '/css/styles.css',
  '/js/cache-utils.js',
  '/js/content-loader.js',
  '/js/performance-monitor.js',
  '/js/loaders.js'
];

// Install event - Cache critical assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Critical assets cached');
      })
  );
});

// Activate event - Clean up old caches and claim clients
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker');
  
  // Delete old caches
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => {
        console.log('[Service Worker] Service Worker activated');
        // Claim any clients that are already open
        return self.clients.claim();
      })
  );
  
  // Begin caching remaining non-critical assets
  setTimeout(() => {
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching remaining assets');
        const remainingAssets = PRECACHE_ASSETS.filter(
          asset => !CRITICAL_ASSETS.includes(asset)
        );
        return cache.addAll(remainingAssets);
      })
      .then(() => {
        console.log('[Service Worker] All assets cached');
      });
  }, 5000); // Delay non-critical caching to prioritize app startup
});

// Fetch event - Serve from cache with network fallback
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Special handling for HTML navigation requests - network first for freshness
  if (event.request.mode === 'navigate' || 
      (event.request.method === 'GET' && 
       event.request.headers.get('accept').includes('text/html'))) {
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the latest version
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // If network fails, use cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, try the offline page
              return caches.match('/index.html');
            });
        })
    );
    return;
  }
  
  // For API requests - network first with timeout
  if (event.request.url.includes('api.jsonsilo.com')) {
    const timeoutDuration = 3000; // 3 seconds timeout
    
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        resolve(caches.match(event.request));
      }, timeoutDuration);
    });
    
    const networkPromise = fetch(event.request).then(response => {
      // Cache successful API responses
      const clonedResponse = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, clonedResponse);
      });
      return response;
    });
    
    event.respondWith(
      Promise.race([networkPromise, timeoutPromise])
        .then(response => response || caches.match(event.request))
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Default strategy - cache first, falling back to network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached response immediately
          
          // Refresh cache in background for next time (stale-while-revalidate)
          fetch(event.request)
            .then(response => {
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, response));
            })
            .catch(() => {
              // Ignore fetch errors - we already have a cached version
            });
          
          return cachedResponse;
        }
        
        // If not in cache, get from network
        return fetch(event.request)
          .then(response => {
            // Cache the network response for future
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clonedResponse);
            });
            return response;
          });
      })
  );
});

// Handle background sync for offline operations
self.addEventListener('sync', event => {
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Sync user data with server when online
function syncUserData() {
  return self.clients.matchAll()
    .then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_REQUIRED'
        });
      });
    });
}
