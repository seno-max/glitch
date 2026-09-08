-- ============================================================================
-- 0011: Lock old log history to read-only after a 2-day edit grace window
-- ----------------------------------------------------------------------------
-- Not everyone can log everything the same day it happened. Give a grace
-- window: any date-stamped log entry (workout, exercise, meal, water,
-- weight, sleep, mood, steps, measurement, photo, habit check-in, daily
-- routine note) can still be created, edited, or deleted through the day
-- itself plus the following 2 days. From the 3rd day after its date
-- onward, the entry locks -- it stays fully visible/readable forever, it
-- just can no longer be written to.
--
-- Enforced here at the database (RLS) level so it can't be bypassed from
-- the client. The app UI additionally disables edit/delete controls for
-- locked entries proactively, so users get a clear "locked" state instead
-- of a failed request.
-- ============================================================================

create or replace function public.is_within_edit_window(log_date date)
returns boolean
language sql
stable
as $$
  select log_date >= (current_date - 2);
$$;

comment on function public.is_within_edit_window is
  'True if log_date is today, yesterday, the day before, or any future date -- i.e. still inside the 2-day edit grace window. False once a 3rd day has passed, locking the entry to read-only.';

-- ----------------------------------------------------------------------------
-- Helper macro (applied by hand per table below): split each table''s old
-- single "own rows all" policy into 4 policies so SELECT stays unrestricted
-- (history is always readable) while INSERT/UPDATE/DELETE additionally
-- require is_within_edit_window(date).
-- ----------------------------------------------------------------------------

-- ---- workout_sessions ----
drop policy if exists "own rows all" on public.workout_sessions;
create policy "select own" on public.workout_sessions for select using (auth.uid() = user_id);
create policy "insert own within window" on public.workout_sessions for insert with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "update own within window" on public.workout_sessions for update using (auth.uid() = user_id and public.is_within_edit_window(date)) with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "delete own within window" on public.workout_sessions for delete using (auth.uid() = user_id and public.is_within_edit_window(date));

