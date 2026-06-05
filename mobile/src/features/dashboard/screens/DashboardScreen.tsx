import React from 'react';
import { ScrollView } from 'react-native';
import { Box } from '@/components/ui/box';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import BentoGrid from '../components/BentoGrid';
import QuoteSection from '../components/QuoteSection';
import InquiryForm from '../components/InquiryForm';
import BottomNav from '../components/BottomNav';

export default function DashboardScreen() {
  return (
    <Box className="flex-1 bg-black">
      {/* Fixed Header */}
      <Header />

      {/* Main Scrollable Content */}
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }} // Padding at bottom to prevent floating nav overlap
        showsVerticalScrollIndicator={false}
      >
        <HeroSection />
        <BentoGrid />
        <QuoteSection />
        <InquiryForm />
      </ScrollView>

      {/* Floating Bottom Nav */}
      <BottomNav />
    </Box>
  );
}
