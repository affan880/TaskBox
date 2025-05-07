import * as React from 'react';
import { useState, useEffect } from 'react';
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
  GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { useProjectStore } from '@/store/slices/project-slice';
import { ProjectWithTasks } from '@/types/project';
import { Button } from '@/components/ui/button';

type RootStackParamList = {
  TaskList: { projectId: string };
};

type NavigationPropType = NavigationProp<RootStackParamList>;

export function ProjectListScreen() {
  const navigation = useNavigation<NavigationPropType>();
  const { colors, isDark } = useTheme();
  
  // Store access
  const { 
    getAllProjectsWithTasks, 
    addProject, 
    deleteProject, 
    updateProject 
  } = useProjectStore();
  
  // Component state
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Project create form state
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dateError, setDateError] = useState('');
  
  // Load projects on mount
  useEffect(() => {
    refreshProjects();
  }, []);
  
  const refreshProjects = () => {
    const projectsWithTasks = getAllProjectsWithTasks();
    setProjects(projectsWithTasks);
  };
  
  // Filter projects based on search
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handlers
  const handleAddProject = () => setIsModalVisible(true);
  
  const handleCloseModal = () => {
    setIsModalVisible(false);
    // Reset form
    setProjectTitle('');
    setProjectDescription('');
    setStartDate(new Date());
    setEndDate(null);
    setDateError('');
  };
  
  const validateDates = (): boolean => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError('End date cannot be earlier than start date');
      return false;
    }
    setDateError('');
    return true;
  };
  
  const handleCreateProject = async () => {
    if (!projectTitle.trim()) {
      Alert.alert('Error', 'Project title is required');
      return;
    }
    
    if (!validateDates()) {
      return;
    }
    
    try {
      // Create the project
      const newProject = addProject({
        title: projectTitle,
        description: projectDescription,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      });
      
      // Refresh projects list
      refreshProjects();
      
      handleCloseModal();
      
      // Navigate to the task list screen with the new project ID
      navigation.navigate('TaskList', { projectId: newProject.id });
    } catch (error) {
      console.error('Failed to create project:', error);
      Alert.alert('Error', 'Failed to create project. Please try again.');
    }
  };
  
  const handleDeleteProject = (projectId: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? All associated tasks will be removed from this project.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              deleteProject(projectId);
              refreshProjects();
            } catch (error) {
              console.error('Failed to delete project:', error);
              Alert.alert('Error', 'Failed to delete project. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleComplete = async (projectId: string, currentStatus: boolean, e?: GestureResponderEvent) => {
    try {
      // Prevent event propagation
      e?.stopPropagation();
      
      // Update project completion status
      await updateProject(projectId, { isCompleted: !currentStatus });
      
      // Refresh the projects list to update UI
      refreshProjects();
    } catch (error) {
      console.error('Failed to update project status:', error);
      Alert.alert('Error', 'Failed to update project status. Please try again.');
    }
  };
  
  const handleNavigateToTaskList = (projectId: string) => {
    navigation.navigate('TaskList', { projectId });
  };
  
  const renderProjectItem = ({ item }: { item: ProjectWithTasks }) => {
    const completedTasks = item.tasks.filter(task => task.isCompleted).length;
    const totalTasks = item.tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return (
      <TouchableOpacity 
        style={[styles.projectItem, { backgroundColor: colors.surface.primary }]}
        onPress={() => handleNavigateToTaskList(item.id)}
      >
        <View style={styles.projectHeader}>
          <Text style={[styles.projectTitle, { color: colors.text.primary }]}>{item.title}</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteProject(item.id)}
          >
            <FeatherIcon name="trash-2" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {item.description ? (
          <Text style={[styles.projectDescription, { color: colors.text.secondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        
        <View style={styles.projectMeta}>
          {item.startDate && (
            <View style={styles.projectMetaItem}>
              <FeatherIcon name="calendar" size={12} color={colors.text.secondary} />
              <Text style={[styles.projectMetaText, { color: colors.text.secondary }]}>
                Start: {new Date(item.startDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {item.endDate && (
            <View style={styles.projectMetaItem}>
              <FeatherIcon name="calendar" size={12} color={colors.text.secondary} />
              <Text style={[styles.projectMetaText, { color: colors.text.secondary }]}>
                Due: {new Date(item.endDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: colors.text.secondary }]}>
              Progress: {completedTasks}/{totalTasks} tasks
            </Text>
            <Text style={[styles.progressPercentage, { color: colors.text.secondary }]}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.surface.secondary }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress}%`,
                  backgroundColor: item.isCompleted ? colors.status.success : colors.brand.primary
                }
              ]} 
            />
          </View>
        </View>

        <View style={[styles.projectFooter, { borderTopColor: colors.border.light }]}>
          <TouchableOpacity 
            style={[
              styles.checkbox,
              { borderColor: colors.border.medium },
              item.isCompleted && [styles.checkboxChecked, { backgroundColor: colors.brand.primary }]
            ]}
            onPress={(e) => handleToggleComplete(item.id, item.isCompleted, e)}
            activeOpacity={0.7}
          >
            {item.isCompleted && <FeatherIcon name="check" size={12} color={colors.text.inverse} />}
          </TouchableOpacity>
          <Text style={[styles.checkboxLabel, { color: colors.text.secondary }]}>
            {item.isCompleted ? 'Completed' : 'Mark as complete'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Projects</Text>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface.secondary }]}>
          <FeatherIcon name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search projects"
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Project List */}
        {filteredProjects.length > 0 ? (
          <FlatList
            style={styles.projectList}
            data={filteredProjects}
            keyExtractor={(item) => item.id}
            renderItem={renderProjectItem}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyList}>
            <FeatherIcon name="folder" size={48} color={colors.text.secondary} />
            <Text style={[styles.emptyListText, { color: colors.text.secondary }]}>
              No projects found. Create your first project!
            </Text>
          </View>
        )}
      </View>

      {/* Add Project FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.brand.primary }]} 
        onPress={handleAddProject}
      >
        <Icon name="add" size={28} color={colors.text.inverse} />
      </TouchableOpacity>

      {/* Create Project Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border.light }]}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Create Project</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>Title</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { 
                      backgroundColor: colors.surface.secondary,
                      color: colors.text.primary,
                      borderColor: colors.border.light
                    }
                  ]}
                  placeholder="Project title"
                  placeholderTextColor={colors.text.secondary}
                  value={projectTitle}
                  onChangeText={setProjectTitle}
                />
              </View>

              {/* Description */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>Description (optional)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.textArea,
                    { 
                      backgroundColor: colors.surface.secondary,
                      color: colors.text.primary,
                      borderColor: colors.border.light
                    }
                  ]}
                  placeholder="Project description..."
                  placeholderTextColor={colors.text.secondary}
                  value={projectDescription}
                  onChangeText={setProjectDescription}
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              {/* Start Date */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>Start Date</Text>
                <DatePickerInput
                  label="Start Date"
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    if (endDate) validateDates();
                  }}
                />
              </View>

              {/* End Date */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>End Date (optional)</Text>
                <DatePickerInput
                  label="End Date"
                  value={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    if (date && startDate) validateDates();
                  }}
                />
                {dateError ? (
                  <Text style={[styles.dateError, { color: colors.status.error }]}>{dateError}</Text>
                ) : null}
              </View>

              {/* Create Button */}
              <Button
                variant="primary"
                onPress={handleCreateProject}
                style={styles.createButton}
              >
                Create Project
              </Button>
            </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  projectList: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyListText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  projectItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  projectDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  projectMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  projectMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  projectMetaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
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
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderWidth: 1.5,
  },
  checkboxLabel: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateError: {
    fontSize: 12,
    marginTop: 4,
  },
  createButton: {
    marginTop: 16,
  },
}); 