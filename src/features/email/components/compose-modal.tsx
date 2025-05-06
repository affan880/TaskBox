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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EmailAttachment, EmailData } from '@/types/email';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string, attachments?: EmailAttachment[]) => void;
  mode?: 'reply' | 'reply-all' | 'forward' | 'new';
  email?: EmailData;
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

export const ComposeModal = React.memo(({ visible, onClose, onSend, mode, email }: Props) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { sendEmail } = useGmail();

  // State management
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['90%'], []);

  // Memoize initial form values
  const initialFormValues = useMemo(() => {
    if (!email || !mode) return null;

    switch (mode) {
      case 'reply':
        return {
          to: email.from,
          subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
          body: `\n\nOn ${new Date(email.date).toLocaleString()}, ${email.from} wrote:\n${stripHtml(email.body || '')}`
        };
      case 'reply-all':
        return {
          to: `${email.from}, ${email.to}`,
          subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
          body: `\n\nOn ${new Date(email.date).toLocaleString()}, ${email.from} wrote:\n${stripHtml(email.body || '')}`
        };
      case 'forward':
        return {
          to: '',
          subject: email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`,
          body: `\n\n---------- Forwarded message ---------\nFrom: ${email.from}\nDate: ${new Date(email.date).toLocaleString()}\nSubject: ${email.subject}\n\n${stripHtml(email.body || '')}`
        };
      default:
        return null;
    }
  }, [email, mode]);

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

  const handleSend = useCallback(async () => {
    if (!to) {
      showToast('Please enter a recipient');
      return;
    }

    setIsLoading(true);
    try {
      await onSend(to, subject, body, attachments);
      showToast('Email sent successfully');
      
      // Reset form
      setTo('');
      setSubject('');
      setBody('');
      setAttachments([]);
      
      onClose();
    } catch (error) {
      showToast('Failed to send email');
    } finally {
      setIsLoading(false);
    }
  }, [to, subject, body, attachments, onSend, onClose]);

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
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={0}
      enablePanDownToClose
      onDismiss={onClose}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.text }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { paddingBottom: insets.bottom }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Compose Email</Text>
          <TouchableOpacity onPress={handleAddAttachment} disabled={isLoading}>
            <Icon name="attach-file" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="To"
            placeholderTextColor={colors.textSecondary}
            value={to}
            onChangeText={setTo}
          />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Subject"
            placeholderTextColor={colors.textSecondary}
            value={subject}
            onChangeText={setSubject}
          />
          
          {attachments.length > 0 && attachmentList}
          
          <TextInput
            style={[styles.input, styles.bodyInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Message"
            placeholderTextColor={colors.textSecondary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="primary"
            onPress={handleSend}
            isLoading={isLoading}
            disabled={isLoading || isUploading}
          >
            Send
          </Button>
        </View>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  bodyInput: {
    flex: 1,
    minHeight: 200,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  attachmentsContainer: {
    marginBottom: 16,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 6,
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
}); 