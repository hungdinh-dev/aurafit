import { supabase } from '@/src/lib/supabase';

export interface Workout {
  id: string;
  user_id: string;
  title: string;
  duration_minutes: number;
  calories_burned: number;
  xp_gained: number;
  created_at: string;
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
