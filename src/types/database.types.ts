// ============================================================================
// Database types — mirrors the Supabase/Postgres schema in supabase/migrations
// These types are hand-authored to match the SQL schema. If you regenerate
// via `supabase gen types typescript`, merge carefully with domain helpers
// declared in src/types/models.ts.
// ============================================================================

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance' | 'general_fitness'
export type UnitSystem = 'metric' | 'imperial'
export type Theme = 'light' | 'dark' | 'system'
export type EquipmentType = 'machine' | 'dumbbell' | 'barbell' | 'cable' | 'bodyweight' | 'kettlebell' | 'band' | 'other'
export type DifficultyType = 'beginner' | 'intermediate' | 'advanced'
export type WorkoutType =
  | 'strength'
  | 'machine_cardio'
  | 'outdoor_cardio'
  | 'functional'
  | 'hiit'
  | 'stretching'
  | 'mobility'
  | 'yoga'
export type CardioMachineType =
  | 'treadmill'
  | 'elliptical'
  | 'cross_trainer'
  | 'stationary_bike'
  | 'spin_bike'
  | 'rowing_machine'
  | 'stair_climber'
  | 'air_bike'
  | 'ski_erg'
  | 'arc_trainer'
export type OutdoorActivityType = 'walking' | 'running' | 'jogging' | 'cycling' | 'swimming' | 'hiking'
export type CardioMode = 'machine' | 'outdoor'
export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'evening_snack'
  | 'dinner'
  | 'beverage'
  | 'protein_shake'
  | 'supplement'
  | 'late_night_snack'
export type PhotoAngle = 'front' | 'side' | 'back'
export type SleepQuality = 'excellent' | 'good' | 'average' | 'poor' | 'very_poor'
export type MoodType = 'excellent' | 'good' | 'average' | 'bad' | 'very_bad'
export type StreakCategory = 'gym' | 'steps' | 'water' | 'food_logging' | 'weight_logging' | 'sleep'
export type PRCategory =
  | 'highest_weight'
  | 'longest_workout'
  | 'fastest_run'
  | 'longest_run'
  | 'longest_cardio_session'
  | 'most_steps'
  | 'longest_gym_streak'
  | 'most_water'
  | 'lowest_weight'
  | 'highest_workout_volume'
export type ChallengePeriod = 'daily' | 'weekly' | 'monthly'
export type ChallengeMetric =
  | 'gym_days'
  | 'steps_total'
  | 'water_daily_goal'
  | 'weight_loss_kg'
  | 'run_distance_km'
  | 'cardio_sessions'
  | 'custom'
export type NotificationType =
  | 'workout_reminder'
  | 'water_reminder'
  | 'food_reminder'
  | 'weight_reminder'
  | 'photo_reminder'
  | 'challenge_reminder'
  | 'achievement_unlocked'
  | 'streak_risk'
  | 'general'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  age: number | null
  gender: Gender | null
  height_cm: number | null
  current_weight_kg: number | null
  goal_weight_kg: number | null
  activity_level: ActivityLevel
  fitness_goal: FitnessGoal
  unit_system: UnitSystem
  theme: Theme
  timezone: string
  xp: number
  level: number
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface Settings {
  user_id: string
  theme: Theme
  unit_system: UnitSystem
  water_goal_ml: number
  step_goal: number
  sleep_goal_hours: number
  notif_workout_reminder: boolean
  notif_water_reminder: boolean
  notif_food_reminder: boolean
  notif_weight_reminder: boolean
  notif_photo_reminder: boolean
  notif_challenge_reminder: boolean
  reminder_times: Record<string, string>
  created_at: string
  updated_at: string
}

