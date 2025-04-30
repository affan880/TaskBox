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
  const { colors, isDark } = useTheme();
  const [content, setContent] = React.useState('');
  const [attachments, setAttachments] = React.useState<EmailAttachment[]>([]);
  const [isSending, setIsSending] = React.useState(false);

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
          setContent(`\n\nOn ${formatDate(new Date(email.date))}, ${formatEmailAddress(email.from)} wrote:\n\n${email.body}`);
          break;
        case 'forward':
          setContent(`\n\n---------- Forwarded message ---------\nFrom: ${formatEmailAddress(email.from)}\nDate: ${formatDate(new Date(email.date))}\nSubject: ${email.subject}\nTo: ${formatEmailAddress(email.to)}\n\n${email.body}`);
          break;
      }
    }
  }, [email, mode]);

  const handleSend = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    if (!email?.id) {
      Alert.alert('Error', 'Invalid email data');
      return;
    }

    setIsSending(true);

    try {
      let success = false;
      const errorMessage = 'Failed to send message. Please try again.';

      // Format the content with proper line breaks
      const formattedContent = content.replace(/\n/g, '<br>');

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
        setContent('');
        setAttachments([]);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('[ReplyModal] Error sending message:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });

      if (result && result.length > 0) {
        const file = result[0];
        const newAttachment: EmailAttachment = {
          id: Date.now().toString(),
          name: file.name || 'Unnamed file',
          type: file.type || 'application/octet-stream',
          size: file.size || 0,
          uri: file.uri,
          createdAt: new Date().toISOString(),
        };
        setAttachments(prev => [...prev, newAttachment]);
      }
    } catch (err) {
      if (err instanceof Error && 'code' in err && err.code === 'DOCUMENT_PICKER_CANCELED') {
        return;
      }
      console.error('[ReplyModal] Error picking file:', err);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
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
    <View key={attachment.id} style={[styles.attachmentItem, { backgroundColor: colors.background.secondary }]}>
      <Icon name={getFileIcon(attachment.type)} size={24} color={colors.text.secondary} />
      <View style={styles.attachmentInfo}>
        <Text style={[styles.attachmentName, { color: colors.text.primary }]} numberOfLines={1}>
          {attachment.name}
        </Text>
        <Text style={[styles.attachmentSize, { color: colors.text.secondary }]}>
          {formatFileSize(attachment.size)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveAttachment(attachment.id)}
        style={styles.removeAttachmentButton}
      >
        <Icon name="close" size={20} color={colors.text.secondary} />
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
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background.primary }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
              <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Icon name="arrow-back" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.title, { color: colors.text.primary }]}>
                    {mode === 'reply' ? 'Reply' : mode === 'reply-all' ? 'Reply All' : 'Forward'}
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  <TouchableOpacity
                    onPress={handleCameraPress}
                    style={[styles.headerButton, { backgroundColor: colors.background.secondary }]}
                  >
                    <Icon name="camera-alt" size={20} color={colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleGalleryPress}
                    style={[styles.headerButton, { backgroundColor: colors.background.secondary }]}
                  >
                    <Icon name="photo-library" size={20} color={colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handlePickFile}
                    style={[styles.headerButton, { backgroundColor: colors.background.secondary }]}
                  >
                    <Icon name="attach-file" size={20} color={colors.text.primary} />
                  </TouchableOpacity>
                  <Button
                    onPress={handleSend}
                    disabled={isSending}
                    style={[styles.sendButton, { backgroundColor: colors.brand.primary }]}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.sendButtonText}>Send</Text>
                    )}
                  </Button>
                </View>
              </View>

              <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
              >
                <View style={styles.recipientsContainer}>
                  <Text style={[styles.recipientLabel, { color: colors.text.secondary }]}>To:</Text>
                  <Text style={[styles.recipientText, { color: colors.text.primary }]}>{originalTo}</Text>
                </View>
                {originalCc && (
                  <View style={styles.recipientsContainer}>
                    <Text style={[styles.recipientLabel, { color: colors.text.secondary }]}>Cc:</Text>
                    <Text style={[styles.recipientText, { color: colors.text.primary }]}>{originalCc}</Text>
                  </View>
                )}
                <View style={styles.recipientsContainer}>
                  <Text style={[styles.recipientLabel, { color: colors.text.secondary }]}>Subject:</Text>
                  <Text style={[styles.recipientText, { color: colors.text.primary }]}>{originalSubject}</Text>
                </View>

                <TextInput
                  style={[
                    styles.messageInput,
                    { 
                      color: colors.text.primary,
                      backgroundColor: colors.background.primary 
                    }
                  ]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write your message..."
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  textAlignVertical="top"
                />

                {attachments.length > 0 && (
                  <View style={styles.attachmentsContainer}>
                    <Text style={[styles.attachmentsTitle, { color: colors.text.secondary }]}>
                      Attachments ({attachments.length})
                    </Text>
                    <View style={styles.attachmentsList}>
                      {attachments.map(renderAttachmentItem)}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  recipientsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4,
  },
  recipientLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
  },
  recipientText: {
    flex: 1,
    fontSize: 14,
  },
  messageInput: {
    flex: 1,
    minHeight: 200,
    fontSize: 16,
    padding: 8,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  attachmentsContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  attachmentsTitle: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  attachmentsList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentSize: {
    fontSize: 12,
    marginTop: 2,
  },
  removeAttachmentButton: {
    padding: 8,
  },
  sendButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 