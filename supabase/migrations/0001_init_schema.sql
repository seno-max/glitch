-- ============================================================================
-- Fitness & Daily Routine Tracking Platform — Initial Schema
-- Postgres / Supabase
-- ============================================================================
-- Notes:
--  * Designed for a single primary user today, but fully multi-tenant ready.
--  * Every user-owned table has a `user_id` FK to auth.users with RLS enabled
--    so the app can safely scale to multiple accounts later.
--  * All tables have created_at / updated_at timestamps with automatic
--    updated_at maintenance via trigger.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Utility: updated_at trigger function
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- 1. PROFILES  (extends auth.users)
-- ============================================================================
create type gender_type as enum ('male', 'female', 'other', 'prefer_not_to_say');
create type activity_level_type as enum ('sedentary', 'light', 'moderate', 'active', 'very_active');
create type fitness_goal_type as enum ('weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'general_fitness');
create type unit_system_type as enum ('metric', 'imperial');
create type theme_type as enum ('light', 'dark', 'system');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  age int check (age between 1 and 120),
  gender gender_type,
  height_cm numeric(5,2),
  current_weight_kg numeric(5,2),
  goal_weight_kg numeric(5,2),
  activity_level activity_level_type default 'moderate',
  fitness_goal fitness_goal_type default 'general_fitness',
  unit_system unit_system_type default 'metric',
  theme theme_type default 'system',
  timezone text default 'UTC',
  xp bigint not null default 0,
  level int not null default 1,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');

  insert into public.settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 2. SETTINGS
-- ============================================================================
create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme theme_type not null default 'system',
  unit_system unit_system_type not null default 'metric',
  water_goal_ml int not null default 3000,
  step_goal int not null default 10000,
  sleep_goal_hours numeric(4,2) not null default 8,
  notif_workout_reminder boolean not null default true,
  notif_water_reminder boolean not null default true,
  notif_food_reminder boolean not null default true,
  notif_weight_reminder boolean not null default true,
  notif_photo_reminder boolean not null default false,
  notif_challenge_reminder boolean not null default true,
  reminder_times jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 3. EXERCISE LIBRARY (global, shared reference data)
-- ============================================================================
create type equipment_type as enum ('machine', 'dumbbell', 'barbell', 'cable', 'bodyweight', 'kettlebell', 'band', 'other');
create type difficulty_type as enum ('beginner', 'intermediate', 'advanced');

create table public.exercise_library (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  target_muscle text not null,
  secondary_muscles text[] default '{}',
  equipment equipment_type not null default 'other',
  difficulty difficulty_type not null default 'beginner',
  instructions text,
  media_url text,
  category text, -- e.g. Chest, Back, Legs, Push, Pull, Full Body
  is_custom boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_exercise_library_name on public.exercise_library using gin (to_tsvector('english', name));
create index idx_exercise_library_muscle on public.exercise_library (target_muscle);
create trigger trg_exercise_library_updated_at before update on public.exercise_library
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 4. WORKOUT TEMPLATES
-- ============================================================================
create table public.workout_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text, -- Chest / Push / Pull / Upper / Lower / Full Body / Custom
  description text,
  is_custom boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_workout_templates_user on public.workout_templates (user_id);
create trigger trg_workout_templates_updated_at before update on public.workout_templates
  for each row execute function public.set_updated_at();

create table public.workout_template_exercises (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid references public.exercise_library(id) on delete set null,
  exercise_name text not null, -- denormalized for custom entries
  target_sets int,
  target_reps int,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_wte_template on public.workout_template_exercises (template_id);

-- ============================================================================
-- 5. WORKOUT SESSIONS (the container for a day's gym visit / activity)
-- ============================================================================
create type workout_type as enum (
  'strength', 'machine_cardio', 'outdoor_cardio', 'functional',
  'hiit', 'stretching', 'mobility', 'yoga'
);

create table public.workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  gym_entry_time timestamptz,
  gym_exit_time timestamptz,
  duration_minutes numeric(6,2), -- auto-calculated on exit
  workout_types workout_type[] not null default '{}',
  template_id uuid references public.workout_templates(id) on delete set null,
  title text,
  notes text,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_workout_sessions_user_date on public.workout_sessions (user_id, date);
create trigger trg_workout_sessions_updated_at before update on public.workout_sessions
  for each row execute function public.set_updated_at();

-- Auto duration calc
create or replace function public.calc_workout_duration()
returns trigger as $$
begin
  if new.gym_entry_time is not null and new.gym_exit_time is not null then
    new.duration_minutes = extract(epoch from (new.gym_exit_time - new.gym_entry_time)) / 60.0;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_calc_workout_duration before insert or update on public.workout_sessions
  for each row execute function public.calc_workout_duration();

-- ============================================================================
-- 6. STRENGTH EXERCISES (logged sets within a session)
-- ============================================================================
create table public.strength_exercises (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid references public.exercise_library(id) on delete set null,
  exercise_name text not null,
  equipment equipment_type not null default 'barbell',
  weight_kg numeric(6,2) not null default 0,
  sets int not null default 1,
  reps int not null default 1,
  rest_seconds int,
  rpe numeric(3,1) check (rpe between 1 and 10),
  notes text,
  volume_kg numeric(10,2), -- auto = weight * sets * reps
  order_index int not null default 0,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_strength_exercises_session on public.strength_exercises (session_id);
create index idx_strength_exercises_user_name on public.strength_exercises (user_id, exercise_name);
create trigger trg_strength_exercises_updated_at before update on public.strength_exercises
  for each row execute function public.set_updated_at();

create or replace function public.calc_strength_volume()
returns trigger as $$
begin
  new.volume_kg = coalesce(new.weight_kg,0) * coalesce(new.sets,0) * coalesce(new.reps,0);
  return new;
end;
$$ language plpgsql;

create trigger trg_calc_strength_volume before insert or update on public.strength_exercises
  for each row execute function public.calc_strength_volume();

-- ============================================================================
-- 7. CARDIO SESSIONS (machine + outdoor)
-- ============================================================================
create type cardio_machine_type as enum (
  'treadmill', 'elliptical', 'cross_trainer', 'stationary_bike', 'spin_bike',
  'rowing_machine', 'stair_climber', 'air_bike', 'ski_erg', 'arc_trainer'
);
create type outdoor_activity_type as enum (
  'walking', 'running', 'jogging', 'cycling', 'swimming', 'hiking'
);
create type cardio_mode as enum ('machine', 'outdoor');

create table public.cardio_sessions (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode cardio_mode not null default 'machine',
  machine_type cardio_machine_type,
  outdoor_type outdoor_activity_type,
  duration_minutes numeric(6,2) not null default 0,
  distance_km numeric(7,3),
  avg_speed_kmh numeric(6,2),
  max_speed_kmh numeric(6,2),
  avg_pace_min_km numeric(6,2),
  resistance_level int,
  incline numeric(5,2),
  calories_burned int,
  avg_heart_rate int,
  max_heart_rate int,
  rpm int,
  steps int,
  floors_climbed int,
  route_data jsonb, -- future GPS route support
  notes text,
  order_index int not null default 0,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_cardio_sessions_session on public.cardio_sessions (session_id);
create index idx_cardio_sessions_user_date on public.cardio_sessions (user_id, performed_at);
create trigger trg_cardio_sessions_updated_at before update on public.cardio_sessions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 8. FOODS + MEALS (nutrition)
-- ============================================================================
create type meal_type as enum (
  'breakfast', 'lunch', 'evening_snack', 'dinner', 'beverage',
  'protein_shake', 'supplement', 'late_night_snack'
);

create table public.foods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade, -- null = global/shared food
  name text not null,
  default_quantity text,
  calories numeric(7,2),
  protein_g numeric(6,2),
  carbs_g numeric(6,2),
  fat_g numeric(6,2),
  fiber_g numeric(6,2),
  sugar_g numeric(6,2),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_foods_user on public.foods (user_id);
create index idx_foods_name on public.foods using gin (to_tsvector('english', name));
create trigger trg_foods_updated_at before update on public.foods
  for each row execute function public.set_updated_at();

create table public.meal_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  meal_type meal_type not null,
  items jsonb not null default '[]'::jsonb, -- [{food_id, name, quantity, calories, protein,...}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_meal_templates_user on public.meal_templates (user_id);

create table public.meals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  meal_type meal_type not null,
  food_id uuid references public.foods(id) on delete set null,
  food_name text not null,
  quantity text,
  calories numeric(7,2),
  protein_g numeric(6,2),
  carbs_g numeric(6,2),
  fat_g numeric(6,2),
  fiber_g numeric(6,2),
  sugar_g numeric(6,2),
  notes text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_meals_user_date on public.meals (user_id, date);
create trigger trg_meals_updated_at before update on public.meals
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 9. WATER LOGS
-- ============================================================================
create table public.water_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount_ml int not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_water_logs_user_date on public.water_logs (user_id, date);

-- ============================================================================
-- 10. WEIGHT LOGS
-- ============================================================================
create table public.weight_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,2) not null,
  body_fat_pct numeric(4,2),
  bmi numeric(5,2),
  muscle_pct numeric(4,2),
  visceral_fat numeric(5,2),
  body_water_pct numeric(4,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index idx_weight_logs_user_date on public.weight_logs (user_id, date);
create trigger trg_weight_logs_updated_at before update on public.weight_logs
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 11. BODY MEASUREMENTS
-- ============================================================================
create table public.body_measurements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  neck_cm numeric(5,2),
  shoulders_cm numeric(5,2),
  chest_cm numeric(5,2),
  waist_cm numeric(5,2),
  hip_cm numeric(5,2),
  left_arm_cm numeric(5,2),
  right_arm_cm numeric(5,2),
  left_forearm_cm numeric(5,2),
  right_forearm_cm numeric(5,2),
  left_thigh_cm numeric(5,2),
  right_thigh_cm numeric(5,2),
  left_calf_cm numeric(5,2),
  right_calf_cm numeric(5,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_body_measurements_user_date on public.body_measurements (user_id, date);
create trigger trg_body_measurements_updated_at before update on public.body_measurements
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 12. PROGRESS PHOTOS
-- ============================================================================
create type photo_angle_type as enum ('front', 'side', 'back');

create table public.progress_photos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  angle photo_angle_type not null,
  storage_path text not null, -- path within Supabase Storage bucket
  weight_kg numeric(5,2),
  notes text,
  created_at timestamptz not null default now()
);
create index idx_progress_photos_user_date on public.progress_photos (user_id, date);

-- ============================================================================
-- 13. SLEEP LOGS
-- ============================================================================
create type sleep_quality_type as enum ('excellent', 'good', 'average', 'poor', 'very_poor');

create table public.sleep_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null, -- the day woken up on
  sleep_time timestamptz,
  wake_time timestamptz,
  hours_slept numeric(4,2),
  quality sleep_quality_type,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index idx_sleep_logs_user_date on public.sleep_logs (user_id, date);
create trigger trg_sleep_logs_updated_at before update on public.sleep_logs
  for each row execute function public.set_updated_at();

create or replace function public.calc_sleep_hours()
returns trigger as $$
begin
  if new.sleep_time is not null and new.wake_time is not null then
    new.hours_slept = extract(epoch from (new.wake_time - new.sleep_time)) / 3600.0;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_calc_sleep_hours before insert or update on public.sleep_logs
  for each row execute function public.calc_sleep_hours();

-- ============================================================================
-- 14. MOOD LOGS
-- ============================================================================
create type mood_type as enum ('excellent', 'good', 'average', 'bad', 'very_bad');

create table public.mood_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  mood mood_type not null,
  energy_level int check (energy_level between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index idx_mood_logs_user_date on public.mood_logs (user_id, date);
create trigger trg_mood_logs_updated_at before update on public.mood_logs
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 15. STEP LOGS
-- ============================================================================
create table public.step_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  steps int not null default 0,
  source text default 'manual', -- manual | google_fit | health_connect | samsung_health
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index idx_step_logs_user_date on public.step_logs (user_id, date);
create trigger trg_step_logs_updated_at before update on public.step_logs
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 16. DAILY ROUTINE (wake/sleep/gym summary/notes container per day)
-- ============================================================================
create table public.daily_routines (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  wake_up_time timestamptz,
  sleep_time timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index idx_daily_routines_user_date on public.daily_routines (user_id, date);
create trigger trg_daily_routines_updated_at before update on public.daily_routines
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 17. DAILY SCORES (health score breakdown, per day)
-- ============================================================================
create table public.daily_scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  gym_score int not null default 0,
  steps_score int not null default 0,
  water_score int not null default 0,
  food_score int not null default 0,
  sleep_score int not null default 0,
  weight_score int not null default 0,
  stretching_score int not null default 0,
  mood_score int not null default 0,
  photo_score int not null default 0,
  total_score int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index idx_daily_scores_user_date on public.daily_scores (user_id, date);
create trigger trg_daily_scores_updated_at before update on public.daily_scores
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 18. POINTS LEDGER (XP / points transactions)
-- ============================================================================
create table public.points_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  points int not null,
  reason text not null, -- e.g. 'gym_completed', '10k_steps', 'streak_10_days'
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_points_ledger_user_date on public.points_ledger (user_id, date);

-- ============================================================================
-- 19. STREAKS
-- ============================================================================
create type streak_category_type as enum ('gym', 'steps', 'water', 'food_logging', 'weight_logging', 'sleep');

create table public.streaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category streak_category_type not null,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_logged_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);
create trigger trg_streaks_updated_at before update on public.streaks
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 20. ACHIEVEMENTS (badge catalog + user unlocks)
-- ============================================================================
create table public.achievement_catalog (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null, -- e.g. 'first_workout', '100_workouts'
  name text not null,
  description text,
  icon text,
  category text,
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_code text not null references public.achievement_catalog(code) on delete cascade,
  unlocked_at timestamptz not null default now(),
  progress numeric(6,2) default 100,
  unique (user_id, achievement_code)
);
create index idx_user_achievements_user on public.user_achievements (user_id);

-- ============================================================================
-- 21. PERSONAL RECORDS
-- ============================================================================
create type pr_category_type as enum (
  'highest_weight', 'longest_workout', 'fastest_run', 'longest_run',
  'longest_cardio_session', 'most_steps', 'longest_gym_streak',
  'most_water', 'lowest_weight', 'highest_workout_volume'
);

create table public.personal_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category pr_category_type not null,
  value numeric(12,3) not null,
  unit text,
  context text, -- e.g. exercise name for highest_weight
  achieved_date date not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_personal_records_user_cat on public.personal_records (user_id, category);

-- ============================================================================
-- 22. CHALLENGES
-- ============================================================================
create type challenge_period_type as enum ('daily', 'weekly', 'monthly');
create type challenge_metric_type as enum (
  'gym_days', 'steps_total', 'water_daily_goal', 'weight_loss_kg',
  'run_distance_km', 'cardio_sessions', 'custom'
);

create table public.challenges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  period challenge_period_type not null,
  metric challenge_metric_type not null,
  target_value numeric(10,2) not null,
  current_value numeric(10,2) not null default 0,
  reward_xp int not null default 0,
  start_date date not null,
  end_date date not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_challenges_user on public.challenges (user_id, is_completed);
create trigger trg_challenges_updated_at before update on public.challenges
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 23. NOTIFICATIONS
-- ============================================================================
create type notification_type as enum (
  'workout_reminder', 'water_reminder', 'food_reminder', 'weight_reminder',
  'photo_reminder', 'challenge_reminder', 'achievement_unlocked', 'streak_risk', 'general'
);

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  is_read boolean not null default false,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications (user_id, is_read);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.strength_exercises enable row level security;
alter table public.cardio_sessions enable row level security;
alter table public.foods enable row level security;
alter table public.meal_templates enable row level security;
alter table public.meals enable row level security;
alter table public.water_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.body_measurements enable row level security;
alter table public.progress_photos enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.mood_logs enable row level security;
alter table public.step_logs enable row level security;
alter table public.daily_routines enable row level security;
alter table public.daily_scores enable row level security;
alter table public.points_ledger enable row level security;
alter table public.streaks enable row level security;
alter table public.user_achievements enable row level security;
alter table public.personal_records enable row level security;
alter table public.challenges enable row level security;
alter table public.notifications enable row level security;
alter table public.exercise_library enable row level security;
alter table public.achievement_catalog enable row level security;

-- Generic "own rows only" policies
create policy "own rows select" on public.profiles for select using (auth.uid() = id);
create policy "own rows update" on public.profiles for update using (auth.uid() = id);

create policy "own rows all" on public.settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.workout_templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.workout_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.strength_exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.cardio_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.foods for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id);
create policy "own rows all" on public.meal_templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.meals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.water_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.weight_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.body_measurements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.progress_photos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.sleep_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.mood_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.step_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.daily_routines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.daily_scores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.points_ledger for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.user_achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.personal_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.challenges for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "template exercises via template" on public.workout_template_exercises for all
  using (exists (select 1 from public.workout_templates t where t.id = template_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.workout_templates t where t.id = template_id and t.user_id = auth.uid()));

-- Shared/global reference tables: readable by all authenticated users
create policy "exercise library readable" on public.exercise_library for select using (true);
create policy "exercise library insert own custom" on public.exercise_library for insert with check (auth.uid() = created_by);
create policy "exercise library update own custom" on public.exercise_library for update using (auth.uid() = created_by);

create policy "achievement catalog readable" on public.achievement_catalog for select using (true);
