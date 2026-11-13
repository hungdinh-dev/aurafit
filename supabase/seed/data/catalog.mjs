// Catalog seed data. Source of truth for supabase/seed/01_catalog.sql and for the
// muscle → head mapping used when generating 02_exercises.sql.
// Specs: docs/04-database/06-workout.md §1, docs/02-features/muscle-recovery.md §1b,
//        docs/02-features/daily-tasks.md §2, docs/02-features/gamification.md §9.

export const muscleGroups = [
  // code, name_vi, name_en
  ['chest', 'Ngực', 'Chest'],
  ['back', 'Lưng', 'Back'],
  ['shoulders', 'Vai', 'Shoulders'],
  ['biceps', 'Tay trước', 'Biceps'],
  ['triceps', 'Tay sau', 'Triceps'],
  ['forearms', 'Cẳng tay', 'Forearms'],
  ['abs', 'Bụng', 'Abs'],
  ['glutes', 'Mông', 'Glutes'],
  ['legs', 'Chân', 'Legs'],
];

// 18 muscles (regions) of the recovery map.
export const muscles = [
  // code, group, name_vi, name_en, view, size, base_recovery_hours
  ['chest', 'chest', 'Ngực', 'Chest', 'front', 'large', 72],
  ['front_delts', 'shoulders', 'Vai trước', 'Front delts', 'front', 'medium', 48],
  ['side_delts', 'shoulders', 'Vai giữa', 'Side delts', 'both', 'medium', 48],
  ['rear_delts', 'shoulders', 'Vai sau', 'Rear delts', 'back', 'medium', 48],
  ['biceps', 'biceps', 'Tay trước', 'Biceps', 'front', 'small', 48],
  ['triceps', 'triceps', 'Tay sau', 'Triceps', 'back', 'small', 48],
  ['forearms', 'forearms', 'Cẳng tay', 'Forearms', 'both', 'small', 36],
  ['abs', 'abs', 'Bụng', 'Abs', 'front', 'small', 36],
  ['obliques', 'abs', 'Bụng chéo', 'Obliques', 'front', 'small', 36],
  ['traps', 'back', 'Cơ thang', 'Traps', 'back', 'medium', 48],
  ['lats', 'back', 'Xô', 'Lats', 'back', 'large', 72],
  ['upper_back', 'back', 'Lưng giữa', 'Mid back', 'back', 'large', 60],
  ['lower_back', 'back', 'Lưng dưới', 'Lower back', 'back', 'large', 72],
  ['glutes', 'glutes', 'Mông', 'Glutes', 'back', 'large', 72],
  ['quads', 'legs', 'Đùi trước', 'Quads', 'front', 'large', 72],
  ['hamstrings', 'legs', 'Đùi sau', 'Hamstrings', 'back', 'large', 72],
  ['adductors', 'legs', 'Đùi trong', 'Adductors', 'front', 'medium', 48],
  ['calves', 'legs', 'Bắp chân', 'Calves', 'back', 'small', 48],
];

