import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import toast from 'react-hot-toast'

// Routes that are considered "home" screens for each bottom-tab / top-level
// section. Pressing back while on one of these (and there's no in-app
// history to unwind) will NOT exit the app on the very first press — the
// user gets a "press back again to exit" grace period instead, unless
// they're on the dashboard where a single extra back press exits.
const ROOT_PATHS = new Set(['/', '/calendar', '/workout', '/nutrition', '/analytics'])

/**
 * Wires the Android hardware/gesture back button to React Router history
 * instead of Capacitor's default behavior (which falls through to
 * webview.goBack() or exits the app immediately). This fixes the reported
 * issue where navigating into any page and pressing back would kick the
 * user straight out of the app instead of returning to the previous screen.
 *
 * Behavior:
 * - If there is in-app navigation history, go back one step (like a normal
 *   Android app).
 * - If we're already at a root/home-level screen with no history left,
 *   require a second back press within 2s to actually exit the app
 *   (standard Android UX pattern) — prevents accidental exits.
 */
export function useAndroidBackButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationRef = useRef(location)
  const lastBackPressRef = useRef(0)
  const exitToastShownRef = useRef(false)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const canGoBack = () => window.history.state?.idx > 0

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      const path = locationRef.current.pathname

      if (canGoBack() && !ROOT_PATHS.has(path)) {
        navigate(-1)
        return
      }

      if (!ROOT_PATHS.has(path)) {
        // No history but not on a root screen (e.g. deep link) — send home.
        navigate('/', { replace: true })
        return
      }

      if (path !== '/') {
        // On a root tab other than dashboard — go to dashboard first.
        navigate('/', { replace: true })
        return
      }

      // On the dashboard root with no history: require double-press to exit.
      const now = Date.now()
      if (now - lastBackPressRef.current < 2000) {
        CapacitorApp.exitApp()
        return
      }
      lastBackPressRef.current = now
      if (!exitToastShownRef.current) {
        exitToastShownRef.current = true
        toast('Press back again to exit', { icon: '👋', duration: 2000 })
        setTimeout(() => {
          exitToastShownRef.current = false
        }, 2000)
      }
    })

    return () => {
      listenerPromise.then((h) => h.remove())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])
}
