import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
<<<<<<< HEAD
=======
  ActivityIndicator, 
  FlatList, 
  RefreshControl, 
>>>>>>> a9fc4e08b4f919cea509804cb8bc2a30a54fc1b5
  View, 
  StyleSheet, 
  TouchableOpacity,
  Text,
<<<<<<< HEAD
  Image,
  TextInput,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/theme-context';
import { useTaskStore } from '../../store/task-store';
import type { TaskData, TaskPriority } from '../../types/task';

// Define Tab type
type ActiveTab = 'Overview' | 'Analytics';

// *** ProjectSection Component ***
// Define styles type for props if needed, or pass individual style objects
type ProjectSectionProps = {
  styles: any; // Consider defining a more specific type for styles
  colors: any; // Replace 'any' with your actual theme colors type
  isDark: boolean;
  project?: any; // Placeholder for actual project data type
  onNavigate: () => void; // Add callback for navigation
};

function ProjectSection({ styles, colors, isDark, project, onNavigate }: ProjectSectionProps): React.ReactElement {
  // Default/placeholder data if needed
  const displayProject = project || {
      title: 'Mane UIKit',
      startDate: '01/01/2021',
      endDate: '01/02/2021',
      progress: 50,
      tasksCompleted: 24,
      tasksTotal: 48,
      avatars: ['1', '2', '3', '4'], // Example
  };
  const progressPercent = `${displayProject.progress}%`;

  return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="view-grid-outline" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Your project</Text>
          </View>
          <TouchableOpacity onPress={onNavigate}>
            <FeatherIcon name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.projectCard}>
          <View style={styles.projectCardTopRow}>
            <Text style={styles.projectTitle}>{displayProject.title}</Text>
            <View style={styles.avatarContainer}>
              {/* Render first 3 avatars */} 
              {displayProject.avatars.slice(0, 3).map((avatarId: string, index: number) => (
                  <Image 
                      key={avatarId}
                      source={{ uri: `https://via.placeholder.com/32?text=${index + 1}` }}
                      style={[styles.avatar, { zIndex: index }]} />
              ))}
              {/* More indicator */}
              {displayProject.avatars.length > 3 && (
                  <View style={[styles.avatarMore, { zIndex: 3 }]}>
                      <Text style={styles.avatarMoreText}>+{displayProject.avatars.length - 3}</Text>
                  </View>
              )}
            </View>
          </View>
          <View style={styles.dateContainer}>
            <View style={styles.dateItem}>
              <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
              <Text style={styles.dateText}>{displayProject.startDate}</Text>
            </View>
            <Text style={styles.dateSeparator}>→</Text>
            <View style={styles.dateItem}>
              <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
              <Text style={styles.dateText}>{displayProject.endDate}</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
             <Text style={styles.progressText}>{progressPercent}</Text>
             <View style={styles.progressTrack}>
               <View style={[styles.progressFill, { width: progressPercent }]} />
             </View>
             <Text style={styles.taskCountText}>{`${displayProject.tasksCompleted}/${displayProject.tasksTotal} tasks`}</Text>
          </View>
        </View>
      </View>
  );
}

// *** RecentTasksSection Component ***
type RecentTasksSectionProps = {
    styles: any;
    colors: any;
    isDark: boolean;
    recentTask?: any; // Placeholder for actual recent task data type
};

