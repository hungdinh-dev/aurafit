import { supabase } from '@/src/lib/supabase';

export interface Workout {
  id: string;
  user_id: string;
  title: string;
  duration_minutes: number;
  calories_burned: number;
  xp_gained: number;
  plan_id?: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: string;
  instructions?: string;
  image_url?: string;
  default_reps_min: number;
  default_reps_max: number;
  xp_per_set: number;
  created_at?: string;
}

export interface WorkoutPlan {
  id: string;
  user_id?: string | null;
  name: string;
  description?: string;
  day_of_week: number; // 1 to 7 (Mon-Sun)
  difficulty: string;
  created_by: string;
  created_at?: string;
}

export interface WorkoutPlanExercise {
  id: string;
  plan_id: string;
  exercise_id: string;
  sequence_order: number;
  default_sets: number;
  default_reps_min: number;
  default_reps_max: number;
  default_weight_ratio: number;
  rest_duration_seconds?: number;
  exercises?: Exercise; // Joined exercise details
}

export interface ExerciseSetLog {
  id?: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps_completed: number;
  is_completed: boolean;
  xp_gained: number;
  created_at?: string;
}

// ==========================================
// OFFLINE MOCK DATA SEED FALLBACKS
// ==========================================

export const MOCK_EXERCISES: Exercise[] = [
  {
    id: 'ex-1',
    name: 'Bench Press (Đẩy Ngực Ngang)',
    primary_muscle: 'Chest',
    secondary_muscles: ['Triceps', 'Front Shoulders'],
    equipment: 'Barbell',
    instructions: 'Nằm trên ghế phẳng, hai tay nắm tạ rộng hơn vai. Hạ tạ xuống chạm nhẹ ngực giữa rồi đẩy mạnh tạ lên thẳng tay.',
    default_reps_min: 8,
    default_reps_max: 12,
    xp_per_set: 10
  },
  {
    id: 'ex-2',
    name: 'Lat Pulldown (Kéo Xô Cáp)',
    primary_muscle: 'Lats',
    secondary_muscles: ['Biceps', 'Upper Back'],
    equipment: 'Cable',
    instructions: 'Ngồi vào máy, hai tay nắm thanh xà rộng hơn vai. Ưỡn ngực, kéo thanh xà xuống sát ngực trên bằng cơ lưng rồi từ từ đưa lên.',
    default_reps_min: 8,
    default_reps_max: 12,
    xp_per_set: 10
  },
  {
    id: 'ex-3',
    name: 'Barbell Squat (Gánh Đùi Tạ Đòn)',
    primary_muscle: 'Quads',
    secondary_muscles: ['Glutes', 'Hamstrings', 'Core'],
    equipment: 'Barbell',
    instructions: 'Đặt tạ đòn lên cơ cầu vai. Đứng thẳng chân rộng bằng vai, hạ thấp mông xuống dưới góc 90 độ rồi đẩy người đứng dậy.',
    default_reps_min: 8,
    default_reps_max: 12,
    xp_per_set: 12
  },
  {
    id: 'ex-4',
    name: 'Dumbbell Bicep Curl (Cuốn Tay Trước)',
    primary_muscle: 'Biceps',
    secondary_muscles: ['Forearms'],
    equipment: 'Dumbbell',
    instructions: 'Đứng thẳng nắm tạ đơn hướng vào đùi. Co khuỷu tay nâng tạ lên xoay lòng bàn tay hướng lên trên, siết chặt cơ bắp tay trước.',
    default_reps_min: 10,
    default_reps_max: 15,
    xp_per_set: 8
  },
  {
    id: 'ex-5',
    name: 'Tricep Pushdown (Kéo Cáp Tay Sau)',
    primary_muscle: 'Triceps',
    secondary_muscles: [],
    equipment: 'Cable',
    instructions: 'Đứng đối diện cáp kéo nắm tay cầm chữ V hoặc dây thừng. Giữ cố định khuỷu tay sát thân, đẩy cáp xuống dưới thẳng tay.',
    default_reps_min: 10,
    default_reps_max: 15,
    xp_per_set: 8
  },
  {
    id: 'ex-6',
    name: 'Shoulder Press (Đẩy Vai Tạ Đơn)',
    primary_muscle: 'Shoulders',
    secondary_muscles: ['Triceps'],
    equipment: 'Dumbbell',
    instructions: 'Ngồi thẳng lưng trên ghế, nâng hai quả tạ đơn lên ngang tai. Đẩy thẳng tạ lên trên đầu cho đến khi thẳng tay rồi hạ xuống.',
    default_reps_min: 8,
    default_reps_max: 12,
    xp_per_set: 10
  },
  {
    id: 'ex-7',
    name: 'Leg Press (Đạp Đùi Bằng Máy)',
    primary_muscle: 'Quads',
    secondary_muscles: ['Glutes', 'Calves'],
    equipment: 'Machine',
    instructions: 'Đặt hai bàn chân rộng bằng vai lên bàn đạp. Mở khóa an toàn, hạ thấp đùi vuông góc rồi đạp mạnh bàn đạp đẩy thẳng chân.',
    default_reps_min: 8,
    default_reps_max: 12,
    xp_per_set: 10
  },
  {
    id: 'ex-8',
    name: 'Lateral Raise (Dang Tạ Đơn Vai Bên)',
    primary_muscle: 'Shoulders',
    secondary_muscles: [],
    equipment: 'Dumbbell',
    instructions: 'Đứng thẳng nắm hai tạ đơn ở hông. Dang thẳng hai cánh tay sang hai bên cho đến khi ngang vai rồi hạ xuống chậm rãi.',
    default_reps_min: 12,
    default_reps_max: 15,
    xp_per_set: 8
  },
  {
    id: 'ex-9',
    name: 'Deadlift (Kéo Lưng Đùi Sau)',
    primary_muscle: 'Hamstrings',
    secondary_muscles: ['Lower Back', 'Glutes', 'Lats'],
    equipment: 'Barbell',
    instructions: 'Đứng sát thanh tạ đòn dưới sàn. Cúi người thẳng lưng nắm tạ, siết mông đẩy đùi kéo tạ đứng thẳng dậy sát chân.',
    default_reps_min: 5,
    default_reps_max: 8,
    xp_per_set: 15
  },
  {
    id: 'ex-10',
    name: 'Cable Row (Kéo Cáp Lưng Giữa)',
    primary_muscle: 'Back',
    secondary_muscles: ['Biceps', 'Rear Shoulders'],
    equipment: 'Cable',
    instructions: 'Ngồi vào máy kéo cáp, đặt chân lên điểm tựa. Kéo tay cầm cáp sát vào bụng dưới, khép bả vai lại và giữ cơ lưng siết chặt.',
    default_reps_min: 8,
    default_reps_max: 12,
    xp_per_set: 10
  },
  {
    id: 'ex-11',
    name: 'Leg Curl (Móc Đùi Sau)',
    primary_muscle: 'Hamstrings',
    secondary_muscles: [],
    equipment: 'Machine',
    instructions: 'Nằm sấp trên máy, đặt gót chân dưới đệm cuộn. Co gối kéo đệm cuộn sát vào mông rồi duỗi ra từ từ.',
    default_reps_min: 10,
    default_reps_max: 12,
    xp_per_set: 8
  },
  {
    id: 'ex-12',
    name: 'Incline Bench Press (Đẩy Ngực Dốc Lên)',
    primary_muscle: 'Chest',
    secondary_muscles: ['Front Shoulders', 'Triceps'],
    equipment: 'Barbell',
    instructions: 'Nằm trên ghế dốc lên 30-45 độ. Hạ tạ đòn chạm nhẹ ngực trên rồi đẩy tạ lên thẳng đứng.',
    default_reps_min: 8,
    default_reps_max: 12,
    xp_per_set: 10
  },
  {
    id: 'ex-13',
    name: 'Hanging Leg Raise (Đu Xà Nhấc Chân)',
    primary_muscle: 'Abs',
    secondary_muscles: ['Hip Flexors'],
    equipment: 'Bodyweight',
    instructions: 'Hai tay đu bám trên thanh xà đơn. Giữ thẳng chân nâng cao đùi hoặc gối lên góc vuông với thân rồi hạ xuống chậm rãi.',
    default_reps_min: 12,
    default_reps_max: 15,
    xp_per_set: 8
  }
];

