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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
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

type TaskListScreenParams = {
  projectId: string;
};

type FilterTab = 'all' | 'active' | 'completed';

type TaskCardProps = {
  task: TaskData;
  onPress: (task: TaskData) => void;
  onLongPress: (task: TaskData) => void;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  isSelected: boolean;
};

type DatePickerProps = {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function TaskListScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: TaskListScreenParams }, 'params'>>();
  const { projectId } = route.params;
  const { colors, isDark } = useTheme();
  const { getProject, getProjectWithTasks } = useProjectStore();
  const { getTasksByProject, addTask, updateTask, deleteTask, toggleTaskCompletion } = useTaskStore();

  const [project, setProject] = useState<ProjectWithTasks | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      
      try {
        const loadedProject = await getProjectWithTasks(projectId);
        if (loadedProject) {
          setProject(loadedProject);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        Alert.alert('Error', 'Failed to load project');
      }
    };

    loadProject();
  }, [projectId]);

  const filteredTasks = useMemo(() => {
    if (!project?.tasks) return [];

    let filtered = [...project.tasks];

    if (searchQuery) {
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter === 'active') {
      filtered = filtered.filter(task => !task.completedAt);
    } else if (activeFilter === 'completed') {
      filtered = filtered.filter(task => task.completedAt);
    }

    return filtered;
  }, [project?.tasks, searchQuery, activeFilter]);

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
      if (selectedTask) {
        // Update existing task
        updateTask(selectedTask.id, {
          title: taskTitle,
          description: taskDescription,
          dueDate: dueDate?.toISOString(),
          priority,
        });
        
        if (project) {
          getTasksByProject(projectId, project.tasks.map(t => t.id));
        }
      } else {
        // Create new task
        const newTask: TaskData = {
          id: Date.now().toString(),
          title: taskTitle,
          description: taskDescription,
          isCompleted: false,
          dueDate: dueDate?.toISOString(),
          priority,
          tags: [],
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectId: ''
        };
        
        // Add task to the store
        addTask(newTask);
        
        // Add to project
        const projectStore = useProjectStore.getState();
        projectStore.addTaskToProject(projectId, newTask.id);
      }
      
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
    if (project) {
      await getTasksByProject(projectId, project.tasks.map(t => t.id));
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if (!project?.id) {
      Alert.alert('Error', 'No project selected');
      return;
    }

    try {
      await deleteTask(taskId);
      const updatedProject = await getProjectWithTasks(project.id);
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  };
  
  const handleGoBack = () => navigation.goBack();
  
  const handleAddTask = async () => {
    if (!project?.id) {
      Alert.alert('Error', 'No project selected');
      return;
    }

    const newTask: TaskData = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId: project.id,
      title: taskTitle,
      description: taskDescription || '',
      isCompleted: false,
      dueDate: dueDate?.toISOString(),
      priority: priority as TaskPriority,
      tags: [],
      attachments: attachments ? [...attachments] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await addTask(newTask);
      const updatedProject = await getProjectWithTasks(project.id);
      if (updatedProject) {
        setProject(updatedProject);
      }
      handleCloseTaskModal();
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };
  
  const handleUpdateTask = async () => {
    if (!project || !selectedTask?.id) {
      Alert.alert('Error', 'No project or task selected');
      return;
    }

    const updatedTask: TaskData = {
      ...selectedTask,
      projectId: project.id,
      title: taskTitle,
      description: taskDescription || '',
      dueDate: dueDate?.toISOString(),
      priority: (priority || selectedTask.priority) as TaskPriority,
      tags: selectedTask.tags || [],
      attachments: attachments ? [...attachments] : selectedTask.attachments || [],
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateTask(updatedTask.id, updatedTask);
      const updatedProject = await getProjectWithTasks(project.id);
      if (updatedProject) {
        setProject(updatedProject);
      }
      setIsTaskModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };
  
  const handleEditTask = (task: TaskData) => {
    setIsTaskModalVisible(true);
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setPriority(task.priority);
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalVisible(false);
    setTaskTitle('');
    setTaskDescription('');
    setDueDate(null);
    setPriority('medium');
    setSelectedTask(null);
  };
  
  const resetForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setDueDate(null);
    setPriority('medium');
    setSelectedTask(null);
    setAttachments([]);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {project?.title || 'Tasks'}
        </Text>
        <TouchableOpacity onPress={() => setIsTaskModalVisible(true)} style={styles.addButton}>
          <Icon name="add" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface.primary }]}>
        <Icon name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search tasks..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'active', 'completed'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && { backgroundColor: colors.brand.primary }
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                { color: activeFilter === filter ? colors.text.inverse : colors.text.primary }
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => handleTaskPress(item)}
            onLongPress={() => handleEditTask(item)}
            onToggleComplete={() => handleToggleComplete(item.id)}
            onDelete={() => handleDeleteTask(item.id)}
            isSelected={item.id === selectedTask?.id}
          />
        )}
        contentContainerStyle={styles.taskList}
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
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {selectedTask ? 'Edit Task' : 'Create Task'}
              </Text>
              <TouchableOpacity onPress={handleCloseTaskModal}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <TextInput
                style={[styles.input, { color: colors.text.primary, borderColor: colors.border.medium }]}
                placeholder="Task title"
                placeholderTextColor={colors.text.secondary}
                value={taskTitle}
                onChangeText={setTaskTitle}
              />
              
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text.primary, borderColor: colors.border.medium }]}
                placeholder="Description (optional)"
                placeholderTextColor={colors.text.secondary}
                value={taskDescription}
                onChangeText={setTaskDescription}
                multiline
                numberOfLines={4}
              />
              
              <DatePickerInput
                label="Due Date"
                value={dueDate}
                onChange={setDueDate}
                minimumDate={new Date()}
              />
              
              <View style={styles.priorityContainer}>
                <Text style={[styles.priorityLabel, { color: colors.text.primary }]}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        priority === p && { backgroundColor: colors.brand.primary }
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          { color: priority === p ? colors.text.inverse : colors.text.primary }
                        ]}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.brand.primary }]}
                onPress={handleUpdateTask}
              >
                <Text style={[styles.saveButtonText, { color: colors.text.inverse }]}>
                  {selectedTask ? 'Save' : 'Create'}
                </Text>
              </TouchableOpacity>
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskList: {
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePicker: {
    marginBottom: 16,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 