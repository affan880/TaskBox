import * as React from 'react';
import { View, Text } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { useTaskStore } from '@/store/slices/task-slice';
import { createStyles } from '../styles';

type Props = {
  styles: any;
  colors: any;
  isDark: boolean;
};

export function RecentTasksSection({ styles, colors, isDark }: Props) {
  const { tasks } = useTaskStore();
  
  // Get the most recent incomplete task
  const recentTask = tasks
    .filter(task => !task.isCompleted)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  if (!recentTask) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <FeatherIcon name="list" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your recent tasks</Text>
          </View>
        </View>
        <View style={[styles.recentTaskCard, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.recentTaskTitle, { color: colors.text.primary, textAlign: 'center' }]}>No pending tasks</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <FeatherIcon name="list" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your recent tasks</Text>
        </View>
      </View>
      <View style={[styles.recentTaskCard, { backgroundColor: colors.surface.primary }]}>
        <View style={[styles.recentTaskIconContainer, { backgroundColor: colors.surface.secondary }]}>
          <Icon 
            name={recentTask.priority === 'high' ? 'priority-high' : 
                  recentTask.priority === 'medium' ? 'priority-medium' : 
                  'priority-low'} 
            size={24} 
            color={recentTask.priority === 'high' ? colors.status.error :
                   recentTask.priority === 'medium' ? colors.status.warning :
                   colors.status.success} 
          />
        </View>
        <View style={styles.recentTaskInfo}>
          <Text style={[styles.recentTaskTitle, { color: colors.text.primary }]}>{recentTask.title}</Text>
          <View style={styles.recentTaskDeadlineContainer}>
            <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={[styles.recentTaskDeadlineText, { color: colors.text.secondary }]}>
              {recentTask.dueDate ? `Due ${new Date(recentTask.dueDate).toLocaleDateString()}` : 'No due date'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
} 