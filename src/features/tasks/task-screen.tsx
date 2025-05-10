import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, ScrollView, ActivityIndicator, Platform, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { useTaskStore } from '@/store/slices/task-slice';
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

const HEADER_ROTATION = '-1deg';
const BUTTON_ROTATION = '1deg';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 3,
    transform: [{ rotate: '-1deg' }],
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
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
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    transform: [{ rotate: '1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 4,
  },
  activeFilterButton: {
    transform: [{ rotate: '1deg' }],
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  taskList: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    transform: [{ rotate: '-1deg' }],
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
    transform: [{ rotate: '2deg' }],
  },
  taskItem: {
    borderRadius: 12,
    borderWidth: 3,
    padding: 16,
    marginBottom: 16,
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '1deg' }],
  },
  taskMetaText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '2deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 8,
  },
});

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

  // Animation value for hover effect
  const buttonScale = React.useRef(new Animated.Value(1)).current;

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

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
        <View style={[styles.errorContainer, { transform: [{ rotate: BUTTON_ROTATION }] }]}>
          <Text style={[styles.errorText, { color: colors.status.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, {
              backgroundColor: colors.surface.primary,
              borderWidth: 3,
              borderColor: colors.border.medium,
              shadowColor: '#000000',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 0,
              elevation: 4,
            }]}
            onPress={() => loadTasks()}
          >
            <Text style={[styles.retryButtonText, { color: colors.text.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.headerContainer, {
        backgroundColor: colors.surface.primary,
        borderWidth: 3,
        borderColor: colors.border.medium,
        transform: [{ rotate: HEADER_ROTATION }],
        shadowColor: '#000000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 0,
        elevation: 4,
        marginBottom: 16,
      }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { 
              color: colors.text.primary,
              fontSize: 28,
              fontWeight: '700',
            }]}>Tasks</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity 
              style={[styles.addButton, {
                backgroundColor: colors.brand.primary,
                borderWidth: 2,
                borderColor: colors.border.medium,
                transform: [{ rotate: BUTTON_ROTATION }],
                shadowColor: '#000000',
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 0,
                elevation: 3,
                padding: 12,
                borderRadius: 12,
              }]}
              onPress={() => handleNavigate('TaskCreation')}
              onPressIn={() => animateButton(0.95)}
              onPressOut={() => animateButton(1)}
            >
              <FeatherIcon name="plus" size={24} color={colors.text.inverse} />
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <View style={[styles.tabsContainer, {
          backgroundColor: colors.surface.secondary,
          borderRadius: 12,
          padding: 4,
          marginTop: 12,
        }]}>
          {['Calendar', 'Overview', 'Analytics'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                {
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: activeTab === tab ? colors.brand.primary : 'transparent',
                  transform: [{ rotate: activeTab === tab ? '1deg' : '0deg' }],
                },
              ]}
              onPress={() => setActiveTab(tab as ActiveTab)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color: activeTab === tab ? colors.text.inverse : colors.text.secondary,
                    fontWeight: '600',
                    fontSize: 16,
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <ScrollView 
        style={[styles.contentContainer, {
          paddingHorizontal: 16,
        }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'android' ? 120 : 90
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

