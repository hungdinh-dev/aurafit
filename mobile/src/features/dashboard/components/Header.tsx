import React from 'react';
import { Alert } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button, ButtonIcon } from '@/components/ui/button';
import { Award, Cpu, Sun, Moon } from 'lucide-react-native';
import { useThemeStore } from '@/src/theme/themeStore';

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <HStack className="h-16 justify-between items-center px-6 border-b border-brand-light-border dark:border-brand-dark-border bg-brand-light-bg/80 dark:bg-brand-dark-bg/80 backdrop-blur-md">
      {/* Profile Section */}
      <HStack space="md" className="items-center">
        <Avatar size="sm" className="border border-brand-primary/30">
          <AvatarImage
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ7etWtLhaTI7H6Zh4RJtjxyzoiFx3r8g0zBEUKz_9CxO6D6nmBvRcJ49IdfbLeEk_v9sUHVkl2Y9iYvPr4XNNNR8XZAxaJu1phV1H9tGpnlIf1bfbvZE3naEg8rp_ulypN_nNLsOhONMb4Dm3ipd7dcjPuulDE3rDk8qTlzqhygcSg0KpnuHmU31MtlcAVWPV-M3gy1Lgf_fg1FVKs6dYQn2SXrBugeHz2G1ylz1tCuxGcDqBGiGGeb6VTXAyM7ottIiT8x5x0A' }}
          />
        </Avatar>
        <VStack>
          <Text className="text-[10px] text-brand-light-text dark:text-brand-dark-text font-bold uppercase tracking-widest leading-none">
            Elena Vance
          </Text>
          <Text className="text-[8px] text-brand-primary font-semibold uppercase tracking-wider mt-0.5">
            Lvl 12 Architect
          </Text>
        </VStack>
      </HStack>

      {/* Brand Title */}
      <Heading size="md" className="text-brand-light-text dark:text-brand-dark-text uppercase tracking-tighter font-bold">
        AuraFit
      </Heading>

      {/* Action Buttons */}
      <HStack space="sm" className="items-center">
        {/* Theme Toggle Button */}
        <Button 
          size="sm" 
          variant="outline" 
          action="secondary"
          className="w-8 h-8 rounded-full border-brand-light-border dark:border-brand-dark-border items-center justify-center p-0"
          onPress={toggleTheme}
        >
          <ButtonIcon as={theme === 'dark' ? Sun : Moon} className="text-brand-primary" />
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          action="secondary"
          className="w-8 h-8 rounded-full border-brand-light-border dark:border-brand-dark-border items-center justify-center p-0"
          onPress={() => Alert.alert('Aura Badges', 'Danh hiệu hiện tại: Elite Physical Synthesis')}
        >
          <ButtonIcon as={Award} className="text-brand-primary" />
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          action="secondary"
          className="w-8 h-8 rounded-full border-brand-light-border dark:border-brand-dark-border items-center justify-center p-0"
          onPress={() => Alert.alert('Connect Gear', 'Đang quét thiết bị đeo (Smartwatch)...')}
        >
          <ButtonIcon as={Cpu} className="text-brand-primary" />
        </Button>
      </HStack>
    </HStack>
  );
}
