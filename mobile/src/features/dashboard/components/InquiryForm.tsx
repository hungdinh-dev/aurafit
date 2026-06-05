import React, { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react-native';
import { useThemeStore } from '@/src/theme/themeStore';
import { useLanguageStore } from '@/src/localization/translations';
import ScrollReveal from '@/src/components/ScrollReveal';

interface InquiryFormProps {
  scrollY: SharedValue<number>;
}

export default function InquiryForm({ scrollY }: InquiryFormProps) {
  const [name, setName] = useState('');
  const [intent, setIntent] = useState('');
  const { theme } = useThemeStore();
  const { t } = useLanguageStore();

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert(t('settings'), t('requiredFields'));
      return;
    }
    Alert.alert(
      t('inquireMembership'),
      t('membershipAlert')
        .replace('{{name}}', name.toUpperCase())
        .replace('{{intent}}', intent || t('peakPerformance'))
    );
    setName('');
    setIntent('');
  };

  return (
    <Box className="px-6 py-16 bg-brand-light-bg dark:bg-brand-dark-bg gap-10">
      <ScrollReveal scrollY={scrollY} delay={50}>
        <VStack space="lg" className="w-full">
          {/* Title */}
          <Heading size="xl" className="text-brand-light-text dark:text-brand-dark-text text-center tracking-tighter uppercase font-extrabold leading-none mb-4">
            {t('visionTitle')}
          </Heading>

          {/* Form Fields */}
          <VStack space="lg">
            {/* Name Input */}
            <VStack space="xs">
              <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-widest">
                {t('yourName')}
              </Text>
              <Input variant="underlined" size="md" className="border-brand-light-border dark:border-brand-dark-border focus:border-brand-primary">
                <InputField
                  value={name}
                  onChangeText={setName}
                  placeholder={t('anonymous')}
                  placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                  className="text-brand-light-text dark:text-brand-dark-text text-sm"
                />
              </Input>
            </VStack>

            {/* Intent Input */}
            <VStack space="xs">
              <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-widest">
                {t('yourIntent')}
              </Text>
              <Input variant="underlined" size="md" className="border-brand-light-border dark:border-brand-dark-border focus:border-brand-primary">
                <InputField
                  value={intent}
                  onChangeText={setIntent}
                  placeholder={t('peakPerformance')}
                  placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                  className="text-brand-light-text dark:text-brand-dark-text text-sm"
                />
              </Input>
            </VStack>
          </VStack>

          {/* Submit Button */}
          <Box className="items-center mt-8">
            <Pressable 
              onPress={handleSubmit}
              className="flex-row items-center gap-3 active:scale-95 py-3"
            >
              <Text className="text-sm font-bold text-brand-primary uppercase tracking-wider">
                {t('inquireMembership')}
              </Text>
              <ArrowRight size={16} className="text-brand-primary" />
            </Pressable>
          </Box>
        </VStack>
      </ScrollReveal>
    </Box>
  );
}
