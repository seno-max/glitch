-- ============================================================================
-- Cardio / HIIT / Fat-Loss Exercise Variety
-- ============================================================================
-- The original seed (0002) was almost entirely strength-training focused.
-- This migration adds a large, varied set of cardio, HIIT, and fat-burning
-- exercises so a weight-loss-focused user has a different workout option
-- to pick from every day instead of always seeing the same few entries.
-- ============================================================================

insert into public.exercise_library (name, target_muscle, secondary_muscles, equipment, difficulty, category, instructions) values
-- Machine / gym cardio
('Treadmill Running', 'Cardio', array['Legs'], 'machine', 'beginner', 'Cardio', 'Run at a steady pace on the treadmill to build endurance and burn calories.'),
('Treadmill Incline Walk', 'Cardio', array['Legs','Glutes'], 'machine', 'beginner', 'Cardio', 'Walk briskly on a raised incline for a low-impact, high-calorie-burn session.'),
('Stationary Bike', 'Cardio', array['Legs'], 'machine', 'beginner', 'Cardio', 'Cycle at moderate-to-high resistance for sustained fat-burning cardio.'),
('Elliptical Trainer', 'Cardio', array['Legs','Arms'], 'machine', 'beginner', 'Cardio', 'Low-impact full-body cardio using the elliptical machine.'),
('Rowing Machine', 'Cardio', array['Back','Arms','Legs'], 'machine', 'intermediate', 'Cardio', 'Row at a consistent pace, driving with legs then pulling with arms.'),
('Stair Climber', 'Cardio', array['Legs','Glutes'], 'machine', 'intermediate', 'Cardio', 'Continuous stepping motion on the stair machine for a high calorie burn.'),
('Spin Bike Sprints', 'Cardio', array['Legs'], 'machine', 'advanced', 'HIIT', 'Alternate 30-60s max-effort sprints with recovery pedaling on a spin bike.'),

-- Outdoor / distance cardio
('Outdoor Running', 'Cardio', array['Legs'], 'bodyweight', 'beginner', 'Cardio', 'Steady-state run outdoors at a conversational pace.'),
('Sprint Intervals', 'Cardio', array['Legs'], 'bodyweight', 'advanced', 'HIIT', 'Sprint all-out for 20-30s, walk/jog to recover, repeat.'),
('Hill Sprints', 'Cardio', array['Legs','Glutes'], 'bodyweight', 'advanced', 'HIIT', 'Sprint uphill at max effort, walk back down to recover, repeat.'),
('Outdoor Cycling', 'Cardio', array['Legs'], 'other', 'beginner', 'Cardio', 'Cycle outdoors at a steady or interval pace.'),
('Swimming Laps', 'Cardio', array['Back','Shoulders','Legs'], 'other', 'intermediate', 'Cardio', 'Continuous lap swimming at a steady effort for full-body low-impact cardio.'),
('Brisk Walking', 'Cardio', array['Legs'], 'bodyweight', 'beginner', 'Cardio', 'Walk at a fast, sustained pace to elevate heart rate.'),
('Stair Sprints', 'Cardio', array['Legs','Glutes'], 'bodyweight', 'intermediate', 'HIIT', 'Sprint up a flight of stairs, walk down to recover, repeat.'),

-- Jump-rope based
('Jump Rope', 'Cardio', array['Legs','Shoulders'], 'other', 'beginner', 'Cardio', 'Continuous jump rope skipping at a steady rhythm.'),
('Double Unders', 'Cardio', array['Legs','Shoulders'], 'other', 'advanced', 'HIIT', 'Jump rope passing the rope twice under your feet per jump.'),
('Boxer Skips', 'Cardio', array['Legs'], 'other', 'beginner', 'Cardio', 'Light alternating-foot skipping with a jump rope, boxer style.'),

