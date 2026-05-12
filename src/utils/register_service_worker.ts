export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return

  const register = () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  }

  if (document.readyState === 'loading') {
    window.addEventListener('load', register)
  } else {
    register()
  }
}
