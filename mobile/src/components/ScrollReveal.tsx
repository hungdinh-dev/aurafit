import React, { useState } from 'react';
import { Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay, 
  useAnimatedReaction,
  SharedValue
} from 'react-native-reanimated';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  scrollY?: SharedValue<number>;
}

export default function ScrollReveal({ 
  children, 
  delay = 0, 
  duration = 650, 
  scrollY 
}: ScrollRevealProps) {
  const [layoutY, setLayoutY] = useState<number | null>(null);
  const isVisible = useSharedValue(false);
  const screenHeight = Dimensions.get('window').height;

  // React to scroll updates
  useAnimatedReaction(
    () => scrollY?.value ?? 0,
    (currentScroll) => {
      if (layoutY !== null && !isVisible.value) {
        // Trigger reveal when item top is within viewport height
        if (currentScroll + screenHeight - 80 > layoutY) {
          isVisible.value = true;
        }
      }
    },
    [layoutY, scrollY]
  );

  // If no scrollY is provided or layoutY is not yet measured, but we want a default mount animation
  React.useEffect(() => {
    if (!scrollY) {
      isVisible.value = true;
    }
  }, [scrollY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withDelay(
        delay,
        withTiming(isVisible.value ? 1 : 0, { duration })
      ),
      transform: [
        {
          translateY: withDelay(
            delay,
            withTiming(isVisible.value ? 0 : 40, { duration })
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      onLayout={(event) => {
        // Measure element's y position within parent scroll container
        const { y } = event.nativeEvent.layout;
        setLayoutY(y);
      }}
      style={animatedStyle}
    >
      {children}
    </Animated.View>
  );
}
