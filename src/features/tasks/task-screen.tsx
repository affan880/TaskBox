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
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/theme-context';
import { useTaskStore } from '@/store/task-store';
import { useProjectStore } from '@/store/project-store';
import { ProjectWithTasks } from '@/types/project';
import type { TaskData, TaskPriority } from '@/types/task';
import { TaskSummary } from '@/components/task-summary';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';

// Define Tab type
type ActiveTab = 'Overview' | 'Analytics';

// *** ProjectSection Component ***
// Define styles type for props if needed, or pass individual style objects
type ProjectSectionProps = {
  styles: any; // Consider defining a more specific type for styles
  colors: any; // Replace 'any' with your actual theme colors type
  isDark: boolean;
  onNavigate: (project?: ProjectWithTasks) => void; // Add callback for navigation
};

function ProjectSection({ styles, colors, isDark, onNavigate }: ProjectSectionProps): React.ReactElement {
  const { projects, deleteProject } = useProjectStore();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithTasks | null>(null);
  
  // Get the most recent project with tasks
  const recentProject = projects.length > 0 
    ? projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
    : null;

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      deleteProject(selectedProject.id);
      setIsDeleteModalVisible(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      Alert.alert('Error', 'Failed to delete project. Please try again.');
    }
  };

  if (!recentProject) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="view-grid-outline" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your project</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate()}>
            <FeatherIcon name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={[styles.projectCard, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.projectTitle, { color: colors.text.primary, textAlign: 'center' }]}>No projects yet</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.brand.primary, marginTop: 16, alignSelf: 'center' }]}
            onPress={() => onNavigate()}
          >
            <Text style={{ color: colors.text.inverse, fontWeight: '600' }}>Create Project</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your project</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate()}>
            <FeatherIcon name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={[styles.projectCard, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.projectTitle, { color: colors.text.primary, textAlign: 'center' }]}>Project not found</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.brand.primary, marginTop: 16, alignSelf: 'center' }]}
            onPress={() => onNavigate()}
          >
            <Text style={{ color: colors.text.inverse, fontWeight: '600' }}>Create Project</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your project</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => {
              setSelectedProject(projectWithTasks);
              setIsDeleteModalVisible(true);
            }}
            style={{ marginRight: 16 }}
          >
            <FeatherIcon name="trash-2" size={20} color={colors.status.error} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate(projectWithTasks)}>
            <FeatherIcon name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.projectCard, { backgroundColor: colors.surface.primary }]}>
        <View style={styles.projectCardTopRow}>
          <Text style={[styles.projectTitle, { color: colors.text.primary }]}>{projectWithTasks.title}</Text>
        </View>
        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={[styles.dateText, { color: colors.text.secondary }]}>
              {projectWithTasks.startDate ? new Date(projectWithTasks.startDate).toLocaleDateString() : 'No start date'}
            </Text>
          </View>
          <Text style={[styles.dateSeparator, { color: colors.text.tertiary }]}>→</Text>
          <View style={styles.dateItem}>
            <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={[styles.dateText, { color: colors.text.secondary }]}>
              {projectWithTasks.endDate ? new Date(projectWithTasks.endDate).toLocaleDateString() : 'No end date'}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <Text style={[styles.progressText, { color: colors.text.primary }]}>{progressPercent}</Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.surface.secondary }]}>
            <View style={[styles.progressFill, { width: progressPercent, backgroundColor: colors.brand.primary }]} />
          </View>
          <Text style={[styles.taskCountText, { color: colors.text.secondary }]}>
            {`${completedTasks}/${totalTasks} tasks`}
          </Text>
        </View>
      </View>

      {/* Delete Project Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.deleteModalContent, { backgroundColor: colors.surface.primary }]}>
            <Text style={[styles.deleteModalTitle, { color: colors.text.primary }]}>
              Delete Project
            </Text>
            <Text style={[styles.deleteModalText, { color: colors.text.secondary }]}>
              Are you sure you want to delete this project? This action cannot be undone and will delete all associated tasks.
            </Text>
            <View style={styles.deleteModalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsDeleteModalVisible(false)}
                style={styles.deleteModalButton}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={handleDeleteProject}
                style={styles.deleteModalButton}
              >
                Delete
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your recent tasks</Text>
          </View>
        </View>
        <View style={[styles.recentTaskCard, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.recentTaskTitle, { color: colors.text.primary, textAlign: 'center' }]}>No pending tasks</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <FeatherIcon name="list" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your recent tasks</Text>
        </View>
      </View>
      <View style={[styles.recentTaskCard, { backgroundColor: colors.surface.primary }]}>
        <View style={[styles.recentTaskIconContainer, { backgroundColor: colors.surface.secondary }]}>
          <Icon 
            name={recentTask.priority === 'high' ? 'priority-high' : 
                  recentTask.priority === 'medium' ? 'priority-medium' : 
                  'priority-low'} 
            size={24} 
            color={recentTask.priority === 'high' ? colors.status.error :
                   recentTask.priority === 'medium' ? colors.status.warning :
                   colors.status.success} 
          />
        </View>
        <View style={styles.recentTaskInfo}>
          <Text style={[styles.recentTaskTitle, { color: colors.text.primary }]}>{recentTask.title}</Text>
          <View style={styles.recentTaskDeadlineContainer}>
            <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={[styles.recentTaskDeadlineText, { color: colors.text.secondary }]}>
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

// *** AnalyticsSection Component ***
function AnalyticsSection({ styles, colors, isDark, tasks }: { styles: any, colors: any, isDark: boolean, tasks: TaskData[] }): React.ReactElement {
  const { projects } = useProjectStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  // Calculate completion rate
  const completionRate = React.useMemo(() => {
    const completedTasks = tasks.filter(task => task.isCompleted).length;
    return tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  }, [tasks]);

  // Calculate tasks by priority
  const tasksByPriority = React.useMemo(() => {
    const priorityCounts = {
      high: 0,
      medium: 0,
      low: 0,
    };
    tasks.forEach(task => {
      if (task.priority) {
        priorityCounts[task.priority]++;
      }
    });
    return priorityCounts;
  }, [tasks]);

  // Calculate tasks by project
  const tasksByProject = React.useMemo(() => {
    const projectCounts = new Map<string, number>();
    projects.forEach(project => {
      const projectTasks = tasks.filter(task => project.tasks.includes(task.id));
      projectCounts.set(project.title, projectTasks.length);
    });
    return Array.from(projectCounts.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [tasks, projects]);

  // Calculate daily completion trends
  const dailyCompletions = React.useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const lastDays = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, 'MMM dd'),
        count: tasks.filter(task => 
          task.isCompleted && 
          task.completedAt && 
          parseISO(task.completedAt) >= startOfDay(date) &&
          parseISO(task.completedAt) <= endOfDay(date)
        ).length
      };
    }).reverse();
    return lastDays;
  }, [tasks, timeRange]);

  // Chart configurations
  const chartConfig = {
    backgroundGradientFrom: colors.surface.primary,
    backgroundGradientTo: colors.surface.primary,
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <FeatherIcon name="bar-chart-2" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Analytics</Text>
        </View>
        <View style={styles.timeRangeContainer}>
          {(['week', 'month', 'year'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                { borderColor: colors.border.light },
                timeRange === range && [
                  styles.activeTimeRangeButton,
                  { 
                    borderColor: colors.brand.primary,
                    backgroundColor: `${colors.brand.primary}20`
                  }
                ]
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text 
                style={[
                  styles.timeRangeButtonText,
                  { color: colors.text.secondary },
                  timeRange === range && { color: colors.brand.primary }
                ]}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Overview Section */}
      <View style={styles.analyticsSection}>
        <Text style={[styles.analyticsSectionTitle, { color: colors.text.primary }]}>Overview</Text>
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface.primary }]}>
            <Text style={[styles.metricValue, { color: colors.text.primary }]}>
              {tasks.length}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
              Total Tasks
            </Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.surface.primary }]}>
            <Text style={[styles.metricValue, { color: colors.text.primary }]}>
              {completionRate.toFixed(1)}%
            </Text>
            <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
              Completion Rate
            </Text>
          </View>
        </View>
      </View>

      {/* Task Distribution by Priority */}
      <View style={styles.analyticsSection}>
        <Text style={[styles.analyticsSectionTitle, { color: colors.text.primary }]}>Task Distribution</Text>
        <PieChart
          data={[
            {
              name: 'High',
              population: tasksByPriority.high,
              color: colors.status.error,
              legendFontColor: colors.text.primary,
            },
            {
              name: 'Medium',
              population: tasksByPriority.medium,
              color: colors.status.warning,
              legendFontColor: colors.text.primary,
            },
            {
              name: 'Low',
              population: tasksByPriority.low,
              color: colors.status.success,
              legendFontColor: colors.text.primary,
            },
          ]}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      {/* Daily Completion Trends */}
      <View style={styles.analyticsSection}>
        <Text style={[styles.analyticsSectionTitle, { color: colors.text.primary }]}>Completion Trends</Text>
        <LineChart
          data={{
            labels: dailyCompletions.map(day => day.date),
            datasets: [{
              data: dailyCompletions.map(day => day.count)
            }]
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Tasks by Project */}
      {tasksByProject.length > 0 && (
        <View style={styles.analyticsSection}>
          <Text style={[styles.analyticsSectionTitle, { color: colors.text.primary }]}>Tasks by Project</Text>
          <BarChart
            data={{
              labels: tasksByProject.map(item => item.name),
              datasets: [{
                data: tasksByProject.map(item => item.count)
              }]
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>
      )}
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('Overview');
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getTasks } = useTaskStore();

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedTasks = await getTasks();
        if (isMounted) {
          setTasks(loadedTasks || []);
        }
      } catch (err) {
        console.error('Error loading tasks:', err);
        if (isMounted) {
          setError('Failed to load tasks. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, []);

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
    analyticsSection: {
      marginBottom: 24,
    },
    analyticsSectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    metricsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
    },
    metricCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 14,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },
    deleteModalContent: {
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
    },
    deleteModalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    deleteModalText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 20,
    },
    deleteModalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
    },
    deleteModalButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    timeRangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timeRangeButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    activeTimeRangeButton: {
      borderWidth: 1.5,
    },
    timeRangeButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Tasks</Text>
            <TouchableOpacity style={styles.headerTitleIcon}>
              <FeatherIcon name="chevron-down" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.brand.primary }]} 
            onPress={() => navigation.navigate('TaskCreation')}
          >
            <FeatherIcon name="plus" size={20} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.searchBarContainer, { backgroundColor: colors.surface.secondary }]}>
          <FeatherIcon name="search" size={20} color={colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search tasks..."
            placeholderTextColor={colors.text.tertiary}
            value={''}
            onChangeText={() => {}}
          />
        </View>
        
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border.light }]}>
          {['Overview', 'Analytics'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && [styles.activeTabButton, { borderBottomColor: colors.brand.primary }],
              ]}
              onPress={() => setActiveTab(tab as ActiveTab)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: colors.text.secondary },
                  activeTab === tab && { color: colors.brand.primary },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <ScrollView style={styles.contentContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text.primary }]}>{error}</Text>
          </View>
        ) : activeTab === 'Overview' ? (
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
              onNavigate={(projectId?: string) => navigation.navigate('ProjectDetail', { projectId })} 
            />
            <RecentTasksSection 
              styles={styles} 
              colors={colors} 
              isDark={isDark} 
            />
            <TouchableOpacity 
              style={[styles.viewAllButton, { backgroundColor: colors.brand.primary }]}
              onPress={() => navigation.navigate('TaskList')}
            >
              <Text style={[styles.viewAllButtonText, { color: colors.text.inverse }]}>
                View All Tasks
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <AnalyticsSection 
            styles={styles} 
            colors={colors} 
            isDark={isDark} 
            tasks={tasks} 
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 
