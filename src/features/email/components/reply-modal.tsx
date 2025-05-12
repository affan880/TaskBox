import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import * as DocumentPicker from '@react-native-documents/picker';
import RNBlobUtil from 'react-native-blob-util';
import { EmailAttachment, EmailData } from '@/types/email';
import { replyToEmail, replyAllToEmail, forwardEmail } from '@/api/gmail-api';
import * as ImagePicker from 'react-native-image-picker';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type ReplyMode = 'reply' | 'reply-all' | 'forward';

type ReplyModalProps = {
  visible: boolean;
  onClose: () => void;
  mode: ReplyMode;
  email: EmailData;
  originalSubject: string;
  originalFrom: string;
  originalTo: string;
  originalCc?: string;
};

// Helper function to create a local copy of a file
const createLocalCopy = async (uri: string, fileName: string): Promise<string> => {
  try {
    console.log('[ReplyModal] Creating local copy of:', fileName);
    
    if (Platform.OS === 'android' && uri.startsWith('content://')) {
      const destPath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;
      
      const exists = await RNBlobUtil.fs.exists(destPath);
      if (exists) {
        console.log('[ReplyModal] File already exists in cache:', destPath);
        return `file://${destPath}`;
      }

      const result = await RNBlobUtil.fs.cp(uri, destPath);
      console.log('[ReplyModal] File copied successfully to:', result);
      return `file://${destPath}`;
    }
    
    return uri;
  } catch (error) {
    console.error('[ReplyModal] Error creating local copy:', error);
    throw new Error(`Failed to create local copy: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export function ReplyModal({
  visible,
  onClose,
  mode,
  email,
  originalSubject,
  originalFrom,
  originalTo,
  originalCc,
}: ReplyModalProps) {
  const [to, setTo] = useState(originalTo || '');
  const [subject, setSubject] = useState(originalSubject || '');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize content with the original message
  React.useEffect(() => {
    if (email) {
      const formatDate = (date: Date) => {
        return date.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
      };

      const formatEmailAddress = (email: string) => {
        const match = email.match(/(.*?)\s*<(.+?)>/);
        if (match) {
          return `${match[1]} <${match[2]}>`;
        }
        return email;
      };

      switch (mode) {
        case 'reply':
        case 'reply-all':
          setBody(`\n\nOn ${formatDate(new Date(email.date))}, ${formatEmailAddress(email.from)} wrote:\n\n${email.body}`);
          break;
        case 'forward':
          setBody(`\n\n---------- Forwarded message ---------\nFrom: ${formatEmailAddress(email.from)}\nDate: ${formatDate(new Date(email.date))}\nSubject: ${email.subject}\nTo: ${formatEmailAddress(email.to)}\n\n${email.body}`);
          break;
      }
    }
  }, [email, mode]);

  const handleAddAttachment = async () => {
    try {
      setIsUploading(true);
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });
      
      const newAttachments = result.map(file => ({
        id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name || 'Unnamed file',
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        size: file.size || 0,
        createdAt: new Date().toISOString(),
      }));
      
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (err) {
      console.error('Error picking document:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSend = async () => {
    if (!to) {
      // Show error
      return;
    }

    if (!email?.id) {
      Alert.alert('Error', 'Invalid email data');
      return;
    }

    setIsSending(true);

    try {
      setIsLoading(true);
      let success = false;
      const errorMessage = 'Failed to send message. Please try again.';

      // Format the content with proper line breaks
      const formattedContent = body.replace(/\n/g, '<br>');

      switch (mode) {
        case 'reply':
          success = await replyToEmail(email.id, formattedContent, attachments);
          break;
        case 'reply-all':
          success = await replyAllToEmail(email.id, formattedContent, attachments);
          break;
        case 'forward':
          success = await forwardEmail(email.id, '', formattedContent, attachments);
          break;
        default:
          throw new Error('Invalid reply mode');
      }

      if (success) {
        onClose();
        setBody('');
        setAttachments([]);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('[ReplyModal] Error sending message:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      setIsLoading(false);
    }
  };

  const handleCameraPress = () => {
    ImagePicker.launchCamera({
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
    }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to capture image');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const newAttachment: EmailAttachment = {
          id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `camera_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          createdAt: new Date().toISOString(),
        };

        setAttachments(prev => [...prev, newAttachment]);
      }
    });
  };

  const handleGalleryPress = () => {
    ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
      selectionLimit: 0,
    }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to select images');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const newAttachments: EmailAttachment[] = response.assets.map(asset => ({
          id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          createdAt: new Date().toISOString(),
        }));

        setAttachments(prev => [...prev, ...newAttachments]);
      }
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const renderAttachmentItem = (attachment: EmailAttachment) => (
    <View
      key={attachment.id}
      style={[
        styles.attachmentItem,
        {
          backgroundColor: '#ffffff',
          borderColor: '#000000',
          transform: [{ rotate: '-0.5deg' }],
        }
      ]}
    >
      <View style={styles.attachmentContent}>
        <View style={[
          styles.attachmentIcon,
          {
            backgroundColor: '#0066ff',
            borderColor: '#000000',
          }
        ]}>
          <Icon name="insert-drive-file" size={20} color="#ffffff" />
        </View>
        <View style={styles.attachmentDetails}>
          <Text style={styles.attachmentName} numberOfLines={1}>
            {attachment.name}
          </Text>
          <Text style={styles.attachmentSize}>
            {(attachment.size / 1024 / 1024).toFixed(2)} MB
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveAttachment(attachment.id)}
        style={[
          styles.attachmentRemove,
          {
            backgroundColor: '#ff3333',
            borderColor: '#000000',
            transform: [{ rotate: '1deg' }],
          }
        ]}
      >
        <Icon name="close" size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  const getFileIcon = (type: string): string => {
    if (type.includes('image')) return 'image';
    if (type.includes('pdf')) return 'picture-as-pdf';
    if (type.includes('word') || type.includes('document')) return 'description';
    if (type.includes('excel') || type.includes('sheet')) return 'table-chart';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'slideshow';
    if (type.includes('text')) return 'text-snippet';
    if (type.includes('zip') || type.includes('compressed')) return 'archive';
    return 'insert-drive-file';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[
          styles.header,
          {
            backgroundColor: '#ffde59',
            borderColor: '#000000',
            transform: [{ rotate: '-0.5deg' }],
          }
        ]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.headerButton,
                {
                  backgroundColor: '#ff3333',
                  borderColor: '#000000',
                  transform: [{ rotate: '1deg' }],
                }
              ]}
            >
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {mode === 'reply' ? 'Reply' : mode === 'reply-all' ? 'Reply All' : 'Forward'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleAddAttachment}
              disabled={isUploading}
              style={[
                styles.headerButton,
                {
                  backgroundColor: '#0066ff',
                  borderColor: '#000000',
                  transform: [{ rotate: '-1deg' }],
                }
              ]}
            >
              <Icon name="attach-file" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSend}
              disabled={isLoading}
              style={[
                styles.headerButton,
                {
                  backgroundColor: isLoading ? '#666666' : '#ff3333',
                  borderColor: '#000000',
                  transform: [{ rotate: '1deg' }],
                }
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Icon name="send" size={24} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ScrollView style={styles.scrollView}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>To:</Text>
                <TextInput
                  value={to}
                  onChangeText={setTo}
                  placeholder="Recipients"
                  placeholderTextColor="#666666"
                  style={[
                    styles.input,
                    {
                      backgroundColor: '#ffffff',
                      borderColor: '#000000',
                      transform: [{ rotate: '0.5deg' }],
                    }
                  ]}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Subject:</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Subject"
                  placeholderTextColor="#666666"
                  style={[
                    styles.input,
                    {
                      backgroundColor: '#ffffff',
                      borderColor: '#000000',
                      transform: [{ rotate: '-0.5deg' }],
                    }
                  ]}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder="Write your message..."
                  placeholderTextColor="#666666"
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.messageInput,
                    {
                      backgroundColor: '#ffffff',
                      borderColor: '#000000',
                      transform: [{ rotate: '0.5deg' }],
                    }
                  ]}
                />
              </View>

              {attachments.length > 0 && (
                <View style={styles.attachmentsContainer}>
                  <Text style={styles.attachmentsTitle}>
                    Attachments ({attachments.length})
                  </Text>
                  <View style={styles.attachmentsList}>
                    {attachments.map(attachment => renderAttachmentItem(attachment))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
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
    borderBottomWidth: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    marginLeft: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#000000',
    borderWidth: 4,
    borderRadius: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  messageInput: {
    height: 200,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#000000',
    borderWidth: 4,
    borderRadius: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  attachmentsContainer: {
    marginTop: 24,
  },
  attachmentsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    marginBottom: 12,
  },
  attachmentsList: {
    gap: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 4,
    borderRadius: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  attachmentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 4,
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  attachmentSize: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  attachmentRemove: {
    width: 32,
    height: 32,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
}); 