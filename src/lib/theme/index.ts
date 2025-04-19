import { useColorScheme } from 'react-native';

export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FFCC00',
  info: '#5856D6',
  light: '#F2F2F7',
  dark: '#1C1C1E',
  gray: {
    100: '#F2F2F7',
    200: '#E5E5EA',
    300: '#D1D1D6',
    400: '#C7C7CC',
    500: '#AEAEB2',
    600: '#8E8E93',
    700: '#636366',
    800: '#48484A',
    900: '#3A3A3C'
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent'
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36
  },
  weights: {
    thin: '100',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900'
  }
};

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colors: {
      ...colors,
      text: isDark ? colors.white : colors.black,
      textSecondary: isDark ? colors.gray[400] : colors.gray[600],
      background: isDark ? colors.dark : colors.white,
      border: isDark ? colors.gray[700] : colors.gray[200],
    },
    spacing,
    typography,
  };
} 