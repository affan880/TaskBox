import * as React from 'react';
import { View, Text } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { TaskData } from '@/types/task';
import { TaskSummary } from '@/components/task-summary';
import { createStyles } from '../styles';

type Props = {
  styles: any;
  colors: any;
  isDark: boolean;
  tasks: TaskData[];
};

export function TaskSummarySection({ styles, colors, isDark, tasks }: Props) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <FeatherIcon name="bar-chart-2" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Task Overview</Text>
        </View>
      </View>
      
      <TaskSummary tasks={tasks} compact={true} />
    </View>
  );
} 