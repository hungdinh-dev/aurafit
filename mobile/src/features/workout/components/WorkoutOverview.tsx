import React from 'react';
import { Pressable, ScrollView, Image, Alert } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { 
  Dumbbell, 
  Clock, 
  Flame, 
  Zap, 
  Trash2, 
  ShieldAlert, 
  Play, 
  Award,
  Shield,
  Check,
  Moon,
  Plus,
  HelpCircle,
  ArrowLeftRight
} from 'lucide-react-native';
import { Workout, WorkoutPlan, WorkoutPlanExercise } from '../services/workoutService';

interface WorkoutOverviewProps {
  plans: WorkoutPlan[];
  selectedPlan: WorkoutPlan | null;
  setSelectedPlan: (plan: WorkoutPlan | null) => void;
  planExercises: WorkoutPlanExercise[];
  workouts: Workout[];
  isOfflineMode: boolean;
  onBeginAscension: (initialExerciseId?: string) => void;
  onDeleteWorkoutLog: (id: string) => void;
  getExerciseImage: (name: string) => string;
  t: (key: any) => string;
  userProfile: any;
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  onOpenCustomizePlan: () => void;
  onUseShield: (day: number) => void;
  onSwapPlanExercise: (planExerciseId: string, index: number) => void;
}

export default function WorkoutOverview({
  plans,
  selectedPlan,
  setSelectedPlan,
  planExercises,
  workouts,
  isOfflineMode,
  onBeginAscension,
  onDeleteWorkoutLog,
  getExerciseImage,
  t,
  userProfile,
  selectedDay,
  setSelectedDay,
  onOpenCustomizePlan,
  onUseShield,
  onSwapPlanExercise
}: WorkoutOverviewProps) {
  const streak = userProfile?.streak_days || 0;
  const shields = userProfile?.aura_shields || 0;
  const trainDays = userProfile?.train_days || 3;

  // Vietnam date helpers
  const getVietnamDate = (): Date => {
    const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
    return new Date(utc + 3600000 * 7);
  };

  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday is 1st day of week
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const vnDate = getVietnamDate();
  const startOfWeek = getStartOfWeek(vnDate);

  // Compute selected day details
  const selectedDate = new Date(startOfWeek);
  selectedDate.setDate(startOfWeek.getDate() + (selectedDay - 1));

  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  
  const dateString = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}`;
  const dayOfWeekName = dayNames[selectedDate.getDay()];

  // Calculate completion status of this week (MON - SUN)
  const completedDays = Array(8).fill(false);
  workouts.forEach(w => {
    const wDate = new Date(w.created_at);
    if (wDate >= startOfWeek) {
      const day = wDate.getDay();
      const dayIndex = day === 0 ? 7 : day;
      completedDays[dayIndex] = true;
    }
  });

  // Check if a day has a plan
  const dayHasPlan = (dayNum: number): boolean => {
    return plans.some(p => p.day_of_week === dayNum);
  };

  const currentDayOfWeek = vnDate.getDay() === 0 ? 7 : vnDate.getDay();
  const metadata = userProfile?.metadata || {};
  const shieldedDays: number[] = metadata.shielded_days || [];

  // Yesterday logic
  const yesterdayDay = currentDayOfWeek > 1 ? currentDayOfWeek - 1 : null;
  const yesterdayHasPlan = yesterdayDay ? dayHasPlan(yesterdayDay) : false;
  const yesterdayCompleted = yesterdayDay ? completedDays[yesterdayDay] : false;
  const yesterdayShielded = yesterdayDay ? shieldedDays.includes(yesterdayDay) : false;
  const showYesterdayWarning = yesterdayHasPlan && !yesterdayCompleted && !yesterdayShielded;

  // Today logic
  const todayHasPlan = dayHasPlan(currentDayOfWeek);
  const todayCompleted = completedDays[currentDayOfWeek];
  const todayShielded = shieldedDays.includes(currentDayOfWeek);
  const showTodayWarning = todayHasPlan && !todayCompleted && !todayShielded;

  // Days list definition
  const weekDays = [
    { label: 'MON', val: 1 },
    { label: 'TUE', val: 2 },
    { label: 'WED', val: 3 },
    { label: 'THU', val: 4 },
    { label: 'FRI', val: 5 },
    { label: 'SAT', val: 6 },
    { label: 'SUN', val: 7 }
  ];

  const totalCompletedWalks = workouts.length;
  const progressPercent = Math.min(100, Math.round((totalCompletedWalks / trainDays) * 100));

  return (
    <ScrollView 
      className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg"
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack space="lg">
        {/* Connection Mode Status Notice */}
        {isOfflineMode && (
          <HStack space="xs" className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl items-center">
            <ShieldAlert size={16} className="text-amber-500" />
            <Text className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex-1">
              Sandbox - Sử dụng dữ liệu offline (Offline Sandbox)
            </Text>
          </HStack>
        )}

        {/* HEADER BAR (FLOWFIT / AURAFIT style) */}
        <HStack className="justify-between items-center mt-2">
          <Heading size="md" className="text-brand-light-text dark:text-brand-dark-text font-black tracking-tighter">
            ⚡ AURAFIT
          </Heading>

          {/* Streak & Shield pill badge */}
          <HStack space="xs" className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border px-3 py-1.5 rounded-full items-center">
            <HStack space="xs" className="items-center mr-2">
              <Flame size={14} className="text-brand-primary" fill="#8EB69B" />
              <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text">{streak}</Text>
            </HStack>
            <HStack space="xs" className="items-center">
              <Shield size={14} className="text-brand-primary" fill="#8EB69B" />
              <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text">{shields}</Text>
            </HStack>
          </HStack>
        </HStack>

        {/* TOP WEEKLY TRACKER ACTIVITY BOX */}
        <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-3xl p-5 shadow-sm">
          <HStack className="justify-between items-center mb-3">
            <VStack>
              <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                {dateString}
              </Text>
              <Heading size="sm" className="text-brand-light-text dark:text-brand-dark-text font-black mt-0.5">
                {dayOfWeekName}
              </Heading>
            </VStack>

            <VStack className="items-end">
              <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-widest">
                WEEKLY ACTIVITY
              </Text>
              {/* Mini dots */}
              <HStack space="xs" className="mt-1">
                {weekDays.map(d => {
                  const isCompleted = completedDays[d.val];
                  const hasPlan = dayHasPlan(d.val);
                  return (
                    <Box 
                      key={d.val} 
                      className={`w-3.5 h-3.5 rounded-full border items-center justify-center ${
                        isCompleted 
                          ? "bg-brand-primary border-brand-primary" 
                          : !hasPlan 
                            ? "bg-brand-primary/10 border-brand-primary/30" 
                            : "bg-transparent border-brand-light-border dark:border-brand-dark-border"
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={8} className="text-brand-neutral" strokeWidth={4} />
                      ) : !hasPlan ? (
                        <Moon size={7} className="text-brand-primary/60" />
                      ) : null}
                    </Box>
                  );
                })}
              </HStack>
            </VStack>
          </HStack>

          {/* HORIZONTAL 7-DAY WEEK VIEW SELECTOR */}
          <HStack className="justify-between pt-3 border-t border-brand-light-border/20 dark:border-brand-dark-border/20">
            {weekDays.map(d => {
              const isSelected = selectedDay === d.val;
              const isCompleted = completedDays[d.val];
              const hasPlan = dayHasPlan(d.val);
              
              return (
                <Pressable
                  key={d.val}
                  onPress={() => setSelectedDay(d.val)}
                  className="items-center"
                >
                  <Text className={`text-[8px] font-bold ${
                    isSelected 
                      ? "text-brand-primary" 
                      : "text-brand-light-text-muted dark:text-brand-dark-text-muted"
                  }`}>
                    {d.label}
                  </Text>
                  
                  <Box 
                    className={`w-10 h-10 rounded-full items-center justify-center mt-1.5 border ${
                      isSelected 
                        ? "border-brand-primary border-2 bg-brand-primary/5" 
                        : "border-brand-light-border dark:border-brand-dark-border bg-brand-light-bg dark:bg-brand-dark-bg/60"
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={14} className="text-brand-primary" strokeWidth={3} />
                    ) : !hasPlan ? (
                      <Moon size={14} className="text-brand-primary/60" />
                    ) : (
                      <Box className="w-2.5 h-2.5 rounded-full bg-brand-light-border/80 dark:bg-brand-dark-border/40" />
                    )}
                  </Box>
                </Pressable>
              );
            })}
          </HStack>
        </Box>

        {/* SHIELD WARNING NOTIFICATION BOX */}
        {(showYesterdayWarning || showTodayWarning) && (
          <Box className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 shadow-sm">
            <VStack space="md">
              <HStack space="xs" className="items-center">
                <ShieldAlert size={18} className="text-amber-500" />
                <Heading size="xs" className="text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider text-xs">
                  CẢNH BÁO CHUỖI TẬP (STREAK WARNING)
                </Heading>
              </HStack>

              {showYesterdayWarning && (
                <VStack space="xs">
                  <Text className="text-xs text-brand-light-text dark:text-brand-dark-text leading-relaxed">
                    Bạn đã bỏ lỡ buổi tập ngày hôm qua (Thứ {yesterdayDay === 7 ? "Nhật" : (yesterdayDay || 0) + 1}). 
                    Hãy sử dụng 1 khiên để bảo vệ chuỗi <Text className="font-bold text-brand-primary">{streak} ngày</Text> của bạn!
                  </Text>
                  <HStack className="justify-end mt-1">
                    <Button 
                      size="sm" 
                      variant="solid" 
                      action="primary" 
                      className="bg-brand-primary rounded-xl py-2 px-4 shadow-sm"
                      disabled={shields === 0}
                      onPress={() => yesterdayDay && onUseShield(yesterdayDay)}
                    >
                      <Shield size={12} className="text-brand-secondary dark:text-brand-neutral mr-1.5" fill="#1C1C1E" />
                      <ButtonText className="text-brand-secondary dark:text-brand-neutral font-bold text-2xs uppercase">
                        {shields > 0 ? "Dùng 1 Khiên Cứu Chuỗi" : "Hết Khiên Bảo Vệ"}
                      </ButtonText>
                    </Button>
                  </HStack>
                </VStack>
              )}

              {showYesterdayWarning && showTodayWarning && <Box className="h-px bg-amber-500/20 my-1" />}

              {showTodayWarning && (
                <VStack space="xs">
                  <Text className="text-xs text-brand-light-text dark:text-brand-dark-text leading-relaxed">
                    Hôm nay bạn có giáo án cần luyện tập. Hãy bắt đầu tập ngay để giữ vững chuỗi <Text className="font-bold text-brand-primary">{streak} ngày</Text>, 
                    hoặc bạn có thể dùng 1 khiên để bảo vệ ngày hôm nay.
                  </Text>
                  <HStack className="justify-end mt-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      action="primary" 
                      className="border-brand-primary rounded-xl py-2 px-4"
                      disabled={shields === 0}
                      onPress={() => onUseShield(currentDayOfWeek)}
                    >
                      <Shield size={12} className="text-brand-primary mr-1.5" />
                      <ButtonText className="text-brand-primary font-bold text-2xs uppercase">
                        {shields > 0 ? "Dùng 1 Khiên Nghỉ Ngơi" : "Hết Khiên Bảo Vệ"}
                      </ButtonText>
                    </Button>
                  </HStack>
                </VStack>
              )}
            </VStack>
          </Box>
        )}

        {/* ACTIVE PLAN DETAIL PANEL FOR SELECTED DAY */}
        {selectedPlan ? (
          <VStack space="md">
            <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <VStack space="xs">
                <HStack className="justify-between items-center">
                  <Text className="text-[10px] text-brand-primary uppercase tracking-widest font-black">
                    GIÁO ÁN HÔM NAY (TODAY'S QUEST)
                  </Text>
                  <HStack space="xs" className="items-center bg-brand-primary/10 px-2 py-0.5 rounded-full">
                    <Award size={10} className="text-brand-primary" />
                    <Text className="text-[9px] text-brand-primary font-bold uppercase font-mono">
                      {selectedPlan.difficulty === 'Beginner' ? 'Dễ' : selectedPlan.difficulty === 'Intermediate' ? 'Vừa' : 'Khó'}
                    </Text>
                  </HStack>
                </HStack>
                
                <Heading size="md" className="text-brand-light-text dark:text-brand-dark-text font-black mt-1">
                  {selectedPlan.name}
                </Heading>
                <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted mt-1 leading-relaxed">
                  {selectedPlan.description || 'Tiến trình xây dựng hình thể đại diện AuraFit.'}
                </Text>

                <HStack space="xl" className="mt-4 pt-3 border-t border-brand-light-border/40 dark:border-brand-dark-border/40">
                  <VStack>
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest font-bold">Bài tập</Text>
                    <Text className="text-sm text-brand-light-text dark:text-brand-dark-text font-bold mt-0.5">
                      {planExercises.length} bài
                    </Text>
                  </VStack>
                  <Box className="w-px h-8 bg-brand-light-border/60 dark:bg-brand-dark-border/60 align-self-center" />
                  <VStack>
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest font-bold">Thời gian ước lượng</Text>
                    <Text className="text-sm text-brand-light-text dark:text-brand-dark-text font-bold mt-0.5">
                      {planExercises.length * 15} phút
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>

            {/* CUSTOMIZE PLAN BUTTON ONLY */}
            <HStack className="justify-end mt-1">
              <Button 
                size="sm" 
                variant="outline" 
                action="primary" 
                className="border-brand-primary hover:bg-brand-primary/5 rounded-2xl py-2 px-4 shadow-sm active:scale-95"
                onPress={onOpenCustomizePlan}
              >
                <Plus size={12} className="text-brand-primary mr-1" />
                <ButtonText className="text-brand-primary font-bold uppercase text-2xs tracking-wider">
                  Tùy Chỉnh Giáo Án
                </ButtonText>
              </Button>
            </HStack>

            {/* Exercises List */}
            <VStack space="md" className="mt-2">
              <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text uppercase tracking-widest text-[9px] font-extrabold">
                BÀI TẬP CHI TIẾT
              </Heading>

              {planExercises.length === 0 ? (
                <Box className="py-8 items-center justify-center border border-dashed border-brand-light-border dark:border-brand-dark-border rounded-2xl bg-brand-light-card/25 dark:bg-brand-dark-card/10">
                  <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted italic">
                    Chưa có bài tập nào được thêm vào giáo án. Bấm (+) để thêm!
                  </Text>
                </Box>
              ) : (
                planExercises.map((pe, idx) => {
                  const exName = pe.exercises?.name || 'Bài tập';
                  const exMuscle = pe.exercises?.primary_muscle || 'Lưng';
                  const instructions = pe.exercises?.instructions || 'Thực hiện động tác chuẩn.';
                  
                  return (
                    <Box 
                      key={pe.id}
                      className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl overflow-hidden shadow-sm h-32"
                    >
                      <HStack className="h-full">
                        {/* Left Side Image */}
                        <Box className="w-[30%] bg-neutral-900 border-r border-brand-light-border/30 dark:border-brand-dark-border/30 h-full">
                          <Image 
                            source={{ uri: getExerciseImage(exName) }}
                            className="w-full h-full object-cover opacity-80"
                            resizeMode="cover"
                          />
                        </Box>

                        {/* Right Side Details */}
                        <VStack className="w-[70%] p-4 justify-between" space="xs">
                          <VStack>
                            <HStack className="justify-between items-center mb-0.5">
                              <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold font-mono tracking-widest uppercase">
                                BÀI SỐ {idx + 1}
                              </Text>
                              <HStack space="xs" className="items-center">
                                <Pressable
                                  onPress={() => onSwapPlanExercise(pe.id, idx)}
                                  className="p-1 rounded bg-brand-primary/10 active:scale-90"
                                >
                                  <ArrowLeftRight size={10} className="text-brand-primary" />
                                </Pressable>
                                <Text className="text-[9px] text-brand-primary font-bold bg-brand-primary/10 px-1.5 py-0.5 rounded-full ml-1">
                                  {exMuscle}
                                </Text>
                              </HStack>
                            </HStack>
                            
                            <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-black text-xs" numberOfLines={1}>
                              {exName}
                            </Heading>
                            
                            <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted leading-normal mt-0.5" numberOfLines={1}>
                              {instructions}
                            </Text>
                          </VStack>

                          <HStack className="justify-between items-center border-t border-brand-light-border/20 dark:border-brand-dark-border/20 pt-2">
                            <HStack space="md" className="items-center">
                              <HStack space="xs" className="items-center">
                                <Dumbbell size={10} className="text-brand-primary" />
                                <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono">{pe.default_sets} hiệp</Text>
                              </HStack>
                              <HStack space="xs" className="items-center">
                                <Clock size={10} className="text-brand-primary" />
                                <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono">{pe.default_reps_min}-{pe.default_reps_max} reps</Text>
                              </HStack>
                            </HStack>

                            <Pressable
                              onPress={() => {
                                if (selectedDay !== currentDayOfWeek) {
                                  Alert.alert('Không thể bắt đầu', 'Bạn chỉ có thể thực hiện tập luyện ngày hôm nay.');
                                } else {
                                  onBeginAscension(pe.id);
                                }
                              }}
                              disabled={selectedDay !== currentDayOfWeek}
                              className={`flex-row items-center px-2.5 py-1.5 rounded-xl ${
                                selectedDay === currentDayOfWeek
                                  ? "bg-brand-primary active:scale-95"
                                  : "bg-neutral-300 dark:bg-neutral-700 opacity-50"
                              }`}
                            >
                              <Play size={8} className={selectedDay === currentDayOfWeek ? "text-brand-secondary dark:text-brand-neutral mr-1" : "text-neutral-500 mr-1"} fill={selectedDay === currentDayOfWeek ? "#1C1C1E" : "#777"} />
                              <Text className={`text-[9px] font-bold ${
                                selectedDay === currentDayOfWeek ? "text-brand-secondary dark:text-brand-neutral" : "text-neutral-500"
                              }`}>BẮT ĐẦU</Text>
                            </Pressable>
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                  );
                })
              )}
            </VStack>
          </VStack>
        ) : (
          /* EMPTY PLAN STATE (REST DAY / DAY OFF) */
          <Box className="bg-brand-light-card/50 dark:bg-brand-dark-card/50 border border-brand-light-border dark:border-brand-dark-border rounded-3xl p-8 items-center justify-center shadow-sm">
            <Moon size={36} className="text-brand-primary mb-3" fill="#8EB69B" />
            <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-black text-center">
              Hôm Nay Là Ngày Nghỉ (Rest Day)
            </Heading>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted mt-2 text-center leading-relaxed">
              Bạn có thể sử dụng khiên bảo vệ `🛡️` để giữ chuỗi tập luyện (Streak) mà không bị áp lực. Hãy nghỉ ngơi đầy đủ để cơ bắp hồi phục!
            </Text>

            <Button 
              size="md" 
              variant="outline" 
              action="primary" 
              className="border-brand-primary hover:bg-brand-primary/5 rounded-2xl py-3 px-6 mt-6 shadow-sm active:scale-95"
              onPress={onOpenCustomizePlan}
            >
              <Plus size={14} className="text-brand-primary mr-1" />
              <ButtonText className="text-brand-primary font-black uppercase text-xs tracking-wider">
                Thiết Kế Giáo Án Cho Hôm Nay
              </ButtonText>
            </Button>
          </Box>
        )}

        {/* Phase Progress Card */}
        <VStack space="sm" className="mt-2">
          <Box className="bg-brand-light-card/60 dark:bg-brand-dark-card/60 border border-brand-light-border dark:border-brand-dark-border p-5 rounded-3xl shadow-sm">
            <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-black mb-3">
              Mục Tiêu Tuần Này
            </Heading>
            <VStack space="md">
              <VStack space="xs">
                <HStack className="justify-between">
                  <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">TIẾN TRÌNH</Text>
                  <Text className="text-2xs text-brand-primary font-bold font-mono">{progressPercent}%</Text>
                </HStack>
                <Progress value={progressPercent} size="xs" className="w-full bg-brand-light-bg dark:bg-brand-dark-bg h-1 rounded-full overflow-hidden border border-brand-light-border/40 dark:border-brand-dark-border/40">
                  <ProgressFilledTrack className="bg-brand-primary rounded-full" />
                </Progress>
              </VStack>

              <HStack className="justify-between p-3 bg-brand-light-bg dark:bg-brand-dark-bg/60 rounded-xl border border-brand-light-border/40 dark:border-brand-dark-border/40">
                <VStack>
                  <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-widest">Mục tiêu</Text>
                  <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-extrabold">{trainDays} buổi/tuần</Heading>
                </VStack>
                <VStack className="items-end">
                  <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-widest">Đã hoàn thành</Text>
                  <Heading size="xs" className="text-brand-primary font-extrabold">{totalCompletedWalks} buổi</Heading>
                </VStack>
              </HStack>
            </VStack>
          </Box>
        </VStack>

        {/* Master Tip Box */}
        <Box className="bg-brand-primary/10 border border-brand-primary/20 p-5 rounded-3xl">
          <HStack space="xs" className="items-center mb-2">
            <Award size={15} className="text-brand-primary" />
            <Text className="text-[10px] text-brand-primary font-black uppercase tracking-wider">Hào Quang Tích Cực (AURA TIP)</Text>
          </HStack>
          <Text className="text-xs text-brand-light-text dark:text-brand-dark-text leading-relaxed">
            "Hãy tận dụng {shields} chiếc khiên bảo vệ của bạn để nghỉ ngơi vào các ngày rest day một cách thoải mái. Cơ bắp không phát triển khi bạn đang nâng tạ, mà chúng phát triển khi bạn nghỉ ngơi và dinh dưỡng đầy đủ."
          </Text>
        </Box>

        {/* Workout Completed History Logs List */}
        <VStack space="sm" className="mt-2">
          <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text uppercase tracking-widest text-[9px] font-extrabold">
            NHẬT KÝ HOẠT ĐỘNG GẦN ĐÂY
          </Heading>

          {workouts.length === 0 ? (
            <Box className="py-8 items-center justify-center border border-dashed border-brand-light-border dark:border-brand-dark-border rounded-2xl bg-brand-light-card/20 dark:bg-brand-dark-card/20">
              <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted italic">
                Chưa có lịch sử tập luyện. Hãy bắt đầu ngay!
              </Text>
            </Box>
          ) : (
            workouts.map((w) => (
              <Box 
                key={w.id} 
                className="bg-brand-light-card/80 dark:bg-brand-dark-card/80 border border-brand-light-border dark:border-brand-dark-border rounded-xl p-4 shadow-sm"
              >
                <HStack className="justify-between items-center">
                  <VStack space="xs" className="flex-1 pr-4">
                    <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-bold text-xs" numberOfLines={1}>
                      {w.title}
                    </Heading>
                    <HStack space="md" className="items-center">
                      <HStack space="xs" className="items-center">
                        <Clock size={10} className="text-brand-primary" />
                        <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono">{w.duration_minutes}m</Text>
                      </HStack>
                      <HStack space="xs" className="items-center">
                        <Flame size={10} className="text-amber-500" />
                        <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono">{w.calories_burned} kcal</Text>
                      </HStack>
                      <HStack space="xs" className="items-center">
                        <Zap size={10} className="text-brand-primary" />
                        <Text className="text-[10px] text-brand-primary font-mono font-bold">+{w.xp_gained} XP</Text>
                      </HStack>
                    </HStack>
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono mt-0.5">
                      {new Date(w.created_at).toLocaleString('vi-VN')}
                    </Text>
                  </VStack>

                  <Pressable 
                    onPress={() => onDeleteWorkoutLog(w.id)} 
                    className="w-8 h-8 rounded-full border border-red-500/20 items-center justify-center bg-red-500/5 dark:bg-red-500/10 active:scale-95"
                  >
                    <Trash2 size={12} className="text-red-500" />
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
