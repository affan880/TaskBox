import * as React from 'react';
import { View, TouchableOpacity, Text, ScrollView, Animated } from 'react-native';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { format, startOfMonth, endOfMonth, isToday, parseISO } from 'date-fns';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import type { TaskData } from '@/types/task';
import { createStyles } from '../styles';
import { CalendarTaskItem } from './calendar-task-item';
import { useFilteredTasks } from '../hooks/use-filtered-tasks';

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

  // Use the shared hook for filtering and sorting
  const selectedDateTasks = useFilteredTasks(tasks, { date: selectedDate });

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

        {selectedDateTasks.length > 0 && (
          <View style={styles.calendarSection}>
            <Text style={[styles.calendarTaskTitle, { color: colors.text.primary }]}>
              Tasks for {format(selectedDate, 'MMMM d, yyyy')}
            </Text>
            <View style={styles.taskListContainer}>
              {selectedDateTasks.map(task => (
                <CalendarTaskItem
                  key={task.id}
                  task={task}
                  onPress={(taskId: string) => onNavigate('TaskDetail', { taskId })}
                  showTime={true}
                  showTags={true}
                  maxTags={2}
                />
              ))}
            </View>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
} 