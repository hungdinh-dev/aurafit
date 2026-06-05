import React from 'react';
import { ImageBackground, Alert } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <Box className="relative w-full h-[520px] overflow-hidden justify-center items-center px-6">
      {/* Background Image with Dark Vignette overlay */}
      <ImageBackground
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApmv9AwN8L093pVf6o_aRV6Zo6Bl5OdEIAQQouE7xYp8cJRGO-3e8ZwXJNhx6dqfF-Lf4KL0LCzNoCaqIAo5t3Nppa-0QbTCrahZtMFIBOFOIlE_Agktbv1oGpiXrM37yl6M1G5HI_9mXF9nB2U58evW7BcZyLPux5rTUwL70HxntCWjPAoQtO-2RQkElPuwigJLVvPjusJ5nPzWFntYNIN3e97l5thr1OO1t33NWbskSbtpaebHz1R_m2F356kw3m73EpGlYPvg' }}
        className="absolute inset-0 w-full h-full opacity-60"
        resizeMode="cover"
      />
      {/* Black radial overlay gradient effect */}
      <Box className="absolute inset-0 bg-black/60" />

      {/* Main Hero Card Container */}
      <VStack space="md" className="relative z-10 w-full items-center">
        <Text className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em] text-center">
          Elite Physical Synthesis
        </Text>
        <Heading size="3xl" className="text-white text-center tracking-tighter uppercase font-extrabold">
          Forge Your Aura
        </Heading>
        <Text className="text-xs text-slate-400 text-center font-light leading-relaxed max-w-xs mb-4">
          Experience the evolution of performance. A silent revolution in biometric tracking, wrapped in an aesthetic of pure, architectural serenity.
        </Text>

        {/* Buttons using Gluestack UI */}
        <VStack space="sm" className="w-full max-w-[260px]">
          <Button
            size="md"
            variant="solid"
            action="primary"
            className="w-full bg-indigo-600 active:bg-indigo-700 rounded-full py-3"
            onPress={() => Alert.alert('Ascension', 'Bắt đầu quá trình rèn luyện Aura...')}
          >
            <ButtonText className="text-white font-bold text-[11px] uppercase tracking-wider text-center">
              BEGIN ASCENSION
            </ButtonText>
          </Button>

          <Button
            size="md"
            variant="outline"
            action="secondary"
            className="w-full border-slate-700 active:bg-slate-900 rounded-full py-3"
            onPress={() => Alert.alert('Methodology', 'Học thuyết AuraFit dựa trên nghiên cứu phục hồi tim mạch và hypertrophy cơ bắp.')}
          >
            <ButtonText className="text-slate-300 font-bold text-[11px] uppercase tracking-wider text-center">
              EXPLORE METHOD
            </ButtonText>
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}
