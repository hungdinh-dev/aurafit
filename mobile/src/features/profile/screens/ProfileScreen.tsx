import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@/components/ui/slider';
import { 
  User, 
  Shield, 
  Zap, 
  Flame, 
  Edit2, 
  Check, 
  X, 
  Database, 
  KeyRound,
  ChevronRight,
  Brain,
  Award,
  Dumbbell,
  Compass,
  Moon,
  Droplet,
  Clock,
  BookOpen,
  Sparkles,
  Smartphone
} from 'lucide-react-native';
import { getProfile, updateProfile, UserProfile } from '../services/profileService';
import { useThemeStore } from '@/src/theme/themeStore';
import { useLanguageStore } from '@/src/localization/translations';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { useAuthStore } from '../store/authStore';

const CURRENT_USER_ID_MOCK = '00000000-0000-0000-0000-000000000000';

const DEFAULT_PROFILE_DATA: Omit<UserProfile, 'id' | 'username' | 'full_name' | 'avatar_url' | 'level' | 'xp' | 'streak_days' | 'aura_shields'> = {
  gender: 'Female',
  age: 24,
  weight: 65,
  height: 170,
  body_fat: 18,
  muscle_percent: 35,
  social_hours: 18,
  book_pages: 25,
  book_title: '',
  train_days: 3,
  focus_exercises: ['Lat Pulldown'],
  calories_target: 2200,
  protein_target: 120,
  cardio_option: true,
  cardio_sport: 'Đi bộ dốc',
  cardio_calories: 300,
  wake_time: '06:00 AM',
  sleep_quality: 'good',
  water_target: 2.0,
  water_reminder: true,
  cardio_age: 24,
  wisdom: 45,
  confidence: 58,
  strength: 60,
  discipline: 54,
  focus: 48
};

