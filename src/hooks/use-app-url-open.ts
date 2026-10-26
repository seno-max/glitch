import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

/**
 * Handles deep links (fittrack://...) on Android: when an auth email
 * (password reset / email confirmation) opens the app via the scheme
 * registered in the AndroidManifest's VIEW intent filter, this listener
 * routes the user to the matching in-app screen. Without it the link would
 * just open the app on whatever screen it was last on, or die in the
 * browser. Also handles the Supabase session token in the URL fragment via
 * detectSessionInUrl on the supabase client.
 */
export function useAppUrlOpen() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleUrl = (url: URL) => {
      const path = url.host ? `/${url.host}${url.pathname}` : url.pathname
      // Known auth routes map 1:1; anything else goes home.
      const known = ['/reset-password', '/login', '/register', '/onboarding', '/']
      const target = known.find((k) => path === k || path.startsWith(`${k}/`)) ?? '/'
      navigate(target, { replace: true })
    }

    const listenerPromise = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      try {
        handleUrl(new URL(url))
      } catch {
        /* malformed URL — ignore */
      }
    })

    // Also handle the cold-start case where the app was launched by the
    // deep link before this listener was registered.
    CapacitorApp.getLaunchUrl()
      .then((launch) => {
        if (launch?.url) {
          try {
            handleUrl(new URL(launch.url))
          } catch {
            /* malformed URL — ignore */
          }
        }
      })
      .catch(() => undefined)

    return () => {
      listenerPromise.then((h) => h.remove())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])
}
