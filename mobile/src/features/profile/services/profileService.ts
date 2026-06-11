import { supabase } from '@/src/lib/supabase';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  level: number;
  xp: number;
  streak_days: number;
  aura_shields: number;
  cardio_age: number | null;
  gender?: string | null;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  body_fat?: number | null;
  muscle_percent?: number | null;
  social_hours?: number | null;
  book_pages?: number | null;
  book_title?: string | null;
  train_days?: number | null;
  focus_exercises?: string[] | null;
  calories_target?: number | null;
  protein_target?: number | null;
  cardio_option?: boolean | null;
  cardio_sport?: string | null;
  cardio_calories?: number | null;
  wake_time?: string | null;
  sleep_quality?: string | null;
  water_target?: number | null;
  water_reminder?: boolean | null;
  wisdom?: number | null;
  confidence?: number | null;
  strength?: number | null;
  discipline?: number | null;
  focus?: number | null;
  metadata?: {
    weight?: number;
    height?: number;
    gender?: string;
    [key: string]: any;
  };
}

/**
 * FETCH Profile (Read)
 */
export async function getProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }
  return data as UserProfile;
}

/**
 * UPDATE Profile (Update)
 */
export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as UserProfile;
}

/**
 * CREATE Profile (Create)
 */
export async function createProfile(profile: UserProfile): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profile])
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as UserProfile;
}

/**
 * GET Leaderboard (Read top profiles ordered by XP)
 */
export async function getLeaderboard(limitNum: number = 10): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('xp', { ascending: false })
    .limit(limitNum);

  if (error) {
    throw error;
  }
  return data as UserProfile[];
}
