import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Text,
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