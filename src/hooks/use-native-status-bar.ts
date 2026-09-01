import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useUIStore } from '@/stores/ui.store'

/**
 * Keeps the native Android status bar text/icon color in sync with the
 * app's light/dark theme, and ensures the WebView draws content below the
 * status bar (instead of the header being hidden behind the camera
 * cutout / notch on small-screen phones). Actual spacing is handled via the
 * `--safe-area-inset-*` CSS variables Capacitor injects, consumed in
 * index.css and app-shell.tsx.
 */
export function useNativeStatusBar() {
  const theme = useUIStore((s) => s.resolvedTheme())

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    StatusBar.setOverlaysWebView({ overlay: true })
      .then(() => StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light }))
      .catch(() => undefined)
  }, [theme])
}
