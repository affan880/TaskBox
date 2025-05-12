import * as React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { TaskData } from '@/types/task';

type Props = {
  task: TaskData;
  onPress: (taskId: string) => void;
  showTime?: boolean;
  showTags?: boolean;
  maxTags?: number;
};

export function CalendarTaskItem({ task, onPress, showTime = true, showTags = true, maxTags = 2 }: Props) {
  const { colors, isDark } = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.status.error;
      case 'medium':
        return colors.status.warning;
      default:
        return colors.status.success;
    }
  };

  const priorityColor = getPriorityColor(task.priority);

  return (
    <TouchableOpacity
      onPress={() => onPress(task.id)}
      style={{
        backgroundColor: colors.surface.primary,
        borderRadius: 12,
        borderWidth: 4,
        borderColor: colors.text.primary,
        padding: 16,
        marginBottom: 16,
        transform: [{ 
          rotate: task.priority === 'high' 
            ? '-2deg' 
            : task.priority === 'medium'
            ? '1deg'
            : '2deg' 
        }],
        shadowColor: colors.text.primary,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 0,
        elevation: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: priorityColor,
            marginRight: 12,
            borderWidth: 3,
            borderColor: colors.text.primary,
            transform: [{ rotate: '-2deg' }],
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.text.primary,
              marginBottom: 4,
              textDecorationLine: task.isCompleted ? 'line-through' : 'none',
            }}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          {task.description && (
            <Text
              style={{
                fontSize: 14,
                color: colors.text.secondary,
                marginBottom: showTime || showTags ? 8 : 0,
                fontWeight: '500',
              }}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            {showTime && task.dueDate && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: `${priorityColor}20`,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: priorityColor,
                  transform: [{ rotate: '-1deg' }],
                }}
              >
                <FeatherIcon name="clock" size={14} color={priorityColor} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 14, color: priorityColor, fontWeight: '600' }}>
                  {format(new Date(task.dueDate), 'h:mm a')}
                </Text>
              </View>
            )}
            {showTags && task.tags && task.tags.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {task.tags.slice(0, maxTags).map((tag, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: `${colors.brand.primary}20`,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: colors.brand.primary,
                      transform: [{ rotate: index % 2 === 0 ? '1deg' : '-1deg' }],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.brand.primary,
                        fontWeight: '600',
                      }}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
                {task.tags.length > maxTags && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.text.secondary,
                      fontWeight: '600',
                    }}
                  >
                    +{task.tags.length - maxTags}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
        <FeatherIcon
          name="chevron-right"
          size={24}
          color={colors.text.secondary}
          style={{ marginLeft: 8 }}
        />
      </View>
    </TouchableOpacity>
  );
} 