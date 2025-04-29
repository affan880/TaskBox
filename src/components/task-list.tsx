import React from 'react';
import { FlatList, View } from 'react-native';
import { TaskCard } from './task-card';
import type { TaskData } from '@/types/task';

type Props = {
  tasks: TaskData[];
  onTaskPress?: (task: TaskData) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskToggleComplete?: (taskId: string) => void;
};

export function TaskList({ tasks, onTaskPress, onTaskDelete, onTaskToggleComplete }: Props) {
  const renderItem = React.useCallback(
    ({ item: task }: { item: TaskData }) => (
      <TaskCard
        task={task}
        onPress={() => onTaskPress?.(task)}
        onDelete={() => onTaskDelete?.(task.id)}
        onToggleComplete={() => onTaskToggleComplete?.(task.id)}
      />
    ),
    [onTaskPress, onTaskDelete, onTaskToggleComplete]
  );

  const keyExtractor = React.useCallback((item: TaskData) => item.id, []);

  return (
    <FlatList
      data={tasks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
} 