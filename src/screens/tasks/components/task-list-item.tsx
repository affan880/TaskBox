import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { TaskData, TaskPriority } from '../../../types/task';
import { useTheme } from '../../../theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { memo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Pressable, GestureResponderEvent } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type TaskListItemProps = {
  task: TaskData;
  onPress: (taskId: string) => void;
  onLongPress: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
  isSelected?: boolean;
  isSelectMode?: boolean;
};

function TaskListItemComponent({
  task,
  onPress,
  onLongPress,
  onToggleCompletion,
  isSelected = false,
  isSelectMode = false
}: TaskListItemProps) {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const elevationAnim = useRef(new Animated.Value(2)).current;
  
  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  // Animation for selection
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 0.98 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    
    // Elevation animation for 3D effect - fix by using a different approach
    // that's compatible with native driver
    Animated.spring(elevationAnim, {
      toValue: isSelected ? 4 : 2,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);
  
  // Format due date nicely
  const formatDueDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    const dueDate = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Convert dates to midnight for comparison
    const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    
    if (dueDateMidnight.getTime() === today.getTime()) {
      return 'Today';
    } else if (dueDateMidnight.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (dueDateMidnight.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else if (dueDateMidnight < today) {
      // Past due date
      const diffDays = Math.floor((today.getTime() - dueDateMidnight.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else {
      // Future date
      const diffDays = Math.floor((dueDateMidnight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        // Within a week, show day name
        return dueDate.toLocaleDateString([], { weekday: 'long' });
      } else if (diffDays < 30) {
        // Within a month, show date
        return dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else {
        // More than a month, show date and year
        return dueDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
  };
  
  // Get priority color
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
  
  const handleToggleCompletion = (e: any) => {
    e.stopPropagation();
    onToggleCompletion(task.id);
  };
  
  // Format the date to a more readable format
  const formattedDate = task.dueDate
    ? format(new Date(task.dueDate), 'MMM d, yyyy')
    : null;

  const gradientColors = isSelected 
    ? ['#d6dffb', '#e2eafc', '#eef2ff'] 
    : ['#ffffff', '#ffffff'];

  return (
    <Pressable
      onPress={() => onPress(task.id)}
      style={[
        styles.container,
        {
          borderRadius: 12,
          marginHorizontal: 12,
          marginVertical: 6,
          shadowColor: 'rgba(0,0,0,0.15)',
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 8,
          shadowOpacity: isSelected ? 0.2 : 0.1,
          elevation: isSelected ? 3 : 2,
          borderWidth: 1,
          borderColor: isSelected 
            ? 'rgba(120, 139, 255, 0.3)' 
            : 'rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
      >
        <View style={styles.leftSection}>
          <TouchableOpacity
            onPress={handleToggleCompletion}
            style={[
              styles.checkbox,
              {
                borderColor: task.isCompleted 
                  ? colors.brand.primary 
                  : 'rgba(0,0,0,0.2)',
                backgroundColor: task.isCompleted 
                  ? colors.brand.primary 
                  : 'transparent',
              }
            ]}
          >
            {task.isCompleted && (
              <Icon name="check" size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text.primary,
                  textDecorationLine: task.isCompleted ? 'line-through' : 'none',
                  opacity: task.isCompleted ? 0.7 : 1,
                }
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            
            <View 
              style={[
                styles.priorityIndicator, 
                { backgroundColor: getPriorityColor(task.priority) }
              ]}
            />
          </View>
          
          {task.description ? (
            <Text
              style={[
                styles.description,
                {
                  color: colors.text.secondary,
                  opacity: task.isCompleted ? 0.5 : 0.8,
                }
              ]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          ) : null}
          
          <View style={styles.meta}>
            {formattedDate && (
              <View style={styles.dateContainer}>
                <Icon
                  name="event"
                  size={14}
                  color={colors.text.tertiary}
                  style={styles.metaIcon}
                />
                <Text
                  style={[
                    styles.date,
                    {
                      color: colors.text.tertiary,
                    }
                  ]}
                >
                  {formattedDate}
                </Text>
              </View>
            )}
            
            {task.attachments && task.attachments.length > 0 && (
              <View style={styles.metaItem}>
                <Icon
                  name="attach-file"
                  size={14}
                  color={colors.text.tertiary}
                  style={styles.metaIcon}
                />
                <Text
                  style={[
                    styles.metaText,
                    {
                      color: colors.text.tertiary,
                    }
                  ]}
                >
                  {task.attachments.length} {task.attachments.length === 1 ? 'attachment' : 'attachments'}
                </Text>
              </View>
            )}
            
            {task.tags && task.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {task.tags.slice(0, 2).map((tag, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        {
                          color: colors.text.secondary,
                        }
                      ]}
                      numberOfLines={1}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
                {task.tags.length > 2 && (
                  <Text
                    style={[
                      styles.moreTag,
                      {
                        color: colors.text.tertiary,
                      }
                    ]}
                  >
                    +{task.tags.length - 2}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <Icon
            name={isSelected ? "chevron-right" : "more-vert"}
            size={20}
            color={colors.text.tertiary}
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export const TaskListItem = memo(TaskListItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  gradient: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    width: '100%',
  },
  leftSection: {
    marginRight: 12,
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaIcon: {
    marginRight: 4,
  },
  date: {
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    padding: 4,
    borderRadius: 4,
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
  },
  moreTag: {
    fontSize: 12,
  },
  rightSection: {
    paddingLeft: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
}); 