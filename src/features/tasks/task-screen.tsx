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

  const handleEditTask = (taskId: string) => {
    if (isMultiSelectMode) {
      toggleTaskSelection(taskId);
      return;
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCurrentTask(task);
      setShowTaskForm(true);
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
        onPress={handleEditTask} 
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
    <View style={[styles.container, {backgroundColor: '#ffffff'}]}>
      {isMultiSelectMode ? (
        <View style={[
          styles.selectionBar, 
          {
            paddingTop: insets.top,
            backgroundColor: '#ffffff',
            borderBottomColor: 'rgba(0,0,0,0.05)',
            borderBottomWidth: 1,
            shadowColor: 'rgba(0,0,0,0.1)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }
        ]}>
          <TouchableOpacity 
            style={styles.selectionButton} 
            onPress={exitMultiSelectMode}
          >
            <Icon name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.selectionTitle, {color: colors.text.primary}]}>
            {selectedTasks.length} selected
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                selectedTasks.forEach(id => handleToggleTaskCompletion(id));
                exitMultiSelectMode();
              }}
            >
              <Icon name="check-circle-outline" size={22} color={colors.brand.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                selectedTasks.forEach(id => handleDeleteTask(id));
                exitMultiSelectMode();
              }}
            >
              <Icon name="delete" size={22} color={colors.status.error} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[
          styles.header, 
          {
            paddingTop: insets.top,
            backgroundColor: '#ffffff',
            borderBottomColor: 'rgba(0,0,0,0.05)',
            borderBottomWidth: 1,
            shadowColor: 'rgba(0,0,0,0.1)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }
        ]}>
          <Text style={[styles.headerTitle, {color: colors.text.primary}]}>
            My Tasks
          </Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                filters.showCompleted ? 
                  { backgroundColor: 'rgba(120, 139, 255, 0.1)' } : {}
              ]}
              onPress={handleToggleShowCompleted}
            >
              <Icon 
                name={filters.showCompleted ? "check-box-outline-blank" : "check-box"} 
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
                {filters.showCompleted ? "Show all" : "Hide completed"}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.priorityFilterButtons}>
              <TouchableOpacity 
                style={[
                  styles.priorityButton,
                  filters.priority === 'high' ? 
                    { backgroundColor: colors.status.error } : 
                    { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                ]}
                onPress={() => handleFilterByPriority(filters.priority === 'high' ? null : 'high')}
              >
                <Icon 
                  name="flag" 
                  size={18} 
                  color={filters.priority === 'high' ? '#fff' : colors.status.error} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.priorityButton,
                  filters.priority === 'medium' ? 
                    { backgroundColor: colors.status.warning } : 
                    { backgroundColor: 'rgba(255, 152, 0, 0.1)' }
                ]}
                onPress={() => handleFilterByPriority(filters.priority === 'medium' ? null : 'medium')}
              >
                <Icon 
                  name="flag" 
                  size={18} 
                  color={filters.priority === 'medium' ? '#fff' : colors.status.warning} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.priorityButton,
                  filters.priority === 'low' ? 
                    { backgroundColor: colors.status.success } : 
                    { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                ]}
                onPress={() => handleFilterByPriority(filters.priority === 'low' ? null : 'low')}
              >
                <Icon 
                  name="flag" 
                  size={18} 
                  color={filters.priority === 'low' ? '#fff' : colors.status.success} 
                />
              </TouchableOpacity>
            </View>
          </View>
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
          styles.fab,
          {
            transform: [{ translateY: addTaskTranslateY }],
            opacity: fabAnim,
            bottom: insets.bottom > 0 ? insets.bottom : 16
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.fabButton, 
            {
              backgroundColor: colors.brand.primary,
              shadowColor: 'rgba(0,0,0,0.3)',
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 5,
              shadowOpacity: 0.3,
              elevation: 5,
            }
          ]}
          onPress={() => {
            setCurrentTask(undefined);
            setShowTaskForm(true);
          }}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <TaskFormModal
        visible={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setCurrentTask(undefined);
        }}
        onSave={currentTask ? handleUpdateTask : handleAddTask}
        existingTask={currentTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  priorityFilterButtons: {
    flexDirection: 'row',
  },
  priorityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyImage: {
    width: 120,
    height: 120,
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    right: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    zIndex: 10,
  },
  selectionButton: {
    padding: 8,
  },
  selectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectionActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
}); 