export const MOCK_WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: 'plan-mon',
    name: 'Thứ Hai - Lộ Trình KÉO (Pull day)',
    description: 'Tập trung phát triển cơ lưng xô vững chãi và bắp tay trước khỏe khoắn. Thích hợp khởi đầu tuần mới.',
    day_of_week: 1,
    difficulty: 'Beginner',
    created_by: 'system'
  },
  {
    id: 'plan-wed',
    name: 'Thứ Tư - Lộ Trình ĐẨY (Push day)',
    description: 'Tập trung phát triển cơ ngực săn chắc, cơ vai khỏe mạnh và cơ tay sau bền bỉ.',
    day_of_week: 3,
    difficulty: 'Beginner',
    created_by: 'system'
  },
  {
    id: 'plan-fri',
    name: 'Thứ Sáu - Lộ Trình CHÂN & BỤNG (Legs & Abs)',
    description: 'Tập trung xây dựng nhóm cơ thân dưới mạnh mẽ và cơ bụng săn chắc thon gọn.',
    day_of_week: 5,
    difficulty: 'Beginner',
    created_by: 'system'
  }
];

export const MOCK_PLAN_EXERCISES: Record<string, WorkoutPlanExercise[]> = {
  'plan-mon': [
    {
      id: 'pe-mon-1',
      plan_id: 'plan-mon',
      exercise_id: 'ex-2', // Lat pulldown
      sequence_order: 1,
      default_sets: 3,
      default_reps_min: 8,
      default_reps_max: 12,
      default_weight_ratio: 0.40,
      exercises: MOCK_EXERCISES.find(e => e.id === 'ex-2')
    },
    {
      id: 'pe-mon-2',
      plan_id: 'plan-mon',
      exercise_id: 'ex-10', // Cable row
      sequence_order: 2,
      default_sets: 3,
      default_reps_min: 8,
      default_reps_max: 12,
      default_weight_ratio: 0.40,
      exercises: MOCK_EXERCISES.find(e => e.id === 'ex-10')
    },
    {
      id: 'pe-mon-3',
      plan_id: 'plan-mon',
      exercise_id: 'ex-4', // Bicep curl
      sequence_order: 3,
      default_sets: 3,
      default_reps_min: 10,
      default_reps_max: 12,
      default_weight_ratio: 0.15,
      exercises: MOCK_EXERCISES.find(e => e.id === 'ex-4')
    }
  ],
  'plan-wed': [
    {
      id: 'pe-wed-1',
      plan_id: 'plan-wed',
      exercise_id: 'ex-1', // Bench press
      sequence_order: 1,
      default_sets: 4,
      default_reps_min: 8,
      default_reps_max: 12,
      default_weight_ratio: 0.50,
      exercises: MOCK_EXERCISES.find(e => e.id === 'ex-1')
    },
    {
      id: 'pe-wed-2',
      plan_id: 'plan-wed',
      exercise_id: 'ex-6', // Shoulder press
      sequence_order: 2,
      default_sets: 3,
      default_reps_min: 8,
      default_reps_max: 12,
      default_weight_ratio: 0.25,
      exercises: MOCK_EXERCISES.find(e => e.id === 'ex-6')
    },
    {
      id: 'pe-wed-3',
      plan_id: 'plan-wed',
      exercise_id: 'ex-5', // Tricep pushdown
      sequence_order: 3,
      default_sets: 3,
      default_reps_min: 10,
      default_reps_max: 12,
      default_weight_ratio: 0.20,
      exercises: MOCK_EXERCISES.find(e => e.id === 'ex-5')
    },
    {
      id: 'pe-wed-4',
      plan_id: 'plan-wed',
      exercise_id: 'ex-8', // Lateral raise
      sequence_order: 4,
      default_sets: 3,
      default_reps_min: 12,
      default_reps_max: 15,
      default_weight_ratio: 0.08,
      exercises: MOCK_EXERCISES.find(e => e.id === 'ex-8')
    }
  ],
  'plan-fri': [
    {
      id: 'pe-fri-1',
      plan_id: 'plan-fri',
      exercise_id: 'ex-3', // Squat
      sequence_order: 1,
      default_sets: 4,
      default_reps_min: 8,
      default_reps_max: 12,
      default_weight_ratio: 0.60,
      exercises: MOCK_EXERCISES.find(e => e.id === 'ex-3')
    },
    {
      id: 'pe-fri-2',
      plan_id: 'plan-fri',
      exercise_id: 'ex-7', // Leg press
      sequence_order: 2,
      default_sets: 3,
      default_reps_min: 8,
      default_reps_max: 12,
      default_weight_ratio: 1.00,
      exercises: MOCK_EXERCISES.find(e => e.id === 'ex-7')
    },
    {
      id: 'pe-fri-3',
      plan_id: 'plan-fri',
      exercise_id: 'ex-11', // Leg curl
      sequence_order: 3,
      default_sets: 3,
      default_reps_min: 10,
      default_reps_max: 12,
      default_weight_ratio: 0.25,
      exercises: MOCK_EXERCISES.find(e => e.id === 'ex-11')
    },
    {
      id: 'pe-fri-4',
      plan_id: 'plan-fri',
      exercise_id: 'ex-13', // Hanging leg raise
      sequence_order: 4,
      default_sets: 3,
      default_reps_min: 12,
      default_reps_max: 15,
      default_weight_ratio: 0.00,
      exercises: MOCK_EXERCISES.find(e => e.id === 'ex-13')
    }
  ]
};

