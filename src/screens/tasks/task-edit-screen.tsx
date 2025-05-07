import * as React from 'react';
import { View, Text } from 'react-native';
import type { TaskStackScreenProps } from '@/navigation/types';

type Props = TaskStackScreenProps<'Task.Edit'>;

export function TaskEditScreen({ route, navigation }: Props) {
  const { taskId } = route.params;

  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Edit Task</Text>
      {/* Add edit form here */}
    </View>
  );
} 