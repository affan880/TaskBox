import * as React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
  ScrollView as RNScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/theme-context';
import * as DocumentPicker from '@react-native-documents/picker';
import RNBlobUtil from 'react-native-blob-util';
import { EmailAttachment } from '@/types/email';
import { useGmail } from '@/hooks/use-gmail';
import { Button } from '@/components/ui/button';
import { RecipientFields } from './components/recipient-fields';
import { SuggestionModal } from './components/suggestion-modal';

// Restore aliases for standard components if needed outside the sheet
const TextInput = RNTextInput;
const TouchableOpacity = RNTouchableOpacity;
const ScrollView = RNScrollView;

/**
 * Normalizes a file URI to ensure it's correctly formatted for React Native Blob Util
 */
function normalizeFileUri(uri: string): string {
  // On iOS, convert file URLs to paths for RNBlobUtil
  if (Platform.OS === 'ios' && uri.startsWith('file://')) {
    return decodeURIComponent(uri).replace('file://', '');
  }
  return uri;
}

/**
 * Creates a local copy of a file, ensuring it's accessible for upload/download operations
 */
const createLocalCopy = async (uri: string, fileName: string): Promise<string> => {
  try {
    console.log('[ComposeScreen] Creating local copy of:', fileName);
    
    if (Platform.OS === 'android' && uri.startsWith('content://')) {
      // For Android content URIs
      const destPath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;
      
      // First check if the file already exists in cache
      const exists = await RNBlobUtil.fs.exists(destPath);
      if (exists) {
        console.log('[ComposeScreen] File already exists in cache:', destPath);
        return `file://${destPath}`;
      }

      // Copy the file from content URI to app's cache directory
      const result = await RNBlobUtil.fs.cp(uri, destPath);
      console.log('[ComposeScreen] File copied successfully to:', result);
      return `file://${destPath}`;
    }
    
    // For iOS or other file URIs, return as is
    return uri;
  } catch (error) {
    console.error('[ComposeScreen] Error creating local copy:', error);
    throw new Error(`Failed to create local copy: ${error.message}`);
  }
};

/**
 * Verifies that a file at the given URI is accessible and valid
 */
async function verifyFileAccessible(uri: string, filename: string): Promise<boolean> {
  try {
    const normalizedUri = normalizeFileUri(uri);
    
    // Check if file exists
    const exists = await RNBlobUtil.fs.exists(normalizedUri);
    if (!exists) {
      console.error(`[FileCheck] File doesn't exist: ${normalizedUri}`);
      return false;
    }
    
    // Get file stats
    try {
      const stats = await RNBlobUtil.fs.stat(normalizedUri);
      
      // Check if file has a reasonable size (greater than 0 bytes)
      if (!stats.size || stats.size <= 0) {
        console.error(`[FileCheck] File has zero size: ${filename}`);
        return false;
      }
      
      // Log file details for debugging
      console.log(`[FileCheck] File verified: ${filename}, size: ${stats.size} bytes`);
      return true;
    } catch (statError) {
      console.error(`[FileCheck] Failed to get file stats for ${filename}:`, statError);
      return false;
    }
  } catch (error) {
    console.error(`[FileCheck] Error verifying file ${filename}:`, error);
    return false;
  }
}

