import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TaskData, TaskPriority, TaskAttachment } from '@/types/task';
import DateTimePickerModal from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Picker } from '@react-native-picker/picker';
import RNBlobUtil from 'react-native-blob-util';
import { useStorage } from '@/lib/storage/use-storage';
import { useTaskAttachments } from './task-attachment-utils';
import { TaskAttachments } from './task-attachments';

type TaskFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (task: TaskData) => void;
  existingTask?: TaskData | null;
};

export function TaskFormModal({ 
  visible, 
  onClose, 
  onSave,
  existingTask
}: TaskFormModalProps) {
  const { colors, isDark } = useTheme();
  
  // Task data state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  
  // Attachment handling with our custom hook
  const {
    attachments,
    setAttachments,
    isUploading,
    currentUploadId,
    uploadProgress,
    handleAddAttachment,
    handleRemoveAttachment,
    handleViewAttachment
  } = useTaskAttachments(existingTask?.attachments || []);
  
  // Focus ref for title input
  const titleInputRef = useRef<TextInput>(null);
  
  // Initialize form with existing task data if provided
  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description || '');
      setDueDate(existingTask.dueDate ? new Date(existingTask.dueDate) : null);
      setPriority(existingTask.priority || 'medium');
    } else {
      // Reset form for new tasks
      setTitle('');
      setDescription('');
      setDueDate(null);
      setPriority('medium');
    }
  }, [existingTask, visible]);
  
  // Focus title input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 300);
    }
  }, [visible]);
  
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    
    if (isUploading) {
      Alert.alert(
        'Uploads in Progress', 
        'Please wait for attachments to finish uploading before saving.'
      );
      return;
    }
    
    const taskData: TaskData = {
      id: existingTask?.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      isCompleted: existingTask?.isCompleted || false,
      createdAt: existingTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      priority,
      attachments: attachments || [],
      projectId: existingTask?.projectId || '',
      status: existingTask?.status || 'todo'
    };
    
    onSave(taskData);
    onClose();
  };
  
  const handleCancel = () => {
    onClose();
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setDatePickerVisible(Platform.OS === 'ios');
    if (currentDate) {
      setDueDate(currentDate);
    }
  };
  
  const renderAttachmentItem = ({ item }: { item: TaskAttachment }) => (
    <View 
      style={[
        styles.attachmentItem, 
        { 
          backgroundColor: '#f1f5ff',
          borderColor: 'rgba(120, 139, 255, 0.2)',
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.attachmentContent}
        onPress={() => handleViewAttachment(item)}
        disabled={item.isUploading}
      >
        <View style={styles.attachmentIcon}>
          {item.isUploading ? (
            <ActivityIndicator 
              size="small" 
              color={colors.brand.primary} 
            />
          ) : (
            <Icon name={getFileIcon(item.type)} size={24} color={colors.brand.primary} />
          )}
        </View>
        <View style={styles.attachmentDetails}>
          <Text 
            style={[styles.attachmentName, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={[styles.attachmentSize, { color: colors.text.tertiary }]}>
            {item.isUploading ? 
              `Uploading... ${item.id === currentUploadId ? Math.round(uploadProgress) + '%' : ''}` : 
              formatFileSize(item.size)
            }
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.attachmentRemove}
        onPress={() => handleRemoveAttachment(item.id)}
        disabled={item.isUploading}
      >
        <Icon 
          name="close" 
          size={18} 
          color={item.isUploading ? colors.text.quaternary : colors.text.tertiary} 
        />
      </TouchableOpacity>
    </View>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View 
            style={[
              styles.modalContainer, 
              {
                backgroundColor: colors.background.primary
              }
            ]}
          >
            <View style={styles.header}>
              <Text style={[styles.modalTitle, {color: colors.text.primary}]}>
                {existingTask ? 'Edit Task' : 'Add New Task'}
              </Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, {color: colors.text.secondary}]}>
                  Title
                </Text>
                <TextInput
                  ref={titleInputRef}
                  style={[
                    styles.textInput, 
                    {
                      color: colors.text.primary,
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary
                    }
                  ]}
                  placeholder="Task title"
                  placeholderTextColor={colors.text.tertiary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, {color: colors.text.secondary}]}>
                  Description
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      color: colors.text.primary,
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary
                    }
                  ]}
                  placeholder="Task description (optional)"
                  placeholderTextColor={colors.text.tertiary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, {color: colors.text.secondary}]}>
                  Due Date (Optional)
                </Text>
                
                <TouchableOpacity
                  onPress={() => setDatePickerVisible(true)}
                  style={[
                    styles.dateSelector,
                    {
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary
                    }
                  ]}
                >
                  <Text 
                    style={[
                      styles.dateText, 
                      {
                        color: dueDate ? colors.text.primary : colors.text.tertiary
                      }
                    ]}
                  >
                    {dueDate ? format(dueDate, 'PPP') : 'Select due date'}
                  </Text>
                  <Icon name="event" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                
                {isDatePickerVisible && (
                  <DateTimePickerModal
                    value={dueDate || new Date()}
                    mode="date"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, {color: colors.text.secondary}]}>
                  Priority
                </Text>
                <View 
                  style={[
                    styles.pickerContainer,
                    {
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary
                    }
                  ]}
                >
                  <Picker
                    selectedValue={priority}
                    onValueChange={(itemValue) => setPriority(itemValue as TaskPriority)}
                    style={[styles.picker, {color: colors.text.primary}]}
                    dropdownIconColor={colors.text.secondary}
                  >
                    <Picker.Item label="Low" value="low" />
                    <Picker.Item label="Medium" value="medium" />
                    <Picker.Item label="High" value="high" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <View style={styles.attachmentsHeader}>
                  <Text style={[styles.inputLabel, {color: colors.text.secondary}]}>
                    Attachments
                  </Text>
                  <TouchableOpacity 
                    style={[
                      styles.attachButton,
                      { backgroundColor: colors.brand.primary }
                    ]}
                    onPress={handleAddAttachment}
                    disabled={isUploading}
                  >
                    <Icon name="attach-file" size={16} color="#FFFFFF" />
                    <Text style={styles.attachButtonText}>
                      Add Files
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {attachments.length > 0 && (
                  <TaskAttachments
                    attachments={attachments}
                    showActions={true}
                    onRemoveAttachment={handleRemoveAttachment}
                    onViewAttachment={handleViewAttachment}
                  />
                )}
              </View>
            </ScrollView>
            
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.cancelButton, {borderColor: colors.border.medium}]}
                onPress={handleCancel}
              >
                <Text style={[styles.cancelButtonText, {color: colors.text.secondary}]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.brand.primary }
                ]}
                onPress={handleSave}
                disabled={isUploading}
              >
                <Text style={styles.saveButtonText}>
                  {existingTask ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Import helper functions
import { formatFileSize, getFileIcon } from './task-attachment-utils';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    fontSize: 16,
    minHeight: 100,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    flex: 1,
  },
  dateText: {
    flex: 1,
    marginRight: 8,
  },
  pickerContainer: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  picker: {
    flex: 1,
  },
  attachmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attachButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  attachButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  attachmentsList: {
    marginTop: 8,
  },
  emptyAttachmentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyAttachmentsText: {
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  attachmentItem: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  attachmentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentName: {
    fontWeight: '500',
    fontSize: 14,
  },
  attachmentSize: {
    fontSize: 12,
    marginTop: 2,
  },
  attachmentRemove: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 