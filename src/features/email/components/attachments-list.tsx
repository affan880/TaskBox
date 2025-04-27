import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { EmailAttachment } from '@/types/email';
import { AttachmentItem } from './attachment-item';

interface AttachmentsListProps {
  attachments: EmailAttachment[];
  onRemoveAttachment: (id: string) => void;
  currentUploadId: string | null;
  uploadProgress: number;
}

export function AttachmentsList({
  attachments,
  onRemoveAttachment,
  currentUploadId,
  uploadProgress,
}: AttachmentsListProps): React.ReactElement | null {
  const { colors } = useTheme();

  // Don't render anything if there are no attachments
  if (attachments.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
      color: colors.text.secondary,
    },
    list: {
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Attachments ({attachments.length})
      </Text>
      <View style={styles.list}>
        {attachments.map((attachment) => (
          <AttachmentItem
            key={attachment.id}
            attachment={attachment}
            onRemove={onRemoveAttachment}
            currentUploadId={currentUploadId}
            uploadProgress={uploadProgress}
          />
        ))}
      </View>
    </View>
  );
} 