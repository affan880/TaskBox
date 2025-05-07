import * as React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { format, isToday } from 'date-fns';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { TaskData } from '@/types/task';
import { createStyles } from '../styles';
import { CalendarTaskItem } from './calendar-task-item';
import { useFilteredTasks } from '../hooks/use-filtered-tasks';

type Props = {
  selectedDate: Date;
  tasks: TaskData[];
  onNavigate: (screen: string, params?: any) => void;
};

export function SelectedDateTasks({ selectedDate, tasks, onNavigate }: Props) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  // Use the shared hook for filtering and sorting
  const selectedDateTasks = useFilteredTasks(tasks, { date: selectedDate });

  return (
    <View style={styles.selectedDateSection}>
      <View style={styles.selectedDateHeader}>
        <Text style={[styles.selectedDateTitle, { color: colors.text.primary }]}>
          {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMMM d, yyyy')}
          {selectedDateTasks.length > 0 && ` • ${selectedDateTasks.length} task${selectedDateTasks.length === 1 ? '' : 's'}`}
        </Text>
        <TouchableOpacity 
          style={[styles.filterButtons, { backgroundColor: colors.surface.primary }]}
          onPress={() => {
            // Show filter modal
          }}
        >
          <FeatherIcon name="filter" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {selectedDateTasks.length === 0 ? (
        <View style={[styles.emptyDateContainer, { backgroundColor: colors.surface.primary }]}>
          <FeatherIcon name="calendar" size={48} color={colors.text.tertiary} />
          <Text style={[styles.emptyDateText, { color: colors.text.secondary }]}>
            No tasks scheduled for this day
          </Text>
          <TouchableOpacity 
            style={[styles.addTaskButton, { backgroundColor: colors.brand.primary }]}
            onPress={() => onNavigate('TaskCreation', { date: selectedDate })}
          >
            <Text style={[styles.addTaskButton, { color: colors.text.inverse }]}>
              Add Task
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.taskListContainer}>
          {selectedDateTasks.map(task => (
            <CalendarTaskItem
              key={task.id}
              task={task}
              onPress={(taskId) => onNavigate('TaskDetail', { taskId })}
              showTime={true}
              showTags={true}
              maxTags={2}
            />
          ))}
        </View>
      )}
    </View>
  );
} 