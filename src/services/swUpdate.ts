// Gestione aggiornamenti del Service Worker (Workbox)
// Non ricarica mai automaticamente durante una sessione di Impara o Ripassa in corso.

type SwUpdateListener = () => void;

let updateReady = false;
let reloading = false;
const listeners = new Set<SwUpdateListener>();

export function isSwUpdateReady(): boolean {
  return updateReady;
}

export function markSwUpdateReady(): void {
  if (updateReady) return;
  updateReady = true;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeSwUpdate(listener: SwUpdateListener): () => void {
  listeners.add(listener);
  if (updateReady) {
    listener();
  }
  return () => {
    listeners.delete(listener);
  };
}

export function applySwUpdateReload(): void {
  if (reloading) return;
  reloading = true;
  window.location.reload();
}

export function initSwUpdateListener(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // Se all'avvio della pagina c'è già un controller, un successivo controllerchange
  // indica un aggiornamento reale del Service Worker (e non la prima installazione).
  const hadController = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    markSwUpdateReady();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (!reg) return;
        if (reg.waiting && hadController) {
          markSwUpdateReady();
        }
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              markSwUpdateReady();
            }
          });
        });
        reg.update().catch(() => {});
      })
      .catch(() => {});
  });
}
