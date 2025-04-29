import * as React from 'react';
import { View, Text } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { TaskData } from '@/types/task';
import { createStyles } from '../styles';

type Props = {
  styles: any;
  colors: any;
  isDark: boolean;
  tasks: TaskData[];
};

export function UpcomingTasksSection({ styles, colors, isDark, tasks }: Props) {
  // Filter and sort tasks by due date
  const upcomingTasks = React.useMemo(() => {
    const now = new Date();
    return tasks
      .filter(task => !task.isCompleted && task.dueDate)
      .sort((a, b) => {
        const dateA = new Date(a.dueDate!);
        const dateB = new Date(b.dueDate!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3); // Show only the next 3 upcoming tasks
  }, [tasks]);

  if (upcomingTasks.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <FeatherIcon name="clock" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Upcoming Tasks</Text>
          </View>
        </View>
        <View style={[styles.upcomingTasksEmpty, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.upcomingTasksEmptyText, { color: colors.text.secondary }]}>
            No upcoming tasks
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <FeatherIcon name="clock" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Upcoming Tasks</Text>
        </View>
      </View>
      
      {upcomingTasks.map((task) => {
        const dueDate = new Date(task.dueDate!);
        const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <View
            key={task.id}
            style={[styles.upcomingTaskCard, { backgroundColor: colors.surface.primary }]}
          >
            <View style={styles.upcomingTaskHeader}>
              <View style={styles.upcomingTaskTitleContainer}>
                <Text style={[styles.upcomingTaskTitle, { color: colors.text.primary }]}>
                  {task.title}
                </Text>
                <View style={[
                  styles.upcomingTaskPriority,
                  { 
                    backgroundColor: 
                      task.priority === 'high' ? `${colors.status.error}20` :
                      task.priority === 'medium' ? `${colors.status.warning}20` :
                      `${colors.status.success}20`
                  }
                ]}>
                  <Text style={[
                    styles.upcomingTaskPriorityText,
                    { 
                      color: 
                        task.priority === 'high' ? colors.status.error :
                        task.priority === 'medium' ? colors.status.warning :
                        colors.status.success
                    }
                  ]}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.upcomingTaskFooter}>
              <View style={styles.upcomingTaskDateContainer}>
                <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
                <Text style={[styles.upcomingTaskDate, { color: colors.text.secondary }]}>
                  {dueDate.toLocaleDateString()}
                </Text>
              </View>
              
              <Text style={[
                styles.upcomingTaskDueText,
                { 
                  color: daysUntilDue <= 1 ? colors.status.error :
                         daysUntilDue <= 3 ? colors.status.warning :
                         colors.status.success
                }
              ]}>
                {daysUntilDue === 0 ? 'Due today' :
                 daysUntilDue === 1 ? 'Due tomorrow' :
                 `Due in ${daysUntilDue} days`}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
} 