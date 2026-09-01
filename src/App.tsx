import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect, Suspense, lazy } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore, applyTheme } from '@/stores/ui.store'
import { useAndroidBackButton } from '@/hooks/use-android-back-button'
import { useNativeStatusBar } from '@/hooks/use-native-status-bar'

import { AppShell } from '@/components/layout/app-shell'
import { AuthGuard } from '@/components/layout/auth-guard'
import { GuestGuard } from '@/components/layout/guest-guard'
import { SplashScreen } from '@/components/layout/splash-screen'

const LoginPage = lazy(() => import('@/pages/auth/login'))
const RegisterPage = lazy(() => import('@/pages/auth/register'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password'))
const OnboardingPage = lazy(() => import('@/pages/auth/onboarding'))

const DashboardPage = lazy(() => import('@/pages/dashboard/dashboard-page'))
const CalendarPage = lazy(() => import('@/pages/dashboard/calendar-page'))
const DayDetailPage = lazy(() => import('@/pages/dashboard/day-detail-page'))

const WorkoutHomePage = lazy(() => import('@/pages/workout/workout-home'))
const WorkoutLogPage = lazy(() => import('@/pages/workout/workout-log'))
const WorkoutTemplatesPage = lazy(() => import('@/pages/workout/templates'))
const ExerciseLibraryPage = lazy(() => import('@/pages/workout/exercise-library'))
const ExerciseHistoryPage = lazy(() => import('@/pages/workout/exercise-history'))
const WorkoutHistoryPage = lazy(() => import('@/pages/workout/workout-history'))

const NutritionPage = lazy(() => import('@/pages/nutrition/nutrition-page'))

const WaterPage = lazy(() => import('@/pages/tracking/water-page'))
const WeightPage = lazy(() => import('@/pages/tracking/weight-page'))
const StepsPage = lazy(() => import('@/pages/tracking/steps-page'))
const SleepPage = lazy(() => import('@/pages/tracking/sleep-page'))
const MoodPage = lazy(() => import('@/pages/tracking/mood-page'))
const MeasurementsPage = lazy(() => import('@/pages/tracking/measurements-page'))
const PhotosPage = lazy(() => import('@/pages/tracking/photos-page'))

const AnalyticsPage = lazy(() => import('@/pages/analytics/analytics-page'))
const AchievementsPage = lazy(() => import('@/pages/analytics/achievements-page'))
const ChallengesPage = lazy(() => import('@/pages/analytics/challenges-page'))
const PersonalRecordsPage = lazy(() => import('@/pages/analytics/personal-records-page'))
const ReportsPage = lazy(() => import('@/pages/analytics/reports-page'))

const SettingsPage = lazy(() => import('@/pages/settings/settings-page'))
const ProfilePage = lazy(() => import('@/pages/profile/profile-page'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
})

/**
 * Must render inside <BrowserRouter> so it can hook into router history for
 * the Android back button, and applies native status bar styling.
 */
function NativeAppBindings() {
  useAndroidBackButton()
  useNativeStatusBar()
  return null
}

function App() {
  const { initialize, isInitialized } = useAuthStore()
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    applyTheme(theme)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => theme === 'system' && applyTheme('system')
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [theme])

  if (!isInitialized) return <SplashScreen />

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NativeAppBindings />
        <Toaster
          position="top-center"
          toastOptions={{
            className: 'border shadow-xl',
            style: {
              borderRadius: '1rem',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
              fontWeight: 500,
            },
            success: {
              iconTheme: { primary: 'hsl(var(--success))', secondary: 'hsl(var(--card))' },
              style: { border: '1px solid hsl(var(--success) / 0.4)' },
            },
            error: {
              iconTheme: { primary: 'hsl(var(--destructive))', secondary: 'hsl(var(--card))' },
              style: { border: '1px solid hsl(var(--destructive) / 0.4)' },
            },
          }}
        />
        <Suspense fallback={<SplashScreen />}>
          <Routes>
            <Route element={<GuestGuard />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<AuthGuard />}>
              <Route path="/onboarding" element={<OnboardingPage />} />

              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/calendar/:date" element={<DayDetailPage />} />

                <Route path="/workout" element={<WorkoutHomePage />} />
                <Route path="/workout/log" element={<WorkoutLogPage />} />
                <Route path="/workout/log/:sessionId" element={<WorkoutLogPage />} />
                <Route path="/workout/templates" element={<WorkoutTemplatesPage />} />
                <Route path="/workout/exercises" element={<ExerciseLibraryPage />} />
                <Route path="/workout/exercises/:name" element={<ExerciseHistoryPage />} />
                <Route path="/workout/history" element={<WorkoutHistoryPage />} />

                <Route path="/nutrition" element={<NutritionPage />} />

                <Route path="/tracking/water" element={<WaterPage />} />
                <Route path="/tracking/weight" element={<WeightPage />} />
                <Route path="/tracking/steps" element={<StepsPage />} />
                <Route path="/tracking/sleep" element={<SleepPage />} />
                <Route path="/tracking/mood" element={<MoodPage />} />
                <Route path="/tracking/measurements" element={<MeasurementsPage />} />
                <Route path="/tracking/photos" element={<PhotosPage />} />

                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route path="/personal-records" element={<PersonalRecordsPage />} />
                <Route path="/reports" element={<ReportsPage />} />

                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
