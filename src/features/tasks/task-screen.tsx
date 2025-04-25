import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/theme-context';
import { useTaskStore } from '../../store/task-store';
import { useProjectStore } from '../../store/project-store';
import { ProjectWithTasks } from '../../types/project';
import type { TaskData, TaskPriority } from '../../types/task';
import { TaskSummary } from '../../components/task-summary';
import { DatePickerInput } from '@/components/ui/date-picker-input';

// Define Tab type
type ActiveTab = 'Overview' | 'Analytics';

// *** ProjectSection Component ***
// Define styles type for props if needed, or pass individual style objects
type ProjectSectionProps = {
  styles: any; // Consider defining a more specific type for styles
  colors: any; // Replace 'any' with your actual theme colors type
  isDark: boolean;
  onNavigate: () => void; // Add callback for navigation
};

function ProjectSection({ styles, colors, isDark, onNavigate }: ProjectSectionProps): React.ReactElement {
  const { projects } = useProjectStore();
  
  // Get the most recent project with tasks
  const recentProject = projects.length > 0 
    ? projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
    : null;

  if (!recentProject) {
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
          <Text style={[styles.projectTitle, { textAlign: 'center' }]}>No projects yet</Text>
          <TouchableOpacity 
            style={[styles.addButton, { marginTop: 16, alignSelf: 'center' }]}
            onPress={onNavigate}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Create Project</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Get project with tasks
  const projectWithTasks = useProjectStore.getState().getProjectWithTasks(recentProject.id);
  if (!projectWithTasks) {
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
          <Text style={[styles.projectTitle, { textAlign: 'center' }]}>Project not found</Text>
          <TouchableOpacity 
            style={[styles.addButton, { marginTop: 16, alignSelf: 'center' }]}
            onPress={onNavigate}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Create Project</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const completedTasks = projectWithTasks.tasks.filter(task => task.isCompleted).length;
  const totalTasks = projectWithTasks.tasks.length;
  const progressPercent = `${Math.round((completedTasks / totalTasks) * 100)}%`;

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
          <Text style={styles.projectTitle}>{projectWithTasks.title}</Text>
          {/* Remove avatars section since it's not in the project type */}
        </View>
        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={styles.dateText}>
              {projectWithTasks.startDate ? new Date(projectWithTasks.startDate).toLocaleDateString() : 'No start date'}
            </Text>
          </View>
          <Text style={styles.dateSeparator}>→</Text>
          <View style={styles.dateItem}>
            <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={styles.dateText}>
              {projectWithTasks.endDate ? new Date(projectWithTasks.endDate).toLocaleDateString() : 'No end date'}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <Text style={styles.progressText}>{progressPercent}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressPercent }]} />
          </View>
          <Text style={styles.taskCountText}>
            {`${completedTasks}/${totalTasks} tasks`}
          </Text>
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
};

