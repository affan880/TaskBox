import * as React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Pressable,
  Dimensions
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/theme-context';
import * as DocumentPicker from '@react-native-documents/picker';
import RNBlobUtil from 'react-native-blob-util';
import { EmailAttachment } from '@/types/email';
import { useGmail } from '@/hooks/use-gmail';
import { ChipInput } from '@/components/ui/chip-input';
import { Image } from '@/components';
import { Button } from '@/components/ui/button';
import { summarizeEmailContent, generateEmailContent } from '@/api/email-analysis-api';

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
async function createLocalFileCopy(sourceUri: string, filename: string): Promise<string | null> {
  try {
    // Ensure filename is properly sanitized
    const sanitizedFilename = filename.replace(/[\/\\?%*:|"<>]/g, '_');
    
    // Create app-specific storage location
    const targetDir = `${RNBlobUtil.fs.dirs.DocumentDir}/EmailAttachments`;
    
    // Ensure directory exists
    const dirExists = await RNBlobUtil.fs.exists(targetDir);
    if (!dirExists) {
      await RNBlobUtil.fs.mkdir(targetDir);
    }
    
    // Create target path with timestamp to avoid conflicts
    const timestamp = Date.now();
    const targetPath = `${targetDir}/${timestamp}-${sanitizedFilename}`;
    
    // Normalize source URI
    const normalizedSourceUri = normalizeFileUri(sourceUri);
    
    // Check if source file exists
    const sourceExists = await RNBlobUtil.fs.exists(normalizedSourceUri);
    if (!sourceExists) {
      console.error(`Source file does not exist: ${normalizedSourceUri} (original: ${sourceUri})`);
      return null;
    }
    
    // Copy file to secure location
    await RNBlobUtil.fs.cp(normalizedSourceUri, targetPath);
    
    // Verify copy succeeded
    const targetExists = await RNBlobUtil.fs.exists(targetPath);
    if (!targetExists) {
      console.error(`Failed to copy file to ${targetPath}`);
      return null;
    }
    
    return targetPath;
  } catch (error) {
    console.error('Error creating local file copy:', error);
    return null;
  }
}

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

// Add EmailGenerationRequest type at the top of the file
type EmailGenerationRequest = {
  subject?: string;
  body?: string;
  recipientEmail?: string;
  tone?: string;
  prompt?: string; // Add prompt field for chat enhancements
};

export function ComposeScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
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
  
  // References for TextInputs to allow focusing
  const subjectInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);

  // Remove email generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState<string | null>(null);
  const [generatedBody, setGeneratedBody] = useState<string | null>(null);
  const [showGeneratedSubject, setShowGeneratedSubject] = useState(false);
  const [showGeneratedBody, setShowGeneratedBody] = useState(false);
  
  // Bottom sheet ref and state
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'assistant';
    message: string;
  }>>([]);

  // Snap points for bottom sheet (40%, 80% of screen height)
  const snapPoints = React.useMemo(() => ['40%', '80%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    setIsBottomSheetOpen(index !== -1);
  }, []);

  // Monitor keyboard visibility
  useEffect(() => {
    const keyboardWillShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardWillHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardDidShowListener = Keyboard.addListener(keyboardWillShow, (event) => {
      setIsKeyboardVisible(true);
      Animated.timing(toolbarHeight, {
        toValue: 44,
        duration: Platform.OS === 'ios' ? event.duration : 250,
        useNativeDriver: false
      }).start();
    });
    
    const keyboardDidHideListener = Keyboard.addListener(keyboardWillHide, (event) => {
      setIsKeyboardVisible(false);
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

  const handleAddAttachment = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });
      
      console.log(`[ComposeScreen] Picked ${results.length} files`);
      setIsUploading(true);
      
      for (const file of results) {
        console.log(`[ComposeScreen] Processing file: ${file.name}, URI: ${file.uri}, type: ${file.type}, size: ${file.size}`);
        const attachmentId = `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setCurrentUploadId(attachmentId);
        
        // Check for unsupported file types (especially Apple-specific formats)
        const fileExtension = file.name ? file.name.split('.').pop()?.toLowerCase() : '';
        const unsupportedExtensions = ['pages', 'numbers', 'keynote'];
        
        if (fileExtension && unsupportedExtensions.includes(fileExtension)) {
          Alert.alert(
            'Unsupported File Type',
            `The file "${file.name}" is in ${fileExtension.toUpperCase()} format which cannot be properly attached to emails. Please convert it to a compatible format like PDF or DOCX.`
          );
          continue; // Skip this file
        }
        
        // Add placeholder attachment while processing
        const tempAttachment: EmailAttachment = {
          id: attachmentId,
          name: file.name || 'Unnamed file',
          uri: file.uri, // Temporary URI
          type: file.type || 'application/octet-stream',
          size: file.size || 0,
          createdAt: new Date().toISOString(),
          isUploading: true,
        };
        
        setAttachments(prev => [...prev, tempAttachment]);
        
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 90) {
            clearInterval(interval);
          }
        }, 150);
        
        try {
          // Create a local copy of the file to ensure it's accessible
          console.log(`[ComposeScreen] Creating local copy of: ${file.name}`);
          const localFilePath = await createLocalFileCopy(file.uri, file.name || 'unnamed_file');
          
          if (!localFilePath) {
            // Failed to copy file, show error and continue with next attachment
            setAttachments(prev => prev.filter(a => a.id !== attachmentId));
            clearInterval(interval);
            Alert.alert('Error', `Couldn't process the file "${file.name}". The file may be inaccessible.`);
            continue;
          }
          
          // Verify the copied file is accessible and valid
          const isValid = await verifyFileAccessible(localFilePath, file.name || 'unnamed_file');
          if (!isValid) {
            setAttachments(prev => prev.filter(a => a.id !== attachmentId));
            clearInterval(interval);
            Alert.alert('Error', `The file "${file.name}" appears to be corrupted or inaccessible.`);
            continue;
          }
          
          // Determine accurate MIME type if possible
          let mimeType = file.type || 'application/octet-stream';
          if (!file.type && fileExtension) {
            // Try to infer MIME type from extension if not provided
            const mimeTypeMap: Record<string, string> = {
              'pdf': 'application/pdf',
              'doc': 'application/msword',
              'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'xls': 'application/vnd.ms-excel',
              'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'ppt': 'application/vnd.ms-powerpoint',
              'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'png': 'image/png',
              'gif': 'image/gif',
              'txt': 'text/plain',
              'csv': 'text/csv'
            };
            mimeType = mimeTypeMap[fileExtension] || 'application/octet-stream';
          }
          
          // Update the attachment with the permanent URI and corrected MIME type
          const updatedAttachment: EmailAttachment = {
            ...tempAttachment,
            uri: localFilePath, // Use the permanent path for sending
            type: mimeType,
            isUploading: false,
          };
          
          // Replace the placeholder with the updated attachment
          setAttachments(prev => 
            prev.map(a => a.id === attachmentId ? updatedAttachment : a)
          );
          
          clearInterval(interval);
          setUploadProgress(100);
          console.log(`[ComposeScreen] File ready for email: ${file.name}, path: ${localFilePath}, type: ${mimeType}`);
        } catch (processError) {
          console.error(`[ComposeScreen] Error processing file ${file.name}:`, processError);
          setAttachments(prev => prev.filter(a => a.id !== attachmentId));
          clearInterval(interval);
          Alert.alert('Error', `Failed to process the file "${file.name}".`);
        }
      }
      
      setCurrentUploadId(null);
      setIsUploading(false);
    } catch (err) {
      if (err instanceof Error && 'code' in err && err.code === 'DOCUMENT_PICKER_CANCELED') {
        // User cancelled the picker
        console.log('[ComposeScreen] Document picker cancelled by user');
      } else {
        Alert.alert('Error', 'Failed to pick document');
        console.error('[ComposeScreen] Document picker error:', err);
      }
      setIsUploading(false);
      setCurrentUploadId(null);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    // Find the attachment to remove
    const attachmentToRemove = attachments.find(a => a.id === attachmentId);
    
    // If it has a local URI, try to delete the file
    if (attachmentToRemove?.uri) {
      try {
        const normalizedUri = normalizeFileUri(attachmentToRemove.uri);
        RNBlobUtil.fs.exists(normalizedUri)
          .then(exists => {
            if (exists) {
              RNBlobUtil.fs.unlink(normalizedUri)
                .catch(error => console.error('Error deleting attachment file:', error));
            }
          })
          .catch(error => console.error('Error checking if attachment file exists:', error));
      } catch (error) {
        console.error('Error cleaning up attachment file:', error);
      }
    }
    
    // Remove from state
    setAttachments(attachments.filter(a => a.id !== attachmentId));
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
  const renderAttachmentItem = (attachment: EmailAttachment) => (
    <View 
      key={attachment.id}
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
        style={styles.attachmentRemove}
        onPress={() => handleRemoveAttachment(attachment.id)}
        disabled={attachment.isUploading}
      >
        <Icon 
          name="close" 
          size={16} 
          color={attachment.isUploading ? colors.text.quaternary : colors.text.tertiary} 
        />
      </TouchableOpacity>
    </View>
  );

  // Function to send chat message
  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;

    // Add user message to chat
    setChatHistory(prev => [...prev, { type: 'user', message: chatMessage }]);
    const userMessage = chatMessage;
    setChatMessage('');

    try {
      setIsGenerating(true);
      const response = await generateEmailContent({
        subject: subject || undefined,
        body: content || undefined,
        recipientEmail: recipients[0],
        tone: 'professional',
        prompt: userMessage
      });

      if (response) {
        // Add assistant response to chat
        setChatHistory(prev => [...prev, { 
          type: 'assistant', 
          message: response.body || response.subject || 'No suggestion generated' 
        }]);

        // Update suggestions if provided
        if (response.subject) {
          setGeneratedSubject(response.subject);
          setShowGeneratedSubject(true);
        }
        if (response.body) {
          setGeneratedBody(response.body);
          setShowGeneratedBody(true);
        }
      }
    } catch (error) {
      console.error('Error generating enhancement:', error);
      Alert.alert('Error', 'Failed to generate enhancement');
    } finally {
      setIsGenerating(false);
    }
  };

  // Render chat message
  const renderChatMessage = ({ type, message }: { type: 'user' | 'assistant', message: string }) => (
    <View style={[
      styles.chatMessage,
      type === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <Text style={[
        styles.chatMessageText,
        { color: type === 'user' ? '#FFFFFF' : colors.text.primary }
      ]}>
        {message}
      </Text>
    </View>
  );

  // Render suggestion in bottom sheet
  const renderSuggestionInSheet = (
    type: 'subject' | 'body',
    content: string,
    onAccept: () => void,
    onReject: () => void
  ) => (
    <View style={styles.sheetSuggestionContainer}>
      <Text style={[styles.suggestionLabel, { color: colors.text.secondary }]}>
        Suggested {type === 'subject' ? 'Subject Line' : 'Message'}
      </Text>
      <Text style={[styles.generatedText, { color: colors.text.primary }]}>
        {content}
      </Text>
      <View style={styles.generatedActions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: `${colors.brand.primary}10` }]}
          onPress={() => {
            onAccept();
            bottomSheetRef.current?.collapse();
          }}
        >
          <Icon name="check" size={16} color={colors.brand.primary} />
          <Text style={[styles.actionButtonText, { color: colors.brand.primary }]}>
            Use
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.background.tertiary }]}
          onPress={() => {
            onReject();
            bottomSheetRef.current?.collapse();
          }}
        >
          <Icon name="close" size={16} color={colors.text.tertiary} />
          <Text style={[styles.actionButtonText, { color: colors.text.tertiary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Handle generate email with bottom sheet
  const handleGenerateEmail = async () => {
    if (!subject && !content) {
      Alert.alert('Error', 'Please enter either subject or content to generate suggestions');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateEmailContent({
        subject: subject || undefined,
        body: content || undefined,
        recipientEmail: recipients[0],
        tone: 'professional'
      });

      if (response) {
        if (response.subject) {
          setGeneratedSubject(response.subject);
          setShowGeneratedSubject(true);
        }
        if (response.body) {
          setGeneratedBody(response.body);
          setShowGeneratedBody(true);
        }
        // Open bottom sheet to show suggestions
        bottomSheetRef.current?.expand();
      }
    } catch (error) {
      console.error('Error generating email:', error);
      Alert.alert('Error', 'Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add functions to handle accept/reject generated content
  const handleAcceptSubject = () => {
    if (generatedSubject) {
      setSubject(generatedSubject);
      setShowGeneratedSubject(false);
      setGeneratedSubject(null);
    }
  };

  const handleRejectSubject = () => {
    setShowGeneratedSubject(false);
    setGeneratedSubject(null);
  };

  const handleAcceptBody = () => {
    if (generatedBody) {
      setContent(generatedBody);
      setShowGeneratedBody(false);
      setGeneratedBody(null);
    }
  };

  const handleRejectBody = () => {
    setShowGeneratedBody(false);
    setGeneratedBody(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
      >
        <View style={{ flex: 1 }}>
          <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
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
                onPress={handleAddAttachment}
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
            style={styles.formContainer} 
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingBottom: isKeyboardVisible ? 44 : 0 
            }}
          >
            {/* Recipients field with chip input */}
            <View style={styles.recipientContainer}>
              <Text style={[styles.recipientLabel, { color: colors.text.secondary }]}>To:</Text>
              <View style={styles.chipInputContainer}>
                <ChipInput
                  values={recipients}
                  onChangeValues={setRecipients}
                  placeholder="Enter email addresses"
                  inputStyle={[styles.chipInput, { color: colors.text.primary }]}
                  chipStyle={{ backgroundColor: `${colors.brand.primary}20` }}
                  chipTextStyle={{ color: colors.brand.primary }}
                  validate={(email) => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegex.test(email);
                  }}
                  autoFocus
                />
              </View>
              <TouchableOpacity 
                style={styles.ccBccButton}
                onPress={() => setShowCcBcc(prev => !prev)}
              >
                <Text style={{ color: colors.brand.primary }}>
                  {showCcBcc ? 'Hide CC/BCC' : 'CC/BCC'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* CC and BCC fields (conditionally shown) */}
            {showCcBcc && (
              <>
                <View style={styles.recipientContainer}>
                  <Text style={[styles.recipientLabel, { color: colors.text.secondary }]}>Cc:</Text>
                  <View style={styles.chipInputContainer}>
                    <ChipInput
                      values={ccRecipients}
                      onChangeValues={setCcRecipients}
                      placeholder="Carbon copy recipients"
                      inputStyle={[styles.chipInput, { color: colors.text.primary }]}
                      chipStyle={{ backgroundColor: `${colors.brand.primary}20` }}
                      chipTextStyle={{ color: colors.brand.primary }}
                      validate={(email) => {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        return emailRegex.test(email);
                      }}
                    />
                  </View>
                </View>
                
                <View style={styles.recipientContainer}>
                  <Text style={[styles.recipientLabel, { color: colors.text.secondary }]}>Bcc:</Text>
                  <View style={styles.chipInputContainer}>
                    <ChipInput
                      values={bccRecipients}
                      onChangeValues={setBccRecipients}
                      placeholder="Blind carbon copy recipients"
                      inputStyle={[styles.chipInput, { color: colors.text.primary }]}
                      chipStyle={{ backgroundColor: `${colors.brand.primary}20` }}
                      chipTextStyle={{ color: colors.brand.primary }}
                      validate={(email) => {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        return emailRegex.test(email);
                      }}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border.light }]} />

            {/* Subject field */}
            <View style={styles.subjectContainer}>
              <TextInput
                ref={subjectInputRef}
                style={[styles.subjectInput, { color: colors.text.primary }]}
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
              <View style={styles.attachmentsContainer}>
                <Text style={[styles.attachmentsTitle, { color: colors.text.secondary }]}>
                  Attachments ({attachments.length})
                </Text>
                <View style={styles.attachmentsList}>
                  {attachments.map(renderAttachmentItem)}
                </View>
              </View>
            )}

            {/* Message content */}
            <View style={styles.contentContainer}>
              <TextInput
                ref={contentInputRef}
                style={[
                  styles.contentInput, 
                  { color: colors.text.primary }
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
          <Animated.View 
            style={[
              styles.keyboardToolbar, 
              { 
                height: toolbarHeight,
                borderTopColor: colors.border.light,
                backgroundColor: colors.background.primary,
                borderTopWidth: 1,
              }
            ]}
          >
            <Button
              variant="secondary"
              size="sm"
              onPress={handleGenerateEmail}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Suggestions'}
            </Button>
          </Animated.View>

          {/* Bottom Sheet for suggestions and chat */}
          <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            enablePanDownToClose
            backdropComponent={(props) => (
              <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
              />
            )}
          >
            <View style={styles.bottomSheetContent}>
              {/* Suggestions Section */}
              <ScrollView style={styles.suggestionsScroll}>
                {showGeneratedSubject && generatedSubject && 
                  renderSuggestionInSheet(
                    'subject',
                    generatedSubject,
                    handleAcceptSubject,
                    handleRejectSubject
                  )
                }
                {showGeneratedBody && generatedBody && 
                  renderSuggestionInSheet(
                    'body',
                    generatedBody,
                    handleAcceptBody,
                    handleRejectBody
                  )
                }
                
                {/* Chat History */}
                {chatHistory.map((msg, index) => (
                  <View key={index} style={styles.chatMessageContainer}>
                    {renderChatMessage(msg)}
                  </View>
                ))}
              </ScrollView>

              {/* Chat Input */}
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={[styles.chatInput, { color: colors.text.primary }]}
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  placeholder="Ask for enhancements..."
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { backgroundColor: colors.brand.primary }
                  ]}
                  onPress={handleSendChat}
                  disabled={isGenerating || !chatMessage.trim()}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Icon name="send" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BottomSheet>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#FFFFFF',
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
    padding: 6,
  },
  keyboardToolbar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bottomSheetContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  suggestionsScroll: {
    flex: 1,
    padding: 16,
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
}); 