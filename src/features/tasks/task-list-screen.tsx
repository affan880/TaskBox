import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { useProjectStore } from '@/store/project-store';
import { useTaskStore } from '@/store/task-store';
import { ProjectWithTasks } from '@/types/project';
import { TaskData, TaskPriority, TaskFilter } from '@/types/task';
import { TaskCard } from '@/components/task-card';
import { FileAttachmentsList } from '@/components/file-attachments-list';
import { createTask } from '@/api/tasks-api';

type FilterTab = 'All' | 'Active' | 'Completed';

// Define the route params type
type TaskListScreenParams = {
  projectId: string;
};

export function TaskListScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, TaskListScreenParams>, string>>();
  const { colors, isDark } = useTheme();
  const projectId = route.params?.projectId;
  
  // Store access
  const { getProjectWithTasks, updateProject, saveProjects } = useProjectStore();
  const { 
    addTask, 
    updateTask, 
    toggleTaskCompletion, 
    deleteTask, 
    saveTasks,
    tasks
  } = useTaskStore();
  
  // Component state
  const [project, setProject] = useState<ProjectWithTasks | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  
  // Task create form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(new Date()); 
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isCreateMode, setIsCreateMode] = useState(true);
  
  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);
  
  const loadProjectData = useCallback(() => {
    if (!projectId) return;
    
    const projectData = getProjectWithTasks(projectId);
    if (projectData) {
      setProject(projectData);
    } else {
      // Handle project not found
      Alert.alert('Error', 'Project not found');
      navigation.goBack();
    }
  }, [projectId, getProjectWithTasks, navigation]);
  
  // Filter tasks based on active filter and search
  const getFilteredTasks = useCallback(() => {
    let filtered = [...tasks];
    
    // Apply tab filter
    if (activeFilter === 'Completed') {
      filtered = filtered.filter(task => task.isCompleted);
    } else if (activeFilter === 'Active') {
      filtered = filtered.filter(task => !task.isCompleted);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) || 
        (task.description && task.description.toLowerCase().includes(query))
      );
    }
    
    // Sort tasks
    return filtered.sort((a, b) => {
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
  }, [tasks, activeFilter, searchQuery]);
  
  const filteredTasks = getFilteredTasks();
  
  // Task modal handlers
  const handleAddTask = () => {
    setIsCreateMode(true);
    setTaskTitle('');
    setTaskDescription('');
    setDueDate(new Date());
    setPriority('medium');
    setIsTaskModalVisible(true);
  };
  
  const handleEditTask = (task: TaskData) => {
    setIsCreateMode(false);
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setPriority(task.priority);
    setIsTaskModalVisible(true);
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalVisible(false);
    setSelectedTask(null);
  };
  
  const handleSaveTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    
    if (!projectId) {
      Alert.alert('Error', 'Project ID is missing');
      return;
    }
    
    try {
      if (isCreateMode) {
        // Create new task
        const newTask: Omit<TaskData, 'id' | 'createdAt' | 'updatedAt'> = {
          title: taskTitle,
          description: taskDescription,
          isCompleted: false,
          dueDate: dueDate?.toISOString(),
          priority,
          tags: [],
          attachments: [],
        };
        
        // Get the current tasks from the store
        const { tasks } = useTaskStore.getState();
        
        // Use the tasks-api function to create the task with generated ID
        const taskWithId = createTask(newTask, tasks);
        
        // Add task to the store
        addTask(newTask);
        
        // Add to project
        const projectStore = useProjectStore.getState();
        projectStore.addTaskToProject(projectId, taskWithId.id);
        
        await saveTasks();
        await saveProjects();
      } else if (selectedTask) {
        // Update existing task
        updateTask(selectedTask.id, {
          title: taskTitle,
          description: taskDescription,
          dueDate: dueDate?.toISOString(),
          priority,
        });
        
        await saveTasks();
      }
      
      // Refresh project data
      loadProjectData();
      handleCloseTaskModal();
      
    } catch (error) {
      console.error('Failed to save task:', error);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    }
  };
  
  const handleTaskPress = (task: TaskData) => {
    handleEditTask(task);
  };
  
  const handleToggleComplete = async (taskId: string) => {
    toggleTaskCompletion(taskId);
    await saveTasks();
    loadProjectData();
  };
  
  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (projectId) {
              const projectStore = useProjectStore.getState();
              projectStore.removeTaskFromProject(projectId, taskId);
              deleteTask(taskId);
              
              await saveTasks();
              await saveProjects();
              
              loadProjectData();
            }
          },
        },
      ]
    );
  };
  
  const handleGoBack = () => navigation.goBack();
  
  // Calculate project progress
  const calculateProgress = () => {
    if (!project || project.tasks.length === 0) return 0;
    
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.isCompleted).length;
    return Math.round((completedTasks / totalTasks) * 100);
  };
  
  const projectProgress = calculateProgress();
  const completedTasksCount = project?.tasks.filter(task => task.isCompleted).length || 0;
  const totalTasksCount = project?.tasks.length || 0;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <FeatherIcon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {project?.title || 'Tasks'}
        </Text>
        
        <TouchableOpacity onPress={handleAddTask} style={styles.addButton}>
          <Icon name="add" size={20} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>
      
      {/* Project Info Card */}
      {project && (
        <View style={[styles.projectCard, { backgroundColor: colors.surface.card }]}>
          <View style={styles.projectHeader}>
            <Text style={[styles.projectTitle, { color: colors.text.primary }]}>
              {project.title}
            </Text>
            
            <TouchableOpacity 
              style={[
                styles.statusBadge, 
                { 
                  backgroundColor: project.isCompleted 
                    ? colors.status.success 
                    : colors.brand.primary 
                }
              ]}
              onPress={async () => {
                if (projectId) {
                  updateProject(projectId, { isCompleted: !project.isCompleted });
                  await saveProjects();
                  loadProjectData();
                }
              }}
            >
              <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                {project.isCompleted ? 'Completed' : 'In Progress'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {project.description && (
            <Text 
              style={[styles.projectDescription, { color: colors.text.secondary }]}
              numberOfLines={2}
            >
              {project.description}
            </Text>
          )}
          
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                {completedTasksCount} of {totalTasksCount} tasks completed
              </Text>
              <Text style={[styles.progressPercentage, { color: colors.text.primary }]}>
                {projectProgress}%
              </Text>
            </View>
            
            <View style={[styles.progressBar, { backgroundColor: colors.border.light }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: projectProgress === 100 
                      ? colors.status.success 
                      : colors.brand.primary,
                    width: `${projectProgress}%` 
                  }
                ]} 
              />
            </View>
          </View>
        </View>
      )}
      
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.background.secondary }]}>
        <FeatherIcon name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search tasks..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['All', 'Active', 'Completed'] as FilterTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.filterTab,
              activeFilter === tab && [
                styles.activeFilterTab,
                { backgroundColor: colors.brand.primary }
              ]
            ]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text 
              style={[
                styles.filterTabText,
                { color: colors.text.secondary },
                activeFilter === tab && { color: colors.text.inverse }
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        <FlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.taskList}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => handleTaskPress(item)}
              onToggleComplete={() => handleToggleComplete(item.id)}
              onLongPress={() => handleDeleteTask(item.id)}
            />
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon 
            name="check-circle" 
            size={64} 
            color={colors.text.tertiary} 
          />
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            {searchQuery.trim() 
              ? 'No tasks match your search' 
              : activeFilter === 'Completed'
                ? 'No completed tasks yet'
                : activeFilter === 'Active'
                  ? 'No active tasks'
                  : 'No tasks for this project yet'}
          </Text>
          <TouchableOpacity 
            style={[styles.emptyButton, { backgroundColor: colors.brand.primary }]}
            onPress={handleAddTask}
          >
            <Text style={[styles.emptyButtonText, { color: colors.text.inverse }]}>
              Add Task
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Create/Edit Task Modal */}
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
                {isCreateMode ? 'New Task' : 'Edit Task'}
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
              
              {/* Task Attachments - only shown in edit mode */}
              {!isCreateMode && selectedTask && selectedTask.attachments && (
                <View style={styles.formGroup}>
                  <FileAttachmentsList
                    attachments={selectedTask.attachments}
                    isEditable={false}
                    maxVisible={2}
                  />
                </View>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.brand.primary }]}
              onPress={handleSaveTask}
            >
              <Text style={[styles.saveButtonText, { color: colors.text.inverse }]}>
                {isCreateMode ? 'Create Task' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  projectDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressSection: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  filterTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterTab: {
    backgroundColor: '#7C3AED',
  },
  filterTabText: {
    fontSize: 14,
  },
  taskList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
}); 