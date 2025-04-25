import * as React from 'react';
import { 
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { TaskData, TaskAttachment } from '@/types/task';
import { FileAttachmentsList } from '../file-attachments-list';
import * as DocumentPicker from '@react-native-documents/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Example task data
const EXAMPLE_TASK: TaskData = {
  id: 'task-example-1',
  title: 'Review project proposal',
  description: 'Review the project proposal document and provide feedback on scope and timeline',
  isCompleted: false,
  priority: 'high',
  tags: ['documentation', 'review'],
  dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  attachments: [
    {
      id: 'att-1',
      name: 'Project Proposal.pdf',
      type: 'application/pdf',
      size: 2456000,
      uri: 'file://example/proposal.pdf',
      downloadUrl: 'https://example.com/files/proposal.pdf',
      createdAt: new Date().toISOString()
    },
    {
      id: 'att-2',
      name: 'Budget.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1245000,
      uri: 'file://example/budget.xlsx',
      downloadUrl: 'https://example.com/files/budget.xlsx',
      createdAt: new Date().toISOString()
    },
    {
      id: 'att-3',
      name: 'Team Structure.png',
      type: 'image/png',
      size: 768000,
      uri: 'file://example/team.png',
      downloadUrl: 'https://example.com/files/team.png',
      createdAt: new Date().toISOString()
    },
    {
      id: 'att-4',
      name: 'Notes.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 589000,
      uri: 'file://example/notes.docx',
      downloadUrl: 'https://example.com/files/notes.docx',
      createdAt: new Date().toISOString()
    }
  ]
};

export function TaskAttachmentsExample() {
  const { colors } = useTheme();
  const [task, setTask] = React.useState<TaskData>(EXAMPLE_TASK);
  const [isEditing, setIsEditing] = React.useState(false);
  
  // Handler for adding a new attachment
  const handleAddAttachment = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });
      
      // Create new attachment objects
      const newAttachments: TaskAttachment[] = results.map(file => ({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name || 'Unnamed file',
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        size: file.size || 0,
        createdAt: new Date().toISOString(),
        // In a real implementation, these would be populated after upload
        downloadUrl: 'https://example.com/files/example.pdf',
        isUploading: false,
      }));
      
      // Update the task with new attachments
      setTask(prevTask => ({
        ...prevTask,
        attachments: [...prevTask.attachments, ...newAttachments]
      }));
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
      } else {
        Alert.alert('Error', 'Failed to add attachment');
        console.error('Error adding attachment:', err);
      }
    }
  };
  
  // Handler for removing an attachment
  const handleRemoveAttachment = (id: string) => {
    setTask(prevTask => ({
      ...prevTask,
      attachments: prevTask.attachments.filter(att => att.id !== id)
    }));
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(prev => !prev);
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {task.title}
        </Text>
        
        <TouchableOpacity
          onPress={toggleEditMode}
          style={[
            styles.editButton,
            { backgroundColor: isEditing ? colors.brand.primary : colors.brand.light }
          ]}
        >
          <Icon 
            name={isEditing ? 'check' : 'edit'} 
            size={20} 
            color={isEditing ? colors.text.inverse : colors.brand.primary} 
          />
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.description, { color: colors.text.secondary }]}>
        {task.description}
      </Text>
      
      <View style={[styles.divider, { backgroundColor: colors.border.light }]} />
      
      <FileAttachmentsList
        attachments={task.attachments}
        isEditable={isEditing}
        onAddAttachment={handleAddAttachment}
        onRemoveAttachment={handleRemoveAttachment}
        maxVisible={3}
      />
      
      <View style={styles.instructions}>
        <Text style={[styles.instructionsTitle, { color: colors.text.primary }]}>
          Instructions for Using Attachments:
        </Text>
        <Text style={[styles.instructionsText, { color: colors.text.secondary }]}>
          1. Click the Edit button to enter edit mode
        </Text>
        <Text style={[styles.instructionsText, { color: colors.text.secondary }]}>
          2. Use the "Add" button to attach new files
        </Text>
        <Text style={[styles.instructionsText, { color: colors.text.secondary }]}>
          3. Click on an attachment to download/view it
        </Text>
        <Text style={[styles.instructionsText, { color: colors.text.secondary }]}>
          4. In edit mode, you can remove attachments
        </Text>
        <Text style={[styles.instructionsText, { color: colors.text.secondary }]}>
          5. Click "Show More" to see all attachments
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  instructions: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    marginBottom: 4,
  },
}); 