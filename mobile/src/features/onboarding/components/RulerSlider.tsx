import React, { useRef, useEffect, useState } from 'react';
import { View, ScrollView, Text, Dimensions, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface RulerSliderProps {
  min: number;
  max: number;
  step?: number;
  initialValue: number;
  unit?: string;
  onChange: (value: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const TICK_SPACING = 12; // pixels between ticks
const CENTER_SPACER = SCREEN_WIDTH / 2;

export default function RulerSlider({
  min,
  max,
  step = 1,
  initialValue,
  unit = '',
  onChange
}: RulerSliderProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentVal, setCurrentVal] = useState(initialValue);
  const isInitialScroll = useRef(true);

  // Generate tick values
  const ticks: number[] = [];
  for (let i = min; i <= max; i += step) {
    ticks.push(i);
  }

  // Calculate scroll offset for a specific value
  const getOffsetForValue = (val: number) => {
    const index = (val - min) / step;
    return index * TICK_SPACING;
  };

  // Scroll to initial value on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollViewRef.current) {
        const offset = getOffsetForValue(initialValue);
        scrollViewRef.current.scrollTo({ x: offset, animated: false });
        // After initial positioning, enable calling onChange
        isInitialScroll.current = false;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [min, initialValue]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    // Calculate nearest value
    const index = Math.round(x / TICK_SPACING);
    const clampedIndex = Math.max(0, Math.min(ticks.length - 1, index));
    const value = ticks[clampedIndex];

    if (value !== currentVal) {
      setCurrentVal(value);
      if (!isInitialScroll.current) {
        onChange(value);
      }
    }
  };

  return (
    <View className="w-full items-center my-6">
      {/* Value Indicator Display */}
      <View className="flex-row items-baseline justify-center mb-6">
        <Text className="text-5xl font-extrabold text-brand-light-text dark:text-brand-dark-text tracking-tighter">
          {currentVal}
        </Text>
        {unit ? (
          <Text className="text-lg font-bold text-brand-primary ml-1 lowercase">
            {unit}
          </Text>
        ) : null}
      </View>

      {/* Ruler Container */}
      <View className="w-full relative h-28 items-center justify-center">
        {/* Central Indicator Line */}
        <View 
          className="absolute top-0 bottom-6 w-0.5 bg-brand-primary z-20 shadow-md"
          style={{ left: SCREEN_WIDTH / 2 - 1 }}
        />

        {/* Scrollable Ruler */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_SPACING}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          contentContainerStyle={{
            paddingLeft: CENTER_SPACER,
            paddingRight: CENTER_SPACER,
          }}
          className="w-full h-full"
        >
          {ticks.map((tick, index) => {
            const isMajor = tick % 10 === 0;
            const isMedium = tick % 5 === 0 && !isMajor;

            return (
              <View 
                key={index} 
                style={{ width: TICK_SPACING }} 
                className="items-center justify-start h-full"
              >
                {/* Tick mark line */}
                <View 
                  className={`w-[1.5px] rounded-full bg-brand-light-border dark:bg-brand-dark-border ${
                    isMajor 
                      ? 'h-10 bg-brand-primary/80 dark:bg-brand-primary' 
                      : isMedium 
                        ? 'h-6 bg-brand-light-text-muted/60 dark:bg-brand-dark-text-muted/70' 
                        : 'h-4 bg-brand-light-text-muted/30 dark:bg-brand-dark-text-muted/30'
                  }`}
                />

                {/* Major numbers */}
                {isMajor && (
                  <Text className="text-[10px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold font-mono mt-2 text-center absolute top-12">
                    {tick}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
