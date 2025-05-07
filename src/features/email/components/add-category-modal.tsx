import * as React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useEmailStore } from '@/store/email-store';
import { loadCategories, saveCategories } from '@/lib/storage/category-storage';

type AddCategoryModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function AddCategoryModal({ visible, onClose }: AddCategoryModalProps) {
  const [newCategory, setNewCategory] = React.useState('');
  const { fetchCategories, categories } = useEmailStore();
  
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    
    if (categories.includes(newCategory.trim())) {
      Alert.alert('Error', 'This category already exists');
      return;
    }
    
    try {
      // Add the new category to existing categories
      const updatedCategories = [...categories, newCategory.trim()];
      await saveCategories(updatedCategories);
      
      // Refresh categories in the store
      await fetchCategories();
      
      // Reset input and close modal
      setNewCategory('');
      onClose();
    } catch (error) {
      console.error('Failed to add category:', error);
      Alert.alert('Error', 'Failed to add category');
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <Text style={styles.title}>Add New Category</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter category name"
            value={newCategory}
            onChangeText={setNewCategory}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAddCategory}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.addButton]} 
              onPress={handleAddCategory}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    fontSize: 16
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    marginRight: 8
  },
  addButton: {
    backgroundColor: '#2563eb',
    marginLeft: 8
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '500'
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500'
  }
}); 