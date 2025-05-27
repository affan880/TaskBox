/**
 * Plexar - Premium Color System with Dark Mode Support
 * 
 * A sophisticated, accessible color palette with excellent contrast ratios,
 * consistent semantic meaning, and premium dark/light mode support.
 * Designed for modern productivity apps with glassmorphism and premium effects.
 */

import { Platform } from 'react-native';

export type ColorTheme = {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    tinted: string;
    card: string;
  };
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    interactive: string;
    glass: string;
  };
  brand: {
    primary: string;
    secondary: string;
    dark: string;
    light: string;
    gradient: string[];
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    inverse: string;
    accent: string;
    link: string;
  };
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
    successLight: string;
    errorLight: string;
    warningLight: string;
    infoLight: string;
  };
  border: {
    light: string;
    medium: string;
    dark: string;
    accent: string;
    glass: string;
  };
  shadow: {
    light: string;
    medium: string;
    dark: string;
    colored: string;
  };
  gradients: {
    primary: string[];
    secondary: string[];
    accent: string[];
    success: string[];
    error: string[];
    warning: string[];
    info: string[];
    glass: string[];
    premium: string[];
  };
};

// Premium color palette - carefully selected for modern apps
const palette = {
  // Premium Blues - Primary brand colors
  azure: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },
  
  // Premium Purples - Secondary brand colors
  violet: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764'
  },
  
  // Premium Indigos - Accent colors
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b'
  },
  
  // Premium Grays - Neutral colors
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },
  
  // Premium Dark Colors
  dark: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },
  
  // Status Colors - Modern and accessible
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22'
  },
  
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519'
  },
  
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },
  
  // Pure colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'rgba(0, 0, 0, 0)',
};

// Premium Light Theme
export const COLORS: ColorTheme = {
  background: {
    primary: palette.white,
    secondary: palette.slate[50],
    tertiary: palette.slate[100],
    accent: palette.indigo[50],
    tinted: palette.violet[50],
    card: palette.white,
  },
  surface: {
    primary: palette.white,
    secondary: palette.slate[50],
    tertiary: palette.slate[100],
    elevated: palette.white,
    interactive: palette.indigo[50],
    glass: 'rgba(255, 255, 255, 0.8)',
  },
  brand: {
    primary: palette.indigo[600],
    secondary: palette.violet[600],
    dark: palette.indigo[700],
    light: palette.indigo[100],
    gradient: [palette.indigo[500], palette.violet[600]],
  },
  text: {
    primary: palette.slate[900],
    secondary: palette.slate[600],
    tertiary: palette.slate[500],
    quaternary: palette.slate[400],
    inverse: palette.white,
    accent: palette.indigo[600],
    link: palette.azure[600],
  },
  status: {
    success: palette.emerald[600],
    error: palette.rose[600],
    warning: palette.amber[500],
    info: palette.azure[600],
    successLight: palette.emerald[50],
    errorLight: palette.rose[50],
    warningLight: palette.amber[50],
    infoLight: palette.azure[50],
  },
  border: {
    light: palette.slate[200],
    medium: palette.slate[300],
    dark: palette.slate[400],
    accent: palette.indigo[300],
    glass: 'rgba(255, 255, 255, 0.2)',
  },
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.15)',
    colored: 'rgba(99, 102, 241, 0.15)',
  },
  gradients: {
    primary: [palette.indigo[500], palette.indigo[700]],
    secondary: [palette.violet[500], palette.violet[700]],
    accent: [palette.indigo[500], palette.violet[600]],
    success: [palette.emerald[500], palette.emerald[700]],
    error: [palette.rose[500], palette.rose[700]],
    warning: [palette.amber[400], palette.amber[600]],
    info: [palette.azure[500], palette.azure[700]],
    glass: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)'],
    premium: [palette.indigo[600], palette.violet[600], palette.azure[500]],
  },
};

