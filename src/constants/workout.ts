import { Dumbbell, Bike, Waves, Zap, StretchHorizontal, Move, Flower2 } from 'lucide-react'
import type { WorkoutType } from '@/types/database.types'

export interface WorkoutTypeMeta {
  type: WorkoutType
  label: string
  icon: typeof Dumbbell
  gradient: string
}

export const WORKOUT_TYPES: WorkoutTypeMeta[] = [
  { type: 'strength', label: 'Strength Training', icon: Dumbbell, gradient: 'gradient-primary' },
  { type: 'machine_cardio', label: 'Machine Cardio', icon: Bike, gradient: 'gradient-accent' },
  { type: 'outdoor_cardio', label: 'Outdoor Cardio', icon: Waves, gradient: 'bg-gradient-to-br from-cyan-400 to-blue-500' },
  { type: 'functional', label: 'Functional', icon: Move, gradient: 'gradient-secondary' },
  { type: 'hiit', label: 'HIIT', icon: Zap, gradient: 'gradient-fire' },
  { type: 'stretching', label: 'Stretching', icon: StretchHorizontal, gradient: 'bg-gradient-to-br from-teal-400 to-emerald-500' },
  { type: 'mobility', label: 'Mobility', icon: Move, gradient: 'bg-gradient-to-br from-indigo-400 to-purple-500' },
  { type: 'yoga', label: 'Yoga', icon: Flower2, gradient: 'bg-gradient-to-br from-pink-400 to-rose-500' },
]
