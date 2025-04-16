import * as React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextStyle 
} from 'react-native';
import { useTheme } from 'src/theme/theme-context';

// Helper type for fontWeight
type FontWeight = TextStyle['fontWeight'];

// Props definition for the component
type CategoryFilterBarProps = {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

export function CategoryFilterBar({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: CategoryFilterBarProps) {
  const { colors } = useTheme();

  // Define base styles inline
  const categoryButtonBaseStyle = {
      marginRight: 8, 
      paddingVertical: 8, 
      paddingHorizontal: 16,
      borderRadius: 20, 
      borderWidth: 1,
  };
  const categoryTextBaseStyle = {
      fontSize: 14,
  };

  // Define dynamic styles based on theme colors
  // Moved StyleSheet inside component to access theme
  const dynamicStyles = StyleSheet.create({
    categoryBarContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth, 
      borderBottomColor: colors.border?.medium ?? '#e0e0e0', 
      backgroundColor: colors.background?.primary ?? '#ffffff', 
    },
    categoryButtonInactive: {
      backgroundColor: colors.surface?.primary ?? '#f0f0f0', 
      borderColor: colors.border?.medium ?? '#e0e0e0',
    },
    categoryButtonActive: {
      backgroundColor: colors.brand?.primary ?? '#007aff', 
      borderColor: colors.brand?.primary ?? '#007aff',
      shadowColor: colors.brand?.primary ?? '#007aff', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    categoryTextInactive: {
      color: colors.text?.primary ?? '#000000', 
      fontWeight: 'normal' as FontWeight, // Cast for safety
    },
    categoryTextActive: {
      color: colors.text?.inverse ?? '#ffffff', 
      fontWeight: 'bold' as FontWeight, // Cast for safety
    },
  });

  return (
    <View style={dynamicStyles.categoryBarContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          
          return (
            <TouchableOpacity
              key={category}
              onPress={() => onSelectCategory(category)} // Use the callback prop
              style={[
                  categoryButtonBaseStyle,
                  dynamicStyles.categoryButtonInactive, 
                  isActive && dynamicStyles.categoryButtonActive 
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${category} category`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  categoryTextBaseStyle, 
                  isActive ? dynamicStyles.categoryTextActive : dynamicStyles.categoryTextInactive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
} 

// Add displayName to the component
CategoryFilterBar.displayName = 'CategoryFilterBar'; 