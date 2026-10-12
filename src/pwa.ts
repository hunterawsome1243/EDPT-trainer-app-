/** Registers the service worker in the normal build. Skipped in the artifact build, where service workers are unavailable. */
export function registerPwa(): void {
  if (import.meta.env.VITE_ARTIFACT || !('serviceWorker' in navigator)) return
  import('virtual:pwa-register').then((m) => m.registerSW({ immediate: true })).catch(() => {})
}