// Premium Dark Theme
export const DARK_COLORS: ColorTheme = {
  background: {
    primary: palette.slate[950],
    secondary: palette.slate[900],
    tertiary: palette.slate[800],
    accent: palette.indigo[950],
    tinted: palette.violet[950],
    card: palette.slate[900],
  },
  surface: {
    primary: palette.slate[900],
    secondary: palette.slate[800],
    tertiary: palette.slate[700],
    elevated: palette.slate[800],
    interactive: palette.indigo[900],
    glass: 'rgba(15, 23, 42, 0.8)',
  },
  brand: {
    primary: palette.indigo[400],
    secondary: palette.violet[400],
    dark: palette.indigo[500],
    light: palette.indigo[300],
    gradient: [palette.indigo[400], palette.violet[500]],
  },
  text: {
    primary: palette.slate[50],
    secondary: palette.slate[300],
    tertiary: palette.slate[400],
    quaternary: palette.slate[500],
    inverse: palette.slate[900],
    accent: palette.indigo[400],
    link: palette.azure[400],
  },
  status: {
    success: palette.emerald[400],
    error: palette.rose[400],
    warning: palette.amber[400],
    info: palette.azure[400],
    successLight: palette.emerald[950],
    errorLight: palette.rose[950],
    warningLight: palette.amber[950],
    infoLight: palette.azure[950],
  },
  border: {
    light: palette.slate[700],
    medium: palette.slate[600],
    dark: palette.slate[500],
    accent: palette.indigo[600],
    glass: 'rgba(255, 255, 255, 0.1)',
  },
  shadow: {
    light: 'rgba(0, 0, 0, 0.2)',
    medium: 'rgba(0, 0, 0, 0.3)',
    dark: 'rgba(0, 0, 0, 0.4)',
    colored: 'rgba(99, 102, 241, 0.3)',
  },
  gradients: {
    primary: [palette.indigo[400], palette.indigo[600]],
    secondary: [palette.violet[400], palette.violet[600]],
    accent: [palette.indigo[400], palette.violet[500]],
    success: [palette.emerald[400], palette.emerald[600]],
    error: [palette.rose[400], palette.rose[600]],
    warning: [palette.amber[400], palette.amber[600]],
    info: [palette.azure[400], palette.azure[600]],
    glass: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'],
    premium: [palette.indigo[400], palette.violet[500], palette.azure[400]],
  },
};

// Enhanced theme creation function
export const createTheme = (isDark = false): ColorTheme => {
  return isDark ? DARK_COLORS : COLORS;
};

// Premium gradient presets for common use cases
export const PREMIUM_GRADIENTS = {
  // Header gradients
  headerLight: ['#667eea', '#764ba2', '#f093fb'],
  headerDark: ['#1a1a2e', '#16213e', '#0f3460'],
  
  // Card gradients
  cardLight: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],
  cardDark: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'],
  
  // Button gradients
  primaryButton: [palette.indigo[500], palette.indigo[700]],
  secondaryButton: [palette.violet[500], palette.violet[700]],
  successButton: [palette.emerald[500], palette.emerald[700]],
  errorButton: [palette.rose[500], palette.rose[700]],
  
  // Glass morphism gradients
  glassLight: ['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)'],
  glassDark: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  
  // Premium brand gradients
  brand: [palette.indigo[600], palette.violet[600], palette.azure[500]],
  brandDark: [palette.indigo[400], palette.violet[500], palette.azure[400]],
};

// Shadow presets for consistent elevation
export const PREMIUM_SHADOWS = {
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
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  premium: {
    shadowColor: palette.indigo[600],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Export the light theme as the default
export const COLORS_LIGHT = COLORS;

// Also export a dark theme
export const COLORS_DARK = DARK_COLORS;

// Legacy support - keeping old type names for backward compatibility
export type ColorTheme_OLD = typeof COLORS_LIGHT;

export type ColorValue = {
  [K in keyof typeof COLORS_LIGHT]: typeof COLORS_LIGHT[K] extends string
    ? typeof COLORS_LIGHT[K]
    : {
        [SubK in keyof typeof COLORS_LIGHT[K]]: typeof COLORS_LIGHT[K][SubK];
      };
}; 