import React, { useState, useEffect } from 'react';
import { Pressable, ScrollView, View, Modal, TextInput, Alert } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Exercise, WorkoutPlan, WorkoutPlanExercise } from '../services/workoutService';

interface CustomizePlanModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDay: number;
  plan: WorkoutPlan | null;
  planExercises: WorkoutPlanExercise[];
  catalogExercises: Exercise[];
  onSavePlan: (planName: string, difficulty: string, exercises: Omit<WorkoutPlanExercise, 'id'>[]) => Promise<void>;
}

export default function CustomizePlanModal({
  visible,
  onClose,
  selectedDay,
  plan,
  planExercises,
  catalogExercises,
  onSavePlan
}: CustomizePlanModalProps) {
  const [planName, setPlanName] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [selectedExs, setSelectedExs] = useState<any[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize values when modal opens or plan changes
  useEffect(() => {
    if (visible) {
      setPlanName(plan?.name || `Giáo án Thứ ${selectedDay === 7 ? 'Chủ Nhật' : selectedDay + 1}`);
      setDifficulty(plan?.difficulty || 'Beginner');
      
      // Map current exercises
      const mapped = planExercises.map((pe, idx) => ({
        exercise_id: pe.exercise_id,
        name: pe.exercises?.name || 'Bài tập',
        primary_muscle: pe.exercises?.primary_muscle || 'Toàn thân',
        sequence_order: pe.sequence_order || (idx + 1),
        default_sets: pe.default_sets || 3,
        default_reps_min: pe.default_reps_min || 8,
        default_reps_max: pe.default_reps_max || 12,
        default_weight_ratio: pe.default_weight_ratio || 0.3
      }));
      setSelectedExs(mapped);
      setShowCatalog(false);
    }
  }, [visible, plan, planExercises, selectedDay]);

  const handleAddExercise = (ex: Exercise) => {
    // Avoid duplicates
    if (selectedExs.some(item => item.exercise_id === ex.id)) {
      Alert.alert('Thông báo', 'Bài tập này đã có trong giáo án.');
      return;
    }

    const nextOrder = selectedExs.length + 1;
    setSelectedExs(prev => [
      ...prev,
      {
        exercise_id: ex.id,
        name: ex.name,
        primary_muscle: ex.primary_muscle,
        sequence_order: nextOrder,
        default_sets: 3,
        default_reps_min: ex.default_reps_min || 8,
        default_reps_max: ex.default_reps_max || 12,
        default_weight_ratio: 0.3
      }
    ]);
    setShowCatalog(false);
  };

  const handleRemoveExercise = (exId: string) => {
    setSelectedExs(prev => 
      prev.filter(item => item.exercise_id !== exId)
          .map((item, idx) => ({ ...item, sequence_order: idx + 1 }))
    );
  };

  const handleUpdateExerciseParam = (exId: string, field: string, val: any) => {
    setSelectedExs(prev => prev.map(item => {
      if (item.exercise_id !== exId) return item;
      return { ...item, [field]: val };
    }));
  };

  const handleSave = async () => {
    if (!planName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên giáo án.');
      return;
    }

    if (selectedExs.length === 0) {
      Alert.alert('Lỗi', 'Giáo án phải có ít nhất 1 bài tập.');
      return;
    }

    setIsSaving(true);
    try {
      // Structure values to pass to parent save handler
      const structuredExs = selectedExs.map(se => ({
        plan_id: plan?.id || '',
        exercise_id: se.exercise_id,
        sequence_order: se.sequence_order,
        default_sets: se.default_sets,
        default_reps_min: se.default_reps_min,
        default_reps_max: se.default_reps_max,
        default_weight_ratio: se.default_weight_ratio
      }));

      await onSavePlan(planName, difficulty, structuredExs);
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi lưu giáo án', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/85">
        <Box className="w-full h-[85%] rounded-t-[32px] bg-brand-dark-card border-t border-brand-dark-border p-6 shadow-2xl">
          {/* Header */}
          <HStack className="justify-between items-center pb-4 border-b border-brand-dark-border/40 mb-4">
            <VStack>
              <Heading size="sm" className="text-brand-dark-text font-black uppercase tracking-wider">
                Tùy Chỉnh Giáo Án
              </Heading>
              <Text className="text-[10px] text-brand-primary font-mono mt-0.5">
                Thứ {selectedDay === 7 ? 'Chủ Nhật' : selectedDay + 1}
              </Text>
            </VStack>
            <Pressable onPress={onClose} className="p-2 rounded-full bg-brand-dark-bg border border-brand-dark-border/60">
              <X size={16} className="text-brand-dark-text-muted" />
            </Pressable>
          </HStack>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-4">
            <VStack space="lg">
              {/* Plan Name Input */}
              <VStack space="xs">
                <Text className="text-[10px] text-brand-dark-text-muted font-bold uppercase tracking-wider">
                  Tên Giáo Án
                </Text>
                <TextInput
                  value={planName}
                  onChangeText={setPlanName}
                  placeholder="Ví dụ: PUSH DAY, PULL DAY..."
                  placeholderTextColor="#666"
                  className="bg-brand-dark-bg border border-brand-dark-border/80 text-brand-dark-text text-sm rounded-xl px-4 py-3 font-sans font-bold"
                />
              </VStack>

              {/* Difficulty Selection */}
              <VStack space="xs">
                <Text className="text-[10px] text-brand-dark-text-muted font-bold uppercase tracking-wider">
                  Độ Khó Giáo Án
                </Text>
                <HStack space="xs" className="w-full bg-brand-dark-bg border border-brand-dark-border/60 rounded-xl p-1 justify-between">
                  {['Beginner', 'Intermediate', 'Advanced'].map(d => {
                    const isActive = difficulty === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => setDifficulty(d)}
                        className={`flex-1 items-center justify-center py-2 rounded-lg active:scale-95 ${
                          isActive ? "bg-brand-primary" : "bg-transparent"
                        }`}
                      >
                        <Text className={`text-[10px] font-black uppercase ${
                          isActive ? "text-brand-neutral" : "text-brand-dark-text-muted"
                        }`}>
                          {d === 'Beginner' ? 'Dễ' : d === 'Intermediate' ? 'Vừa' : 'Khó'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </HStack>
              </VStack>

              {/* Exercises Title */}
              <HStack className="justify-between items-baseline mt-2">
                <Text className="text-[10px] text-brand-dark-text-muted font-bold uppercase tracking-wider">
                  Danh sách bài tập ({selectedExs.length})
                </Text>
                <Pressable 
                  onPress={() => setShowCatalog(!showCatalog)}
                  className="flex-row items-center space-x-1 py-1 px-3 rounded-lg bg-brand-primary/10 border border-brand-primary/20"
                >
                  <Text className="text-[10px] text-brand-primary font-bold mr-1">
                    {showCatalog ? 'Đóng Danh Mục' : 'Thêm Bài Tập'}
                  </Text>
                  {showCatalog ? <ChevronUp size={10} className="text-brand-primary" /> : <ChevronDown size={10} className="text-brand-primary" />}
                </Pressable>
              </HStack>

              {/* Exercise Selector Dropdown Panel */}
              {showCatalog && (
                <Box className="bg-brand-dark-bg border border-brand-dark-border/80 rounded-2xl p-3 max-h-56 overflow-hidden">
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                    <VStack space="xs">
                      {catalogExercises.map(ex => (
                        <Pressable
                          key={ex.id}
                          onPress={() => handleAddExercise(ex)}
                          className="p-3 rounded-xl border border-brand-dark-border/40 hover:border-brand-primary/60 active:bg-brand-primary/5 flex-row justify-between items-center"
                        >
                          <VStack className="flex-1 pr-2">
                            <Text className="text-xs font-bold text-brand-dark-text">{ex.name}</Text>
                            <Text className="text-[9px] text-brand-dark-text-muted">{ex.primary_muscle} • {ex.equipment}</Text>
                          </VStack>
                          <Plus size={14} className="text-brand-primary" />
                        </Pressable>
                      ))}
                    </VStack>
                  </ScrollView>
                </Box>
              )}

              {/* Selected Exercises Configuration */}
              <VStack space="md">
                {selectedExs.map((se, idx) => (
                  <Box 
                    key={se.exercise_id}
                    className="bg-brand-dark-bg border border-brand-dark-border/60 rounded-2xl p-4"
                  >
                    <HStack className="justify-between items-center mb-3">
                      <VStack className="flex-1 pr-3">
                        <Text className="text-[8px] text-brand-dark-text-muted font-mono tracking-widest uppercase">
                          BÀI SỐ {idx + 1}
                        </Text>
                        <Heading size="xs" className="text-brand-dark-text font-black text-sm mt-0.5" numberOfLines={1}>
                          {se.name}
                        </Heading>
                      </VStack>
                      <Pressable 
                        onPress={() => handleRemoveExercise(se.exercise_id)}
                        className="p-2 rounded-full border border-red-500/20 bg-red-500/5 active:scale-95"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </Pressable>
                    </HStack>

                    <HStack className="justify-between items-center" space="sm">
                      {/* Sets */}
                      <VStack className="flex-1" space="xs">
                        <Text className="text-[8px] text-brand-dark-text-muted font-bold uppercase">Hiệp (Sets)</Text>
                        <HStack className="items-center bg-brand-dark-card border border-brand-dark-border/60 rounded-xl px-2 py-1 justify-between">
                          <Pressable 
                            onPress={() => handleUpdateExerciseParam(se.exercise_id, 'default_sets', Math.max(1, se.default_sets - 1))}
                            className="p-1.5 active:bg-brand-dark-border/20 rounded"
                          >
                            <Text className="text-brand-dark-text font-bold">-</Text>
                          </Pressable>
                          <Text className="text-xs font-bold text-brand-dark-text">{se.default_sets}</Text>
                          <Pressable 
                            onPress={() => handleUpdateExerciseParam(se.exercise_id, 'default_sets', se.default_sets + 1)}
                            className="p-1.5 active:bg-brand-dark-border/20 rounded"
                          >
                            <Text className="text-brand-dark-text font-bold">+</Text>
                          </Pressable>
                        </HStack>
                      </VStack>

                      {/* Reps */}
                      <VStack className="flex-1" space="xs">
                        <Text className="text-[8px] text-brand-dark-text-muted font-bold uppercase">Reps (Min-Max)</Text>
                        <HStack className="items-center bg-brand-dark-card border border-brand-dark-border/60 rounded-xl px-2 py-1 justify-around">
                          <TextInput
                            keyboardType="numeric"
                            value={se.default_reps_min.toString()}
                            onChangeText={(val) => handleUpdateExerciseParam(se.exercise_id, 'default_reps_min', parseInt(val) || 0)}
                            className="text-xs font-bold text-brand-dark-text text-center p-0.5 w-6"
                          />
                          <Text className="text-brand-dark-text-muted text-2xs">-</Text>
                          <TextInput
                            keyboardType="numeric"
                            value={se.default_reps_max.toString()}
                            onChangeText={(val) => handleUpdateExerciseParam(se.exercise_id, 'default_reps_max', parseInt(val) || 0)}
                            className="text-xs font-bold text-brand-dark-text text-center p-0.5 w-6"
                          />
                        </HStack>
                      </VStack>

                      {/* Weight Ratio */}
                      <VStack className="flex-1" space="xs">
                        <Text className="text-[8px] text-brand-dark-text-muted font-bold uppercase">Tạ/Body (Ratio)</Text>
                        <HStack className="items-center bg-brand-dark-card border border-brand-dark-border/60 rounded-xl px-2 py-1 justify-around">
                          <TextInput
                            keyboardType="numeric"
                            value={se.default_weight_ratio.toString()}
                            onChangeText={(val) => handleUpdateExerciseParam(se.exercise_id, 'default_weight_ratio', parseFloat(val) || 0.0)}
                            className="text-xs font-bold text-brand-primary text-center p-0.5 w-12"
                          />
                        </HStack>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </VStack>
          </ScrollView>

          {/* Action Buttons */}
          <HStack space="md" className="pt-3 border-t border-brand-dark-border/30">
            <Pressable 
              onPress={onClose} 
              className="flex-1 bg-brand-dark-bg border border-brand-dark-border/60 py-3 rounded-2xl items-center active:scale-95"
            >
              <Text className="text-xs font-bold text-brand-dark-text-muted uppercase">Hủy</Text>
            </Pressable>
            <Pressable 
              onPress={handleSave}
              disabled={isSaving}
              className="flex-[2] bg-brand-primary py-3 rounded-2xl items-center active:scale-95 shadow-md flex-row justify-center"
            >
              <Text className="text-xs font-black text-brand-neutral uppercase">Lưu Giáo Án</Text>
            </Pressable>
          </HStack>
        </Box>
      </View>
    </Modal>
  );
}
