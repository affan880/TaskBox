import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Re-export OnboardingIcon
export { OnboardingIcon } from './OnboardingIcons';

// Define PaperclipIcon component
export function PaperclipIcon({ size = 16, color = '#000', style }: { size?: number; color?: string; style?: any }) {
  return <Icon name="paperclip" size={size} color={color} style={style} />;
} 