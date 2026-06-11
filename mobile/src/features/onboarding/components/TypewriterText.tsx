import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  style?: any;
}

export default function TypewriterText({
  text,
  speed = 40,
  onComplete,
  className = '',
  style
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    
    const intervalId = setInterval(() => {
      if (index < text.length) {
        // Use functional state update to prevent closure stale values
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(intervalId);
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed]);

  // Cursor blink animation
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <Text className={className} style={style}>
      {displayedText}
      <Text className="text-brand-primary font-bold">
        {showCursor ? '|' : ' '}
      </Text>
    </Text>
  );
}
