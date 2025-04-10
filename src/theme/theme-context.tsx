import * as React from 'react';
import { COLORS, DARK_COLORS, ColorTheme } from './colors';
import { getItem, setItem } from '../utils/storage';

type ThemeType = 'light' | 'dark' | 'system';

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
  const [theme, setThemeState] = React.useState<ThemeType>(() => {
    try {
      // Force light theme by default
      const savedTheme = getItem<ThemeType>('theme', 'light');
      return savedTheme || 'light';
    } catch (error) {
      console.error('Error getting theme from storage:', error);
      return 'light';
    }
  });
  const [systemIsDark, setSystemIsDark] = React.useState(false);
  
  // Determine if the current theme is dark
  const isDark = React.useMemo(() => {
    if (theme === 'system') return systemIsDark;
    return theme === 'dark';
  }, [theme, systemIsDark]);
  
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
      // Still update the state even if storage fails
      setThemeState(newTheme);
    }
  }, []);
  
  // Toggle between light and dark
  const toggleTheme = React.useCallback(() => {
    if (theme === 'system') {
      setTheme(systemIsDark ? 'light' : 'dark');
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  }, [theme, systemIsDark, setTheme]);
  
  // Listen for system theme changes
  React.useEffect(() => {
    // This is a simplified version - in a real app you would use
    // Appearance.addChangeListener to detect system theme changes
    // For now, we'll just detect based on time of day as an example
    const checkSystemTheme = () => {
      const hours = new Date().getHours();
      setSystemIsDark(hours < 6 || hours >= 20);
    };
    
    checkSystemTheme();
    const intervalId = setInterval(checkSystemTheme, 1000 * 60); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Force light theme on initial load
  React.useEffect(() => {
    if (isDark) {
      setTheme('light');
    }
  }, []);
  
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