// 37 muscle heads (parts). code, muscle, name_vi, name_en
export const muscleHeads = [
  ['chest_upper', 'chest', 'Ngực trên', 'Upper chest'],
  ['chest_middle', 'chest', 'Ngực giữa', 'Mid chest'],
  ['chest_lower', 'chest', 'Ngực dưới', 'Lower chest'],
  ['front_delts', 'front_delts', 'Vai trước', 'Front delts'],
  ['side_delts', 'side_delts', 'Vai giữa', 'Side delts'],
  ['rear_delts', 'rear_delts', 'Vai sau', 'Rear delts'],
  ['biceps_long', 'biceps', 'Đầu dài', 'Long head'],
  ['biceps_short', 'biceps', 'Đầu ngắn', 'Short head'],
  ['brachialis', 'biceps', 'Cơ cánh tay', 'Brachialis'],
  ['triceps_long', 'triceps', 'Đầu dài', 'Long head'],
  ['triceps_lateral', 'triceps', 'Đầu ngoài', 'Lateral head'],
  ['triceps_medial', 'triceps', 'Đầu trong', 'Medial head'],
  ['forearm_flexors', 'forearms', 'Nhóm gập', 'Flexors'],
  ['forearm_extensors', 'forearms', 'Nhóm duỗi', 'Extensors'],
  ['brachioradialis', 'forearms', 'Cơ cánh tay quay', 'Brachioradialis'],
  ['abs_upper', 'abs', 'Bụng trên', 'Upper abs'],
  ['abs_lower', 'abs', 'Bụng dưới', 'Lower abs'],
  ['obliques_external', 'obliques', 'Chéo ngoài', 'External obliques'],
  ['serratus', 'obliques', 'Răng cưa', 'Serratus anterior'],
  ['traps_upper', 'traps', 'Thang trên', 'Upper traps'],
  ['traps_middle', 'traps', 'Thang giữa', 'Middle traps'],
  ['traps_lower', 'traps', 'Thang dưới', 'Lower traps'],
  ['lats', 'lats', 'Xô', 'Lats'],
  ['rhomboids', 'upper_back', 'Cơ trám', 'Rhomboids'],
  ['teres_infraspinatus', 'upper_back', 'Cơ tròn / dưới gai', 'Teres & infraspinatus'],
  ['erector_spinae', 'lower_back', 'Cơ dựng sống', 'Erector spinae'],
  ['glute_max', 'glutes', 'Mông lớn', 'Gluteus maximus'],
  ['glute_med', 'glutes', 'Mông nhỡ', 'Gluteus medius'],
  ['rectus_femoris', 'quads', 'Cơ thẳng đùi', 'Rectus femoris'],
  ['vastus_lateralis', 'quads', 'Rộng ngoài', 'Vastus lateralis'],
  ['vastus_medialis', 'quads', 'Rộng trong', 'Vastus medialis'],
  ['biceps_femoris', 'hamstrings', 'Nhị đầu đùi', 'Biceps femoris'],
  ['semitendinosus', 'hamstrings', 'Bán gân / bán màng', 'Semitendinosus & semimembranosus'],
  ['adductors', 'adductors', 'Nhóm khép', 'Adductors'],
  ['gastrocnemius', 'calves', 'Bắp chân (gastrocnemius)', 'Gastrocnemius'],
  ['soleus', 'calves', 'Dép (soleus)', 'Soleus'],
  ['tibialis_anterior', 'calves', 'Chày trước', 'Tibialis anterior'],
];

export const equipment = [
  // code, name_vi, name_en, home_friendly
  ['barbell', 'Tạ đòn', 'Barbell', false],
  ['dumbbell', 'Tạ đơn', 'Dumbbell', true],
  ['cable', 'Cáp', 'Cable', false],
  ['machine', 'Máy', 'Machine', false],
  ['smith_machine', 'Máy Smith', 'Smith machine', false],
  ['bodyweight', 'Trọng lượng cơ thể', 'Bodyweight', true],
  ['pullup_bar', 'Xà đơn', 'Pull-up bar', true],
  ['band', 'Dây kháng lực', 'Resistance band', true],
  ['kettlebell', 'Tạ ấm', 'Kettlebell', true],
];

// Per-head stimulus overrides (muscle-recovery.md §1b, chest examples).
// Exercises not listed get the region stimulus on every head of the region.
export const headOverrides = {
  incline_barbell_bench_press: { chest_upper: 1.0, chest_middle: 0.6, chest_lower: 0.2 },
  incline_dumbbell_press: { chest_upper: 1.0, chest_middle: 0.6, chest_lower: 0.2 },
  barbell_bench_press: { chest_upper: 0.5, chest_middle: 1.0, chest_lower: 0.5 },
  dumbbell_bench_press: { chest_upper: 0.5, chest_middle: 1.0, chest_lower: 0.5 },
  machine_chest_press: { chest_upper: 0.5, chest_middle: 1.0, chest_lower: 0.5 },
  dumbbell_fly: { chest_upper: 0.5, chest_middle: 1.0, chest_lower: 0.5 },
  pec_deck_fly: { chest_upper: 0.5, chest_middle: 1.0, chest_lower: 0.5 },
  chest_dip: { chest_upper: 0.2, chest_middle: 0.6, chest_lower: 1.0 },
  cable_crossover: { chest_upper: 0.2, chest_middle: 0.8, chest_lower: 0.8 },
  push_up: { chest_upper: 0.4, chest_middle: 1.0, chest_lower: 0.5 },
};

