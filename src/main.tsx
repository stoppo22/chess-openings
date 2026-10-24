import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Forza il controllo di aggiornamenti del Service Worker all'avvio e ricarica
// automaticamente la pagina una sola volta quando un nuovo precache prende il controllo.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        reg.update().catch(() => {});
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
