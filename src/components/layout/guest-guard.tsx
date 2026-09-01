import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Prevents a signed-in user from reaching the login/register screens and
 * silently switching accounts. Per product requirement: only one account
 * may be active in the app at a time, and switching accounts requires an
 * explicit sign-out first. If a session already exists, redirect to the
 * dashboard instead of rendering the auth form.
 */
export function GuestGuard() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return null
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}
