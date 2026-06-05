import React, { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react-native';

export default function InquiryForm() {
  const [name, setName] = useState('');
  const [intent, setIntent] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền tên hoặc bí danh của bạn.');
      return;
    }
    Alert.alert(
      'Đăng ký Hội viên',
      `Xin chào ${name.toUpperCase()}!\n\nYêu cầu gia nhập AuraFit với mục tiêu "${intent || 'PEAK PERFORMANCE'}" của bạn đã được tiếp nhận. Đơn đăng ký đang được xử lý trong im lặng.`
    );
    setName('');
    setIntent('');
  };

  return (
    <Box className="px-6 py-16 bg-black gap-10">
      {/* Title */}
      <Heading size="xl" className="text-slate-100 text-center tracking-tighter uppercase font-extrabold leading-none">
        Let's Bring Your Vision To Life
      </Heading>

      {/* Form Fields */}
      <VStack space="lg">
        {/* Name Input */}
        <VStack space="xs">
          <Text className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Your Name
          </Text>
          <Input variant="underlined" size="md" className="border-slate-800 focus:border-indigo-500">
            <InputField
              value={name}
              onChangeText={setName}
              placeholder="ANONYMOUS"
              placeholderTextColor="#475569"
              className="text-slate-100 placeholder:text-slate-600 text-sm"
            />
          </Input>
        </VStack>

        {/* Intent Input */}
        <VStack space="xs">
          <Text className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Your Intent
          </Text>
          <Input variant="underlined" size="md" className="border-slate-800 focus:border-indigo-500">
            <InputField
              value={intent}
              onChangeText={setIntent}
              placeholder="PEAK PERFORMANCE"
              placeholderTextColor="#475569"
              className="text-slate-100 placeholder:text-slate-600 text-sm"
            />
          </Input>
        </VStack>
      </VStack>

      {/* Submit Button */}
      <Box className="items-center mt-2">
        <Pressable 
          onPress={handleSubmit}
          className="flex-row items-center gap-3 active:scale-95 py-3"
        >
          <Text className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
            INQUIRE FOR MEMBERSHIP
          </Text>
          <ArrowRight size={16} className="text-indigo-400" />
        </Pressable>
      </Box>
    </Box>
  );
}
