import * as React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

type ProgressDotsProps = {
  slides: any[];
  currentIndex: number;
};

export function ProgressDots({ slides, currentIndex }: ProgressDotsProps) {
  return (
    <View style={styles.progressContainer}>
      {slides.map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.progressDot,
            {
              backgroundColor: 
                index === currentIndex
                  ? '#FFFFFF'
                  : 'rgba(255, 255, 255, 0.2)',
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderWidth: 4,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  progressDot: {
    height: 12,
    width: 12,
    marginRight: 8,
    backgroundColor: '#ff3333',
    borderWidth: 2,
    borderColor: '#000000',
  },
}); 