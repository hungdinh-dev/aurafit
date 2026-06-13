import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Box } from '@/components/ui/box';
import { useLanguageStore } from '@/src/localization/translations';
import { useThemeStore } from '@/src/theme/themeStore';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { 
  getWorkouts, 
  addWorkout, 
  deleteWorkout, 
  getExercises, 
  getWorkoutPlans, 
  getWorkoutPlanExercises, 
  addSetLogs,
  saveWorkoutPlan,
  saveWorkoutPlanExercises,
  Workout, 
  WorkoutPlan, 
  WorkoutPlanExercise, 
  Exercise, 
  ExerciseSetLog,
  MOCK_WORKOUT_PLANS,
  MOCK_PLAN_EXERCISES,
  MOCK_EXERCISES
} from '../services/workoutService';
import { getProfile, updateProfile } from '@/src/features/profile/services/profileService';

// Sub-components
import WorkoutOverview from '../components/WorkoutOverview';
import ActiveWorkoutSession from '../components/ActiveWorkoutSession';
import RestTimerOverlay from '../components/RestTimerOverlay';
import SwapExerciseModal from '../components/SwapExerciseModal';
import AddExerciseModal from '../components/AddExerciseModal';
import CustomizePlanModal from '../components/CustomizePlanModal';

const CURRENT_USER_ID_MOCK = '00000000-0000-0000-0000-000000000000';

// Helper to check and reset streak if there are unshielded missed days
const checkAndUpdateStreakAndShields = (
  currentProfile: any,
  allWorkouts: Workout[],
  allPlans: WorkoutPlan[]
) => {
  if (!currentProfile) return null;

  const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
  const vnDate = new Date(utc + 3600000 * 7);
  const currentDayOfWeek = vnDate.getDay() === 0 ? 7 : vnDate.getDay();

  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const startOfWeek = getStartOfWeek(vnDate);
  const startOfWeekStr = startOfWeek.toISOString();

  const metadata = currentProfile.metadata || {};
  let shieldedDays: number[] = metadata.shielded_days || [];
  let savedStartOfWeek = metadata.start_of_week;
  let currentStreak = currentProfile.streak_days || 0;
  let profileChanged = false;
  let newMetadata = { ...metadata };

  // 1. Check if week has rolled over
  if (savedStartOfWeek && savedStartOfWeek !== startOfWeekStr) {
    // Week rolled over! Check previous week
    const prevStartOfWeek = new Date(startOfWeek);
    prevStartOfWeek.setDate(startOfWeek.getDate() - 7);
    const prevEndOfWeek = new Date(startOfWeek);

    const prevCompletedDays = Array(8).fill(false);
    allWorkouts.forEach(w => {
      const wDate = new Date(w.created_at);
      if (wDate >= prevStartOfWeek && wDate < prevEndOfWeek) {
        const day = wDate.getDay();
        const dayIndex = day === 0 ? 7 : day;
        prevCompletedDays[dayIndex] = true;
      }
    });

    const prevShieldedDays = metadata.shielded_days || [];
    let prevWeekHasUnshieldedMiss = false;

    for (let d = 1; d <= 7; d++) {
      const dayHasPlan = allPlans.some(p => p.day_of_week === d);
      if (dayHasPlan && !prevCompletedDays[d] && !prevShieldedDays.includes(d)) {
        prevWeekHasUnshieldedMiss = true;
        break;
      }
    }

    if (prevWeekHasUnshieldedMiss && currentStreak > 0) {
      currentStreak = 0;
      profileChanged = true;
    }

    shieldedDays = [];
    newMetadata.shielded_days = shieldedDays;
    newMetadata.start_of_week = startOfWeekStr;
    profileChanged = true;
  } else if (!savedStartOfWeek) {
    newMetadata.start_of_week = startOfWeekStr;
    newMetadata.shielded_days = shieldedDays;
    profileChanged = true;
  }

  // 2. Check current week's past days (d < currentDayOfWeek - 1)
  const thisWeekCompletedDays = Array(8).fill(false);
  allWorkouts.forEach(w => {
    const wDate = new Date(w.created_at);
    if (wDate >= startOfWeek) {
      const day = wDate.getDay();
      const dayIndex = day === 0 ? 7 : day;
      thisWeekCompletedDays[dayIndex] = true;
    }
  });

  let currentWeekHasUnshieldedMiss = false;
  for (let d = 1; d < currentDayOfWeek - 1; d++) {
    const dayHasPlan = allPlans.some(p => p.day_of_week === d);
    if (dayHasPlan && !thisWeekCompletedDays[d] && !shieldedDays.includes(d)) {
      currentWeekHasUnshieldedMiss = true;
      break;
    }
  }

  if (currentWeekHasUnshieldedMiss && currentStreak > 0) {
    currentStreak = 0;
    profileChanged = true;
  }

  if (profileChanged) {
    return {
      ...currentProfile,
      streak_days: currentStreak,
      metadata: newMetadata
    };
  }

  return null;
};

