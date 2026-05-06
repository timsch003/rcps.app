const APP_CACHE = 'rcps-app-v1'
const RUNTIME_CACHE = 'rcps-runtime-v1'
const MODEL_CACHE = 'rcps-model-v1'

const APP_SHELL_URLS = ['/', '/index.html', '/manifest.json', '/favicon.ico']

const MODEL_HOSTS = new Set([
  'huggingface.co',
  'hf.co',
  'cdn-lfs.hf.co',
  'cdn-lfs-us-1.hf.co',
  'cdn-lfs-eu-1.hf.co',
])

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_URLS)
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => ![APP_CACHE, RUNTIME_CACHE, MODEL_CACHE].includes(key))
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

  if (isModelRequest(url)) {
    event.respondWith(cacheFirst(request, MODEL_CACHE))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, APP_CACHE, '/index.html'))
    return
  }

  if (url.origin === self.location.origin && isRuntimeAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
  }
})

function isModelRequest(url) {
  if (url.origin === self.location.origin && url.pathname.startsWith('/models/')) return true

  if (!MODEL_HOSTS.has(url.hostname)) return false

  // Cache model/tokenizer/config fetches from Hugging Face.
  return (
    /\/resolve\//.test(url.pathname) ||
    /onnx|tokenizer|config|generation|special_tokens/i.test(url.pathname)
  )
}

function isRuntimeAsset(request, url) {
  if (url.pathname.startsWith('/models/')) return true

  return ['script', 'style', 'font', 'image', 'manifest'].includes(request.destination)
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone())
  }
  return response
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => undefined)

  return cached || (await networkPromise) || fetch(request)
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return (await cache.match(request)) || (await cache.match(fallbackUrl))
  }
}
