import React from 'react';
import { Image } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Quote } from 'lucide-react-native';
import ScrollReveal from '@/src/components/ScrollReveal';

interface QuoteSectionProps {
  scrollY: SharedValue<number>;
}

export default function QuoteSection({ scrollY }: QuoteSectionProps) {
  return (
    <Box className="bg-brand-light-bg dark:bg-brand-dark-bg py-16 px-6 gap-8 border-t border-b border-brand-light-border dark:border-brand-dark-border">
      <ScrollReveal scrollY={scrollY} delay={50}>
        <VStack space="lg" className="w-full">
          {/* Serene Sanctuary Image */}
          <Box className="w-full h-64 rounded-2xl overflow-hidden border border-brand-light-border dark:border-brand-dark-border bg-brand-light-card dark:bg-brand-dark-card shadow-lg">
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLpy753N7f2O4tqhjDd8lk2s1wYfnyyTUlfag8yuii-bwVNdkkVUIo7-uFbJDxTNCTJe9PYkbI4JXQrsZ87_PLjp5lAgsxXpSMJ0Zk2yBDWziNQxvw0owb_o_tVIVC6IMjmFLM72DZsU9uU62J1b3P1kSt_9q7xWvRo_68Dh4sc-efc6ufwiLe8dR4xdowFw-wHf_9B-ChZCqc69LqHQ-FTtA9iqPX6H4GqiKrcc0NzCRqysetd_TB5oXqba7DFvbfbgEcKzYhjQ' }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </Box>

          {/* Quote Content */}
          <VStack space="md" className="items-start mt-6">
            <Quote size={36} className="text-brand-primary opacity-60" />
            <Text className="text-base font-light italic text-brand-light-text dark:text-brand-dark-text leading-relaxed">
              "AuraFit isn't just about the physical; it's about the sanctity of the space we inhabit and the energy we cultivate within."
            </Text>
            <VStack>
              <Text className="text-xs font-semibold text-brand-light-text dark:text-brand-dark-text uppercase tracking-wider">
                Elena Vance
              </Text>
              <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">
                Chief Designer, AuraFit Studios
              </Text>
            </VStack>
          </VStack>
        </VStack>
      </ScrollReveal>
    </Box>
  );
}
