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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/app-navigator';
import { useTheme } from '@/theme/theme-context';
import * as DocumentPicker from '@react-native-documents/picker';
import RNBlobUtil from 'react-native-blob-util';
import { EmailAttachment } from '@/types/email';
import { useGmail } from '@/hooks/use-gmail';
import { RecipientFields } from './components/recipient-fields';
import { SuggestionModal } from './components/suggestion-modal';
import * as ImagePicker from 'react-native-image-picker';

// Restore aliases for standard components if needed outside the sheet
const TextInput = RNTextInput;
const TouchableOpacity = RNTouchableOpacity;
const ScrollView = RNScrollView;

type ComposeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  } catch (error: any) {
    console.error('[ComposeScreen] Error creating local copy:', error);
    throw new Error(`Failed to create local copy: ${error?.message || 'Unknown error'}`);
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

// Add these options near the top of the component
const imagePickerConfig = {
  mediaType: 'mixed',
  quality: 1,
  includeBase64: false,
  presentationStyle: 'fullScreen',
  selectionLimit: 0,
  saveToPhotos: true,
  includeExtra: true,
};

export function ComposeScreen() {
  const navigation = useNavigation<ComposeScreenNavigationProp>();
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
      setKeyboardHeight(0);
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
            if (!file.uri) {
              throw new Error('File URI is missing');
            }
            const localUri = await createLocalCopy(file.uri, file.name || 'unnamed-file');
            return {
              id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              uri: localUri,
              type: file.type || 'application/octet-stream',
              name: file.name || 'unnamed-file',
              size: file.size || 0,
              createdAt: new Date().toISOString(),
            } as EmailAttachment;
          } catch (error) {
            console.error('[ComposeScreen] Error processing file:', file.name, error);
            // Skip this file but continue with others
            return null;
          }
        })
      );

      // Filter out any null results from failed files
      const validAttachments = newAttachments.filter((attachment): attachment is EmailAttachment => attachment !== null);
      
      setAttachments(prev => [...prev, ...validAttachments]);
    } catch (err: any) {
      if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
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
          { text: 'OK', onPress: () => navigation.navigate('Email') }
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

  // Replace the camera handler
  const handleCameraPress = () => {
    const options: ImagePicker.CameraOptions = {
      mediaType: 'photo',
      cameraType: 'back',
      quality: 1,
      includeBase64: false,
      presentationStyle: 'fullScreen',
      saveToPhotos: true,
      includeExtra: true,
    };

    ImagePicker.launchCamera(options, (response) => {
      console.log('Camera Response:', response);
      
      if (response.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      if (response.errorCode) {
        console.error('Camera Error:', response.errorMessage);
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

  // Replace the gallery handler
  const handleGalleryPress = () => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
      presentationStyle: 'fullScreen',
      selectionLimit: 0,
      includeExtra: true,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      console.log('Gallery Response:', response);
      
      if (response.didCancel) {
        console.log('User cancelled gallery picker');
        return;
      }

      if (response.errorCode) {
        console.error('Gallery Error:', response.errorMessage);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={Platform.OS === 'ios'}
      >
        <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
          {/* Modern Header with Gradient */}
          <View style={[styles.header, { 
            backgroundColor: colors.background.primary,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            borderBottomWidth: 0,
          }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { 
                color: colors.text.primary,
                fontSize: 28,
                fontWeight: '800',
                letterSpacing: -0.8,
              }]}>
                New Message
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[
                  styles.toolbarButton,
                  { 
                    backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }
                ]}
                onPress={handleFilePick}
                disabled={isSending}
              >
                <Icon 
                  name="attach-file" 
                  size={22} 
                  color={colors.brand.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={[styles.formContainer, { backgroundColor: colors.background.primary }]} 
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingBottom: Platform.OS === 'ios' ? 60 : 120 // Increased padding for Android
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

            <View style={[styles.subjectContainer, {
              borderBottomWidth: 1,
              borderBottomColor: colors.border.light,
              marginHorizontal: 16,
              marginTop: 8,
            }]}>
              <TextInput
                ref={subjectInputRef}
                style={[
                  styles.subjectInput, 
                  { 
                    color: colors.text.primary,
                    backgroundColor: colors.background.primary,
                    fontSize: 20,
                    fontWeight: '600',
                    letterSpacing: -0.5,
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
            
            {/* Attachments section */}
            {attachments.length > 0 && (
              <View style={[styles.attachmentsContainer, { 
                backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
                marginHorizontal: 16,
                marginTop: 16,
                borderRadius: 16,
                padding: 16,
                borderWidth: 0,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }]}>
                <Text style={[styles.attachmentsTitle, { 
                  color: colors.text.primary,
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 12,
                }]}>
                  Attachments ({attachments.length})
                </Text>
                <View style={styles.attachmentsList}>
                  {attachments.map(renderAttachmentItem)}
                </View>
              </View>
            )}

            {/* Message content */}
            <View style={[styles.contentContainer, { 
              backgroundColor: colors.background.primary,
              marginHorizontal: 16,
              marginTop: 16,
            }]}>
              <TextInput
                ref={contentInputRef}
                style={[
                  styles.contentInput, 
                  { 
                    color: colors.text.primary,
                    backgroundColor: colors.background.primary,
                    fontSize: 16,
                    lineHeight: 24,
                    letterSpacing: 0.2,
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

          {/* Modern Keyboard Toolbar */}
          {isKeyboardVisible && (
            <Animated.View 
              style={[
                styles.keyboardToolbar, 
                { 
                  backgroundColor: isDark ? colors.background.primary : colors.background.primary,
                  position: 'absolute',
                  bottom: Platform.OS === 'ios' ? keyboardHeight : 0,
                  left: 0,
                  right: 0,
                  borderTopColor: isDark ? colors.border.dark : colors.border.light,
                  elevation: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                }
              ]}
            >
              <View style={styles.toolbarContent}>
                <View style={styles.toolbarSection}>
                  <TouchableOpacity
                    style={[
                      styles.toolbarButton,
                      { 
                        backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      }
                    ]}
                    onPress={handleFilePick}
                    disabled={isSending}
                  >
                    <Icon 
                      name="attach-file" 
                      size={22} 
                      color={colors.brand.primary} 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toolbarButton,
                      { 
                        backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      }
                    ]}
                    onPress={handleCameraPress}
                    disabled={isSending}
                  >
                    <Icon 
                      name="camera-alt" 
                      size={22} 
                      color={colors.brand.primary} 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toolbarButton,
                      { 
                        backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      }
                    ]}
                    onPress={handleGalleryPress}
                    disabled={isSending}
                  >
                    <Icon 
                      name="photo-library" 
                      size={22} 
                      color={colors.brand.primary} 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.toolbarRightSection}>
                  <TouchableOpacity
                    style={[
                      styles.generateButton,
                      {
                        backgroundColor: colors.brand.primary,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 20,
                        height: 44,
                        borderRadius: 22,
                        opacity: isSending ? 0.7 : 1,
                        marginRight: 12,
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                      }
                    ]}
                    onPress={handleGenerateEmail}
                    disabled={isSending}
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
                        fontWeight: '700',
                        fontSize: 15,
                        letterSpacing: 0.2,
                      }
                    ]}>
                      AI Generate
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.sendButton,
                      { 
                        backgroundColor: colors.brand.primary,
                        opacity: isSending ? 0.7 : 1,
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                      }
                    ]} 
                    onPress={handleSend}
                    disabled={isSending || isUploading || recipients.length === 0}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Icon name="send" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
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
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  formContainer: {
    flex: 1,
  },
  subjectContainer: {
    paddingVertical: 12,
  },
  subjectInput: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
    paddingVertical: 8,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 16,
  },
  contentInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    paddingVertical: 8,
    letterSpacing: 0.2,
  },
  keyboardToolbar: {
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 64 : 74,
    paddingVertical: Platform.OS === 'ios' ? 10 : 14,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButton: {
    minWidth: 140,
  },
  generateButtonText: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
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