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

  // Filter and sort tasks by due date
  const upcomingTasks = React.useMemo(() => {
    // First prioritize tasks with due dates
    const tasksWithDueDate = tasks
      .filter(task => !task.isCompleted && task.dueDate)
      .sort((a, b) => {
        const dateA = new Date(a.dueDate!);
        const dateB = new Date(b.dueDate!);
        return dateA.getTime() - dateB.getTime();
      });
    
    // If we have enough tasks with due dates, return them
    if (tasksWithDueDate.length >= 3) {
      return tasksWithDueDate.slice(0, 3);
    }
    
    // Otherwise, include some tasks without due dates to fill the list
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

  const windowWidth = Dimensions.get('window').width;

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: `${colors.brand.primary}15`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12
          }}>
            <FeatherIcon name="clock" size={18} color={colors.brand.primary} />
          </View>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.text.primary
          }}>
            Upcoming Tasks
          </Text>
        </View>
        
        <TouchableOpacity 
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: `${colors.brand.primary}10`,
          }}
          onPress={handleViewAll}
        >
          <Text style={{ color: colors.brand.primary, fontWeight: '600', fontSize: 13 }}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {upcomingTasks.length === 0 ? (
        <View style={{
          backgroundColor: colors.surface.primary,
          borderRadius: 16,
          padding: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 16,
          shadowColor: isDark ? '#000' : '#2A2A2A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.2 : 0.1,
          shadowRadius: 8,
          elevation: 3
        }}>
          <MaterialIcons 
            name="event-busy" 
            size={48} 
            color={`${colors.text.secondary}80`}
            style={{ marginBottom: 12 }}
          />
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text.secondary,
            textAlign: 'center'
          }}>
            No upcoming tasks
          </Text>
          <Text style={{
            fontSize: 14,
            color: `${colors.text.secondary}90`,
            textAlign: 'center',
            marginTop: 4,
            lineHeight: 20
          }}>
            You're all caught up! Add new tasks to stay organized.
          </Text>
        </View>
      ) : (
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
              <View
                key={task.id}
                style={{
                  width: windowWidth * 0.75,
                  marginHorizontal: 8,
                  backgroundColor: colors.surface.primary,
                  borderRadius: 16,
                  padding: 16,
                  shadowColor: isDark ? '#000' : '#2A2A2A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.2 : 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                  borderLeftWidth: 4,
                  borderLeftColor: priority.color,
                  marginVertical: 8
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 12
                }}>
                  <View style={{
                    backgroundColor: priority.bgColor,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <FeatherIcon name={priority.icon} size={12} color={priority.color} style={{ marginRight: 4 }} />
                    <Text style={{
                      color: priority.color,
                      fontWeight: '600',
                      fontSize: 12
                    }}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Text>
                  </View>
                  
                  {dueDate && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <View style={{
                        backgroundColor: 
                          daysUntilDue <= 1 ? `${colors.status.error}15` :
                          daysUntilDue <= 3 ? `${colors.status.warning}15` : 
                          `${colors.status.success}15`,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}>
                        <FeatherIcon 
                          name="calendar" 
                          size={12} 
                          color={
                            daysUntilDue <= 1 ? colors.status.error :
                            daysUntilDue <= 3 ? colors.status.warning : 
                            colors.status.success
                          } 
                          style={{ marginRight: 4 }}
                        />
                        <Text style={{
                          color: 
                            daysUntilDue <= 1 ? colors.status.error :
                            daysUntilDue <= 3 ? colors.status.warning : 
                            colors.status.success,
                          fontWeight: '600',
                          fontSize: 12
                        }}>
                          {formatDueDate(dueDate, daysUntilDue)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                
                <Text numberOfLines={2} style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text.primary,
                  marginBottom: 8,
                  lineHeight: 22
                }}>
                  {task.title}
                </Text>
                
                {task.description && (
                  <Text numberOfLines={2} style={{
                    fontSize: 14,
                    color: colors.text.secondary,
                    marginBottom: 16,
                    lineHeight: 20
                  }}>
                    {task.description}
                  </Text>
                )}
                
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: task.description ? 0 : 16
                }}>
                  <TouchableOpacity 
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: colors.brand.primary
                    }}
                    onPress={() => handleCompleteTask(task.id)}
                  >
                    <Text style={{ 
                      color: colors.text.inverse,
                      fontWeight: '600',
                      fontSize: 13
                    }}>
                      Complete
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: colors.status.error + '15'
                    }}
                    onPress={() => {
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
                    }}
                  >
                    <FeatherIcon name="trash-2" size={18} color={colors.status.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
} 