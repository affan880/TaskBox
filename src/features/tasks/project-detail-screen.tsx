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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../theme/theme-context';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { useProjectStore } from '@/store/project-store';
import { ProjectData, ProjectCreateInput } from '@/types/project';

type FilterTab = 'Projects' | 'Completed' | 'Flag';

// Dummy data structure - adjust as needed
type ProjectTask = {
  id: string;
  title: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  isDone: boolean;
  isFlagged?: boolean; // Optional flag state
};

// Dummy data for different tabs
const dummyData: Record<FilterTab, ProjectTask[]> = {
  Projects: [
    { id: 'p1', title: 'Userflow', deadline: '20/01/2021', priority: 'High', isDone: true },
    { id: 'p2', title: 'Userflow', deadline: '20/01/2021', priority: 'High', isDone: true },
    { id: 'p3', title: 'UI design', deadline: '20/01/2021', priority: 'High', isDone: false },
    { id: 'p4', title: 'UI design', deadline: '20/01/2021', priority: 'High', isDone: false },
    { id: 'p5', title: 'API Int', deadline: '22/01/2021', priority: 'Medium', isDone: false },
  ],
  Completed: [
    { id: 'c1', title: 'Userflow C', deadline: '19/01/2021', priority: 'High', isDone: true },
    { id: 'c2', title: 'Onboarding C', deadline: '18/01/2021', priority: 'Low', isDone: true },
  ],
  Flag: [
    { id: 'f1', title: 'Userflow F', deadline: '20/01/2021', priority: 'High', isDone: true, isFlagged: true },
    { id: 'f2', title: 'UI Design F', deadline: '20/01/2021', priority: 'High', isDone: false, isFlagged: true },
  ],
};

const NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;

