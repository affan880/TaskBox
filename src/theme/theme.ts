import { COLORS } from './colors';

/**
 * TaskBox - Design System
 * 
 * A comprehensive design system that defines spacing, typography, 
 * shadows, borders, and other design elements for consistent UI.
 */

// Spacing scale (in pixels)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    base: undefined, // System default
    heading: undefined, // System default
    mono: 'monospace',
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Text variants
  variant: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 1.2,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.4,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.2,
    },
  },
} as const;

// Border radius
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999, // For circular elements
} as const;

// Shadows
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
} as const;

// Animations and transitions
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  },
} as const;

// Z-index values for consistent stacking
export const Z_INDEX = {
  base: 0,
  elevated: 1,
  sticky: 100,
  dropdown: 200,
  modal: 300,
  toast: 400,
  tooltip: 500,
} as const;

// Complete theme object
export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  animation: ANIMATION,
  zIndex: Z_INDEX,
} as const;

// Type for the theme object
export type Theme = typeof THEME;

// Default export for easy importing
export default THEME; 