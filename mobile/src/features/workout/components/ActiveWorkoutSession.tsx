import React from 'react';
import { Pressable, ScrollView, View, TextInput } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { 
  Clock, 
  X, 
  ArrowLeftRight, 
  CheckCircle2, 
  PlusCircle, 
  Trash2, 
  Info 
} from 'lucide-react-native';
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
  onCancelWorkout
}: ActiveWorkoutSessionProps) {
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
        <VStack space="lg">
          {activeExercises.map((ex, exIdx) => {
            const suggested = calculateSuggestedWeight(ex.default_weight_ratio);
            return (
              <Box 
                key={ex.id}
                className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-4 shadow-md"
              >
                {/* Exercise Header */}
                <HStack className="justify-between items-center border-b border-brand-light-border/40 dark:border-brand-dark-border/40 pb-2 mb-3">
                  <VStack className="flex-1 pr-2">
                    <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-bold">
                      {exIdx + 1}. {ex.name}
                    </Heading>
                    <HStack space="xs" className="items-center mt-1">
                      <Text className="text-[10px] text-brand-primary bg-brand-primary/15 px-2 py-0.5 rounded-full font-semibold">
                        {ex.primary_muscle}
                      </Text>
                      <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted">
                        • {ex.equipment}
                      </Text>
                    </HStack>
                  </VStack>

                  <Button
                    size="xs"
                    variant="outline"
                    action="secondary"
                    className="rounded-xl border-brand-light-border dark:border-brand-dark-border py-1 px-2.5 flex-row items-center"
                    onPress={() => onSwapRequest(exIdx)}
                  >
                    <ArrowLeftRight size={10} className="text-brand-primary mr-1" />
                    <ButtonText className="text-brand-primary font-bold text-[10px]">ĐỔI BÀI</ButtonText>
                  </Button>
                </HStack>

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
                <HStack className="justify-center mt-3 pt-1 border-t border-brand-light-border/10 dark:border-brand-dark-border/10">
                  <Pressable 
                    onPress={() => onAddSet(ex.id)}
                    className="flex-row items-center px-4 py-1.5 rounded-full border border-brand-primary/25 bg-brand-primary/5 active:scale-95"
                  >
                    <PlusCircle size={12} className="text-brand-primary mr-1" />
                    <Text className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">Thêm Set Tập</Text>
                  </Pressable>
                </HStack>
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