export function ComposeScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { sendEmail } = useGmail();
  
  // Email recipients state
  const [recipients, setRecipients] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [bccRecipients, setBccRecipients] = useState<string[]>([]);
  
  // Show CC/BCC fields
  const [showCcBcc, setShowCcBcc] = useState(false);
  
  // Other email content
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Keyboard toolbar animation
  const toolbarHeight = useRef(new Animated.Value(0)).current;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // References for TextInputs
  const subjectInputRef = useRef<RNTextInput>(null);
  const contentInputRef = useRef<RNTextInput>(null);

  // Add state for standard modal
  const [isSuggestionModalVisible, setIsSuggestionModalVisible] = useState(false);

  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'assistant';
    message: string;
  }>>([]);

  // Add keyboard height tracking
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  // Update keyboard event listeners
  useEffect(() => {
    const keyboardWillShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardWillHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardDidShowListener = Keyboard.addListener(keyboardWillShow, (event) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
      Animated.timing(toolbarHeight, {
        toValue: 44,
        duration: Platform.OS === 'ios' ? event.duration : 250,
        useNativeDriver: false
      }).start();
    });
    
    const keyboardDidHideListener = Keyboard.addListener(keyboardWillHide, (event) => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      Animated.timing(toolbarHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? event.duration : 200,
        useNativeDriver: false
      }).start();
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [toolbarHeight]);
  
  // Clear form after sending
  const resetForm = useCallback(() => {
    setRecipients([]);
    setCcRecipients([]);
    setBccRecipients([]);
    setSubject('');
    setContent('');
    setAttachments([]);
  }, []);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });

      console.log('[ComposeScreen] Picked', result.length, 'files');

      const newAttachments = await Promise.all(
        result.map(async (file) => {
          console.log('[ComposeScreen] Processing file:', file.name, ', URI:', file.uri, ', type:', file.type, ', size:', file.size);
          
          try {
            const localUri = await createLocalCopy(file.uri, file.name);
            return {
              id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              uri: localUri,
              type: file.type || 'application/octet-stream',
              name: file.name,
              size: file.size || 0,
            };
          } catch (error) {
            console.error('[ComposeScreen] Error processing file:', file.name, error);
            // Skip this file but continue with others
            return null;
          }
        })
      );

      // Filter out any null results from failed files
      const validAttachments = newAttachments.filter(attachment => attachment !== null);
      
      setAttachments(prev => [...prev, ...validAttachments]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('[ComposeScreen] Error picking file:', err);
        Alert.alert('Error', 'Failed to attach file. Please try again.');
      }
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    console.log('[ComposeScreen] Attempting to remove attachment:', attachmentId);
    
    // Find the attachment to remove
    const attachmentToRemove = attachments.find(a => (a.id || `${a.name}-${Date.now()}`) === attachmentId);
    
    if (!attachmentToRemove) {
      console.error('[ComposeScreen] Attachment not found:', attachmentId);
      return;
    }
    
    // If it has a local URI, try to delete the file
    if (attachmentToRemove.uri) {
      try {
        const normalizedUri = normalizeFileUri(attachmentToRemove.uri);
        console.log('[ComposeScreen] Deleting file at:', normalizedUri);
        
        RNBlobUtil.fs.exists(normalizedUri)
          .then(exists => {
            if (exists) {
              return RNBlobUtil.fs.unlink(normalizedUri);
            }
            console.log('[ComposeScreen] File does not exist:', normalizedUri);
            return Promise.resolve();
          })
          .catch(error => console.error('[ComposeScreen] Error deleting attachment file:', error));
      } catch (error) {
        console.error('[ComposeScreen] Error cleaning up attachment file:', error);
      }
    }
    
    // Remove from state
    setAttachments(prev => {
      const newAttachments = prev.filter(a => (a.id || `${a.name}-${Date.now()}`) !== attachmentId);
      console.log('[ComposeScreen] Attachments updated. Count:', newAttachments.length);
      return newAttachments;
    });
  };

  const handleSend = async () => {
    // Validate all recipients (main, cc, bcc)
    if (recipients.length === 0) {
      Alert.alert('Error', 'Please enter at least one recipient');
      return;
    }

    setIsSending(true);

    try {
      // Prepare recipient strings (joined with commas)
      const toField = [...recipients];
      if (ccRecipients.length > 0) {
        toField.push(`CC: ${ccRecipients.join(',')}`);
      }
      if (bccRecipients.length > 0) {
        toField.push(`BCC: ${bccRecipients.join(',')}`);
      }
      const finalToField = toField.join(',');
      
      // Log attachment details before sending
      if (attachments.length > 0) {
        console.log(`[ComposeScreen] Sending ${attachments.length} attachments:`);
        
        // Final verification of all attachments before sending
        for (const attachment of attachments) {
          console.log(`[ComposeScreen] Attachment: ${attachment.name}, type: ${attachment.type}, size: ${attachment.size || 'unknown'} bytes`);
          console.log(`[ComposeScreen] URI: ${attachment.uri}`);
          
          // Verify file exists before sending
          const normalizedUri = normalizeFileUri(attachment.uri);
          const exists = await RNBlobUtil.fs.exists(normalizedUri);
          console.log(`[ComposeScreen] File exists: ${exists ? 'YES' : 'NO'}`);
          
          if (!exists) {
            throw new Error(`Attachment file not found: ${attachment.name} at path: ${normalizedUri}`);
          }
          
          // Check file size
          try {
            const stat = await RNBlobUtil.fs.stat(normalizedUri);
            console.log(`[ComposeScreen] File stat: ${JSON.stringify(stat)}`);
            
            // Update attachment size if needed
            if (!attachment.size && stat.size) {
              attachment.size = stat.size;
            }
            
            // Check if file is empty
            if (stat.size === 0) {
              throw new Error(`Attachment file is empty: ${attachment.name}`);
            }
          } catch (statError) {
            console.error(`[ComposeScreen] Error getting file stats for ${attachment.name}:`, statError);
          }
        }
      }
      
      // Send email using Gmail API
      const success = await sendEmail(finalToField, subject, content, attachments);
      
      setIsSending(false);
      
      if (success) {
        // Reset form on success
        resetForm();
        
        Alert.alert('Success', 'Email sent successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to send email. Please try again.');
      }
    } catch (error) {
      setIsSending(false);
      console.error('[ComposeScreen] Error sending email:', error);
      Alert.alert('Error', `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get appropriate icon for file type
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

  // Render individual attachment item 
  const renderAttachmentItem = (attachment: EmailAttachment) => {
    // Generate a unique key if attachment.id doesn't exist
    const key = attachment.id || `${attachment.name}-${Date.now()}`;
    
    return (
      <View 
        key={key}
        style={[
          styles.attachmentItem, 
          { 
            backgroundColor: `${colors.brand.primary}08`,
            borderColor: colors.border.light,
          }
        ]}
      >
        <View style={styles.attachmentContent}>
          <View style={styles.attachmentIcon}>
            {attachment.isUploading ? (
              <ActivityIndicator 
                size="small" 
                color={colors.brand.primary} 
              />
            ) : (
              <Icon name={getFileIcon(attachment.type)} size={20} color={colors.brand.primary} />
            )}
          </View>
          <View style={styles.attachmentDetails}>
            <Text 
              style={[styles.attachmentName, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {attachment.name}
            </Text>
            <Text style={[styles.attachmentSize, { color: colors.text.tertiary }]}>
              {attachment.isUploading ? 
                `Uploading... ${attachment.id === currentUploadId ? Math.round(uploadProgress) + '%' : ''}` : 
                formatFileSize(attachment.size)
              }
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.attachmentRemove,
            Platform.OS === 'android' && styles.attachmentRemoveAndroid
          ]}
          onPress={() => {
            console.log('[ComposeScreen] Removing attachment:', key);
            handleRemoveAttachment(key);
          }}
          disabled={attachment.isUploading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          pressRetentionOffset={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.removeIconContainer}>
            <Icon 
              name="close" 
              size={16} 
              color={attachment.isUploading ? colors.text.quaternary : colors.text.tertiary} 
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Handle generate email - ADAPT for Modal
  const handleGenerateEmail = async () => {
    console.log('[Generate Button] Clicked. Fetching suggestions...');
    setChatHistory([]);
    setIsSuggestionModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
      >
        <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
          <View style={[styles.header, { 
            borderBottomColor: colors.border.light,
            backgroundColor: colors.background.primary 
          }]}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => navigation.goBack()}
              accessibilityLabel="Back to inbox"
            >
              <Icon name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>New Message</Text>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={handleFilePick}
                disabled={isSending}
                accessibilityLabel="Add attachment"
              >
                <Icon name="attach-file" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  { backgroundColor: colors.brand.primary },
                  (isSending || isUploading) && { opacity: 0.7 }
                ]} 
                onPress={handleSend}
                disabled={isSending || isUploading || recipients.length === 0}
                accessibilityLabel="Send email"
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="send" size={18} color="#FFFFFF" style={styles.sendIcon} />
                    <Text style={styles.sendButtonText}>Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={[styles.formContainer, { backgroundColor: colors.background.primary }]} 
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingBottom: isKeyboardVisible ? (Platform.OS === 'ios' ? 44 : keyboardHeight + 60) : 0 
            }}
          >
            <RecipientFields
              recipients={recipients}
              setRecipients={setRecipients}
              ccRecipients={ccRecipients}
              setCcRecipients={setCcRecipients}
              bccRecipients={bccRecipients}
              setBccRecipients={setBccRecipients}
              showCcBcc={showCcBcc}
              setShowCcBcc={setShowCcBcc}
            />

            <View style={styles.subjectContainer}>
              <TextInput
                ref={subjectInputRef}
                style={[
                  styles.subjectInput, 
                  { 
                    color: colors.text.primary,
                    backgroundColor: colors.background.primary 
                  }
                ]}
                value={subject}
                onChangeText={setSubject}
                placeholder="Subject"
                placeholderTextColor={colors.text.tertiary}
                returnKeyType="next"
                onSubmitEditing={() => contentInputRef.current?.focus()}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border.light }]} />
            
            {/* Attachments section */}
            {attachments.length > 0 && (
              <View style={[styles.attachmentsContainer, { backgroundColor: colors.background.primary }]}>
                <Text style={[styles.attachmentsTitle, { color: colors.text.secondary }]}>
                  Attachments ({attachments.length})
                </Text>
                <View style={styles.attachmentsList}>
                  {attachments.map(renderAttachmentItem)}
                </View>
              </View>
            )}

            {/* Message content */}
            <View style={[styles.contentContainer, { backgroundColor: colors.background.primary }]}>
              <TextInput
                ref={contentInputRef}
                style={[
                  styles.contentInput, 
                  { 
                    color: colors.text.primary,
                    backgroundColor: colors.background.primary 
                  }
                ]}
                value={content}
                onChangeText={setContent}
                placeholder="Write your message here..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Generate button */}
          {isKeyboardVisible && (
            <Animated.View 
              style={[
                styles.keyboardToolbar, 
                { 
                  height: Platform.OS === 'ios' ? 60 : 56,
                  backgroundColor: colors.background.primary,
                  position: 'absolute',
                  bottom: Platform.OS === 'ios' ? 0 : keyboardHeight - 80,
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  borderTopWidth: 1,
                  borderTopColor: colors.border.light,
                  shadowColor: isDark ? '#000' : '#000',
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: isDark ? 0.2 : 0.1,
                }
              ]}
            >
              <View style={[styles.toolbarContent, { paddingBottom: Platform.OS === 'ios' ? 8 : 0 }]}>
                <TouchableOpacity
                  style={[
                    styles.generateButton,
                    {
                      backgroundColor: colors.brand.primary,
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '92%',
                      maxWidth: 400,
                      elevation: Platform.OS === 'android' ? 2 : 0,
                      shadowColor: isDark ? '#000' : '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.15,
                    }
                  ]}
                  onPress={handleGenerateEmail}
                >
                  <Image 
                    source={require('@/assets/images/feather.png')}
                    style={{ 
                      width: 18, 
                      height: 18, 
                      marginRight: 8,
                      tintColor: '#FFFFFF'
                    }}
                    resizeMode="contain"
                  />
                  <Text style={[
                    styles.generateButtonText,
                    { 
                      color: '#FFFFFF', 
                      fontWeight: '600',
                      fontSize: 15,
                      letterSpacing: 0.3,
                    }
                  ]}>
                    Generate with AI
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>

      <SuggestionModal
        visible={isSuggestionModalVisible}
        onClose={() => setIsSuggestionModalVisible(false)}
        chatHistory={chatHistory}
        chatMessage={chatMessage}
        setChatMessage={setChatMessage}
        setSubject={setSubject}
        setBody={setContent}
      />
    </SafeAreaView>
  );
}

// Modern styles with enhanced UI elements
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  recipientLabel: {
    width: 40,
    fontSize: 16,
    fontWeight: '500',
  },
  chipInputContainer: {
    flex: 1,
    minHeight: 40,
  },
  chipInput: {
    fontSize: 16,
    flex: 1,
  },
  ccBccButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: 0,
  },
  subjectContainer: {
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  subjectInput: {
    fontSize: 16,
    paddingVertical: 12,
    color: '#6B7280',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
  },
  contentInput: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: 12,
    color: '#6B7280',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  sendIcon: {
    marginRight: 4,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attachmentsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  attachmentsList: {
    marginTop: 4,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  attachmentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
  },
  attachmentRemove: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  attachmentRemoveAndroid: {
    // Additional styles for Android
    backgroundColor: 'transparent',
  },
  removeIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? '#F3F4F6' : 'transparent',
  },
  keyboardToolbar: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bottomSheetContentContainer: {
    flex: 1,
  },
  sheetSuggestionContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  generatedText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  generatedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    backgroundColor: '#FFFFFF',
  },
  chatInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  chatMessageContainer: {
    marginVertical: 8,
  },
  chatMessage: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  chatMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '100%',
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    overflow: 'hidden',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    padding: 5,
    zIndex: 10,
  },
  suggestionsScroll: {
  },
}); 