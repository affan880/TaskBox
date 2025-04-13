import * as React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TaskData, TaskPriority } from '@/types/task';
import { format } from 'date-fns';
import { TaskAttachmentsViewer } from './task-attachments-viewer';

type TaskDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  task: TaskData | null;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
};

const { width, height } = Dimensions.get('window');

export function TaskDetailModal({
  visible,
  onClose,
  task,
  onEdit,
  onDelete,
  onToggleCompletion
}: TaskDetailModalProps) {
  const { colors, isDark } = useTheme();
  
  if (!task) return null;
  
  // Format task's creation date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy • h:mm a');
    } catch (error) {
      return dateString;
    }
  };
  
  // Format task's due date
  const formatDueDate = (dateString?: string): string => {
    if (!dateString) return 'No due date';
    
    try {
      const dueDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const dueDateMidnight = new Date(dueDate);
      dueDateMidnight.setHours(0, 0, 0, 0);
      
      if (dueDateMidnight.getTime() === today.getTime()) {
        return 'Today, ' + format(dueDate, 'h:mm a');
      } else if (dueDateMidnight.getTime() === tomorrow.getTime()) {
        return 'Tomorrow, ' + format(dueDate, 'h:mm a');
      } else if (dueDateMidnight.getTime() === yesterday.getTime()) {
        return 'Yesterday, ' + format(dueDate, 'h:mm a');
      } else {
        return format(dueDate, 'MMMM d, yyyy • h:mm a');
      }
    } catch (error) {
      return dateString;
    }
  };
  
  // Get color for priority level
  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'high':
        return colors.status.error;
      case 'medium':
        return colors.status.warning;
      case 'low':
        return colors.status.success;
      default:
        return colors.text.tertiary;
    }
  };
  
  // Get human-readable priority label
  const getPriorityLabel = (priority: TaskPriority): string => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'No Priority';
    }
  };
  
  // Handle deletion with confirmation
  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            onDelete(task.id);
            onClose();
          },
          style: 'destructive' 
        }
      ]
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View 
              style={[
                styles.modalContainer, 
                { 
                  backgroundColor: colors.background.primary,
                  maxHeight: height * 0.8
                }
              ]}
            >
              {/* Header with close button */}
              <View 
                style={[
                  styles.header, 
                  { borderBottomColor: 'rgba(0,0,0,0.05)' }
                ]}
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Icon name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { marginRight: 16 }]}
                    onPress={() => onEdit(task.id)}
                  >
                    <Icon name="edit" size={20} color={colors.text.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleDelete}
                  >
                    <Icon name="delete" size={20} color={colors.status.error} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
              >
                {/* Task status and completion toggle */}
                <TouchableOpacity
                  style={[
                    styles.statusContainer,
                    {
                      backgroundColor: task.isCompleted
                        ? 'rgba(75, 181, 67, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                      borderColor: task.isCompleted
                        ? 'rgba(75, 181, 67, 0.3)'
                        : 'rgba(0, 0, 0, 0.1)'
                    }
                  ]}
                  onPress={() => onToggleCompletion(task.id)}
                >
                  <View 
                    style={[
                      styles.checkbox,
                      {
                        borderColor: task.isCompleted
                          ? colors.status.success
                          : colors.text.secondary,
                        backgroundColor: task.isCompleted
                          ? colors.status.success
                          : 'transparent'
                      }
                    ]}
                  >
                    {task.isCompleted && (
                      <Icon name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text 
                    style={[
                      styles.statusText,
                      { 
                        color: task.isCompleted
                          ? colors.status.success
                          : colors.text.secondary
                      }
                    ]}
                  >
                    {task.isCompleted ? 'Completed' : 'Mark as Complete'}
                  </Text>
                </TouchableOpacity>
                
                {/* Task title */}
                <Text 
                  style={[
                    styles.taskTitle,
                    { color: colors.text.primary }
                  ]}
                >
                  {task.title}
                </Text>
                
                {/* Task metadata */}
                <View style={styles.metadataContainer}>
                  {/* Priority */}
                  <View style={styles.metadataItem}>
                    <Icon
                      name="flag"
                      size={16}
                      color={getPriorityColor(task.priority)}
                      style={styles.metadataIcon}
                    />
                    <Text 
                      style={[
                        styles.metadataText,
                        { 
                          color: getPriorityColor(task.priority),
                          fontWeight: '500'
                        }
                      ]}
                    >
                      {getPriorityLabel(task.priority)}
                    </Text>
                  </View>
                  
                  {/* Due date */}
                  {task.dueDate && (
                    <View style={styles.metadataItem}>
                      <Icon
                        name="event"
                        size={16}
                        color={colors.text.secondary}
                        style={styles.metadataIcon}
                      />
                      <Text
                        style={[
                          styles.metadataText,
                          { color: colors.text.secondary }
                        ]}
                      >
                        Due: {formatDueDate(task.dueDate)}
                      </Text>
                    </View>
                  )}
                  
                  {/* Created date */}
                  <View style={styles.metadataItem}>
                    <Icon
                      name="access-time"
                      size={16}
                      color={colors.text.tertiary}
                      style={styles.metadataIcon}
                    />
                    <Text
                      style={[
                        styles.metadataText,
                        { color: colors.text.tertiary }
                      ]}
                    >
                      Created: {formatDate(task.createdAt)}
                    </Text>
                  </View>
                </View>
                
                {/* Description section */}
                {task.description && (
                  <View 
                    style={[
                      styles.descriptionContainer,
                      { backgroundColor: 'rgba(0,0,0,0.02)' }
                    ]}
                  >
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.text.primary }
                      ]}
                    >
                      {task.description}
                    </Text>
                  </View>
                )}
                
                {/* Tags section */}
                {task.tags && task.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    <Text 
                      style={[
                        styles.sectionTitle,
                        { color: colors.text.secondary }
                      ]}
                    >
                      Tags
                    </Text>
                    <View style={styles.tagsList}>
                      {task.tags.map((tag, index) => (
                        <View 
                          key={index}
                          style={[
                            styles.tag,
                            { 
                              backgroundColor: 'rgba(120, 139, 255, 0.1)',
                              borderColor: 'rgba(120, 139, 255, 0.3)'
                            }
                          ]}
                        >
                          <Text 
                            style={[
                              styles.tagText,
                              { color: colors.brand.primary }
                            ]}
                          >
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Attachments section */}
                {task.attachments && task.attachments.length > 0 && (
                  <TaskAttachmentsViewer 
                    attachments={task.attachments}
                    title="Attachments"
                    maxInitialItems={10}
                  />
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  metadataContainer: {
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataIcon: {
    marginRight: 8,
  },
  metadataText: {
    fontSize: 14,
  },
  descriptionContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 