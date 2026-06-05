import React, { useState } from 'react';
import { Pressable, Alert } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { Target, Dumbbell, TrendingUp, User } from 'lucide-react-native';

export default function BottomNav() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabPress = (tabName: string, detail: string) => {
    setActiveTab(tabName);
    Alert.alert('Chuyển Tab', `Tính năng đang phát triển: ${detail}`);
  };

  return (
    <HStack className="absolute bottom-6 left-6 right-6 z-50 justify-around items-center py-2 px-4 bg-slate-900/80 backdrop-blur-lg border border-slate-800 rounded-full shadow-2xl">
      {/* Tab 1: Dashboard (Target) */}
      <Pressable
        onPress={() => setActiveTab('dashboard')}
        className={`w-10 h-10 rounded-full items-center justify-center transition-all ${
          activeTab === 'dashboard' ? 'bg-indigo-650' : 'bg-transparent'
        }`}
      >
        <Target 
          size={18} 
          className={activeTab === 'dashboard' ? 'text-white' : 'text-slate-450'} 
        />
      </Pressable>

      {/* Tab 2: Workout (Fitness Center) */}
      <Pressable
        onPress={() => handleTabPress('workout', 'Danh sách bài tập và lịch trình')}
        className={`w-10 h-10 rounded-full items-center justify-center transition-all ${
          activeTab === 'workout' ? 'bg-indigo-650' : 'bg-transparent'
        }`}
      >
        <Dumbbell 
          size={18} 
          className={activeTab === 'workout' ? 'text-white' : 'text-slate-450'} 
        />
      </Pressable>

      {/* Tab 3: Leaderboard (TrendingUp) */}
      <Pressable
        onPress={() => handleTabPress('leaderboard', 'Bảng xếp hạng Aura và Nhiệm vụ')}
        className={`w-10 h-10 rounded-full items-center justify-center transition-all ${
          activeTab === 'leaderboard' ? 'bg-indigo-650' : 'bg-transparent'
        }`}
      >
        <TrendingUp 
          size={18} 
          className={activeTab === 'leaderboard' ? 'text-white' : 'text-slate-450'} 
        />
      </Pressable>

      {/* Tab 4: Profile (User) */}
      <Pressable
        onPress={() => handleTabPress('profile', 'Thông tin cá nhân & Chỉ số sinh học')}
        className={`w-10 h-10 rounded-full items-center justify-center transition-all ${
          activeTab === 'profile' ? 'bg-indigo-650' : 'bg-transparent'
        }`}
      >
        <User 
          size={18} 
          className={activeTab === 'profile' ? 'text-white' : 'text-slate-450'} 
        />
      </Pressable>
    </HStack>
  );
}
