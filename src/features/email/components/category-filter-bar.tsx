import * as React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextStyle,
  ActivityIndicator
} from 'react-native';
import { useTheme } from 'src/theme/theme-context';

// Helper type for fontWeight
type FontWeight = TextStyle['fontWeight'];

// Props definition for the component
type CategoryFilterBarProps = {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts?: Record<string, number>; // Optional count of emails in each category
  isAnalyzing?: boolean; // Whether email analysis is in progress
  isFirstLoad?: boolean; // Whether this is the first load of emails
};

export function CategoryFilterBar({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  categoryCounts,
  isAnalyzing = false,
  isFirstLoad = false
}: CategoryFilterBarProps) {
  const { colors } = useTheme();

  // Define dynamic styles based on theme colors
  const dynamicStyles = StyleSheet.create({
    categoryBarContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth, 
      borderBottomColor: colors.border?.medium ?? '#e0e0e0', 
      backgroundColor: colors.background?.primary ?? '#ffffff',
    },
    categoryList: {
      paddingVertical: 4,
    },
    categoryWrapper: {
      position: 'relative',
      marginRight: 12,
    },
    categoryButton: {
      paddingVertical: 8, 
      paddingHorizontal: 18,
      borderRadius: 24, 
      minWidth: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryButtonInactive: {
      backgroundColor: colors.surface?.secondary ?? '#f0f0f0',
    },
    categoryButtonActive: {
      backgroundColor: colors.brand?.primary ?? '#6366f1',
    },
    categoryText: {
      fontSize: 15,
      fontWeight: '500' as FontWeight,
    },
    categoryTextInactive: {
      color: colors.text?.secondary ?? '#666666', 
    },
    categoryTextActive: {
      color: '#ffffff', 
    },
    categoryCount: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: colors.brand?.secondary ?? '#ff3b30',
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      borderWidth: 2,
      borderColor: colors.background?.primary ?? '#ffffff',
    },
    categoryCountText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: 'bold' as FontWeight,
    },
    loadingIndicatorContainer: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      borderRadius: 24,
    },
    skeletonPulse: {
      opacity: isFirstLoad ? 0.7 : 1,
    }
  });

  return (
    <View style={dynamicStyles.categoryBarContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.categoryList}
      >
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          const count = categoryCounts?.[category] || 0;
          const showCount = category !== 'All' && count > 0;
          const isCategoryAnalyzing = isAnalyzing && selectedCategory === category;
          
          return (
            <View key={category} style={dynamicStyles.categoryWrapper}>
              <TouchableOpacity
                onPress={() => onSelectCategory(category)}
                style={[
                    dynamicStyles.categoryButton,
                    isActive ? dynamicStyles.categoryButtonActive : dynamicStyles.categoryButtonInactive,
                    isFirstLoad && dynamicStyles.skeletonPulse
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${category} category${count ? `, ${count} emails` : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    dynamicStyles.categoryText,
                    isActive ? dynamicStyles.categoryTextActive : dynamicStyles.categoryTextInactive,
                  ]}
                >
                  {category}
                </Text>
                {isCategoryAnalyzing && (
                  <View style={dynamicStyles.loadingIndicatorContainer}>
                    <ActivityIndicator size="small" color={colors.brand?.primary} />
                  </View>
                )}
              </TouchableOpacity>
              
              {showCount && (
                <View style={dynamicStyles.categoryCount}>
                  <Text style={dynamicStyles.categoryCountText}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
} 

// Add displayName to the component
CategoryFilterBar.displayName = 'CategoryFilterBar'; 