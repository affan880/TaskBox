import * as React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextStyle,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Pressable
} from 'react-native';
import { useTheme } from 'src/theme/theme-context';
import { storageConfig } from '@/lib/storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  onCategoriesChange?: (newCategories: string[]) => void;
};

const STORAGE_KEY = 'email_categories';
const ALL_CATEGORY = 'All';

export function CategoryFilterBar({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  categoryCounts,
  isAnalyzing = false,
  isFirstLoad = false,
  onCategoriesChange
}: CategoryFilterBarProps) {
  const { colors } = useTheme();
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState('');
  const [localCategories, setLocalCategories] = React.useState<string[]>(categories);

  // Ensure "All" category is always present
  const allCategories = React.useMemo(() => {
    if (!localCategories.includes(ALL_CATEGORY)) {
      return [ALL_CATEGORY, ...localCategories];
    }
    return localCategories;
  }, [localCategories]);

  // Load categories from storage on mount and when categories prop changes
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const storedCategories = await storageConfig.getItem(STORAGE_KEY);
        if (storedCategories) {
          // Ensure "All" category is included in stored categories
          const categoriesWithAll = storedCategories.includes(ALL_CATEGORY) 
            ? storedCategories 
            : [ALL_CATEGORY, ...storedCategories];
          
          setLocalCategories(categoriesWithAll);
          if (onCategoriesChange) {
            onCategoriesChange(categoriesWithAll);
          }
        } else {
          // If no stored categories, use default categories
          const defaultCategories = [ALL_CATEGORY, 'Work', 'Finance', 'Promotions', 'Social', 'Spam'];
          setLocalCategories(defaultCategories);
          await storageConfig.setItem(STORAGE_KEY, defaultCategories);
          if (onCategoriesChange) {
            onCategoriesChange(defaultCategories);
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to default categories if there's an error
        const defaultCategories = [ALL_CATEGORY, 'Work', 'Finance', 'Promotions', 'Social', 'Spam'];
        setLocalCategories(defaultCategories);
        if (onCategoriesChange) {
          onCategoriesChange(defaultCategories);
        }
      }
    };
    loadCategories();
  }, []);

  // Update local categories when prop changes
  React.useEffect(() => {
    if (categories.length > 0) {
      setLocalCategories(categories);
    }
  }, [categories]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }

    if (allCategories.includes(newCategory.trim())) {
      Alert.alert('Error', 'Category already exists');
      return;
    }

    try {
      const updatedCategories = [...allCategories, newCategory.trim()];
      await storageConfig.setItem(STORAGE_KEY, updatedCategories);
      setLocalCategories(updatedCategories);
      if (onCategoriesChange) {
        onCategoriesChange(updatedCategories);
      }
      setShowAddModal(false);
      setNewCategory('');
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'Failed to save new category');
    }
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    if (categoryToDelete === ALL_CATEGORY) {
      Alert.alert('Error', 'Cannot delete the "All" category');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete the "${categoryToDelete}" category?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedCategories = allCategories.filter(cat => cat !== categoryToDelete);
              await storageConfig.setItem(STORAGE_KEY, updatedCategories);
              setLocalCategories(updatedCategories);
              if (onCategoriesChange) {
                onCategoriesChange(updatedCategories);
              }
              // If the deleted category was selected, switch to "All"
              if (selectedCategory === categoryToDelete) {
                onSelectCategory(ALL_CATEGORY);
              }
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

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
    },
    addCategoryButton: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 24,
      minWidth: 80,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface?.secondary ?? '#f0f0f0',
      flexDirection: 'row',
    },
    addCategoryText: {
      fontSize: 15,
      fontWeight: '500' as FontWeight,
      color: colors.text?.secondary ?? '#666666',
      marginLeft: 4,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.background?.primary ?? '#ffffff',
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold' as FontWeight,
      marginBottom: 16,
      color: colors.text?.primary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border?.medium ?? '#e0e0e0',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      color: colors.text?.primary,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    modalButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    cancelButton: {
      backgroundColor: colors.surface?.secondary ?? '#f0f0f0',
    },
    addButton: {
      backgroundColor: colors.brand?.primary ?? '#6366f1',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '500' as FontWeight,
    },
    cancelButtonText: {
      color: colors.text?.secondary ?? '#666666',
    },
    addButtonText: {
      color: '#ffffff',
    },
  });

  return (
    <>
      <View style={dynamicStyles.categoryBarContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.categoryList}
        >
          {allCategories.map((category) => {
            const isActive = selectedCategory === category;
            const count = categoryCounts?.[category] || 0;
            const showCount = category !== ALL_CATEGORY && count > 0;
            const isCategoryAnalyzing = isAnalyzing && selectedCategory === category;
            const isDeletable = category !== ALL_CATEGORY;
            
            return (
              <View key={category} style={dynamicStyles.categoryWrapper}>
                <Pressable
                  onPress={() => onSelectCategory(category)}
                  onLongPress={() => isDeletable && handleDeleteCategory(category)}
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
                </Pressable>
                
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

          {/* Add Category Button */}
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={dynamicStyles.addCategoryButton}
            accessibilityRole="button"
            accessibilityLabel="Add new category"
          >
            <Icon name="plus" size={20} color={colors.text?.secondary ?? '#666666'} />
            <Text style={dynamicStyles.addCategoryText}>Add</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Add Category Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>Add New Category</Text>
            <TextInput
              style={dynamicStyles.input}
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="Enter category name"
              placeholderTextColor={colors.text?.secondary ?? '#666666'}
              autoFocus
            />
            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewCategory('');
                }}
              >
                <Text style={[dynamicStyles.buttonText, dynamicStyles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.addButton]}
                onPress={handleAddCategory}
              >
                <Text style={[dynamicStyles.buttonText, dynamicStyles.addButtonText]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Add displayName to the component
CategoryFilterBar.displayName = 'CategoryFilterBar'; 