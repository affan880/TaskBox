import * as React from 'react';
import { View, Text } from 'react-native';
import type { TaskStackScreenProps } from '@/navigation/types';
import { useTaskStore } from '@/store/slices/task-slice';

type Props = TaskStackScreenProps<'Task.Details'>;

export function TaskDetailsScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const task = useTaskStore(state => state.tasks.find(t => t.id === taskId));

  if (!task) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Task not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>{task.title}</Text>
      {task.description && (
        <Text style={{ fontSize: 16, color: '#4b5563', marginBottom: 16 }}>{task.description}</Text>
      )}
      {task.dueDate && (
        <Text style={{ fontSize: 14, color: '#6b7280' }}>
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
} 