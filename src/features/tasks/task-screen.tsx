import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { useTaskStore } from '@/store/task-store';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { NavigationProp } from '@react-navigation/native';
import { TaskData } from '@/types/task';
import { ProjectWithTasks } from '@/types/project';
import { createStyles } from './styles';
import { CalendarSection } from '@/features/tasks/components/calendar-section';
import { SelectedDateTasks } from '@/features/tasks/components/selected-date-tasks';
import { VisibleDatesTasks } from '@/features/tasks/components/visible-dates-tasks';
import { TaskSummarySection } from '@/features/tasks/components/task-summary-section';
import { UpcomingTasksSection } from '@/features/tasks/components/upcoming-tasks-section';
import { ProjectSection } from '@/features/tasks/components/project-section';
import { RecentTasksSection } from '@/features/tasks/components/recent-tasks-section';
import { AnalyticsSection } from '@/features/tasks/components/analytics-section';

// Define Tab type
type ActiveTab = 'Calendar' | 'Overview' | 'Analytics';

type ExtendedProjectWithTasks = ProjectWithTasks & {
  startDate?: string;
  endDate?: string;
};

type RootStackParamList = {
  TaskList: { tasks: TaskData[] };
  ProjectDetail: { projectId?: string };
  TaskCreation: undefined;
  AllTasks: undefined;
};

type NavigationPropType = NavigationProp<RootStackParamList>;

export function TaskScreen() {
  const navigation = useNavigation<NavigationPropType>();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Overview');
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { getTasks } = useTaskStore();
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [visibleDates, setVisibleDates] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

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

  const handleNavigate = (screen: string, params?: any) => {
    navigation.navigate(screen as any, params);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Tasks</Text>
          </View>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.brand.primary }]} 
            onPress={() => handleNavigate('TaskCreation')}
          >
            <FeatherIcon name="plus" size={20} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border.light }]}>
          {['Calendar', 'Overview', 'Analytics'].map((tab) => (
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
        ) : activeTab === 'Calendar' ? (
          <>
            <CalendarSection
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              tasks={tasks}
              onNavigate={handleNavigate}
              viewMode={viewMode}
              setViewMode={setViewMode}
              visibleDates={visibleDates}
              setVisibleDates={setVisibleDates}
            />
          </>
        ) : activeTab === 'Overview' ? (
          <>
            <TaskSummarySection 
              styles={styles} 
              colors={colors} 
              isDark={isDark} 
              tasks={tasks} 
            />
            <UpcomingTasksSection 
              styles={styles} 
              colors={colors} 
              isDark={isDark} 
              tasks={tasks} 
            />
            <ProjectSection 
              styles={styles} 
              colors={colors} 
              isDark={isDark} 
              onNavigate={(project?: ExtendedProjectWithTasks) => {
                if (project) {
                  handleNavigate('ProjectDetail', { projectId: project.id });
                } else {
                  handleNavigate('ProjectDetail', {});
                }
              }} 
            />
            <RecentTasksSection 
              styles={styles} 
              colors={colors} 
              isDark={isDark} 
            />
            <TouchableOpacity 
              style={[styles.viewAllButton, { backgroundColor: colors.brand.primary }]}
              onPress={() => handleNavigate('AllTasks')}
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

