import React from 'react';
import { Pressable } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Clock } from 'lucide-react-native';

interface RestTimerOverlayProps {
  isResting: boolean;
  setIsResting: (resting: boolean) => void;
  restCountdown: number;
  totalRestTime: number;
}

export default function RestTimerOverlay({
  isResting,
  setIsResting,
  restCountdown,
  totalRestTime
}: RestTimerOverlayProps) {
  if (!isResting) return null;

  return (
    <Box className="absolute bottom-4 left-4 right-4 bg-brand-dark-card border border-brand-primary rounded-2xl p-4 shadow-2xl z-[200] backdrop-blur-xl animate-bounce-in">
      <VStack space="md">
        <HStack className="justify-between items-center">
          <HStack space="xs" className="items-center">
            <Clock size={16} className="text-brand-primary animate-pulse" />
            <Text className="text-xs text-brand-dark-text font-black uppercase tracking-wider">
              NGHỈ GIỮA HIỆP (REST)
            </Text>
          </HStack>
          <Pressable 
            onPress={() => setIsResting(false)} 
            className="bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-full active:scale-95"
          >
            <Text className="text-[10px] text-brand-primary font-bold uppercase">Bỏ qua nghỉ</Text>
          </Pressable>
        </HStack>

        <VStack space="xs">
          <HStack className="justify-between items-baseline">
            <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted">Hãy hít thở sâu & duỗi cơ nhẹ</Text>
            <Heading size="sm" className="text-brand-primary font-mono font-bold">{restCountdown}s / {totalRestTime}s</Heading>
          </HStack>

          {/* Progress rest bar */}
          <Progress value={((totalRestTime - restCountdown) / totalRestTime) * 100} size="xs" className="w-full bg-brand-light-bg dark:bg-brand-dark-bg h-1.5 rounded-full overflow-hidden border border-brand-light-border/40 dark:border-brand-dark-border/40">
            <ProgressFilledTrack className="bg-brand-primary rounded-full" />
          </Progress>
        </VStack>
      </VStack>
    </Box>
  );
}