const MOCK_PROFILE: UserProfile = {
  id: CURRENT_USER_ID_MOCK,
  username: 'elenavance',
  full_name: 'Elena Vance',
  avatar_url: '',
  level: 1,
  xp: 125,
  streak_days: 7,
  aura_shields: 1,
  ...DEFAULT_PROFILE_DATA
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>(MOCK_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!isSupabaseConfigured);
  const { session, setSession, isSandboxBypassed, setSandboxBypassed: setIsSandboxBypassed } = useAuthStore();
  const { theme } = useThemeStore();
  const { t } = useLanguageStore();

  // Auth States
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --- Profile Edit Form States ---
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editGender, setEditGender] = useState<'Male' | 'Female'>('Female');
  const [editAge, setEditAge] = useState(24);
  const [editHeight, setEditHeight] = useState(170);
  const [editWeight, setEditWeight] = useState(65);
  const [editBodyFat, setEditBodyFat] = useState(18);
  const [editMusclePercent, setEditMusclePercent] = useState(35);
  const [editSocialHours, setEditSocialHours] = useState(18);
  const [editBookTitle, setEditBookTitle] = useState('');
  const [editBookPages, setEditBookPages] = useState(25);
  const [editTrainDays, setEditTrainDays] = useState(3);
  const [editFocusExercises, setEditFocusExercises] = useState<string[]>(['Lat Pulldown']);
  const [editCalories, setEditCalories] = useState(2200);
  const [editProtein, setEditProtein] = useState(120);
  const [editCardioOption, setEditCardioOption] = useState(true);
  const [editCardioSport, setEditCardioSport] = useState('Đi bộ dốc');
  const [editCardioCalories, setEditCardioCalories] = useState(300);
  const [editWakeTime, setEditWakeTime] = useState('06:00 AM');
  const [editSleepQuality, setEditSleepQuality] = useState<'good' | 'medium' | 'bad'>('good');
  const [editWaterTarget, setEditWaterTarget] = useState(2.0);
  const [editWaterReminder, setEditWaterReminder] = useState(true);

  // Dynamic Calculated RPG Stats for Edit mode
  const [previewWisdom, setPreviewWisdom] = useState(40);
  const [previewConfidence, setPreviewConfidence] = useState(40);
  const [previewStrength, setPreviewStrength] = useState(40);
  const [previewDiscipline, setPreviewDiscipline] = useState(40);
  const [previewFocus, setPreviewFocus] = useState(40);

  // Recalculate preview RPG stats whenever dependencies change in edit mode
  useEffect(() => {
    if (isEditing) {
      const calcWisdom = Math.min(99, 40 + Math.round(editBookPages / 5));
      const calcConfidence = Math.min(99, 45 + (editSleepQuality === 'good' ? 8 : editSleepQuality === 'medium' ? 4 : 0) + (editCardioOption ? 5 : 0));
      const calcStrength = Math.min(99, 40 + editTrainDays * 4 + Math.round(editProtein / 15));
      const calcDiscipline = Math.min(99, 42 + Math.max(0, Math.round((40 - editSocialHours) / 3)) + (editWaterTarget >= 2.0 ? 5 : 0));
      const calcFocus = Math.min(99, 40 + Math.max(0, Math.round((40 - editSocialHours) / 4)) + Math.round(editBookPages / 8));

      setPreviewWisdom(calcWisdom);
      setPreviewConfidence(calcConfidence);
      setPreviewStrength(calcStrength);
      setPreviewDiscipline(calcDiscipline);
      setPreviewFocus(calcFocus);
    }
  }, [editBookPages, editSleepQuality, editCardioOption, editTrainDays, editProtein, editSocialHours, editWaterTarget, isEditing]);

  useEffect(() => {
    // 1. If not configured, directly fall back to Offline Sandbox
    if (!isSupabaseConfigured) {
      setIsOfflineMode(true);
      setIsLoading(false);
      return;
    }

    // 2. Fetch session and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(MOCK_PROFILE);
        setIsLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      const data = await getProfile(userId);
      
      // Parse database columns with fallbacks for missing/null fields
      const formattedProfile: UserProfile = {
        id: data.id,
        username: data.username || session?.user?.email?.split('@')[0] || 'aura_user',
        full_name: data.full_name || 'Aura Warrior',
        avatar_url: data.avatar_url || '',
        level: data.level ?? 1,
        xp: data.xp ?? 0,
        streak_days: data.streak_days ?? 0,
        aura_shields: data.aura_shields ?? 0,
        gender: data.gender ?? 'Female',
        age: data.age ?? 24,
        weight: data.weight ? Number(data.weight) : 65,
        height: data.height ? Number(data.height) : 170,
        body_fat: data.body_fat ? Number(data.body_fat) : 18,
        muscle_percent: data.muscle_percent ? Number(data.muscle_percent) : 35,
        social_hours: data.social_hours ? Number(data.social_hours) : 18,
        book_pages: data.book_pages ?? 25,
        book_title: data.book_title ?? '',
        train_days: data.train_days ?? 3,
        focus_exercises: data.focus_exercises ?? ['Lat Pulldown'],
        calories_target: data.calories_target ?? 2200,
        protein_target: data.protein_target ?? 120,
        cardio_option: data.cardio_option ?? true,
        cardio_sport: data.cardio_sport ?? 'Đi bộ dốc',
        cardio_calories: data.cardio_calories ?? 300,
        wake_time: data.wake_time ?? '06:00 AM',
        sleep_quality: data.sleep_quality ?? 'good',
        water_target: data.water_target ? Number(data.water_target) : 2.0,
        water_reminder: data.water_reminder ?? true,
        cardio_age: data.cardio_age ?? data.age ?? 24,
        wisdom: data.wisdom ?? 40,
        confidence: data.confidence ?? 45,
        strength: data.strength ?? 40,
        discipline: data.discipline ?? 42,
        focus: data.focus ?? 40,
        metadata: data.metadata || {}
      };

      setProfile(formattedProfile);
      setIsOfflineMode(false);
    } catch (error: any) {
      console.log('Error fetching profile from Supabase:', error.message);
      
      // Handle missing profile row gracefully (e.g. trigger didn't run or RLS issues)
      if (error.code === 'PGRST116' || error.message?.includes('JSON')) {
        try {
          const newProfile: UserProfile = {
            id: userId,
            username: session?.user?.email?.split('@')[0] || 'aura_user',
            full_name: 'Aura Warrior',
            avatar_url: '',
            level: 1,
            xp: 0,
            streak_days: 0,
            aura_shields: 0,
            ...DEFAULT_PROFILE_DATA
          };
          
          // Try to insert missing row
          const { data: inserted, error: insertErr } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (insertErr) throw insertErr;
          setProfile(inserted as UserProfile);
        } catch (initErr: any) {
          console.log('Could not initialize profile row:', initErr.message);
          setProfile(MOCK_PROFILE);
          setIsOfflineMode(true);
        }
      } else {
        setProfile(MOCK_PROFILE);
        setIsOfflineMode(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('cancel'), t('requiredFields'));
      return;
    }

    setAuthLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setIsSandboxBypassed(true);
        setProfile({
          ...MOCK_PROFILE,
          username: email.split('@')[0],
          full_name: 'Offline Explorer',
        });
        Alert.alert('Sandbox', t('saveLocalSuccess'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('cancel'), t('requiredFields'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('cancel'), t('passwordMinLength'));
      return;
    }
    if (!signUpUsername.trim() || !signUpFullName.trim()) {
      Alert.alert(t('cancel'), t('requiredFields'));
      return;
    }

    setAuthLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setIsSandboxBypassed(true);
        setProfile({
          ...MOCK_PROFILE,
          username: signUpUsername.trim(),
          full_name: signUpFullName.trim(),
        });
        Alert.alert('Sandbox', t('saveLocalSuccess'));
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              username: signUpUsername.trim(),
              full_name: signUpFullName.trim(),
            }
          }
        });
        if (error) throw error;
        Alert.alert(t('signUp'), t('signUpSuccess'));
        setIsSignUpMode(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('signOut'),
      t('signOutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirm'), 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              if (isSupabaseConfigured) {
                await supabase.auth.signOut();
              }
              setSession(null);
              setIsSandboxBypassed(false);
              setProfile(MOCK_PROFILE);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditPress = () => {
    setEditFullName(profile.full_name);
    setEditUsername(profile.username);
    setEditGender((profile.gender as any) || 'Female');
    setEditAge(profile.age || 24);
    setEditHeight(profile.height || 170);
    setEditWeight(profile.weight || 65);
    setEditBodyFat(profile.body_fat || 18);
    setEditMusclePercent(profile.muscle_percent || 35);
    setEditSocialHours(profile.social_hours || 18);
    setEditBookTitle(profile.book_title || '');
    setEditBookPages(profile.book_pages || 25);
    setEditTrainDays(profile.train_days || 3);
    setEditFocusExercises(profile.focus_exercises || ['Lat Pulldown']);
    setEditCalories(profile.calories_target || 2200);
    setEditProtein(profile.protein_target || 120);
    setEditCardioOption(profile.cardio_option ?? true);
    setEditCardioSport(profile.cardio_sport || 'Đi bộ dốc');
    setEditCardioCalories(profile.cardio_calories || 300);
    setEditWakeTime(profile.wake_time || '06:00 AM');
    setEditSleepQuality((profile.sleep_quality as any) || 'good');
    setEditWaterTarget(profile.water_target || 2.0);
    setEditWaterReminder(profile.water_reminder ?? true);

    setIsEditing(true);
  };

  const handleSavePress = async () => {
    if (!editUsername.trim() || !editFullName.trim()) {
      Alert.alert('Error', t('requiredFields'));
      return;
    }

    const updates: Partial<UserProfile> = {
      username: editUsername.trim().toLowerCase(),
      full_name: editFullName.trim(),
      gender: editGender,
      age: editAge,
      height: editHeight,
      weight: editWeight,
      body_fat: editBodyFat,
      muscle_percent: editMusclePercent,
      social_hours: editSocialHours,
      book_title: editBookTitle.trim(),
      book_pages: editBookPages,
      train_days: editTrainDays,
      focus_exercises: editFocusExercises,
      calories_target: editCalories,
      protein_target: editProtein,
      cardio_option: editCardioOption,
      cardio_sport: editCardioSport,
      cardio_calories: editCardioCalories,
      wake_time: editWakeTime,
      sleep_quality: editSleepQuality,
      water_target: editWaterTarget,
      water_reminder: editWaterReminder,
      wisdom: previewWisdom,
      confidence: previewConfidence,
      strength: previewStrength,
      discipline: previewDiscipline,
      focus: previewFocus,
    };

    setIsLoading(true);
    try {
      const activeUserId = session?.user?.id || CURRENT_USER_ID_MOCK;
      const isActuallyOffline = isOfflineMode || !session;

      if (isActuallyOffline) {
        // Save local only
        setProfile(prev => ({
          ...prev,
          ...updates,
        }));
        Alert.alert('Local', t('saveLocalSuccess'));
      } else {
        // Save to real database
        const updated = await updateProfile(activeUserId, updates);
        setProfile({
          ...profile,
          ...updated
        });
        Alert.alert('Success', t('saveSuccess'));
      }
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFocusExercise = (ex: string) => {
    if (editFocusExercises.includes(ex)) {
      setEditFocusExercises(editFocusExercises.filter(item => item !== ex));
    } else {
      setEditFocusExercises([...editFocusExercises, ex]);
    }
  };

  // Determine if we should show the auth panel
  const isAuthRequired = isSupabaseConfigured ? !session : !isSandboxBypassed;

  if (isLoading) {
    return (
      <Box className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg items-center justify-center">
        <ActivityIndicator size="large" color="#8EB69B" />
      </Box>
    );
  }

  // --- 1. AUTH PANEL PORTAL SCREEN ---
  if (isAuthRequired) {
    return (
      <ScrollView 
        className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="xl" className="w-full justify-center flex-1">
          {/* Logo / Title Area */}
          <VStack space="xs" className="items-center mb-2">
            <Box className="w-14 h-14 rounded-full border border-brand-primary/40 items-center justify-center bg-brand-light-card dark:bg-brand-dark-card shadow-md mb-2">
              <KeyRound size={24} className="text-brand-primary" />
            </Box>
            <Heading size="xl" className="text-brand-light-text dark:text-brand-dark-text font-extrabold uppercase tracking-tight text-center">
              AuraFit Node
            </Heading>
          </VStack>

          {/* Offline/Config Notice */}
          {!isSupabaseConfigured && (
            <HStack space="xs" className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl items-start">
              <Database size={16} className="text-amber-500 mt-0.5" />
              <VStack className="flex-1">
                <Text className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                  {t('sandboxMode')}
                </Text>
              </VStack>
            </HStack>
          )}

          {/* Form Card */}
          <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-6 shadow-xl">
            <VStack space="lg">
              <HStack className="border-b border-brand-light-border/40 dark:border-brand-dark-border/40 pb-3 justify-around">
                <Pressable onPress={() => setIsSignUpMode(false)} className="pb-1">
                  <Text className={`text-xs font-bold uppercase tracking-widest ${!isSignUpMode ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                    {t('signIn')}
                  </Text>
                </Pressable>
                <Pressable onPress={() => setIsSignUpMode(true)} className="pb-1">
                  <Text className={`text-xs font-bold uppercase tracking-widest ${isSignUpMode ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                    {t('signUp')}
                  </Text>
                </Pressable>
              </HStack>

              {/* Dynamic Sign Up Fields */}
              {isSignUpMode && (
                <VStack space="md">
                  <VStack space="xs">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                      {t('fullName')}
                    </Text>
                    <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                      <InputField
                        value={signUpFullName}
                        onChangeText={signUpFullName => setSignUpFullName(signUpFullName)}
                        placeholder="Elena Vance"
                        placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                        className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                      />
                    </Input>
                  </VStack>

                  <VStack space="xs">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                      {t('username')}
                    </Text>
                    <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                      <InputField
                        value={signUpUsername}
                        onChangeText={signUpUsername => setSignUpUsername(signUpUsername)}
                        placeholder="elenavance"
                        placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                        className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                        autoCapitalize="none"
                      />
                    </Input>
                  </VStack>
                </VStack>
              )}

              {/* Core Credentials Fields */}
              <VStack space="xs">
                <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                  {t('email')}
                </Text>
                <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                  <InputField
                     value={email}
                     onChangeText={setEmail}
                     placeholder="name@domain.com"
                     placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                     className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                     keyboardType="email-address"
                     autoCapitalize="none"
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                  {t('password')}
                </Text>
                <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                  <InputField
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                    className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </Input>
              </VStack>

              {/* Action Button */}
              {authLoading ? (
                <ActivityIndicator size="small" color="#8EB69B" className="py-2" />
              ) : (
                <Button 
                  size="md" 
                  variant="solid" 
                  action="primary" 
                  className="bg-brand-primary rounded-xl py-2 mt-2"
                  onPress={isSignUpMode ? handleSignUp : handleSignIn}
                >
                  <ButtonText className="text-brand-secondary dark:text-brand-neutral font-extrabold uppercase text-xs tracking-wider">
                    {isSignUpMode ? t('signUp') : t('connect')}
                  </ButtonText>
                </Button>
              )}
            </VStack>
          </Box>

          {/* Sandbox Bypass Option */}
          {!isSupabaseConfigured && (
            <Button 
              variant="outline" 
              action="secondary" 
              className="border border-brand-primary/30 rounded-xl py-2 flex-row items-center justify-center bg-brand-light-card/40 dark:bg-brand-dark-card/40"
              onPress={() => setIsSandboxBypassed(true)}
            >
              <ButtonText className="text-brand-primary font-bold text-xs mr-1">
                {t('offlineBypass')}
              </ButtonText>
              <ChevronRight size={14} className="text-brand-primary" />
            </Button>
          )}
        </VStack>
      </ScrollView>
    );
  }

  // --- 2. MAIN PROFILE DASHBOARD (CRUD RENDERING) ---
  return (
    <ScrollView 
      className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg"
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack space="lg">
        {/* Connection Mode Banner */}
        <HStack space="sm" className={`p-3 rounded-xl items-center justify-between border ${
          isOfflineMode 
            ? 'bg-amber-500/10 border-amber-500/20' 
            : 'bg-brand-primary/10 border-brand-primary/20'
        }`}>
          <HStack space="xs" className="items-center flex-1">
            <Database size={13} className={isOfflineMode ? 'text-amber-500' : 'text-brand-primary'} />
            <Text className={`text-[9px] font-bold uppercase tracking-wider ${isOfflineMode ? 'text-amber-500' : 'text-brand-primary'}`}>
              {isOfflineMode ? t('sandboxMode') : t('connectedNode')}
            </Text>
          </HStack>
          <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold">
            {isOfflineMode ? 'Local Offline' : `Session: ${session?.user?.email}`}
          </Text>
        </HStack>

        {/* --- VIEW MODE OR EDIT MODE --- */}
        {!isEditing ? (
          // === PROFILE DISPLAY VIEW ===
          <VStack space="lg">
            {/* Gamification Header Profile Card */}
            <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-5 shadow-md relative overflow-hidden">
              <VStack space="md">
                <HStack className="justify-between items-start">
                  <HStack space="md" className="items-center">
                    <Box className="w-14 h-14 rounded-full border border-brand-primary/45 items-center justify-center bg-brand-light-bg dark:bg-brand-dark-bg shadow-sm">
                      <User size={26} className="text-brand-primary" />
                    </Box>
                    <VStack>
                      <Heading size="md" className="text-brand-light-text dark:text-brand-dark-text font-bold">
                        {profile.full_name}
                      </Heading>
                      <Text className="text-xs text-brand-primary font-mono">
                        @{profile.username}
                      </Text>
                      <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-semibold uppercase tracking-wider mt-0.5">
                        Hình thể đại diện: {profile.gender === 'Male' ? 'NAM (Male)' : 'NỮ (Female)'}
                      </Text>
                    </VStack>
                  </HStack>

                  <Button 
                    size="sm" 
                    variant="outline" 
                    action="secondary" 
                    className="rounded-full w-8 h-8 items-center justify-center p-0 border-brand-light-border dark:border-brand-dark-border bg-brand-light-card/85 dark:bg-brand-dark-card/85"
                    onPress={handleEditPress}
                  >
                    <Edit2 size={13} className="text-brand-primary" />
                  </Button>
                </HStack>

                {/* Level Up progress bar */}
                <VStack space="xs" className="pt-2 border-t border-brand-light-border/40 dark:border-brand-dark-border/40">
                  <HStack className="justify-between items-baseline">
                    <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                      Tiến trình Hào quang Aura
                    </Text>
                    <Text className="text-[10px] text-brand-primary font-mono font-bold">
                      {profile.xp} / 1000 XP (Lvl {profile.level})
                    </Text>
                  </HStack>
                  <View className="w-full h-2 bg-brand-light-border dark:bg-brand-dark-border/40 rounded-full overflow-hidden">
                    <View 
                      style={{ width: `${Math.min(100, ((profile.xp % 1000) / 1000) * 100)}%` }} 
                      className="h-full bg-brand-primary rounded-full" 
                    />
                  </View>
                </VStack>

                {/* Gamified indicators row */}
                <HStack className="justify-between pt-3 border-t border-brand-light-border/40 dark:border-brand-dark-border/40">
                  <VStack className="items-center flex-1">
                    <Zap size={15} className="text-brand-primary mb-0.5" />
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest font-bold">
                      Cấp Độ (Level)
                    </Text>
                    <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-extrabold mt-0.5">
                      Lvl {profile.level}
                    </Heading>
                  </VStack>

                  <VStack className="items-center flex-1 border-l border-r border-brand-light-border/40 dark:border-brand-dark-border/40">
                    <Flame size={15} className="text-amber-500 mb-0.5" />
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest font-bold">
                      Chuỗi Ngày (Streak)
                    </Text>
                    <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-extrabold mt-0.5">
                      {profile.streak_days} ngày
                    </Heading>
                  </VStack>

                  <VStack className="items-center flex-1">
                    <Shield size={15} className="text-brand-primary mb-0.5" />
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest font-bold">
                      Khiên Aura
                    </Text>
                    <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-extrabold mt-0.5">
                      {profile.aura_shields} bảo vệ
                    </Heading>
                  </VStack>
                </HStack>
              </VStack>
            </Box>

            {/* RPG Stats / Character Attributes Panel */}
            <Box className="bg-black/90 border border-brand-primary/20 rounded-2xl p-5 shadow-lg">
              <VStack space="md">
                <HStack space="xs" className="items-center mb-1">
                  <Sparkles size={16} className="text-brand-primary" />
                  <Heading size="xs" className="text-brand-primary uppercase tracking-widest text-[10px] font-extrabold">
                    Hào quang RPG Attributes (Chỉ số hiện tại)
                  </Heading>
                </HStack>

                <VStack space="sm">
                  {/* Wisdom */}
                  <VStack>
                    <HStack className="justify-between items-baseline">
                      <HStack space="xs" className="items-center">
                        <Brain size={13} className="text-brand-primary" />
                        <Text className="text-xs text-brand-dark-text font-bold">Wisdom (Trí tuệ)</Text>
                      </HStack>
                      <Text className="text-sm font-black text-brand-primary">{profile.wisdom ?? 40}</Text>
                    </HStack>
                    <View className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                      <View style={{ width: `${profile.wisdom ?? 40}%` }} className="h-full bg-brand-primary rounded-full" />
                    </View>
                  </VStack>

                  {/* Confidence */}
                  <VStack>
                    <HStack className="justify-between items-baseline">
                      <HStack space="xs" className="items-center">
                        <Award size={13} className="text-brand-primary" />
                        <Text className="text-xs text-brand-dark-text font-bold">Confidence (Tự tin)</Text>
                      </HStack>
                      <Text className="text-sm font-black text-brand-primary">{profile.confidence ?? 45}</Text>
                    </HStack>
                    <View className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                      <View style={{ width: `${profile.confidence ?? 45}%` }} className="h-full bg-brand-primary rounded-full" />
                    </View>
                  </VStack>

                  {/* Strength */}
                  <VStack>
                    <HStack className="justify-between items-baseline">
                      <HStack space="xs" className="items-center">
                        <Dumbbell size={13} className="text-brand-primary" />
                        <Text className="text-xs text-brand-dark-text font-bold">Strength (Sức mạnh)</Text>
                      </HStack>
                      <Text className="text-sm font-black text-brand-primary">{profile.strength ?? 40}</Text>
                    </HStack>
                    <View className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                      <View style={{ width: `${profile.strength ?? 40}%` }} className="h-full bg-brand-primary rounded-full" />
                    </View>
                  </VStack>

                  {/* Discipline */}
                  <VStack>
                    <HStack className="justify-between items-baseline">
                      <HStack space="xs" className="items-center">
                        <Flame size={13} className="text-brand-primary" />
                        <Text className="text-xs text-brand-dark-text font-bold">Discipline (Kỷ luật)</Text>
                      </HStack>
                      <Text className="text-sm font-black text-brand-primary">{profile.discipline ?? 42}</Text>
                    </HStack>
                    <View className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                      <View style={{ width: `${profile.discipline ?? 42}%` }} className="h-full bg-brand-primary rounded-full" />
                    </View>
                  </VStack>

                  {/* Focus */}
                  <VStack>
                    <HStack className="justify-between items-baseline">
                      <HStack space="xs" className="items-center">
                        <Compass size={13} className="text-brand-primary" />
                        <Text className="text-xs text-brand-dark-text font-bold">Focus (Tập trung)</Text>
                      </HStack>
                      <Text className="text-sm font-black text-brand-primary">{profile.focus ?? 40}</Text>
                    </HStack>
                    <View className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                      <View style={{ width: `${profile.focus ?? 40}%` }} className="h-full bg-brand-primary rounded-full" />
                    </View>
                  </VStack>
                </VStack>
              </VStack>
            </Box>

            {/* Core Biometrics */}
            <Box className="bg-brand-light-card/80 dark:bg-brand-dark-card/50 border border-brand-light-border dark:border-brand-dark-border/40 rounded-2xl p-5 shadow-sm">
              <VStack space="md">
                <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text uppercase tracking-widest text-[9px] font-extrabold mb-1">
                  Chỉ số sinh trắc học (Biometrics)
                </Heading>

                <HStack className="justify-between flex-wrap gap-y-4">
                  <VStack className="w-[30%]">
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-wider font-bold">Chiều cao</Text>
                    <Text className="text-sm text-brand-light-text dark:text-brand-dark-text font-extrabold mt-0.5">{profile.height} cm</Text>
                  </VStack>

                  <VStack className="w-[30%] border-l border-brand-light-border/40 dark:border-brand-dark-border/30 pl-3">
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-wider font-bold">Cân nặng</Text>
                    <Text className="text-sm text-brand-light-text dark:text-brand-dark-text font-extrabold mt-0.5">{profile.weight} kg</Text>
                  </VStack>

                  <VStack className="w-[30%] border-l border-brand-light-border/40 dark:border-brand-dark-border/30 pl-3">
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-wider font-bold">Tuổi sinh học</Text>
                    <Text className="text-sm text-brand-light-text dark:text-brand-dark-text font-extrabold mt-0.5">{profile.age} tuổi</Text>
                  </VStack>

                  <VStack className="w-[30%] border-t border-brand-light-border/40 dark:border-brand-dark-border/30 pt-3">
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-wider font-bold">Tỷ lệ mỡ (Fat)</Text>
                    <Text className="text-sm text-brand-light-text dark:text-brand-dark-text font-extrabold mt-0.5">{profile.body_fat}%</Text>
                  </VStack>

                  <VStack className="w-[30%] border-l border-t border-brand-light-border/40 dark:border-brand-dark-border/30 pl-3 pt-3">
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-wider font-bold">Tỷ lệ cơ</Text>
                    <Text className="text-sm text-brand-light-text dark:text-brand-dark-text font-extrabold mt-0.5">{profile.muscle_percent}%</Text>
                  </VStack>

                  <VStack className="w-[30%] border-l border-t border-brand-light-border/40 dark:border-brand-dark-border/30 pl-3 pt-3">
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-wider font-bold">BMR Calo cơ bản</Text>
                    <Text className="text-sm text-brand-light-text dark:text-brand-dark-text font-extrabold mt-0.5">{Math.round(10 * (profile.weight || 60) + 6.25 * (profile.height || 170) - 5 * (profile.age || 24) + (profile.gender === 'Male' ? 5 : -161))} kcal</Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>

            {/* Daily Habits & Target Goals card list */}
            <Box className="bg-brand-light-card/80 dark:bg-brand-dark-card/50 border border-brand-light-border dark:border-brand-dark-border/40 rounded-2xl p-5 shadow-sm">
              <VStack space="md">
                <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text uppercase tracking-widest text-[9px] font-extrabold mb-1">
                  Chế độ & Mục tiêu phong cách sống
                </Heading>

                <VStack space="md" className="divide-y divide-brand-light-border/40 dark:divide-brand-dark-border/20">
                  {/* MXH */}
                  <HStack className="justify-between items-center pt-2">
                    <HStack space="xs" className="items-center">
                      <Smartphone size={14} className="text-brand-primary" />
                      <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-bold">Mạng xã hội xao nhãng</Text>
                    </HStack>
                    <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-extrabold">{profile.social_hours} giờ / tuần</Text>
                  </HStack>

                  {/* Water */}
                  <HStack className="justify-between items-center pt-2">
                    <HStack space="xs" className="items-center">
                      <Droplet size={14} className="text-brand-primary" />
                      <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-bold">Mục tiêu uống nước</Text>
                    </HStack>
                    <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-extrabold">{profile.water_target} Lít {profile.water_reminder ? '(Bật báo)' : ''}</Text>
                  </HStack>

                  {/* Nutrition */}
                  <HStack className="justify-between items-center pt-2">
                    <HStack space="xs" className="items-center">
                      <Flame size={14} className="text-brand-primary" />
                      <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-bold">Dinh dưỡng hàng ngày</Text>
                    </HStack>
                    <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-extrabold">{profile.calories_target} kcal | {profile.protein_target}g đạm</Text>
                  </HStack>

                  {/* Weight Training */}
                  <HStack className="justify-between items-start pt-2">
                    <HStack space="xs" className="items-center">
                      <Dumbbell size={14} className="text-brand-primary" />
                      <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-bold">Tần suất tập tạ</Text>
                    </HStack>
                    <VStack className="items-end">
                      <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-extrabold">{profile.train_days} buổi / tuần</Text>
                      {profile.focus_exercises && profile.focus_exercises.length > 0 && (
                        <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted mt-0.5 text-right font-medium">
                          Ưu tiên: {profile.focus_exercises.join(', ')}
                        </Text>
                      )}
                    </VStack>
                  </HStack>

                  {/* Reading */}
                  <HStack className="justify-between items-start pt-2">
                    <HStack space="xs" className="items-center">
                      <BookOpen size={14} className="text-brand-primary" />
                      <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-bold">Đọc sách phát triển</Text>
                    </HStack>
                    <VStack className="items-end">
                      <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-extrabold">{profile.book_pages} trang / tuần</Text>
                      {profile.book_title ? (
                        <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted mt-0.5 text-right italic font-medium">
                          «{profile.book_title}»
                        </Text>
                      ) : null}
                    </VStack>
                  </HStack>

                  {/* Cardio */}
                  <HStack className="justify-between items-center pt-2">
                    <HStack space="xs" className="items-center">
                      <Award size={14} className="text-brand-primary" />
                      <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-bold">Vận động ngoài lề / Cardio</Text>
                    </HStack>
                    <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-extrabold">
                      {profile.cardio_option ? `${profile.cardio_sport} (-${profile.cardio_calories} kcal)` : 'Không hoạt động'}
                    </Text>
                  </HStack>

                  {/* Sleep */}
                  <HStack className="justify-between items-center pt-2">
                    <HStack space="xs" className="items-center">
                      <Clock size={14} className="text-brand-primary" />
                      <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-bold">Giấc ngủ & Thức giấc</Text>
                    </HStack>
                    <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-extrabold">
                      Dậy lúc {profile.wake_time} ({profile.sleep_quality === 'good' ? 'Sâu giấc' : profile.sleep_quality === 'medium' ? 'Tạm ổn' : 'Mất ngủ'})
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </Box>

            {/* Action Buttons: Sign Out */}
            <Button 
              variant="outline" 
              action="secondary" 
              className="border border-red-500/30 rounded-xl py-2 flex-row items-center justify-center bg-red-500/5 dark:bg-red-500/10"
              onPress={handleSignOut}
            >
              <ButtonText className="text-red-500 font-bold text-xs uppercase tracking-wider">
                Đăng Xuất Tài Khoản (Log Out)
              </ButtonText>
            </Button>
          </VStack>
        ) : (
          // === PROFILE EDIT MODE FORM ===
          <VStack space="lg">
            {/* Edit Header card */}
            <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-5 shadow-md">
              <VStack space="lg">
                <HStack className="justify-between items-center pb-2 border-b border-brand-light-border/40 dark:border-brand-dark-border/40">
                  <Heading size="sm" className="text-brand-light-text dark:text-brand-dark-text font-black uppercase tracking-wider">
                    Chỉnh sửa hồ sơ Aura
                  </Heading>
                  <HStack space="xs">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      action="secondary" 
                      className="rounded-full w-8 h-8 items-center justify-center p-0 border-red-500/50 bg-red-500/5"
                      onPress={() => setIsEditing(false)}
                    >
                      <X size={13} className="text-red-500" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      action="primary" 
                      className="rounded-full w-8 h-8 items-center justify-center p-0 border-brand-primary bg-brand-primary/10"
                      onPress={handleSavePress}
                    >
                      <Check size={13} className="text-brand-primary" />
                    </Button>
                  </HStack>
                </HStack>

                {/* RPG Attributes Live Preview Card inside Edit */}
                <Box className="bg-black/90 rounded-xl p-4 border border-brand-primary/30">
                  <VStack space="xs">
                    <Text className="text-[9px] text-brand-primary font-bold uppercase tracking-widest mb-1">
                      Xem trước chỉ số (Recalculating...)
                    </Text>
                    <HStack className="justify-between flex-wrap gap-y-2">
                      <HStack className="w-[48%] justify-between items-center bg-neutral-900 px-2 py-1 rounded">
                        <Text className="text-[10px] text-neutral-400 font-bold">WISDOM:</Text>
                        <Text className="text-xs text-brand-primary font-black">{previewWisdom}</Text>
                      </HStack>
                      <HStack className="w-[48%] justify-between items-center bg-neutral-900 px-2 py-1 rounded">
                        <Text className="text-[10px] text-neutral-400 font-bold">CONFIDENCE:</Text>
                        <Text className="text-xs text-brand-primary font-black">{previewConfidence}</Text>
                      </HStack>
                      <HStack className="w-[48%] justify-between items-center bg-neutral-900 px-2 py-1 rounded">
                        <Text className="text-[10px] text-neutral-400 font-bold">STRENGTH:</Text>
                        <Text className="text-xs text-brand-primary font-black">{previewStrength}</Text>
                      </HStack>
                      <HStack className="w-[48%] justify-between items-center bg-neutral-900 px-2 py-1 rounded">
                        <Text className="text-[10px] text-neutral-400 font-bold">DISCIPLINE:</Text>
                        <Text className="text-xs text-brand-primary font-black">{previewDiscipline}</Text>
                      </HStack>
                      <HStack className="w-[48%] justify-between items-center bg-neutral-900 px-2 py-1 rounded">
                        <Text className="text-[10px] text-neutral-400 font-bold">FOCUS:</Text>
                        <Text className="text-xs text-brand-primary font-black">{previewFocus}</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </Box>

                {/* Name & Username Inputs */}
                <VStack space="md" className="pt-2">
                  <VStack space="xs">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                      Họ và Tên
                    </Text>
                    <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                      <InputField
                        value={editFullName}
                        onChangeText={setEditFullName}
                        className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                      />
                    </Input>
                  </VStack>

                  <VStack space="xs">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                      Tên Tài Khoản (Username)
                    </Text>
                    <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                      <InputField
                        value={editUsername}
                        onChangeText={setEditUsername}
                        className="text-brand-light-text dark:text-brand-dark-text text-sm h-8 font-mono"
                        autoCapitalize="none"
                      />
                    </Input>
                  </VStack>
                </VStack>
              </VStack>
            </Box>

            {/* Biometrics Form Group */}
            <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-5 shadow-md space-y-4">
              <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text uppercase tracking-widest text-[9px] font-extrabold border-b border-brand-light-border/40 dark:border-brand-dark-border/40 pb-2 mb-2">
                Thông số sinh trắc học
              </Heading>

              {/* Gender Selector */}
              <VStack space="xs" className="mb-2">
                <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Hình thể đại diện</Text>
                <HStack space="md">
                  <Pressable 
                    onPress={() => setEditGender('Male')}
                    className={`flex-1 py-2 rounded-xl border items-center ${editGender === 'Male' ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-light-border dark:border-brand-dark-border bg-transparent'}`}
                  >
                    <Text className={`text-[10px] font-extrabold ${editGender === 'Male' ? 'text-brand-primary' : 'text-brand-light-text dark:text-brand-dark-text'}`}>MALE (NAM)</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => setEditGender('Female')}
                    className={`flex-1 py-2 rounded-xl border items-center ${editGender === 'Female' ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-light-border dark:border-brand-dark-border bg-transparent'}`}
                  >
                    <Text className={`text-[10px] font-extrabold ${editGender === 'Female' ? 'text-brand-primary' : 'text-brand-light-text dark:text-brand-dark-text'}`}>FEMALE (NỮ)</Text>
                  </Pressable>
                </HStack>
              </VStack>

              {/* Age Slider with - / + buttons */}
              <VStack space="xs" className="mb-2">
                <HStack className="justify-between">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Tuổi</Text>
                  <Text className="text-xs text-brand-primary font-bold">{editAge} tuổi</Text>
                </HStack>
                <HStack space="md" className="items-center">
                  <Pressable 
                    onPress={() => setEditAge(prev => Math.max(12, prev - 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">-</Text>
                  </Pressable>
                  <Slider
                    value={editAge}
                    minValue={12}
                    maxValue={80}
                    onChange={(val) => setEditAge(Math.round(val))}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                      <SliderFilledTrack className="bg-brand-primary" />
                    </SliderTrack>
                    <SliderThumb className="bg-brand-primary w-4 h-4" />
                  </Slider>
                  <Pressable 
                    onPress={() => setEditAge(prev => Math.min(80, prev + 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">+</Text>
                  </Pressable>
                </HStack>
              </VStack>

              {/* Height Slider */}
              <VStack space="xs" className="mb-2">
                <HStack className="justify-between">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Chiều cao</Text>
                  <Text className="text-xs text-brand-primary font-bold">{editHeight} cm</Text>
                </HStack>
                <HStack space="md" className="items-center">
                  <Pressable 
                    onPress={() => setEditHeight(prev => Math.max(120, prev - 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">-</Text>
                  </Pressable>
                  <Slider
                    value={editHeight}
                    minValue={120}
                    maxValue={220}
                    onChange={(val) => setEditHeight(Math.round(val))}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                      <SliderFilledTrack className="bg-brand-primary" />
                    </SliderTrack>
                    <SliderThumb className="bg-brand-primary w-4 h-4" />
                  </Slider>
                  <Pressable 
                    onPress={() => setEditHeight(prev => Math.min(220, prev + 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">+</Text>
                  </Pressable>
                </HStack>
              </VStack>

              {/* Weight Slider */}
              <VStack space="xs" className="mb-2">
                <HStack className="justify-between">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Cân nặng</Text>
                  <Text className="text-xs text-brand-primary font-bold">{editWeight} kg</Text>
                </HStack>
                <HStack space="md" className="items-center">
                  <Pressable 
                    onPress={() => setEditWeight(prev => Math.max(35, prev - 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">-</Text>
                  </Pressable>
                  <Slider
                    value={editWeight}
                    minValue={35}
                    maxValue={150}
                    onChange={(val) => setEditWeight(Math.round(val))}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                      <SliderFilledTrack className="bg-brand-primary" />
                    </SliderTrack>
                    <SliderThumb className="bg-brand-primary w-4 h-4" />
                  </Slider>
                  <Pressable 
                    onPress={() => setEditWeight(prev => Math.min(150, prev + 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">+</Text>
                  </Pressable>
                </HStack>
              </VStack>

              {/* Bodyfat Slider */}
              <VStack space="xs" className="mb-2">
                <HStack className="justify-between">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Tỷ lệ mỡ (Bodyfat)</Text>
                  <Text className="text-xs text-brand-primary font-bold">{editBodyFat}%</Text>
                </HStack>
                <HStack space="md" className="items-center">
                  <Pressable 
                    onPress={() => setEditBodyFat(prev => Math.max(5, prev - 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">-</Text>
                  </Pressable>
                  <Slider
                    value={editBodyFat}
                    minValue={5}
                    maxValue={45}
                    onChange={(val) => setEditBodyFat(Math.round(val))}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                      <SliderFilledTrack className="bg-brand-primary" />
                    </SliderTrack>
                    <SliderThumb className="bg-brand-primary w-4 h-4" />
                  </Slider>
                  <Pressable 
                    onPress={() => setEditBodyFat(prev => Math.min(45, prev + 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">+</Text>
                  </Pressable>
                </HStack>
              </VStack>

              {/* Muscle Percent Slider */}
              <VStack space="xs" className="mb-2">
                <HStack className="justify-between">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Tỷ lệ cơ (Muscle)</Text>
                  <Text className="text-xs text-brand-primary font-bold">{editMusclePercent}%</Text>
                </HStack>
                <HStack space="md" className="items-center">
                  <Pressable 
                    onPress={() => setEditMusclePercent(prev => Math.max(15, prev - 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">-</Text>
                  </Pressable>
                  <Slider
                    value={editMusclePercent}
                    minValue={15}
                    maxValue={60}
                    onChange={(val) => setEditMusclePercent(Math.round(val))}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                      <SliderFilledTrack className="bg-brand-primary" />
                    </SliderTrack>
                    <SliderThumb className="bg-brand-primary w-4 h-4" />
                  </Slider>
                  <Pressable 
                    onPress={() => setEditMusclePercent(prev => Math.min(60, prev + 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">+</Text>
                  </Pressable>
                </HStack>
              </VStack>
            </Box>

            {/* Habits & Target Goals Form Group */}
            <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-5 shadow-md space-y-5">
              <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text uppercase tracking-widest text-[9px] font-extrabold border-b border-brand-light-border/40 dark:border-brand-dark-border/40 pb-2 mb-2">
                Chế độ & Mục tiêu thói quen
              </Heading>

              {/* MXH Slider */}
              <VStack space="xs">
                <HStack className="justify-between">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Mạng xã hội xao nhãng</Text>
                  <Text className="text-xs text-brand-primary font-bold">{editSocialHours} giờ / tuần</Text>
                </HStack>
                <HStack space="md" className="items-center">
                  <Pressable 
                    onPress={() => setEditSocialHours(prev => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">-</Text>
                  </Pressable>
                  <Slider
                    value={editSocialHours}
                    minValue={0}
                    maxValue={80}
                    onChange={(val) => setEditSocialHours(Math.round(val))}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                      <SliderFilledTrack className="bg-brand-primary" />
                    </SliderTrack>
                    <SliderThumb className="bg-brand-primary w-4 h-4" />
                  </Slider>
                  <Pressable 
                    onPress={() => setEditSocialHours(prev => Math.min(80, prev + 1))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">+</Text>
                  </Pressable>
                </HStack>
              </VStack>

              {/* Water Target */}
              <VStack space="xs">
                <HStack className="justify-between">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Mục tiêu uống nước</Text>
                  <Text className="text-xs text-brand-primary font-bold">{editWaterTarget} Lít</Text>
                </HStack>
                <HStack space="md" className="items-center">
                  <Pressable 
                    onPress={() => setEditWaterTarget(prev => Math.max(1.0, Math.round((prev - 0.1) * 10) / 10))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">-</Text>
                  </Pressable>
                  <Slider
                    value={editWaterTarget}
                    minValue={1.0}
                    maxValue={5.0}
                    step={0.1}
                    onChange={(val) => setEditWaterTarget(Math.round(val * 10) / 10)}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                      <SliderFilledTrack className="bg-brand-primary" />
                    </SliderTrack>
                    <SliderThumb className="bg-brand-primary w-4 h-4" />
                  </Slider>
                  <Pressable 
                    onPress={() => setEditWaterTarget(prev => Math.min(5.0, Math.round((prev + 0.1) * 10) / 10))}
                    className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                  >
                    <Text className="text-brand-primary font-bold">+</Text>
                  </Pressable>
                </HStack>

                <HStack className="justify-between items-center pt-2">
                  <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text">Nhắc uống nước mỗi 15p</Text>
                  <Pressable 
                    onPress={() => setEditWaterReminder(!editWaterReminder)}
                    className={`px-3 py-1.5 rounded-xl border ${editWaterReminder ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-light-border dark:border-brand-dark-border bg-transparent'}`}
                  >
                    <Text className={`text-[10px] font-extrabold ${editWaterReminder ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                      {editWaterReminder ? 'BẬT' : 'TẮT'}
                    </Text>
                  </Pressable>
                </HStack>
              </VStack>

              {/* Nutrition Targets */}
              <VStack space="md" className="pt-2 border-t border-brand-light-border/40 dark:border-brand-dark-border/20">
                <Text className="text-[10px] text-brand-primary font-extrabold uppercase tracking-wider">Chế độ Dinh Dưỡng</Text>
                
                {/* Calories target */}
                <VStack space="xs">
                  <HStack className="justify-between">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Tổng Calo mục tiêu</Text>
                    <Text className="text-xs text-brand-primary font-bold">{editCalories} kcal</Text>
                  </HStack>
                  <HStack space="md" className="items-center">
                    <Pressable 
                      onPress={() => setEditCalories(prev => Math.max(1200, prev - 50))}
                      className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                    >
                      <Text className="text-brand-primary font-bold">-</Text>
                    </Pressable>
                    <Slider
                      value={editCalories}
                      minValue={1200}
                      maxValue={4000}
                      step={50}
                      onChange={(val) => setEditCalories(Math.round(val))}
                      size="sm"
                      className="flex-1 h-8"
                    >
                      <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                        <SliderFilledTrack className="bg-brand-primary" />
                      </SliderTrack>
                      <SliderThumb className="bg-brand-primary w-4 h-4" />
                    </Slider>
                    <Pressable 
                      onPress={() => setEditCalories(prev => Math.min(4000, prev + 50))}
                      className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                    >
                      <Text className="text-brand-primary font-bold">+</Text>
                    </Pressable>
                  </HStack>
                </VStack>

                {/* Protein target */}
                <VStack space="xs">
                  <HStack className="justify-between">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Lượng đạm (Protein)</Text>
                    <Text className="text-xs text-brand-primary font-bold">{editProtein} g</Text>
                  </HStack>
                  <HStack space="md" className="items-center">
                    <Pressable 
                      onPress={() => setEditProtein(prev => Math.max(40, prev - 5))}
                      className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                    >
                      <Text className="text-brand-primary font-bold">-</Text>
                    </Pressable>
                    <Slider
                      value={editProtein}
                      minValue={40}
                      maxValue={250}
                      step={5}
                      onChange={(val) => setEditProtein(Math.round(val))}
                      size="sm"
                      className="flex-1 h-8"
                    >
                      <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                        <SliderFilledTrack className="bg-brand-primary" />
                      </SliderTrack>
                      <SliderThumb className="bg-brand-primary w-4 h-4" />
                    </Slider>
                    <Pressable 
                      onPress={() => setEditProtein(prev => Math.min(250, prev + 5))}
                      className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                    >
                      <Text className="text-brand-primary font-bold">+</Text>
                    </Pressable>
                  </HStack>
                </VStack>
              </VStack>

              {/* Weight Training target */}
              <VStack space="md" className="pt-2 border-t border-brand-light-border/40 dark:border-brand-dark-border/20">
                <Text className="text-[10px] text-brand-primary font-extrabold uppercase tracking-wider">Rèn Luyện Sức Mạnh (Lifts)</Text>
                
                {/* Train days slider */}
                <VStack space="xs">
                  <HStack className="justify-between">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Số ngày tập tạ / tuần</Text>
                    <Text className="text-xs text-brand-primary font-bold">{editTrainDays} ngày</Text>
                  </HStack>
                  <HStack space="md" className="items-center">
                    <Pressable 
                      onPress={() => setEditTrainDays(prev => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                    >
                      <Text className="text-brand-primary font-bold">-</Text>
                    </Pressable>
                    <Slider
                      value={editTrainDays}
                      minValue={0}
                      maxValue={7}
                      onChange={(val) => setEditTrainDays(Math.round(val))}
                      size="sm"
                      className="flex-1 h-8"
                    >
                      <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                        <SliderFilledTrack className="bg-brand-primary" />
                      </SliderTrack>
                      <SliderThumb className="bg-brand-primary w-4 h-4" />
                    </Slider>
                    <Pressable 
                      onPress={() => setEditTrainDays(prev => Math.min(7, prev + 1))}
                      className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                    >
                      <Text className="text-brand-primary font-bold">+</Text>
                    </Pressable>
                  </HStack>
                </VStack>

                {/* Priority exercise check tags */}
                <VStack space="xs">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Các bài tập tập trung</Text>
                  <HStack className="flex-wrap gap-2 pt-1">
                    {['Lat Pulldown', 'Bench Press', 'Squat', 'Deadlift', 'Dumbbell Curl'].map((ex) => {
                      const isSelected = editFocusExercises.includes(ex);
                      return (
                        <Pressable 
                          key={ex} 
                          onPress={() => toggleFocusExercise(ex)}
                          className={`px-3 py-1.5 rounded-full border ${isSelected ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-light-border dark:border-brand-dark-border/40 bg-transparent'}`}
                        >
                          <Text className={`text-[9px] font-bold ${isSelected ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                            {isSelected ? '✓ ' : ''}{ex}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </HStack>
                </VStack>
              </VStack>

              {/* Reading habits */}
              <VStack space="md" className="pt-2 border-t border-brand-light-border/40 dark:border-brand-dark-border/20">
                <Text className="text-[10px] text-brand-primary font-extrabold uppercase tracking-wider">Đọc Sách Phát Triển</Text>
                
                <VStack space="xs">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Tên cuốn sách gần đây</Text>
                  <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                    <InputField
                      value={editBookTitle}
                      onChangeText={setEditBookTitle}
                      placeholder="VD: Đắc Nhân Tâm..."
                      placeholderTextColor="#5C8276"
                      className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                    />
                  </Input>
                </VStack>

                <VStack space="xs">
                  <HStack className="justify-between">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Số trang dự kiến đọc / tuần</Text>
                    <Text className="text-xs text-brand-primary font-bold">{editBookPages} trang</Text>
                  </HStack>
                  <HStack space="md" className="items-center">
                    <Pressable 
                      onPress={() => setEditBookPages(prev => Math.max(0, prev - 5))}
                      className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                    >
                      <Text className="text-brand-primary font-bold">-</Text>
                    </Pressable>
                    <Slider
                      value={editBookPages}
                      minValue={0}
                      maxValue={300}
                      step={5}
                      onChange={(val) => setEditBookPages(Math.round(val))}
                      size="sm"
                      className="flex-1 h-8"
                    >
                      <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                        <SliderFilledTrack className="bg-brand-primary" />
                      </SliderTrack>
                      <SliderThumb className="bg-brand-primary w-4 h-4" />
                    </Slider>
                    <Pressable 
                      onPress={() => setEditBookPages(prev => Math.min(300, prev + 5))}
                      className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                    >
                      <Text className="text-brand-primary font-bold">+</Text>
                    </Pressable>
                  </HStack>
                </VStack>
              </VStack>

              {/* Cardio and movement */}
              <VStack space="md" className="pt-2 border-t border-brand-light-border/40 dark:border-brand-dark-border/20">
                <HStack className="justify-between items-center">
                  <Text className="text-[10px] text-brand-primary font-extrabold uppercase tracking-wider">Vận động ngoài lề & Cardio</Text>
                  <Pressable 
                    onPress={() => setEditCardioOption(!editCardioOption)}
                    className={`px-3 py-1.5 rounded-xl border ${editCardioOption ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-light-border dark:border-brand-dark-border bg-transparent'}`}
                  >
                    <Text className={`text-[10px] font-extrabold ${editCardioOption ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                      {editCardioOption ? 'CÓ cardio' : 'KHÔNG cardio'}
                    </Text>
                  </Pressable>
                </HStack>

                {editCardioOption && (
                  <VStack space="md" className="pt-2">
                    <VStack space="xs">
                      <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Chọn môn thể thao</Text>
                      <HStack className="flex-wrap gap-2">
                        {['Đi bộ dốc', 'Cầu lông', 'Bóng đá', 'Chạy bộ'].map((sport) => {
                          const isSelected = editCardioSport === sport;
                          return (
                            <Pressable 
                              key={sport} 
                              onPress={() => setEditCardioSport(sport)}
                              className={`px-3 py-1.5 rounded-full border ${isSelected ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-light-border dark:border-brand-dark-border/40 bg-transparent'}`}
                            >
                              <Text className={`text-[9px] font-bold ${isSelected ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                                {sport}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </HStack>
                    </VStack>

                    <VStack space="xs">
                      <HStack className="justify-between">
                        <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Calo tiêu thụ / buổi</Text>
                        <Text className="text-xs text-brand-primary font-bold">{editCardioCalories} kcal</Text>
                      </HStack>
                      <HStack space="md" className="items-center">
                        <Pressable 
                          onPress={() => setEditCardioCalories(prev => Math.max(100, prev - 50))}
                          className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                        >
                          <Text className="text-brand-primary font-bold">-</Text>
                        </Pressable>
                        <Slider
                          value={editCardioCalories}
                          minValue={100}
                          maxValue={1000}
                          step={50}
                          onChange={(val) => setEditCardioCalories(Math.round(val))}
                          size="sm"
                          className="flex-1 h-8"
                        >
                          <SliderTrack className="bg-brand-light-border dark:bg-neutral-800 h-1.5">
                            <SliderFilledTrack className="bg-brand-primary" />
                          </SliderTrack>
                          <SliderThumb className="bg-brand-primary w-4 h-4" />
                        </Slider>
                        <Pressable 
                          onPress={() => setEditCardioCalories(prev => Math.min(1000, prev + 50))}
                          className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border items-center justify-center bg-brand-light-card dark:bg-brand-dark-card"
                        >
                          <Text className="text-brand-primary font-bold">+</Text>
                        </Pressable>
                      </HStack>
                    </VStack>
                  </VStack>
                )}
              </VStack>

              {/* Sleep habits */}
              <VStack space="md" className="pt-2 border-t border-brand-light-border/40 dark:border-brand-dark-border/20">
                <Text className="text-[10px] text-brand-primary font-extrabold uppercase tracking-wider">Giấc Ngủ & Hồi Sức</Text>
                
                <VStack space="xs">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Giờ thức dậy</Text>
                  <HStack className="flex-wrap gap-2">
                    {['05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM'].map((time) => {
                      const isSelected = editWakeTime === time;
                      return (
                        <Pressable 
                          key={time} 
                          onPress={() => setEditWakeTime(time)}
                          className={`px-3 py-1.5 rounded-full border ${isSelected ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-light-border dark:border-brand-dark-border/40 bg-transparent'}`}
                        >
                          <Text className={`text-[9px] font-bold ${isSelected ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                            {time}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </HStack>
                </VStack>

                <VStack space="xs" className="pt-2">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">Đánh giá chất lượng ngủ</Text>
                  <HStack space="xs" className="justify-between">
                    {[
                      { key: 'good', label: 'Rất tốt / Sâu' },
                      { key: 'medium', label: 'Tạm ổn' },
                      { key: 'bad', label: 'Chập chờn' }
                    ].map((item) => {
                      const isSelected = editSleepQuality === item.key;
                      return (
                        <Pressable 
                          key={item.key} 
                          onPress={() => setEditSleepQuality(item.key as any)}
                          className={`flex-1 py-2 rounded-xl border items-center justify-center ${isSelected ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-light-border dark:border-brand-dark-border/40 bg-transparent'}`}
                        >
                          <Text className={`text-[9px] font-bold text-center ${isSelected ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </HStack>
                </VStack>
              </VStack>
            </Box>

            {/* Bottom Actions */}
            <HStack space="md" className="justify-between pt-2">
              <Button 
                variant="outline" 
                action="secondary" 
                className="border border-red-500/50 rounded-xl py-2.5 flex-1 bg-red-500/5 items-center justify-center"
                onPress={() => setIsEditing(false)}
              >
                <ButtonText className="text-red-500 font-bold text-xs uppercase tracking-wider">Hủy bỏ</ButtonText>
              </Button>

              <Button 
                variant="solid" 
                action="primary" 
                className="bg-brand-primary rounded-xl py-2.5 flex-1 items-center justify-center"
                onPress={handleSavePress}
              >
                <ButtonText className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">Lưu chỉ số</ButtonText>
              </Button>
            </HStack>
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
