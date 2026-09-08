-- ============================================================================
-- 0010: Machine cardio timing units + missing machine cardio exercises
-- ----------------------------------------------------------------------------
-- 1. Machine cardios (recumbent bike, EFX/elliptical, treadmill, etc.) are
--    usually logged as "X minutes at Y distance" rather than sets/reps.
--    duration_seconds already exists (0006) but was always assumed to be
--    "seconds per set", forcing users to convert minutes -> seconds by hand.
--    Add duration_unit so the logger can accept sec OR min directly; the
--    value entered is stored as typed (in duration_seconds OR
--    duration_minutes) plus the unit, so display/analytics can read it back
--    in the same unit without lossy conversions.
-- 2. Add the 2 missing machine cardio exercises the user asked for.
-- ============================================================================

alter table public.strength_exercises
  add column if not exists duration_unit text check (duration_unit in ('sec', 'min')) default 'sec';

comment on column public.strength_exercises.duration_unit is
  'Unit the user chose when entering duration_seconds: "sec" (per set, e.g. 30 sec x 3 sets) or "min" (total minutes, e.g. 20 min on a machine). duration_seconds always stores the raw number the user typed, in this unit -- NOT necessarily converted to seconds.';

insert into public.exercise_library (name, target_muscle, secondary_muscles, equipment, difficulty, category, instructions) values
('Recumbent Exercise Bike', 'Cardio', array['Legs'], 'machine', 'beginner', 'Cardio', 'Seated, reclined cycling on a recumbent bike -- easy on the back and joints while building cardio endurance.'),
('EFX Machine', 'Cardio', array['Legs','Arms'], 'machine', 'beginner', 'Cardio', 'Low-impact elliptical-style total-body cardio machine (Precor EFX) combining leg striding with arm handles.')
on conflict (name) do nothing;
