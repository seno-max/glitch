import type {
  WorkoutSession,
  StrengthExercise,
  CardioSession,
  Meal,
  WaterLog,
  WeightLog,
  SleepLog,
  MoodLog,
  StepLog,
  DailyScore,
  Streak,
  Challenge,
  PersonalRecord,
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
  healthScore: number
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
  healthScoreToday: number
  pointsToday: number
  level: number
  xp: number
  xpForNextLevel: number
  xpProgressPct: number
  currentStreaks: Streak[]
  todaysTasks: TaskItem[]
  todaysProgress: DailyProgress
  weeklyProgress: PeriodProgress
  monthlyProgress: PeriodProgress
}

export interface TaskItem {
  id: string
  label: string
  completed: boolean
  icon: string
  points: number
  href?: string
}

export interface DailyProgress {
  stepsCurrent: number
  stepsGoal: number
  waterCurrentMl: number
  waterGoalMl: number
  caloriesConsumed: number
  workoutDone: boolean
  sleepHours: number | null
  sleepGoalHours: number
}

export interface PeriodProgress {
  label: string
  workoutsCompleted: number
  totalWorkoutMinutes: number
  avgSteps: number
  avgWater: number
  avgScore: number
  weightChangeKg: number | null
}

// ----------------------------------------------------------------------------
// Day detail — everything logged on a single day
// ----------------------------------------------------------------------------
export interface DayActivityLog {
  date: string
  workoutSessions: (WorkoutSession & { strengthExercises: StrengthExercise[]; cardioSessions: CardioSession[] })[]
  meals: Meal[]
  waterLogs: WaterLog[]
  weightLog: WeightLog | null
  sleepLog: SleepLog | null
  moodLog: MoodLog | null
  stepLog: StepLog | null
  dailyScore: DailyScore | null
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
// Points system
// ----------------------------------------------------------------------------
export const POINTS = {
  GYM_COMPLETED: 100,
  STEPS_10K: 50,
  STEPS_15K: 80,
  STEPS_20K: 100,
  WATER_GOAL: 20,
  FOOD_LOGGED: 20,
  SLEEP_GOAL: 30,
  WEIGHT_LOGGED: 10,
  PROGRESS_PHOTO: 25,
  WORKOUT_OVER_90MIN: 20,
  WORKOUT_BEFORE_8AM: 10,
  NO_SUGARY_DRINKS: 15,
  WEEKLY_GOAL_COMPLETED: 200,
  MONTHLY_GOAL_COMPLETED: 1000,
} as const

// ----------------------------------------------------------------------------
// Health score weights (out of ~260 total, normalized to 100 for display)
// ----------------------------------------------------------------------------
export const HEALTH_SCORE_WEIGHTS = {
  gym: 100,
  steps10k: 50,
  waterGoal: 20,
  foodLogged: 20,
  sleepGoal: 30,
  weightLogged: 10,
  stretching: 10,
  moodLogged: 10,
  progressPhoto: 10,
} as const

export const HEALTH_SCORE_MAX = Object.values(HEALTH_SCORE_WEIGHTS).reduce((a, b) => a + b, 0)

// ----------------------------------------------------------------------------
// Streak milestone bonus points
// ----------------------------------------------------------------------------
export const STREAK_MILESTONES: { days: number; points: number }[] = [
  { days: 5, points: 150 },
  { days: 10, points: 350 },
  { days: 20, points: 800 },
  { days: 30, points: 1500 },
  { days: 100, points: 10000 },
]

export function getStreakMilestoneBonus(streakDays: number): number {
  const milestone = STREAK_MILESTONES.find((m) => m.days === streakDays)
  return milestone?.points ?? 0
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
  weeklyScore: number
  monthlyScore: number
  healthScoreTrend: { date: string; score: number }[]
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
