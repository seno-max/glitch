-- ============================================================================
-- 0007: Fill remaining gaps in the HIIT/cardio bodyweight exercise catalog
-- ----------------------------------------------------------------------------
-- Adds the remaining classic HIIT/cardio movements requested (march/running
-- variations of high knees, squat/lunge variants, burpee combos, plank
-- variations, plyometric hops/jumps, etc.) that were not yet in the library.
-- Uses `on conflict (name) do nothing` against the unique index added in
-- migration 0005, so it's safe to re-run.
-- ============================================================================

insert into public.exercise_library (name, target_muscle, secondary_muscles, equipment, difficulty, category, instructions) values
-- Warm-up / low-impact cardio
('Half Jumping Jacks', 'Full Body', array['Legs','Shoulders'], 'bodyweight', 'beginner', 'HIIT', 'A lower-impact jumping jack: step feet out while raising arms instead of jumping.'),
('High Knees March', 'Legs', array['Core'], 'bodyweight', 'beginner', 'HIIT', 'March in place driving knees up to hip height at a controlled pace.'),
('High Knees Running', 'Legs', array['Core','Cardio'], 'bodyweight', 'intermediate', 'HIIT', 'Run in place driving knees up as fast as possible for a cardio burst.'),
('Fast Feet', 'Legs', array['Cardio'], 'bodyweight', 'beginner', 'HIIT', 'Quickly tap feet up and down in place, staying light on the toes.'),
('Step Touch', 'Legs', array['Cardio'], 'bodyweight', 'beginner', 'HIIT', 'Step one foot out to the side and tap the other foot beside it, alternating sides.'),
('Side Steps', 'Legs', array['Glutes','Cardio'], 'bodyweight', 'beginner', 'HIIT', 'Step laterally side to side in a low athletic stance.'),
('Side Shuffle', 'Legs', array['Glutes','Cardio'], 'bodyweight', 'beginner', 'HIIT', 'Shuffle quickly sideways staying low, then reverse direction.')
on conflict (name) do nothing;

insert into public.exercise_library (name, target_muscle, secondary_muscles, equipment, difficulty, category, instructions) values
-- Squat variations
('Bodyweight Squats', 'Legs', array['Glutes'], 'bodyweight', 'beginner', 'HIIT', 'Stand feet shoulder-width apart, sit hips back and down, then drive back up to standing.'),
('Squat to Calf Raise', 'Legs', array['Calves','Glutes'], 'bodyweight', 'beginner', 'HIIT', 'Perform a bodyweight squat, then rise onto toes at the top for a calf raise.'),
('Squat Pulse', 'Legs', array['Glutes'], 'bodyweight', 'beginner', 'HIIT', 'Hold a mid-squat position and pulse gently up and down.'),
('Chair Squats', 'Legs', array['Glutes'], 'bodyweight', 'beginner', 'HIIT', 'Lower down to lightly tap a chair with your hips, then stand back up.'),
('Wall Sit', 'Legs', array['Glutes'], 'bodyweight', 'beginner', 'HIIT', 'Slide down a wall until knees are at 90 degrees and hold the position.')
on conflict (name) do nothing;

insert into public.exercise_library (name, target_muscle, secondary_muscles, equipment, difficulty, category, instructions) values
-- Core / standing ab work
('Standing Toe Touch', 'Core', array['Legs'], 'bodyweight', 'beginner', 'HIIT', 'Standing, kick one leg up and reach the opposite hand to touch the toe, alternating sides.'),
('Standing Side Crunch', 'Core', array['Legs'], 'bodyweight', 'beginner', 'HIIT', 'Standing, bring elbow down to meet the raised knee out to the side, alternating sides.'),
('Knee Raises', 'Core', array['Legs'], 'bodyweight', 'beginner', 'HIIT', 'Standing or hanging, raise knees up towards the chest in a controlled motion.'),
('Alternating Knee Lifts', 'Core', array['Legs'], 'bodyweight', 'beginner', 'HIIT', 'Standing in place, lift alternating knees up towards the chest at a steady pace.'),
('Mountain Climber Twists', 'Core', array['Shoulders','Legs'], 'bodyweight', 'intermediate', 'HIIT', 'In a mountain climber, twist the knee across towards the opposite elbow each rep.'),
('Plank Shoulder Taps', 'Core', array['Shoulders'], 'bodyweight', 'intermediate', 'HIIT', 'In a high plank, alternate tapping each hand to the opposite shoulder without rotating the hips.'),
('Plank Up-Downs', 'Core', array['Shoulders','Arms'], 'bodyweight', 'intermediate', 'HIIT', 'Alternate between forearm plank and high plank by walking hands up and down.'),
('Scissor Kicks', 'Core', array['Legs'], 'bodyweight', 'beginner', 'HIIT', 'Lying on back, cross straight legs over each other in a scissor motion just above the floor.'),
('Hollow Body Hold with Pulses', 'Core', array[]::text[], 'bodyweight', 'advanced', 'HIIT', 'Hold a hollow body position with lower back on the floor and pulse arms and legs slightly.')
on conflict (name) do nothing;

