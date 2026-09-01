-- ============================================================================
-- 0009: Add distance tracking to the unified exercise logger
-- ----------------------------------------------------------------------------
-- The manual gym-log flow (0006) unified strength + timed/cardio exercise
-- logging into a single strength_exercises row per exercise, using
-- duration_seconds for timed sets. Analytics' "Cardio Hours" / "Cardio
-- Distance" metrics were still reading from the old (now-unused)
-- cardio_sessions table, which the current logger never writes to — so
-- those metrics always showed 0.
--
-- Fix: add an optional distance_km column here so a cardio-style exercise
-- (e.g. "5km Run", "Treadmill Intervals") can record distance directly in
-- the same unified log. Analytics is updated (application-side) to compute
-- Cardio Hours/Distance from duration_seconds + distance_km on exercises
-- logged under a cardio/HIIT workout type, instead of cardio_sessions.
-- ============================================================================

alter table public.strength_exercises
  add column if not exists distance_km numeric(7,3);

comment on column public.strength_exercises.distance_km is
  'Optional: distance covered for cardio-style exercises (e.g. running, cycling). Null for standard strength sets.';
