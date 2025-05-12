import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { Clock } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useGmail } from '@/hooks/use-gmail';
import { showToast } from '@/components/ui/toast';
import * as DocumentPicker from '@react-native-documents/picker';
import RNBlobUtil from 'react-native-blob-util';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { EmailAttachment, EmailData } from '@/types/email';
import { EmailModal, EmailButton, EmailInput } from './shared';
import Modal from 'react-native-modal';

type Attachment = {
  filename: string;
  mimeType: string;
  data: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => Promise<boolean>;
};

// Helper functions moved outside component to prevent recreation
const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>/g, '');
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'videocam';
  if (type.startsWith('audio/')) return 'audiotrack';
  if (type.includes('pdf')) return 'picture-as-pdf';
  if (type.includes('word') || type.includes('document')) return 'description';
  if (type.includes('excel') || type.includes('sheet')) return 'table-chart';
  if (type.includes('powerpoint') || type.includes('presentation')) return 'slideshow';
  return 'insert-drive-file';
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Memoized attachment item component
const AttachmentItem = React.memo(({ 
  attachment, 
  onRemove, 
  colors, 
  currentUploadId, 
  uploadProgress 
}: { 
  attachment: EmailAttachment; 
  onRemove: (id: string) => void; 
  colors: any;
  currentUploadId: string | null;
  uploadProgress: number;
}) => (
  <View 
    style={[
      styles.attachmentItem, 
      { 
        backgroundColor: `${colors.background}15`,
        borderColor: `${colors.border}50`,
      }
    ]}
  >
    <View style={styles.attachmentContent}>
      <View style={styles.attachmentIcon}>
        {attachment.isUploading ? (
          <ActivityIndicator 
            size="small" 
            color={colors.primary} 
          />
        ) : (
          <Icon name={getFileIcon(attachment.type)} size={20} color={colors.primary} />
        )}
      </View>
      <View style={styles.attachmentDetails}>
        <Text 
          style={[styles.attachmentName, { color: colors.text }]}
          numberOfLines={1}
        >
          {attachment.name}
        </Text>
        <Text style={[styles.attachmentSize, { color: colors.textSecondary }]}>
          {attachment.isUploading ? 
            `Uploading... ${attachment.id === currentUploadId ? Math.round(uploadProgress) + '%' : ''}` : 
            formatFileSize(attachment.size)
          }
        </Text>
      </View>
    </View>
    <TouchableOpacity
      style={styles.attachmentRemove}
      onPress={() => onRemove(attachment.id)}
      disabled={attachment.isUploading}
    >
      <Icon 
        name="close" 
        size={16} 
        color={attachment.isUploading ? colors.textSecondary : colors.text} 
      />
    </TouchableOpacity>
  </View>
));

export function ComposeModal({ visible, onClose, onSend }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { sendEmail } = useGmail();

  // State management
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['90%'], []);

  // Memoize initial form values
  const initialFormValues = useMemo(() => {
    if (!subject) return null;

    return {
      to,
      subject,
      body,
    };
  }, [to, subject, body]);

  // Initialize form when email is provided
  useEffect(() => {
    if (initialFormValues) {
      setTo(initialFormValues.to);
      setSubject(initialFormValues.subject);
      setBody(initialFormValues.body);
    }
  }, [initialFormValues]);

  // Handle modal visibility
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  // Memoized handlers
  const handleAddAttachment = useCallback(async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });
      
      setIsUploading(true);
      
      for (const file of results) {
        const attachmentId = `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setCurrentUploadId(attachmentId);
        
        const tempAttachment: EmailAttachment = {
          id: attachmentId,
          name: file.name || 'Unnamed file',
          uri: file.uri,
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
          if (progress >= 100) {
            clearInterval(interval);
            setAttachments(prev => 
              prev.map(a => a.id === attachmentId ? { ...a, isUploading: false } : a)
            );
            setCurrentUploadId(null);
            setIsUploading(false);
          }
        }, 200);
      }
    } catch (err) {
      if (!(err instanceof Error && 'code' in err && err.code === 'DOCUMENT_PICKER_CANCELED')) {
        Alert.alert('Error', 'Failed to pick document');
        console.error('Document picker error:', err);
      }
      setIsUploading(false);
      setCurrentUploadId(null);
    }
  }, []);

  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  }, []);

  const handleSend = async () => {
    if (!to || !subject || !body) return;

    setIsSending(true);
    try {
      const success = await onSend(to, subject, body);
      if (success) {
        setTo('');
        setSubject('');
        setBody('');
        setAttachments([]);
        onClose();
      }
    } finally {
      setIsSending(false);
    }
  };

  // Memoize attachment list
  const attachmentList = useMemo(() => (
    <View style={styles.attachmentsContainer}>
      {attachments.map(attachment => (
        <AttachmentItem
          key={attachment.id}
          attachment={attachment}
          onRemove={handleRemoveAttachment}
          colors={colors}
          currentUploadId={currentUploadId}
          uploadProgress={uploadProgress}
        />
      ))}
    </View>
  ), [attachments, handleRemoveAttachment, colors, currentUploadId, uploadProgress]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      useNativeDriver
      style={styles.modal}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>New Email</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="To"
            placeholderTextColor={colors.textSecondary}
            value={to}
            onChangeText={setTo}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Subject"
            placeholderTextColor={colors.textSecondary}
            value={subject}
            onChangeText={setSubject}
          />
          <TextInput
            style={[styles.bodyInput, { color: colors.text }]}
            placeholder="Write your message..."
            placeholderTextColor={colors.textSecondary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
          onPress={handleSend}
        >
          <Icon name="send" size={20} color="#FFFFFF" />
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 4,
    borderColor: '#000000',
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 8,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
    transform: [{ rotate: '2deg' }],
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 0,
    padding: 12,
    fontSize: 16,
    fontWeight: '500',
    transform: [{ rotate: '1deg' }],
  },
  bodyInput: {
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 0,
    padding: 12,
    fontSize: 16,
    fontWeight: '500',
    minHeight: 200,
    transform: [{ rotate: '1deg' }],
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 0,
    marginTop: 20,
    borderWidth: 3,
    borderColor: '#000000',
    transform: [{ rotate: '2deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  attachmentsContainer: {
    marginTop: 24,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 12,
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