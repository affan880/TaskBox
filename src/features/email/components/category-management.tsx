import * as React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CategoryFilter } from './category-filter';
import { AddCategoryModal } from './add-category-modal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useEmailStore } from '@/store/email-store';

type CategoryManagementProps = {
  onSelectCategory?: (category: string) => void;
};

export function CategoryManagement({ onSelectCategory }: CategoryManagementProps) {
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const { fetchCategories } = useEmailStore();
  
  // Fetch categories when the component mounts
  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <CategoryFilter onSelectCategory={onSelectCategory} />
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
          accessibilityLabel="Add new category"
          accessibilityRole="button"
        >
          <Icon name="add" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>
      
      <AddCategoryModal 
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  }
}); 