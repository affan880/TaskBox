import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  FlatList,
  Dimensions,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { useProjectStore } from '@/store/slices/project-slice'; 
import { ProjectCreateInput, ProjectWithTasks } from '@/types/project';
import { Button } from '@/components/ui/button';

type RootStackParamList = {
  TaskList: { projectId: string };
};

type NavigationPropType = NavigationProp<RootStackParamList>;

type FilterTab = 'Projects' | 'Completed' | 'Flag';


const NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Update ProjectWithTasks type to include all required properties
type ExtendedProjectWithTasks = ProjectWithTasks & {
  startDate?: string;
  endDate?: string;
  labelColor?: string;
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  contentContainer: { 
    flex: 1, 
    paddingHorizontal: 16 
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    transform: [{ rotate: '-1deg' }],
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 3,
    transform: [{ rotate: '2deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 12,
    transform: [{ rotate: '1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 6,
  },
  searchIcon: { 
    marginRight: 12 
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 3,
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  activeTabButton: {
    transform: [{ rotate: '1deg' }],
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 3,
    padding: 20,
    marginBottom: 20,
    width: (SCREEN_WIDTH - 16 * 3) / NUM_COLUMNS,
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 8,
    minHeight: 200,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardMenuButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '2deg' }],
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardMetadataContainer: {
    flex: 1,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 3,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 3,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '2deg' }],
  },
  checkboxChecked: {
    borderWidth: 3,
    transform: [{ rotate: '-2deg' }],
  },
  checkboxLabel: {
    fontSize: 12,
  },
  flagOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  flagButtonText: {
    fontWeight: 'bold',
    marginLeft: 8,
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
    maxHeight: '90%',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScrollView: {
    // Add styles if needed
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
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateWrapper: {
    width: '48%',
    position: 'relative',
  },
  clearDateButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    zIndex: 1,
    borderRadius: 12,
    padding: 2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  labelsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  labelItem: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  labelItemSelected: {
    borderWidth: 2,
  },
  addLabelButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  createButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
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
    marginBottom: 24,
  },
  createEmptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});

export function ProjectDetailScreen() {
  const navigation = useNavigation<NavigationPropType>();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Projects');
  const [flaggedItems, setFlaggedItems] = useState<Record<string, boolean>>({});
  
  // Project store
  const { addProject, deleteProject, getAllProjectsWithTasks, updateProject } = useProjectStore();
  const [localProjects, setLocalProjects] = useState<ExtendedProjectWithTasks[]>([]);

  
  // Load projects on mount
  useEffect(() => {
    const initializeProjects = async () => {
      const projectsWithTasks = getAllProjectsWithTasks();
      console.log('projectsWithTasks', projectsWithTasks);
      setLocalProjects(projectsWithTasks);
    };
    
    initializeProjects();
  }, [getAllProjectsWithTasks]);

  // --- Modal State ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);

  // Dummy labels - should be moved to a constants file
  const availableLabels = [
    { id: 'l1', color: colors.status.error },
    { id: 'l2', color: colors.status.warning },
    { id: 'l3', color: colors.status.success },
    { id: 'l4', color: colors.status.info },
  ];

  const handleGoBack = () => navigation.goBack();
  const handleAddItem = () => setIsModalVisible(true);
  const handleCloseModal = () => {
    setIsModalVisible(false);
    // Reset form state
    setProjectName('');
    setDescription('');
    setStartDate(new Date());
    setEndDate(new Date());
    setSelectedLabels([]);
    setDateError(null);
  };

  const handleSetStartDate = (date: Date | null): void => {
    setStartDate(date);
    // Validate end date if it exists
    if (date && endDate && date > endDate) {
      setDateError('Start date cannot be after end date');
    } else {
      setDateError(null);
    }
  };

  const handleSetEndDate = (date: Date | null): void => {
    setEndDate(date);
    // Validate against start date
    if (date && startDate && date < startDate) {
      setDateError('End date cannot be before start date');
    } else {
      setDateError(null);
    }
  };

  const handleClearDate = (type: 'start' | 'end'): void => {
    if (type === 'start') {
      setStartDate(null);
    } else {
      setEndDate(null);
    }
    setDateError(null);
  };

  const handleCreateProject = async () => {
    // Validate required fields
    if (!projectName.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }

    // Validate dates
    if (startDate && endDate && startDate > endDate) {
      setDateError('Start date cannot be after end date');
      return;
    }

    // Create project input data
    const projectInput: ProjectCreateInput = {
      title: projectName.trim(),
      description: description.trim(),
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    };
    
    try {
      // Add project to store
      const newProject = addProject({
        ...projectInput,
        id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isCompleted: false,
        taskIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Refresh local projects list
      const projectsWithTasks = getAllProjectsWithTasks();
      setLocalProjects(projectsWithTasks);
      
      // Close modal
      handleCloseModal();

      // Navigate to the task list screen with the new project ID
      navigation.navigate('TaskList', { projectId: newProject.id });
      
      // Show success message
      Alert.alert(
        'Success',
        'Project created successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to create project:', error);
      Alert.alert(
        'Error',
        'Failed to create project. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeleteProject = (projectId: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
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
              const projectsWithTasks = getAllProjectsWithTasks();
              setLocalProjects(projectsWithTasks);
            } catch (error) {
              console.error('Failed to delete project:', error);
              Alert.alert('Error', 'Failed to delete project. Please try again.');
            }
          },
        },
      ]
    );
  };

  // --- Toggle Label Selection ---
  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId) 
        : [...prev, labelId]
    );
  };

  const toggleFlag = (taskId: string) => {
    setFlaggedItems(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleToggleComplete = async (projectId: string, currentStatus: boolean, e?: GestureResponderEvent) => {
    try {
      // Prevent event propagation
      e?.stopPropagation();
      
      // Update project completion status
      await updateProject(projectId, { isCompleted: !currentStatus });
      
      // Refresh local projects list
      const projectsWithTasks = getAllProjectsWithTasks();
      setLocalProjects(projectsWithTasks);
    } catch (error) {
      console.error('Failed to update project status:', error);
      Alert.alert('Error', 'Failed to update project status. Please try again.');
    }
  };

  // Filter projects based on the active filter and search query
  const getFilteredProjects = () => {
    if (localProjects.length === 0) return [];
    
    let filtered = localProjects;
    
    // Apply filters
    if (activeFilter === 'Completed') {
      filtered = filtered.filter(project => project.isCompleted);
    } else if (activeFilter === 'Flag') {
      filtered = filtered.filter(project => flaggedItems[project.id]);
    }
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };
  
  const filteredProjects = getFilteredProjects();

  const renderTaskCard = ({ item }: { item: ExtendedProjectWithTasks }) => {
    const isFlagged = activeFilter === 'Flag' && flaggedItems[item.id];
    const hasDueDate = !!item.endDate;
    const formattedStartDate = item.startDate 
      ? new Date(item.startDate).toLocaleDateString() 
      : 'Not set';
    const formattedEndDate = item.endDate
      ? new Date(item.endDate).toLocaleDateString()
      : 'Not set';
    const totalTasks = item.tasks.length;
    const completedTasks = item.tasks.filter(task => task.isCompleted).length;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
      <TouchableOpacity 
        style={[
          styles.card, 
          { backgroundColor: colors.surface.primary },
          item.labelColor ? { borderLeftColor: item.labelColor, borderLeftWidth: 4 } : null
        ]}
        onPress={() => navigation.navigate('TaskList', { projectId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconContainer, { backgroundColor: colors.surface.secondary }]}>
            <MaterialIcons name="folder" size={18} color={colors.text.primary} />
          </View>
          <TouchableOpacity 
            style={styles.cardMenuButton}
            onPress={() => handleDeleteProject(item.id)}
          >
            <MaterialIcons name="more-vert" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>{item.title}</Text>
        
        {item.description ? (
          <Text style={[styles.cardDescription, { color: colors.text.secondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        
        <View style={styles.cardMetadataContainer}>
          {item.startDate && (
            <View style={styles.cardRow}>
              <MaterialIcons name="event" size={14} color={colors.text.secondary} />
              <Text style={[styles.cardLabel, { color: colors.text.secondary }]}>
                Start: {formattedStartDate}
              </Text>
            </View>
          )}
          
          {item.endDate && (
            <View style={styles.cardRow}>
              <MaterialIcons name="event" size={14} color={colors.text.secondary} />
              <Text style={[styles.cardLabel, { color: colors.text.secondary }]}>
                Due: {formattedEndDate}
              </Text>
            </View>
          )}
          
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                {totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks` : 'No tasks yet'}
              </Text>
              {totalTasks > 0 && (
                <Text style={[styles.progressPercentage, { color: colors.text.secondary }]}>
                  {Math.round(progressPercentage)}%
                </Text>
              )}
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.surface.secondary }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: item.isCompleted ? colors.status.success : colors.brand.primary
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border.light }]}>
          <TouchableOpacity 
            style={[
              styles.checkbox,
              { borderColor: colors.border.medium },
              item.isCompleted && [styles.checkboxChecked, { backgroundColor: colors.brand.primary }]
            ]}
            onPress={(e) => handleToggleComplete(item.id, item.isCompleted, e)}
            activeOpacity={0.7}
          >
            {item.isCompleted && <MaterialIcons name="check" size={12} color={colors.text.inverse} />}
          </TouchableOpacity>
          <Text style={[styles.checkboxLabel, { color: colors.text.secondary }]}>
            {item.isCompleted ? 'Completed' : 'Mark as complete'}
          </Text>
        </View>

        {isFlagged && (
          <View style={[styles.flagOverlay, { backgroundColor: `${colors.brand.primary}80` }]}>
            <TouchableOpacity 
              style={[styles.flagButton, { backgroundColor: colors.surface.primary }]} 
              onPress={(e) => {
                e.stopPropagation();
                toggleFlag(item.id);
              }}
            >
              <MaterialIcons name="flag" size={18} color={colors.brand.primary} />
              <Text style={[styles.flagButtonText, { color: colors.brand.primary }]}>Unflag</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top', 'left', 'right']}>
      {/* Custom Header */}
      <View style={[styles.headerContainer, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity onPress={handleGoBack}>
          <MaterialIcons name="chevron-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Project</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.brand.primary }]} 
          onPress={handleAddItem}
        >
          <MaterialIcons name="add" size={20} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Search Bar */}
        <View style={[styles.searchBarContainer, { backgroundColor: colors.surface.secondary }]}>
          <MaterialIcons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search"
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          {(['Projects', 'Completed', 'Flag'] as FilterTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                { borderColor: colors.border.light },
                activeFilter === tab && [
                  styles.activeTabButton,
                  { backgroundColor: colors.brand.primary }
                ]
              ]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text 
                style={[
                  styles.tabButtonText,
                  { color: colors.text.secondary },
                  activeFilter === tab && { color: colors.text.inverse }
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Task Grid */}
        <FlatList
          data={filteredProjects}
          renderItem={renderTaskCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={filteredProjects.length > 0 ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="folder-open" size={60} color={colors.text.secondary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No projects found</Text>
              <TouchableOpacity
                style={[
                  styles.createEmptyButton,
                  {
                    backgroundColor: colors.brand.primary,
                    borderWidth: 3,
                    borderColor: '#000000',
                    transform: [{ rotate: '2deg' }],
                    shadowColor: '#000',
                    shadowOffset: { width: 4, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 0,
                    elevation: 8,
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderRadius: 12,
                  }
                ]}
                onPress={handleAddItem}
                activeOpacity={0.8}
              >
                <Text style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: colors.text.inverse,
                  transform: [{ rotate: '-1deg' }]
                }}>
                  Create Project
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

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
            <View style={[styles.modalHeader, { borderBottomColor: colors.border.light, justifyContent: 'space-between' }]}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Create project</Text>
              <TouchableOpacity 
                style={[styles.closeButton, { backgroundColor: colors.surface.primary }]} 
                onPress={handleCloseModal}
              >
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
              {/* Name */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>Name</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { 
                      backgroundColor: colors.surface.secondary,
                      color: colors.text.primary,
                      borderColor: colors.border.light
                    }
                  ]}
                  placeholder="Project Name"
                  placeholderTextColor={colors.text.secondary}
                  value={projectName}
                  onChangeText={setProjectName}
                />
              </View>

              {/* Calendar Section */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>Calendar</Text>
                <View style={styles.dateContainer}>
                  {/* Start Date */}
                  <View style={styles.dateWrapper}>
                    {startDate && (
                      <TouchableOpacity 
                        style={[styles.clearDateButton, { backgroundColor: colors.surface.secondary }]}
                        onPress={() => handleClearDate('start')}
                      >
                        <MaterialIcons name="x" size={16} color={colors.text.secondary} />
                      </TouchableOpacity>
                    )}
                    <DatePickerInput
                      label="Start Date"
                      value={startDate}
                      onChange={handleSetStartDate}
                      maximumDate={endDate || undefined}
                    />
                  </View>
                  
                  {/* End Date */}
                  <View style={styles.dateWrapper}>
                    {endDate && (
                      <TouchableOpacity 
                        style={[styles.clearDateButton, { backgroundColor: colors.surface.secondary }]}
                        onPress={() => handleClearDate('end')}
                      >
                        <MaterialIcons name="x" size={16} color={colors.text.secondary} />
                      </TouchableOpacity>
                    )}
                    <DatePickerInput
                      label="End Date"
                      value={endDate}
                      onChange={handleSetEndDate}
                      minimumDate={startDate || undefined}
                    />
                  </View>
                </View>
                
                {dateError && (
                  <Text style={[styles.errorText, { color: colors.status.error }]}>{dateError}</Text>
                )}
              </View>

              {/* Description */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>Description</Text>
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
                  value={description}
                  onChangeText={setDescription}
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              {/* Add Label */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>Add label</Text>
                <View style={styles.labelsContainer}>
                  {availableLabels.map(label => (
                    <TouchableOpacity 
                      key={label.id}
                      style={[
                        styles.labelItem,
                        { backgroundColor: label.color },
                        selectedLabels.includes(label.id) && [
                          styles.labelItemSelected,
                          { borderColor: colors.brand.primary }
                        ]
                      ]}
                      onPress={() => toggleLabel(label.id)}
                    >
                      {selectedLabels.includes(label.id) && (
                        <MaterialIcons name="check" size={20} color={colors.brand.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity 
                    style={[
                      styles.addLabelButton,
                      { 
                        borderColor: colors.border.light,
                        borderStyle: 'dashed'
                      }
                    ]} 
                    onPress={() => console.log('Add new label')}
                  >
                    <MaterialIcons name="plus" size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Create Button */}
              <Button
                variant="primary"
                onPress={handleCreateProject}
                style={[styles.createButton, { backgroundColor: colors.brand.primary }]}
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