export interface ExerciseLibraryItem {
  id: string
  name: string
  target_muscle: string
  secondary_muscles: string[]
  equipment: EquipmentType
  difficulty: DifficultyType
  instructions: string | null
  media_url: string | null
  category: string | null
  is_custom: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface WorkoutTemplate {
  id: string
  user_id: string
  name: string
  category: string | null
  description: string | null
  is_custom: boolean
  created_at: string
  updated_at: string
}

export interface WorkoutTemplateExercise {
  id: string
  template_id: string
  exercise_id: string | null
  exercise_name: string
  target_sets: number | null
  target_reps: number | null
  order_index: number
  created_at: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  date: string
  gym_entry_time: string | null
  gym_exit_time: string | null
  duration_minutes: number | null
  workout_types: WorkoutType[]
  template_id: string | null
  title: string | null
  notes: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface StrengthExercise {
  id: string
  session_id: string
  user_id: string
  exercise_id: string | null
  exercise_name: string
  equipment: EquipmentType
  weight_kg: number
  sets: number
  reps: number
  rest_seconds: number | null
  rpe: number | null
  notes: string | null
  volume_kg: number | null
  order_index: number
  performed_at: string
  created_at: string
  updated_at: string
}

export interface CardioSession {
  id: string
  session_id: string
  user_id: string
  mode: CardioMode
  machine_type: CardioMachineType | null
  outdoor_type: OutdoorActivityType | null
  duration_minutes: number
  distance_km: number | null
  avg_speed_kmh: number | null
  max_speed_kmh: number | null
  avg_pace_min_km: number | null
  resistance_level: number | null
  incline: number | null
  calories_burned: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  rpm: number | null
  steps: number | null
  floors_climbed: number | null
  route_data: Record<string, unknown> | null
  notes: string | null
  order_index: number
  performed_at: string
  created_at: string
  updated_at: string
}

export interface Food {
  id: string
  user_id: string | null
  name: string
  default_quantity: string | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  sugar_g: number | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface MealTemplateItem {
  food_id?: string
  name: string
  quantity?: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
}

export interface MealTemplate {
  id: string
  user_id: string
  name: string
  meal_type: MealType
  items: MealTemplateItem[]
  created_at: string
  updated_at: string
}

export interface Meal {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  food_id: string | null
  food_name: string
  quantity: string | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  sugar_g: number | null
  notes: string | null
  logged_at: string
  created_at: string
  updated_at: string
}

export interface WaterLog {
  id: string
  user_id: string
  date: string
  amount_ml: number
  logged_at: string
  created_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  date: string
  weight_kg: number
  body_fat_pct: number | null
  bmi: number | null
  muscle_pct: number | null
  visceral_fat: number | null
  body_water_pct: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BodyMeasurement {
  id: string
  user_id: string
  date: string
  neck_cm: number | null
  shoulders_cm: number | null
  chest_cm: number | null
  waist_cm: number | null
  hip_cm: number | null
  left_arm_cm: number | null
  right_arm_cm: number | null
  left_forearm_cm: number | null
  right_forearm_cm: number | null
  left_thigh_cm: number | null
  right_thigh_cm: number | null
  left_calf_cm: number | null
  right_calf_cm: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ProgressPhoto {
  id: string
  user_id: string
  date: string
  angle: PhotoAngle
  storage_path: string
  weight_kg: number | null
  notes: string | null
  created_at: string
}

export interface SleepLog {
  id: string
  user_id: string
  date: string
  sleep_time: string | null
  wake_time: string | null
  hours_slept: number | null
  quality: SleepQuality | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MoodLog {
  id: string
  user_id: string
  date: string
  mood: MoodType
  energy_level: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StepLog {
  id: string
  user_id: string
  date: string
  steps: number
  source: string
  created_at: string
  updated_at: string
}

export interface DailyRoutine {
  id: string
  user_id: string
  date: string
  wake_up_time: string | null
  sleep_time: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DailyScore {
  id: string
  user_id: string
  date: string
  gym_score: number
  steps_score: number
  water_score: number
  food_score: number
  sleep_score: number
  weight_score: number
  stretching_score: number
  mood_score: number
  photo_score: number
  total_score: number
  created_at: string
  updated_at: string
}

export interface PointsLedgerEntry {
  id: string
  user_id: string
  date: string
  points: number
  reason: string
  meta: Record<string, unknown>
  created_at: string
}

export interface Streak {
  id: string
  user_id: string
  category: StreakCategory
  current_streak: number
  longest_streak: number
  last_logged_date: string | null
  created_at: string
  updated_at: string
}

export interface AchievementCatalogItem {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  category: string | null
  criteria: Record<string, unknown>
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_code: string
  unlocked_at: string
  progress: number
}

export interface PersonalRecord {
  id: string
  user_id: string
  category: PRCategory
  value: number
  unit: string | null
  context: string | null
  achieved_date: string
  meta: Record<string, unknown>
  created_at: string
}

export interface Challenge {
  id: string
  user_id: string
  title: string
  description: string | null
  period: ChallengePeriod
  metric: ChallengeMetric
  target_value: number
  current_value: number
  reward_xp: number
  start_date: string
  end_date: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  is_read: boolean
  scheduled_for: string | null
  sent_at: string | null
  created_at: string
}

// Minimal Database generic to satisfy supabase-js typed client usage.
// Table-level typing is intentionally loose (Record) — the service layer
// provides strong typing at the call-site via the interfaces above.
export interface Database {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>
  }
}