// movement_pattern per exercise (used to find equivalent swaps). Others: null.
export const movementPatterns = {
  push_h: ['barbell_bench_press', 'incline_barbell_bench_press', 'dumbbell_bench_press', 'incline_dumbbell_press',
    'machine_chest_press', 'push_up', 'chest_dip', 'close_grip_bench_press', 'diamond_push_up', 'bench_dip'],
  push_v: ['overhead_press', 'dumbbell_shoulder_press', 'arnold_press', 'machine_shoulder_press', 'pike_push_up'],
  pull_h: ['barbell_row', 'seated_cable_row', 'one_arm_dumbbell_row', 't_bar_row', 'inverted_row'],
  pull_v: ['pull_up', 'chin_up', 'lat_pulldown'],
  squat: ['barbell_back_squat', 'front_squat', 'goblet_squat', 'smith_machine_squat', 'leg_press', 'sumo_goblet_squat'],
  hinge: ['deadlift', 'romanian_deadlift', 'barbell_hip_thrust', 'glute_bridge', 'single_leg_glute_bridge', 'kettlebell_swing'],
  lunge: ['bulgarian_split_squat', 'walking_lunge', 'dumbbell_step_up'],
  core: ['crunch', 'plank', 'side_plank', 'lying_leg_raise', 'hanging_leg_raise', 'cable_crunch', 'russian_twist',
    'bicycle_crunch', 'mountain_climber', 'dead_bug'],
  carry: ['farmers_walk'],
};

// Calisthenics progression chains (signature-features §8; level up at 3×12).
export const progressions = {
  push: ['push_up', 'diamond_push_up', 'chest_dip'],
  pull: ['inverted_row', 'chin_up', 'pull_up'],
  core_leg_raise: ['dead_bug', 'lying_leg_raise', 'hanging_leg_raise'],
  glute_bridge: ['glute_bridge', 'single_leg_glute_bridge'],
};
export const unlockCriteria = { sets: 3, reps: 12 };

// Smallest load increment per equipment (kg).
export const loadStepKg = { barbell: 2.5, dumbbell: 2, cable: 2.5, machine: 5, smith_machine: 2.5, kettlebell: 4 };

// Daily task templates (daily-tasks.md §2).
export const taskTemplates = [
  // code, title_vi, title_en, kind, default_target_value, unit, auto_source, icon (SF Symbol)
  ['reading', 'Đọc sách', 'Reading', 'count', 20, 'pages', null, 'book.fill'],
  ['focus', 'Làm việc tập trung', 'Deep work', 'timer', 2, 'sessions', null, 'timer'],
  ['meditation', 'Thiền / hít thở', 'Meditation & breathing', 'check', null, null, null, 'leaf.fill'],
  ['social_limit', 'Giới hạn mạng xã hội', 'Limit social media', 'check', null, null, null, 'iphone.slash'],
  ['steps', 'Bước chân', 'Steps', 'auto', 8000, 'steps', 'steps', 'figure.walk'],
  // target = minutes after local midnight (06:30 = 390)
  ['wake_early', 'Dậy sớm', 'Wake up early', 'auto', 390, 'min_of_day', 'wake_before', 'sunrise.fill'],
];

// Badges – codes and rarity mirror packages/core/src/coach/badges.ts (BADGES); the close-day
// RPC ignores codes missing here, so keep both lists in sync. name/description are i18n keys
// badge.<code>.name / badge.<code>.description (core convention).
export const badges = [
  // code, icon (SF Symbol), rarity
  ['first_excellent_day', 'star.fill', 'common'],
  ['streak_7', 'flame.fill', 'common'],
  ['streak_30', 'flame.fill', 'rare'],
  ['streak_100', 'flame.fill', 'epic'],
  ['streak_365', 'flame.fill', 'legendary'],
  ['perfect_week', 'calendar.badge.checkmark', 'rare'],
  ['boss_slayer', 'shield.lefthalf.filled', 'common'],
  ['boss_slayer_10', 'shield.lefthalf.filled', 'epic'],
  ['boss_sugar_demon', 'cube.fill', 'rare'],
  ['boss_sloth', 'tortoise.fill', 'rare'],
  ['boss_night_owl', 'moon.stars.fill', 'rare'],
  ['boss_drought', 'drop.fill', 'rare'],
  ['boss_protein_thief', 'fork.knife', 'rare'],
  ['boss_scatterbrain', 'brain.head.profile', 'rare'],
  ['level_5', 'sparkles', 'common'],
  ['level_10', 'sparkles', 'rare'],
  ['level_25', 'sparkles', 'epic'],
  ['level_50', 'sparkles', 'legendary'],
  ['aura_gold', 'sun.max.fill', 'epic'],
  ['aura_red', 'flame.circle.fill', 'legendary'],
  ['first_pr', 'trophy.fill', 'common'],
  ['calisthenics_level_up', 'figure.strengthtraining.functional', 'rare'],
  ['weight_milestone', 'scalemass.fill', 'rare'],
  ['full_shields', 'shield.fill', 'rare'],
];
