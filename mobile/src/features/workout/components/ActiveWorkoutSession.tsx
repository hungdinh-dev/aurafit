import React from 'react';
import { Pressable, ScrollView, View, TextInput, Alert } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { 
  Clock, 
  X, 
  CheckCircle2, 
  PlusCircle, 
  Trash2, 
  Info,
  MoreVertical,
  Check
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { WorkoutPlan } from '../services/workoutService';

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

interface ActiveWorkoutSessionProps {
  selectedPlan: WorkoutPlan | null;
  elapsedSeconds: number;
  activeExercises: ActiveExercise[];
  userWeight: number;
  theme: string;
  formatTime: (secs: number) => string;
  calculateSuggestedWeight: (ratio: number) => number;
  onUpdateSetWeight: (exId: string, setNum: number, weight: string) => void;
  onUpdateSetReps: (exId: string, setNum: number, reps: string) => void;
  onToggleSetComplete: (exId: string, setNum: number) => void;
  onAddSet: (exId: string) => void;
  onRemoveSet: (exId: string, setNum: number) => void;
  onSwapRequest: (index: number) => void;
  onShowAddExtraModal: () => void;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
  expandedExerciseId: string | null;
  setExpandedExerciseId: (id: string | null) => void;
}

// Progress Ring Component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  theme?: string;
}

function ProgressRing({ progress, size = 32, strokeWidth = 3.5, theme = 'dark' }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - Math.min(1, Math.max(0, progress)) * circumference;

  const bgStroke = theme === 'dark' ? '#142520' : '#E2EFE7';

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgStroke}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {progress > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#8EB69B"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      {progress >= 1 && (
        <View style={{ position: 'absolute' }}>
          <Check size={12} className="text-brand-primary" strokeWidth={3} />
        </View>
      )}
    </View>
  );
}

