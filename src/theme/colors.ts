export const COLORS = {
  // Primary colors
  background: {
    primary: '#FBF4F4',
    secondary: '#F5F5F5',
  },
  
  // Text colors
  text: {
    primary: '#424242',    // Dark grey - Main text
    secondary: '#78909C',  // Blue grey - Secondary text
    tertiary: '#9E9E9E',  // Medium grey - Disabled/subtle text
  },
  
  // UI Element colors
  border: '#CFD8DC',      // Light blue grey - Borders and dividers
  
  // Semantic colors
  error: '#FF3B30',       // Red - Error states and destructive actions
  success: '#34C759',     // Green - Success states and positive actions
  warning: '#FF9500',     // Orange - Warning states
  info: '#78909C',        // Blue grey - Informational elements
  
  // Component specific colors
  card: {
    background: '#F5F5F5',
    border: '#CFD8DC',
  },
  
  // Status colors
  status: {
    unread: '#78909C',
    read: '#9E9E9E',
  },
} as const;

// Type for the colors object
export type ColorTheme = typeof COLORS;

// Utility type to get nested color values
export type ColorValue = {
  [K in keyof typeof COLORS]: typeof COLORS[K] extends string
    ? typeof COLORS[K]
    : {
        [SubK in keyof typeof COLORS[K]]: typeof COLORS[K][SubK];
      };
}; 