// ==========================================
// DATABASE / SUPABASE API CALLS
// ==========================================

/**
 * FETCH catalogue of all exercises
 */
export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }
  return data as Exercise[];
}

/**
 * FETCH Workouts for a user (Read)
 */
export async function getWorkouts(userId: string): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return data as Workout[];
}

/**
 * FETCH Workout Plans (system defaults user_id IS NULL + custom ones)
 */
export async function getWorkoutPlans(userId?: string): Promise<WorkoutPlan[]> {
  let query = supabase.from('workout_plans').select('*');
  
  if (userId) {
    query = query.or(`user_id.is.null,user_id.eq.${userId}`);
  } else {
    query = query.is('user_id', null);
  }
  
  const { data, error } = await query.order('day_of_week', { ascending: true });
  
  if (error) {
    throw error;
  }
  return data as WorkoutPlan[];
}

/**
 * FETCH Workout Plan Exercises (joined with Exercises catalogue details)
 */
export async function getWorkoutPlanExercises(planId: string): Promise<WorkoutPlanExercise[]> {
  const { data, error } = await supabase
    .from('workout_plan_exercises')
    .select(`
      id,
      plan_id,
      exercise_id,
      sequence_order,
      default_sets,
      default_reps_min,
      default_reps_max,
      default_weight_ratio,
      rest_duration_seconds,
      exercises:exercises (
        id,
        name,
        primary_muscle,
        secondary_muscles,
        equipment,
        instructions,
        image_url,
        default_reps_min,
        default_reps_max,
        xp_per_set
      )
    `)
    .eq('plan_id', planId)
    .order('sequence_order', { ascending: true });

  if (error) {
    throw error;
  }
  
  // Format to standard camelCase or structure
  return (data as any[]).map(item => ({
    id: item.id,
    plan_id: item.plan_id,
    exercise_id: item.exercise_id,
    sequence_order: item.sequence_order,
    default_sets: item.default_sets,
    default_reps_min: item.default_reps_min,
    default_reps_max: item.default_reps_max,
    default_weight_ratio: Number(item.default_weight_ratio || 0),
    rest_duration_seconds: item.rest_duration_seconds || 90,
    exercises: item.exercises ? {
      id: item.exercises.id,
      name: item.exercises.name,
      primary_muscle: item.exercises.primary_muscle,
      secondary_muscles: item.exercises.secondary_muscles || [],
      equipment: item.exercises.equipment,
      instructions: item.exercises.instructions,
      image_url: item.exercises.image_url,
      default_reps_min: item.exercises.default_reps_min,
      default_reps_max: item.exercises.default_reps_max,
      xp_per_set: item.exercises.xp_per_set || 10
    } : undefined
  })) as WorkoutPlanExercise[];
}

