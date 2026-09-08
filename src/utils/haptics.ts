import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

/** Light tap feedback — checkbox toggles, tab switches, minor taps. */
export async function hapticTap() {
  if (!isNative) return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    /* no-op on unsupported devices */
  }
}

/** Medium feedback — completing an action (logging water, adding an item). */
export async function hapticSuccess() {
  if (!isNative) return
  try {
    await Haptics.notification({ type: NotificationType.Success })
  } catch {
    /* no-op */
  }
}

/** Stronger feedback — finishing a workout, hitting a streak milestone. */
export async function hapticCelebrate() {
  if (!isNative) return
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy })
  } catch {
    /* no-op */
  }
}
