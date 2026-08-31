-- ============================================================================
-- 0006: Support manual gym-log style workout entry
-- ----------------------------------------------------------------------------
-- The app is moving away from a live start/stop timer flow to a manual
-- "Entry Time" / "Exit Time" log (duration is still auto-calculated by the
-- existing trg_calc_workout_duration trigger on workout_sessions).
--
-- For exercise logging, some cardio/HIIT bodyweight exercises are performed
-- as timed sets (e.g. "30 secs x 3 sets") rather than reps x weight. Add an
-- optional duration_seconds column to strength_exercises so ONE unified
-- exercise logger can capture either style:
--   - Strength: sets, reps, weight_kg
--   - Timed/cardio: sets, duration_seconds (weight_kg optional, reps unused)
-- ============================================================================

alter table public.strength_exercises
  add column if not exists duration_seconds int;

comment on column public.strength_exercises.duration_seconds is
  'Optional: seconds per set for timed/cardio-style exercises (e.g. 30 sec x 3 sets). Null for standard reps-based strength sets.';
