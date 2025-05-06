import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useEmailStore } from '@/store/email-store';

type CategoryFilterProps = {
  onSelectCategory?: (category: string) => void;
};

export function CategoryFilter({ onSelectCategory }: CategoryFilterProps) {
  const { categories, selectedCategory, setSelectedCategory, fetchCategories } = useEmailStore();
  
  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  const handleSelectCategory = React.useCallback(
    async (category: string) => {
      const normalizedCategory = category.toLowerCase();
      await setSelectedCategory(normalizedCategory);
      onSelectCategory?.(normalizedCategory);
    },
    [setSelectedCategory, onSelectCategory]
  );
  
  if (!categories.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No categories available</Text>
      </View>
    );
  }
  
  return (
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
    >
      <CategoryButton 
        label="All"
        isSelected={(selectedCategory?.toLowerCase() ?? 'all') === 'all'}
        onPress={() => handleSelectCategory('All')}
      />
      
      {categories.map((category) => (
        <CategoryButton
          key={category}
          label={category}
          isSelected={(selectedCategory?.toLowerCase() ?? '') === category.toLowerCase()}
          onPress={() => handleSelectCategory(category)}
        />
      ))}
    </ScrollView>
  );
}

type CategoryButtonProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

function CategoryButton({ label, isSelected, onPress }: CategoryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        isSelected ? styles.selectedButton : styles.unselectedButton
      ]}
    >
      <Text 
        style={[
          styles.buttonText,
          isSelected ? styles.selectedText : styles.unselectedText
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    marginVertical: 8,
    paddingHorizontal: 16
  },
  emptyText: {
    color: '#6b7280', // gray-500
    fontSize: 14
  },
  scrollView: {
    paddingVertical: 8
  },
  scrollViewContent: {
    paddingHorizontal: 8,
    gap: 8
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999, // For pill shape
  },
  selectedButton: {
    backgroundColor: '#2563eb', // blue-600
  },
  unselectedButton: {
    backgroundColor: '#e5e7eb', // gray-200
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedText: {
    color: '#ffffff',
  },
  unselectedText: {
    color: '#1f2937', // gray-800
  }
}); 