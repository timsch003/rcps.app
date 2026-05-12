const APP_CACHE = 'rcps-app-v10'
const ASSETS_CACHE = 'rcps-assets-v10'
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

  if (request.mode === 'navigate') {
    event.respondWith(navigationShell(request, APP_CACHE, '/index.html'))
    return
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE))
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
    if (Array.isArray(assets) && assets.length > 0) {
      await cache.addAll(assets)
      return
    }
  } catch (err) {
    console.warn('Could not load asset manifest:', err)
  }

  try {
    const response = await fetch('/index.html', { cache: 'no-store' })
    if (!response.ok) throw new Error(`index.html status ${response.status}`)

    const html = await response.text()
    const matches = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)]
    const assetUrls = [...new Set(matches.map((match) => match[1]))]
    if (assetUrls.length > 0) {
      await cache.addAll(assetUrls)
    }
  } catch (err) {
    console.warn('Could not precache assets from index.html:', err)
  }
}
