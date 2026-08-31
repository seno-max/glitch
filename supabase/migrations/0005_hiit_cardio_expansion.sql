-- ============================================================================
-- Cardio / HIIT Cleanup + Expanded Variety for Daily Weight-Loss Workouts
-- ============================================================================
-- 1. Removes accidental duplicate rows introduced by migration 0004
--    (Battle Ropes, Box Jump, Kettlebell Swing each got inserted twice
--     because there was no unique constraint on exercise name).
-- 2. Adds a large batch of classic bodyweight HIIT/cardio moves that were
--    still missing (crunches, leg raises, standing/walking lunges, sumo
--    squat, jumping-jack variations, ball-based cardio, etc.) so there's
--    a fresh, varied cardio workout to pick every day.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. De-duplicate: keep the oldest row (lowest created_at) for each name,
--    delete any newer duplicates.
-- ---------------------------------------------------------------------------
delete from public.exercise_library a
using public.exercise_library b
where a.name = b.name
  and a.created_at > b.created_at;

-- Prevent this from happening again.
create unique index if not exists idx_exercise_library_name_unique on public.exercise_library (name);

-- ---------------------------------------------------------------------------
-- 2. Additional cardio / HIIT / fat-loss exercises
-- ---------------------------------------------------------------------------
insert into public.exercise_library (name, target_muscle, secondary_muscles, equipment, difficulty, category, instructions) values
-- Core / ab cardio finishers
('Crunches', 'Core', array[]::text[], 'bodyweight', 'beginner', 'HIIT', 'Lie on back, knees bent, curl shoulders off the floor towards knees.'),
('Bicycle Crunches', 'Core', array['Legs'], 'bodyweight', 'beginner', 'HIIT', 'Alternate bringing elbow to opposite knee in a pedaling motion.'),
('Reverse Crunches', 'Core', array[]::text[], 'bodyweight', 'beginner', 'HIIT', 'Lift hips off the floor curling knees towards chest.'),
('Leg Raises', 'Core', array[]::text[], 'bodyweight', 'beginner', 'HIIT', 'Lying on back, raise straight legs to vertical then lower slowly.'),
('Flutter Kick Crunch Combo', 'Core', array['Legs'], 'bodyweight', 'intermediate', 'HIIT', 'Alternate flutter kicks with crunches for a continuous ab burner.'),
('Russian Twists', 'Core', array[]::text[], 'bodyweight', 'beginner', 'HIIT', 'Seated, lean back slightly and rotate torso side to side.'),
('V-Ups', 'Core', array['Legs'], 'bodyweight', 'intermediate', 'HIIT', 'Simultaneously raise straight legs and torso to form a V shape.')
on conflict (name) do nothing;

insert into public.exercise_library (name, target_muscle, secondary_muscles, equipment, difficulty, category, instructions) values
-- Squat variations
('Sumo Squat', 'Legs', array['Glutes','Hips'], 'bodyweight', 'beginner', 'HIIT', 'Wide stance squat with toes turned out, sitting hips back and down.'),
('Sumo Squat Pulse', 'Legs', array['Glutes','Hips'], 'bodyweight', 'beginner', 'HIIT', 'Hold a low sumo squat and pulse up and down in small reps.'),
('Jump Squats', 'Legs', array['Glutes'], 'bodyweight', 'intermediate', 'HIIT', 'Squat down then explode upward into a jump, landing softly into the next rep.'),
('Pulse Squats', 'Legs', array['Glutes'], 'bodyweight', 'beginner', 'HIIT', 'Hold a squat position and pulse up and down through a small range.'),
('Squat with Knee Raise', 'Legs', array['Core','Glutes'], 'bodyweight', 'beginner', 'HIIT', 'Squat down, then stand while driving one knee up towards chest, alternating sides.'),
('Curtsy Squat', 'Legs', array['Glutes'], 'bodyweight', 'intermediate', 'HIIT', 'Step one leg diagonally behind the other into a curtsy lunge, then return to standing.'),

-- Lunge variations
('Standing Lunges', 'Legs', array['Glutes'], 'bodyweight', 'beginner', 'HIIT', 'Step one leg back (or forward) into a lunge, then return to standing, alternating sides.'),
('Walking Lunges', 'Legs', array['Glutes'], 'bodyweight', 'beginner', 'HIIT', 'Step forward into a lunge and continue walking forward, alternating legs each step.'),
('Reverse Lunges', 'Legs', array['Glutes'], 'bodyweight', 'beginner', 'HIIT', 'Step backward into a lunge, then push off the front leg back to standing.'),
('Lateral Lunges', 'Legs', array['Glutes','Hips'], 'bodyweight', 'beginner', 'HIIT', 'Step sideways into a lunge, keeping the other leg straight, then return to center.'),
('Lunge with Twist', 'Legs', array['Core','Glutes'], 'bodyweight', 'intermediate', 'HIIT', 'Lunge forward and rotate the torso towards the front leg at the bottom of the lunge.'),

