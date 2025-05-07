import * as React from 'react';
import { View, Text } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { TaskData } from '@/types/task';

type Props = {
  styles: any;
  colors: any;
  isDark: boolean;
  tasks: TaskData[];
};

export function TaskSummarySection({ styles, colors, isDark, tasks }: Props) {
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <FeatherIcon 
            name="bar-chart-2" 
            size={24} 
            color={colors.text.primary} 
            style={styles.sectionIcon} 
          />
          <Text style={styles.sectionTitle}>Task Overview</Text>
        </View>
      </View>

      <View style={[styles.taskCard]}>
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface.secondary }]}>
            <Text style={[styles.metricValue, { color: colors.text.primary }]}>
              {totalTasks}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
              Total Tasks
            </Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.surface.secondary }]}>
            <Text style={[styles.metricValue, { color: colors.status.success }]}>
              {completedTasks}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
              Completed
            </Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.surface.secondary }]}>
            <Text style={[styles.metricValue, { color: colors.status.warning }]}>
              {totalTasks - completedTasks}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
              Pending
            </Text>
          </View>
        </View>

        <View style={styles.taskProgressContainer}>
          <View style={styles.taskProgressRow}>
            <Text style={[styles.taskProgressText, { color: colors.text.secondary }]}>
              Overall Progress
            </Text>
            <Text style={[styles.taskProgressPercentage, { color: colors.text.primary }]}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
          <View style={[styles.taskProgressBar, { backgroundColor: colors.surface.secondary }]}>
            <View 
              style={[
                styles.taskProgressFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: colors.brand.primary
                }
              ]} 
            />
          </View>
        </View>
      </View>
    </View>
  );
} 