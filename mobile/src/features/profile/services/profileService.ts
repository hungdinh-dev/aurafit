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
  metadata: {
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
