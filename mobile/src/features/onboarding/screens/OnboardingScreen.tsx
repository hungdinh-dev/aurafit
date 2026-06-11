import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  ArrowLeft, 
  ChevronRight, 
  Dumbbell, 
  BookOpen, 
  Flame, 
  Zap, 
  Brain, 
  Compass, 
  Award,
  Droplet,
  Moon,
  Clock,
  Sparkles,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react-native';

import { useAuthStore } from '../../profile/store/authStore';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@/components/ui/slider';
import TypewriterText from '../components/TypewriterText';
import CircularDial from '../components/CircularDial';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const totalSteps = 15; // 0 (Welcome) + 13 survey steps + 1 (Rating) + 1 (Register) = 15 total screens

  // Auth Store actions
  const { setSession, setSandboxBypassed, setOnboarded } = useAuthStore();

  // Onboarding States
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [age, setAge] = useState(24);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(65);
  const [activeBioTab, setActiveBioTab] = useState<'height' | 'weight'>('height');
  
  const [bodyFat, setBodyFat] = useState(18);
  const [musclePercent, setMusclePercent] = useState(35);

  const [socialHours, setSocialHours] = useState(18); // default distraction hours
  
  // Reading
  const [bookPages, setBookPages] = useState(25);
  const [bookTitle, setBookTitle] = useState('');
  const [bookPhotoMock, setBookPhotoMock] = useState(false);

  // Weight Training
  const [trainDays, setTrainDays] = useState(3);
  const [focusExercises, setFocusExercises] = useState<string[]>(['Lat Pulldown']);

  // Nutrition Target
  const [calories, setCalories] = useState(2200);
  const [protein, setProtein] = useState(120);

  // Cardio
  const [cardioOption, setCardioOption] = useState(true);
  const [cardioSport, setCardioSport] = useState('Đi bộ dốc');
  const [cardioCalories, setCardioCalories] = useState(300);

  // Sleep & Wake up
  const [wakeTime, setWakeTime] = useState('06:00 AM');
  const [sleepQuality, setSleepQuality] = useState<'good' | 'medium' | 'bad'>('good');

  // Water
  const [waterTarget, setWaterTarget] = useState(2.0);
  const [waterReminder, setWaterReminder] = useState(true);

  // Stats Rating calculation
  const [wisdom, setWisdom] = useState(40);
  const [confidence, setConfidence] = useState(53);
  const [strength, setStrength] = useState(40);
  const [discipline, setDiscipline] = useState(42);
  const [focus, setFocus] = useState(43);

  // Credentials & Auth process
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);

  // Update RPG Stats dynamically whenever parameters change
  useEffect(() => {
    // Base is 40
    const calcWisdom = Math.min(99, 40 + Math.round(bookPages / 5));
    const calcConfidence = Math.min(99, 45 + (sleepQuality === 'good' ? 8 : sleepQuality === 'medium' ? 4 : 0) + (cardioOption ? 5 : 0));
    const calcStrength = Math.min(99, 40 + trainDays * 4 + Math.round(protein / 15));
    const calcDiscipline = Math.min(99, 42 + Math.max(0, Math.round((40 - socialHours) / 3)) + (waterTarget >= 2.0 ? 5 : 0));
    const calcFocus = Math.min(99, 40 + Math.max(0, Math.round((40 - socialHours) / 4)) + Math.round(bookPages / 8));

    setWisdom(calcWisdom);
    setConfidence(calcConfidence);
    setStrength(calcStrength);
    setDiscipline(calcDiscipline);
    setFocus(calcFocus);
  }, [bookPages, sleepQuality, cardioOption, trainDays, protein, socialHours, waterTarget]);

  // Welcome page typewriter check
  const [introFinished, setIntroFinished] = useState(false);

  const nextStep = () => {

    console.log("Onpress?", step, name);

    // Validate Step 1: Name Input
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Yêu cầu', 'Vui lòng nhập tên của bạn trước khi tiếp tục.');
        return;
      }
    }

    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const toggleFocusExercise = (ex: string) => {
    if (focusExercises.includes(ex)) {
      setFocusExercises(focusExercises.filter((item) => item !== ex));
    } else {
      setFocusExercises([...focusExercises, ex]);
    }
  };

  const handleRegisterOrLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền email và mật khẩu.');
      return;
    }

    setAuthLoading(true);

    try {
      if (isLoginMode) {
        // Handle direct login
        if (!isSupabaseConfigured) {
          setSandboxBypassed(true);
          setSession({ user: { email: email.trim(), id: 'offline-id' } });
          setOnboarded(true);
          Alert.alert('Sandbox Mode', 'Đăng nhập Sandbox thành công.');
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim()
          });
          if (error) throw error;
          if (data?.session) {
            setSession(data.session);
            setOnboarded(true);
          }
        }
      } else {
        // Handle Signup & Onboarding Save
        const onboardingData = {
          gender,
          age,
          weight,
          height,
          bodyFat,
          musclePercent,
          socialHours,
          bookPages,
          bookTitle,
          trainDays,
          focusExercises,
          calories,
          protein,
          cardioOption,
          cardioSport,
          cardioCalories,
          wakeTime,
          sleepQuality,
          waterTarget,
          waterReminder,
          attributes: { wisdom, confidence, strength, discipline, focus },
          level: 1,
          xp: 0
        };

        if (!isSupabaseConfigured) {
          // Mock save in Sandbox mode
          setSandboxBypassed(true);
          setSession({ user: { email: email.trim(), id: 'offline-id' } });
          setOnboarded(true);
          Alert.alert('Sandbox Mode', 'Khởi tạo hồ sơ Sandbox offline thành công!');
        } else {
          // 1. Supabase Auth Sign Up
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
            options: {
              data: {
                username: name.trim() || email.split('@')[0],
                full_name: name.trim() || 'Aura Warrior',
              }
            }
          });

          if (error) throw error;

          const userId = data.user?.id;
          if (userId) {
            // 2. Save profile parameters to profiles database table (trigger creates row, so update it)
            const { error: profileErr } = await supabase
              .from('profiles')
              .update({
                username: name.trim().toLowerCase() || email.split('@')[0],
                full_name: name.trim() || 'Aura Warrior',
                level: 1,
                xp: 0,
                streak_days: 0,
                aura_shields: 0,
                cardio_age: age,
                gender,
                age,
                weight,
                height,
                body_fat: bodyFat,
                muscle_percent: musclePercent,
                social_hours: socialHours,
                book_pages: bookPages,
                book_title: bookTitle,
                train_days: trainDays,
                focus_exercises: focusExercises,
                calories_target: calories,
                protein_target: protein,
                cardio_option: cardioOption,
                cardio_sport: cardioSport,
                cardio_calories: cardioCalories,
                wake_time: wakeTime,
                sleep_quality: sleepQuality,
                water_target: waterTarget,
                water_reminder: waterReminder,
                wisdom,
                confidence,
                strength,
                discipline,
                focus,
                metadata: onboardingData
              })
              .eq('id', userId);

            if (profileErr) {
              console.log('Error inserting profile details:', profileErr.message);
              // Fail silently on profile table insert (e.g. table has not been fully created yet)
            }
          }

          Alert.alert('Thành công', 'Hồ sơ Aura của bạn đã được kích hoạt! Hãy đăng nhập để bắt đầu.');
          setIsLoginMode(true);
          setStep(totalSteps - 1); // Stay on credential page but in login mode
        }
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Đã xảy ra lỗi không xác định.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Render the current step's view
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View className="flex-1 justify-center px-6">
            <View className="items-center mb-10">
              <View className="w-20 h-20 rounded-full bg-brand-dark-card border border-brand-primary/40 items-center justify-center shadow-lg relative overflow-hidden">
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ7etWtLhaTI7H6Zh4RJtjxyzoiFx3r8g0zBEUKz_9CxO6D6nmBvRcJ49IdfbLeEk_v9sUHVkl2Y9iYvPr4XNNNR8XZAxaJu1phV1H9tGpnlIf1bfbvZE3naEg8rp_ulypN_nNLsOhONMb4Dm3ipd7dcjPuulDE3rDk8qTlzqhygcSg0KpnuHmU31MtlcAVWPV-M3gy1Lgf_fg1FVKs6dYQn2SXrBugeHz2G1ylz1tCuxGcDqBGiGGeb6VTXAyM7ottIiT8x5x0A' }}
                  className="w-full h-full"
                />
              </View>
              <Text className="text-[10px] text-brand-primary font-bold uppercase tracking-widest mt-3">
                HLV Trí Tuệ Nhân Tạo
              </Text>
              <Text className="text-sm font-extrabold text-brand-light-text dark:text-brand-dark-text mt-1 uppercase tracking-tight">
                Elena Vance
              </Text>
            </View>

            {/* <View className="bg-brand-light-card/80 dark:bg-brand-dark-card/60 border border-brand-light-border dark:border-brand-dark-border/40 rounded-2xl p-6 mb-8 min-h-[140px] justify-center">
              <Text className="text-sm text-brand-light-text dark:text-brand-dark-text font-bold text-center leading-relaxed">
                Xin chào. Tôi là Elena Vance, người đồng hành cùng bạn tại AuraFit. Hãy cùng tôi thiết lập các thông số thói quen của bạn để đúc kết và kích hoạt hào quang Aura (Lvl 1) của bạn.
              </Text>
            </View> */}

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center space-x-2"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Khởi Hành
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>

            <Pressable
              onPress={() => {
                setIsLoginMode(true);
                setStep(totalSteps - 1); // Skip to login
              }}
              className="mt-4 py-2 items-center"
            >
              <Text className="text-[11px] text-brand-primary font-bold uppercase tracking-wider">
                Tôi đã có tài khoản (Đăng nhập)
              </Text>
            </Pressable>
          </View>
        );

      case 1:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Tên của bạn là gì?
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-10 px-4">
              Tên hiển thị này sẽ xuất hiện trên màn hình chính và bảng xếp hạng danh dự.
            </Text>

            <View className="mb-10">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nhập tên thật hoặc biệt danh..."
                placeholderTextColor="#5C8276"
                className="w-full bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border text-brand-light-text dark:text-brand-dark-text text-center py-4 px-6 rounded-xl font-bold text-lg"
                autoFocus
              />
            </View>

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary dark:bg-brand-primary shadow-md opacity-100 py-3.5 rounded-xl items-center flex-row justify-center"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Tiếp Tục
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 2:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Chọn hình thể đại diện
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-8">
              Mô hình giải phẫu 3D cơ bắp sẽ được cấu hình dựa trên giới tính của bạn.
            </Text>

            {/* Character Selection */}
            <View className="flex-row justify-center space-x-6 mb-8">
              <Pressable
                onPress={() => setGender('Male')}
                className={`flex-1 py-3 px-4 rounded-xl border items-center ${
                  gender === 'Male'
                    ? 'border-brand-primary dark:border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/10'
                    : 'border-brand-light-border dark:border-brand-dark-border bg-brand-light-card/40 dark:bg-brand-dark-card/40'
                }`}
              >
                <Text className={`font-bold text-sm ${gender === 'Male' ? 'text-brand-primary dark:text-brand-primary' : 'text-brand-light-text dark:text-brand-dark-text'}`}>
                  MALE (Nam)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setGender('Female')}
                className={`flex-1 py-3 px-4 rounded-xl border items-center ${
                  gender === 'Female'
                    ? 'border-brand-primary dark:border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/10'
                    : 'border-brand-light-border dark:border-brand-dark-border bg-brand-light-card/40 dark:bg-brand-dark-card/40'
                }`}
              >
                <Text className={`font-bold text-sm ${gender === 'Female' ? 'text-brand-primary dark:text-brand-primary' : 'text-brand-light-text dark:text-brand-dark-text'}`}>
                  FEMALE (Nữ)
                </Text>
              </Pressable>
            </View>

            {/* Anime Character Preview frame */}
            <View className="items-center mb-8">
              <View className="w-52 h-72 rounded-2xl border border-brand-light-border dark:border-brand-dark-border bg-brand-light-card dark:bg-brand-dark-card overflow-hidden relative shadow-lg">
                <Image
                  source={require('@/assets/onboarding_character.png')}
                  className="w-full h-full opacity-90"
                  resizeMode="cover"
                />
                <View className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-full border border-brand-primary/30">
                  <Text className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">
                    {gender === 'Male' ? 'Aura Warrior Male' : 'Aura Warrior Female'}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Xác Nhận Nhân Vật
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 3:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Bạn bao nhiêu tuổi?
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-12">
              Tuổi được dùng để tính toán mức chuyển hóa năng lượng cơ bản (BMR).
            </Text>

            <View className="items-center my-6">
              <View className="flex-row items-baseline justify-center mb-4">
                <Text className="text-5xl font-extrabold text-brand-light-text dark:text-brand-dark-text tracking-tighter">
                  {age}
                </Text>
                <Text className="text-lg font-bold text-brand-primary ml-1 lowercase">tuổi</Text>
              </View>
              <Slider
                value={age}
                minValue={12}
                maxValue={80}
                onChange={(val) => setAge(Math.round(val))}
                size="lg"
                className="w-full h-8"
              >
                <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-2">
                  <SliderFilledTrack className="bg-brand-primary" />
                </SliderTrack>
                <SliderThumb className="bg-brand-primary w-6 h-6 border-2 border-brand-neutral" />
              </Slider>
            </View>

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center mt-10"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Xác Nhận Tuổi
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 4:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Chiều cao & Cân nặng
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-6">
              Các thông số sinh học cốt lõi dùng để thiết kế mức tạ recommend.
            </Text>

            {/* Sub-tabs height/weight */}
            <View className="flex-row justify-center space-x-4 mb-4">
              <Pressable
                onPress={() => setActiveBioTab('height')}
                className={`py-2 px-6 rounded-full border ${
                  activeBioTab === 'height'
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-brand-light-border dark:border-brand-dark-border'
                }`}
              >
                <Text className={`font-bold text-xs ${activeBioTab === 'height' ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                  CHIỀU CAO
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveBioTab('weight')}
                className={`py-2 px-6 rounded-full border ${
                  activeBioTab === 'weight'
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-brand-light-border dark:border-brand-dark-border'
                }`}
              >
                <Text className={`font-bold text-xs ${activeBioTab === 'weight' ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                  CÂN NẶNG
                </Text>
              </Pressable>
            </View>

            {activeBioTab === 'height' ? (
              <View className="items-center my-6">
                <View className="flex-row items-baseline justify-center mb-4">
                  <Text className="text-5xl font-extrabold text-brand-light-text dark:text-brand-dark-text tracking-tighter">
                    {height}
                  </Text>
                  <Text className="text-lg font-bold text-brand-primary ml-1 lowercase">cm</Text>
                </View>
                <Slider
                  value={height}
                  minValue={120}
                  maxValue={220}
                  onChange={(val) => setHeight(Math.round(val))}
                  size="lg"
                  className="w-full h-8"
                >
                  <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-2">
                    <SliderFilledTrack className="bg-brand-primary" />
                  </SliderTrack>
                  <SliderThumb className="bg-brand-primary w-6 h-6 border-2 border-brand-neutral" />
                </Slider>
              </View>
            ) : (
              <View className="items-center my-6">
                <View className="flex-row items-baseline justify-center mb-4">
                  <Text className="text-5xl font-extrabold text-brand-light-text dark:text-brand-dark-text tracking-tighter">
                    {weight}
                  </Text>
                  <Text className="text-lg font-bold text-brand-primary ml-1 lowercase">kg</Text>
                </View>
                <Slider
                  value={weight}
                  minValue={35}
                  maxValue={150}
                  onChange={(val) => setWeight(Math.round(val))}
                  size="lg"
                  className="w-full h-8"
                >
                  <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-2">
                    <SliderFilledTrack className="bg-brand-primary" />
                  </SliderTrack>
                  <SliderThumb className="bg-brand-primary w-6 h-6 border-2 border-brand-neutral" />
                </Slider>
              </View>
            )}

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center mt-6"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Tiếp Theo
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 5:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Tỷ lệ Mỡ & Cơ
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-8">
              Chỉ số tuỳ chọn. Nếu bạn chưa rõ, hệ thống sẽ sử dụng mức mặc định lý tưởng.
            </Text>

            <View className="space-y-6 mb-8">
              <View className="bg-brand-light-card/50 dark:bg-brand-dark-card/30 p-5 rounded-xl border border-brand-light-border dark:border-brand-dark-border/40">
                <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text uppercase tracking-wider mb-2">
                  Bodyfat (Tỷ lệ mỡ): {bodyFat}%
                </Text>
                <Slider
                  value={bodyFat}
                  minValue={5}
                  maxValue={45}
                  onChange={(val) => setBodyFat(Math.round(val))}
                  size="md"
                  className="w-full h-8 mt-2"
                >
                  <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-1.5">
                    <SliderFilledTrack className="bg-brand-primary" />
                  </SliderTrack>
                  <SliderThumb className="bg-brand-primary w-5 h-5 border-2 border-brand-neutral" />
                </Slider>
              </View>

              <View className="bg-brand-light-card/50 dark:bg-brand-dark-card/30 p-5 rounded-xl border border-brand-light-border dark:border-brand-dark-border/40">
                <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text uppercase tracking-wider mb-2">
                  Muscle (Tỷ lệ cơ): {musclePercent}%
                </Text>
                <Slider
                  value={musclePercent}
                  minValue={15}
                  maxValue={60}
                  onChange={(val) => setMusclePercent(Math.round(val))}
                  size="md"
                  className="w-full h-8 mt-2"
                >
                  <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-1.5">
                    <SliderFilledTrack className="bg-brand-primary" />
                  </SliderTrack>
                  <SliderThumb className="bg-brand-primary w-5 h-5 border-2 border-brand-neutral" />
                </Slider>
              </View>
            </View>

            <View className="flex-row space-x-4">
              <Pressable
                onPress={() => {
                  setBodyFat(gender === 'Male' ? 15 : 22);
                  setMusclePercent(gender === 'Male' ? 40 : 30);
                  nextStep();
                }}
                className="flex-1 border border-brand-primary/50 py-3.5 rounded-xl items-center justify-center bg-brand-light-card/20 dark:bg-brand-dark-card/20"
              >
                <Text className="text-brand-primary font-extrabold text-xs uppercase tracking-wider">
                  Mặc Định
                </Text>
              </Pressable>
              
              <Pressable
                onPress={nextStep}
                className="flex-1 bg-brand-primary py-3.5 rounded-xl items-center justify-center shadow-md"
              >
                <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                  Xác Nhận
                </Text>
              </Pressable>
            </View>
          </View>
        );

      case 6:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Thời gian xao nhãng hàng tuần?
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-6 px-4">
              Số giờ tiêu phí vào mạng xã hội, doom scrolling hoặc trì hoãn (Giảm xao nhãng sẽ tăng Focus & Discipline).
            </Text>

            {/* Circular Dash Dial (glowing emerald style) */}
            <View className="items-center mb-6">
              <CircularDial
                value={socialHours}
                max={60}
                unit="giờ"
                subtitle="xao nhãng / tuần"
                size={220}
              />
            </View>

            {/* Dial scale description */}
            <Text className="text-center font-bold text-xs text-brand-primary uppercase mb-6 tracking-wide">
              {socialHours <= 5
                ? '⚡ Cực kỳ kỷ luật'
                : socialHours <= 15
                  ? '🛡️ Trung bình lành mạnh'
                  : socialHours <= 30
                    ? '⚠️ Cần kiểm soát lại'
                    : '🚨 Quá nhiều xao nhãng'}
            </Text>

            {/* Gluestack Slider input */}
            <Slider
              value={socialHours}
              minValue={0}
              maxValue={80}
              onChange={(val) => setSocialHours(Math.round(val))}
              size="lg"
              className="w-full h-8 mt-4"
            >
              <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-2">
                <SliderFilledTrack className="bg-brand-primary" />
              </SliderTrack>
              <SliderThumb className="bg-brand-primary w-6 h-6 border-2 border-brand-neutral" />
            </Slider>

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center mt-6"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Ghi Nhận Chỉ Số
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 7:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Chỉ số Đọc sách
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-6">
              Gia tăng thuộc tính **Trí tuệ (Wisdom)** và **Độ tập trung (Focus)** cho nhân vật.
            </Text>

            <View className="bg-brand-light-card/40 dark:bg-brand-dark-card/40 border border-brand-light-border dark:border-brand-dark-border/40 p-5 rounded-2xl mb-6 space-y-4">
              <View>
                <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider mb-1">
                  Cuốn sách đang đọc (Không bắt buộc)
                </Text>
                <TextInput
                  value={bookTitle}
                  onChangeText={setBookTitle}
                  placeholder="Nhập tên cuốn sách gần đây..."
                  placeholderTextColor="#5C8276"
                  className="bg-brand-light-bg dark:bg-brand-dark-bg border border-brand-light-border dark:border-brand-dark-border/45 text-brand-light-text dark:text-brand-dark-text text-sm py-2.5 px-4 rounded-xl font-bold"
                />
              </View>

              <View>
                <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider mb-2">
                  Số trang sách dự kiến đọc / tuần: {bookPages} trang
                </Text>
                <Slider
                  value={bookPages}
                  minValue={0}
                  maxValue={300}
                  onChange={(val) => setBookPages(Math.round(val))}
                  size="md"
                  className="w-full h-8 mt-2"
                >
                  <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-1.5">
                    <SliderFilledTrack className="bg-brand-primary" />
                  </SliderTrack>
                  <SliderThumb className="bg-brand-primary w-5 h-5 border-2 border-brand-neutral" />
                </Slider>
              </View>

              {/* Book Photo upload mock */}
              <View className="flex-row justify-between items-center pt-2">
                <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text">
                  Bằng chứng đọc sách (Chụp ảnh)
                </Text>
                <Pressable
                  onPress={() => setBookPhotoMock(!bookPhotoMock)}
                  className={`px-3 py-1.5 rounded-lg border ${
                    bookPhotoMock 
                      ? 'border-brand-primary dark:border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/10' 
                      : 'border-brand-light-border dark:border-brand-dark-border/60 bg-transparent dark:bg-transparent'
                  }`}
                >
                  <Text className={`text-[10px] font-bold uppercase tracking-wider ${bookPhotoMock ? 'text-brand-primary dark:text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                    {bookPhotoMock ? '✓ Đã chụp ảnh' : '📸 Chụp ảnh'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Xác Nhận Chỉ Số
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 8:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Rèn luyện Sức mạnh
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-6">
              Rèn luyện cơ bắp giúp tăng thuộc tính **Sức mạnh (Strength)** của bạn.
            </Text>

            <View className="bg-brand-light-card/40 dark:bg-brand-dark-card/40 border border-brand-light-border dark:border-brand-dark-border/40 p-5 rounded-2xl mb-6 space-y-5">
              {/* Training frequency */}
              <View>
                <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider mb-2">
                  Tần suất tập tạ: {trainDays} ngày / tuần
                </Text>
                <Slider
                  value={trainDays}
                  minValue={0}
                  maxValue={7}
                  onChange={(val) => setTrainDays(Math.round(val))}
                  size="md"
                  className="w-full h-8 mt-2"
                >
                  <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-1.5">
                    <SliderFilledTrack className="bg-brand-primary" />
                  </SliderTrack>
                  <SliderThumb className="bg-brand-primary w-5 h-5 border-2 border-brand-neutral" />
                </Slider>
              </View>

              {/* Priority exercises */}
              <View>
                <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider mb-3">
                  Các bài tập ưu tiên hàng đầu
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {['Lat Pulldown', 'Bench Press', 'Squat', 'Deadlift', 'Dumbbell Curl'].map((ex) => {
                    const isSelected = focusExercises.includes(ex);
                    return (
                      <Pressable
                        key={ex}
                        onPress={() => toggleFocusExercise(ex)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-bold ${
                          isSelected
                            ? 'border-brand-primary dark:border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/10 text-brand-primary dark:text-brand-primary'
                            : 'border-brand-light-border dark:border-brand-dark-border/60 bg-transparent dark:bg-transparent text-brand-light-text-muted dark:text-brand-dark-text-muted'
                        }`}
                      >
                        <Text className={`text-[10px] font-bold ${isSelected ? 'text-brand-primary dark:text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                          {isSelected ? '✓ ' : ''}{ex}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Tiếp Theo
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 9:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Mục tiêu Dinh dưỡng
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-6">
              Thiết lập năng lượng nạp cơ bản. Tỷ lệ đạm sẽ đóng góp vào **Strength**.
            </Text>

            <View className="space-y-6 mb-8">
              <View className="bg-brand-light-card/40 dark:bg-brand-dark-card/30 p-4 rounded-xl border border-brand-light-border dark:border-brand-dark-border/40">
                <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text uppercase tracking-wider mb-2">
                  Tổng Calo / ngày: {calories} kcal
                </Text>
                <Slider
                  value={calories}
                  minValue={1200}
                  maxValue={4000}
                  step={50}
                  onChange={(val) => setCalories(Math.round(val))}
                  size="md"
                  className="w-full h-8 mt-2"
                >
                  <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-1.5">
                    <SliderFilledTrack className="bg-brand-primary" />
                  </SliderTrack>
                  <SliderThumb className="bg-brand-primary w-5 h-5 border-2 border-brand-neutral" />
                </Slider>
              </View>

              <View className="bg-brand-light-card/40 dark:bg-brand-dark-card/30 p-4 rounded-xl border border-brand-light-border dark:border-brand-dark-border/40">
                <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text uppercase tracking-wider mb-2">
                  Lượng Protein / ngày: {protein} g
                </Text>
                <Slider
                  value={protein}
                  minValue={40}
                  maxValue={250}
                  step={5}
                  onChange={(val) => setProtein(Math.round(val))}
                  size="md"
                  className="w-full h-8 mt-2"
                >
                  <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-1.5">
                    <SliderFilledTrack className="bg-brand-primary" />
                  </SliderTrack>
                  <SliderThumb className="bg-brand-primary w-5 h-5 border-2 border-brand-neutral" />
                </Slider>
              </View>
            </View>

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Xác Nhận Dinh Dưỡng
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 10:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Luyện tập Cardio & Thể thao
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-8 px-4">
              Vận động ngoài lề và tim mạch giúp phát triển thuộc tính **Tự tin (Confidence)**.
            </Text>

            <View className="bg-brand-light-card/40 dark:bg-brand-dark-card/40 border border-brand-light-border dark:border-brand-dark-border/40 p-5 rounded-2xl mb-6 space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-bold text-brand-light-text dark:text-brand-dark-text">
                  Có hoạt động Cardio / Thể thao?
                </Text>
                <Pressable
                  onPress={() => setCardioOption(!cardioOption)}
                  className={`px-4 py-2 rounded-xl border ${
                    cardioOption
                      ? 'border-brand-primary dark:border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/10'
                      : 'border-brand-light-border dark:border-brand-dark-border/60 bg-transparent dark:bg-transparent'
                  }`}
                >
                  <Text className={`text-xs font-bold ${cardioOption ? 'text-brand-primary dark:text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                    {cardioOption ? 'CÓ' : 'KHÔNG'}
                  </Text>
                </Pressable>
              </View>

              {cardioOption && (
                <>
                  <View className="pt-2">
                    <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider mb-2">
                      Môn thể thao ưu tiên
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {['Đi bộ dốc', 'Cầu lông', 'Bóng đá', 'Chạy bộ'].map((sport) => {
                        const isSelected = cardioSport === sport;
                        return (
                          <Pressable
                            key={sport}
                            onPress={() => setCardioSport(sport)}
                            className={`px-3 py-1.5 rounded-full border ${
                              isSelected
                                ? 'border-brand-primary dark:border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/10 text-brand-primary dark:text-brand-primary'
                                : 'border-brand-light-border dark:border-brand-dark-border/60 bg-transparent dark:bg-transparent text-brand-light-text-muted dark:text-brand-dark-text-muted'
                            }`}
                          >
                            <Text className={`text-[10px] font-bold ${isSelected ? 'text-brand-primary dark:text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                              {sport}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View className="pt-2">
                    <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider mb-1">
                      Calo tiêu thụ dự tính: {cardioCalories} kcal
                    </Text>
                    <Slider
                      value={cardioCalories}
                      minValue={100}
                      maxValue={1000}
                      step={50}
                      onChange={(val) => setCardioCalories(Math.round(val))}
                      size="md"
                      className="w-full h-8 mt-2"
                    >
                      <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-1.5">
                        <SliderFilledTrack className="bg-brand-primary" />
                      </SliderTrack>
                      <SliderThumb className="bg-brand-primary w-5 h-5 border-2 border-brand-neutral" />
                    </Slider>
                  </View>
                </>
              )}
            </View>

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Tiếp Theo
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 11:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Thời gian dậy & Giấc ngủ
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-6">
              Giấc ngủ sâu giúp hồi sinh năng lượng và tăng thuộc tính **Tự tin (Confidence)**.
            </Text>

            <View className="bg-brand-light-card/40 dark:bg-brand-dark-card/40 border border-brand-light-border dark:border-brand-dark-border/40 p-5 rounded-2xl mb-6 space-y-4">
              <View>
                <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider mb-2">
                  Giờ dậy trung bình
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {['05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM'].map((time) => {
                    const isSelected = wakeTime === time;
                    return (
                      <Pressable
                        key={time}
                        onPress={() => setWakeTime(time)}
                        className={`px-4 py-2 rounded-xl border ${
                          isSelected
                            ? 'border-brand-primary dark:border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/10 text-brand-primary dark:text-brand-primary'
                            : 'border-brand-light-border dark:border-brand-dark-border/60 bg-transparent dark:bg-transparent text-brand-light-text-muted dark:text-brand-dark-text-muted'
                        }`}
                      >
                        <Text className={`text-[10px] font-bold ${isSelected ? 'text-brand-primary dark:text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                          {time}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="pt-2">
                <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider mb-2">
                  Đánh giá chất lượng ngủ
                </Text>
                <View className="flex-row justify-between space-x-2">
                  {[
                    { key: 'good', label: 'Rất tốt / Sâu giấc' },
                    { key: 'medium', label: 'Bình thường' },
                    { key: 'bad', label: 'Chập chờn / Thiếu ngủ' }
                  ].map((item) => {
                    const isSelected = sleepQuality === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => setSleepQuality(item.key as any)}
                        className={`flex-1 py-3 px-1.5 rounded-xl border items-center justify-center ${
                          isSelected
                            ? 'border-brand-primary dark:border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/10'
                            : 'border-brand-light-border dark:border-brand-dark-border/60 bg-transparent dark:bg-transparent'
                        }`}
                      >
                        <Text className={`text-[9px] font-bold text-center ${isSelected ? 'text-brand-primary dark:text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Xác Nhận Giấc Ngủ
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 12:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              Uống nước & Nhắc nhở
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-6">
              Đủ nước giữ cơ bắp sung mãn và nâng cao chỉ số **Kỷ luật (Discipline)**.
            </Text>

            <View className="bg-brand-light-card/40 dark:bg-brand-dark-card/40 border border-brand-light-border dark:border-brand-dark-border/40 p-5 rounded-2xl mb-6 space-y-4">
              <View>
                <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider mb-2">
                  Mục tiêu uống nước hàng ngày: {waterTarget} Lít
                </Text>
                <Slider
                  value={waterTarget}
                  minValue={1.0}
                  maxValue={5.0}
                  step={0.1}
                  onChange={(val) => setWaterTarget(Math.round(val * 10) / 10)}
                  size="md"
                  className="w-full h-8 mt-2"
                >
                  <SliderTrack className="bg-brand-light-border dark:bg-brand-dark-border h-1.5">
                    <SliderFilledTrack className="bg-brand-primary" />
                  </SliderTrack>
                  <SliderThumb className="bg-brand-primary w-5 h-5 border-2 border-brand-neutral" />
                </Slider>
              </View>

              <View className="flex-row justify-between items-center pt-2 border-t border-brand-light-border/40 dark:border-brand-dark-border/40">
                <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text">
                  Nhắc uống nước định kỳ mỗi 15p
                </Text>
                <Pressable
                  onPress={() => setWaterReminder(!waterReminder)}
                  className={`px-4 py-2 rounded-xl border ${
                    waterReminder
                      ? 'border-brand-primary dark:border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/10'
                      : 'border-brand-light-border dark:border-brand-dark-border/60 bg-transparent dark:bg-transparent'
                  }`}
                >
                  <Text className={`text-xs font-bold ${waterReminder ? 'text-brand-primary dark:text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                    {waterReminder ? 'BẬT' : 'TẮT'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Tổng Kết Hồ Sơ
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 13:
        return (
          <View className="flex-1 justify-center px-6 relative">
            {/* Glowing Character Background overlay */}
            <View className="absolute inset-0 items-center justify-center opacity-40">
              <Image
                source={require('@/assets/onboarding_rating.png')}
                className="w-full h-[120%]"
                resizeMode="cover"
              />
            </View>

            <Text className="text-sm font-bold text-brand-primary uppercase text-center tracking-widest mb-1 z-10">
              Phân Tích Thói Quen
            </Text>
            <Text className="text-3xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tighter mb-6 z-10">
              Your Current Rating
            </Text>

            {/* RPG Stats Card Layout (Matches Screen 3) */}
            <View className="bg-black/80 border border-brand-primary/30 rounded-3xl p-6 shadow-2xl mb-8 z-10">
              {/* Level & XP block */}
              <View className="flex-row items-center justify-between pb-4 border-b border-brand-primary/20 mb-4">
                <View className="flex-row items-center">
                  <View className="bg-brand-primary px-4 py-2 rounded-xl">
                    <Text className="text-black font-extrabold text-lg leading-none">1</Text>
                    <Text className="text-[7px] text-black font-bold uppercase tracking-wider leading-none mt-0.5">LEVEL</Text>
                  </View>
                  <View className="ml-3">
                    <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text uppercase tracking-widest">
                      {name || 'AURA WARRIOR'}
                    </Text>
                    <Text className="text-[8px] text-brand-primary uppercase tracking-wider mt-0.5">
                      {gender === 'Male' ? 'Male Warrior' : 'Female Architect'}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold">
                    125 XP to Lvl 2
                  </Text>
                  {/* Progress bar */}
                  <View className="w-24 h-1.5 bg-brand-light-border dark:bg-brand-dark-border rounded-full mt-1 overflow-hidden">
                    <View className="h-full bg-brand-primary w-[15%] rounded-full" />
                  </View>
                </View>
              </View>

              {/* Attributes List */}
              <View className="space-y-3">
                {/* Attribute 1 */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Brain size={14} className="text-brand-primary mr-2" />
                    <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text">Wisdom (Trí tuệ)</Text>
                  </View>
                  <Text className="text-sm font-black text-brand-primary">{wisdom}</Text>
                </View>

                {/* Attribute 2 */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Award size={14} className="text-brand-primary mr-2" />
                    <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text">Confidence (Tự tin)</Text>
                  </View>
                  <Text className="text-sm font-black text-brand-primary">{confidence}</Text>
                </View>

                {/* Attribute 3 */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Dumbbell size={14} className="text-brand-primary mr-2" />
                    <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text">Strength (Sức mạnh)</Text>
                  </View>
                  <Text className="text-sm font-black text-brand-primary">{strength}</Text>
                </View>

                {/* Attribute 4 */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Flame size={14} className="text-brand-primary mr-2" />
                    <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text">Discipline (Kỷ luật)</Text>
                  </View>
                  <Text className="text-sm font-black text-brand-primary">{discipline}</Text>
                </View>

                {/* Attribute 5 */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Compass size={14} className="text-brand-primary mr-2" />
                    <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text">Focus (Tập trung)</Text>
                  </View>
                  <Text className="text-sm font-black text-brand-primary">{focus}</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={nextStep}
              className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center z-10"
            >
              <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                Kích Hoạt Hồ Sơ Aura
              </Text>
              <ChevronRight size={14} className="text-brand-secondary dark:text-brand-neutral ml-1" />
            </Pressable>
          </View>
        );

      case 14:
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-black text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tight mb-2">
              {isLoginMode ? 'Đăng Nhập Tài Khoản' : 'Kích Hoạt Tài Khoản'}
            </Text>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center leading-relaxed mb-8 px-4">
              {isLoginMode 
                ? 'Nhập email và mật khẩu của bạn để tải lại tiến trình Aura.'
                : 'Nhập thông tin xác thực để đồng bộ chỉ số và lưu hồ sơ Aura.'}
            </Text>

            {/* Config warning banner */}
            {!isSupabaseConfigured && (
              <View className="flex-row items-center bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl mb-6 space-x-2">
                <ShieldAlert size={16} className="text-amber-500" />
                <View className="flex-1">
                  <Text className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                    Sandbox Mode Hoạt Động (Offline)
                  </Text>
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted">
                    Supabase chưa cấu hình. Tài khoản sẽ được giả lập lưu offline.
                  </Text>
                </View>
              </View>
            )}

            <View className="bg-brand-light-card/40 dark:bg-brand-dark-card/40 border border-brand-light-border dark:border-brand-dark-border/40 p-5 rounded-2xl mb-6 space-y-4">
              <View>
                <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider mb-1">
                  Địa Chỉ Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@domain.com"
                  placeholderTextColor="#5C8276"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-brand-light-bg dark:bg-brand-dark-bg border border-brand-light-border dark:border-brand-dark-border/45 text-brand-light-text dark:text-brand-dark-text text-sm py-2.5 px-4 rounded-xl font-bold"
                />
              </View>

              <View>
                <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider mb-1">
                  Mật Khẩu
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#5C8276"
                  secureTextEntry
                  autoCapitalize="none"
                  className="bg-brand-light-bg dark:bg-brand-dark-bg border border-brand-light-border dark:border-brand-dark-border/45 text-brand-light-text dark:text-brand-dark-text text-sm py-2.5 px-4 rounded-xl font-bold"
                />
              </View>
            </View>

            {authLoading ? (
              <ActivityIndicator size="small" color="#8EB69B" className="py-3" />
            ) : (
              <Pressable
                onPress={handleRegisterOrLogin}
                className="bg-brand-primary py-3.5 rounded-xl items-center shadow-md flex-row justify-center"
              >
                <Text className="text-brand-secondary dark:text-brand-neutral font-extrabold text-xs uppercase tracking-wider">
                  {isLoginMode ? 'Đăng Nhập Node' : 'Bắt Đầu Kích Hoạt (Ascension)'}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setIsLoginMode(!isLoginMode)}
              className="mt-6 py-2 items-center"
            >
              <Text className="text-[11px] text-brand-primary font-bold uppercase tracking-wider">
                {isLoginMode ? 'Tạo tài khoản Aura mới' : 'Đã có tài khoản? Đăng nhập'}
              </Text>
            </Pressable>
          </View>
        );

      default:
        return null;
    }
  };

  const isScrollEnabled = [0, 1, 7, 13, 14].includes(step);

  return (
    <View className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: 40, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={isScrollEnabled}
        className="flex-1"
      >
        {/* Step progress bar and back button */}
        {step > 0 && (
          <View className="flex-row items-center px-6 mb-6 justify-between h-8 relative">
            <Pressable
              onPress={prevStep}
              className="w-8 h-8 rounded-full border border-brand-light-border dark:border-brand-dark-border/60 items-center justify-center bg-brand-light-card/40 dark:bg-brand-dark-card/40"
            >
              <ArrowLeft size={14} className="text-brand-primary" />
            </Pressable>

            {/* Filled progress bar */}
            <View className="flex-1 mx-4 h-1 bg-brand-light-border dark:bg-brand-dark-border/40 rounded-full overflow-hidden">
              <View
                style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
                className="h-full bg-brand-primary rounded-full"
              />
            </View>

            <Text className="text-[10px] font-mono text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold">
              {step}/{totalSteps - 1}
            </Text>
          </View>
        )}

        {/* Current Step Content */}
        {renderStepContent()}
      </ScrollView>
    </View>
  );
}
