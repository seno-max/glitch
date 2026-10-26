-- ============================================================================
-- 0013: Bug fixes + per-date rest-day freeze
-- ----------------------------------------------------------------------------
-- 1. Atomic XP increment RPC (add_xp_atomic): replaces the client-side
--    read-modify-write on profiles.xp, which could silently lose points when
--    two concurrent awards (e.g. a gym log + a habit check-in) both read the
--    same starting value. The UPDATE statement takes a row lock, so
--    concurrent calls serialize and no XP is lost. The level recompute mirrors
--    getLevelForXp in src/types/models.ts, including the uncapped
--    beyond-level-10 extension (next threshold = current + (level+1)*2000).
-- 2. rest_day_logs: per-date streak freeze. Unlike settings.rest_days (a
--    repeating weekday pattern), this lets the user mark SPECIFIC calendar
--    days (e.g. "I was unwell this Tuesday") as rest days so the gym streak
--    bridges over them and resumes when they're back. Computed
--    application-side in computeStreakFromDates (src/utils/date.ts).
-- 3. Foods RLS fix: the old single "own rows all" policy had
--    `with check (auth.uid() = user_id)`, which rejected updating global
--    (seeded, user_id IS NULL) foods -- so favoriting a seeded food always
--    failed with an RLS error. Split into per-action policies: global foods
--    stay readable and can now be favorited/edited, but only owner rows can
--    be deleted (shared reference data is never deletable by clients).
-- 4. exercise_library DELETE policy: users could create and update their own
--    custom exercises but could never delete them (no delete policy existed).
-- 5. streak_rewards restricted to gym/steps categories (product decision:
--    streak rewards are only earned by gym streaks and step-goal streaks).
--    Any pre-existing rows for other categories are removed first so the
--    CHECK constraint can be added safely.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Atomic XP increment
-- ----------------------------------------------------------------------------
create or replace function public.add_xp_atomic(p_xp_delta bigint)
returns table (xp bigint, level int)
language plpgsql
as $$
declare
  v_thresholds bigint[] := array[0, 1000, 2500, 4500, 7000, 10000, 14000, 18500, 24000, 30000];
  v_new_xp bigint;
  v_level int;
  v_cur bigint;
  v_next bigint;
  i int;
begin
  -- Single atomic UPDATE: row lock serializes concurrent awards, so the
  -- read-modify-write can never lose a delta.
  update public.profiles
    set xp = coalesce(xp, 0) + p_xp_delta
    where id = auth.uid()
    returning xp into v_new_xp;

  if v_new_xp is null then
    raise exception 'Profile row not found for auth.uid()';
  end if;

  -- Level recompute (mirrors getLevelForXp in src/types/models.ts).
  v_level := 1;
  v_cur := v_thresholds[1];
  v_next := v_thresholds[2];

  for i in 1..10 loop
    if v_new_xp >= v_thresholds[i] then
      v_cur := v_thresholds[i];
      v_level := i;
      if i < 10 then
        v_next := v_thresholds[i + 1];
      else
        v_next := v_cur + (i + 1) * 2000;
      end if;
    end if;
  end loop;

  -- Beyond level 10 the thresholds keep growing by (level+1)*2000.
  while v_new_xp >= v_next loop
    v_level := v_level + 1;
    v_cur := v_next;
    v_next := v_cur + (v_level + 1) * 2000;
  end loop;

  update public.profiles set level = v_level where id = auth.uid();

  return query select v_new_xp, v_level;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Per-date rest days (streak freeze)
-- ----------------------------------------------------------------------------
create table public.rest_day_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index idx_rest_day_logs_user_date on public.rest_day_logs (user_id, date);
create trigger trg_rest_day_logs_updated_at before update on public.rest_day_logs
  for each row execute function public.set_updated_at();

alter table public.rest_day_logs enable row level security;
create policy "own rows all" on public.rest_day_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. Foods RLS fix (global foods are now updatable so they can be favorited)
-- ----------------------------------------------------------------------------
drop policy if exists "own rows all" on public.foods;
create policy "own rows select" on public.foods for select using (auth.uid() = user_id or user_id is null);
create policy "own rows insert" on public.foods for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.foods for update
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);
create policy "own rows delete" on public.foods for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. exercise_library: allow deleting your own custom exercises
-- ----------------------------------------------------------------------------
create policy "exercise library delete own custom" on public.exercise_library for delete
  using (auth.uid() = created_by);

-- ----------------------------------------------------------------------------
-- 5. Streak rewards: gym/steps categories only
-- ----------------------------------------------------------------------------
delete from public.streak_rewards where category not in ('gym', 'steps');
alter table public.streak_rewards drop constraint if exists chk_streak_rewards_category;
alter table public.streak_rewards
  add constraint chk_streak_rewards_category check (category in ('gym', 'steps'));

-- ----------------------------------------------------------------------------
-- 6. Account self-deletion RPC (Delete Account in Settings)
-- ----------------------------------------------------------------------------
-- The client can't delete its own auth.users row with the anon key, so this
-- security-definer function does it for the calling user. Every user-owned
-- table references auth.users(id) ON DELETE CASCADE (see 0001), so all
-- workout/nutrition/tracking/gamification data goes with it. Storage
-- objects (avatars, progress photos) have no FK cascade -- the client
-- removes those via the Storage API before calling this function.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from anon, public;
grant execute on function public.delete_my_account() to authenticated;
