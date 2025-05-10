import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    listContainer: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      marginBottom: 16,
      transform: [{ rotate: '5deg' }],
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      transform: [{ rotate: '-2deg' }],
    },
    emptyDescription: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
      transform: [{ rotate: '1deg' }],
    },
    separator: {
      height: 16,
    },
    taskItem: {
      borderRadius: 12,
      borderWidth: 3,
      padding: 16,
      marginBottom: 16,
      transform: [{ rotate: '-1deg' }],
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 0,
      elevation: 8,
    },
    taskHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    taskTitle: {
      fontSize: 18,
      fontWeight: '800',
    },
    taskDescription: {
      fontSize: 14,
      marginBottom: 12,
      lineHeight: 20,
    },
    taskMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
    taskMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
      borderWidth: 2,
      transform: [{ rotate: '1deg' }],
    },
    taskMetaText: {
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 6,
    },
  });

  return (
    <FlatList
      data={tasks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.container}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      showsVerticalScrollIndicator={false}
    />
  );
} 