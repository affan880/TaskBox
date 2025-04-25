import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { useTaskStore } from '@/store/task-store';
import { useProjectStore } from '@/store/project-store';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';

type TimeRange = 'week' | 'month' | 'year';

export function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const { tasks } = useTaskStore();
  const { projects } = useProjectStore();
  const [timeRange, setTimeRange] = React.useState<TimeRange>('week');

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
    const last7Days = Array.from({ length: 7 }, (_, i) => {
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
    return last7Days;
  }, [tasks]);

  // Chart configurations
  const chartConfig = {
    backgroundGradientFrom: isDark ? colors.background.secondary : colors.background.primary,
    backgroundGradientTo: isDark ? colors.background.secondary : colors.background.primary,
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Overview Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Overview</Text>
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
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Task Distribution</Text>
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
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Daily Completions</Text>
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Tasks by Project</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
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
}); 