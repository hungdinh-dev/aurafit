import React from 'react';
import { View, Text } from 'react-native';

interface CircularDialProps {
  value: number; // current value
  max: number;   // max value
  unit?: string;
  subtitle?: string;
  size?: number;
}

export default function CircularDial({
  value,
  max,
  unit = '',
  subtitle = '',
  size = 200
}: CircularDialProps) {
  const totalDashes = 48; // Total dashes around the ring
  const activeDashesCount = Math.round((value / max) * totalDashes);
  const radius = size * 0.4; // 80% of half size
  const center = size / 2;

  // Generate dashes positioning
  const dashes = Array.from({ length: totalDashes }).map((_, i) => {
    // Start from top (subtract PI/2)
    const angle = (i * 2 * Math.PI) / totalDashes - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    const rotation = (i * 360) / totalDashes; // degrees

    const isActive = i <= activeDashesCount;

    return (
      <View
        key={i}
        style={{
          position: 'absolute',
          left: x - 2, // offset half of dash width
          top: y - 8,  // offset half of dash height
          width: 3,
          height: 12,
          backgroundColor: isActive ? '#8EB69B' : '#1E352F', // Brand primary vs border
          transform: [{ rotate: `${rotation}deg` }],
          opacity: isActive ? 1 : 0.4,
          borderRadius: 2
        }}
      />
    );
  });

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center relative">
      {/* Dashed Ring */}
      {dashes}

      {/* Center Text Panel */}
      <View className="items-center justify-center">
        <Text className="text-4xl font-black text-brand-primary tracking-tighter">
          {value}
          <Text className="text-lg font-bold text-brand-light-text-muted dark:text-brand-dark-text-muted lowercase ml-0.5">
            {unit}
          </Text>
        </Text>
        {subtitle ? (
          <Text className="text-xs font-bold text-brand-light-text-muted dark:text-brand-dark-text-muted mt-1 uppercase tracking-widest text-center max-w-[120px]">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
