const APP_CACHE = 'rcps-app-v14'
const ASSETS_CACHE = 'rcps-assets-v14'
const APP_SHELL_URLS = [
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/NotoSansDisplay-Variable.ttf',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(APP_CACHE).then((cache) => {
        return cache.addAll(APP_SHELL_URLS)
      }),
      precacheBuildAssets(ASSETS_CACHE),
    ]),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => ![APP_CACHE, ASSETS_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      )
    }),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const isSameOrigin = url.origin === self.location.origin

  if (!isSameOrigin) return

  if (request.mode === 'navigate') {
    event.respondWith(navigationShell(request, APP_CACHE, '/index.html'))
    return
  }

  if (APP_SHELL_URLS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, APP_CACHE))
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE))
    return
  }
})

async function navigationShell(request, cacheName, shellUrl) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(shellUrl, response.clone())
    }
    return response
  } catch {
    return (await cache.match(shellUrl)) || (await cache.match('/index.html'))
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return await cache.match(request)
  }
}

async function precacheBuildAssets(cacheName) {
  const cache = await caches.open(cacheName)

  try {
    const response = await fetch('/asset-manifest.json', { cache: 'no-store' })
    if (!response.ok) throw new Error(`asset-manifest status ${response.status}`)

    const assets = await response.json()
    const assetUrls = sanitizeAssetUrls(assets)
    if (assetUrls.length > 0) {
      await cache.addAll(assetUrls)
    }
  } catch (err) {
    console.warn('Could not load asset manifest:', err)
  }
}

function sanitizeAssetUrls(urls) {
  if (!Array.isArray(urls)) return []

  return [...new Set(urls)]
    .filter((url) => typeof url === 'string')
    .map((url) => url.trim())
    .filter((url) => url.startsWith('/assets/'))
    .filter((url) => !url.includes('..'))
}
