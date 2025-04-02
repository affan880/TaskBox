import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  RefreshControl, 
  SafeAreaView, 
  Text, 
  TouchableOpacity, 
  View, 
  Modal, 
  TextInput, 
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGmail } from '../../hooks/use-gmail';
import { EmailData } from '../../utils/gmail-api';

/**
 * Simple HTML to text parser to extract readable content from HTML emails
 */
function parseHtmlContent(html: string): string {
  if (!html) return '';
  
  // Remove DOCTYPE, HTML, HEAD sections
  let content = html.replace(/<head[\s\S]*?<\/head>/gi, '')
                   .replace(/<style[\s\S]*?<\/style>/gi, '')
                   .replace(/<script[\s\S]*?<\/script>/gi, '');
  
  // Replace common tags with line breaks or spacing
  content = content
    .replace(/<\/div>|<\/p>|<\/h[1-6]>|<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<hr\s*\/?>/gi, '\n-------------------------\n')
    .replace(/<tr>/gi, '\n')
    .replace(/<\/td>|<\/th>/gi, '  ');
  
  // Remove all remaining HTML tags
  content = content.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  content = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Remove excessive whitespace
  content = content
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/  +/g, ' ')
    .trim();
  
  return content;
}

// Compose Email Modal as a separate component
const ComposeEmailModal = ({ 
  visible, 
  onClose, 
  onSend 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSend: (to: string, subject: string, body: string) => Promise<any>;
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const recipientInputRef = useRef<TextInput>(null);

  // Set up keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    // Auto-focus recipient input when modal appears
    if (visible) {
      setTimeout(() => {
        recipientInputRef.current?.focus();
      }, 100);
    }

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [visible]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setRecipient('');
      setSubject('');
      setMessageBody('');
      setIsLoading(false);
    }
  }, [visible]);

  const handleSend = async () => {
    // Validate form
    if (!recipient.trim()) {
      Alert.alert('Error', 'Please enter a recipient email address');
      return;
    }
    
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject for your email');
      return;
    }
    
    if (!messageBody.trim()) {
      Alert.alert('Error', 'Please enter a message body');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSend(recipient.trim(), subject.trim(), messageBody.trim());
      // Success is handled by parent component
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Format error message for better readability
      let errorMessage = 'Failed to send email. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Special handling for common errors
        if (error.message.includes("Buffer")) {
          errorMessage = 'Email encoding error. Please try with a simpler message.';
        } else if (error.message.includes("network")) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes("401") || error.message.includes("403")) {
          errorMessage = 'Authentication error. Please sign in again.';
        }
      }
      
      Alert.alert(
        'Error Sending Email', 
        errorMessage,
        [
          { 
            text: 'OK',
            onPress: () => console.log('Error acknowledged')
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (!isLoading) {
          onClose();
        }
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <SafeAreaView style={styles.container}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={[styles.actionButtonText, isLoading && styles.disabledText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Email</Text>
              <TouchableOpacity 
                onPress={handleSend}
                disabled={isLoading}
              >
                <Text style={[styles.actionButtonText, isLoading && styles.disabledText]}>
                  {isLoading ? 'Sending...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#0000ff" />
                  <Text style={styles.loadingText}>Sending email...</Text>
                </View>
              )}
              
              <TextInput
                ref={recipientInputRef}
                style={styles.input}
                placeholder="To"
                value={recipient}
                onChangeText={setRecipient}
                keyboardType="email-address"
                editable={!isLoading}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Subject"
                value={subject}
                onChangeText={setSubject}
                editable={!isLoading}
                returnKeyType="next"
              />
              <TextInput
                style={[
                  styles.messageInput,
                  keyboardVisible && Platform.OS === 'ios' ? { maxHeight: 120 } : {}
                ]}
                placeholder="Message"
                value={messageBody}
                onChangeText={setMessageBody}
                multiline
                editable={!isLoading}
                textAlignVertical="top"
                scrollEnabled
                blurOnSubmit={false}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export function EmailScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [composingEmail, setComposingEmail] = useState(false);
  const [readingEmail, setReadingEmail] = useState(false);
  
  const { 
    emails, 
    currentEmail, 
    isLoading: gmailIsLoading, 
    error, 
    fetchEmails, 
    fetchEmailById, 
    sendEmail, 
    markAsRead, 
    markAsUnread, 
    archiveEmail 
  } = useGmail();

  // Load emails on initial mount
  React.useEffect(() => {
    loadEmails();
  }, []);

  // Load emails function
  const loadEmails = async () => {
    try {
      await fetchEmails(20);
    } catch (err) {
      console.error('Error loading emails:', err);
      // Error handling is already managed by the useGmail hook
    }
  };

  // Refresh emails
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEmails();
    } catch (err) {
      console.error('Error refreshing emails:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadEmails]);

  // Open email to read
  const handleOpenEmail = async (emailId: string) => {
    const emailData = await fetchEmailById(emailId);
    if (emailData) {
      // Mark as read when opening
      await markAsRead(emailId);
      setReadingEmail(true);
    }
  };

  // Handle sending email from ComposeEmailModal
  const handleSendEmail = async (to: string, subject: string, body: string) => {
    const success = await sendEmail(to, subject, body, false);
    setComposingEmail(false);
    Alert.alert('Success', 'Email sent successfully');
    return success;
  };

  // Archive email
  const handleArchiveEmail = async (emailId: string) => {
    const success = await archiveEmail(emailId);
    if (success) {
      Alert.alert('Success', 'Email archived');
      if (readingEmail) {
        setReadingEmail(false);
      }
    } else {
      Alert.alert('Error', 'Failed to archive email');
    }
  };

  // Render email item
  const renderEmailItem = ({ item }: { item: EmailData }) => (
    <TouchableOpacity 
      style={[styles.emailItem, item.isUnread ? styles.unreadEmail : styles.readEmail]}
      onPress={() => handleOpenEmail(item.id)}
    >
      <View style={styles.emailContent}>
        <Text 
          style={styles.fromText}
          numberOfLines={1}
        >
          {item.from}
        </Text>
        <Text 
          style={styles.subjectText}
          numberOfLines={1}
        >
          {item.subject}
        </Text>
        <Text 
          style={styles.snippetText}
          numberOfLines={2}
        >
          {item.snippet}
        </Text>
        <Text style={styles.dateText}>
          {new Date(item.date).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Read Email Modal
  const ReadEmailModal = () => {
    const isHtmlContent = React.useMemo(() => {
      if (!currentEmail?.body) return false;
      return currentEmail.body.trim().toLowerCase().startsWith('<!doctype') || 
             currentEmail.body.trim().toLowerCase().startsWith('<html');
    }, [currentEmail?.body]);

    const parsedEmailContent = React.useMemo(() => {
      if (!currentEmail?.body) return '';
      if (isHtmlContent) {
        return parseHtmlContent(currentEmail.body);
      }
      return currentEmail.body;
    }, [currentEmail?.body, isHtmlContent]);

    return (
      <Modal
        visible={readingEmail}
        animationType="slide"
        transparent={false}
      >
        {currentEmail ? (
          <SafeAreaView style={styles.container}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setReadingEmail(false)}>
                <Text style={styles.actionButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleArchiveEmail(currentEmail.id)}>
                <Text style={styles.actionButtonText}>Archive</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.emailDetailsContainer}>
              <Text style={styles.emailDetailTitle}>{currentEmail.subject}</Text>
              <Text style={styles.emailDetailText}>From: {currentEmail.from}</Text>
              <Text style={styles.emailDetailText}>To: {currentEmail.to}</Text>
              <Text style={styles.emailDetailText}>
                {new Date(currentEmail.date).toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.emailBodyContainer}>
              <ScrollView>
                <Text style={styles.emailBodyText}>{parsedEmailContent}</Text>
              </ScrollView>
            </View>
          </SafeAreaView>
        ) : (
          <SafeAreaView style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </SafeAreaView>
        )}
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Text style={styles.actionButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inbox</Text>
        <TouchableOpacity 
          onPress={() => setComposingEmail(true)}
          style={styles.headerButton}
        >
          <Text style={styles.actionButtonText}>Compose</Text>
        </TouchableOpacity>
      </View>

      {gmailIsLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            onPress={loadEmails}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={emails}
          renderItem={renderEmailItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No emails found</Text>
            </View>
          )}
        />
      )}

      {/* Modals */}
      <ComposeEmailModal 
        visible={composingEmail}
        onClose={() => setComposingEmail(false)}
        onSend={handleSendEmail}
      />
      <ReadEmailModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
  },
  actionButtonText: {
    color: '#0000ff',
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  emailContent: {
    flex: 1,
  },
  unreadEmail: {
    backgroundColor: '#f0f9ff',
  },
  readEmail: {
    backgroundColor: '#ffffff',
  },
  fromText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 16,
    marginBottom: 4,
  },
  snippetText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
  },
  errorText: {
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#666666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0000ff',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  messageInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    minHeight: 150,
  },
  emailDetailsContainer: {
    padding: 16,
  },
  emailDetailTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emailDetailText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  emailBodyContainer: {
    flex: 1,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  emailBodyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  loadingText: {
    color: '#0000ff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#999999',
  },
}); 