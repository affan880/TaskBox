import * as React from 'react';
import { COLORS, DARK_COLORS, ColorTheme } from './colors';
import { getItem, setItem } from 'src/lib/storage/storage';
import { useColorScheme } from 'react-native';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  colors: ColorTheme;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

export const ThemeContext = React.createContext<ThemeContextType>({
  theme: 'light',
  colors: COLORS,
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = React.useState<ThemeType>('system');
  
  // Load saved theme
  React.useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await getItem<ThemeType>('theme');
        if (savedTheme) {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Error getting theme from storage:', error);
      }
    };
    loadTheme();
  }, []);
  
  // Determine if the current theme is dark
  const isDark = React.useMemo(() => {
    if (theme === 'system') return systemColorScheme === 'dark';
    return theme === 'dark';
  }, [theme, systemColorScheme]);
  
  // Get the appropriate color theme
  const colors = React.useMemo(() => {
    return isDark ? DARK_COLORS : COLORS;
  }, [isDark]);
  
  // Set the theme
  const setTheme = React.useCallback((newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      setItem('theme', newTheme);
    } catch (error) {
      console.error('Error setting theme in storage:', error);
      setThemeState(newTheme);
    }
  }, []);
  
  // Toggle between light and dark
  const toggleTheme = React.useCallback(() => {
    if (theme === 'system') {
      setTheme(systemColorScheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  }, [theme, systemColorScheme, setTheme]);
  
  const value = React.useMemo(() => ({
    theme,
    colors,
    isDark,
    setTheme,
    toggleTheme,
  }), [theme, colors, isDark, setTheme, toggleTheme]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to access the theme context
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 