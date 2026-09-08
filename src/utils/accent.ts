import type { LucideIcon } from 'lucide-react'

/**
 * Single source of truth for the app's color system. Per design direction,
 * the whole app uses only 4 consistent accent colors — every feature maps
 * to exactly one of them, rather than each card inventing its own color:
 *
 *  - primary   (emerald)  → fitness / workouts / strength / streaks
 *  - secondary (violet)   → body & wellness (weight, sleep, mood, habits)
 *  - accent    (cyan/sky) → hydration, steps, daily activity
 *  - fire      (amber→red)→ nutrition, energy, points, celebrations
 */
export type AccentKey = 'primary' | 'secondary' | 'accent' | 'fire'

export const ACCENT_GRADIENT: Record<AccentKey, string> = {
  primary: 'gradient-primary',
  secondary: 'gradient-secondary',
  accent: 'gradient-accent',
  fire: 'gradient-fire',
}

export const ACCENT_HEX: Record<AccentKey, [string, string]> = {
  primary: ['#10b981', '#059669'],
  secondary: ['#8b5cf6', '#6366f1'],
  accent: ['#06b6d4', '#0ea5e9'],
  fire: ['#f59e0b', '#ef4444'],
}

export const ACCENT_TEXT: Record<AccentKey, string> = {
  primary: 'text-emerald-500',
  secondary: 'text-violet-500',
  accent: 'text-sky-500',
  fire: 'text-orange-500',
}

export const ACCENT_SOFT_BG: Record<AccentKey, string> = {
  primary: 'bg-emerald-500/10',
  secondary: 'bg-violet-500/10',
  accent: 'bg-sky-500/10',
  fire: 'bg-orange-500/10',
}

/** Which accent a given feature/category belongs to — the mapping used
 * consistently across Home, Calendar, Analytics, and More. */
export const CATEGORY_ACCENT: Record<string, AccentKey> = {
  workout: 'primary',
  gym: 'primary',
  strength: 'primary',
  habit: 'primary',
  steps: 'accent',
  water: 'accent',
  activity: 'accent',
  weight: 'secondary',
  sleep: 'secondary',
  mood: 'secondary',
  measurements: 'secondary',
  photos: 'secondary',
  nutrition: 'fire',
  food: 'fire',
  points: 'fire',
  streak: 'fire',
  achievements: 'fire',
  challenges: 'fire',
  records: 'fire',
  reports: 'primary',
}

export function accentFor(category: string): AccentKey {
  return CATEGORY_ACCENT[category] ?? 'primary'
}

export interface CategoryMeta {
  icon: LucideIcon
  accent: AccentKey
}
