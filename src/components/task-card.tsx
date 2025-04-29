import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Pressable
} from 'react-native';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TaskData } from '@/types/task';
import { formatDate, formatRelativeTime } from '@/utils/formatting';

type TaskCardProps = {
  task: TaskData;
  onPress?: (taskId: string) => void;
  onLongPress?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  isSelected?: boolean;
  hideDetails?: boolean;
};

export function TaskCard({
  task,
  onPress,
  onLongPress,
  onToggleComplete,
  onDelete,
  isSelected = false,
  hideDetails = false
}: TaskCardProps) {
  const { colors } = useTheme();

  const priorityColors = {
    high: colors.status.error,
    medium: colors.status.warning,
    low: colors.status.success,
  };

  const handlePress = () => {
    if (onPress) {
      onPress(task.id);
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(task.id);
    }
  };

  const handleToggleComplete = (e: any) => {
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete(task.id);
    }
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(task.id);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isSelected
            ? `${colors.brand.primary}20`
            : pressed
            ? `${colors.surface.card}80`
            : colors.surface.card,
          borderColor: isSelected ? colors.brand.primary : colors.border.medium,
          opacity: task.isCompleted ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleToggleComplete}
          style={[
            styles.checkbox,
            {
              borderColor: colors.border.medium,
              backgroundColor: task.isCompleted ? colors.brand.primary : 'transparent',
            },
          ]}
        >
          {task.isCompleted && (
            <Icon name="check" size={16} color={colors.text.inverse} />
          )}
        </TouchableOpacity>
        
        <Text
          style={[
            styles.title,
            {
              color: colors.text.primary,
              textDecorationLine: task.isCompleted ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        
        <View style={styles.headerRight}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityColors[task.priority] },
            ]}
          >
            <Text style={styles.priorityText}>
              {task.priority.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          {onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteButton}
            >
              <Icon name="delete" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!hideDetails && !task.isCompleted && (
        <>
          {task.description && (
            <Text 
              style={[styles.description, { color: colors.text.secondary }]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}

          <View style={styles.footer}>
            {task.dueDate && (
              <View style={styles.footerItem}>
                <Icon name="event" size={12} color={colors.text.secondary} />
                <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                  {formatDate(new Date(task.dueDate))}
                </Text>
              </View>
            )}

            {task.tags && task.tags.length > 0 && (
              <View style={styles.footerItem}>
                <Icon name="label" size={12} color={colors.text.secondary} />
                <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                  {task.tags.slice(0, 2).join(', ')}
                  {task.tags.length > 2 && '...'}
                </Text>
              </View>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <View style={styles.footerItem}>
                <Icon name="attachment" size={12} color={colors.text.secondary} />
                <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                  {task.attachments.length}
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {!hideDetails && task.isCompleted && (
        <Text style={[styles.completedText, { color: colors.text.secondary }]}>
          Completed {formatRelativeTime(task.updatedAt)}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    marginLeft: 4,
  },
  completedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
}); 