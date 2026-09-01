import type {
  WorkoutSession,
  StrengthExercise,
  Meal,
  WaterLog,
  WeightLog,
  SleepLog,
  MoodLog,
  StepLog,
  Streak,
  Challenge,
  PersonalRecord,
  Habit,
  HabitCheckin,
} from './database.types'

// ----------------------------------------------------------------------------
// Calendar day status — used to color-code the monthly calendar
// ----------------------------------------------------------------------------
export type CalendarDayStatus =
  | 'gym_completed'
  | 'rest_day'
  | 'no_workout'
  | 'weight_logged'
  | 'challenge_completed'
  | 'personal_record'

export interface CalendarDaySummary {
  date: string
  statuses: CalendarDayStatus[]
  primaryStatus: CalendarDayStatus
  pointsEarned: number
  hasWorkout: boolean
  hasWeightLog: boolean
  hasPR: boolean
  hasChallengeCompleted: boolean
}

// ----------------------------------------------------------------------------
// Dashboard aggregate view models
// ----------------------------------------------------------------------------
export interface DashboardSummary {
  greeting: string
  date: string
  currentWeightKg: number | null
  goalWeightKg: number | null
  weightDifferenceKg: number | null
  lastWeightLogDate: string | null
  pointsToday: number
  totalPoints: number
  currentStreaks: Streak[]
  habitsToday: HabitProgress[]
  todaysProgress: DailyProgress
  weeklyProgress: PeriodProgress
  monthlyProgress: PeriodProgress
}

// ----------------------------------------------------------------------------
// Habits — dashboard view model combining a habit definition with today's
// check-in progress against its own custom target_count.
// ----------------------------------------------------------------------------
export interface HabitProgress {
  habit: Habit
  checkedCount: number
  completed: boolean
  pointsAwardedToday: boolean
}

export interface DailyProgress {
  stepsCurrent: number
  stepsGoal: number
  waterCurrentMl: number
  waterGoalMl: number
  workoutDone: boolean
}

export interface PeriodProgress {
  label: string
  workoutsCompleted: number
  totalWorkoutMinutes: number
  avgSteps: number
  avgWater: number
  weightChangeKg: number | null
}

// ----------------------------------------------------------------------------
// Day detail — everything logged on a single day
// ----------------------------------------------------------------------------
export interface DayActivityLog {
  date: string
  workoutSessions: (WorkoutSession & { strengthExercises: StrengthExercise[] })[]
  meals: Meal[]
  waterLogs: WaterLog[]
  weightLog: WeightLog | null
  sleepLog: SleepLog | null
  moodLog: MoodLog | null
  stepLog: StepLog | null
  habitCheckins: (HabitCheckin & { habit: Habit | null })[]
  wakeUpTime: string | null
  sleepTime: string | null
  notes: string | null
}

// ----------------------------------------------------------------------------
// Gamification config
// ----------------------------------------------------------------------------
export const XP_LEVEL_THRESHOLDS: { level: number; xp: number }[] = [
  { level: 1, xp: 0 },
  { level: 2, xp: 1000 },
  { level: 3, xp: 2500 },
  { level: 4, xp: 4500 },
  { level: 5, xp: 7000 },
  { level: 6, xp: 10000 },
  { level: 7, xp: 14000 },
  { level: 8, xp: 18500 },
  { level: 9, xp: 24000 },
  { level: 10, xp: 30000 },
]

export function getLevelForXp(xp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number; progressPct: number } {
  let current = XP_LEVEL_THRESHOLDS[0]
  let next = XP_LEVEL_THRESHOLDS[1]

  for (let i = 0; i < XP_LEVEL_THRESHOLDS.length; i++) {
    if (xp >= XP_LEVEL_THRESHOLDS[i].xp) {
      current = XP_LEVEL_THRESHOLDS[i]
      next = XP_LEVEL_THRESHOLDS[i + 1] ?? {
        level: current.level + 1,
        xp: current.xp + (current.level + 1) * 2000,
      }
    }
  }

  const span = next.xp - current.xp
  const into = xp - current.xp
  const progressPct = span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 100

  return { level: current.level, xpIntoLevel: into, xpForNextLevel: next.xp, progressPct }
}

// ----------------------------------------------------------------------------
// Points / rewards
// ----------------------------------------------------------------------------
// Points are fully configurable per-user (see Settings: gym_points,
// steps_points, gym_streak_days, gym_streak_points) rather than fixed
// constants — someone who doesn't care about a 10k step goal can set their
// own step goal and decide whether it's worth any points at all (0 = off).
// Custom habits (see Habit) also each have their own optional `points`
// value, awarded once per day when a habit's daily target_count is met.
export function computeStreakBonus(newStreakDays: number, streakGoalDays: number, streakBonusPoints: number): number {
  if (streakBonusPoints <= 0 || streakGoalDays <= 0) return 0
  return newStreakDays === streakGoalDays ? streakBonusPoints : 0
}

// ----------------------------------------------------------------------------
// Analytics view models
// ----------------------------------------------------------------------------
export interface AnalyticsSummary {
  workoutHours: number
  strengthVolumeKg: number
  cardioHours: number
  cardioDistanceKm: number
  avgWorkoutMinutes: number
  avgSteps: number
  avgWaterMl: number
  foodLoggingRatePct: number
  weightTrend: { date: string; weight: number }[]
  weeklyPoints: number
  monthlyPoints: number
  pointsTrend: { date: string; points: number }[]
  workoutHeatmap: { date: string; count: number }[]
  mostActiveDay: string | null
  bestWeek: string | null
  bestMonth: string | null
}

export interface PersonalRecordsGrouped {
  category: PersonalRecord['category']
  label: string
  records: PersonalRecord[]
}

export interface ChallengeProgress extends Challenge {
  progressPct: number
  daysRemaining: number
}
