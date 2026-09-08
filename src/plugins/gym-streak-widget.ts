import { registerPlugin } from '@capacitor/core'

export interface GymStreakWidgetPlugin {
  /** Pushes the current gym streak count to the native 2x1 home-screen widget and triggers an immediate refresh. No-op on web. */
  updateStreak(options: { streak: number }): Promise<{ streak: number }>
}

const GymStreakWidget = registerPlugin<GymStreakWidgetPlugin>('GymStreakWidget')

export default GymStreakWidget
