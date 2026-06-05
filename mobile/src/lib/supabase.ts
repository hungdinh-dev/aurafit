import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// A project is configured if URL and Key exist, are not empty, and don't contain placeholders
export const isSupabaseConfigured = 
  !!rawUrl && 
  rawUrl.startsWith('http') && 
  !rawUrl.includes('your-project-id') && 
  !rawUrl.includes('placeholder-project') &&
  !!rawKey && 
  !rawKey.includes('dummykey');

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder-project.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykey';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
