import { Capacitor } from '@capacitor/core'
import GymStreakWidget from '@/plugins/gym-streak-widget'

const isNative = Capacitor.isNativePlatform()

/**
 * Pushes the latest gym streak count to the native 2x1 "Gym Streak" home
 * screen widget so it refreshes immediately (instead of waiting for
 * Android's periodic update tick) whenever the dashboard loads or a
 * workout is saved/deleted. Silently does nothing on web/unsupported
 * platforms.
 */
export async function syncGymStreakWidget(streak: number) {
  if (!isNative) return
  try {
    await GymStreakWidget.updateStreak({ streak })
  } catch {
    /* no-op — widget sync is best-effort, never blocks the UI */
  }
}
