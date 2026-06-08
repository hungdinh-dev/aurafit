import React from 'react';
import { ImageBackground, Alert } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import ScrollReveal from '@/src/components/ScrollReveal';
import { useThemeStore } from '@/src/theme/themeStore';

interface HeroSectionProps {
  scrollY: SharedValue<number>;
}

export default function HeroSection({ scrollY }: HeroSectionProps) {
  const { theme } = useThemeStore();
  const bgSource = theme === 'dark'
    ? require('@/assets/aura-bg-black.png')
    : require('@/assets/aura-bg-white.jpg');

  return (
    <Box className="relative w-full h-[520px] overflow-hidden justify-center items-center bg-brand-light-bg dark:bg-brand-dark-bg">
      {/* Background Image with Dark Vignette overlay */}
      <ImageBackground
        source={bgSource}
        className="absolute inset-0 w-full h-full opacity-45 dark:opacity-60"
        resizeMode="contain"
      />
      {/* Dark/Light radial overlay gradient effect */}
      <Box className="absolute inset-0 bg-brand-light-bg/40 dark:bg-brand-dark-bg/50" />

      {/* Main Hero Card Container wrapped in ScrollReveal */}
      <ScrollReveal scrollY={scrollY} delay={50}>
        <VStack space="md" className="relative z-10 w-full items-center">
          <Text className="text-[10px] text-brand-primary font-bold uppercase tracking-[0.3em] text-center">
            Elite Physical Synthesis
          </Text>
          <Heading size="3xl" className="text-brand-light-text dark:text-brand-dark-text text-center tracking-tighter uppercase font-extrabold">
            Forge Your Aura
          </Heading>
          <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center font-light leading-relaxed max-w-xs mb-4">
            Experience the evolution of performance. A silent revolution in biometric tracking, wrapped in an aesthetic of pure, architectural serenity.
          </Text>

          {/* Buttons using Gluestack UI styled with brand theme colors */}
          <VStack space="sm" className="w-full max-w-[170px]">
            <Button
              size="md"
              variant="solid"
              action="primary"
              className="w-full bg-brand-primary active:opacity-85 rounded-full border-0"
              onPress={() => Alert.alert('Ascension', 'Bắt đầu quá trình rèn luyện Aura...')}
            >
              <ButtonText className="w-full text-brand-secondary font-bold text-[11px] uppercase tracking-wider text-center">
                BEGIN ASCENSION
              </ButtonText>
            </Button>

            <Button
              size="md"
              variant="outline"
              action="secondary"
              className="w-full border-brand-primary active:bg-brand-primary/10 rounded-full"
              onPress={() => Alert.alert('Methodology', 'Học thuyết AuraFit dựa trên nghiên cứu phục hồi tim mạch và hypertrophy cơ bắp.')}
            >
              <ButtonText className="w-full text-brand-primary font-bold text-[11px] uppercase tracking-wider text-center">
                EXPLORE METHOD
              </ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollReveal>
    </Box>
  );
}