function RecentTasksSection({ styles, colors, isDark, recentTask }: RecentTasksSectionProps): React.ReactElement {
    const displayTask = recentTask || {
        title: 'Userflow Mane UIKit',
        deadline: '03/01/2021',
        icon: 'terrain' // Example icon name
    };
    return (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                    <FeatherIcon name="list" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Your recent tasks</Text>
                </View>
                <TouchableOpacity>
                    <FeatherIcon name="chevron-right" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
            </View>
            <View style={styles.recentTaskCard}>
                <View style={styles.recentTaskIconContainer}>
                    {/* Use a relevant icon based on task type or default */}
                    <Icon name={displayTask.icon} size={24} color={colors.text.primary} /> 
                </View>
                <View style={styles.recentTaskInfo}>
                    <Text style={styles.recentTaskTitle}>{displayTask.title}</Text>
                    <View style={styles.recentTaskDeadlineContainer}>
                        <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
                        <Text style={styles.recentTaskDeadlineText}>Deadline: {displayTask.deadline}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

export function TaskScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  
  const { tasks, isLoading, initialized, loadTasks } = useTaskStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('Overview');

  useEffect(() => {
    if (!initialized) {
      loadTasks();
    }
  }, [initialized, loadTasks]);

  const handleRefresh = async (): Promise<void> => {
    try {
      await loadTasks();
    } finally {
      // Can add logic here if needed (e.g., stop loading indicator)
    }
  };

  // Navigation handler
  const navigateToProjectDetail = (): void => {
    navigation.navigate('ProjectDetail'); // Use the actual route name for ProjectDetailScreen
  };

  const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: { 
      paddingHorizontal: 16,
      paddingTop: 16, 
      paddingBottom: 0,
      backgroundColor: colors.background.primary, 
    },
    headerTopRow: { 
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerTitleContainer: { 
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: { 
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    headerTitleIcon: { 
      marginLeft: 8,
    },
    addButton: { 
      backgroundColor: '#7C3AED',
      padding: 12,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    searchBarContainer: { 
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 16,
    },
    searchIcon: { 
      marginRight: 8,
    },
    searchInput: { 
      flex: 1,
      fontSize: 16,
      color: colors.text.primary,
      paddingVertical: 4, 
    },
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? colors.border.dark : colors.border.light, 
    },
    tabButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      flex: 1,
      alignItems: 'center',
    },
    activeTabButton: {
       borderBottomWidth: 2,
       borderBottomColor: colors.brand.primary,
    },
    tabButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text.secondary,
    },
    activeTabButtonText: {
      color: colors.brand.primary, 
    },
    sectionContainer: { marginTop: 16 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
    },
    projectCard: {
      backgroundColor: isDark ? colors.background.secondary : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
    },
    projectCardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    projectTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    avatarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: isDark ? colors.background.secondary : '#FFFFFF',
      marginLeft: -8,
    },
    avatarMore: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FDBA74',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? colors.background.secondary : '#FFFFFF',
      marginLeft: -8,
    },
    avatarMoreText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    dateContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 12,
    },
    dateItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginLeft: 6,
    },
    dateSeparator: {
      color: colors.text.tertiary,
      marginHorizontal: 4,
    },
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 4,
    },
    progressText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text.primary,
      marginRight: 12,
    },
    progressTrack: {
      flex: 1,
      height: 8,
      backgroundColor: colors.background.tertiary, 
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: 8,
      backgroundColor: '#7C3AED',
      borderRadius: 4,
    },
    taskCountText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginLeft: 12,
    },
    recentTaskCard: {
      backgroundColor: isDark ? colors.background.secondary : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
    },
    recentTaskIconContainer: {
      width: 48,
      height: 48,
      backgroundColor: colors.background.tertiary,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    recentTaskInfo: {
      flex: 1,
    },
    recentTaskTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 4,
    },
    recentTaskDeadlineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recentTaskDeadlineText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginLeft: 6,
    },
    emptyAnalyticsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 20,
    },
    emptyAnalyticsText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text.secondary,
        textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Icon name="terrain" size={24} color={colors.text.primary} style={styles.headerTitleIcon} />
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              console.log('Add pressed');
            }}
          >
            <Icon name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBarContainer}>
          <Icon name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Tasks"
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity>
             <FeatherIcon name="sliders" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
         <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Overview' && styles.activeTabButton]}
            onPress={() => setActiveTab('Overview')}
         >
            <Text style={[styles.tabButtonText, activeTab === 'Overview' && styles.activeTabButtonText]}>
               Overview
            </Text>
         </TouchableOpacity>
         <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Analytics' && styles.activeTabButton]}
            onPress={() => setActiveTab('Analytics')}
         >
            <Text style={[styles.tabButtonText, activeTab === 'Analytics' && styles.activeTabButtonText]}>
               Analytics
            </Text>
         </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}> 
         {activeTab === 'Overview' && (
           <>
             <ProjectSection 
                styles={styles} 
                colors={colors} 
                isDark={isDark} 
                project={null} 
                onNavigate={navigateToProjectDetail}
              />
             <RecentTasksSection styles={styles} colors={colors} isDark={isDark} recentTask={null} />
           </>
         )}

         {activeTab === 'Analytics' && (
           <View style={styles.emptyAnalyticsContainer}>
             <FeatherIcon name="bar-chart-2" size={48} color={colors.text.tertiary} />
             <Text style={[styles.emptyAnalyticsText, { marginTop: 16 }]}>
               Analytics section
               {'\n'}(coming soon)
             </Text>
           </View>
         )}
      </ScrollView>
    </SafeAreaView>
  );
} 
=======
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
>>>>>>> a9fc4e08b4f919cea509804cb8bc2a30a54fc1b5
