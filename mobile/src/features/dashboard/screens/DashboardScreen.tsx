import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Dimensions, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler 
} from 'react-native-reanimated';
import { Box } from '@/components/ui/box';
import Header from '@/src/components/common/Header';
import BottomNav from '@/src/components/common/BottomNav';
import HomeScreen from './HomeScreen';
import WorkoutScreen from '@/src/features/workout/screens/WorkoutScreen';
import LeaderboardScreen from '@/src/features/leaderboard/screens/LeaderboardScreen';
import ProfileScreen from '@/src/features/profile/screens/ProfileScreen';
import { useThemeStore } from '@/src/theme/themeStore';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
  const { theme } = useThemeStore();
  
  // scrollY tracks vertical scroll offset of HomeScreen
  const scrollY = useSharedValue(0);
  
  const horizontalScrollRef = useRef<ScrollView>(null);
  const isProgrammaticScroll = useRef(false);

  const verticalScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleTabPress = (tabName: string) => {
    setActiveTab(tabName);
    const tabs = ['dashboard', 'workout', 'leaderboard', 'profile'];
    const index = tabs.indexOf(tabName);
    if (index !== -1) {
      isProgrammaticScroll.current = true;
      horizontalScrollRef.current?.scrollTo({ x: index * containerWidth, animated: true });
      // Reset scrollY if switching tabs to reset BottomNav scale
      if (tabName !== 'dashboard') {
        scrollY.value = 0;
      }
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 350);
    }
  };

  const handleScroll = (event: any) => {
    if (isProgrammaticScroll.current) return;
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / containerWidth);
    const tabs = ['dashboard', 'workout', 'leaderboard', 'profile'];
    if (tabs[index] && tabs[index] !== activeTab) {
      setActiveTab(tabs[index]);
      if (tabs[index] !== 'dashboard') {
        scrollY.value = 0;
      }
    }
  };

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  useEffect(() => {
    // Recenter active tab when container width changes (e.g. orientation or window resize)
    const tabs = ['dashboard', 'workout', 'leaderboard', 'profile'];
    const index = tabs.indexOf(activeTab);
    if (index !== -1) {
      horizontalScrollRef.current?.scrollTo({ x: index * containerWidth, animated: false });
    }
  }, [containerWidth]);

  return (
    <Box 
      onLayout={handleLayout}
      className={`flex-1 bg-brand-light-bg dark:bg-brand-dark-bg ${theme === 'dark' ? 'dark' : ''}`}
    >
      {/* Fixed Header */}
      <Header />

      {/* Horizontal ScrollView for swiping pages (100% stable on Web & Mobile) */}
      <Box className="flex-1">
        <ScrollView
          ref={horizontalScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          onScrollEndDrag={handleScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentContainerStyle={{ width: containerWidth * 4 }}
        >
          <View style={{ width: containerWidth }} className="flex-1">
            <HomeScreen 
              scrollY={scrollY} 
              verticalScrollHandler={verticalScrollHandler} 
            />
          </View>
          <View style={{ width: containerWidth }} className="flex-1">
            <WorkoutScreen />
          </View>
          <View style={{ width: containerWidth }} className="flex-1">
            <LeaderboardScreen />
          </View>
          <View style={{ width: containerWidth }} className="flex-1">
            <ProfileScreen />
          </View>
        </ScrollView>
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
