-- ============================================================================
-- Seed data: Exercise Library & Achievement Catalog
-- ============================================================================

insert into public.exercise_library (name, target_muscle, secondary_muscles, equipment, difficulty, category, instructions) values
('Barbell Bench Press', 'Chest', array['Triceps','Shoulders'], 'barbell', 'intermediate', 'Chest', 'Lie on bench, lower bar to chest, press up.'),
('Incline Dumbbell Press', 'Chest', array['Shoulders','Triceps'], 'dumbbell', 'intermediate', 'Chest', 'Press dumbbells upward on an inclined bench.'),
('Cable Fly', 'Chest', array['Shoulders'], 'cable', 'beginner', 'Chest', 'Bring cables together in front of chest.'),
('Push Up', 'Chest', array['Triceps','Core'], 'bodyweight', 'beginner', 'Chest', 'Lower and push body up from the floor.'),
('Deadlift', 'Back', array['Glutes','Hamstrings','Core'], 'barbell', 'advanced', 'Back', 'Lift bar from floor keeping back straight.'),
('Lat Pulldown', 'Back', array['Biceps'], 'cable', 'beginner', 'Back', 'Pull bar down to chest from overhead.'),
('Barbell Row', 'Back', array['Biceps','Shoulders'], 'barbell', 'intermediate', 'Back', 'Row bar to torso while hinged forward.'),
('Pull Up', 'Back', array['Biceps'], 'bodyweight', 'advanced', 'Back', 'Pull body up until chin over bar.'),
('Seated Cable Row', 'Back', array['Biceps'], 'cable', 'beginner', 'Back', 'Pull handle towards torso while seated.'),
('Overhead Press', 'Shoulders', array['Triceps','Core'], 'barbell', 'intermediate', 'Shoulders', 'Press bar overhead from shoulder height.'),
('Lateral Raise', 'Shoulders', array[]::text[], 'dumbbell', 'beginner', 'Shoulders', 'Raise dumbbells to the sides.'),
('Face Pull', 'Shoulders', array['Back'], 'cable', 'beginner', 'Shoulders', 'Pull rope towards face, elbows high.'),
('Barbell Squat', 'Legs', array['Glutes','Core'], 'barbell', 'intermediate', 'Legs', 'Squat down keeping back neutral.'),
('Leg Press', 'Legs', array['Glutes'], 'machine', 'beginner', 'Legs', 'Push platform away with legs.'),
('Romanian Deadlift', 'Legs', array['Glutes','Back'], 'barbell', 'intermediate', 'Legs', 'Hinge at hips lowering bar close to legs.'),
('Leg Extension', 'Legs', array[]::text[], 'machine', 'beginner', 'Legs', 'Extend knees against resistance pad.'),
('Leg Curl', 'Legs', array[]::text[], 'machine', 'beginner', 'Legs', 'Curl heels towards glutes against pad.'),
('Calf Raise', 'Legs', array[]::text[], 'machine', 'beginner', 'Legs', 'Raise heels up onto toes.'),
('Barbell Curl', 'Arms', array[]::text[], 'barbell', 'beginner', 'Arms', 'Curl bar up towards shoulders.'),
('Tricep Pushdown', 'Arms', array[]::text[], 'cable', 'beginner', 'Arms', 'Push cable down extending elbows.'),
('Hammer Curl', 'Arms', array[]::text[], 'dumbbell', 'beginner', 'Arms', 'Curl dumbbells with neutral grip.'),
('Skull Crusher', 'Arms', array[]::text[], 'barbell', 'intermediate', 'Arms', 'Lower bar to forehead, extend elbows.'),
('Plank', 'Core', array[]::text[], 'bodyweight', 'beginner', 'Core', 'Hold straight body line on forearms.'),
('Hanging Leg Raise', 'Core', array[]::text[], 'bodyweight', 'intermediate', 'Core', 'Raise legs while hanging from bar.'),
('Cable Crunch', 'Core', array[]::text[], 'cable', 'beginner', 'Core', 'Crunch down against cable resistance.'),
('Kettlebell Swing', 'Full Body', array['Glutes','Core'], 'kettlebell', 'intermediate', 'Full Body', 'Swing kettlebell using hip hinge.'),
('Burpee', 'Full Body', array[]::text[], 'bodyweight', 'intermediate', 'Full Body', 'Squat, plank, push up, jump.'),
('Box Jump', 'Full Body', array['Legs'], 'bodyweight', 'intermediate', 'Full Body', 'Jump onto box landing softly.'),
('Battle Ropes', 'Full Body', array['Shoulders','Core'], 'other', 'intermediate', 'HIIT', 'Wave ropes rapidly with alternating arms.'),
('Downward Dog', 'Full Body', array['Shoulders','Hamstrings'], 'bodyweight', 'beginner', 'Yoga', 'Form inverted V shape stretching shoulders and hamstrings.'),
('Cat-Cow Stretch', 'Back', array['Core'], 'bodyweight', 'beginner', 'Mobility', 'Alternate arching and rounding spine.'),
('Pigeon Pose', 'Hips', array['Glutes'], 'bodyweight', 'beginner', 'Yoga', 'Deep hip opener stretch.'),
('World''s Greatest Stretch', 'Full Body', array[]::text[], 'bodyweight', 'beginner', 'Mobility', 'Lunge with rotation and reach.')
on conflict do nothing;

insert into public.achievement_catalog (code, name, description, icon, category, criteria) values
('first_workout', 'First Workout', 'Complete your very first workout session.', '🏋️', 'milestone', '{"workouts":1}'),
('10_workouts', '10 Workouts', 'Complete 10 workout sessions.', '💪', 'milestone', '{"workouts":10}'),
('50_workouts', '50 Workouts', 'Complete 50 workout sessions.', '🔥', 'milestone', '{"workouts":50}'),
('100_workouts', '100 Workouts', 'Complete 100 workout sessions.', '🏆', 'milestone', '{"workouts":100}'),
('365_day_warrior', '365 Day Warrior', 'Log activity for 365 days.', '🎖️', 'milestone', '{"days_logged":365}'),
('100k_steps', '100k Steps', 'Walk a cumulative 100,000 steps.', '👣', 'steps', '{"total_steps":100000}'),
('1m_steps', '1 Million Steps', 'Walk a cumulative 1,000,000 steps.', '🚶', 'steps', '{"total_steps":1000000}'),
('lost_first_5kg', 'Lost First 5kg', 'Lose your first 5kg towards your goal.', '⚖️', 'weight', '{"weight_lost_kg":5}'),
('lost_10kg', 'Lost 10kg', 'Lose 10kg towards your goal.', '📉', 'weight', '{"weight_lost_kg":10}'),
('bench_100kg', 'Bench Press 100kg', 'Bench press 100kg for at least 1 rep.', '🥇', 'strength', '{"exercise":"Barbell Bench Press","weight_kg":100}'),
('deadlift_150kg', 'Deadlift 150kg', 'Deadlift 150kg for at least 1 rep.', '🏅', 'strength', '{"exercise":"Deadlift","weight_kg":150}'),
('first_cardio', 'First Cardio Session', 'Log your first cardio session.', '🏃', 'cardio', '{"cardio_sessions":1}'),
('100km_running', '100km Total Running', 'Run a cumulative 100km.', '🏃‍♂️', 'cardio', '{"run_distance_km":100}'),
('50h_cardio', '50 Hours Cardio', 'Log 50 cumulative hours of cardio.', '⏱️', 'cardio', '{"cardio_hours":50}')
on conflict do nothing;
