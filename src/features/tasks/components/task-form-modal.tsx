import * as React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Switch,
  TouchableWithoutFeedback,
  Alert,
  FlatList
} from 'react-native';
import { useTheme } from '../../../theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useState, useEffect } from 'react';
import { TaskData, TaskPriority, TaskAttachment } from '../../../types/task';
import DateTimePicker from '../../../components/ui/date-time-picker';
import RNBlobUtil from 'react-native-blob-util';
import * as DocumentPicker from '@react-native-documents/picker';

type TaskFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Omit<TaskData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingTask?: TaskData;
};

export function TaskFormModal({ 
  visible, 
  onClose, 
  onSave,
  existingTask
}: TaskFormModalProps) {
  const { colors, isDark } = useTheme();
  const isEditing = !!existingTask;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [hasDueDate, setHasDueDate] = useState(false);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Reset form when task changes
  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description || '');
      setDueDate(existingTask.dueDate ? new Date(existingTask.dueDate) : null);
      setHasDueDate(!!existingTask.dueDate);
      setPriority(existingTask.priority);
      setTags(existingTask.tags || []);
      setAttachments(existingTask.attachments || []);
    } else {
      // Default values for new task
      setTitle('');
      setDescription('');
      setDueDate(null);
      setHasDueDate(false);
      setPriority('medium');
      setTags([]);
      setAttachments([]);
    }
    setCurrentTag('');
  }, [existingTask, visible]);
  
  const handleSave = () => {
    if (!title.trim()) return;
    
    onSave({
      title,
      description: description.trim() || undefined,
      isCompleted: existingTask ? existingTask.isCompleted : false,
      dueDate: hasDueDate && dueDate ? dueDate.toISOString() : undefined,
      priority,
      tags: tags.length > 0 ? tags : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    
    onClose();
  };
  
  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleChangeDueDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
      setHasDueDate(true);
    }
  };
  
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Set due date';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const handleAddAttachment = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });
      
      const newAttachments: TaskAttachment[] = results.map(file => ({
        id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name || 'Unnamed file',
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        size: file.size || 0,
        createdAt: new Date().toISOString(),
      }));
      
      setAttachments([...attachments, ...newAttachments]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
      } else {
        Alert.alert('Error', 'Failed to pick document');
        console.error('Document picker error:', err);
      }
    }
  };
  
  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter(attachment => attachment.id !== attachmentId));
  };

  const handleViewAttachment = async (attachment: TaskAttachment) => {
    try {
      // Open file with device's default viewer
      if (Platform.OS === 'ios') {
        // On iOS, QuickLook will handle most file types
        RNBlobUtil.ios.openDocument(attachment.uri);
      } else {
        // On Android, use the OS file viewer
        RNBlobUtil.android.actionViewIntent(attachment.uri, attachment.type);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const getFileIcon = (type: string): string => {
    if (type.includes('image')) return 'image';
    if (type.includes('pdf')) return 'picture-as-pdf';
    if (type.includes('word') || type.includes('document')) return 'description';
    if (type.includes('excel') || type.includes('sheet')) return 'table-chart';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'slideshow';
    if (type.includes('text')) return 'text-snippet';
    if (type.includes('zip') || type.includes('compressed')) return 'archive';
    return 'insert-drive-file';
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
      >
        <View style={styles.attachmentIcon}>
          <Icon name={getFileIcon(item.type)} size={24} color={colors.brand.primary} />
        </View>
        <View style={styles.attachmentDetails}>
          <Text 
            style={[styles.attachmentName, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={[styles.attachmentSize, { color: colors.text.tertiary }]}>
            {formatFileSize(item.size)}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.attachmentRemove}
        onPress={() => handleRemoveAttachment(item.id)}
      >
        <Icon name="close" size={18} color={colors.text.tertiary} />
      </TouchableOpacity>
    </View>
  );
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View 
          style={[
            styles.content, 
            { 
              backgroundColor: '#ffffff',
              borderTopColor: 'rgba(0,0,0,0.05)',
              shadowColor: 'rgba(0,0,0,0.2)',
              shadowOffset: { width: 0, height: -3 },
              shadowRadius: 5,
              shadowOpacity: 0.3,
              elevation: 10,
            }
          ]}
        >
          <View style={[styles.header, { borderBottomColor: 'rgba(0,0,0,0.05)' }]}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {isEditing ? 'Edit Task' : 'Create Task'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <Icon name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  color: colors.text.primary,
                  backgroundColor: '#f1f5ff',
                  borderColor: 'rgba(120, 139, 255, 0.2)',
                  borderRadius: 8,
                }
              ]}
              placeholder="Task title"
              placeholderTextColor={colors.text.tertiary}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
            
            <TextInput
              style={[
                styles.textArea,
                { 
                  color: colors.text.primary,
                  backgroundColor: '#f1f5ff',
                  borderColor: 'rgba(120, 139, 255, 0.2)',
                  borderRadius: 8,
                }
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.text.tertiary}
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text.secondary }]}>
                Due Date
              </Text>
              <View style={styles.dueDate}>
                <Switch
                  value={hasDueDate}
                  onValueChange={(value) => {
                    setHasDueDate(value);
                    if (value && !dueDate) {
                      // Default to tomorrow
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setDueDate(tomorrow);
                    }
                  }}
                  thumbColor={hasDueDate ? colors.brand.primary : '#cccccc'}
                  trackColor={{ 
                    false: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)', 
                    true: isDark ? colors.brand.dark : 'rgba(120, 139, 255, 0.3)' 
                  }}
                />
                {hasDueDate && (
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      { 
                        backgroundColor: '#f1f5ff',
                        borderColor: 'rgba(120, 139, 255, 0.2)',
                        borderRadius: 8,
                      }
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: colors.text.primary }}>
                      {formatDate(dueDate)}
                    </Text>
                    <Icon name="event" size={20} color={colors.brand.primary} />
                  </TouchableOpacity>
                )}
              </View>
              
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleChangeDueDate}
                  minimumDate={new Date()}
                />
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text.secondary }]}>
                Priority
              </Text>
              <View style={styles.priorityButtons}>
                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    { 
                      backgroundColor: priority === 'low'
                        ? colors.status.success
                        : 'rgba(76, 175, 80, 0.1)',
                      borderWidth: priority === 'low' ? 0 : 1,
                      borderColor: priority === 'low' ? 'transparent' : 'rgba(76, 175, 80, 0.5)',
                    }
                  ]}
                  onPress={() => setPriority('low')}
                >
                  <Text style={{ 
                    color: priority === 'low' ? '#fff' : colors.status.success, 
                    fontWeight: priority === 'low' ? '600' : 'normal',
                  }}>
                    Low
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    { 
                      backgroundColor: priority === 'medium'
                        ? colors.status.warning
                        : 'rgba(255, 152, 0, 0.1)',
                      borderWidth: priority === 'medium' ? 0 : 1,
                      borderColor: priority === 'medium' ? 'transparent' : 'rgba(255, 152, 0, 0.5)',
                    }
                  ]}
                  onPress={() => setPriority('medium')}
                >
                  <Text style={{ 
                    color: priority === 'medium' ? '#fff' : colors.status.warning, 
                    fontWeight: priority === 'medium' ? '600' : 'normal',
                  }}>
                    Medium
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    { 
                      backgroundColor: priority === 'high'
                        ? colors.status.error
                        : 'rgba(244, 67, 54, 0.1)',
                      borderWidth: priority === 'high' ? 0 : 1,
                      borderColor: priority === 'high' ? 'transparent' : 'rgba(244, 67, 54, 0.5)',
                    }
                  ]}
                  onPress={() => setPriority('high')}
                >
                  <Text style={{ 
                    color: priority === 'high' ? '#fff' : colors.status.error, 
                    fontWeight: priority === 'high' ? '600' : 'normal',
                  }}>
                    High
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text.secondary }]}>
                Tags
              </Text>
              <View style={styles.tagInput}>
                <TextInput
                  style={[
                    styles.tagTextInput,
                    { 
                      color: colors.text.primary,
                      backgroundColor: '#f1f5ff',
                      borderColor: 'rgba(120, 139, 255, 0.2)',
                      borderRadius: 8,
                    }
                  ]}
                  placeholder="Add a tag"
                  placeholderTextColor={colors.text.tertiary}
                  value={currentTag}
                  onChangeText={setCurrentTag}
                  returnKeyType="done"
                  onSubmitEditing={handleAddTag}
                />
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { 
                      backgroundColor: colors.brand.primary,
                      shadowColor: 'rgba(0,0,0,0.2)',
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 3,
                      shadowOpacity: 0.3,
                      elevation: 3,
                    }
                  ]}
                  onPress={handleAddTag}
                >
                  <Icon name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.tag,
                        { 
                          backgroundColor: 'rgba(120, 139, 255, 0.1)',
                          borderWidth: 1,
                          borderColor: 'rgba(120, 139, 255, 0.3)'
                        }
                      ]}
                    >
                      <Text style={{ color: colors.brand.primary }}>{tag}</Text>
                      <TouchableOpacity
                        style={styles.removeTag}
                        onPress={() => handleRemoveTag(tag)}
                      >
                        <Icon name="close" size={16} color={colors.brand.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text.secondary }]}>
                Attachments
              </Text>
              <TouchableOpacity
                style={[
                  styles.addAttachmentButton,
                  { 
                    backgroundColor: '#f1f5ff',
                    borderColor: 'rgba(120, 139, 255, 0.2)',
                    borderRadius: 8,
                  }
                ]}
                onPress={handleAddAttachment}
              >
                <Icon name="attach-file" size={20} color={colors.brand.primary} />
                <Text style={[styles.addAttachmentText, { color: colors.brand.primary }]}>
                  Add Attachment
                </Text>
              </TouchableOpacity>
              
              {attachments.length > 0 && (
                <FlatList
                  data={attachments}
                  keyExtractor={(item) => item.id}
                  renderItem={renderAttachmentItem}
                  style={styles.attachmentsList}
                  scrollEnabled={false}
                />
              )}
            </View>
          </ScrollView>
          
          <View style={[styles.footer, { borderTopColor: 'rgba(0,0,0,0.05)' }]}>
            <TouchableOpacity
              style={[
                styles.button,
                { 
                  backgroundColor: colors.brand.primary,
                  shadowColor: 'rgba(0,0,0,0.3)',
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                  shadowOpacity: 0.2,
                  elevation: 3,
                }
              ]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={[styles.buttonText, { fontWeight: '600' }]}>
                {isEditing ? 'Update Task' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
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
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  input: {
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
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 16,
    flex: 1,
  },
  tagInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagTextInput: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  removeTag: {
    padding: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addAttachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addAttachmentText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  attachmentsList: {
    marginTop: 8,
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