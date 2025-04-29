import * as React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { format } from 'date-fns';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { TaskData } from '@/types/task';
import { createStyles } from '../styles';

type Props = {
  selectedDate: Date;
  tasks: TaskData[];
  onNavigate: (screen: string, params?: any) => void;
};

export function SelectedDateTasks({ selectedDate, tasks, onNavigate }: Props) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  // Filter tasks for selected date
  const selectedDateTasks = React.useMemo(() => {
    return tasks.filter(task => 
      task.dueDate && format(new Date(task.dueDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );
  }, [tasks, selectedDate]);

  return (
    <View style={styles.selectedDateSection}>
      <View style={styles.selectedDateHeader}>
        <Text style={[styles.selectedDateTitle, { color: colors.text.primary }]}>
          Tasks for {format(selectedDate, 'MMMM d, yyyy')}
        </Text>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: colors.surface.primary }]}
          onPress={() => {
            // Show filter modal
          }}
        >
          <FeatherIcon name="filter" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {selectedDateTasks.length === 0 ? (
        <View style={[styles.emptyDateContainer, { backgroundColor: colors.surface.primary }]}>
          <FeatherIcon name="calendar" size={24} color={colors.text.tertiary} />
          <Text style={[styles.emptyDateText, { color: colors.text.secondary }]}>
            No tasks scheduled for this day
          </Text>
          <TouchableOpacity 
            style={[styles.addTaskButton, { backgroundColor: colors.brand.primary }]}
            onPress={() => onNavigate('TaskCreation', { date: selectedDate })}
          >
            <Text style={[styles.addTaskButtonText, { color: colors.text.inverse }]}>
              Add Task
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.taskListContainer}>
          {selectedDateTasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={[styles.calendarTaskItem, { backgroundColor: colors.surface.primary }]}
              onPress={() => onNavigate('TaskList', { tasks: [task] })}
            >
              <View style={[
                styles.calendarTaskPriorityIndicator,
                { 
                  backgroundColor: 
                    task.priority === 'high' ? colors.status.error :
                    task.priority === 'medium' ? colors.status.warning :
                    colors.status.success
                }
              ]} />
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
                  <View style={styles.calendarTaskTime}>
                    <FeatherIcon name="clock" size={14} color={colors.text.tertiary} />
                    <Text style={[styles.calendarTaskTimeText, { color: colors.text.tertiary }]}>
                      {task.dueDate ? format(new Date(task.dueDate), 'h:mm a') : 'No time set'}
                    </Text>
                  </View>
                  {task.tags && task.tags.length > 0 && (
                    <View style={styles.calendarTaskTags}>
                      {task.tags.map(tag => (
                        <View 
                          key={tag} 
                          style={[styles.calendarTaskTag, { backgroundColor: `${colors.brand.primary}20` }]}
                        >
                          <Text style={[styles.calendarTaskTagText, { color: colors.brand.primary }]}>
                            {tag}
                          </Text>
                        </View>
                      ))}
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
          ))}
        </View>
      )}
    </View>
  );
} 