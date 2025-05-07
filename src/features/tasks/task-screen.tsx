import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, ScrollView, ActivityIndicator, Platform } from 'react-native';
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
import { CalendarSection } from './components/calendar-section';
import { SelectedDateTasks } from './components/selected-date-tasks';
import { VisibleDatesTasks } from './components/visible-dates-tasks';
import { TaskSummarySection } from './components/task-summary-section';
import { UpcomingTasksSection } from './components/upcoming-tasks-section';
import { ProjectSection } from './components/project-section';
import { RecentTasksSection } from './components/recent-tasks-section';
import { AnalyticsSection } from './components/analytics-section';

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
  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Overview');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { tasks, loadTasks, initialized } = useTaskStore();
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [visibleDates, setVisibleDates] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks when component mounts
  useEffect(() => {
    const initializeTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await loadTasks();
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setError('Failed to load tasks. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!initialized) {
      initializeTasks();
    } else {
      setIsLoading(false);
    }
  }, [loadTasks, initialized]);

  const handleNavigate = (screen: string, params?: any) => {
    navigation.navigate(screen as any, params);
  };

  if (!styles) {
    return null;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={[styles.errorText, { color: colors.status.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.brand.primary }]}
            onPress={() => loadTasks()}
          >
            <Text style={[styles.retryButtonText, { color: colors.text.inverse }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        
        <View style={[styles.tabsContainer]}>
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
      
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'android' ? 120 : 90 // Account for tab bar height + safe area
        }}
      >
        {activeTab === 'Calendar' ? (
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
            />
            <ProjectSection
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

