import * as React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { TaskData } from '@/types/task';
import Icon from 'react-native-vector-icons/MaterialIcons';

type TaskSummaryProps = {
  tasks?: TaskData[];
  style?: any;
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

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface.primary,
          borderRadius: 16,
          borderWidth: 3,
          borderColor: colors.text.primary,
          padding: 20,
          transform: [{ rotate: '-0.5deg' }],
          shadowColor: colors.text.primary,
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 0,
          elevation: 6,
        },
        style
      ]}
    >
      {/* Progress Overview */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.text.primary,
            marginBottom: 16,
            transform: [{ rotate: '1deg' }],
          }}
        >
          Task Progress
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface.secondary,
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: colors.text.primary,
              flex: 1,
              marginRight: 8,
              transform: [{ rotate: '1deg' }],
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text.primary }}>
              {completedTasks}
            </Text>
            <Text style={{ fontSize: 14, color: colors.text.secondary }}>Completed</Text>
          </View>
          <View
            style={{
              backgroundColor: colors.surface.secondary,
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: colors.text.primary,
              flex: 1,
              marginLeft: 8,
              transform: [{ rotate: '-1deg' }],
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text.primary }}>
              {incompleteTasks}
            </Text>
            <Text style={{ fontSize: 14, color: colors.text.secondary }}>Pending</Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: colors.surface.secondary,
            padding: 16,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: colors.text.primary,
            transform: [{ rotate: '0.5deg' }],
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>
              Overall Progress
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.brand.primary }}>
              {completionRate}%
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: `${colors.brand.primary}30`, borderRadius: 4 }}>
            <View
              style={{
                width: `${completionRate}%`,
                height: '100%',
                backgroundColor: colors.brand.primary,
                borderRadius: 4,
              }}
            />
          </View>
        </View>
      </View>

      {/* Priority Breakdown */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.text.primary,
            marginBottom: 16,
            transform: [{ rotate: '-0.5deg' }],
          }}
        >
          Priority Breakdown
        </Text>
        <View
          style={{
            backgroundColor: colors.surface.secondary,
            padding: 16,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: colors.text.primary,
            transform: [{ rotate: '0.5deg' }],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.status.error,
                marginRight: 8,
                borderWidth: 2,
                borderColor: colors.text.primary,
              }}
            />
            <Text style={{ flex: 1, color: colors.text.primary }}>High Priority</Text>
            <Text style={{ fontWeight: '600', color: colors.text.primary }}>{priorityCount.high}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.status.warning,
                marginRight: 8,
                borderWidth: 2,
                borderColor: colors.text.primary,
              }}
            />
            <Text style={{ flex: 1, color: colors.text.primary }}>Medium Priority</Text>
            <Text style={{ fontWeight: '600', color: colors.text.primary }}>{priorityCount.medium}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.status.success,
                marginRight: 8,
                borderWidth: 2,
                borderColor: colors.text.primary,
              }}
            />
            <Text style={{ flex: 1, color: colors.text.primary }}>Low Priority</Text>
            <Text style={{ fontWeight: '600', color: colors.text.primary }}>{priorityCount.low}</Text>
          </View>
        </View>
      </View>

      {/* Next Due Task */}
      {closestDueTask && (
        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.text.primary,
              marginBottom: 16,
              transform: [{ rotate: '0.5deg' }],
            }}
          >
            Next Due Task
          </Text>
          <View
            style={{
              backgroundColor: colors.surface.secondary,
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: colors.text.primary,
              transform: [{ rotate: '-0.5deg' }],
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="access-time" size={24} color={colors.status.warning} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 4 }}
                  numberOfLines={1}
                >
                  {closestDueTask.title}
                </Text>
                <Text style={{ fontSize: 14, color: colors.status.warning }}>
                  Due {formatDate(closestDueTask.dueDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
} 