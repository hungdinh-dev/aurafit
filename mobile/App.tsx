import "./global.css";
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, SafeAreaView } from 'react-native';

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center p-6">
        {/* Card Container */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-sm items-center shadow-2xl">
          {/* Logo / Icon Placeholder */}
          <View className="w-16 h-16 bg-indigo-500/10 rounded-2xl items-center justify-center mb-6 border border-indigo-500/20">
            <Text className="text-3xl">⚡</Text>
          </View>

          {/* Titles */}
          <Text className="text-2xl font-bold tracking-wider text-slate-100 text-center uppercase">
            AuraFit Mobile
          </Text>
          <Text className="text-sm text-indigo-400 font-medium tracking-wide mt-1 text-center">
            React Native Expo Shell
          </Text>
          
          <Text className="text-xs text-slate-400 text-center mt-4 leading-relaxed font-mono">
            NativeWind v4 compiled successfully.
          </Text>

          {/* Status Badge */}
          <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mt-6">
            <Text className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase">
              ● Ready for Development
            </Text>
          </View>
        </View>

        <StatusBar style="light" />
      </View>
    </SafeAreaView>
  );
}
