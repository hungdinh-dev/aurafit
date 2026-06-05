import React, { useState } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler 
} from 'react-native-reanimated';
import { Box } from '@/components/ui/box';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import HomeScreen from './HomeScreen';
import WorkoutScreen from '@/src/features/workout/screens/WorkoutScreen';
import LeaderboardScreen from '@/src/features/leaderboard/screens/LeaderboardScreen';
import ProfileScreen from '@/src/features/profile/screens/ProfileScreen';
import { useThemeStore } from '@/src/theme/themeStore';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // scrollY tracks vertical scroll offset of HomeScreen
  const scrollY = useSharedValue(0);
  const { theme } = useThemeStore();

  const verticalScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleTabPress = (tabName: string) => {
    setActiveTab(tabName);
    // Reset scrollY if switching tabs to reset BottomNav scale
    if (tabName !== 'dashboard') {
      scrollY.value = 0;
    }
  };

  return (
    <Box className={`flex-1 bg-brand-light-bg dark:bg-brand-dark-bg ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Fixed Header */}
      <Header />

      {/* Conditional Screen Rendering */}
      <Box className="flex-1">
        {activeTab === 'dashboard' && (
          <HomeScreen 
            scrollY={scrollY} 
            verticalScrollHandler={verticalScrollHandler} 
          />
        )}
        {activeTab === 'workout' && <WorkoutScreen />}
        {activeTab === 'leaderboard' && <LeaderboardScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </Box>

      {/* Floating Bottom Nav */}
      <BottomNav 
        activeTab={activeTab} 
        onTabPress={handleTabPress} 
        scrollY={scrollY} 
      />
    </Box>
  );
}