/**
 * ADD a new workout log (Create)
 */
export async function addWorkout(workout: Omit<Workout, 'id' | 'created_at'>): Promise<Workout> {
  const { data, error } = await supabase
    .from('workouts')
    .insert([workout])
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Workout;
}

/**
 * ADD set logs for a workout session
 */
export async function addSetLogs(logs: Omit<ExerciseSetLog, 'id' | 'created_at'>[]): Promise<ExerciseSetLog[]> {
  const { data, error } = await supabase
    .from('exercise_set_logs')
    .insert(logs)
    .select();

  if (error) {
    throw error;
  }
  return data as ExerciseSetLog[];
}

/**
 * DELETE a workout log (Delete)
 */
export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId);

  if (error) {
    throw error;
  }
}

/**
 * CREATE or UPDATE a workout plan for a user (Upsert)
 */
export async function saveWorkoutPlan(plan: Omit<WorkoutPlan, 'created_at'>): Promise<WorkoutPlan> {
  const { data, error } = await supabase
    .from('workout_plans')
    .upsert([plan])
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as WorkoutPlan;
}

/**
 * SAVE/REPLACE exercises in a workout plan
 */
export async function saveWorkoutPlanExercises(planId: string, exercises: Omit<WorkoutPlanExercise, 'id'>[]): Promise<void> {
  // First, delete existing exercises for the plan
  const { error: deleteError } = await supabase
    .from('workout_plan_exercises')
    .delete()
    .eq('plan_id', planId);

  if (deleteError) {
    throw deleteError;
  }

  if (exercises.length === 0) return;

  // Format ratio to be saved
  const formatted = exercises.map(ex => ({
    plan_id: ex.plan_id,
    exercise_id: ex.exercise_id,
    sequence_order: ex.sequence_order,
    default_sets: ex.default_sets,
    default_reps_min: ex.default_reps_min,
    default_reps_max: ex.default_reps_max,
    default_weight_ratio: ex.default_weight_ratio
  }));

  // Then insert the new ones
  const { error: insertError } = await supabase
    .from('workout_plan_exercises')
    .insert(formatted);

  if (insertError) {
    throw insertError;
  }
}


