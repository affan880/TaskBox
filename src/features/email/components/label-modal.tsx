import * as React from 'react';
import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';

type Label = {
  id: string;
  name: string;
};

type LabelModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectLabel: (labelId: string) => Promise<void>;
};

export function LabelModal({ visible, onClose, onSelectLabel }: LabelModalProps) {
  const [newLabelName, setNewLabelName] = useState('');
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      Alert.alert('Error', 'Please enter a label name');
      return;
    }

    setIsCreatingLabel(true);
    try {
      // TODO: Implement label creation logic
      setNewLabelName('');
      onClose();
    } catch (error) {
      console.error('Failed to create label:', error);
      Alert.alert('Error', 'Failed to create label. Please try again.');
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const labels: Label[] = []; // TODO: Add labels data

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Label</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.createLabel}>
            <TextInput
              style={styles.input}
              placeholder="Create new label"
              value={newLabelName}
              onChangeText={setNewLabelName}
              editable={!isCreatingLabel}
            />
            <TouchableOpacity
              style={[
                styles.createButton,
                (!newLabelName.trim() || isCreatingLabel) && styles.disabledButton,
              ]}
              onPress={handleCreateLabel}
              disabled={!newLabelName.trim() || isCreatingLabel}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={labels}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.labelItem}
                onPress={() => onSelectLabel(item.id)}
              >
                <Text style={styles.labelText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            style={styles.labelList}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '80%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  createLabel: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  labelList: {
    flexGrow: 0,
  },
  labelItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  labelText: {
    fontSize: 16,
  },
}); 