export default function ActiveWorkoutSession({
  selectedPlan,
  elapsedSeconds,
  activeExercises,
  userWeight,
  theme,
  formatTime,
  calculateSuggestedWeight,
  onUpdateSetWeight,
  onUpdateSetReps,
  onToggleSetComplete,
  onAddSet,
  onRemoveSet,
  onSwapRequest,
  onShowAddExtraModal,
  onFinishWorkout,
  onCancelWorkout,
  expandedExerciseId,
  setExpandedExerciseId
}: ActiveWorkoutSessionProps) {
  
  const handleOpenMenu = (ex: ActiveExercise, idx: number) => {
    Alert.alert(
      ex.name,
      'Chọn thao tác bài tập:',
      [
        { text: 'Tráo Đổi Bài Tập', onPress: () => onSwapRequest(idx) },
        { text: 'Thêm Set Tập', onPress: () => onAddSet(ex.id) },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  return (
    <View className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg">
      {/* Top Active Bar */}
      <HStack className="h-16 justify-between items-center px-6 border-b border-brand-light-border dark:border-brand-dark-border bg-brand-light-card/90 dark:bg-brand-dark-card/90">
        <VStack>
          <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-widest">
            ĐANG LUYỆN TẬP
          </Text>
          <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-black max-w-[170px] truncate" numberOfLines={1}>
            {selectedPlan?.name || 'Daily Routine'}
          </Heading>
        </VStack>

        <HStack space="md" className="items-center">
          <HStack space="xs" className="items-center bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-full">
            <Clock size={12} className="text-brand-primary" />
            <Text className="text-xs font-mono font-bold text-brand-primary">{formatTime(elapsedSeconds)}</Text>
          </HStack>

          <Button 
            size="xs" 
            action="primary" 
            className="bg-brand-primary rounded-xl px-3"
            onPress={onFinishWorkout}
          >
            <ButtonText className="text-brand-secondary dark:text-brand-neutral font-black text-2xs uppercase">XONG</ButtonText>
          </Button>

          <Pressable 
            onPress={onCancelWorkout}
            className="w-8 h-8 rounded-full border border-red-500/25 items-center justify-center bg-red-500/10 active:scale-95"
          >
            <X size={14} className="text-red-500" />
          </Pressable>
        </HStack>
      </HStack>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md">
          {activeExercises.map((ex, exIdx) => {
            const completedSetsCount = ex.sets.filter(s => s.is_completed).length;
            const totalSetsCount = ex.sets.length;
            const progress = totalSetsCount > 0 ? completedSetsCount / totalSetsCount : 0;
            const isExpanded = expandedExerciseId === ex.id;
            const suggested = calculateSuggestedWeight(ex.default_weight_ratio);

            return (
              <Box 
                key={ex.id}
                className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Exercise Header Row */}
                <Pressable 
                  onPress={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                  className={`p-4 flex-row items-center justify-between ${
                    isExpanded ? "border-b border-brand-light-border/40 dark:border-brand-dark-border/40 bg-brand-primary/5" : ""
                  }`}
                >
                  <HStack space="md" className="items-center flex-1 pr-2">
                    {/* Progress Circle on the Left */}
                    <ProgressRing progress={progress} theme={theme} />
                    
                    {/* Name and Completed sets */}
                    <VStack className="flex-1">
                      <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-black text-xs">
                        {ex.name}
                      </Heading>
                      <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted mt-0.5">
                        {completedSetsCount}/{totalSetsCount} sets completed • {ex.primary_muscle}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Options Menu Button on the Right */}
                  <Pressable 
                    onPress={() => handleOpenMenu(ex, exIdx)}
                    className="w-8 h-8 rounded-full items-center justify-center active:bg-neutral-800/10 dark:active:bg-black/30"
                  >
                    <MoreVertical size={16} className="text-brand-light-text-muted dark:text-brand-dark-text-muted" />
                  </Pressable>
                </Pressable>

                {/* Expanded Details and Sets table */}
                {isExpanded && (
                  <VStack space="md" className="p-4 bg-brand-light-card dark:bg-brand-dark-card">
                    {/* Sets List Table */}
                    <VStack space="sm">
                      {/* Header Columns */}
                      <HStack className="px-1">
                        <Text className="w-[12%] text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold text-center">HIỆP</Text>
                        <Text className="w-[28%] text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold text-center">MỤC TIÊU</Text>
                        <Text className="w-[23%] text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold text-center">TẠ (KG)</Text>
                        <Text className="w-[23%] text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold text-center">REPS</Text>
                        <Text className="w-[14%] text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold text-center">XONG</Text>
                      </HStack>

                      {/* Set Rows */}
                      {ex.sets.map((set) => (
                        <VStack key={set.set_number} space="xs" className="border-b border-brand-light-border/20 dark:border-brand-dark-border/20 pb-2">
                          <HStack className="items-center">
                            {/* Set Number */}
                            <Text className="w-[12%] text-xs font-mono font-bold text-brand-light-text dark:text-brand-dark-text text-center">
                              {set.set_number}
                            </Text>

                            {/* Recommended Weight & Reps */}
                            <VStack className="w-[28%] items-center justify-center">
                              <Text className="text-[10px] text-brand-primary font-bold">
                                {suggested > 0 ? `${suggested}kg` : 'Bodywt'}
                              </Text>
                              <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono">
                                {ex.default_reps_min}-{ex.default_reps_max} reps
                              </Text>
                            </VStack>

                            {/* Weight Input */}
                            <View className="w-[23%] px-1">
                              <TextInput
                                keyboardType="numeric"
                                value={set.weight_kg}
                                onChangeText={text => onUpdateSetWeight(ex.id, set.set_number, text)}
                                placeholder="0"
                                placeholderTextColor="#5C8276"
                                editable={!set.is_completed}
                                style={{
                                  backgroundColor: theme === 'dark' ? '#0A0F0D' : '#F4FAF6',
                                  borderColor: theme === 'dark' ? '#1E352F' : '#CBE5D7',
                                  borderWidth: 1,
                                  borderRadius: 8,
                                  color: theme === 'dark' ? '#DAF1DE' : '#163832',
                                  paddingVertical: 4,
                                  textAlign: 'center',
                                  fontSize: 13,
                                  height: 32
                                }}
                              />
                            </View>

                            {/* Reps Input */}
                            <View className="w-[23%] px-1">
                              <TextInput
                                keyboardType="numeric"
                                value={set.reps_completed}
                                onChangeText={text => onUpdateSetReps(ex.id, set.set_number, text)}
                                placeholder="0"
                                placeholderTextColor="#5C8276"
                                editable={!set.is_completed}
                                style={{
                                  backgroundColor: theme === 'dark' ? '#0A0F0D' : '#F4FAF6',
                                  borderColor: theme === 'dark' ? '#1E352F' : '#CBE5D7',
                                  borderWidth: 1,
                                  borderRadius: 8,
                                  color: theme === 'dark' ? '#DAF1DE' : '#163832',
                                  paddingVertical: 4,
                                  textAlign: 'center',
                                  fontSize: 13,
                                  height: 32
                                }}
                              />
                            </View>

                            {/* Completed Checkbox */}
                            <Pressable 
                              className="w-[14%] items-center justify-center active:scale-90"
                              onPress={() => onToggleSetComplete(ex.id, set.set_number)}
                            >
                              <CheckCircle2 
                                size={22} 
                                className={set.is_completed ? "text-brand-primary" : "text-brand-light-border dark:text-brand-dark-border"} 
                              />
                            </Pressable>
                          </HStack>

                          {/* Auto-regulation Tips Inline */}
                          {set.autoRegulationFeedback ? (
                            <HStack space="xs" className="px-2 py-1 bg-neutral-800/10 dark:bg-black/30 rounded-lg items-center mt-1 mx-1">
                              <Info size={10} className="text-brand-primary" />
                              <Text className="text-[9px] text-brand-primary italic flex-1 leading-tight">
                                {set.autoRegulationFeedback}
                              </Text>
                              <Pressable 
                                onPress={() => onRemoveSet(ex.id, set.set_number)}
                                className="p-1 active:scale-95"
                              >
                                <Trash2 size={10} className="text-red-500/70" />
                              </Pressable>
                            </HStack>
                          ) : null}
                        </VStack>
                      ))}
                    </VStack>

                    {/* Add set button inside exercise card */}
                    <HStack className="justify-center mt-2 pt-1 border-t border-brand-light-border/10 dark:border-brand-dark-border/10">
                      <Pressable 
                        onPress={() => onAddSet(ex.id)}
                        className="flex-row items-center px-4 py-1.5 rounded-full border border-brand-primary/25 bg-brand-primary/5 active:scale-95"
                      >
                        <PlusCircle size={12} className="text-brand-primary mr-1" />
                        <Text className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">Thêm Set Tập</Text>
                      </Pressable>
                    </HStack>
                  </VStack>
                )}
              </Box>
            );
          })}

          {/* Append Extra Exercise Trigger */}
          <Button
            variant="outline"
            action="primary"
            className="border-dashed border-brand-primary/40 rounded-2xl py-3 flex-row items-center justify-center bg-brand-primary/5 mt-4"
            onPress={onShowAddExtraModal}
          >
            <PlusCircle size={16} className="text-brand-primary mr-2" />
            <ButtonText className="text-brand-primary font-bold uppercase text-xs">Thêm Bài Tập Extra</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </View>
  );
}
