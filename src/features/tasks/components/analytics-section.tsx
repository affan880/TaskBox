import * as React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { useProjectStore } from '@/store/project-store';
import { TaskData } from '@/types/task';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { createStyles } from '../styles';

type Props = {
  styles: any;
  colors: any;
  isDark: boolean;
  tasks: TaskData[];
};

export function AnalyticsSection({ styles, colors, isDark, tasks }: Props) {
  const { projects } = useProjectStore();
  const [timeRange, setTimeRange] = React.useState<'week' | 'month' | 'year'>('week');

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
      const projectTasks = tasks.filter(task => project.taskIds?.includes(task.id));
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