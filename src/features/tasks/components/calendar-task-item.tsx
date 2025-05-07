import * as React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { format } from 'date-fns';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import type { TaskData } from '@/types/task';
import { createStyles } from '../styles';

type Props = {
  task: TaskData;
  onPress: (taskId: string) => void;
  showTime?: boolean;
  showTags?: boolean;
  maxTags?: number;
};

export function CalendarTaskItem({ 
  task, 
  onPress, 
  showTime = true,
  showTags = true,
  maxTags = 2
}: Props) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <TouchableOpacity
      style={[styles.calendarTaskItem, { backgroundColor: colors.surface.primary }]}
      onPress={() => onPress(task.id)}
    >
      <View 
        style={[
          styles.calendarTaskPriorityIndicator,
          { 
            backgroundColor: task.priority === 'high' ? colors.status.error :
                           task.priority === 'medium' ? colors.status.warning :
                           colors.status.success
          }
        ]} 
      />
      <View style={styles.calendarTaskContent}>
        <Text style={[styles.calendarTaskTitle, { color: colors.text.primary }]}>
          {task.title}
        </Text>
        {task.description && (
          <Text 
            style={[styles.calendarTaskDescription, { color: colors.text.secondary }]}
            numberOfLines={2}
          >
            {task.description}
          </Text>
        )}
        <View style={styles.calendarTaskMeta}>
          {showTime && task.dueDate && (
            <View style={styles.calendarTaskTime}>
              <FeatherIcon name="clock" size={14} color={colors.text.tertiary} />
              <Text style={[styles.calendarTaskTimeText, { color: colors.text.tertiary }]}>
                {format(new Date(task.dueDate), 'h:mm a')}
              </Text>
            </View>
          )}
          {showTags && task.tags && task.tags.length > 0 && (
            <View style={styles.calendarTaskTags}>
              {task.tags.slice(0, maxTags).map(tag => (
                <View 
                  key={tag}
                  style={[styles.calendarTaskTag, { backgroundColor: `${colors.brand.primary}20` }]}
                >
                  <Text style={[styles.calendarTaskTagText, { color: colors.brand.primary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
              {task.tags.length > maxTags && (
                <View style={[styles.calendarTaskTag, { backgroundColor: `${colors.brand.primary}20` }]}>
                  <Text style={[styles.calendarTaskTagText, { color: colors.brand.primary }]}>
                    +{task.tags.length - maxTags}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
      <View style={[
        styles.calendarTaskStatus,
        { 
          backgroundColor: task.isCompleted ? 
            `${colors.status.success}20` : 
            `${colors.status.warning}20`
        }
      ]}>
        <Text style={[
          styles.calendarTaskStatusText,
          { 
            color: task.isCompleted ? 
              colors.status.success : 
              colors.status.warning
          }
        ]}>
          {task.isCompleted ? 'Completed' : 'Pending'}
        </Text>
      </View>
    </TouchableOpacity>
  );
} 