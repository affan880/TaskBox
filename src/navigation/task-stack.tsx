import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TaskStackParamList } from './types';

// Import your screens here
import { TaskListScreen } from '@/screens/tasks/task-list-screen';
import { TaskDetailsScreen } from '@/screens/tasks/task-details-screen';
import { TaskEditScreen } from '@/screens/tasks/task-edit-screen';
import { TaskCreateScreen } from '@/screens/tasks/task-create-screen';

const Stack = createNativeStackNavigator<TaskStackParamList>();

export function TaskStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Tasks"
        component={TaskListScreen}
        options={{
          title: 'Tasks',
        }}
      />

      <Stack.Screen
        name="Task.Details"
        component={TaskDetailsScreen}
        options={{
          title: 'Task Details',
          presentation: 'card',
        }}
      />

      <Stack.Screen
        name="Task.Edit"
        component={TaskEditScreen}
        options={{
          title: 'Edit Task',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="Task.Create"
        component={TaskCreateScreen}
        options={{
          title: 'New Task',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
} 