import * as React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTaskStore } from '@/store/slices/task-slice';
import { TaskData } from '@/types/task';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProps } from '@/navigation/types';

type Props = {
  styles: any;
  colors: any;
  isDark: boolean;
  onViewAll?: () => void;
};

export function UpcomingTasksSection({ styles, colors, isDark, onViewAll }: Props) {
  const { completeTask, deleteTask, setSelectedTask, tasks } = useTaskStore();
  const navigation = useNavigation<NavigationProps['navigation']>();
  const windowWidth = Dimensions.get('window').width;

  // Filter and sort tasks by due date
  const upcomingTasks = React.useMemo(() => {
    const tasksWithDueDate = tasks
      .filter(task => !task.isCompleted && task.dueDate)
      .sort((a, b) => {
        const dateA = new Date(a.dueDate!);
        const dateB = new Date(b.dueDate!);
        return dateA.getTime() - dateB.getTime();
      });
    
    if (tasksWithDueDate.length >= 3) {
      return tasksWithDueDate.slice(0, 3);
    }
    
    const tasksWithoutDueDate = tasks
      .filter(task => !task.isCompleted && !task.dueDate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return [...tasksWithDueDate, ...tasksWithoutDueDate].slice(0, 3);
  }, [tasks]);

  const handleCompleteTask = (taskId: string) => {
    Alert.alert(
      "Complete Task",
      "Are you sure you want to mark this task as complete?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Complete",
          onPress: () => {
            completeTask(taskId);
          }
        }
      ]
    );
  };

  const handleViewTaskDetails = (task: TaskData) => {
    setSelectedTask(task);
    navigation.navigate('TaskStack', {
      screen: 'Task.Details',
      params: { taskId: task.id }
    });
  };

  const handleMoreOptions = (task: TaskData) => {
    Alert.alert(
      "Task Options",
      "Choose an action",
      [
        {
          text: "Edit Task",
          onPress: () => {
            setSelectedTask(task);
            navigation.navigate('TaskStack', {
              screen: 'Task.Edit',
              params: { taskId: task.id }
            });
          }
        },
        {
          text: "Delete Task",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Delete Task",
              "Are you sure you want to delete this task?",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => deleteTask(task.id)
                }
              ]
            );
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigation.navigate('AllTasks');
    }
  };

  // Map priority to color and icon
  const getPriorityData = (priority: string) => {
    switch(priority) {
      case 'high':
        return {
          color: colors.status.error,
          bgColor: `${colors.status.error}15`,
          icon: 'arrow-up'
        };
      case 'medium':
        return {
          color: colors.status.warning,
          bgColor: `${colors.status.warning}15`,
          icon: 'minus'
        };
      case 'low':
      default:
        return {
          color: colors.status.success,
          bgColor: `${colors.status.success}15`,
          icon: 'arrow-down'
        };
    }
  };

  // Format date to friendly format
  const formatDueDate = (dueDate: Date | undefined, daysUntilDue: number) => {
    if (!dueDate) return 'No deadline';
    
    if (daysUntilDue === 0) return 'Today';
    if (daysUntilDue === 1) return 'Tomorrow';
    if (daysUntilDue <= 7) return `In ${daysUntilDue} days`;
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return dueDate.toLocaleDateString(undefined, options);
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 20,
          backgroundColor: colors.surface.primary,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: colors.text.primary,
          padding: 16,
          transform: [{ rotate: '-0.5deg' }],
          shadowColor: colors.text.primary,
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 0,
          elevation: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: `${colors.brand.primary}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              borderWidth: 2,
              borderColor: colors.brand.primary,
              transform: [{ rotate: '1deg' }],
            }}
          >
            <FeatherIcon name="clock" size={20} color={colors.brand.primary} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.text.primary,
            }}
          >
            Upcoming Tasks
          </Text>
        </View>

        <TouchableOpacity
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: colors.brand.primary,
            borderWidth: 2,
            borderColor: colors.text.primary,
            transform: [{ rotate: '1deg' }],
          }}
          onPress={handleViewAll}
        >
          <Text style={{ color: colors.text.inverse, fontWeight: '600', fontSize: 14 }}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        style={{ marginBottom: 8 }}
      >
        {upcomingTasks.map((task) => {
          const dueDate = task.dueDate ? new Date(task.dueDate) : undefined;
          const daysUntilDue = dueDate
            ? Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : Infinity;
          const priority = getPriorityData(task.priority);

          return (
            <TouchableOpacity
              key={task.id}
              onPress={() => handleViewTaskDetails(task)}
              style={{
                width: windowWidth * 0.75,
                marginHorizontal: 8,
                backgroundColor: colors.surface.primary,
                borderRadius: 16,
                borderWidth: 3,
                borderColor: colors.text.primary,
                padding: 20,
                transform: [{ rotate: task.priority === 'high' ? '-1deg' : '1deg' }],
                shadowColor: colors.text.primary,
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 0,
                elevation: 6,
              }}
            >
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.text.primary,
                    marginBottom: 8,
                  }}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>
                {task.description && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.text.secondary,
                      marginBottom: 12,
                    }}
                    numberOfLines={2}
                  >
                    {task.description}
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {dueDate && (
                  <View
                    style={{
                      backgroundColor:
                        daysUntilDue <= 1
                          ? `${colors.status.error}15`
                          : daysUntilDue <= 3
                          ? `${colors.status.warning}15`
                          : `${colors.status.success}15`,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor:
                        daysUntilDue <= 1
                          ? colors.status.error
                          : daysUntilDue <= 3
                          ? colors.status.warning
                          : colors.status.success,
                    }}
                  >
                    <FeatherIcon
                      name="calendar"
                      size={14}
                      color={
                        daysUntilDue <= 1
                          ? colors.status.error
                          : daysUntilDue <= 3
                          ? colors.status.warning
                          : colors.status.success
                      }
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color:
                          daysUntilDue <= 1
                            ? colors.status.error
                            : daysUntilDue <= 3
                            ? colors.status.warning
                            : colors.status.success,
                        fontWeight: '600',
                        fontSize: 14,
                      }}
                    >
                      {formatDueDate(dueDate, daysUntilDue)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => handleCompleteTask(task.id)}
                  style={{
                    backgroundColor: colors.brand.primary,
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: colors.text.primary,
                    transform: [{ rotate: '-1deg' }],
                  }}
                >
                  <FeatherIcon name="check" size={20} color={colors.text.inverse} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
} 