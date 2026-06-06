import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Trophy, Medal, Award, TrendingUp, User, ShieldAlert } from 'lucide-react-native';
import { useLanguageStore } from '@/src/localization/translations';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { getLeaderboard } from '@/src/features/profile/services/profileService';
import { UserProfile } from '@/src/features/profile/services/profileService';

export default function LeaderboardScreen() {
  const { t } = useLanguageStore();
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(!isSupabaseConfigured);

  const MOCK_LEADERS: UserProfile[] = [
    {
      id: 'mock-1',
      username: 'elenavance',
      full_name: 'Elena Vance',
      avatar_url: '',
      level: 12,
      xp: 8450,
      streak_days: 7,
      aura_shields: 1,
      cardio_age: 24,
      metadata: {}
    },
    {
      id: 'mock-2',
      username: 'gordonf',
      full_name: 'Gordon Freeman',
      avatar_url: '',
      level: 10,
      xp: 6200,
      streak_days: 5,
      aura_shields: 0,
      cardio_age: 28,
      metadata: {}
    },
    {
      id: 'mock-3',
      username: 'alyxv',
      full_name: 'Alyx Vance',
      avatar_url: '',
      level: 9,
      xp: 5800,
      streak_days: 4,
      aura_shields: 2,
      cardio_age: 22,
      metadata: {}
    },
    {
      id: 'mock-4',
      username: 'barneyc',
      full_name: 'Barney Calhoun',
      avatar_url: '',
      level: 7,
      xp: 4100,
      streak_days: 2,
      aura_shields: 0,
      cardio_age: 32,
      metadata: {}
    },
    {
      id: 'mock-5',
      username: 'kleiner',
      full_name: 'Dr. Kleiner',
      avatar_url: '',
      level: 5,
      xp: 2900,
      streak_days: 1,
      aura_shields: 0,
      cardio_age: 55,
      metadata: {}
    }
  ];

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLeaders(MOCK_LEADERS);
      setIsOfflineMode(true);
      setIsLoading(false);
      return;
    }

    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await getLeaderboard(15);
      setLeaders(data);
      setIsOfflineMode(false);
    } catch (error: any) {
      console.log('Error loading leaderboard from Supabase:', error.message);
      setLeaders(MOCK_LEADERS);
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-500'; // Gold
      case 1: return 'text-slate-400';  // Silver
      case 2: return 'text-amber-700';  // Bronze
      default: return 'text-brand-light-text-muted dark:text-brand-dark-text-muted';
    }
  };

  const getRankBadgeBg = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-500/10 border-yellow-500/30';
      case 1: return 'bg-slate-400/10 border-slate-400/30';
      case 2: return 'bg-amber-700/10 border-amber-700/30';
      default: return 'bg-brand-light-card/40 dark:bg-brand-dark-card/40 border-brand-light-border dark:border-brand-dark-border';
    }
  };

  return (
    <ScrollView 
      className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg"
      contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack space="xl">
        {/* Connection Notice */}
        {isOfflineMode && (
          <HStack space="xs" className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl items-center">
            <ShieldAlert size={16} className="text-amber-500" />
            <Text className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex-1">
              {t('sandboxMode')} - Bảng xếp hạng mô phỏng
            </Text>
          </HStack>
        )}

        {/* Intro */}
        <VStack space="xs">
          <Heading size="lg" className="text-brand-light-text dark:text-brand-dark-text font-bold">
            {t('leaderboardTitle')}
          </Heading>
          <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted">
            So sánh năng lượng Aura tích luỹ và cấp độ kiến trúc thể chất của các thành viên.
          </Text>
        </VStack>

        {/* Top 3 Visual Podiums */}
        {!isLoading && leaders.length >= 3 && (
          <HStack className="justify-center items-end py-6 px-2 bg-brand-light-card/40 dark:bg-brand-dark-card/40 border border-brand-light-border/40 dark:border-brand-dark-border/40 rounded-2xl">
            {/* 2nd Place */}
            <VStack className="items-center flex-1">
              <Medal size={20} className="text-slate-400 mb-1" />
              <Box className="w-10 h-10 rounded-full border border-slate-400/30 items-center justify-center bg-brand-light-bg dark:bg-brand-dark-bg">
                <User size={18} className="text-slate-400" />
              </Box>
              <Text className="text-[9px] text-brand-light-text dark:text-brand-dark-text font-bold mt-1 text-center truncate max-w-[70px]">
                {leaders[1]?.full_name || 'Gordon F.'}
              </Text>
              <Text className="text-[7.5px] text-brand-primary font-bold mt-0.5">
                Lv {leaders[1]?.level}
              </Text>
              <Box className="w-16 h-12 bg-slate-400/20 border-t border-slate-400/30 rounded-t-lg mt-2 items-center justify-center">
                <Text className="text-xs font-bold text-slate-400">#2</Text>
              </Box>
            </VStack>

            {/* 1st Place (Center Podium) */}
            <VStack className="items-center flex-1 z-10 scale-110">
              <Trophy size={24} className="text-yellow-500 mb-1" />
              <Box className="w-12 h-12 rounded-full border border-yellow-500/40 items-center justify-center bg-brand-light-bg dark:bg-brand-dark-bg shadow-lg">
                <User size={22} className="text-yellow-500" />
              </Box>
              <Text className="text-[10px] text-brand-light-text dark:text-brand-dark-text font-extrabold mt-1 text-center truncate max-w-[80px]">
                {leaders[0]?.full_name || 'Elena Vance'}
              </Text>
              <Text className="text-[8px] text-brand-primary font-black mt-0.5">
                Lv {leaders[0]?.level}
              </Text>
              <Box className="w-20 h-16 bg-yellow-500/20 border-t border-yellow-500/35 rounded-t-xl mt-2 items-center justify-center">
                <Text className="text-sm font-black text-yellow-500">#1</Text>
              </Box>
            </VStack>

            {/* 3rd Place */}
            <VStack className="items-center flex-1">
              <Medal size={20} className="text-amber-700 mb-1" />
              <Box className="w-10 h-10 rounded-full border border-amber-700/30 items-center justify-center bg-brand-light-bg dark:bg-brand-dark-bg">
                <User size={18} className="text-amber-700" />
              </Box>
              <Text className="text-[9px] text-brand-light-text dark:text-brand-dark-text font-bold mt-1 text-center truncate max-w-[70px]">
                {leaders[2]?.full_name || 'Alyx V.'}
              </Text>
              <Text className="text-[7.5px] text-brand-primary font-bold mt-0.5">
                Lv {leaders[2]?.level}
              </Text>
              <Box className="w-16 h-8 bg-amber-700/20 border-t border-amber-700/30 rounded-t-lg mt-2 items-center justify-center">
                <Text className="text-xs font-bold text-amber-700">#3</Text>
              </Box>
            </VStack>
          </HStack>
        )}

        {/* Global Ranks List */}
        <VStack space="md">
          <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text uppercase tracking-widest text-[9px] font-bold">
            Bảng vàng xếp hạng
          </Heading>

          {isLoading ? (
            <ActivityIndicator size="small" color="#8EB69B" className="py-8" />
          ) : (
            leaders.map((leader, index) => (
              <Box 
                key={leader.id} 
                className={`border rounded-xl p-4 shadow-sm ${getRankBadgeBg(index)}`}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center flex-1">
                    {/* Rank Badge */}
                    <Box className="w-7 h-7 rounded-full items-center justify-center bg-brand-light-bg/50 dark:bg-brand-dark-bg/50 border border-brand-light-border/30">
                      {index < 3 ? (
                        index === 0 ? <Trophy size={14} className={getRankBadgeColor(index)} /> : <Medal size={14} className={getRankBadgeColor(index)} />
                      ) : (
                        <Text className="text-xs font-bold text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono">{index + 1}</Text>
                      )}
                    </Box>
                    <VStack className="flex-1 pr-4">
                      <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text font-bold">
                        {leader.full_name}
                      </Heading>
                      <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono">
                        @{leader.username}
                      </Text>
                    </VStack>
                  </HStack>

                  <VStack className="items-end">
                    <HStack space="xs" className="items-center">
                      <TrendingUp size={11} className="text-brand-primary" />
                      <Text className="text-xs font-bold text-brand-primary font-mono">{leader.xp} XP</Text>
                    </HStack>
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold tracking-wider uppercase mt-0.5">
                      Cấp độ {leader.level}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            ))
          )}
        </VStack>
      </VStack>
    </ScrollView>
  );
}
