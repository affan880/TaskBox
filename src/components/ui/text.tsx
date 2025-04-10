import * as React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/theme-context';

export type TextVariant = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'h4' 
  | 'title' 
  | 'subtitle' 
  | 'body' 
  | 'bodySmall' 
  | 'caption' 
  | 'button';

export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string;
  muted?: boolean;
  centered?: boolean;
}

export function Text({
  variant = 'body',
  weight = 'normal',
  color,
  style,
  muted = false,
  centered = false,
  ...props
}: TextProps) {
  const { colors, isDark } = useTheme();

  // Get the variant-specific styles
  const variantStyle = React.useMemo(() => {
    return {
      h1: styles.h1,
      h2: styles.h2,
      h3: styles.h3,
      h4: styles.h4,
      title: styles.title,
      subtitle: styles.subtitle,
      body: styles.body,
      bodySmall: styles.bodySmall,
      caption: styles.caption,
      button: styles.button,
    }[variant];
  }, [variant]);

  // Get the weight-specific styles
  const weightStyle = React.useMemo(() => {
    return {
      normal: styles.weightNormal,
      medium: styles.weightMedium,
      semibold: styles.weightSemibold,
      bold: styles.weightBold,
    }[weight];
  }, [weight]);

  // Determine text color based on props and theme
  const textColor = React.useMemo(() => {
    if (color) return { color };
    
    if (muted) {
      return { color: colors.text.secondary };
    }
    
    return { color: colors.text.primary };
  }, [color, colors.text, muted]);

  // Text alignment
  const textAlignment = centered ? { textAlign: 'center' as const } : {};

  // Combine all styles
  const combinedStyle = [
    styles.base,
    variantStyle,
    weightStyle,
    textColor,
    textAlignment,
    style,
  ];

  return <RNText style={combinedStyle} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0.15,
  },
  
  // Variants
  h1: {
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Weights
  weightNormal: {
    fontWeight: '400',
  },
  weightMedium: {
    fontWeight: '500',
  },
  weightSemibold: {
    fontWeight: '600',
  },
  weightBold: {
    fontWeight: '700',
  },
}); 