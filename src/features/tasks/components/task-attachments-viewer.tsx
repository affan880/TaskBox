import * as React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { TaskAttachment } from '@/types/task';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TaskAttachmentDownloader } from './task-attachment-downloader';

type TaskAttachmentsViewerProps = {
  attachments: TaskAttachment[];
  title?: string;
  maxInitialItems?: number;
};

export function TaskAttachmentsViewer({ 
  attachments, 
  title = 'Attachments', 
  maxInitialItems = 3 
}: TaskAttachmentsViewerProps) {
  const { colors, isDark } = useTheme();
  const [showAll, setShowAll] = useState(false);
  
  if (!attachments || attachments.length === 0) {
    return null;
  }
  
  const displayedAttachments = showAll 
    ? attachments 
    : attachments.slice(0, maxInitialItems);
  
  const hasMoreToShow = attachments.length > maxInitialItems;
  
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
            {title}
          </Text>
        </View>
        
        {hasMoreToShow && (
          <TouchableOpacity 
            onPress={() => setShowAll(!showAll)}
            style={styles.toggleButton}
          >
            <Text 
              style={[
                styles.toggleText, 
                { color: colors.brand.primary }
              ]}
            >
              {showAll 
                ? 'Show Less' 
                : `Show All (${attachments.length})`
              }
            </Text>
            <Icon 
              name={showAll ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
              size={18} 
              color={colors.brand.primary} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.attachmentsList}>
        {displayedAttachments.map((attachment) => (
          <TaskAttachmentDownloader 
            key={attachment.id} 
            attachment={attachment} 
          />
        ))}
      </View>
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
  },
  attachmentsList: {
    marginTop: 4,
  }
}); 