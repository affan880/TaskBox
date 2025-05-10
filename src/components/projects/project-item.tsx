import * as React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { ProjectWithTasks } from '@/types/project';

type ProjectItemProps = {
  project: ProjectWithTasks;
  onPress: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onToggleComplete: (projectId: string, currentStatus: boolean) => void;
};

export function ProjectItem({ 
  project, 
  onPress, 
  onDelete, 
  onToggleComplete 
}: ProjectItemProps) {
  const { colors } = useTheme();
  
  const completedTasks = project.tasks.filter(task => task.isCompleted).length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <TouchableOpacity 
      style={[styles.projectItem, { backgroundColor: colors.surface.primary }]}
      onPress={() => onPress(project.id)}
    >
      <View style={styles.projectHeader}>
        <Text style={[styles.projectTitle, { color: colors.text.primary }]}>{project.title}</Text>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => onDelete(project.id)}
        >
          <FeatherIcon name="trash-2" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
      
      {project.description ? (
        <Text style={[styles.projectDescription, { color: colors.text.secondary }]} numberOfLines={2}>
          {project.description}
        </Text>
      ) : null}
      
      <View style={styles.projectMeta}>
        {project.startDate && (
          <View style={styles.projectMetaItem}>
            <FeatherIcon name="calendar" size={12} color={colors.text.secondary} />
            <Text style={[styles.projectMetaText, { color: colors.text.secondary }]}>
              Start: {new Date(project.startDate).toLocaleDateString()}
            </Text>
          </View>
        )}
        
        {project.endDate && (
          <View style={styles.projectMetaItem}>
            <FeatherIcon name="calendar" size={12} color={colors.text.secondary} />
            <Text style={[styles.projectMetaText, { color: colors.text.secondary }]}>
              Due: {new Date(project.endDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressText, { color: colors.text.secondary }]}>
            Progress: {completedTasks}/{totalTasks} tasks
          </Text>
          <Text style={[styles.progressPercentage, { color: colors.text.secondary }]}>
            {Math.round(progress)}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.surface.secondary }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progress}%`,
                backgroundColor: project.isCompleted ? colors.status.success : colors.brand.primary
              }
            ]} 
          />
        </View>
      </View>

      <View style={[styles.projectFooter, { borderTopColor: colors.border.light }]}>
        <TouchableOpacity 
          style={[
            styles.checkbox,
            { borderColor: colors.border.medium },
            project.isCompleted && [styles.checkboxChecked, { backgroundColor: colors.brand.primary }]
          ]}
          onPress={() => onToggleComplete(project.id, project.isCompleted)}
          activeOpacity={0.7}
        >
          {project.isCompleted && <FeatherIcon name="check" size={12} color={colors.text.inverse} />}
        </TouchableOpacity>
        <Text style={[styles.checkboxLabel, { color: colors.text.secondary }]}>
          {project.isCompleted ? 'Completed' : 'Mark as complete'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  projectItem: {
    borderRadius: 12,
    borderWidth: 3,
    padding: 20,
    marginBottom: 16,
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 8,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  projectDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  projectMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  projectMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 4,
  },
  projectMetaText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderWidth: 1.5,
  },
  checkboxLabel: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '-1deg' }],
  },
}); 