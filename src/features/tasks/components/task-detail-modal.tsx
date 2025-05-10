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
import { TaskData, TaskPriority, TaskAttachment } from '@/types/task';
import { format } from 'date-fns';
import { TaskAttachments } from './task-attachments';

type TaskDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  task: TaskData | null;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
  onViewAttachment?: (attachment: TaskAttachment) => void;
};

const { width, height } = Dimensions.get('window');

export function TaskDetailModal({
  visible,
  onClose,
  task,
  onEdit,
  onDelete,
  onToggleCompletion,
  onViewAttachment
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

  // Handle viewing attachment
  const handleViewAttachment = (attachment: TaskAttachment) => {
    if (onViewAttachment) {
      onViewAttachment(attachment);
    }
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
                          : colors.text.primary 
                      }
                    ]}
                  >
                    {task.isCompleted ? 'Completed' : 'Mark as Completed'}
                  </Text>
                </TouchableOpacity>
                
                {/* Task title */}
                <Text style={[styles.taskTitle, { color: colors.text.primary }]}>
                  {task.title}
                </Text>
                
                {/* Task metadata */}
                <View style={styles.metadataContainer}>
                  {/* Creation date */}
                  <View style={styles.metadataItem}>
                    <Icon 
                      name="today" 
                      size={16} 
                      color={colors.text.tertiary}
                      style={styles.metadataIcon} 
                    />
                    <Text style={[styles.metadataText, { color: colors.text.tertiary }]}>
                      Created: {formatDate(task.createdAt)}
                    </Text>
                  </View>
                  
                  {/* Due date */}
                  <View style={styles.metadataItem}>
                    <Icon 
                      name="event" 
                      size={16} 
                      color={colors.text.tertiary}
                      style={styles.metadataIcon} 
                    />
                    <Text 
                      style={[
                        styles.metadataText, 
                        { 
                          color: task.dueDate ? colors.text.tertiary : colors.text.quaternary 
                        }
                      ]}
                    >
                      Due: {formatDueDate(task.dueDate)}
                    </Text>
                  </View>
                  
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
                        { color: getPriorityColor(task.priority) }
                      ]}
                    >
                      {getPriorityLabel(task.priority)}
                    </Text>
                  </View>
                </View>
                
                {/* Description */}
                {task.description && (
                  <View 
                    style={[
                      styles.descriptionContainer, 
                      { backgroundColor: 'rgba(0,0,0,0.02)' }
                    ]}
                  >
                    <Text style={[styles.descriptionText, { color: colors.text.primary }]}>
                      {task.description}
                    </Text>
                  </View>
                )}
                
                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    <Text 
                      style={[styles.sectionTitle, { color: colors.text.primary }]}
                    >
                      Tags
                    </Text>
                    <View style={styles.tagsList}>
                      {task.tags.map((tag, index) => (
                        <View 
                          key={`${tag}-${index}`}
                          style={[
                            styles.tag, 
                            { 
                              backgroundColor: `${colors.brand.primary}10`, 
                              borderColor: `${colors.brand.primary}30`
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
                  <TaskAttachments
                    attachments={task.attachments}
                    onViewAttachment={handleViewAttachment}
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
    borderWidth: 3,
    overflow: 'hidden',
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '1deg' }],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '-1deg' }],
  },
  content: {
    padding: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 3,
    transform: [{ rotate: '1deg' }],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    transform: [{ rotate: '-2deg' }],
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  metadataContainer: {
    marginBottom: 20,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '-1deg' }],
  },
  metadataIcon: {
    marginRight: 12,
  },
  metadataText: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 3,
    marginBottom: 24,
    transform: [{ rotate: '1deg' }],
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '-1deg' }],
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 