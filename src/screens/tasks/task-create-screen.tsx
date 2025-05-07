import * as React from 'react';
import { View, Text } from 'react-native';
import type { TaskStackScreenProps } from '@/navigation/types';

type Props = TaskStackScreenProps<'Task.Create'>;

export function TaskCreateScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Create New Task</Text>
      {/* Add create form here */}
    </View>
  );
} 