insert into public.exercise_library (name, target_muscle, secondary_muscles, equipment, difficulty, category, instructions) values
-- Lunge / skater / jump variations
('Split Squat Jumps', 'Legs', array['Glutes'], 'bodyweight', 'advanced', 'HIIT', 'From a lunge stance, jump straight up and switch legs mid-air, landing in a lunge on the other side.'),
('Alternating Jump Lunges', 'Legs', array['Glutes'], 'bodyweight', 'advanced', 'HIIT', 'Jump lunge and switch legs in the air with each rep, alternating sides continuously.'),
('Jumping Lunges', 'Legs', array['Glutes'], 'bodyweight', 'advanced', 'HIIT', 'From a lunge, jump up and swap leg positions before landing softly back into a lunge.'),
('Lateral Skaters', 'Legs', array['Glutes','Cardio'], 'bodyweight', 'intermediate', 'HIIT', 'Leap laterally from one leg to the other in a skating motion, swinging the trailing leg behind.'),
('Split Jumps', 'Legs', array['Glutes'], 'bodyweight', 'advanced', 'HIIT', 'From a split stance, jump and switch the front/back leg with each rep.')
on conflict (name) do nothing;

insert into public.exercise_library (name, target_muscle, secondary_muscles, equipment, difficulty, category, instructions) values
-- Burpee combos & explosive full body
('Half Burpees', 'Full Body', array['Core','Legs'], 'bodyweight', 'beginner', 'HIIT', 'Drop to a plank and back up to standing, skipping the push-up and jump for a lower-impact burpee.'),
('Cross Body Mountain Climbers', 'Core', array['Shoulders','Legs'], 'bodyweight', 'intermediate', 'HIIT', 'In a plank, drive one knee diagonally across towards the opposite elbow, alternating sides.'),
('Power Jacks', 'Full Body', array['Legs','Glutes'], 'bodyweight', 'intermediate', 'HIIT', 'Perform a jumping jack but land in a deep squat each time before jumping back up.'),
('Squat Jumps with Hold', 'Legs', array['Glutes'], 'bodyweight', 'intermediate', 'HIIT', 'Jump squat explosively, then hold the landing squat position for a beat before the next rep.'),
('Burpee to Tuck Jump', 'Full Body', array['Core','Legs'], 'bodyweight', 'advanced', 'HIIT', 'Perform a full burpee, then finish with a tuck jump bringing knees to chest.'),
('Burpee to Push-up', 'Full Body', array['Chest','Core'], 'bodyweight', 'advanced', 'HIIT', 'Perform a burpee and add a push-up while in the plank position before jumping back up.'),
('Burpee Broad Jump', 'Full Body', array['Legs','Core'], 'bodyweight', 'advanced', 'HIIT', 'Perform a burpee, then immediately explode into a broad jump forward.'),
('Burpee Box Jump', 'Full Body', array['Legs','Core'], 'bodyweight', 'advanced', 'HIIT', 'Perform a burpee, then jump up onto a box or step instead of jumping in place.'),
('Explosive Push-ups', 'Chest', array['Arms','Core'], 'bodyweight', 'advanced', 'HIIT', 'Push up explosively so the hands leave the floor, landing softly to absorb impact.')
on conflict (name) do nothing;

insert into public.exercise_library (name, target_muscle, secondary_muscles, equipment, difficulty, category, instructions) values
-- Plyometric / box work
('Box Step Overs', 'Legs', array['Glutes','Cardio'], 'bodyweight', 'beginner', 'HIIT', 'Step up and over a low box or bench, alternating the leading leg.'),
('Bench Hops', 'Legs', array['Glutes','Cardio'], 'bodyweight', 'intermediate', 'HIIT', 'Hop side to side over a low bench with both feet together.'),
('Lateral Box Jumps', 'Legs', array['Glutes'], 'bodyweight', 'advanced', 'HIIT', 'Jump sideways onto a low box or platform, then step down and repeat on the same or opposite side.'),
('Single Leg Hops', 'Legs', array['Glutes','Cardio'], 'bodyweight', 'intermediate', 'HIIT', 'Hop forward, backward, or side to side on one leg at a time for balance and power.'),
('Bounding', 'Legs', array['Glutes','Cardio'], 'bodyweight', 'intermediate', 'HIIT', 'Take exaggerated running strides, driving off each leg for maximum distance per stride.'),
('Power Skips', 'Legs', array['Glutes','Cardio'], 'bodyweight', 'intermediate', 'HIIT', 'Skip forward driving the knee up explosively and pushing off the ground with power.'),
('Depth Jumps', 'Legs', array['Glutes'], 'bodyweight', 'advanced', 'HIIT', 'Step off a low box, land softly, then immediately jump up as high as possible.')
on conflict (name) do nothing;
