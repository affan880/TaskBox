import { COLORS, PREMIUM_SHADOWS, PREMIUM_GRADIENTS } from './colors';

/**
 * Plexar - Premium Design System
 * 
 * A comprehensive design system that defines spacing, typography, 
 * shadows, borders, and other design elements for consistent premium UI.
 * Designed for modern productivity apps with glassmorphism and premium effects.
 */

// Premium spacing scale (in pixels) - 24px grid system
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
  xxxxxl: 64,
  xxxxxxl: 96,
} as const;

// Premium Typography System
export const TYPOGRAPHY = {
  fontFamily: {
    base: undefined, // System default
    heading: undefined, // System default
    mono: 'monospace',
  },
  
  // Enhanced font weights for premium feel
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Premium font sizes with better scale
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    xxxxl: 32,
    xxxxxl: 36,
    xxxxxxl: 48,
  },
  
  // Enhanced line heights for better readability
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.3,
    normal: 1.4,
    relaxed: 1.5,
    loose: 1.75,
    extraLoose: 2,
  },
  
  // Letter spacing for premium typography
  letterSpacing: {
    tighter: -0.8,
    tight: -0.5,
    normal: 0,
    wide: 0.2,
    wider: 0.3,
    widest: 0.5,
  },
  
  // Premium text variants
  variant: {
    // Headers
    h1: {
      fontSize: 36,
      fontWeight: '800',
      lineHeight: 1.2,
      letterSpacing: -0.8,
    },
    h2: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
    h3: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 1.3,
      letterSpacing: -0.3,
    },
    h4: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.3,
      letterSpacing: -0.2,
    },
    h5: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.4,
      letterSpacing: -0.1,
    },
    h6: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    
    // Body text
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    
    // Subtitles
    subtitle1: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.2,
    },
    subtitle2: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.2,
    },
    
    // UI elements
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.4,
      letterSpacing: 0.3,
    },
    overline: {
      fontSize: 11,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    button: {
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: -0.1,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 0,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.1,
    },
  },
} as const;

// Premium border radius system
export const BORDER_RADIUS = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  xxxxl: 32,
  round: 9999, // For circular elements
} as const;

// Premium shadow system with enhanced depth
export const SHADOWS = {
  ...PREMIUM_SHADOWS,
  // Additional premium shadows
  xxl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

// Premium animations and transitions
export const ANIMATION = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
    slowest: 800,
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Premium cubic bezier curves
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  spring: {
    gentle: { tension: 120, friction: 14 },
    wobbly: { tension: 180, friction: 12 },
    stiff: { tension: 210, friction: 20 },
    slow: { tension: 280, friction: 60 },
    molasses: { tension: 280, friction: 120 },
  },
} as const;

// Enhanced Z-index values for consistent stacking
export const Z_INDEX = {
  base: 0,
  elevated: 1,
  sticky: 100,
  fixed: 200,
  overlay: 300,
  dropdown: 400,
  modal: 500,
  popover: 600,
  toast: 700,
  tooltip: 800,
  loading: 900,
  max: 9999,
} as const;

// Premium opacity scale
export const OPACITY = {
  disabled: 0.38,
  inactive: 0.54,
  secondary: 0.6,
  medium: 0.7,
  high: 0.87,
  full: 1,
} as const;

// Premium breakpoints for responsive design
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
} as const;

// Premium layout constants
export const LAYOUT = {
  headerHeight: 64,
  tabBarHeight: 80,
  bottomSheetHeaderHeight: 56,
  listItemHeight: 72,
  buttonHeight: {
    small: 32,
    medium: 40,
    large: 48,
    xlarge: 56,
  },
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    xxl: 80,
  },
} as const;

// Premium glassmorphism effects
export const GLASS = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(15px)',
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
} as const;

// Complete premium theme object
export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  animation: ANIMATION,
  zIndex: Z_INDEX,
  opacity: OPACITY,
  breakpoints: BREAKPOINTS,
  layout: LAYOUT,
  glass: GLASS,
  gradients: PREMIUM_GRADIENTS,
} as const;

// Type definitions
export type Theme = typeof THEME;
export type Spacing = keyof typeof SPACING;
export type FontSize = keyof typeof TYPOGRAPHY.fontSize;
export type FontWeight = keyof typeof TYPOGRAPHY.fontWeight;
export type BorderRadius = keyof typeof BORDER_RADIUS;
export type Shadow = keyof typeof SHADOWS;
export type ZIndex = keyof typeof Z_INDEX;

// Default export for easy importing
export default THEME; 