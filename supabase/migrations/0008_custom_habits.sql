-- ============================================================================
-- 0008: Custom habit tracking + configurable points/rewards
-- ----------------------------------------------------------------------------
-- Replaces the old hardcoded "Today's Tasks" checklist (workout / 10k steps /
-- water / food / weight / sleep, all pass-fail with fixed point values) with
-- a fully user-defined habit system:
--   * Users create their own habits (any activity, any icon/emoji).
--   * Each habit has its own daily target check count (target_count) — e.g.
--     "Drink coffee" once/day, "Stretch" 3x/day, "Walk the dog" 2x/day.
--   * Rewards (points) are OPTIONAL per habit — a habit can simply be
--     tracked with no points at all.
--
-- Also makes the points awarded for gym completion / step goal / gym streak
-- configurable per-user (instead of fixed 100 / 50 / 150 constants), so
-- someone who doesn't care about 10k steps can set their own step goal and
-- decide whether/how many points it's worth (or set points to 0 to disable).
-- ============================================================================

alter table public.settings
  add column if not exists gym_points int not null default 100,
  add column if not exists steps_points int not null default 50,
  add column if not exists gym_streak_days int not null default 5,
  add column if not exists gym_streak_points int not null default 150;

comment on column public.settings.gym_points is 'Points awarded for completing a gym workout. 0 disables gym points entirely.';
comment on column public.settings.steps_points is 'Points awarded for hitting step_goal in a day. 0 disables step points entirely.';
comment on column public.settings.gym_streak_days is 'Consecutive gym days required to earn the streak bonus.';
comment on column public.settings.gym_streak_points is 'Bonus points awarded when gym_streak_days is reached. 0 disables the streak bonus.';

-- ----------------------------------------------------------------------------
-- Habits (user-defined, fully custom)
-- ----------------------------------------------------------------------------
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '⭐',
  target_count int not null default 1 check (target_count >= 1 and target_count <= 20),
  points int check (points is null or points >= 0),
  color text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_habits_user on public.habits (user_id, is_active, sort_order);
create trigger trg_habits_updated_at before update on public.habits
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Habit check-ins — one row per check (supports multi-check-per-day habits)
-- ----------------------------------------------------------------------------
create table public.habit_checkins (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_habit_checkins_habit_date on public.habit_checkins (habit_id, date);
create index idx_habit_checkins_user_date on public.habit_checkins (user_id, date);

alter table public.habits enable row level security;
alter table public.habit_checkins enable row level security;

create policy "own rows all" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows all" on public.habit_checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
