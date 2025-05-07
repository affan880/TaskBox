import * as React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { TaskData, TaskPriority } from '@/types/task';

type TaskSummaryProps = {
  tasks?: TaskData[];
  style?: ViewStyle;
  compact?: boolean;
};

export function TaskSummary({ tasks = [], style, compact = false }: TaskSummaryProps) {
  const { colors, isDark } = useTheme();
  
  // Calculate statistics
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(task => task.isCompleted).length || 0;
  const incompleteTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Count tasks by priority
  const priorityCount = {
    high: tasks?.filter(task => task.priority === 'high').length || 0,
    medium: tasks?.filter(task => task.priority === 'medium').length || 0,
    low: tasks?.filter(task => task.priority === 'low').length || 0
  };
  
  // Find closest due task (excluding completed)
  const pendingTasks = tasks?.filter(task => !task.isCompleted && task.dueDate) || [];
  const closestDueTask = pendingTasks.length > 0 
    ? pendingTasks.reduce((closest, task) => {
        if (!closest.dueDate) return task;
        if (!task.dueDate) return closest;
        
        return new Date(task.dueDate) < new Date(closest.dueDate) ? task : closest;
      }, pendingTasks[0])
    : null;
    
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? colors.background.secondary : 'white',
      borderRadius: 12,
      padding: 16,
      ...style
    },
    compactContainer: {
      backgroundColor: isDark ? colors.background.secondary : '#F5F5F5',
      borderRadius: 8,
      padding: 12,
      ...style
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spaceBetween: {
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 16
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text.secondary,
      marginBottom: 8,
    },
    statContainer: {
      flex: 1,
      backgroundColor: isDark ? colors.background.tertiary : '#F5F5F5',
      borderRadius: 8,
      padding: 10,
      alignItems: 'center',
      margin: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.text.tertiary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    completedValue: {
      color: colors.status.success,
    },
    pendingValue: {
      color: colors.status.warning,
    },
    progressContainer: {
      height: 8,
      backgroundColor: isDark ? colors.background.tertiary : '#EEEEEE',
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 8,
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.brand.primary,
    },
    priorityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    priorityDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
    priorityHigh: {
      backgroundColor: colors.status.error,
    },
    priorityMedium: {
      backgroundColor: colors.status.warning,
    },
    priorityLow: {
      backgroundColor: colors.status.success,
    },
    priorityLabel: {
      flex: 1,
      color: colors.text.secondary,
    },
    priorityValue: {
      fontWeight: '500',
      color: colors.text.primary,
    },
    upcomingTask: {
      backgroundColor: isDark ? `${colors.brand.primary}20` : '#F0EAFF',
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    upcomingTaskInfo: {
      marginLeft: 12,
      flex: 1,
    },
    upcomingTaskTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text.primary,
      marginBottom: 4,
    },
    upcomingTaskDate: {
      fontSize: 12,
      color: colors.text.tertiary,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.brand.primary,
    },
    badgeText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 12,
    }
  });
  
  if (compact) {
    // Compact view for dashboard tiles
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.row, styles.spaceBetween, { marginBottom: 8 }]}>
          <Text style={styles.headerTitle}>Task Status</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{completionRate}%</Text>
          </View>
        </View>
        
        <View style={styles.row}>
          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{totalTasks}</Text>
          </View>
          
          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={[styles.statValue, styles.completedValue]}>{completedTasks}</Text>
          </View>
          
          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, styles.pendingValue]}>{incompleteTasks}</Text>
          </View>
        </View>
      </View>
    );
  }
  
  // Full view with more details
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Task Summary</Text>
      
      {/* Progress section */}
      <View style={styles.section}>
        <View style={[styles.row, styles.spaceBetween, { marginBottom: 8 }]}>
          <Text style={styles.sectionTitle}>Completion Rate</Text>
          <Text style={[styles.priorityValue, { color: colors.brand.primary }]}>{completionRate}%</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${completionRate}%` }]} />
        </View>
      </View>
      
      {/* Task counts */}
      <View style={[styles.row, styles.section]}>
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{totalTasks}</Text>
        </View>
        
        <View style={[styles.statContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }]}>
          <Text style={[styles.statLabel, { color: colors.status.success }]}>Completed</Text>
          <Text style={[styles.statValue, styles.completedValue]}>{completedTasks}</Text>
        </View>
        
        <View style={[styles.statContainer, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)' }]}>
          <Text style={[styles.statLabel, { color: colors.status.warning }]}>Pending</Text>
          <Text style={[styles.statValue, styles.pendingValue]}>{incompleteTasks}</Text>
        </View>
      </View>
      
      {/* Priority breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Priority Breakdown</Text>
        
        <View style={styles.priorityItem}>
          <View style={[styles.priorityDot, styles.priorityHigh]} />
          <Text style={styles.priorityLabel}>High Priority</Text>
          <Text style={styles.priorityValue}>{priorityCount.high}</Text>
        </View>
        
        <View style={styles.priorityItem}>
          <View style={[styles.priorityDot, styles.priorityMedium]} />
          <Text style={styles.priorityLabel}>Medium Priority</Text>
          <Text style={styles.priorityValue}>{priorityCount.medium}</Text>
        </View>
        
        <View style={styles.priorityItem}>
          <View style={[styles.priorityDot, styles.priorityLow]} />
          <Text style={styles.priorityLabel}>Low Priority</Text>
          <Text style={styles.priorityValue}>{priorityCount.low}</Text>
        </View>
      </View>
      
      {/* Next due task */}
      {closestDueTask && (
        <View>
          <Text style={styles.sectionTitle}>Upcoming Task</Text>
          <View style={styles.upcomingTask}>
            <Icon name="access-time" size={20} color={colors.status.warning} />
            <View style={styles.upcomingTaskInfo}>
              <Text style={styles.upcomingTaskTitle} numberOfLines={1}>
                {closestDueTask.title}
              </Text>
              <Text style={styles.upcomingTaskDate}>
                Due {formatDate(closestDueTask.dueDate)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
} 