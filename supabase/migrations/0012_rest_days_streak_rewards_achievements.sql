-- ============================================================================
-- 0012: Rest days (streak protection), custom streak rewards, more
-- achievement milestones, and a helper to unlock achievements idempotently.
-- ----------------------------------------------------------------------------
-- 1. Rest days: users pick 0+ weekdays (0=Sunday .. 6=Saturday) that never
--    count against their gym streak. A rest day that's skipped doesn't
--    break the streak, but a rest day the user *does* work out on still
--    counts normally. This is computed application-side in
--    computeStreakFromDates (see src/utils/date.ts) using this list.
-- 2. Custom streak rewards: fully user-defined "streak name" + "day count"
--    + "points" rows (e.g. user picks a custom streak length/category and
--    its bonus points), replacing the old idea that only gym/steps streaks
--    can have rewards.
-- 3. More achievement milestones for continuous streak maintenance.
-- ============================================================================

alter table public.settings
  add column if not exists rest_days int[] not null default '{}';

comment on column public.settings.rest_days is
  'Weekdays (0=Sunday..6=Saturday) the user has designated as rest days. A rest day that has no gym session logged does not break the gym streak; the streak simply skips over it.';

-- ----------------------------------------------------------------------------
-- Custom streak rewards (fully user-defined, not limited to gym/steps)
-- ----------------------------------------------------------------------------
create table public.streak_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category streak_category_type not null default 'gym',
  streak_days int not null check (streak_days >= 1),
  points int not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_streak_rewards_user on public.streak_rewards (user_id, category);
create trigger trg_streak_rewards_updated_at before update on public.streak_rewards
  for each row execute function public.set_updated_at();

alter table public.streak_rewards enable row level security;
create policy "own rows all" on public.streak_rewards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- More achievement milestones for continuous streak maintenance
-- ----------------------------------------------------------------------------
insert into public.achievement_catalog (code, name, description, icon, category, criteria) values
('streak_3_days', '3 Day Streak', 'Maintain a 3 day gym streak.', '🔥', 'streak', '{"gym_streak_days":3}'),
('streak_7_days', '1 Week Streak', 'Maintain a 7 day gym streak.', '🔥', 'streak', '{"gym_streak_days":7}'),
('streak_14_days', '2 Week Streak', 'Maintain a 14 day gym streak.', '⚡', 'streak', '{"gym_streak_days":14}'),
('streak_30_days', '30 Day Streak', 'Maintain a 30 day gym streak.', '🌟', 'streak', '{"gym_streak_days":30}'),
('streak_60_days', '60 Day Streak', 'Maintain a 60 day gym streak.', '💎', 'streak', '{"gym_streak_days":60}'),
('streak_100_days', '100 Day Streak', 'Maintain a 100 day gym streak.', '👑', 'streak', '{"gym_streak_days":100}'),
('steps_streak_7_days', '7 Day Step Streak', 'Hit your step goal for 7 days in a row.', '👟', 'streak', '{"steps_streak_days":7}'),
('steps_streak_30_days', '30 Day Step Streak', 'Hit your step goal for 30 days in a row.', '🚀', 'streak', '{"steps_streak_days":30}')
on conflict do nothing;
