import * as React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { TaskData, TaskPriority } from '@/types/task';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

type Props = {
  styles: any;
  colors: any;
  isDark: boolean;
  tasks: TaskData[];
};

export function AnalyticsSection({ styles, colors, isDark, tasks }: Props) {
  const screenWidth = Dimensions.get('window').width;

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate priority distribution
  const priorityDistribution = {
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length,
  };

  // Calculate weekly completion trend
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyData = daysInWeek.map(date => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    // Count tasks completed on this day
    const completedOnDay = tasks.filter(task => {
      if (!task.isCompleted || !task.updatedAt) return false;
      const completionDate = parseISO(task.updatedAt);
      return isWithinInterval(completionDate, { start: dayStart, end: dayEnd });
    }).length;

    return {
      date: format(date, 'EEE'),
      completed: completedOnDay,
    };
  });

  // Find the maximum completed tasks in a day for chart scaling
  const maxCompletedTasks = Math.max(...weeklyData.map(day => day.completed));
  const chartMaxValue = maxCompletedTasks > 0 ? maxCompletedTasks + 1 : 5;

  // Prepare data for pie chart
  const pieChartData = [
    {
      name: 'High Priority',
      population: priorityDistribution.high,
      color: colors.status.error,
      legendFontColor: colors.text.primary,
    },
    {
      name: 'Medium Priority',
      population: priorityDistribution.medium,
      color: colors.status.warning,
      legendFontColor: colors.text.primary,
    },
    {
      name: 'Low Priority',
      population: priorityDistribution.low,
      color: colors.status.success,
      legendFontColor: colors.text.primary,
    },
  ];

  // Prepare data for line chart
  const lineChartData = {
    labels: weeklyData.map(day => day.date),
    datasets: [
      {
        data: weeklyData.map(day => day.completed),
        color: (opacity = 1) => colors.brand.primary,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.sectionContainer}>
      {/* Overall Statistics */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>{totalTasks}</Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Total Tasks</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>{completedTasks}</Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>{completionRate.toFixed(1)}%</Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Completion Rate</Text>
        </View>
      </View>

      {/* Priority Distribution */}
      <View style={[styles.chartContainer, { backgroundColor: colors.surface.primary }]}>
        <Text style={[styles.chartTitle, { color: colors.text.primary }]}>Task Priority Distribution</Text>
        <PieChart
          data={pieChartData}
          width={screenWidth - 64}
          height={200}
          chartConfig={{
            backgroundColor: colors.surface.primary,
            backgroundGradientFrom: colors.surface.primary,
            backgroundGradientTo: colors.surface.primary,
            color: (opacity = 1) => colors.text.primary,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      {/* Weekly Completion Trend */}
      <View style={[styles.chartContainer, { backgroundColor: colors.surface.primary }]}>
        <Text style={[styles.chartTitle, { color: colors.text.primary }]}>Weekly Completion Trend</Text>
        <LineChart
          data={lineChartData}
          width={screenWidth - 64}
          height={200}
          chartConfig={{
            backgroundColor: colors.surface.primary,
            backgroundGradientFrom: colors.surface.primary,
            backgroundGradientTo: colors.surface.primary,
            decimalPlaces: 0,
            color: (opacity = 1) => colors.text.primary,
            labelColor: (opacity = 1) => colors.text.primary,
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: colors.brand.primary,
            },
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          withVerticalLines={false}
          withHorizontalLines
          fromZero
          yAxisInterval={1}
          yAxisSuffix=""
          yAxisLabel=""
          segments={chartMaxValue}
        />
      </View>

      {/* Additional Analytics */}
      <View style={[styles.additionalStats, { backgroundColor: colors.surface.primary }]}>
        <Text style={[styles.additionalStatsTitle, { color: colors.text.primary }]}>Task Insights</Text>
        <View style={styles.insightRow}>
          <Text style={[styles.insightLabel, { color: colors.text.secondary }]}>Average Completion Time:</Text>
          <Text style={[styles.insightValue, { color: colors.text.primary }]}>
            {calculateAverageCompletionTime(tasks)} days
          </Text>
        </View>
        <View style={styles.insightRow}>
          <Text style={[styles.insightLabel, { color: colors.text.secondary }]}>Most Common Priority:</Text>
          <Text style={[styles.insightValue, { color: colors.text.primary }]}>
            {getMostCommonPriority(tasks)}
          </Text>
        </View>
        <View style={styles.insightRow}>
          <Text style={[styles.insightLabel, { color: colors.text.secondary }]}>Tasks Due Soon:</Text>
          <Text style={[styles.insightValue, { color: colors.text.primary }]}>
            {getTasksDueSoon(tasks)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Helper functions
function calculateAverageCompletionTime(tasks: TaskData[]): string {
  const completedTasks = tasks.filter(task => task.isCompleted && task.createdAt);
  if (completedTasks.length === 0) return '0';

  const totalDays = completedTasks.reduce((sum, task) => {
    const created = new Date(task.createdAt);
    const completed = new Date(task.updatedAt);
    const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);

  return (totalDays / completedTasks.length).toFixed(1);
}

function getMostCommonPriority(tasks: TaskData[]): string {
  if (!tasks || tasks.length === 0) {
    return 'N/A'; // Handle empty task list case
  }

  const priorities = tasks.reduce((acc, task) => {
    // Ensure priority exists and is valid before incrementing
    if (task.priority && ['low', 'medium', 'high'].includes(task.priority)) {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
    }
    return acc;
  }, {} as Record<TaskPriority, number>);

  const priorityEntries = Object.entries(priorities);

  if (priorityEntries.length === 0) {
    return 'N/A'; // Handle case where no tasks had valid priorities
  }

  // Now it's safe to reduce, as priorityEntries is not empty
  const mostCommon = priorityEntries.reduce((a, b) => (a[1] > b[1] ? a : b));
  
  // Capitalize the result
  const priorityName = mostCommon[0];
  return priorityName.charAt(0).toUpperCase() + priorityName.slice(1);
}

function getTasksDueSoon(tasks: TaskData[]): number {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return tasks.filter(task => {
    if (!task.dueDate || task.isCompleted) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate > today && dueDate <= nextWeek;
  }).length;
} 