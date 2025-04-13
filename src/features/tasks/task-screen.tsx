import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  RefreshControl, 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  Image,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskListItem } from './components/task-list-item';
import { TaskFormModal } from './components/task-form-modal';
import { TaskDetailModal } from './components/task-detail-modal';
import { useTaskStore } from '../../store/task-store';
import type { TaskData, TaskPriority, TaskAttachment } from '../../types/task';
import RNBlobUtil from 'react-native-blob-util';

const { width } = Dimensions.get('window');

type TaskFilterState = {
  showCompleted: boolean;
  priority: TaskPriority | null;
  search: string;
};

export function TaskScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  
  // Task store
  const { 
    tasks, 
    isLoading, 
    initialized,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion 
  } = useTaskStore();
  
  // UI state
  const [refreshing, setRefreshing] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskData | undefined>(undefined);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [filters, setFilters] = useState<TaskFilterState>({
    showCompleted: true,
    priority: null,
    search: '',
  });

  const scrollY = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(1)).current;
  const addTaskTranslateY = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  // Load tasks on mount
  useEffect(() => {
    if (!initialized) {
      handleRefresh();
    }
  }, [initialized]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTasks();
    } finally {
      setRefreshing(false);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Filter tasks based on current filters
  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
      // Filter based on completion status
      if (!filters.showCompleted && task.isCompleted) {
        return false;
      }
      
      // Filter based on priority
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      
      // Filter based on search text
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by completion status first
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      
      // For incomplete tasks, sort by priority
      if (!a.isCompleted && !b.isCompleted) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      // For completed tasks, sort by completion date (newest first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [tasks, filters]);

  const handleAddTask = (taskData: Omit<TaskData, 'id' | 'createdAt' | 'updatedAt'>) => {
    addTask(taskData);
  };

  const handleUpdateTask = (taskData: Omit<TaskData, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (currentTask) {
      updateTask(currentTask.id, taskData);
    }
  };

  const handleTaskPress = (taskId: string) => {
    if (isMultiSelectMode) {
      toggleTaskSelection(taskId);
      return;
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCurrentTask(task);
      setShowTaskDetail(true);
    }
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCurrentTask(task);
      setShowTaskForm(true);
      setShowTaskDetail(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleToggleTaskCompletion = (taskId: string) => {
    toggleTaskCompletion(taskId);
  };

  // Handle long press to start multi-select mode
  const handleLongPress = (taskId: string) => {
    setIsMultiSelectMode(true);
    setSelectedTasks([taskId]);
  };

  // Toggle task selection in multi-select mode
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        const newSelection = prev.filter(id => id !== taskId);
        if (newSelection.length === 0) {
          setIsMultiSelectMode(false);
        }
        return newSelection;
      } else {
        return [...prev, taskId];
      }
    });
  };

  // Exit multi-select mode
  const exitMultiSelectMode = () => {
    setSelectedTasks([]);
    setIsMultiSelectMode(false);
  };

  const handleToggleShowCompleted = () => {
    setFilters(prev => ({
      ...prev,
      showCompleted: !prev.showCompleted
    }));
  };

  const handleFilterByPriority = (priority: TaskPriority | null) => {
    setFilters(prev => ({
      ...prev,
      priority
    }));
  };

  const handleViewAttachment = async (attachment: TaskAttachment) => {
    try {
      // Open file with device's default viewer
      if (Platform.OS === 'ios') {
        // On iOS, QuickLook will handle most file types
        RNBlobUtil.ios.openDocument(attachment.uri);
      } else {
        // On Android, use the OS file viewer
        RNBlobUtil.android.actionViewIntent(attachment.uri, attachment.type);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const renderTaskItem = useCallback(
    ({ item }: { item: TaskData }) => (
      <TaskListItem 
        task={item} 
        onPress={handleTaskPress} 
        onLongPress={handleLongPress}
        onToggleCompletion={handleToggleTaskCompletion}
        isSelected={selectedTasks.includes(item.id)}
        isSelectMode={isMultiSelectMode}
      />
    ),
    [selectedTasks, isMultiSelectMode]
  );

  // Show/hide the FAB based on scroll direction
  useEffect(() => {
    let previousValue = 0;
    const listener = scrollY.addListener(({ value }) => {
      if (value > previousValue && value > 100) {
        // Scrolling down, hide FAB
        Animated.spring(fabAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      } else if (value < previousValue) {
        // Scrolling up, show FAB
        Animated.spring(fabAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
      previousValue = value;
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {isMultiSelectMode && (
        <View style={[
          styles.multiSelectHeader,
          { 
            backgroundColor: colors.background.primary,
            shadowColor: 'rgba(0,0,0,0.1)',
            borderBottomColor: 'rgba(0,0,0,0.05)',
            borderBottomWidth: 1,
          }
        ]}>
          <TouchableOpacity
            style={styles.closeMultiSelectButton}
            onPress={exitMultiSelectMode}
          >
            <Icon name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.multiSelectTitle, { color: colors.text.primary }]}>
            {selectedTasks.length} selected
          </Text>
          <TouchableOpacity
            style={[
              styles.multiSelectAction,
              { backgroundColor: colors.status.error }
            ]}
            onPress={() => {
              Alert.alert(
                'Delete Tasks',
                'Are you sure you want to delete these tasks?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    onPress: () => {
                      selectedTasks.forEach(id => deleteTask(id));
                      exitMultiSelectMode();
                    },
                    style: 'destructive'
                  }
                ]
              );
            }}
          >
            <Icon name="delete" size={20} color="#FFFFFF" />
            <Text style={styles.multiSelectActionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: 8, paddingBottom: 100 }
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[colors.brand.primary]}
            progressBackgroundColor={colors.background.primary}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.brand.primary} />
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <Image 
                source={require('../../../assets/images/blob1.png')}
                style={[styles.emptyImage, {tintColor: 'rgba(0,0,0,0.1)'}]}
              />
              <Text style={[styles.emptyText, {color: colors.text.primary}]}>
                No tasks found
              </Text>
              <Text style={[styles.emptySubtext, {color: colors.text.tertiary}]}>
                Create your first task by tapping the + button
              </Text>
            </View>
          )
        }
      />

      {/* Floating Action Button (FAB) for adding new task */}
      <Animated.View 
        style={[
          styles.fabContainer,
          {
            transform: [{ translateY: addTaskTranslateY }],
            bottom: insets.bottom + 16
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.brand.primary,
              shadowColor: colors.brand.primary
            }
          ]}
          onPress={() => {
            setCurrentTask(undefined);
            setShowTaskForm(true);
          }}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Task Form Modal */}
      <TaskFormModal 
        visible={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSave={currentTask ? handleUpdateTask : handleAddTask}
        existingTask={currentTask}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        visible={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
        task={currentTask || null}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onToggleCompletion={handleToggleTaskCompletion}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  multiSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  closeMultiSelectButton: {
    padding: 8,
  },
  multiSelectTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  multiSelectAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  multiSelectActionText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
}); 