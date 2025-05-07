import * as React from 'react';
import { View, TouchableOpacity, Text, ScrollView, Animated } from 'react-native';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { format, startOfMonth, endOfMonth, isToday, parseISO } from 'date-fns';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import type { TaskData } from '@/types/task';
import { createStyles } from '../styles';

type Props = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  tasks: TaskData[];
  onNavigate: (screen: string, params?: any) => void;
  viewMode: 'month' | 'week' | 'day';
  setViewMode: (mode: 'month' | 'week' | 'day') => void;
  visibleDates: { start: Date; end: Date };
  setVisibleDates: (dates: { start: Date; end: Date }) => void;
};

export function CalendarSection({
  selectedDate,
  setSelectedDate,
  tasks,
  onNavigate,
  viewMode,
  setViewMode,
  visibleDates,
  setVisibleDates,
}: Props) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Fade in animation
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Get tasks for selected date
  const selectedDateTasks = React.useMemo(() => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return tasks
      .filter(task => {
        if (!task.dueDate) return false;
        // Handle ISO date strings
        const taskDate = format(new Date(task.dueDate), 'yyyy-MM-dd');
        return taskDate === selectedDateStr;
      })
      .sort((a, b) => {
        // Sort by priority first
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by completion status
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;

        // Finally by title
        return a.title.localeCompare(b.title);
      });
  }, [tasks, selectedDate]);

  // Prepare marked dates for calendar
  const markedDates = React.useMemo(() => {
    const marks: { [key: string]: any } = {};
    
    tasks.forEach(task => {
      if (task.dueDate) {
        // Handle ISO date strings
        const dateStr = format(new Date(task.dueDate), 'yyyy-MM-dd');
        const existingMarks = marks[dateStr] || {
          dots: [],
          marked: true,
        };

        existingMarks.dots.push({
          color: task.priority === 'high' ? colors.status.error :
                 task.priority === 'medium' ? colors.status.warning :
                 colors.status.success,
          key: task.id
        });

        if (task.isCompleted) {
          existingMarks.dotColor = colors.status.success;
        }

        marks[dateStr] = existingMarks;
      }
    });

    // Mark selected date
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    marks[selectedDateStr] = {
      ...marks[selectedDateStr],
      selected: true,
      selectedColor: colors.brand.primary,
      selectedTextColor: colors.text.inverse
    };

    return marks;
  }, [tasks, selectedDate, colors]);

  const renderTaskItem = React.useCallback((task: TaskData) => (
    <TouchableOpacity
      key={task.id}
      style={[styles.calendarTaskItem, { backgroundColor: colors.surface.primary }]}
      onPress={() => onNavigate('TaskDetail', { taskId: task.id })}
    >
      <View 
        style={[
          styles.calendarTaskPriorityIndicator,
          { 
            backgroundColor: task.priority === 'high' ? colors.status.error :
                           task.priority === 'medium' ? colors.status.warning :
                           colors.status.success
          }
        ]} 
      />
      <View style={styles.calendarTaskContent}>
        <Text style={[styles.calendarTaskTitle, { color: colors.text.primary }]}>
          {task.title}
        </Text>
        {task.description && (
          <Text 
            style={[styles.calendarTaskDescription, { color: colors.text.secondary }]}
            numberOfLines={2}
          >
            {task.description}
          </Text>
        )}
        <View style={styles.calendarTaskMeta}>
          {task.estimatedTime && (
            <View style={styles.calendarTaskTime}>
              <FeatherIcon name="clock" size={12} color={colors.text.secondary} />
              <Text style={[styles.calendarTaskTimeText, { color: colors.text.secondary }]}>
                {task.estimatedTime} min
              </Text>
            </View>
          )}
          {task.tags && task.tags.length > 0 && (
            <View style={styles.calendarTaskTags}>
              {task.tags.slice(0, 2).map(tag => (
                <View 
                  key={tag}
                  style={[styles.calendarTaskTag, { backgroundColor: colors.surface.secondary }]}
                >
                  <Text style={[styles.calendarTaskTagText, { color: colors.text.secondary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
              {task.tags.length > 2 && (
                <View style={[styles.calendarTaskTag, { backgroundColor: colors.surface.secondary }]}>
                  <Text style={[styles.calendarTaskTagText, { color: colors.text.secondary }]}>
                    +{task.tags.length - 2}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
      <View 
        style={[
          styles.calendarTaskStatus,
          { 
            backgroundColor: task.isCompleted ? colors.status.success :
                           task.status === 'in-progress' ? colors.status.warning :
                           colors.surface.secondary
          }
        ]}
      >
        <Text 
          style={[
            styles.calendarTaskStatusText,
            { 
              color: task.isCompleted || task.status === 'in-progress' ? 
                     colors.text.inverse : colors.text.secondary
            }
          ]}
        >
          {task.isCompleted ? 'Done' : task.status}
        </Text>
      </View>
    </TouchableOpacity>
  ), [colors, onNavigate, styles]);

  return (
    <ScrollView 
      style={[
        styles.calendarContainer,
        { marginBottom: 0 } // Remove bottom margin since parent handles padding
      ]}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.calendarSection}>
        <RNCalendar
          current={format(selectedDate, 'yyyy-MM-dd')}
          onDayPress={(day: DateData) => {
            // Create date at midnight in local timezone to avoid date shifting
            const newDate = new Date(day.year, day.month - 1, day.day, 12, 0, 0);
            setSelectedDate(newDate);
          }}
          onDayLongPress={(day: DateData) => {
            // Create date at midnight in local timezone to avoid date shifting
            const newDate = new Date(day.year, day.month - 1, day.day, 12, 0, 0);
            setSelectedDate(newDate);
            // Pass serialized date string instead of Date object
            onNavigate('TaskCreation', { date: format(newDate, 'yyyy-MM-dd') });
          }}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={{
            backgroundColor: colors.background.primary,
            calendarBackground: colors.background.primary,
            textSectionTitleColor: colors.text.secondary,
            selectedDayBackgroundColor: colors.brand.primary,
            selectedDayTextColor: colors.text.inverse,
            todayTextColor: colors.brand.primary,
            dayTextColor: colors.text.primary,
            textDisabledColor: colors.text.tertiary,
            dotColor: colors.brand.primary,
            selectedDotColor: colors.text.inverse,
            arrowColor: colors.brand.primary,
            monthTextColor: colors.text.primary,
            indicatorColor: colors.brand.primary,
            textDayFontWeight: '500',
            textMonthFontWeight: '600',
            textDayHeaderFontWeight: '500',
          }}
          enableSwipeMonths
          hideExtraDays
          firstDay={1}
          showWeekNumbers
          onMonthChange={(date) => {
            // Create date at midnight in local timezone to avoid date shifting
            const newDate = new Date(date.year, date.month - 1, date.day, 12, 0, 0);
            setVisibleDates({
              start: startOfMonth(newDate),
              end: endOfMonth(newDate)
            });
          }}
        />
      </View>

      <Animated.View 
        style={[
          styles.selectedDateSection,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.selectedDateHeader}>
          <Text style={[styles.selectedDateTitle, { color: colors.text.primary }]}>
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMMM d, yyyy')}
            {selectedDateTasks.length > 0 && ` • ${selectedDateTasks.length} task${selectedDateTasks.length === 1 ? '' : 's'}`}
          </Text>
          <TouchableOpacity 
            style={styles.addTaskButton}
            onPress={() => onNavigate('TaskCreation', { date: format(selectedDate, 'yyyy-MM-dd') })}
          >
            <FeatherIcon name="plus" size={20} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>

        {selectedDateTasks.length > 0 ? (
          <View style={styles.taskListContainer}>
            {selectedDateTasks.map(renderTaskItem)}
          </View>
        ) : (
          <View style={[styles.emptyDateContainer, { backgroundColor: colors.surface.primary }]}>
            <FeatherIcon name="calendar" size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyDateText, { color: colors.text.secondary }]}>
              No tasks scheduled for this day
            </Text>
            <TouchableOpacity 
              style={styles.addTaskButton}
              onPress={() => onNavigate('TaskCreation', { date: format(selectedDate, 'yyyy-MM-dd') })}
            >
              <FeatherIcon name="plus" size={20} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
} 