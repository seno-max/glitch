import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { SplashScreen } from './splash-screen'

export function AuthGuard() {
  const { user, profile, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <SplashScreen />

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (profile && !profile.onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
