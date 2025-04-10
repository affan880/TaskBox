/**
 * TaskBox - Modern Color System with Dark Mode Support
 * 
 * A vibrant, accessible color palette with good contrast ratios,
 * consistent semantic meaning, and dark/light mode support.
 */

import { Platform } from 'react-native';

export type ColorTheme = {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  surface: {
    primary: string;
    secondary: string;
    card: string;
    highlight: string;
  };
  brand: {
    primary: string;
    secondary: string;
    dark: string;
    light: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    inverse: string;
  };
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  border: {
    light: string;
    medium: string;
    dark: string;
  };
};

// App-wide global color palette 
export const COLORS: ColorTheme = {
  background: {
    primary: '#ffffff',
    secondary: '#ffffff',
    tertiary: '#ffffff',
  },
  surface: {
    primary: '#ffffff',
    secondary: '#f7f9fc',
    card: '#e2eafc',
    highlight: '#edf0ff',
  },
  brand: {
    primary: '#5c6ac4',
    secondary: '#7785dc',
    dark: '#4a57a9',
    light: '#e2eafc',
  },
  text: {
    primary: '#1a202c',
    secondary: '#4a5568',
    tertiary: '#718096',
    quaternary: '#a0aec0',
    inverse: '#ffffff',
  },
  status: {
    success: '#48bb78',
    error: '#f56565',
    warning: '#ed8936',
    info: '#4299e1',
  },
  border: {
    light: '#e2e8f0',
    medium: '#cbd5e0',
    dark: '#a0aec0',
  },
};

// Dark mode colors
export const DARK_COLORS: ColorTheme = {
  background: {
    primary: '#ffffff',
    secondary: '#ffffff',
    tertiary: '#ffffff',
  },
  surface: {
    primary: '#ffffff',
    secondary: '#f7f9fc',
    card: '#e2eafc',
    highlight: '#edf0ff',
  },
  brand: {
    primary: '#5c6ac4',
    secondary: '#7785dc',
    dark: '#4a57a9',
    light: '#e2eafc',
  },
  text: {
    primary: '#1a202c',
    secondary: '#4a5568',
    tertiary: '#718096',
    quaternary: '#a0aec0',
    inverse: '#ffffff',
  },
  status: {
    success: '#68d391',
    error: '#fc8181',
    warning: '#f6ad55',
    info: '#63b3ed',
  },
  border: {
    light: '#2d3748',
    medium: '#4a5568',
    dark: '#718096',
  },
};

// Base palette - named by color, not by usage
const palette = {
  // Primary - Alabaster
  alabaster: {
    DEFAULT: '#f1f1e4',
    100: '#3e3e20',
    200: '#7c7c40',
    300: '#b1b168',
    400: '#d1d1a6',
    500: '#f1f1e4',
    600: '#f4f4e9',
    700: '#f7f7ef',
    800: '#f9f9f4',
    900: '#fcfcfa'
  },
  
  // Secondary - Primary Blue (previously Raspberry)
  primaryBlue: {
    DEFAULT: '#788bff',
    100: '#080d33',
    200: '#101a66',
    300: '#172799',
    400: '#1f34cc',
    500: '#4c62ff',
    600: '#788bff',
    700: '#96a3ff',
    800: '#b4bcff',
    900: '#d7daff'
  },
  
  // Accent - Cornflower Blue
  cornflowerBlue: {
    DEFAULT: '#7189ff',
    100: '#000c49',
    200: '#001893',
    300: '#0025dc',
    400: '#274bff',
    500: '#7189ff',
    600: '#8da0ff',
    700: '#a9b8ff',
    800: '#c6cfff',
    900: '#e2e7ff'
  },
  
  // Secondary Accent - Raspberry
  raspberry: {
    DEFAULT: '#d81e5b',
    100: '#2b0612',
    200: '#560c25',
    300: '#811237',
    400: '#ac1849',
    500: '#d81e5b',
    600: '#e6447a',
    700: '#ec739b',
    800: '#f2a2bd',
    900: '#f9d0de'
  },
  
  // Neutrals - Dim Gray
  dimGray: {
    DEFAULT: '#666b6a',
    100: '#141515',
    200: '#292b2a',
    300: '#3d403f',
    400: '#525555',
    500: '#666b6a',
    600: '#848988',
    700: '#a3a7a6',
    800: '#c2c4c4',
    900: '#e0e2e1'
  },
  
  // Dark - Night
  night: {
    DEFAULT: '#090c08',
    100: '#020202',
    200: '#040503',
    300: '#060705',
    400: '#070a07',
    500: '#090c08',
    600: '#35472f',
    700: '#618256',
    800: '#93b189',
    900: '#c9d8c4'
  },
  
  // Success - Green
  green: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  
  // Error - Red
  red: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },
  
  // Warning - Orange
  orange: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  
  // Pure colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Create theme with light and dark mode
