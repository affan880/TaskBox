import * as React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal, ScrollView, StyleSheet } from 'react-native';
import { TaskData } from '@/types/task';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { shareTaskViaEmail } from '@/api/task-share-api';
import { useToast } from '@/components/ui/toast';

type TaskShareModalProps = {
  isVisible: boolean;
  onClose: () => void;
  task: TaskData;
};

export function TaskShareModal({ isVisible, onClose, task }: TaskShareModalProps) {
  const [emails, setEmails] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');
  const [isSharing, setIsSharing] = React.useState<boolean>(false);
  const toast = useToast();

  const handleShare = async () => {
    if (!emails.trim()) {
      toast.showToast('Please enter at least one email address', 'error');
      return;
    }

    // Split and clean email addresses
    const emailList = emails
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      toast.showToast(`The following emails are invalid: ${invalidEmails.join(', ')}`, 'error');
      return;
    }

    try {
      setIsSharing(true);
      await shareTaskViaEmail({
        task,
        emails: emailList,
        message,
      });
      
      toast.showToast('Task shared successfully', 'success');
      
      // Reset form and close modal
      setEmails('');
      setMessage('');
      onClose();
    } catch (error) {
      toast.showToast('Failed to share the task. Please try again.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Task</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Task Details</Text>
              <View style={styles.taskCard}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.description ? (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                ) : null}
                <Text style={styles.taskDue}>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Email Recipients</Text>
              <TextInput
                style={styles.emailInput}
                placeholder="Enter email addresses (comma separated)"
                value={emails}
                onChangeText={setEmails}
                multiline
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Text style={styles.helperText}>
                Example: john@example.com, jane@example.com
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Optional Message</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Add a personal message (optional)"
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.shareButton, isSharing && styles.sharingButton]}
              onPress={handleShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.buttonText}>Sharing...</Text>
                </>
              ) : (
                <>
                  <Icon name="share" size={18} color="white" />
                  <Text style={styles.buttonText}>Share Task</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  taskCard: {
    backgroundColor: '#f1f1f1',
    padding: 16,
    borderRadius: 8,
  },
  taskTitle: {
    fontWeight: 'bold',
  },
  taskDescription: {
    color: '#333',
    marginTop: 4,
  },
  taskDue: {
    color: '#666',
    marginTop: 8,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 16,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    fontSize: 16,
  },
  shareButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  sharingButton: {
    backgroundColor: '#7DABF5',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
}); 