-- Bodyweight HIIT / fat-burning circuits
('Jumping Jacks', 'Full Body', array['Legs','Shoulders'], 'bodyweight', 'beginner', 'HIIT', 'Jump feet out while raising arms overhead, then return to start.'),
('Mountain Climbers', 'Core', array['Shoulders','Legs'], 'bodyweight', 'beginner', 'HIIT', 'From plank, drive knees alternately towards chest at a fast pace.'),
('High Knees', 'Cardio', array['Legs','Core'], 'bodyweight', 'beginner', 'HIIT', 'Run in place bringing knees up to hip height as fast as possible.'),
('Burpees', 'Full Body', array['Chest','Legs','Core'], 'bodyweight', 'intermediate', 'HIIT', 'Squat, kick to plank, push up, jump feet in, then jump up explosively.'),
('Squat Jumps', 'Legs', array['Glutes'], 'bodyweight', 'intermediate', 'HIIT', 'Squat down then explode upward into a jump, landing softly.'),
('Jump Lunges', 'Legs', array['Glutes'], 'bodyweight', 'intermediate', 'HIIT', 'Alternate lunges, jumping to switch legs mid-air each rep.'),
('Skater Jumps', 'Legs', array['Glutes','Core'], 'bodyweight', 'intermediate', 'HIIT', 'Leap laterally from one leg to the other in a skating motion.'),
('Plank Jacks', 'Core', array['Shoulders','Legs'], 'bodyweight', 'beginner', 'HIIT', 'From plank, jump feet out and in like a jumping jack.'),
('Star Jumps', 'Full Body', array['Legs','Shoulders'], 'bodyweight', 'beginner', 'HIIT', 'Squat down then jump up spreading arms and legs into a star shape.'),
('Tuck Jumps', 'Legs', array['Core'], 'bodyweight', 'advanced', 'HIIT', 'Jump upward, tucking both knees towards your chest at the peak.'),
('Broad Jumps', 'Legs', array['Glutes'], 'bodyweight', 'intermediate', 'HIIT', 'Jump forward as far as possible, landing softly, then reset.'),
('Bear Crawl', 'Full Body', array['Core','Shoulders'], 'bodyweight', 'intermediate', 'HIIT', 'Crawl forward on hands and feet with knees hovering off the ground.'),
('Speed Skaters', 'Legs', array['Glutes','Core'], 'bodyweight', 'intermediate', 'HIIT', 'Quick lateral bounding jumps mimicking a speed skater stride.'),
('Squat to Punch', 'Full Body', array['Legs','Core'], 'bodyweight', 'beginner', 'HIIT', 'Squat down, then stand and throw alternating punches at the top.'),
('Shadow Boxing', 'Cardio', array['Shoulders','Core'], 'bodyweight', 'beginner', 'Cardio', 'Throw continuous punch combinations while staying light on your feet.'),
('Flutter Kicks', 'Core', array['Legs'], 'bodyweight', 'beginner', 'HIIT', 'Lying on back, alternate small rapid up-down leg kicks.'),
('Butt Kicks', 'Cardio', array['Legs'], 'bodyweight', 'beginner', 'Cardio', 'Jog in place kicking heels up towards glutes rapidly.'),
('Lateral Bounds', 'Legs', array['Glutes','Core'], 'bodyweight', 'intermediate', 'HIIT', 'Bound side to side, landing on one leg each time.'),

-- Kettlebell fat-loss / conditioning
('Kettlebell Swing', 'Full Body', array['Glutes','Core','Back'], 'kettlebell', 'intermediate', 'HIIT', 'Hinge at hips to swing the kettlebell between legs then up to chest height.'),
('Kettlebell Snatch', 'Full Body', array['Shoulders','Back','Legs'], 'kettlebell', 'advanced', 'HIIT', 'Explosively pull the kettlebell from the floor to an overhead lockout in one motion.'),
('Kettlebell Clean and Press', 'Full Body', array['Shoulders','Legs','Core'], 'kettlebell', 'advanced', 'HIIT', 'Clean the kettlebell to shoulder height, then press it overhead.'),
('Kettlebell Thruster', 'Full Body', array['Legs','Shoulders'], 'kettlebell', 'intermediate', 'HIIT', 'Squat holding the kettlebell at chest, then drive up and press overhead.'),
('Goblet Squat to Press', 'Full Body', array['Legs','Shoulders'], 'kettlebell', 'intermediate', 'HIIT', 'Squat holding kettlebell at chest, stand and press it overhead.'),

-- Equipment-light circuits / functional fat loss
('Battle Ropes', 'Full Body', array['Shoulders','Core'], 'other', 'intermediate', 'HIIT', 'Wave, slam, or whip ropes rapidly with alternating or double arms.'),
('Sled Push', 'Full Body', array['Legs','Glutes','Core'], 'other', 'advanced', 'HIIT', 'Drive a weighted sled forward across the floor using short, powerful steps.'),
('Box Jump', 'Full Body', array['Legs'], 'bodyweight', 'intermediate', 'HIIT', 'Jump explosively from the ground onto a raised box, landing softly.'),
('Step-Up to Knee Drive', 'Legs', array['Glutes','Core'], 'bodyweight', 'beginner', 'HIIT', 'Step up onto a bench then drive the trailing knee upward explosively.'),
('Medicine Ball Slam', 'Full Body', array['Core','Shoulders'], 'other', 'intermediate', 'HIIT', 'Raise the ball overhead and slam it to the ground with full-body force.'),
('Farmers Carry', 'Full Body', array['Core','Back','Arms'], 'dumbbell', 'beginner', 'HIIT', 'Carry a heavy weight in each hand over a distance while maintaining posture.'),

-- Circuit / metabolic finishers
('Tabata Squats', 'Legs', array['Glutes'], 'bodyweight', 'intermediate', 'HIIT', '20s max-effort bodyweight squats, 10s rest, repeated for 8 rounds.'),
('Tabata Burpees', 'Full Body', array['Legs','Core'], 'bodyweight', 'advanced', 'HIIT', '20s max-effort burpees, 10s rest, repeated for 8 rounds.'),
('EMOM Kettlebell Swings', 'Full Body', array['Glutes','Core'], 'kettlebell', 'intermediate', 'HIIT', 'Perform a set number of kettlebell swings at the start of every minute.'),
('Dance Cardio', 'Cardio', array['Legs','Core'], 'bodyweight', 'beginner', 'Cardio', 'Follow continuous dance-style movement patterns to elevate heart rate.'),
('Zumba-Style Cardio', 'Cardio', array['Legs','Core'], 'bodyweight', 'beginner', 'Cardio', 'Rhythmic dance-inspired cardio workout set to music.'),
('Circuit Training Round', 'Full Body', array[]::text[], 'other', 'intermediate', 'HIIT', 'Move through a series of stations with minimal rest to keep heart rate elevated.')
on conflict do nothing;