-- ---- strength_exercises (locked via parent session's date, since the row itself has no date column) ----
drop policy if exists "own rows all" on public.strength_exercises;
create policy "select own" on public.strength_exercises for select using (auth.uid() = user_id);
create policy "insert own within window" on public.strength_exercises for insert with check (
  auth.uid() = user_id and exists (
    select 1 from public.workout_sessions s where s.id = session_id and public.is_within_edit_window(s.date)
  )
);
create policy "update own within window" on public.strength_exercises for update using (
  auth.uid() = user_id and exists (
    select 1 from public.workout_sessions s where s.id = session_id and public.is_within_edit_window(s.date)
  )
) with check (
  auth.uid() = user_id and exists (
    select 1 from public.workout_sessions s where s.id = session_id and public.is_within_edit_window(s.date)
  )
);
create policy "delete own within window" on public.strength_exercises for delete using (
  auth.uid() = user_id and exists (
    select 1 from public.workout_sessions s where s.id = session_id and public.is_within_edit_window(s.date)
  )
);

-- ---- meals ----
drop policy if exists "own rows all" on public.meals;
create policy "select own" on public.meals for select using (auth.uid() = user_id);
create policy "insert own within window" on public.meals for insert with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "update own within window" on public.meals for update using (auth.uid() = user_id and public.is_within_edit_window(date)) with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "delete own within window" on public.meals for delete using (auth.uid() = user_id and public.is_within_edit_window(date));

-- ---- water_logs ----
drop policy if exists "own rows all" on public.water_logs;
create policy "select own" on public.water_logs for select using (auth.uid() = user_id);
create policy "insert own within window" on public.water_logs for insert with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "update own within window" on public.water_logs for update using (auth.uid() = user_id and public.is_within_edit_window(date)) with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "delete own within window" on public.water_logs for delete using (auth.uid() = user_id and public.is_within_edit_window(date));

-- ---- weight_logs ----
drop policy if exists "own rows all" on public.weight_logs;
create policy "select own" on public.weight_logs for select using (auth.uid() = user_id);
create policy "insert own within window" on public.weight_logs for insert with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "update own within window" on public.weight_logs for update using (auth.uid() = user_id and public.is_within_edit_window(date)) with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "delete own within window" on public.weight_logs for delete using (auth.uid() = user_id and public.is_within_edit_window(date));

-- ---- body_measurements ----
drop policy if exists "own rows all" on public.body_measurements;
create policy "select own" on public.body_measurements for select using (auth.uid() = user_id);
create policy "insert own within window" on public.body_measurements for insert with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "update own within window" on public.body_measurements for update using (auth.uid() = user_id and public.is_within_edit_window(date)) with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "delete own within window" on public.body_measurements for delete using (auth.uid() = user_id and public.is_within_edit_window(date));

-- ---- progress_photos ----
drop policy if exists "own rows all" on public.progress_photos;
create policy "select own" on public.progress_photos for select using (auth.uid() = user_id);
create policy "insert own within window" on public.progress_photos for insert with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "update own within window" on public.progress_photos for update using (auth.uid() = user_id and public.is_within_edit_window(date)) with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "delete own within window" on public.progress_photos for delete using (auth.uid() = user_id and public.is_within_edit_window(date));

-- ---- sleep_logs ----
drop policy if exists "own rows all" on public.sleep_logs;
create policy "select own" on public.sleep_logs for select using (auth.uid() = user_id);
create policy "insert own within window" on public.sleep_logs for insert with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "update own within window" on public.sleep_logs for update using (auth.uid() = user_id and public.is_within_edit_window(date)) with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "delete own within window" on public.sleep_logs for delete using (auth.uid() = user_id and public.is_within_edit_window(date));

-- ---- mood_logs ----
drop policy if exists "own rows all" on public.mood_logs;
create policy "select own" on public.mood_logs for select using (auth.uid() = user_id);
create policy "insert own within window" on public.mood_logs for insert with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "update own within window" on public.mood_logs for update using (auth.uid() = user_id and public.is_within_edit_window(date)) with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "delete own within window" on public.mood_logs for delete using (auth.uid() = user_id and public.is_within_edit_window(date));

-- ---- step_logs ----
drop policy if exists "own rows all" on public.step_logs;
create policy "select own" on public.step_logs for select using (auth.uid() = user_id);
create policy "insert own within window" on public.step_logs for insert with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "update own within window" on public.step_logs for update using (auth.uid() = user_id and public.is_within_edit_window(date)) with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "delete own within window" on public.step_logs for delete using (auth.uid() = user_id and public.is_within_edit_window(date));

-- ---- daily_routines ----
drop policy if exists "own rows all" on public.daily_routines;
create policy "select own" on public.daily_routines for select using (auth.uid() = user_id);
create policy "insert own within window" on public.daily_routines for insert with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "update own within window" on public.daily_routines for update using (auth.uid() = user_id and public.is_within_edit_window(date)) with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "delete own within window" on public.daily_routines for delete using (auth.uid() = user_id and public.is_within_edit_window(date));

-- ---- habit_checkins ----
drop policy if exists "own rows all" on public.habit_checkins;
create policy "select own" on public.habit_checkins for select using (auth.uid() = user_id);
create policy "insert own within window" on public.habit_checkins for insert with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "update own within window" on public.habit_checkins for update using (auth.uid() = user_id and public.is_within_edit_window(date)) with check (auth.uid() = user_id and public.is_within_edit_window(date));
create policy "delete own within window" on public.habit_checkins for delete using (auth.uid() = user_id and public.is_within_edit_window(date));

-- Note: habits (habit *definitions*, not their daily check-ins), workout
-- templates, foods, meal templates, settings, profiles, and all
-- gamification/derived tables (points_ledger, streaks, personal_records,
-- challenges, achievements, notifications) are intentionally left
-- unrestricted by date -- they aren't per-day history entries.
