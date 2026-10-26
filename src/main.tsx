import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted Inter, loaded before index.css so --font-sans resolves to an
// actually-available font instead of silently falling back to the OS
// default (the previous CSS declared "Inter"/"Plus Jakarta Sans" but never
// loaded either, so every device was rendering system-ui the whole time).
// Only the weights the UI actually uses are imported, to keep bundle size down.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Register the service worker for offline app-shell caching + installability
// (PWA). Skipped in dev to avoid caching issues with HMR. Registered inside
// the Capacitor Android WebView too — the app is served over the https
// scheme (androidScheme: 'https'), so the service worker works there and
// gives the native app basic offline support for the app shell.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
