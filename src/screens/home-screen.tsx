import * as React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth-store';
import { useCollection } from '../hooks/use-firestore';
import { Button } from '../components/ui/button';
import { colors } from '../utils/styling';
import { RootStackParamList } from '../navigation/app-navigator';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt?: any; // Firestore timestamp, will be added automatically by the hook
};

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore.useUser();
  const { signOut } = useAuthStore.useActions();

  const { 
    documents: tasks, 
    isLoading, 
    error, 
    add: addTask, 
    update: updateTask,
    remove: removeTask,
  } = useCollection<Task>('tasks');

  const [newTaskTitle, setNewTaskTitle] = React.useState('');

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    await addTask({
      title: newTaskTitle.trim(),
      completed: false,
    });

    setNewTaskTitle('');
  };

  const handleToggleComplete = async (task: Task) => {
    await updateTask(task.id, {
      completed: !task.completed,
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await removeTask(taskId);
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity 
        style={[styles.checkbox, item.completed && styles.checkboxChecked]}
        onPress={() => handleToggleComplete(item)}
      >
        {item.completed && <View style={styles.checkmark} />}
      </TouchableOpacity>
      
      <Text 
        style={[styles.taskTitle, item.completed && styles.taskCompleted]}
        numberOfLines={1}
      >
        {item.title}
      </Text>
      
      <TouchableOpacity 
        onPress={() => handleDeleteTask(item.id)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Task List</Text>
          <Text style={styles.subtitle}>Welcome, {user?.displayName || 'User'}</Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.taskInputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              onSubmitEditing={handleAddTask}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskItem}
            style={styles.taskList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No tasks yet. Add one above!</Text>
            }
          />
        )}

        <View style={styles.footer}>
          <Button 
            onPress={() => navigation.navigate('Email')}
            style={styles.emailButton}
          >
            Open Email
          </Button>
          <Button 
            variant="outline" 
            onPress={signOut}
            style={styles.signOutButton}
          >
            Sign Out
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  taskInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputWrapper: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginRight: 12,
  },
  input: {
    fontSize: 16,
    color: colors.neutral[800],
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.neutral[400],
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    width: 12,
    height: 12,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    color: colors.neutral[800],
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: colors.neutral[400],
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.danger + '15',
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: colors.neutral[500],
  },
  loader: {
    marginTop: 40,
  },
  footer: {
    marginTop: 20,
  },
  emailButton: {
    marginBottom: 10,
  },
  signOutButton: {
    marginTop: 10,
  },
  errorContainer: {
    backgroundColor: colors.danger + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
}); 