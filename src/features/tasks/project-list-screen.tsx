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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../theme/theme-context';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { useProjectStore } from '@/store/project-store';
import { ProjectWithTasks } from '@/types/project';

export function ProjectListScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  
  // Store access
  const { 
    getAllProjectsWithTasks, 
    addProject, 
    deleteProject, 
    loadProjects, 
    saveProjects 
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
    loadProjectData();
  }, []);
  
  const loadProjectData = async () => {
    await loadProjects();
    refreshProjects();
  };
  
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
    
    // Create the project
    const projectId = addProject({
      title: projectTitle,
      description: projectDescription,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      isCompleted: false,
    });
    
    // Save to storage
    await saveProjects();
    
    // Refresh projects list
    refreshProjects();
    
    handleCloseModal();
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
            deleteProject(projectId);
            await saveProjects();
            refreshProjects();
          },
        },
      ]
    );
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
        style={styles.projectItem}
        onPress={() => handleNavigateToTaskList(item.id)}
      >
        <View style={styles.projectHeader}>
          <Text style={styles.projectTitle}>{item.title}</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteProject(item.id)}
          >
            <FeatherIcon name="trash-2" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {item.description ? (
          <Text style={styles.projectDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        
        <View style={styles.projectMeta}>
          {item.startDate && (
            <View style={styles.projectMetaItem}>
              <FeatherIcon name="calendar" size={12} color={colors.text.secondary} />
              <Text style={styles.projectMetaText}>
                Start: {new Date(item.startDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {item.endDate && (
            <View style={styles.projectMetaItem}>
              <FeatherIcon name="calendar" size={12} color={colors.text.secondary} />
              <Text style={styles.projectMetaText}>
                Due: {new Date(item.endDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              Progress: {completedTasks}/{totalTasks} tasks
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` },
                item.isCompleted && styles.progressCompleted
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Define styles
  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: colors.background.primary 
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.background.secondary : '#F3F4F6',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text.primary,
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
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: 8,
    },
    projectItem: {
      backgroundColor: isDark ? colors.background.secondary : '#FFFFFF',
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
      color: colors.text.primary,
      flex: 1,
    },
    projectDescription: {
      fontSize: 14,
      color: colors.text.secondary,
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
      color: colors.text.secondary,
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
      color: colors.text.secondary,
    },
    progressPercentage: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.text.secondary,
    },
    progressBar: {
      height: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.brand.primary,
      borderRadius: 3,
    },
    progressCompleted: {
      backgroundColor: '#10B981',
    },
    deleteButton: {
      padding: 4,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      backgroundColor: colors.brand.primary,
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
    // Modal styles
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.background.primary,
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
      borderBottomColor: colors.border.light,
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
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
      color: colors.text.primary,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border.medium,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text.primary,
      backgroundColor: colors.background.secondary,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    dateError: {
      color: '#EF4444',
      fontSize: 12,
      marginTop: 4,
    },
    createButton: {
      backgroundColor: colors.brand.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    createButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FeatherIcon name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
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
            <Text style={styles.emptyListText}>
              No projects found. Create your first project!
            </Text>
          </View>
        )}
      </View>

      {/* Add Project FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddProject}>
        <Icon name="add" size={28} color="#FFFFFF" />
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
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Project</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Project title"
                  placeholderTextColor={colors.text.secondary}
                  value={projectTitle}
                  onChangeText={setProjectTitle}
                />
              </View>

              {/* Description */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description (optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
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
                <Text style={styles.formLabel}>Start Date</Text>
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
                <Text style={styles.formLabel}>End Date (optional)</Text>
                <DatePickerInput
                  label="End Date"
                  value={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    if (date && startDate) validateDates();
                  }}
                />
                {dateError ? <Text style={styles.dateError}>{dateError}</Text> : null}
              </View>

              {/* Create Button */}
              <TouchableOpacity style={styles.createButton} onPress={handleCreateProject}>
                <Text style={styles.createButtonText}>Create Project</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
} 