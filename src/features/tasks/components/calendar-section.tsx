import * as React from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { format, startOfMonth, endOfMonth, isToday, isSameDay } from 'date-fns';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { TaskData } from '@/types/task';
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

  // Get tasks for selected date
  const selectedDateTasks = React.useMemo(() => {
    return tasks.filter(task => 
      task.dueDate && isSameDay(new Date(task.dueDate), selectedDate)
    );
  }, [tasks, selectedDate]);

  // Get tasks for visible date range
  const visibleDateTasks = React.useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= visibleDates.start && taskDate <= visibleDates.end;
    });
  }, [tasks, visibleDates]);

  // Prepare marked dates for calendar
  const markedDates = React.useMemo(() => {
    const marks: { [key: string]: any } = {};
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateStr = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!marks[dateStr]) {
          marks[dateStr] = {
            marked: true,
            dotColor: task.isCompleted ? colors.status.success : colors.status.warning,
            dots: [{
              color: task.priority === 'high' ? colors.status.error :
                     task.priority === 'medium' ? colors.status.warning :
                     colors.status.success,
              key: task.id
            }]
          };
        } else {
          marks[dateStr].dots.push({
            color: task.priority === 'high' ? colors.status.error :
                   task.priority === 'medium' ? colors.status.warning :
                   colors.status.success,
            key: task.id
          });
        }
      }
    });

    // Mark selected date
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    marks[selectedDateStr] = {
      ...marks[selectedDateStr],
      selected: true,
      selectedColor: colors.brand.primary
    };

    return marks;
  }, [tasks, selectedDate, colors]);

  return (
    <ScrollView style={styles.calendarContainer}>
      {/* Calendar Section */}
      <View style={styles.calendarSection}>
        <RNCalendar
          current={format(selectedDate, 'yyyy-MM-dd')}
          onDayPress={(day: DateData) => {
            const newDate = new Date(day.year, day.month - 1, day.day);
            setSelectedDate(newDate);
          }}
          onDayLongPress={(day: DateData) => {
            const newDate = new Date(day.year, day.month - 1, day.day);
            setSelectedDate(newDate);
            onNavigate('TaskCreation', { date: newDate });
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
            const newDate = new Date(date.timestamp);
            setVisibleDates({
              start: startOfMonth(newDate),
              end: endOfMonth(newDate)
            });
          }}
          onPressArrowLeft={(subtractMonth) => subtractMonth()}
          onPressArrowRight={(addMonth) => addMonth()}
          disableAllTouchEventsForDisabledDays
        />
      </View>

      {/* Selected Date Tasks */}
      <View style={styles.selectedDateSection}>
        <View style={styles.selectedDateHeader}>
          <Text style={[styles.selectedDateTitle, { color: colors.text.primary }]}>
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMMM d, yyyy')}
          </Text>
          <TouchableOpacity 
            style={[styles.addTaskButton, { backgroundColor: colors.brand.primary }]}
            onPress={() => onNavigate('TaskCreation', { date: selectedDate })}
          >
            <FeatherIcon name="plus" size={20} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>

        {selectedDateTasks.length > 0 ? (
          <View style={styles.taskListContainer}>
            {selectedDateTasks.map(task => (
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
                    <Text style={[styles.calendarTaskDescription, { color: colors.text.secondary }]}>
                      {task.description}
                    </Text>
                  )}
                  <View style={styles.calendarTaskMeta}>
                    <View style={styles.calendarTaskTime}>
                      <FeatherIcon name="clock" size={12} color={colors.text.secondary} />
                      <Text style={[styles.calendarTaskTimeText, { color: colors.text.secondary }]}>
                        {task.estimatedTime ? `${task.estimatedTime} min` : 'No time estimate'}
                      </Text>
                    </View>
                    {task.tags && task.tags.length > 0 && (
                      <View style={styles.calendarTaskTags}>
                        {task.tags.map(tag => (
                          <View 
                            key={tag}
                            style={[styles.calendarTaskTag, { backgroundColor: colors.surface.secondary }]}
                          >
                            <Text style={[styles.calendarTaskTagText, { color: colors.text.secondary }]}>
                              {tag}
                            </Text>
                          </View>
                        ))}
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
                        color: task.isCompleted ? colors.text.inverse :
                               task.status === 'in-progress' ? colors.text.inverse :
                               colors.text.secondary
                      }
                    ]}
                  >
                    {task.isCompleted ? 'Done' : task.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyDateContainer, { backgroundColor: colors.surface.primary }]}>
            <FeatherIcon name="calendar" size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyDateText, { color: colors.text.secondary }]}>
              No tasks scheduled for this day
            </Text>
            <TouchableOpacity 
              style={[styles.addTaskButton, { backgroundColor: colors.brand.primary }]}
              onPress={() => onNavigate('TaskCreation', { date: selectedDate })}
            >
              <FeatherIcon name="plus" size={20} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
} 