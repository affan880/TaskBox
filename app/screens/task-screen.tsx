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
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskCard } from '@/components';
import { TaskFormModal } from '@/features/tasks/components/task-form-modal';
import { TaskDetailModal } from '@/features/tasks/components/task-detail-modal';
import { useTaskStore } from '@/store/task-store';
import type { TaskData, TaskPriority, TaskAttachment } from '@/types/task';
import { openFile, shareFile } from '@/utils/file-utils';

const { width } = Dimensions.get('window');

type TaskFilterState = {
  showCompleted: boolean;
  priority: TaskPriority | null;
  search: string;
};

export function TaskScreen() {
  const insets = useSafeAreaInsets();
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
  const [currentTask, setCurrentTask] = useState<TaskData | null>(null);
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
      if (attachment.downloadUrl) {
        await openFile(attachment.uri, attachment.type);
      } else {
        Alert.alert(
          'Error',
          'Unable to open attachment. The file might be missing or deleted.'
        );
      }
    } catch (error) {
      console.error('Error viewing attachment:', error);
      Alert.alert(
        'Error Opening File',
        'There was an error opening this file. Please make sure you have an app installed that can view this type of file.'
      );
    }
  };

  const renderTaskItem = ({ item }: { item: TaskData }) => {
    return (
      <TaskCard
        task={item}
        onPress={handleTaskPress}
        onLongPress={handleLongPress}
        onToggleComplete={handleToggleTaskCompletion}
        isSelected={selectedTasks.includes(item.id)}
      />
    );
  };

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background.primary,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom, 
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Tasks
        </Text>
        
        <View style={styles.headerActions}>
          {isMultiSelectMode ? (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  // Handle batch delete
                  if (selectedTasks.length > 0) {
                    Alert.alert(
                      'Delete Tasks',
                      `Are you sure you want to delete ${selectedTasks.length} selected tasks?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive',
                          onPress: () => {
                            selectedTasks.forEach(id => deleteTask(id));
                            exitMultiSelectMode();
                          }
                        }
                      ]
                    );
                  }
                }}
              >
                <Icon name="delete" size={24} color={colors.status.error} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={exitMultiSelectMode}
              >
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.filterButton, filters.showCompleted ? { backgroundColor: colors.brand.light } : {}]}
                onPress={handleToggleShowCompleted}
              >
                <Icon 
                  name={filters.showCompleted ? "check-box" : "check-box-outline-blank"} 
                  size={20} 
                  color={filters.showCompleted ? colors.brand.primary : colors.text.tertiary} 
                />
                <Text 
                  style={[
                    styles.filterButtonText, 
                    { 
                      color: filters.showCompleted ? colors.brand.primary : colors.text.tertiary
                    }
                  ]}
                >
                  Show Completed
                </Text>
              </TouchableOpacity>
              
              {['high', 'medium', 'low', null].map((priority) => (
                <TouchableOpacity
                  key={priority || 'all'}
                  style={[
                    styles.priorityFilterButton,
                    filters.priority === priority ? 
                      { backgroundColor: priority 
                        ? {
                            'high': `${colors.status.error}20`,
                            'medium': `${colors.status.warning}20`,
                            'low': `${colors.status.success}20`
                          }[priority] 
                        : colors.brand.light
                      } : {}
                  ]}
                  onPress={() => handleFilterByPriority(priority as TaskPriority | null)}
                >
                  {priority ? (
                    <View 
                      style={[
                        styles.priorityDot,
                        { 
                          backgroundColor: {
                            'high': colors.status.error,
                            'medium': colors.status.warning,
                            'low': colors.status.success
                          }[priority]
                        }
                      ]}
                    />
                  ) : (
                    <Icon name="filter-list-off" size={16} color={colors.text.tertiary} />
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </View>
      
      {/* Task List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onScroll={handleScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.brand.primary]}
              tintColor={colors.brand.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="check-circle" size={64} color={colors.text.quaternary} />
              <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                {filters.showCompleted && filters.priority === null
                  ? "No tasks yet. Tap '+' to add one."
                  : "No tasks match your filters."}
              </Text>
            </View>
          )}
        />
      )}
      
      {/* Add Task Button */}
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
          style={[styles.fab, { backgroundColor: colors.brand.primary }]}
          onPress={() => {
            setCurrentTask(null);
            setShowTaskForm(true);
          }}
        >
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Task Form Modal */}
      <TaskFormModal
        visible={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSave={currentTask ? handleUpdateTask : handleAddTask}
        existingTask={currentTask || undefined}
      />
      
      {/* Task Detail Modal */}
      <TaskDetailModal
        visible={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
        task={currentTask}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onToggleCompletion={handleToggleTaskCompletion}
        onViewAttachment={handleViewAttachment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },
  filterButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  priorityFilterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding for FAB
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
}); 