interface ActiveSet {
  set_number: number;
  weight_kg: string;
  reps_completed: string;
  is_completed: boolean;
  xp_gained: number;
  autoRegulationFeedback?: string;
}

interface ActiveExercise {
  id: string;
  exercise_id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
  xp_per_set: number;
  sets: ActiveSet[];
  default_reps_min: number;
  default_reps_max: number;
  default_weight_ratio: number;
  rest_duration_seconds: number;
}

export default function WorkoutScreen() {
  const { t } = useLanguageStore();
  const { theme } = useThemeStore();
  
  // App States
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [planExercises, setPlanExercises] = useState<WorkoutPlanExercise[]>([]);
  const [catalogExercises, setCatalogExercises] = useState<Exercise[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Loading & Modes
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<any>(null);
  
  // Vietnam timezone helpers
  const getVietnamDayOfWeek = (): number => {
    const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
    const vnDate = new Date(utc + 3600000 * 7);
    const day = vnDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
    return day === 0 ? 7 : day;
  };

  const [selectedDay, setSelectedDay] = useState<number>(getVietnamDayOfWeek());
  
  // Active Workout Session States
  const [isActiveSession, setIsActiveSession] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  
  // Rest Timer States
  const [isResting, setIsResting] = useState(false);
  const [restCountdown, setRestCountdown] = useState(0);
  const [totalRestTime, setTotalRestTime] = useState(0);
  
  // Swapping / Extras Modals
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);
  const [swappingPlanExerciseId, setSwappingPlanExerciseId] = useState<string | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  
  // Background Timers Refs
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial Seed Load on Mount
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      const todayDay = getVietnamDayOfWeek();
      const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
      const vnDate = new Date(utc + 3600000 * 7);
      const getStartOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);
        return date;
      };
      const startOfWeek = getStartOfWeek(vnDate);

      if (!isSupabaseConfigured) {
        setPlans(MOCK_WORKOUT_PLANS);
        setCatalogExercises(MOCK_EXERCISES);
        const wLogs = getMockWorkoutsHistory();
        setWorkouts(wLogs);
        
        const mockProfile = { 
          weight: 65, 
          xp: 125, 
          level: 1, 
          streak_days: 12, 
          aura_shields: 3, 
          train_days: 4,
          metadata: {
            start_of_week: startOfWeek.toISOString(),
            shielded_days: []
          }
        };
        
        setSelectedDay(todayDay);
        const matchingPlan = MOCK_WORKOUT_PLANS.find(p => p.day_of_week === todayDay);
        setSelectedPlan(matchingPlan || null);
        
        const updated = checkAndUpdateStreakAndShields(mockProfile, wLogs, MOCK_WORKOUT_PLANS);
        setUserProfile(updated || mockProfile);
        
        setIsOfflineMode(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        const userId = currentSession?.user?.id || CURRENT_USER_ID_MOCK;
        
        let profileData: any;
        if (currentSession?.user) {
          profileData = await getProfile(userId);
        } else {
          profileData = { 
            weight: 65, 
            xp: 125, 
            level: 1, 
            streak_days: 12, 
            aura_shields: 3, 
            train_days: 4,
            metadata: {
              start_of_week: startOfWeek.toISOString(),
              shielded_days: []
            }
          };
        }

        const exercisesData = await getExercises();
        setCatalogExercises(exercisesData);

        const plansData = await getWorkoutPlans(userId);
        setPlans(plansData);
        
        setSelectedDay(todayDay);
        const matchingPlan = plansData.find(p => p.day_of_week === todayDay);
        setSelectedPlan(matchingPlan || null);

        const workoutLogs = await getWorkouts(userId);
        setWorkouts(workoutLogs);

        // Run streak validation
        const profileWithMetadata = {
          ...profileData,
          metadata: profileData.metadata && typeof profileData.metadata === 'object' ? profileData.metadata : {
            start_of_week: startOfWeek.toISOString(),
            shielded_days: []
          }
        };

        const updatedProfile = checkAndUpdateStreakAndShields(profileWithMetadata, workoutLogs, plansData);
        if (updatedProfile) {
          if (currentSession?.user) {
            const fresh = await updateProfile(userId, {
              streak_days: updatedProfile.streak_days,
              metadata: updatedProfile.metadata
            });
            setUserProfile(fresh);
          } else {
            setUserProfile(updatedProfile);
          }
        } else {
          setUserProfile(profileWithMetadata);
        }

        setIsOfflineMode(false);
      } catch (error: any) {
        console.log('Error initializing Workout Hub:', error.message);
        setPlans(MOCK_WORKOUT_PLANS);
        setCatalogExercises(MOCK_EXERCISES);
        const wLogs = getMockWorkoutsHistory();
        setWorkouts(wLogs);
        
        const mockProfile = { 
          weight: 65, 
          xp: 125, 
          level: 1, 
          streak_days: 12, 
          aura_shields: 3, 
          train_days: 4,
          metadata: {
            start_of_week: startOfWeek.toISOString(),
            shielded_days: []
          }
        };
        setSelectedDay(todayDay);
        const matchingPlan = MOCK_WORKOUT_PLANS.find(p => p.day_of_week === todayDay);
        setSelectedPlan(matchingPlan || null);

        const updated = checkAndUpdateStreakAndShields(mockProfile, wLogs, MOCK_WORKOUT_PLANS);
        setUserProfile(updated || mockProfile);
        setIsOfflineMode(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        try {
          const profileData = await getProfile(newSession.user.id);
          setUserProfile(profileData);
          const workoutLogs = await getWorkouts(newSession.user.id);
          setWorkouts(workoutLogs);
          const plansData = await getWorkoutPlans(newSession.user.id);
          setPlans(plansData);
          setIsOfflineMode(false);
        } catch (e) {
          console.log('Sync auth error in WorkoutScreen:', e);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, []);

  // Update selectedPlan when selectedDay changes
  useEffect(() => {
    const matchingPlan = plans.find(p => p.day_of_week === selectedDay);
    setSelectedPlan(matchingPlan || null);
  }, [selectedDay, plans]);

  // Fetch plan exercises when selectedPlan changes
  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (!selectedPlan) {
        setPlanExercises([]);
        return;
      }
      
      if (isOfflineMode) {
        const localDetails = MOCK_PLAN_EXERCISES[selectedPlan.id] || [];
        setPlanExercises(localDetails);
        return;
      }

      try {
        const details = await getWorkoutPlanExercises(selectedPlan.id);
        setPlanExercises(details);
      } catch (err: any) {
        console.log('Error fetching plan exercises:', err.message);
        const localDetails = MOCK_PLAN_EXERCISES[selectedPlan.id] || [];
        setPlanExercises(localDetails);
      }
    };

    fetchPlanDetails();
  }, [selectedPlan, isOfflineMode]);

  // Stopwatch elapsed seconds counter during active session
  useEffect(() => {
    if (isActiveSession) {
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      setElapsedSeconds(0);
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [isActiveSession]);

  // Rest Timer countdown counter
  useEffect(() => {
    if (isResting && restCountdown > 0) {
      restTimerRef.current = setInterval(() => {
        setRestCountdown(prev => {
          if (prev <= 1) {
            setIsResting(false);
            if (restTimerRef.current) clearInterval(restTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isResting, restCountdown]);

  // Get Mock Workout History Fallback
  const getMockWorkoutsHistory = (): Workout[] => [
    {
      id: 'h-1',
      user_id: CURRENT_USER_ID_MOCK,
      title: 'Monday - Lộ Trình KÉO (Pull day)',
      duration_minutes: 62,
      calories_burned: 496,
      xp_gained: 120,
      plan_id: 'plan-mon',
      created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
    },
    {
      id: 'h-2',
      user_id: CURRENT_USER_ID_MOCK,
      title: 'Friday - Lộ Trình CHÂN & BỤNG (Legs & Abs)',
      duration_minutes: 55,
      calories_burned: 440,
      xp_gained: 160,
      plan_id: 'plan-fri',
      created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString()
    }
  ];

  // Resolve Premium Gym Images dynamically
  const getExerciseImage = (name: string): string => {
    const pullImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbVjBuu-rLKz76Aj2KyjA0e_MI0I2u09FNqzLVDtkZrE7cDYBdtmZAIzeZxAqW2EwxBfehZj4aSmOX3xUb2Dvo_A_HqsZxdQ8i_0S9kR7hkwCbllSKhPBxy2if2amh3qg5g7KcqFlpR_qT-tUig02fH0b503sUAtcNPLhOOydVlidvTWeZvsu-w9ENOuJWPZ9AlpHxTpndvfSMtaPoTSB_M6RXzPPhfqkZbzf54sjaD3fnvCmInWTY6hsvQmOaD6RMavepU3_v2Q';
    const machineImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLIDL9gGxp9_yrZoobdcjPxdfgGh0hezHqutgF19-qwLeL-qsLpJGfPyrJRjKYpiEz2NV59W932rBcyp80oBoB1zXoX3OlvFi9vv14LRybHhcLHP_1OR1YlygUkfsshMMRdFq--6K6KOghI2ghwP-0RLhk7DE6Eo_DTKUueju9iR8ppXxV1kF_DKcX7wRLpZoZa_JFDk4ya3-7DzGskYwfwcJRIZnjlcBE0h0CUhFK71ibWrDIT0pMS3MJ5353d4gjqlJjYWtO1w';
    const dumbbellsImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7bPQ3AXGTRmXV2Sm-MWwZH_J_p8j0ghUVALW-wqPNkcRFx_AwI1dPW7TqNVhuDnIUmcNsZooSWw-WyLPdJNeOpqNxX1B5BUCrWNM1iIxZimA81IJrAV0iUocuEiSx-uo-t6IaQXDniID4jjnTDjKj5SJC23yF_opNEQdTVt8-oSNyUYr1qQh24vEkYOplrU2KtiGP3kcp5MGsJJAp-MeDac0i2O4GgGwwrJ-xawHVArtHZMIp4g8xuant11rCOt5d7bXdS1DNug';

    const cleanName = name.toLowerCase();
    if (cleanName.includes('pulldown') || cleanName.includes('deadlift') || cleanName.includes('row') || cleanName.includes('kéo')) {
      return pullImage;
    } else if (cleanName.includes('press') || cleanName.includes('đẩy') || cleanName.includes('squat')) {
      return machineImage;
    }
    return dumbbellsImage;
  };

  // Format MM:SS stopwatch string
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Compute recommended weight for an exercise
  const calculateSuggestedWeight = (ratio: number): number => {
    const userWeight = userProfile?.weight || 65;
    const recommended = userWeight * ratio;
    return Math.round(recommended * 2) / 2;
  };

  // Start Workout Action
  const handleBeginAscension = (initialExpandExerciseId?: string) => {
    if (!selectedPlan || planExercises.length === 0) {
      Alert.alert('Lỗi', 'Không thể bắt đầu do chưa có bài tập nào.');
      return;
    }

    // Check if the selected day is the current day (Vietnam Time)
    const todayDay = getVietnamDayOfWeek();
    if (selectedDay !== todayDay) {
      Alert.alert('Không thể bắt đầu', 'Bạn chỉ có thể thực hiện bài tập của ngày hôm nay.');
      return;
    }

    const initialActive: ActiveExercise[] = planExercises.map((pe, idx) => {
      const exerciseName = pe.exercises?.name || 'Bài tập';
      const xpVal = pe.exercises?.xp_per_set || 10;
      const ratio = pe.default_weight_ratio;
      const suggested = calculateSuggestedWeight(ratio);
      
      const setsList: ActiveSet[] = [];
      for (let i = 1; i <= pe.default_sets; i++) {
        setsList.push({
          set_number: i,
          weight_kg: suggested > 0 ? suggested.toString() : '',
          reps_completed: pe.default_reps_min.toString(),
          is_completed: false,
          xp_gained: xpVal
        });
      }

      return {
        id: pe.id, // Use plan exercise id as identifier
        exercise_id: pe.exercise_id,
        name: exerciseName,
        primary_muscle: pe.exercises?.primary_muscle || 'Toàn thân',
        equipment: pe.exercises?.equipment || 'Không có',
        xp_per_set: xpVal,
        sets: setsList,
        default_reps_min: pe.default_reps_min,
        default_reps_max: pe.default_reps_max,
        default_weight_ratio: ratio,
        rest_duration_seconds: pe.rest_duration_seconds || 90
      };
    });

    setActiveExercises(initialActive);
    setIsActiveSession(true);
    setElapsedSeconds(0);
    setIsResting(false);
    if (initialExpandExerciseId) {
      setExpandedExerciseId(initialExpandExerciseId);
    } else if (initialActive.length > 0) {
      setExpandedExerciseId(initialActive[0].id);
    }
  };

  // Swap Plan Exercise handler
  const handleSwapPlanExercise = (planExerciseId: string, index: number) => {
    setSwappingIndex(index);
    setSwappingPlanExerciseId(planExerciseId);
    setShowSwapModal(true);
  };

  // Use Aura Shield logic
  const handleUseShield = async (day: number) => {
    if (!userProfile) return;
    const currentShields = userProfile.aura_shields || 0;
    if (currentShields <= 0) {
      Alert.alert('Không đủ khiên', 'Bạn đã hết khiên bảo vệ. Hãy hoàn thành các buổi tập để nhận thêm khiên!');
      return;
    }

    const metadata = userProfile.metadata || {};
    const shieldedDays = metadata.shielded_days || [];
    if (shieldedDays.includes(day)) {
      Alert.alert('Thông báo', 'Ngày này đã được bảo vệ bằng khiên.');
      return;
    }

    const nextShields = currentShields - 1;
    const updatedMetadata = {
      ...metadata,
      shielded_days: [...shieldedDays, day]
    };

    setIsLoading(true);
    try {
      const isActuallyOffline = isOfflineMode || !session;
      if (isActuallyOffline) {
        setUserProfile((prev: any) => ({
          ...prev,
          aura_shields: nextShields,
          metadata: updatedMetadata
        }));
        Alert.alert('Thành công', 'Đã sử dụng 1 khiên bảo vệ chuỗi tập luyện thành công!');
      } else {
        const activeUserId = session?.user?.id || CURRENT_USER_ID_MOCK;
        const updated = await updateProfile(activeUserId, {
          aura_shields: nextShields,
          metadata: updatedMetadata
        });
        setUserProfile(updated);
        Alert.alert('Thành công', 'Đã sử dụng 1 khiên bảo vệ chuỗi tập luyện thành công!');
      }
    } catch (err: any) {
      Alert.alert('Lỗi sử dụng khiên', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save/Update Plan custom details handler
  const handleSavePlan = async (planName: string, difficulty: string, exercises: Omit<WorkoutPlanExercise, 'id'>[]) => {
    const activeUserId = session?.user?.id || CURRENT_USER_ID_MOCK;
    
    // Check if we need to clone or edit a plan
    let targetPlanId = selectedPlan?.id;
    let isNewPlan = !selectedPlan || selectedPlan.user_id === null;

    setIsLoading(true);
    try {
      let savedPlan: WorkoutPlan;

      if (isOfflineMode || !session) {
        // Offline sandbox simulation
        if (isNewPlan) {
          savedPlan = {
            id: 'local-plan-' + Math.random().toString(36).substring(7),
            user_id: activeUserId,
            name: planName,
            day_of_week: selectedDay,
            difficulty: difficulty,
            created_by: 'user'
          };
          setPlans(prev => [...prev, savedPlan]);
        } else {
          savedPlan = {
            ...selectedPlan!,
            name: planName,
            difficulty: difficulty
          };
          setPlans(prev => prev.map(p => p.id === savedPlan.id ? savedPlan : p));
        }

        // Save exercises locally
        const mappedExs: WorkoutPlanExercise[] = exercises.map((ex, idx) => {
          const catalogEx = catalogExercises.find(e => e.id === ex.exercise_id);
          return {
            id: 'local-pe-' + Math.random().toString(36).substring(7),
            plan_id: savedPlan.id,
            exercise_id: ex.exercise_id,
            sequence_order: ex.sequence_order || (idx + 1),
            default_sets: ex.default_sets,
            default_reps_min: ex.default_reps_min,
            default_reps_max: ex.default_reps_max,
            default_weight_ratio: ex.default_weight_ratio,
            exercises: catalogEx
          };
        });
        
        MOCK_PLAN_EXERCISES[savedPlan.id] = mappedExs;
        setPlanExercises(mappedExs);
        setSelectedPlan(savedPlan);
        
        // Auto-refresh plans
        const updatedPlans = [...plans];
        const existIdx = updatedPlans.findIndex(p => p.id === savedPlan.id);
        if (existIdx >= 0) {
          updatedPlans[existIdx] = savedPlan;
        } else {
          updatedPlans.push(savedPlan);
        }
        setPlans(updatedPlans);

        Alert.alert('Thành công', 'Đã lưu giáo án tùy chỉnh offline thành công!');
      } else {
        // Online Supabase flow
        const planData: Omit<WorkoutPlan, 'created_at'> = {
          id: isNewPlan ? undefined as any : targetPlanId!,
          user_id: activeUserId,
          name: planName,
          day_of_week: selectedDay,
          difficulty: difficulty,
          created_by: 'user'
        };

        if (isNewPlan) {
          delete (planData as any).id;
        }

        savedPlan = await saveWorkoutPlan(planData);
        
        // Link exercises to the new plan
        const exercisesToSave = exercises.map(ex => ({
          ...ex,
          plan_id: savedPlan.id
        }));

        await saveWorkoutPlanExercises(savedPlan.id, exercisesToSave);

        // Reload plans and updates
        const freshPlans = await getWorkoutPlans(activeUserId);
        setPlans(freshPlans);
        
        const freshExercises = await getWorkoutPlanExercises(savedPlan.id);
        setPlanExercises(freshExercises);

        const newSelected = freshPlans.find(p => p.id === savedPlan.id) || null;
        setSelectedPlan(newSelected);
        
        Alert.alert('Thành công', 'Đã lưu giáo án tùy chỉnh thành công!');
      }
    } catch (err: any) {
      Alert.alert('Lỗi lưu giáo án', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Form input Handlers bound to active session state
  const handleUpdateSetWeight = (exId: string, setNum: number, weight: string) => {
    setActiveExercises(prev => prev.map(e => {
      if (e.id !== exId) return e;
      return {
        ...e,
        sets: e.sets.map(s => s.set_number === setNum ? { ...s, weight_kg: weight } : s)
      };
    }));
  };

  const handleUpdateSetReps = (exId: string, setNum: number, reps: string) => {
    setActiveExercises(prev => prev.map(e => {
      if (e.id !== exId) return e;
      return {
        ...e,
        sets: e.sets.map(s => s.set_number === setNum ? { ...s, reps_completed: reps } : s)
      };
    }));
  };

  const handleToggleSetComplete = (exId: string, setNum: number) => {
    setActiveExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;

      const updatedSets = ex.sets.map(s => {
        if (s.set_number !== setNum) return s;

        const isNowCompleted = !s.is_completed;
        
        let feedback = '';
        if (isNowCompleted) {
          const repsVal = parseInt(s.reps_completed, 10);
          if (!isNaN(repsVal)) {
            if (repsVal < ex.default_reps_min) {
              feedback = `Tạ hơi nặng! Giảm 2.5kg - 5kg ở set sau để đạt từ ${ex.default_reps_min}-${ex.default_reps_max} reps.`;
            } else if (repsVal > 14) {
              feedback = `Tạ hơi nhẹ! Tăng 2.5kg - 5kg ở set sau để tăng độ mỏi cơ kích thích.`;
            } else {
              feedback = `Mức tạ hoàn hảo! Hãy giữ vững số reps này.`;
            }
          }

          setRestCountdown(ex.rest_duration_seconds);
          setTotalRestTime(ex.rest_duration_seconds);
          setIsResting(true);
        }

        return {
          ...s,
          is_completed: isNowCompleted,
          autoRegulationFeedback: feedback
        };
      });

      return {
        ...ex,
        sets: updatedSets
      };
    }));
  };

  const handleAddSet = (exId: string) => {
    setActiveExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      
      const lastSet = ex.sets[ex.sets.length - 1];
      const nextNum = ex.sets.length + 1;
      const newSet: ActiveSet = {
        set_number: nextNum,
        weight_kg: lastSet ? lastSet.weight_kg : '',
        reps_completed: ex.default_reps_min.toString(),
        is_completed: false,
        xp_gained: ex.xp_per_set
      };

      return {
        ...ex,
        sets: [...ex.sets, newSet]
      };
    }));
  };

  const handleRemoveSet = (exId: string, setNum: number) => {
    setActiveExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      if (ex.sets.length <= 1) {
        Alert.alert('Thông báo', 'Mỗi bài tập phải có ít nhất 1 hiệp.');
        return ex;
      }
      
      const filteredSets = ex.sets.filter(s => s.set_number !== setNum)
        .map((s, index) => ({
          ...s,
          set_number: index + 1
        }));

      return {
        ...ex,
        sets: filteredSets
      };
    }));
  };

  const handleExecuteSwap = async (newEx: Exercise) => {
    if (swappingPlanExerciseId) {
      // Swapping in the detailed plan list before starting the workout!
      const activeUserId = session?.user?.id || CURRENT_USER_ID_MOCK;
      setIsLoading(true);
      try {
        const updatedExercises = planExercises.map((pe) => {
          if (pe.id === swappingPlanExerciseId) {
            return {
              ...pe,
              exercise_id: newEx.id,
              exercises: newEx
            };
          }
          return pe;
        });

        if (isOfflineMode || !session) {
          // Offline Sandbox
          if (selectedPlan) {
            MOCK_PLAN_EXERCISES[selectedPlan.id] = updatedExercises;
            setPlanExercises(updatedExercises);
          }
        } else {
          // Supabase flow
          const mappedToSave = updatedExercises.map(pe => ({
            plan_id: pe.plan_id,
            exercise_id: pe.exercise_id,
            sequence_order: pe.sequence_order,
            default_sets: pe.default_sets,
            default_reps_min: pe.default_reps_min,
            default_reps_max: pe.default_reps_max,
            default_weight_ratio: pe.default_weight_ratio
          }));
          await saveWorkoutPlanExercises(selectedPlan!.id, mappedToSave);
          
          const freshExercises = await getWorkoutPlanExercises(selectedPlan!.id);
          setPlanExercises(freshExercises);
        }
        Alert.alert('Thành công', `Đã tráo đổi sang bài tập ${newEx.name}!`);
      } catch (err: any) {
        Alert.alert('Lỗi đổi bài tập', err.message);
      } finally {
        setIsLoading(false);
        setSwappingPlanExerciseId(null);
        setSwappingIndex(null);
        setShowSwapModal(false);
      }
      return;
    }

    if (swappingIndex === null) return;

    setActiveExercises(prev => {
      const copy = [...prev];
      const target = copy[swappingIndex];
      const suggested = calculateSuggestedWeight(target.default_weight_ratio);
      
      const updatedSets = target.sets.map(s => ({
        ...s,
        weight_kg: suggested > 0 ? suggested.toString() : '',
        is_completed: false,
        autoRegulationFeedback: undefined
      }));

      copy[swappingIndex] = {
        ...target,
        exercise_id: newEx.id,
        name: newEx.name,
        primary_muscle: newEx.primary_muscle,
        equipment: newEx.equipment,
        xp_per_set: newEx.xp_per_set,
        sets: updatedSets,
        default_reps_min: newEx.default_reps_min,
        default_reps_max: newEx.default_reps_max
      };

      return copy;
    });

    setShowSwapModal(false);
    setSwappingIndex(null);
  };

  const handleAddExtraExercise = (newEx: Exercise) => {
    const xpVal = newEx.xp_per_set || 10;
    const suggested = calculateSuggestedWeight(0.3);
    
    const setsList: ActiveSet[] = Array.from({ length: 3 }, (_, i) => ({
      set_number: i + 1,
      weight_kg: suggested > 0 ? suggested.toString() : '',
      reps_completed: '10',
      is_completed: false,
      xp_gained: xpVal
    }));

    const nextIdx = activeExercises.length;
    const extraEx: ActiveExercise = {
      id: `active-ex-extra-${nextIdx}-${newEx.id}`,
      exercise_id: newEx.id,
      name: newEx.name,
      primary_muscle: newEx.primary_muscle,
      equipment: newEx.equipment,
      xp_per_set: xpVal,
      sets: setsList,
      default_reps_min: newEx.default_reps_min,
      default_reps_max: newEx.default_reps_max,
      default_weight_ratio: 0.3,
      rest_duration_seconds: 60
    };

    setActiveExercises(prev => [...prev, extraEx]);
    setShowAddExerciseModal(false);
  };

  // Save Workout log on complete
  const handleFinishWorkout = async () => {
    const totalCompletedSets = activeExercises.reduce((sum, ex) => {
      return sum + ex.sets.filter(s => s.is_completed).length;
    }, 0);

    if (totalCompletedSets === 0) {
      Alert.alert('Thông báo', 'Bạn cần đánh dấu hoàn thành ít nhất 1 hiệp (set) tập.');
      return;
    }

    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
    const caloriesBurned = durationMins * 8;
    const totalXPGained = activeExercises.reduce((sum, ex) => {
      return sum + ex.sets.reduce((exSum, s) => {
        return exSum + (s.is_completed ? s.xp_gained : 0);
      }, 0);
    }, 0);

    const activeUserId = session?.user?.id || CURRENT_USER_ID_MOCK;

    const workoutLogData = {
      user_id: activeUserId,
      title: selectedPlan?.name || 'Daily Routine',
      duration_minutes: durationMins,
      calories_burned: caloriesBurned,
      xp_gained: totalXPGained,
      plan_id: selectedPlan?.id || null
    };

    setIsLoading(true);
    try {
      const isActuallyOffline = isOfflineMode || !session;

      if (isActuallyOffline) {
        const newLocalWorkout: Workout = {
          ...workoutLogData,
          id: 'local-w-' + Math.random().toString(36).substring(7),
          created_at: new Date().toISOString()
        };
        setWorkouts(prev => [newLocalWorkout, ...prev]);

        if (userProfile) {
          const currentXP = userProfile.xp || 0;
          const updatedXP = currentXP + totalXPGained;
          const updatedLevel = Math.floor(updatedXP / 1000) + 1;
          const currentStreak = userProfile.streak_days || 0;
          
          setUserProfile((prev: any) => ({
            ...prev,
            xp: updatedXP,
            level: updatedLevel,
            streak_days: currentStreak + 1
          }));
        }

        Alert.alert(
          'Thành công',
          `Chúc mừng bạn đã hoàn thành buổi tập!\nTổng phút: ${durationMins}m\nTổng calo: ${caloriesBurned} kcal\nNhận được: +${totalXPGained} XP. Hào quang Aura tăng lên!`,
          [{ text: 'Tuyệt vời', onPress: () => setIsActiveSession(false) }]
        );
      } else {
        const savedWorkout = await addWorkout(workoutLogData);

        const setLogsBatch: Omit<ExerciseSetLog, 'id' | 'created_at'>[] = [];
        activeExercises.forEach(ex => {
          ex.sets.forEach(s => {
            if (s.is_completed) {
              setLogsBatch.push({
                workout_id: savedWorkout.id,
                exercise_id: ex.exercise_id,
                set_number: s.set_number,
                weight_kg: parseFloat(s.weight_kg) || 0,
                reps_completed: parseInt(s.reps_completed, 10) || 0,
                is_completed: true,
                xp_gained: s.xp_gained
              });
            }
          });
        });

        if (setLogsBatch.length > 0) {
          await addSetLogs(setLogsBatch);
        }

        const freshLogs = await getWorkouts(activeUserId);
        setWorkouts(freshLogs);
        const freshProfile = await getProfile(activeUserId);
        setUserProfile(freshProfile);

        Alert.alert(
          'Thành công',
          `Đã lưu nhật ký buổi tập thành công!\nPhút: ${durationMins}m\nCalo: ${caloriesBurned} kcal\nEXP: +${totalXPGained} XP.`,
          [{ text: 'Xong', onPress: () => setIsActiveSession(false) }]
        );
      }
    } catch (err: any) {
      Alert.alert('Lỗi lưu nhật ký', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      'Hủy buổi tập',
      'Bạn có chắc muốn hủy buổi tập hiện tại? Mọi thông số tập luyện hôm nay sẽ không được ghi nhận.',
      [
        { text: 'Tiếp tục tập', style: 'cancel' },
        { text: 'Đồng ý hủy', style: 'destructive', onPress: () => setIsActiveSession(false) }
      ]
    );
  };

  const handleDeleteWorkoutLog = (id: string) => {
    Alert.alert(
      'Xóa buổi tập',
      'Bạn có muốn xóa buổi tập này khỏi lịch sử không?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              if (isOfflineMode || !session) {
                setWorkouts(prev => prev.filter(w => w.id !== id));
              } else {
                await deleteWorkout(id);
                setWorkouts(prev => prev.filter(w => w.id !== id));
              }
              Alert.alert('Thành công', 'Đã xóa lịch sử buổi tập.');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSwapRequest = (index: number) => {
    setSwappingIndex(index);
    setShowSwapModal(true);
  };

  if (isLoading) {
    return (
      <Box className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg items-center justify-center">
        <ActivityIndicator size="large" color="#8EB69B" />
      </Box>
    );
  }

  // Active workout session UI
  if (isActiveSession) {
    return (
      <Box className="flex-1">
        <ActiveWorkoutSession
          selectedPlan={selectedPlan}
          elapsedSeconds={elapsedSeconds}
          activeExercises={activeExercises}
          userWeight={userProfile?.weight || 65}
          theme={theme}
          formatTime={formatTime}
          calculateSuggestedWeight={calculateSuggestedWeight}
          onUpdateSetWeight={handleUpdateSetWeight}
          onUpdateSetReps={handleUpdateSetReps}
          onToggleSetComplete={handleToggleSetComplete}
          onAddSet={handleAddSet}
          onRemoveSet={handleRemoveSet}
          onSwapRequest={handleSwapRequest}
          onShowAddExtraModal={() => setShowAddExerciseModal(true)}
          onFinishWorkout={handleFinishWorkout}
          onCancelWorkout={handleCancelWorkout}
          expandedExerciseId={expandedExerciseId}
          setExpandedExerciseId={setExpandedExerciseId}
        />

        <RestTimerOverlay
          isResting={isResting}
          setIsResting={setIsResting}
          restCountdown={restCountdown}
          totalRestTime={totalRestTime}
        />

        <SwapExerciseModal
          visible={showSwapModal}
          onClose={() => {
            setShowSwapModal(false);
            setSwappingPlanExerciseId(null);
            setSwappingIndex(null);
          }}
          catalogExercises={catalogExercises}
          activeExercises={activeExercises}
          swappingIndex={swappingIndex}
          onExecuteSwap={handleExecuteSwap}
        />

        <AddExerciseModal
          visible={showAddExerciseModal}
          onClose={() => setShowAddExerciseModal(false)}
          catalogExercises={catalogExercises}
          onAddExtraExercise={handleAddExtraExercise}
        />
      </Box>
    );
  }

  // Weekly Overview UI
  return (
    <Box className="flex-1">
      <WorkoutOverview
        plans={plans}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        planExercises={planExercises}
        workouts={workouts}
        isOfflineMode={isOfflineMode}
        onBeginAscension={handleBeginAscension}
        onDeleteWorkoutLog={handleDeleteWorkoutLog}
        getExerciseImage={getExerciseImage}
        t={t}
        userProfile={userProfile}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        onOpenCustomizePlan={() => setShowCustomizeModal(true)}
        onUseShield={handleUseShield}
        onSwapPlanExercise={handleSwapPlanExercise}
      />

      <CustomizePlanModal
        visible={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        selectedDay={selectedDay}
        plan={selectedPlan}
        planExercises={planExercises}
        catalogExercises={catalogExercises}
        onSavePlan={handleSavePlan}
      />
    </Box>
  );
}
