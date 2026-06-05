import React from 'react';
import Animated, { SharedValue } from 'react-native-reanimated';
import HeroSection from '../components/HeroSection';
import BentoGrid from '../components/BentoGrid';
import QuoteSection from '../components/QuoteSection';
import InquiryForm from '../components/InquiryForm';

interface HomeScreenProps {
  scrollY: SharedValue<number>;
  verticalScrollHandler: any;
}

export default function HomeScreen({ scrollY, verticalScrollHandler }: HomeScreenProps) {
  return (
    <Animated.ScrollView 
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 100 }} // Padding at bottom to prevent floating nav overlap
      showsVerticalScrollIndicator={false}
      onScroll={verticalScrollHandler}
      scrollEventThrottle={16}
    >
      <HeroSection scrollY={scrollY} />
      <BentoGrid scrollY={scrollY} />
      <QuoteSection scrollY={scrollY} />
      <InquiryForm scrollY={scrollY} />
    </Animated.ScrollView>
  );
}