export const createTheme = (isDark = false) => ({
  // App backgrounds
  background: {
    primary: isDark ? palette.night[300] : palette.alabaster[500],
    secondary: isDark ? palette.night[400] : palette.alabaster[700],
    tertiary: isDark ? palette.night[200] : palette.alabaster[400],
    accent: isDark ? palette.cornflowerBlue[100] : palette.cornflowerBlue[900],
    tinted: isDark ? palette.primaryBlue[100] : palette.primaryBlue[900],
    card: isDark ? palette.night[300] : palette.white,
  },
  
  // Surface elements (cards, modals, etc.)
  surface: {
    primary: isDark ? palette.night[300] : palette.white,
    secondary: isDark ? palette.night[400] : palette.alabaster[700],
    tertiary: isDark ? palette.dimGray[300] : palette.alabaster[400],
    elevated: isDark ? palette.dimGray[200] : palette.white,
    interactive: isDark ? palette.primaryBlue[200] : palette.primaryBlue[800],
  },
  
  // Text colors
  text: {
    primary: isDark ? palette.alabaster[500] : palette.night[500],
    secondary: isDark ? palette.alabaster[300] : palette.dimGray[600],
    tertiary: isDark ? palette.alabaster[400] : palette.dimGray[500],
    disabled: isDark ? palette.dimGray[600] : palette.dimGray[400],
    inverse: isDark ? palette.night[500] : palette.alabaster[500],
    link: isDark ? palette.primaryBlue[400] : palette.primaryBlue[500],
    accent: isDark ? palette.primaryBlue[400] : palette.primaryBlue[600],
  },
  
  // UI Element colors
  border: {
    light: isDark ? palette.dimGray[300] : palette.alabaster[400],
    default: isDark ? palette.dimGray[200] : palette.alabaster[300],
    dark: isDark ? palette.dimGray[100] : palette.alabaster[200],
    accent: isDark ? palette.primaryBlue[300] : palette.primaryBlue[600],
  },
  
  // Brand colors
  brand: {
    primary: palette.primaryBlue[600],
    secondary: palette.cornflowerBlue[500],
    light: palette.primaryBlue[500],
    dark: palette.primaryBlue[700],
  },
  
  // Action and interaction colors
  action: {
    primary: palette.primaryBlue[600],
    secondary: palette.cornflowerBlue[500],
    hover: isDark ? palette.primaryBlue[500] : palette.primaryBlue[700],
    pressed: isDark ? palette.primaryBlue[400] : palette.primaryBlue[800],
    disabled: isDark ? palette.dimGray[600] : palette.dimGray[300],
  },
  
  // Status indicators
  status: {
    success: palette.green[600],
    error: palette.red[600],
    warning: palette.orange[500],
    info: palette.primaryBlue[600],
    successLight: isDark ? palette.green[900] : palette.green[100],
    errorLight: isDark ? palette.red[900] : palette.red[100],
    warningLight: isDark ? palette.orange[900] : palette.orange[100],
    infoLight: isDark ? palette.primaryBlue[200] : palette.primaryBlue[800],
    unread: palette.primaryBlue[600],
    read: isDark ? palette.dimGray[400] : palette.dimGray[500],
  },
  
  // Component-specific overrides
  component: {
    card: {
      background: isDark ? palette.night[300] : palette.white,
      border: isDark ? palette.night[200] : palette.alabaster[400],
      shadow: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
    },
    header: {
      background: isDark ? palette.night[400] : palette.alabaster[500],
      text: isDark ? palette.alabaster[500] : palette.night[500],
      border: isDark ? palette.night[300] : palette.alabaster[400],
    },
    button: {
      primary: palette.primaryBlue[600],
      secondary: isDark ? palette.dimGray[300] : palette.alabaster[400],
      success: palette.green[600],
      danger: palette.red[600],
      text: isDark ? palette.night[500] : palette.white,
      textSecondary: isDark ? palette.alabaster[400] : palette.dimGray[600],
    },
    input: {
      background: isDark ? palette.night[300] : palette.white,
      border: isDark ? palette.dimGray[300] : palette.alabaster[400],
      focusBorder: isDark ? palette.primaryBlue[400] : palette.primaryBlue[600],
      text: isDark ? palette.alabaster[500] : palette.night[500],
      placeholder: isDark ? palette.dimGray[500] : palette.dimGray[400],
    },
    toast: {
      background: isDark ? palette.night[300] : palette.dimGray[600],
      text: isDark ? palette.alabaster[500] : palette.white,
    },
  },
  
  // Email-specific colors
  email: {
    avatar: {
      primary: palette.primaryBlue[600],
      secondary: palette.cornflowerBlue[500],
      unread: palette.primaryBlue[600],
      read: isDark ? palette.dimGray[600] : palette.dimGray[400],
    },
    label: {
      primary: isDark ? palette.primaryBlue[400] : palette.primaryBlue[600],
      secondary: isDark ? palette.cornflowerBlue[200] : palette.cornflowerBlue[800],
      important: isDark ? palette.orange[200] : palette.orange[800],
      personal: isDark ? palette.green[200] : palette.green[800],
      work: isDark ? palette.cornflowerBlue[200] : palette.cornflowerBlue[800],
    },
  },
  
  // Gradients
  gradients: {
    primary: [palette.primaryBlue[500], palette.primaryBlue[700]],
    secondary: [palette.cornflowerBlue[400], palette.cornflowerBlue[600]],
    accent: [palette.primaryBlue[500], palette.cornflowerBlue[500]],
    success: [palette.green[400], palette.green[600]],
    error: [palette.red[400], palette.red[600]],
    warning: [palette.orange[400], palette.orange[600]],
    info: [palette.primaryBlue[500], palette.primaryBlue[700]],
    dark: [palette.night[300], palette.night[500]],
    light: [palette.alabaster[700], palette.alabaster[500]],
  },
});

// Export the light theme as the default
export const COLORS_LIGHT = createTheme(false);

// Also export a dark theme
export const DARK_COLORS_DARK = createTheme(true);

// Type for the colors object
export type ColorTheme_OLD = typeof COLORS_LIGHT;

// Utility type to get nested color values
export type ColorValue = {
  [K in keyof typeof COLORS_LIGHT]: typeof COLORS_LIGHT[K] extends string
    ? typeof COLORS_LIGHT[K]
    : {
        [SubK in keyof typeof COLORS_LIGHT[K]]: typeof COLORS_LIGHT[K][SubK];
      };
}; 