import confetti from 'canvas-confetti'
import { hapticSuccess, hapticCelebrate } from './haptics'

/**
 * Small celebratory bursts used across the app whenever the user completes
 * something meaningful (a habit, a workout, a streak milestone, a new
 * personal record). Kept short and tasteful — this isn't meant to be a
 * gamified "level up" moment, just a little dopamine hit for showing up.
 */
export function celebrate() {
  hapticSuccess()
  const colors = ['#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899']
  confetti({
    particleCount: 70,
    spread: 70,
    startVelocity: 32,
    origin: { y: 0.7 },
    colors,
    scalar: 0.9,
    ticks: 150,
  })
}

/** A bigger burst for genuinely special moments — streak milestones, new PRs. */
export function celebrateBig() {
  hapticCelebrate()
  const colors = ['#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#ef4444']
  const end = Date.now() + 500
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
