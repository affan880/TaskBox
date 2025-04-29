import * as React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { format } from 'date-fns';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { TaskData } from '@/types/task';
import { createStyles } from '../styles';

type Props = {
  visibleDates: { start: Date; end: Date };
  tasks: TaskData[];
  onNavigate: (screen: string, params?: any) => void;
};

export function VisibleDatesTasks({ visibleDates, tasks, onNavigate }: Props) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  // Filter tasks for visible dates
  const visibleDateTasks = React.useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= visibleDates.start && taskDate <= visibleDates.end;
    });
  }, [tasks, visibleDates]);

  // Group tasks by date
  const tasksByDate = React.useMemo(() => {
    const grouped: { [key: string]: TaskData[] } = {};
    visibleDateTasks.forEach(task => {
      if (task.dueDate) {
        const dateStr = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
        }
        grouped[dateStr].push(task);
      }
    });
    return grouped;
  }, [visibleDateTasks]);

  return (
    <View style={styles.visibleDatesSection}>
      <View style={styles.visibleDatesHeader}>
        <Text style={[styles.visibleDatesTitle, { color: colors.text.primary }]}>
          Tasks for {format(visibleDates.start, 'MMMM yyyy')}
        </Text>
        <Text style={[styles.visibleDatesCount, { color: colors.text.secondary }]}>
          {visibleDateTasks.length} tasks
        </Text>
      </View>

      {visibleDateTasks.length === 0 ? (
        <View style={[styles.emptyVisibleDatesContainer, { backgroundColor: colors.surface.primary }]}>
          <FeatherIcon name="calendar" size={24} color={colors.text.tertiary} />
          <Text style={[styles.emptyVisibleDatesText, { color: colors.text.secondary }]}>
            No tasks scheduled for this period
          </Text>
        </View>
      ) : (
        <View style={styles.visibleDatesList}>
          {Object.entries(tasksByDate).map(([dateStr, dateTasks]) => (
            <View key={dateStr} style={styles.visibleDateGroup}>
              <Text style={[styles.visibleDateGroupTitle, { color: colors.text.primary }]}>
                {format(new Date(dateStr), 'EEEE, MMMM d')}
              </Text>
              {dateTasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.visibleDateTaskItem, { backgroundColor: colors.surface.primary }]}
                  onPress={() => onNavigate('TaskList', { tasks: [task] })}
                >
                  <View style={[
                    styles.visibleDateTaskPriorityIndicator,
                    { 
                      backgroundColor: 
                        task.priority === 'high' ? colors.status.error :
                        task.priority === 'medium' ? colors.status.warning :
                        colors.status.success
                    }
                  ]} />
                  <View style={styles.visibleDateTaskContent}>
                    <Text style={[styles.visibleDateTaskTitle, { color: colors.text.primary }]}>
                      {task.title}
                    </Text>
                    <View style={styles.visibleDateTaskMeta}>
                      <View style={styles.visibleDateTaskTime}>
                        <FeatherIcon name="clock" size={14} color={colors.text.tertiary} />
                        <Text style={[styles.visibleDateTaskTimeText, { color: colors.text.tertiary }]}>
                          {task.dueDate ? format(new Date(task.dueDate), 'h:mm a') : 'No time set'}
                        </Text>
                      </View>
                      <View style={[
                        styles.visibleDateTaskStatus,
                        { 
                          backgroundColor: task.isCompleted ? 
                            `${colors.status.success}20` : 
                            `${colors.status.warning}20`
                        }
                      ]}>
                        <Text style={[
                          styles.visibleDateTaskStatusText,
                          { 
                            color: task.isCompleted ? 
                              colors.status.success : 
                              colors.status.warning
                          }
                        ]}>
                          {task.isCompleted ? 'Completed' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
} 