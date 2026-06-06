import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Dumbbell, Plus, Trash2, Clock, Flame, Zap, X, ShieldAlert } from 'lucide-react-native';
import { useLanguageStore } from '@/src/localization/translations';
import { useThemeStore } from '@/src/theme/themeStore';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { getWorkouts, addWorkout, deleteWorkout, Workout } from '../services/workoutService';

const CURRENT_USER_ID_MOCK = '00000000-0000-0000-0000-000000000000';

export default function WorkoutScreen() {
  const { t } = useLanguageStore();
  const { theme } = useThemeStore();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<any>(null);
  const [showLogForm, setShowLogForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');

  // Loaded Mocks
  const getMockWorkouts = (): Workout[] => [
    {
      id: 'mock-1',
      user_id: CURRENT_USER_ID_MOCK,
      title: 'Physical Synthesis (Yoga)',
      duration_minutes: 45,
      calories_burned: 180,
      xp_gained: 450,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: 'mock-2',
      user_id: CURRENT_USER_ID_MOCK,
      title: 'Aura Recovery Run',
      duration_minutes: 30,
      calories_burned: 320,
      xp_gained: 300,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ];

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setWorkouts(getMockWorkouts());
      setIsOfflineMode(true);
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchWorkouts(session.user.id);
      } else {
        setWorkouts(getMockWorkouts());
        setIsOfflineMode(true);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        fetchWorkouts(newSession.user.id);
      } else {
        setWorkouts(getMockWorkouts());
        setIsOfflineMode(true);
        setIsLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchWorkouts = async (userId: string) => {
    setIsLoading(true);
    try {
      const data = await getWorkouts(userId);
      setWorkouts(data);
      setIsOfflineMode(false);
    } catch (error: any) {
      console.log('Error fetching workouts from Supabase:', error.message);
      setWorkouts(getMockWorkouts());
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogWorkout = async () => {
    if (!title.trim() || !duration.trim() || !calories.trim()) {
      Alert.alert(t('cancel'), t('requiredFields'));
      return;
    }

    const durationNum = parseInt(duration, 10);
    const caloriesNum = parseInt(calories, 10);
    
    if (isNaN(durationNum) || durationNum <= 0 || isNaN(caloriesNum) || caloriesNum <= 0) {
      Alert.alert('Lỗi', 'Thời gian và Calo tiêu thụ phải là số dương.');
      return;
    }

    // Auto-calculate XP (e.g. 10 XP per minute)
    const xpGained = durationNum * 10;
    const activeUserId = session?.user?.id || CURRENT_USER_ID_MOCK;

    const newLog = {
      user_id: activeUserId,
      title: title.trim(),
      duration_minutes: durationNum,
      calories_burned: caloriesNum,
      xp_gained: xpGained
    };

    setIsLoading(true);
    try {
      if (isOfflineMode || !session) {
        // Mock save locally
        const mockLog: Workout = {
          ...newLog,
          id: 'mock-' + Math.random().toString(36).substring(7),
          created_at: new Date().toISOString()
        };
        setWorkouts(prev => [mockLog, ...prev]);
        Alert.alert('Sandbox', t('saveLocalSuccess'));
      } else {
        const saved = await addWorkout(newLog);
        setWorkouts(prev => [saved, ...prev]);
        Alert.alert('Success', t('saveSuccess'));
      }
      
      // Reset form
      setTitle('');
      setDuration('');
      setCalories('');
      setShowLogForm(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkout = (workoutId: string) => {
    Alert.alert(
      'Xóa bài tập',
      'Bạn có chắc muốn xóa lịch sử buổi tập này không?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              if (isOfflineMode || !session) {
                setWorkouts(prev => prev.filter(w => w.id !== workoutId));
                Alert.alert('Sandbox', 'Đã xóa bài tập khỏi bộ nhớ local.');
              } else {
                await deleteWorkout(workoutId);
                setWorkouts(prev => prev.filter(w => w.id !== workoutId));
                Alert.alert('Success', 'Đã xóa lịch sử luyện tập thành công.');
              }
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

  // Aggregated Stats
  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((sum, w) => sum + w.duration_minutes, 0);
  const totalCalories = workouts.reduce((sum, w) => sum + w.calories_burned, 0);
  const totalXP = workouts.reduce((sum, w) => sum + w.xp_gained, 0);

  return (
    <ScrollView 
      className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg"
      contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack space="xl">
        {/* Banner Offline Notice */}
        {isOfflineMode && (
          <HStack space="xs" className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl items-center">
            <ShieldAlert size={16} className="text-amber-500" />
            <Text className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex-1">
              {t('sandboxMode')} - Sử dụng tài khoản Guest
            </Text>
          </HStack>
        )}

        {/* Workout Hub Intro */}
        <VStack space="xs">
          <Heading size="lg" className="text-brand-light-text dark:text-brand-dark-text font-bold">
            {t('workoutHubTitle')}
          </Heading>
          <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted">
            Theo dõi quá trình luyện tập và gia tăng năng lượng Aura của bạn.
          </Text>
        </VStack>

        {/* Summary Stats Grid */}
        <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-4 shadow-md">
          <HStack className="justify-around items-center">
            <VStack className="items-center flex-1">
              <Dumbbell size={16} className="text-brand-primary mb-1" />
              <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">
                Buổi tập
              </Text>
              <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-bold mt-0.5">
                {totalWorkouts}
              </Heading>
            </VStack>

            <VStack className="items-center flex-1 border-l border-r border-brand-light-border/40 dark:border-brand-dark-border/40">
              <Clock size={16} className="text-brand-primary mb-1" />
              <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">
                Số phút
              </Text>
              <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-bold mt-0.5">
                {totalMinutes}m
              </Heading>
            </VStack>

            <VStack className="items-center flex-1">
              <Flame size={16} className="text-amber-500 mb-1" />
              <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">
                Calo
              </Text>
              <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-bold mt-0.5">
                {totalCalories}
              </Heading>
            </VStack>
          </HStack>
        </Box>

        {/* Toggle Log Form Button */}
        {!showLogForm ? (
          <Button 
            size="md" 
            variant="solid" 
            action="primary" 
            className="bg-brand-primary rounded-xl py-2 flex-row items-center justify-center shadow-lg"
            onPress={() => setShowLogForm(true)}
          >
            <Plus size={16} className="text-brand-secondary dark:text-brand-neutral mr-2" />
            <ButtonText className="text-brand-secondary dark:text-brand-neutral font-extrabold uppercase text-xs tracking-wider">
              Ghi bài tập mới
            </ButtonText>
          </Button>
        ) : (
          <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-5 shadow-xl relative">
            <Pressable 
              onPress={() => setShowLogForm(false)} 
              className="absolute top-4 right-4 z-50 w-6 h-6 items-center justify-center"
            >
              <X size={16} className="text-brand-light-text-muted dark:text-brand-dark-text-muted" />
            </Pressable>

            <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-bold uppercase tracking-wider mb-4">
              Ghi nhận buổi tập
            </Heading>

            <VStack space="md">
              <VStack space="xs">
                <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                  Tên hoạt động / Bài tập
                </Text>
                <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                  <InputField
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Chạy bộ, Yoga, Tập Tạ..."
                    placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                    className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                  />
                </Input>
              </VStack>

              <HStack space="md">
                <VStack space="xs" className="flex-1">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                    Thời lượng (phút)
                  </Text>
                  <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                    <InputField
                      value={duration}
                      onChangeText={setDuration}
                      placeholder="30"
                      placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                      keyboardType="numeric"
                      className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                    />
                  </Input>
                </VStack>

                <VStack space="xs" className="flex-1">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                    Calo tiêu thụ
                  </Text>
                  <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                    <InputField
                      value={calories}
                      onChangeText={setCalories}
                      placeholder="250"
                      placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                      keyboardType="numeric"
                      className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                    />
                  </Input>
                </VStack>
              </HStack>

              <Button 
                size="md" 
                variant="solid" 
                action="primary" 
                className="bg-brand-primary rounded-xl py-2 mt-2"
                onPress={handleLogWorkout}
              >
                <ButtonText className="text-brand-secondary dark:text-brand-neutral font-extrabold uppercase text-xs tracking-wider">
                  Lưu bài tập (+{parseInt(duration || '0') * 10 || 0} XP)
                </ButtonText>
              </Button>
            </VStack>
          </Box>
        )}

        {/* Workouts History List */}
        <VStack space="md">
          <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text uppercase tracking-widest text-[9px] font-bold">
            Lịch sử luyện tập
          </Heading>

          {isLoading ? (
            <ActivityIndicator size="small" color="#8EB69B" className="py-8" />
          ) : workouts.length === 0 ? (
            <Box className="py-12 items-center justify-center border border-dashed border-brand-light-border dark:border-brand-dark-border rounded-2xl bg-brand-light-card/20 dark:bg-brand-dark-card/20">
              <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted font-light">
                Chưa có buổi tập nào được ghi nhận.
              </Text>
            </Box>
          ) : (
            workouts.map((workout) => (
              <Box 
                key={workout.id} 
                className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-xl p-4 shadow-sm"
              >
                <HStack className="justify-between items-center">
                  <VStack space="xs" className="flex-1 pr-4">
                    <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-bold">
                      {workout.title}
                    </Heading>
                    <HStack space="md" className="items-center">
                      <HStack space="xs" className="items-center">
                        <Clock size={10} className="text-brand-primary" />
                        <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono">{workout.duration_minutes}m</Text>
                      </HStack>
                      <HStack space="xs" className="items-center">
                        <Flame size={10} className="text-amber-500" />
                        <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono">{workout.calories_burned} kcal</Text>
                      </HStack>
                      <HStack space="xs" className="items-center">
                        <Zap size={10} className="text-brand-primary" />
                        <Text className="text-[10px] text-brand-primary font-mono font-bold">+{workout.xp_gained} XP</Text>
                      </HStack>
                    </HStack>
                    <Text className="text-[7.5px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono mt-1">
                      {new Date(workout.created_at).toLocaleString('vi-VN')}
                    </Text>
                  </VStack>

                  <Pressable 
                    onPress={() => handleDeleteWorkout(workout.id)} 
                    className="w-8 h-8 rounded-full border border-red-500/20 items-center justify-center bg-red-500/5 dark:bg-red-500/10 active:scale-95"
                  >
                    <Trash2 size={13} className="text-red-500" />
                  </Pressable>
                </HStack>
              </Box>
            ))
          )}
        </VStack>
      </VStack>
    </ScrollView>
  );
}
