import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import type { TaskData, TaskPriority, TaskStatus } from '@/types/task';

type Props = {
  task: TaskData;
  onPress: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
};

export function TaskCard({ task, onPress, onDelete, onToggleComplete }: Props) {
  const { colors, isDark } = useTheme();

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return colors.status.error;
      case 'medium':
        return colors.status.warning;
      case 'low':
        return colors.status.success;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return colors.text.secondary;
      case 'in-progress':
        return colors.status.warning;
      case 'completed':
        return colors.status.success;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'radio-button-unchecked';
      case 'in-progress':
        return 'pending';
      case 'completed':
        return 'check-circle';
      default:
        return 'radio-button-unchecked';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface.primary }
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            { borderColor: task.isCompleted ? colors.brand.primary : colors.border.medium }
          ]}
          onPress={onToggleComplete}
        >
          {task.isCompleted && (
            <FeatherIcon name="check" size={16} color={colors.brand.primary} />
          )}
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              { color: colors.text.primary },
              task.isCompleted && styles.completedTitle
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          
          {task.description && (
            <Text
              style={[styles.description, { color: colors.text.secondary }]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
        >
          <Icon name="delete-outline" size={20} color={colors.status.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.metadata}>
          {/* Status */}
          <View style={styles.metadataItem}>
            <Icon
              name={getStatusIcon(task.status)}
              size={16}
              color={getStatusColor(task.status)}
            />
            <Text style={[styles.metadataText, { color: colors.text.secondary }]}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Text>
          </View>

          {/* Priority */}
          <View style={styles.metadataItem}>
            <Icon
              name="priority-high"
              size={16}
              color={getPriorityColor(task.priority)}
            />
            <Text style={[styles.metadataText, { color: colors.text.secondary }]}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Text>
          </View>

          {/* Due Date */}
          {task.dueDate && (
            <View style={styles.metadataItem}>
              <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
              <Text style={[styles.metadataText, { color: colors.text.secondary }]}>
                {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Progress */}
        {task.estimatedTime && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.surface.secondary }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${task.progress || 0}%`,
                    backgroundColor: task.isCompleted ? colors.status.success : colors.brand.primary
                  }
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text.secondary }]}>
              {task.progress}%
            </Text>
          </View>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {task.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: colors.brand.primary }]}
              >
                <Text style={[styles.tagText, { color: colors.text.inverse }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
  },
  footer: {
    marginTop: 8,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    minWidth: 40,
    textAlign: 'right',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 