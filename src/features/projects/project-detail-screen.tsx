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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../theme/theme-context'; // Assuming theme context path
import { DatePickerInput } from '@/components/ui/date-picker-input'; // Import the new component

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

  // --- Modal State ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date()); // Default to today
  const [endDate, setEndDate] = useState<Date | null>(new Date());   // Default to today
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]); // Store IDs/color

  // Dummy labels
  const availableLabels = [
      { id: 'l1', color: '#FBCFE8' }, // pink
      { id: 'l2', color: '#CFFAFE' }, // cyan
      { id: 'l3', color: '#FEF3C7' }, // yellow
      { id: 'l4', color: '#FEE2E2' }, // red
  ];

  const handleGoBack = () => navigation.goBack();
  const handleAddItem = () => setIsModalVisible(true);
  const handleCloseModal = () => setIsModalVisible(false);
  const handleSetStartDate = (date: Date | null): void => {
    setStartDate(date);
  };
  const handleSetEndDate = (date: Date | null): void => {
    // Optional: Add validation e.g., end date >= start date
    setEndDate(date);
  };
  const handleCreateProject = () => {
      console.log('Creating Project:', { projectName, description, startDate, endDate, selectedLabels });
      // Add actual creation logic here (e.g., call API, update store)
      handleCloseModal();
      // Reset form state if needed
      setProjectName('');
      setDescription('');
      setStartDate(null);
      setEndDate(null);
      setSelectedLabels([]);
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

  const filteredData = dummyData[activeFilter].filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          padding: 12,
          marginBottom: 16,
          width: (SCREEN_WIDTH - 16 * 3) / NUM_COLUMNS, // Calculation for 2 columns with padding
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 3,
          minHeight: 150, // Ensure cards have a decent height
      },
      cardIconContainer: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.background.tertiary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
      },
      cardTitle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: colors.text.primary,
          marginBottom: 8,
      },
      cardRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
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
      priorityHigh: { color: '#EF4444' }, // Example red for high priority
      priorityMedium: { color: '#F59E0B' }, // Example orange for medium
      priorityLow: { color: '#10B981' }, // Example green for low
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
      closeFlagButton: {
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 12,
          padding: 4,
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
  });

  const renderTaskCard = ({ item }: { item: ProjectTask }) => {
    const priorityStyle =
        item.priority === 'High' ? styles.priorityHigh :
        item.priority === 'Medium' ? styles.priorityMedium : styles.priorityLow;
    const isFlagged = activeFilter === 'Flag' && flaggedItems[item.id];

    return (
      <View style={styles.card}>
        <View style={styles.cardIconContainer}>
            {/* Placeholder Icon */}
            <Icon name="description" size={18} color={colors.text.primary} />
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.cardRow}>
            <FeatherIcon name="clock" size={14} color={colors.text.secondary} />
            <Text style={styles.cardLabel}>Deadline</Text>
        </View>
        <Text style={[styles.cardValue, { marginBottom: 4 }]}>{item.deadline}</Text>
        <View style={styles.cardRow}>
            <FeatherIcon name="alert-circle" size={14} color={colors.text.secondary} />
            <Text style={styles.cardLabel}>Priority</Text>
        </View>
        <Text style={[styles.cardValue, priorityStyle, { marginBottom: 4 }]}>{item.priority}</Text>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity style={[styles.checkbox, item.isDone && styles.checkboxChecked]}>
            {item.isDone && <FeatherIcon name="check" size={12} color="#FFFFFF" />}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>{item.isDone ? 'Done' : 'Mark as done'}</Text>
        </View>

        {/* Flag Overlay - Shown only on Flag tab if item is flagged */}
        {isFlagged && (
            <View style={styles.flagOverlay}>
                <TouchableOpacity style={styles.flagButton} onPress={() => toggleFlag(item.id)}>
                    <FeatherIcon name="flag" size={18} color="#4B0082" />
                    <Text style={styles.flagButtonText}>Unflag</Text>
                </TouchableOpacity>
                {/* Optional: Close button for overlay itself */}
                {/* <TouchableOpacity style={styles.closeFlagButton} onPress={() => toggleFlag(item.id)}>
                    <FeatherIcon name="x" size={14} color="#FFFFFF" />
                </TouchableOpacity> */}
            </View>
        )}
      </View>
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
                data={filteredData}
                renderItem={renderTaskCard}
                keyExtractor={(item) => item.id}
                numColumns={NUM_COLUMNS}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                // Add ListEmptyComponent if needed
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
                                {/* Use DatePickerInput for Start Date */}
                                <DatePickerInput
                                  label="Start Date"
                                  value={startDate}
                                  onChange={handleSetStartDate}
                                  // Optional: set maximumDate={endDate}
                                />
                                {/* Add some space between pickers */}
                                <View style={{ width: 16 }} />
                                {/* Use DatePickerInput for End Date */}
                                <DatePickerInput
                                  label="End Date"
                                  value={endDate}
                                  onChange={handleSetEndDate}
                                  minimumDate={startDate || undefined} // Pass startDate as minimumDate
                                />
                            </View>
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