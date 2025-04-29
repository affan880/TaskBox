import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { useProjectStore } from '@/store/project-store';
import { useTaskStore } from '@/store/task-store';
import { ProjectWithTasks } from '@/types/project';
import { TaskData, TaskPriority, TaskStatus, TaskFilter } from '@/types/task';
import { TaskCard } from '@/components/task-card';
import { FileAttachmentsList } from '@/components/file-attachments-list';
import { Button } from '@/components/ui/button';

type TaskListScreenParams = {
  projectId: string;
};

type RootStackParamList = {
  TaskList: { projectId: string };
  TaskCreation: undefined;
  TaskDetail: { taskId: string };
};

type NavigationPropType = NavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, 'TaskList'>;

export function TaskListScreen() {
  const navigation = useNavigation<NavigationPropType>();
  const route = useRoute<RoutePropType>();
  const { colors, isDark } = useTheme();
  const { getProjectWithTasks } = useProjectStore();
  const { addTask, updateTask, deleteTask, toggleTaskCompletion, getTasks, tasks: storeTasks } = useTaskStore();
  
  const [project, setProject] = useState<ProjectWithTasks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [filters, setFilters] = useState<TaskFilter>({
    showCompleted: false,
    priority: undefined,
    searchQuery: '',
    tags: [],
  });

  // Load project data and tasks
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load tasks first
        const tasks = await getTasks();
        console.log('Loaded tasks:', tasks);
        
        // Then load project data
        const projectData = await getProjectWithTasks(route.params.projectId);
        console.log('Loaded project:', projectData);
        
        if (projectData) {
          setProject(projectData);
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [route.params.projectId, getProjectWithTasks, getTasks]);

  // Calculate task counts by priority
  const taskCounts = useMemo(() => {
    if (!storeTasks) return { all: 0, low: 0, medium: 0, high: 0 };

    // First filter by project
    const projectTasks = storeTasks.filter(task => task.projectId === project?.id);
    
    // Then filter by completion status if needed
    const filteredTasks = projectTasks.filter(task => 
      filters.showCompleted ? true : !task.isCompleted
    );

    return {
      all: filteredTasks.length,
      low: filteredTasks.filter(task => task.priority === 'low').length,
      medium: filteredTasks.filter(task => task.priority === 'medium').length,
      high: filteredTasks.filter(task => task.priority === 'high').length,
    };
  }, [storeTasks, project?.id, filters.showCompleted]);

  const handleAddTask = () => {
    setSelectedTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setDueDate(null);
    setPriority('medium');
    setStatus('todo');
    setEstimatedTime('');
    setProgress(0);
    setNotes('');
    setTags([]);
    setCurrentTag('');
    setIsTaskModalVisible(true);
  };

  const handleEditTask = (task: TaskData) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setPriority(task.priority);
    setStatus(task.status);
    setEstimatedTime(task.estimatedTime?.toString() || '');
    setProgress(task.progress || 0);
    setNotes(task.notes || '');
    setTags(task.tags || []);
    setCurrentTag('');
    setIsTaskModalVisible(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalVisible(false);
    setSelectedTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setDueDate(null);
    setPriority('medium');
    setStatus('todo');
    setEstimatedTime('');
    setProgress(0);
    setNotes('');
    setTags([]);
    setCurrentTag('');
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSaveTask = async () => {
    if (!project?.id) {
      Alert.alert('Error', 'No project selected');
      return;
    }

    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    try {
      if (selectedTask) {
        // Update existing task
        const updatedTask: TaskData = {
          ...selectedTask,
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
          dueDate: dueDate?.toISOString(),
          priority,
          status,
          estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
          progress,
          notes: notes.trim() || undefined,
          tags,
          updatedAt: new Date().toISOString(),
        };
        
        console.log('Updating task:', updatedTask);
        updateTask(selectedTask.id, updatedTask);
      } else {
        // Create new task
        const newTask: TaskData = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          projectId: project.id,
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
          isCompleted: false,
          status,
          dueDate: dueDate?.toISOString(),
          priority,
          tags,
          attachments: [],
          estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
          progress,
          notes: notes.trim() || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log('Creating new task:', newTask);
        addTask(newTask);
      }
      
      // Refresh project data and tasks
      const updatedProject = await getProjectWithTasks(project.id);
      const updatedTasks = await getTasks();
      console.log('Updated tasks:', updatedTasks);
      
      if (updatedProject) {
        setProject(updatedProject);
      }
      
      handleCloseTaskModal();
    } catch (error) {
      console.error('Failed to save task:', error);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      deleteTask(taskId);
      const updatedProject = await getProjectWithTasks(project!.id);
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      Alert.alert('Error', 'Failed to delete task. Please try again.');
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      toggleTaskCompletion(taskId);
      const updatedProject = await getProjectWithTasks(project!.id);
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  };

  // Filter tasks based on project and filters
  const filteredTasks = useMemo(() => {
    if (!storeTasks) return [];

    // First filter by project
    const projectTasks = storeTasks.filter(task => task.projectId === project?.id);

    return projectTasks.filter(task => {
      // Filter by completion status
      if (!filters.showCompleted && task.isCompleted) return false;

      // Filter by priority
      if (filters.priority && task.priority !== filters.priority) return false;

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query) || false;
        const matchesTags = (task.tags || []).some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDescription && !matchesTags) return false;
      }

      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        if (!(task.tags || []).some(tag => filters.tags!.includes(tag))) return false;
      }

      return true;
    });
  }, [storeTasks, project?.id, filters]);

  const renderTaskItem = ({ item }: { item: TaskData }) => (
    <TaskCard
      task={item}
      onPress={() => handleEditTask(item)}
      onDelete={() => handleDeleteTask(item.id)}
      onToggleComplete={() => handleToggleComplete(item.id)}
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.errorText, { color: colors.text.primary }]}>{error}</Text>
        <Button
          variant="primary"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {project?.title || 'Tasks'}
        </Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.brand.primary }]} 
          onPress={handleAddTask}
        >
          <Icon name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.filterContainer}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface.primary }]}>
          <Icon name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search tasks..."
            placeholderTextColor={colors.text.secondary}
            value={filters.searchQuery}
            onChangeText={(text) => setFilters(prev => ({ ...prev, searchQuery: text }))}
          />
        </View>

        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              { backgroundColor: colors.surface.primary },
              !filters.showCompleted && { backgroundColor: colors.brand.primary }
            ]}
            onPress={() => setFilters(prev => ({ ...prev, showCompleted: false }))}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: !filters.showCompleted ? colors.text.inverse : colors.text.primary }
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              { backgroundColor: colors.surface.primary },
              filters.showCompleted && { backgroundColor: colors.brand.primary }
            ]}
            onPress={() => setFilters(prev => ({ ...prev, showCompleted: true }))}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filters.showCompleted ? colors.text.inverse : colors.text.primary }
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Priority Filters with Modern Design */}
        <View style={styles.priorityFiltersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.priorityFiltersScroll}
          >
            <TouchableOpacity
              style={[
                styles.priorityFilter,
                { backgroundColor: colors.surface.primary },
                !filters.priority && { backgroundColor: colors.brand.primary }
              ]}
              onPress={() => setFilters(prev => ({ ...prev, priority: undefined }))}
            >
              <View style={styles.priorityFilterContent}>
                <Text
                  style={[
                    styles.priorityFilterText,
                    { color: !filters.priority ? colors.text.inverse : colors.text.primary }
                  ]}
                >
                  All Tasks
                </Text>
                <View style={[
                  styles.priorityCount,
                  { backgroundColor: !filters.priority ? colors.text.inverse : colors.brand.primary }
                ]}>
                  <Text style={[
                    styles.priorityCountText,
                    { color: !filters.priority ? colors.brand.primary : colors.text.inverse }
                  ]}>
                    {taskCounts.all}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityFilter,
                  { backgroundColor: colors.surface.primary },
                  filters.priority === p && { backgroundColor: colors.brand.primary }
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  priority: prev.priority === p ? undefined : p 
                }))}
              >
                <View style={styles.priorityFilterContent}>
                  <Text
                    style={[
                      styles.priorityFilterText,
                      { color: filters.priority === p ? colors.text.inverse : colors.text.primary }
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                  <View style={[
                    styles.priorityCount,
                    { backgroundColor: filters.priority === p ? colors.text.inverse : colors.brand.primary }
                  ]}>
                    <Text style={[
                      styles.priorityCountText,
                      { color: filters.priority === p ? colors.brand.primary : colors.text.inverse }
                    ]}>
                      {taskCounts[p]}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
          
      {/* Task List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.taskList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No tasks found
            </Text>
          </View>
        )}
      />

      {/* Task Modal */}
      <Modal
        visible={isTaskModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseTaskModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border.light }]}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {selectedTask ? 'Edit Task' : 'Create Task'}
              </Text>
              <TouchableOpacity onPress={handleCloseTaskModal}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Title Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Title</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.surface.primary,
                      color: colors.text.primary,
                      borderColor: colors.border.medium
                    }
                  ]}
                  placeholder="Enter task title"
                  placeholderTextColor={colors.text.secondary}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  autoFocus
                />
              </View>

              {/* Description Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Description</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { 
                      backgroundColor: colors.surface.primary,
                      color: colors.text.primary,
                      borderColor: colors.border.medium
                    }
                  ]}
                  placeholder="Enter task description (optional)"
                  placeholderTextColor={colors.text.secondary}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Status Selection */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Status</Text>
                <View style={styles.statusContainer}>
                  {(['todo', 'in-progress', 'completed'] as TaskStatus[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusButton,
                        { 
                          backgroundColor: colors.surface.primary,
                          borderColor: colors.border.medium,
                          borderWidth: status === s ? 2 : 1
                        }
                      ]}
                      onPress={() => setStatus(s)}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { 
                            color: status === s ? colors.brand.primary : colors.text.secondary
                          }
                        ]}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Due Date Picker */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Due Date</Text>
                <DatePickerInput
                  label="Select due date"
                  value={dueDate}
                  onChange={setDueDate}
                  minimumDate={new Date()}
                />
              </View>

              {/* Priority Selection */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Priority</Text>
                <View style={styles.priorityContainer}>
                  {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        { 
                          backgroundColor: colors.surface.primary,
                          borderColor: colors.border.medium,
                          borderWidth: priority === p ? 2 : 1
                        }
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          { 
                            color: priority === p ? colors.brand.primary : colors.text.secondary
                          }
                        ]}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Estimated Time */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Estimated Time (minutes)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.surface.primary,
                      color: colors.text.primary,
                      borderColor: colors.border.medium
                    }
                  ]}
                  placeholder="Enter estimated time"
                  placeholderTextColor={colors.text.secondary}
                  value={estimatedTime}
                  onChangeText={setEstimatedTime}
                  keyboardType="numeric"
                />
              </View>

              {/* Progress */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Progress ({progress}%)</Text>
                <View style={[styles.progressBar, { backgroundColor: colors.surface.secondary }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${progress}%`,
                        backgroundColor: colors.brand.primary
                      }
                    ]} 
                  />
                </View>
                <View style={styles.progressButtons}>
                  {[0, 25, 50, 75, 100].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.progressButton,
                        { 
                          backgroundColor: colors.surface.primary,
                          borderColor: colors.border.medium,
                          borderWidth: progress === value ? 2 : 1
                        }
                      ]}
                      onPress={() => setProgress(value)}
                    >
                      <Text
                        style={[
                          styles.progressButtonText,
                          { 
                            color: progress === value ? colors.brand.primary : colors.text.secondary
                          }
                        ]}
                      >
                        {value}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Notes</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { 
                      backgroundColor: colors.surface.primary,
                      color: colors.text.primary,
                      borderColor: colors.border.medium
                    }
                  ]}
                  placeholder="Add notes (optional)"
                  placeholderTextColor={colors.text.secondary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Tags */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Tags</Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={[
                      styles.tagInput,
                      { 
                        backgroundColor: colors.surface.primary,
                        color: colors.text.primary,
                        borderColor: colors.border.medium
                      }
                    ]}
                    placeholder="Add a tag"
                    placeholderTextColor={colors.text.secondary}
                    value={currentTag}
                    onChangeText={setCurrentTag}
                    onSubmitEditing={handleAddTag}
                  />
                  <TouchableOpacity
                    style={[styles.addTagButton, { backgroundColor: colors.brand.primary }]}
                    onPress={handleAddTag}
                  >
                    <Icon name="add" size={20} color={colors.text.inverse} />
                  </TouchableOpacity>
                </View>
                <View style={styles.tagsContainer}>
                  {tags.map((tag) => (
                    <View
                      key={tag}
                      style={[styles.tag, { backgroundColor: colors.brand.primary }]}
                    >
                      <Text style={[styles.tagText, { color: colors.text.inverse }]}>{tag}</Text>
                      <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                        <Icon name="close" size={16} color={colors.text.inverse} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Save Button */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border.light }]}>
              <Button
                variant="primary"
                onPress={handleSaveTask}
                style={styles.saveButton}
              >
                {selectedTask ? 'Update Task' : 'Create Task'}
              </Button>
            </View>
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
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
  },
  filterContainer: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityFiltersContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  priorityFiltersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  priorityFilter: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 120,
  },
  priorityFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskList: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorButton: {
    width: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  progressButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    width: '100%',
  },
}); 