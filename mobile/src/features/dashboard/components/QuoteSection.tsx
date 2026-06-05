import React from 'react';
import { Image } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Quote } from 'lucide-react-native';

export default function QuoteSection() {
  return (
    <Box className="bg-slate-950 py-16 px-6 gap-8 border-t border-b border-slate-900">
      {/* Serene Sanctuary Image */}
      <Box className="w-full h-64 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-lg">
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLpy753N7f2O4tqhjDd8lk2s1wYfnyyTUlfag8yuii-bwVNdkkVUIo7-uFbJDxTNCTJe9PYkbI4JXQrsZ87_PLjp5lAgsxXpSMJ0Zk2yBDWziNQxvw0owb_o_tVIVC6IMjmFLM72DZsU9uU62J1b3P1kSt_9q7xWvRo_68Dh4sc-efc6ufwiLe8dR4xdowFw-wHf_9B-ChZCqc69LqHQ-FTtA9iqPX6H4GqiKrcc0NzCRqysetd_TB5oXqba7DFvbfbgEcKzYhjQ' }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </Box>

      {/* Quote Content */}
      <VStack space="md" className="items-start">
        <Quote size={36} className="text-indigo-400 opacity-60" />
        <Text className="text-base font-light italic text-slate-200 leading-relaxed">
          "AuraFit isn't just about the physical; it's about the sanctity of the space we inhabit and the energy we cultivate within."
        </Text>
        <VStack>
          <Text className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
            Elena Vance
          </Text>
          <Text className="text-[9px] text-slate-400 uppercase tracking-widest">
            Chief Designer, AuraFit Studios
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