export function ProjectDetailScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Projects');
  const [flaggedItems, setFlaggedItems] = useState<Record<string, boolean>>({ f1: true, f2: true }); // Track flagged state locally
  
  // Project store
  const { addProject, saveProjects, loadProjects, projects } = useProjectStore();
  const [localProjects, setLocalProjects] = useState<ProjectData[]>([]);
  
  // Load projects on mount
  useEffect(() => {
    const initializeProjects = async () => {
      await loadProjects();
      const allProjects = useProjectStore.getState().projects;
      setLocalProjects(allProjects);
    };
    
    initializeProjects();
  }, [loadProjects]);

  // --- Modal State ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date()); // Default to today
  const [endDate, setEndDate] = useState<Date | null>(new Date());   // Default to today
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]); // Store IDs/color
  const [dateError, setDateError] = useState<string | null>(null); // Track date validation errors

  // Dummy labels
  const availableLabels = [
      { id: 'l1', color: '#FBCFE8' }, // pink
      { id: 'l2', color: '#CFFAFE' }, // cyan
      { id: 'l3', color: '#FEF3C7' }, // yellow
      { id: 'l4', color: '#FEE2E2' }, // red
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
      title: projectName,
      description: description,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      labelColor: selectedLabels.length > 0 
        ? availableLabels.find(l => l.id === selectedLabels[0])?.color 
        : undefined
    };
    
    try {
      // Add project to store
      const projectId = addProject(projectInput);
      
      // Save to storage
      await saveProjects();
      
      // Refresh local projects list
      const updatedProjects = useProjectStore.getState().projects;
      setLocalProjects(updatedProjects);
      
      // Show success message
      Alert.alert(
        'Success',
        'Project created successfully!',
        [{ text: 'OK' }]
      );
      
      // Close modal
      handleCloseModal();
    } catch (error) {
      console.error('Failed to create project:', error);
      Alert.alert(
        'Error',
        'Failed to create project. Please try again.',
        [{ text: 'OK' }]
      );
    }
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
    // Here you would also call an update function to persist the flag state
  };

  // Filter projects based on the active filter and search query
  const getFilteredProjects = () => {
    if (localProjects.length === 0) return [];
    
    let filtered = localProjects;
    
    // Apply filters
    if (activeFilter === 'Completed') {
      filtered = filtered.filter(project => project.isCompleted);
    } else if (activeFilter === 'Flag') {
      // For flagged projects, you'd need to implement a proper flagging system
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

  // Define styles inside the component
  const styles = StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background.primary },
      contentContainer: { flex: 1, paddingHorizontal: 16 },
      // --- Header ---
      headerContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16, // Match content padding
          backgroundColor: colors.background.primary,
      },
      headerTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: colors.text.primary,
      },
      addButton: {
          backgroundColor: '#7C3AED', // Example purple color
          padding: 10, // Slightly smaller padding
          borderRadius: 8,
      },
      // --- Search Bar ---
      searchBarContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#374151' : '#F3F4F6',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginVertical: 8, // Add margin around search bar
      },
      searchIcon: { marginRight: 8 },
      searchInput: {
          flex: 1,
          fontSize: 16,
          color: colors.text.primary,
          paddingVertical: 4,
      },
      // --- Filter Tabs ---
      tabsContainer: {
          flexDirection: 'row',
          justifyContent: 'space-around', // Space out tabs
          marginVertical: 12,
      },
      tabButton: {
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20, // Pill shape
      },
      activeTabButton: {
          backgroundColor: '#7C3AED', // Example purple color
      },
      tabButtonText: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text.secondary,
      },
      activeTabButtonText: {
          color: '#FFFFFF',
      },
      // --- Grid ---
      listContainer: {
          // No explicit paddingHorizontal here, handled by contentContainer
      },
      columnWrapper: {
          justifyContent: 'space-between', // Space items in the row
      },
      // --- Task Card ---
      card: {
          backgroundColor: isDark ? colors.background.secondary : '#FFFFFF',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          width: (SCREEN_WIDTH - 16 * 3) / NUM_COLUMNS, // Calculation for 2 columns with padding
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          minHeight: 180, // Increase card height for better spacing
      },
      cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
      },
      cardMenuButton: {
          padding: 4,
      },
      cardIconContainer: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.background.tertiary,
          justifyContent: 'center',
          alignItems: 'center',
      },
      cardTitle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: colors.text.primary,
          marginBottom: 12,
      },
      cardMetadataContainer: {
          flex: 1, // Take up available space
          marginBottom: 12,
      },
      cardRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
      },
      cardLabel: {
          fontSize: 12,
          color: colors.text.secondary,
          marginLeft: 6,
      },
      cardValue: {
          fontSize: 12,
          fontWeight: '500',
          color: colors.text.primary,
      },
      priorityBadge: {
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 12,
          marginVertical: 4,
      },
      priorityText: {
          fontSize: 10,
          fontWeight: 'bold',
          color: '#FFFFFF',
      },
      priorityHigh: { 
          backgroundColor: '#EF4444',
      },
      priorityMedium: { 
          backgroundColor: '#F59E0B',
      },
      priorityLow: { 
          backgroundColor: '#10B981',
      },
      cardFooter: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 'auto', // Push to bottom
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
      },
      checkboxContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 'auto', // Push to bottom
          paddingTop: 8,
      },
      checkbox: {
          width: 18,
          height: 18,
          borderRadius: 4,
          borderWidth: 1.5,
          borderColor: colors.text.secondary,
          marginRight: 8,
          justifyContent: 'center',
          alignItems: 'center',
      },
      checkboxChecked: {
          backgroundColor: colors.brand.primary,
          borderColor: colors.brand.primary,
      },
      checkboxLabel: {
          fontSize: 12,
          color: colors.text.secondary,
      },
      // --- Flag Overlay ---
      flagOverlay: {
          ...StyleSheet.absoluteFillObject, // Cover the card
          backgroundColor: 'rgba(96, 73, 138, 0.85)', // Semi-transparent dark purple
          borderRadius: 12, // Match card border radius
          justifyContent: 'center',
          alignItems: 'center',
      },
      flagButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
      },
      flagButtonText: {
          color: '#4B0082', // Dark purple text
          fontWeight: 'bold',
          marginLeft: 8,
      },
      // *** MODAL STYLES START ***
      modalContainer: { 
          flex: 1,
          justifyContent: 'flex-end', // Position modal at the bottom initially
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
      },
      modalContent: { 
          backgroundColor: colors.background.primary,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 16,
          paddingBottom: 30, // Extra padding at bottom
          maxHeight: '90%', // Limit modal height
      },
      modalHeader: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light, // Use appropriate border color
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
          padding: 4, // Make touch target bigger
      },
      formScrollView: {
          // Add styles if needed, e.g., maxHeight
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
          borderColor: colors.border.medium, // Use appropriate border color
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 16,
          color: colors.text.primary,
          backgroundColor: colors.background.secondary,
      },
      textArea: {
          minHeight: 80, // Set initial height for description
          textAlignVertical: 'top', // Align text to top
      },
      dateContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
      },
      dateButton: { // Placeholder style for date picker touchable
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border.medium,
          borderRadius: 20,
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: colors.background.secondary,
          minWidth: '45%', // Ensure buttons take up space
          justifyContent: 'center'
      },
      dateText: {
          fontSize: 14,
          color: colors.text.primary,
          marginLeft: 8,
      },
      errorText: {
          color: '#EF4444', // Red color for errors
          fontSize: 12,
          marginTop: 4,
      },
      dateWrapper: {
          width: '48%', // Control width
          position: 'relative',
      },
      clearDateButton: {
          position: 'absolute',
          right: 5,
          top: 5,
          zIndex: 1,
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: 12,
          padding: 2,
      },
      labelsContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap', // Allow labels to wrap
      },
      labelItem: {
          width: 40,
          height: 40,
          borderRadius: 8,
          marginRight: 12,
          marginBottom: 8, // Add margin for wrapped items
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: 'transparent', // Default no border
      },
      labelItemSelected: {
          borderColor: colors.brand.primary, // Highlight selected label
      },
      addLabelButton: {
          width: 40,
          height: 40,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: colors.text.secondary,
          borderStyle: 'dashed',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
      },
      createButton: {
          backgroundColor: colors.brand.primary, // Use theme color
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
      // *** MODAL STYLES END ***
      emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 60,
      },
      emptyText: {
          fontSize: 16,
          color: colors.text.secondary,
          marginTop: 12,
          marginBottom: 24,
      },
      createEmptyButton: {
          backgroundColor: colors.brand.primary,
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
      },
      createEmptyButtonText: {
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: 'bold',
      },
      cardDescription: {
          fontSize: 13,
          color: colors.text.secondary,
          marginBottom: 12,
      },
      progressContainer: {
          marginTop: 12,
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
          height: 4,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          borderRadius: 2,
          overflow: 'hidden',
      },
      progressFill: {
          height: '100%',
          backgroundColor: colors.brand.primary,
          borderRadius: 2,
      },
      progressCompleted: {
          backgroundColor: '#10B981', // Green color for completed
      },
  });

  const renderTaskCard = ({ item }: { item: ProjectData }) => {
    // Determine if project is flagged (you should implement a proper flagging mechanism)
    const isFlagged = activeFilter === 'Flag' && flaggedItems[item.id];
    
    // Check if project has a due date
    const hasDueDate = !!item.endDate;
    
    // Format dates
    const formattedStartDate = item.startDate 
      ? new Date(item.startDate).toLocaleDateString() 
      : 'Not set';
      
    const formattedEndDate = item.endDate
      ? new Date(item.endDate).toLocaleDateString()
      : 'Not set';
    
    // Calculate progress - for now we'll show a placeholder
    const totalTasks = item.tasks.length;
    // In a real app, you would fetch the tasks and determine completion status
    const completedTasks = 0;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
      <TouchableOpacity 
        style={[styles.card, item.labelColor ? { borderLeftColor: item.labelColor, borderLeftWidth: 4 } : null]}
        onPress={() => navigation.navigate('TaskList', { projectId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Icon name="folder" size={18} color={colors.text.primary} />
          </View>
          <TouchableOpacity 
            style={styles.cardMenuButton}
            onPress={() => console.log('Menu for project', item.id)}
          >
            <Icon name="more-vert" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.cardTitle}>{item.title}</Text>
        
        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        
        <View style={styles.cardMetadataContainer}>
          {item.startDate && (
            <View style={styles.cardRow}>
              <FeatherIcon name="calendar" size={14} color={colors.text.secondary} />
              <Text style={styles.cardLabel}>Start: {formattedStartDate}</Text>
            </View>
          )}
          
          {item.endDate && (
            <View style={styles.cardRow}>
              <FeatherIcon name="calendar" size={14} color={colors.text.secondary} />
              <Text style={styles.cardLabel}>Due: {formattedEndDate}</Text>
            </View>
          )}
          
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks` : 'No tasks yet'}
              </Text>
              {totalTasks > 0 && (
                <Text style={styles.progressPercentage}>
                  {Math.round(progressPercentage)}%
                </Text>
              )}
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progressPercentage}%` },
                  item.isCompleted && styles.progressCompleted
                ]} 
              />
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={[styles.checkbox, item.isCompleted && styles.checkboxChecked]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent card navigation
              console.log('Toggle completion for', item.id);
            }}
          >
            {item.isCompleted && <FeatherIcon name="check" size={12} color="#FFFFFF" />}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>
            {item.isCompleted ? 'Completed' : 'Mark as complete'}
          </Text>
        </View>

        {/* Flag Overlay */}
        {isFlagged && (
          <View style={styles.flagOverlay}>
            <TouchableOpacity 
              style={styles.flagButton} 
              onPress={(e) => {
                e.stopPropagation(); // Prevent card navigation
                toggleFlag(item.id);
              }}
            >
              <FeatherIcon name="flag" size={18} color="#4B0082" />
              <Text style={styles.flagButtonText}>Unflag</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Custom Header */}
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleGoBack}>
                <FeatherIcon name="chevron-left" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Project</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                <Icon name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
                <FeatherIcon name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
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
                        style={[styles.tabButton, activeFilter === tab && styles.activeTabButton]}
                        onPress={() => setActiveFilter(tab)}
                    >
                        <Text style={[styles.tabButtonText, activeFilter === tab && styles.activeTabButtonText]}>
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
                numColumns={NUM_COLUMNS}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={filteredProjects.length > 0 ? styles.columnWrapper : undefined}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Icon name="folder-open" size={60} color={colors.text.secondary} />
                    <Text style={styles.emptyText}>No projects found</Text>
                    <TouchableOpacity 
                      style={styles.createEmptyButton}
                      onPress={handleAddItem}
                    >
                      <Text style={styles.createEmptyButtonText}>Create Project</Text>
                    </TouchableOpacity>
                  </View>
                )}
            />
        </View>

        {/* --- Create Project Modal --- */}
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
                        <Text style={styles.modalTitle}>Create project</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                            <Icon name="close" size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
                        {/* Name */}
                        <View style={styles.formSection}>
                            <Text style={styles.formLabel}>Name</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Project Name"
                                placeholderTextColor={colors.text.secondary}
                                value={projectName}
                                onChangeText={setProjectName}
                            />
                        </View>

                        {/* Calendar Section - Use DatePickerInput */}
                        <View style={styles.formSection}>
                            <Text style={styles.formLabel}>Calendar</Text>
                            <View style={styles.dateContainer}>
                                {/* Start Date */}
                                <View style={styles.dateWrapper}>
                                    {startDate && (
                                        <TouchableOpacity 
                                            style={styles.clearDateButton}
                                            onPress={() => handleClearDate('start')}
                                        >
                                            <FeatherIcon name="x" size={16} color={colors.text.secondary} />
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
                                            style={styles.clearDateButton}
                                            onPress={() => handleClearDate('end')}
                                        >
                                            <FeatherIcon name="x" size={16} color={colors.text.secondary} />
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
                            
                            {/* Show error message if dates are invalid */}
                            {dateError && (
                                <Text style={styles.errorText}>{dateError}</Text>
                            )}
                        </View>

                        {/* Description */}
                        <View style={styles.formSection}>
                            <Text style={styles.formLabel}>Description</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
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
                            <Text style={styles.formLabel}>Add label</Text>
                            <View style={styles.labelsContainer}>
                                {availableLabels.map(label => (
                                    <TouchableOpacity 
                                        key={label.id}
                                        style={[
                                            styles.labelItem,
                                            { backgroundColor: label.color },
                                            selectedLabels.includes(label.id) && styles.labelItemSelected
                                        ]}
                                        onPress={() => toggleLabel(label.id)}
                                    >
                                        {/* Optional: Show checkmark if selected */}
                                        {selectedLabels.includes(label.id) && (
                                            <FeatherIcon name="check" size={20} color={colors.brand.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity style={styles.addLabelButton} onPress={() => console.log('Add new label')}>
                                    <FeatherIcon name="plus" size={20} color={colors.text.secondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Create Button */}
                        <TouchableOpacity style={styles.createButton} onPress={handleCreateProject}>
                            <Text style={styles.createButtonText}>Create</Text>
                            {/* Optional Arrow */}
                            {/* <FeatherIcon name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} /> */} 
                        </TouchableOpacity>

                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    </SafeAreaView>
  );
} 