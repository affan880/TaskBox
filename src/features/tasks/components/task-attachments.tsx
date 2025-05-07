import * as React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { TaskAttachment } from '@/types/task';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatFileSize, getFileIcon, openFile } from './task-attachment-utils';

type TaskAttachmentsProps = {
  attachments: TaskAttachment[];
  title?: string;
  maxInitialItems?: number;
  onViewAttachment?: (attachment: TaskAttachment) => void;
  showActions?: boolean;
  onRemoveAttachment?: (attachmentId: string) => void;
};

export function TaskAttachments({
  attachments,
  title = 'Attachments',
  maxInitialItems = 3,
  onViewAttachment,
  showActions = false,
  onRemoveAttachment,
}: TaskAttachmentsProps) {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (!attachments?.length) {
    return null;
  }

  const displayedAttachments = expanded
    ? attachments
    : attachments.slice(0, maxInitialItems);

  const hasMore = attachments.length > maxInitialItems;

  const handleViewAttachment = async (attachment: TaskAttachment) => {
    try {
      if (onViewAttachment) {
        onViewAttachment(attachment);
      } else {
        await openFile(attachment.uri, attachment.type);
      }
    } catch (error) {
      console.error('Error viewing attachment:', error);
    }
  };

  const renderAttachment = ({ item }: { item: TaskAttachment }) => (
    <View style={[styles.attachmentItem, { borderColor: colors.border.light }]}>
      <TouchableOpacity
        style={styles.attachmentContent}
        onPress={() => handleViewAttachment(item)}
      >
        <Icon
          name={getFileIcon(item.type)}
          size={24}
          color={colors.text.secondary}
          style={styles.fileIcon}
        />
        <View style={styles.attachmentDetails}>
          <Text
            style={[styles.fileName, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={[styles.fileInfo, { color: colors.text.secondary }]}>
            {formatFileSize(item.size)}
          </Text>
        </View>
        {item.isUploading ? (
          <View style={styles.uploadingContainer}>
            <Text style={[styles.uploadingText, { color: colors.text.secondary }]}>
              Uploading...
            </Text>
          </View>
        ) : (
          showActions && onRemoveAttachment && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveAttachment(item.id)}
            >
              <Icon name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon
            name="attachment"
            size={18}
            color={colors.text.secondary}
            style={styles.titleIcon}
          />
          <Text style={[styles.title, { color: colors.text.secondary }]}>
            {title} ({attachments.length})
          </Text>
        </View>

        {hasMore && (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={styles.toggleButton}
          >
            <Text style={[styles.toggleText, { color: colors.brand.primary }]}>
              {expanded ? 'Show Less' : `Show All (${attachments.length})`}
            </Text>
            <Icon
              name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={18}
              color={colors.brand.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={displayedAttachments}
        renderItem={renderAttachment}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  listContent: {
    marginTop: 4,
  },
  attachmentItem: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  fileIcon: {
    marginRight: 12,
  },
  attachmentDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  fileInfo: {
    fontSize: 12,
  },
  uploadingContainer: {
    marginLeft: 8,
  },
  uploadingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
}); 