-- Jump / jack style HIIT
('Cross Jacks', 'Full Body', array['Legs','Shoulders'], 'bodyweight', 'beginner', 'HIIT', 'Like jumping jacks, but cross arms and feet alternately in front of the body each jump.'),
('Seal Jacks', 'Full Body', array['Legs','Shoulders'], 'bodyweight', 'beginner', 'HIIT', 'Jump feet out while clapping straight arms together in front of the chest.'),
('Squat Jack', 'Legs', array['Glutes','Shoulders'], 'bodyweight', 'intermediate', 'HIIT', 'Combine a jumping jack with a squat, landing in a wide squat stance each rep.'),
('Under-the-Knee Clap Jacks', 'Full Body', array['Legs','Core'], 'bodyweight', 'intermediate', 'HIIT', 'Jump raising one knee up and clap both hands underneath it, alternating legs.'),
('Plank to Jack', 'Core', array['Legs','Shoulders'], 'bodyweight', 'intermediate', 'HIIT', 'From plank position, jump feet out and in like a jumping jack while holding the plank.'),

-- Ball-based cardio
('Stability Ball Slams', 'Full Body', array['Core','Shoulders'], 'other', 'intermediate', 'HIIT', 'Lift a light ball overhead and slam it down into the floor with full-body power.'),
('Ball Mountain Climbers', 'Core', array['Shoulders','Legs'], 'other', 'intermediate', 'HIIT', 'Hands on a stability ball in plank position, drive knees alternately towards chest.'),
('Ball Slam Squats', 'Full Body', array['Legs','Core'], 'other', 'intermediate', 'HIIT', 'Squat down holding the ball, then stand and slam it overhead into the ground.'),
('Wall Ball Squats', 'Legs', array['Shoulders','Core'], 'other', 'intermediate', 'HIIT', 'Squat holding a medicine ball at chest, then stand and throw the ball against a wall.'),
('Around-the-World Ball Pass', 'Core', array['Shoulders'], 'other', 'beginner', 'HIIT', 'Circle a light ball around your body at waist height, passing hand to hand.'),

-- Extra full-body / cardio conditioning
('Inchworms', 'Full Body', array['Core','Shoulders'], 'bodyweight', 'beginner', 'HIIT', 'Walk hands out to a plank, hold briefly, then walk feet up to meet hands and stand.'),
('Man Makers', 'Full Body', array['Chest','Legs','Core'], 'dumbbell', 'advanced', 'HIIT', 'Combine a renegade row, burpee, and overhead press using dumbbells for a full-body burner.'),
('Squat Thrusts', 'Full Body', array['Core','Legs'], 'bodyweight', 'intermediate', 'HIIT', 'Drop into a squat, kick feet back to plank, then jump feet back in and stand.'),
('Jump Rope Criss-Cross', 'Cardio', array['Legs','Shoulders'], 'other', 'intermediate', 'HIIT', 'Cross arms in front of the body every other jump-rope skip.'),
('High-Knee Skips', 'Cardio', array['Legs','Core'], 'bodyweight', 'beginner', 'HIIT', 'Skip forward driving knees up high with each hop.'),
('Frog Jumps', 'Legs', array['Glutes','Core'], 'bodyweight', 'intermediate', 'HIIT', 'Squat low then jump forward explosively, landing softly in a squat.'),
('Donkey Kicks', 'Legs', array['Glutes','Core'], 'bodyweight', 'beginner', 'HIIT', 'On hands and knees, kick one leg up and back, alternating sides at a steady pace.'),
('Fire Hydrants', 'Hips', array['Glutes'], 'bodyweight', 'beginner', 'HIIT', 'On hands and knees, lift one bent knee out to the side, alternating sides.'),
('Standing Oblique Crunch', 'Core', array['Legs'], 'bodyweight', 'beginner', 'HIIT', 'Standing, bring elbow down to meet the raised opposite knee, alternating sides.'),
('Toe Touches', 'Core', array['Legs'], 'bodyweight', 'beginner', 'HIIT', 'Lying on back with legs raised, reach hands up to touch toes, curling shoulders off floor.')
on conflict (name) do nothing;
