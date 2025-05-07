import * as React from 'react';
import { ScrollView, View, Text } from 'react-native';
import type { TaskStackScreenProps } from '@/navigation/types';
import { useTaskStore } from '@/store/slices/task-slice';

type Props = TaskStackScreenProps<'Tasks'>;

export function TaskListScreen({ navigation }: Props) {
  const tasks = useTaskStore(state => state.tasks);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>All Tasks</Text>
        {tasks.map(task => (
          <View 
            key={task.id} 
            style={{ 
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#f3f4f6',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600' }}>{task.title}</Text>
            {task.description && (
              <Text style={{ color: '#4b5563', marginTop: 4 }}>{task.description}</Text>
            )}
            {task.dueDate && (
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
} 