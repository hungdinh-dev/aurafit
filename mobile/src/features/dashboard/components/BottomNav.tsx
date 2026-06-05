import React from 'react';
import { Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate,
  SharedValue
} from 'react-native-reanimated';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Target, Dumbbell, TrendingUp, User } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { useThemeStore } from '@/src/theme/themeStore';

interface BottomNavProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
  scrollY: SharedValue<number>;
}

export default function BottomNav({ 
  activeTab, 
  onTabPress, 
  scrollY
}: BottomNavProps) {
  const { theme } = useThemeStore();

  const getTabClass = (tabName: string) => {
    return `w-24 h-10 rounded-full items-center justify-center relative ${
      activeTab === tabName ? 'bg-brand-primary' : 'bg-transparent'
    }`;
  };

  const getIconColorClass = (tabName: string) => {
    return activeTab === tabName
      ? 'text-brand-secondary dark:text-brand-neutral'
      : 'text-brand-light-text-muted dark:text-brand-dark-text-muted';
  };

  const getIconColor = (tabName: string) => {
    if (activeTab === tabName) {
      return theme === 'dark' ? colors.neutral : colors.secondary;
    }
    return colors.primary;
  };

  // Tooltip component to render above active tab
  const renderTooltip = (tabName: string, label: string) => {
    if (activeTab !== tabName) return null;
    return (
      <>
      </>
      // <Box className="absolute -top-7 bg-brand-secondary dark:bg-brand-neutral border border-brand-primary/30 px-2 py-0.5 rounded shadow z-50 items-center justify-center min-w-[50px]">
      //   <Text className="text-[6.5px] text-brand-primary font-extrabold uppercase tracking-widest text-center leading-none">
      //     {label}
      //   </Text>
      // </Box>
    );
  };

  // Animated styles for shrink/scale effect on vertical scroll
  const animatedNavStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, 150],
      [1, 0.85],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 150],
      [0, 12],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [0, 150],
      [1, 0.9],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  return (
    <Animated.View 
      style={animatedNavStyle} 
      className="absolute bottom-6 left-6 right-6 z-50"
    >
      <HStack className="justify-around items-center py-2 px-4 bg-brand-light-card/85 dark:bg-brand-dark-card/85 backdrop-blur-lg border border-brand-light-border dark:border-brand-dark-border rounded-full shadow-2xl">
        {/* Tab 1: Dashboard (Target) */}
        <Pressable
          onPress={() => onTabPress('dashboard')}
          className={getTabClass('dashboard')}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          {renderTooltip('dashboard', 'HOME')}
          <Target
            size={18}
            color={getIconColor('dashboard')}
            className={getIconColorClass('dashboard')}
          />
        </Pressable>

        {/* Tab 2: Workout (Fitness Center) */}
        <Pressable
          onPress={() => onTabPress('workout')}
          className={getTabClass('workout')}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          {renderTooltip('workout', 'WORKOUT')}
          <Dumbbell
            size={18}
            color={getIconColor('workout')}
            className={getIconColorClass('workout')}
          />
        </Pressable>

        {/* Tab 3: Leaderboard (TrendingUp) */}
        <Pressable
          onPress={() => onTabPress('leaderboard')}
          className={getTabClass('leaderboard')}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          {renderTooltip('leaderboard', 'LEADER')}
          <TrendingUp
            size={18}
            color={getIconColor('leaderboard')}
            className={getIconColorClass('leaderboard')}
          />
        </Pressable>

        {/* Tab 4: Profile (User) */}
        <Pressable
          onPress={() => onTabPress('profile')}
          className={getTabClass('profile')}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          {renderTooltip('profile', 'PROFILE')}
          <User
            size={18}
            color={getIconColor('profile')}
            className={getIconColorClass('profile')}
          />
        </Pressable>
      </HStack>
    </Animated.View>
  );
}
