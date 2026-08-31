import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Register the service worker for offline app-shell caching + installability (PWA).
// Skipped in dev to avoid caching issues with HMR, and skipped inside the
// Capacitor native WebView where it isn't needed.
if ('serviceWorker' in navigator && import.meta.env.PROD && !(window as unknown as { Capacitor?: unknown }).Capacitor) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
