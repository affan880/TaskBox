import * as React from 'react';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { useTaskStore } from '@/store/task-store';
import { useProjectStore } from '@/store/project-store';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Button } from '@/components/ui/button';
import { TaskData, TaskPriority, TaskStatus, RecurringInterval } from '@/types/task';

type RootStackParamList = {
  TaskList: { tasks: TaskData[] };
  ProjectDetail: { projectId?: string };
  TaskCreation: undefined;
  AllTasks: undefined;
};

type NavigationPropType = NavigationProp<RootStackParamList>;

export function TaskCreationScreen() {
  const navigation = useNavigation<NavigationPropType>();
  const { colors, isDark } = useTheme();
  const { addTask } = useTaskStore();
  const { projects } = useProjectStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>('weekly');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [notes, setNotes] = useState('');
  const [reminder, setReminder] = useState<Date | null>(null);
  const [progress, setProgress] = useState(0);

  const handleGoBack = () => navigation.goBack();

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const newTask: TaskData = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId: selectedProjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        isCompleted: false,
        status,
        dueDate: dueDate || undefined,
        priority,
        tags,
        attachments: [],
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
        notes: notes.trim() || undefined,
        reminder: reminder ? reminder.toISOString() : undefined,
        progress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addTask(newTask);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Create Task
        </Text>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: colors.brand.primary }]}
          onPress={handleCreateTask}
          disabled={isSubmitting}
        >
          <Text style={[styles.createButtonText, { color: colors.text.inverse }]}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView style={styles.scrollView}>
          {/* Title Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.titleInput,
                { 
                  backgroundColor: colors.surface.primary,
                  color: colors.text.primary,
                  borderColor: colors.border.medium
                }
              ]}
              placeholder="Task title"
              placeholderTextColor={colors.text.secondary}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.textArea,
                { 
                  backgroundColor: colors.surface.primary,
                  color: colors.text.primary,
                  borderColor: colors.border.medium
                }
              ]}
              placeholder="Add description..."
              placeholderTextColor={colors.text.secondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.surface.primary }]}
              onPress={() => setPriority('high')}
            >
              <FeatherIcon 
                name="flag" 
                size={20} 
                color={priority === 'high' ? colors.status.error : colors.text.secondary} 
              />
              <Text 
                style={[
                  styles.quickActionText,
                  { color: priority === 'high' ? colors.status.error : colors.text.secondary }
                ]}
              >
                High
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.surface.primary }]}
              onPress={() => setPriority('medium')}
            >
              <FeatherIcon 
                name="flag" 
                size={20} 
                color={priority === 'medium' ? colors.status.warning : colors.text.secondary} 
              />
              <Text 
                style={[
                  styles.quickActionText,
                  { color: priority === 'medium' ? colors.status.warning : colors.text.secondary }
                ]}
              >
                Medium
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.surface.primary }]}
              onPress={() => setPriority('low')}
            >
              <FeatherIcon 
                name="flag" 
                size={20} 
                color={priority === 'low' ? colors.status.success : colors.text.secondary} 
              />
              <Text 
                style={[
                  styles.quickActionText,
                  { color: priority === 'low' ? colors.status.success : colors.text.secondary }
                ]}
              >
                Low
              </Text>
            </TouchableOpacity>
          </View>

          {/* Due Date Picker */}
          <View style={styles.inputContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Due Date</Text>
            <DatePickerInput
              label="Select due date"
              value={dueDate}
              onChange={setDueDate}
              minimumDate={new Date()}
            />
          </View>

          {/* Project Selection */}
          <View style={styles.inputContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Project</Text>
            <View style={[styles.projectSelector, { backgroundColor: colors.surface.primary }]}>
              {projects.map(project => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectOption,
                    selectedProjectId === project.id && {
                      backgroundColor: colors.brand.primary,
                    }
                  ]}
                  onPress={() => setSelectedProjectId(project.id)}
                >
                  <Text
                    style={[
                      styles.projectOptionText,
                      { color: selectedProjectId === project.id ? colors.text.inverse : colors.text.primary }
                    ]}
                  >
                    {project.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status Selection */}
          <View style={styles.inputContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Status</Text>
            <View style={styles.statusContainer}>
              {(['todo', 'in-progress', 'completed'] as TaskStatus[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusButton,
                    { 
                      backgroundColor: colors.surface.primary,
                      borderColor: colors.border.medium,
                      borderWidth: status === s ? 2 : 1
                    }
                  ]}
                  onPress={() => setStatus(s)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { 
                        color: status === s ? colors.brand.primary : colors.text.secondary
                      }
                    ]}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Estimated Time */}
          <View style={styles.inputContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Estimated Time</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.surface.primary,
                  color: colors.text.primary,
                  borderColor: colors.border.medium
                }
              ]}
              placeholder="Enter time in minutes"
              placeholderTextColor={colors.text.secondary}
              value={estimatedTime}
              onChangeText={setEstimatedTime}
              keyboardType="numeric"
            />
          </View>

          {/* Progress */}
          <View style={styles.inputContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Progress</Text>
            <View style={[styles.progressBar, { backgroundColor: colors.surface.secondary }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress}%`,
                    backgroundColor: colors.brand.primary
                  }
                ]} 
              />
            </View>
            <View style={styles.progressButtons}>
              {[0, 25, 50, 75, 100].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.progressButton,
                    { 
                      backgroundColor: colors.surface.primary,
                      borderColor: colors.border.medium,
                      borderWidth: progress === value ? 2 : 1
                    }
                  ]}
                  onPress={() => setProgress(value)}
                >
                  <Text
                    style={[
                      styles.progressButtonText,
                      { 
                        color: progress === value ? colors.brand.primary : colors.text.secondary
                      }
                    ]}
                  >
                    {value}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tags */}
          <View style={styles.inputContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[
                  styles.tagInput,
                  { 
                    backgroundColor: colors.surface.primary,
                    color: colors.text.primary,
                    borderColor: colors.border.medium
                  }
                ]}
                placeholder="Add a tag"
                placeholderTextColor={colors.text.secondary}
                value={currentTag}
                onChangeText={setCurrentTag}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity
                style={[styles.addTagButton, { backgroundColor: colors.brand.primary }]}
                onPress={handleAddTag}
              >
                <Icon name="add" size={20} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.brand.primary }]}
                >
                  <Text style={[styles.tagText, { color: colors.text.inverse }]}>{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                    <Icon name="close" size={16} color={colors.text.inverse} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Notes</Text>
            <TextInput
              style={[
                styles.textArea,
                { 
                  backgroundColor: colors.surface.primary,
                  color: colors.text.primary,
                  borderColor: colors.border.medium
                }
              ]}
              placeholder="Add notes..."
              placeholderTextColor={colors.text.secondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  projectSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  projectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  projectOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  progressButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 