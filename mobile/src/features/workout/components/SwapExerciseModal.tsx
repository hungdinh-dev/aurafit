import React from 'react';
import { Pressable, ScrollView, View, Modal } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { X, ChevronRight } from 'lucide-react-native';
import { Exercise } from '../services/workoutService';

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

interface SwapExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  catalogExercises: Exercise[];
  activeExercises: ActiveExercise[];
  swappingIndex: number | null;
  onExecuteSwap: (newEx: Exercise) => void;
}

export default function SwapExerciseModal({
  visible,
  onClose,
  catalogExercises,
  activeExercises,
  swappingIndex,
  onExecuteSwap
}: SwapExerciseModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/80 px-6">
        <Box className="w-full max-w-sm rounded-3xl bg-brand-dark-card border border-brand-dark-border p-5 shadow-2xl">
          <HStack className="justify-between items-center pb-3 border-b border-brand-dark-border/40 mb-3">
            <Heading size="xs" className="text-brand-dark-text font-bold uppercase tracking-wider">
              Tráo Đổi Bài Tập
            </Heading>
            <Pressable onPress={onClose} className="p-1">
              <X size={16} className="text-brand-dark-text-muted" />
            </Pressable>
          </HStack>

          <Text className="text-[10px] text-brand-dark-text-muted mb-4 leading-relaxed">
            Chọn bài tập tương đương cùng nhóm cơ kích thích bên dưới:
          </Text>

          <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
            <VStack space="sm">
              {catalogExercises
                .filter(ex => {
                  if (swappingIndex === null) return true;
                  const targetEx = activeExercises[swappingIndex];
                  return ex.primary_muscle === targetEx.primary_muscle && ex.id !== targetEx.exercise_id;
                })
                .map(ex => (
                  <Pressable
                    key={ex.id}
                    onPress={() => onExecuteSwap(ex)}
                    className="p-3 rounded-xl bg-brand-dark-bg border border-brand-dark-border/60 hover:border-brand-primary active:scale-98 flex-row items-center justify-between"
                  >
                    <VStack className="flex-1 pr-2">
                      <Text className="text-xs font-bold text-brand-dark-text">{ex.name}</Text>
                      <Text className="text-[9px] text-brand-dark-text-muted mt-0.5">{ex.equipment} • {ex.default_reps_min}-{ex.default_reps_max} reps</Text>
                    </VStack>
                    <ChevronRight size={14} className="text-brand-primary" />
                  </Pressable>
                ))}
              {catalogExercises.filter(ex => {
                if (swappingIndex === null) return true;
                const targetEx = activeExercises[swappingIndex];
                return ex.primary_muscle === targetEx.primary_muscle && ex.id !== targetEx.exercise_id;
              }).length === 0 ? (
                <Text className="text-xs text-brand-dark-text-muted italic text-center py-4">Không tìm thấy bài tập tương tự.</Text>
              ) : null}
            </VStack>
          </ScrollView>
        </Box>
      </View>
    </Modal>
  );
}
