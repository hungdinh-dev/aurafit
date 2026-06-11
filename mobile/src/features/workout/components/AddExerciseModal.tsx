import React from 'react';
import { Pressable, ScrollView, View, Modal } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { X, Plus } from 'lucide-react-native';
import { Exercise } from '../services/workoutService';

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  catalogExercises: Exercise[];
  onAddExtraExercise: (newEx: Exercise) => void;
}

export default function AddExerciseModal({
  visible,
  onClose,
  catalogExercises,
  onAddExtraExercise
}: AddExerciseModalProps) {
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
              Thêm Bài Tập Extra
            </Heading>
            <Pressable onPress={onClose} className="p-1">
              <X size={16} className="text-brand-dark-text-muted" />
            </Pressable>
          </HStack>

          <Text className="text-[10px] text-brand-dark-text-muted mb-4 font-sans">
            Chọn bài tập trong danh mục để bổ sung vào giáo án tập hôm nay:
          </Text>

          <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
            <VStack space="sm">
              {catalogExercises.map(ex => (
                <Pressable
                  key={ex.id}
                  onPress={() => onAddExtraExercise(ex)}
                  className="p-3 rounded-xl bg-brand-dark-bg border border-brand-dark-border/60 hover:border-brand-primary active:scale-98 flex-row items-center justify-between"
                >
                  <VStack className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-brand-dark-text">{ex.name}</Text>
                    <HStack space="xs" className="items-center mt-0.5">
                      <Text className="text-[9px] text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded font-mono">
                        {ex.primary_muscle}
                      </Text>
                      <Text className="text-[9px] text-brand-dark-text-muted">
                        • {ex.equipment}
                      </Text>
                    </HStack>
                  </VStack>
                  <Plus size={14} className="text-brand-primary" />
                </Pressable>
              ))}
            </VStack>
          </ScrollView>
        </Box>
      </View>
    </Modal>
  );
}
