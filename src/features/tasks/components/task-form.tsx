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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Button } from '@/components/ui/button';
import type { TaskData, TaskPriority, TaskStatus } from '@/types/task';

type Props = {
  task?: TaskData;
  onSave: (taskData: Partial<TaskData>) => void;
  onCancel: () => void;
  title?: string;
};

export function TaskForm({ task, onSave, onCancel, title = 'Create Task' }: Props) {
  const { colors, isDark } = useTheme();
  
  const [taskTitle, setTaskTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState<Date | null>(task?.dueDate ? new Date(task.dueDate) : null);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [estimatedTime, setEstimatedTime] = useState(task?.estimatedTime?.toString() || '');
  const [progress, setProgress] = useState(task?.progress || 0);
  const [notes, setNotes] = useState(task?.notes || '');
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [currentTag, setCurrentTag] = useState('');

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    onSave({
      title: taskTitle.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate?.toISOString(),
      priority,
      status,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
      progress,
      notes: notes.trim() || undefined,
      tags,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.content, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {title}
          </Text>
          <TouchableOpacity onPress={onCancel}>
            <Icon name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.body}>
          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Title</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.surface.primary,
                  color: colors.text.primary,
                  borderColor: colors.border.medium
                }
              ]}
              placeholder="Enter task title"
              placeholderTextColor={colors.text.secondary}
              value={taskTitle}
              onChangeText={setTaskTitle}
              autoFocus
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  backgroundColor: colors.surface.primary,
                  color: colors.text.primary,
                  borderColor: colors.border.medium
                }
              ]}
              placeholder="Enter task description (optional)"
              placeholderTextColor={colors.text.secondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Status Selection */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Status</Text>
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

          {/* Due Date Picker */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Due Date</Text>
            <DatePickerInput
              label="Select due date"
              value={dueDate}
              onChange={setDueDate}
              minimumDate={new Date()}
            />
          </View>

          {/* Priority Selection */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Priority</Text>
            <View style={styles.priorityContainer}>
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    { 
                      backgroundColor: colors.surface.primary,
                      borderColor: colors.border.medium,
                      borderWidth: priority === p ? 2 : 1
                    }
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      { 
                        color: priority === p ? colors.brand.primary : colors.text.secondary
                      }
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Estimated Time */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Estimated Time (minutes)</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.surface.primary,
                  color: colors.text.primary,
                  borderColor: colors.border.medium
                }
              ]}
              placeholder="Enter estimated time"
              placeholderTextColor={colors.text.secondary}
              value={estimatedTime}
              onChangeText={setEstimatedTime}
              keyboardType="numeric"
            />
          </View>

          {/* Progress */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Progress ({progress}%)</Text>
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

          {/* Notes */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Notes</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  backgroundColor: colors.surface.primary,
                  color: colors.text.primary,
                  borderColor: colors.border.medium
                }
              ]}
              placeholder="Add notes (optional)"
              placeholderTextColor={colors.text.secondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Tags */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Tags</Text>
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
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { borderTopColor: colors.border.light }]}>
          <Button
            variant="primary"
            onPress={handleSave}
            style={styles.saveButton}
          >
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    width: '100%',
  },
}); 