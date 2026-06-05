import React from 'react';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { User } from 'lucide-react-native';

export default function ProfileScreen() {
  return (
    <Box className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg justify-center items-center px-6">
      <VStack space="lg" className="items-center max-w-xs">
        <Box className="w-16 h-16 rounded-full border border-brand-primary/30 items-center justify-center bg-brand-light-card dark:bg-brand-dark-card shadow-lg mb-2">
          <User size={28} className="text-brand-primary" />
        </Box>
        <Heading size="xl" className="text-brand-light-text dark:text-brand-dark-text text-center uppercase tracking-tighter font-extrabold leading-none">
          User Profile
        </Heading>
        <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center font-light leading-relaxed">
          Manage your biometric metadata, PR logs, and cardiovascular estimates. Your profile is local and secure.
        </Text>
      </VStack>
    </Box>
  );
}