function RecentTasksSection({ styles, colors, isDark }: RecentTasksSectionProps): React.ReactElement {
  const { tasks } = useTaskStore();
  
  // Get the most recent incomplete task
  const recentTask = tasks
    .filter(task => !task.isCompleted)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  if (!recentTask) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <FeatherIcon name="list" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Your recent tasks</Text>
          </View>
        </View>
        <View style={styles.recentTaskCard}>
          <Text style={[styles.recentTaskTitle, { textAlign: 'center' }]}>No pending tasks</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <FeatherIcon name="list" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Your recent tasks</Text>
        </View>
      </View>
      <View style={styles.recentTaskCard}>
        <View style={styles.recentTaskIconContainer}>
          <Icon 
            name={recentTask.priority === 'high' ? 'priority-high' : 
                  recentTask.priority === 'medium' ? 'priority-medium' : 
                  'priority-low'} 
            size={24} 
            color={colors.text.primary} 
          />
        </View>
        <View style={styles.recentTaskInfo}>
          <Text style={styles.recentTaskTitle}>{recentTask.title}</Text>
          <View style={styles.recentTaskDeadlineContainer}>
            <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={styles.recentTaskDeadlineText}>
              {recentTask.dueDate ? `Due ${new Date(recentTask.dueDate).toLocaleDateString()}` : 'No due date'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// *** TaskSummarySection Component ***
function TaskSummarySection({ styles, colors, isDark, tasks }: { styles: any, colors: any, isDark: boolean, tasks: TaskData[] }): React.ReactElement {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <FeatherIcon name="bar-chart-2" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Task Overview</Text>
        </View>
      </View>
      
      <TaskSummary tasks={tasks} compact={true} />
    </View>
  );
}

// *** TaskListSection Component ***
type TaskListSectionProps = {
  styles: any;
  colors: any;
  isDark: boolean;
  tasks: TaskData[];
  onTaskPress: (task: TaskData) => void;
  onToggleComplete: (taskId: string) => void;
};

function TaskListSection({ styles, colors, isDark, tasks, onTaskPress, onToggleComplete }: TaskListSectionProps): React.ReactElement {
  // Filter and sort tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    // First sort by completion status
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    // Then sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Finally sort by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  if (sortedTasks.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <FeatherIcon name="check-square" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>All Tasks</Text>
          </View>
        </View>
        <View style={[styles.taskListEmpty, { backgroundColor: isDark ? colors.background.secondary : '#FFFFFF' }]}>
          <FeatherIcon name="check-circle" size={48} color={colors.text.tertiary} />
          <Text style={[styles.taskListEmptyText, { color: colors.text.secondary }]}>
            No tasks yet. Create one to get started!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <FeatherIcon name="check-square" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>All Tasks</Text>
        </View>
      </View>
      
      {sortedTasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={[
            styles.taskItem,
            { backgroundColor: isDark ? colors.background.secondary : '#FFFFFF' }
          ]}
          onPress={() => onTaskPress(task)}
        >
          <TouchableOpacity
            style={[
              styles.taskCheckbox,
              { borderColor: task.isCompleted ? colors.brand.primary : colors.border.light }
            ]}
            onPress={() => onToggleComplete(task.id)}
          >
            {task.isCompleted && (
              <FeatherIcon name="check" size={16} color={colors.brand.primary} />
            )}
          </TouchableOpacity>
          
          <View style={styles.taskContent}>
            <Text 
              style={[
                styles.taskTitle,
                { color: colors.text.primary },
                task.isCompleted && styles.taskTitleCompleted
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            
            {task.description && (
              <Text 
                style={[styles.taskDescription, { color: colors.text.secondary }]}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            )}
            
            <View style={styles.taskFooter}>
              {task.dueDate && (
                <View style={styles.taskDateContainer}>
                  <FeatherIcon name="calendar" size={14} color={colors.text.tertiary} />
                  <Text style={[styles.taskDate, { color: colors.text.tertiary }]}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
              
              <View style={[
                styles.taskPriority,
                { 
                  backgroundColor: 
                    task.priority === 'high' ? `${colors.status.error}20` :
                    task.priority === 'medium' ? `${colors.status.warning}20` :
                    `${colors.status.success}20`
                }
              ]}>
                <Text style={[
                  styles.taskPriorityText,
                  { 
                    color: 
                      task.priority === 'high' ? colors.status.error :
                      task.priority === 'medium' ? colors.status.warning :
                      colors.status.success
                  }
                ]}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function TaskScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  
  const { tasks, isLoading, initialized, loadTasks, addTask, saveTasks } = useTaskStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('Overview');
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  
  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');

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

  // Navigation handlers
  const navigateToProjectDetail = (): void => {
    navigation.navigate('ProjectDetail');
  };

  const navigateToTaskList = (): void => {
    navigation.navigate('TaskList');
  };

  // Task creation handlers
  const handleAddTask = () => {
    setIsTaskModalVisible(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalVisible(false);
    // Reset form
    setTaskTitle('');
    setTaskDescription('');
    setDueDate(null);
    setPriority('medium');
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    try {
      const newTask = {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        isCompleted: false,
        dueDate: dueDate?.toISOString(),
        priority,
        tags: [],
        attachments: [],
      };

      addTask(newTask);
      await saveTasks();
      handleCloseTaskModal();
    } catch (error) {
      console.error('Failed to create task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    }
  };

  const handleTaskPress = (task: TaskData) => {
    // TODO: Navigate to task detail screen
    console.log('Task pressed:', task);
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      const { toggleTaskCompletion, saveTasks } = useTaskStore.getState();
      toggleTaskCompletion(taskId);
      await saveTasks();
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
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
    contentContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
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
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingTop: 20,
      paddingBottom: 36,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    closeButton: {
      position: 'absolute',
      right: 16,
    },
    modalScroll: {
      paddingHorizontal: 16,
    },
    formGroup: {
      marginBottom: 16,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
    },
    formInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
    },
    formTextArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    priorityOptions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    priorityOption: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    activePriorityOption: {
      borderWidth: 1.5,
    },
    priorityOptionText: {
      fontSize: 14,
    },
    saveButton: {
      marginHorizontal: 16,
      marginTop: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    taskListEmpty: {
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taskListEmptyText: {
      marginTop: 12,
      fontSize: 16,
      textAlign: 'center',
    },
    taskItem: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    taskCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taskContent: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    taskTitleCompleted: {
      textDecorationLine: 'line-through',
      color: colors.text.tertiary,
    },
    taskDescription: {
      fontSize: 14,
      marginBottom: 8,
    },
    taskFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    taskDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    taskDate: {
      fontSize: 12,
      marginLeft: 4,
    },
    taskPriority: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    taskPriorityText: {
      fontSize: 12,
      fontWeight: '500',
    },
    viewAllButton: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    viewAllButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Tasks</Text>
            <TouchableOpacity style={styles.headerTitleIcon}>
              <FeatherIcon name="chevron-down" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
            <FeatherIcon name="plus" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchBarContainer}>
          <FeatherIcon name="search" size={20} color={colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.tabsContainer}>
          {['Overview', 'Analytics'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab as ActiveTab)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.activeTabButtonText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <ScrollView style={styles.contentContainer}>
        {activeTab === 'Overview' ? (
          <>
            <TaskSummarySection 
              styles={styles} 
              colors={colors} 
              isDark={isDark} 
              tasks={tasks} 
            />
            <ProjectSection 
              styles={styles} 
              colors={colors} 
              isDark={isDark} 
              onNavigate={navigateToProjectDetail} 
            />
            <RecentTasksSection 
              styles={styles} 
              colors={colors} 
              isDark={isDark} 
            />
            <TouchableOpacity 
              style={[styles.viewAllButton, { backgroundColor: colors.brand.primary }]}
              onPress={navigateToTaskList}
            >
              <Text style={[styles.viewAllButtonText, { color: colors.text.inverse }]}>
                View All Tasks
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ padding: 16 }}>
            <TaskSummary tasks={tasks} />
          </View>
        )}
      </ScrollView>
      
      {/* Task Creation Modal */}
      <Modal
        visible={isTaskModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseTaskModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                New Task
              </Text>
              <TouchableOpacity onPress={handleCloseTaskModal} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              {/* Task Title */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>
                  Title
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { 
                      backgroundColor: colors.background.secondary, 
                      color: colors.text.primary,
                      borderColor: colors.border.light
                    }
                  ]}
                  placeholder="Task title"
                  placeholderTextColor={colors.text.tertiary}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                />
              </View>
              
              {/* Task Description */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>
                  Description
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.formTextArea,
                    { 
                      backgroundColor: colors.background.secondary, 
                      color: colors.text.primary,
                      borderColor: colors.border.light
                    }
                  ]}
                  placeholder="Task description"
                  placeholderTextColor={colors.text.tertiary}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              {/* Due Date */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>
                  Due Date
                </Text>
                <DatePickerInput
                  label="Select Due Date"
                  value={dueDate}
                  onChange={setDueDate}
                />
              </View>
              
              {/* Priority Selection */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>
                  Priority
                </Text>
                <View style={styles.priorityOptions}>
                  {(['low', 'medium', 'high'] as TaskPriority[]).map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.priorityOption,
                        { borderColor: colors.border.light },
                        priority === option && [
                          styles.activePriorityOption,
                          { 
                            borderColor: 
                              option === 'high' ? colors.status.error : 
                              option === 'medium' ? colors.status.warning : 
                              colors.status.success,
                            backgroundColor: 
                              option === 'high' ? `${colors.status.error}20` : 
                              option === 'medium' ? `${colors.status.warning}20` : 
                              `${colors.status.success}20`
                          }
                        ]
                      ]}
                      onPress={() => setPriority(option)}
                    >
                      <Text 
                        style={[
                          styles.priorityOptionText,
                          { color: colors.text.secondary },
                          priority === option && { 
                            color: 
                              option === 'high' ? colors.status.error : 
                              option === 'medium' ? colors.status.warning : 
                              colors.status.success,
                            fontWeight: '600'
                          }
                        ]}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.brand.primary }]}
              onPress={handleCreateTask}
            >
              <Text style={[styles.saveButtonText, { color: colors.text.inverse }]}>
                Create Task
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          {/* Add loading indicator */}
        </View>
      )}
    </SafeAreaView>
  );
} 
