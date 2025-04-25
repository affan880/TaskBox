import * as React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { TaskAttachment } from '@/types/task';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TaskAttachmentManager } from './task-attachment-manager';

type TaskAttachmentsListProps = {
  attachments: TaskAttachment[];
  title?: string;
  maxInitialItems?: number;
  onViewAttachment?: (attachment: TaskAttachment) => void;
};

export function TaskAttachmentsList({
  attachments,
  title = 'Attachments',
  maxInitialItems = 3,
  onViewAttachment
}: TaskAttachmentsListProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  if (!attachments.length) {
    return null;
  }
  
  // Show either all attachments or just the initial set based on expanded state
  const displayedAttachments = expanded 
    ? attachments 
    : attachments.slice(0, maxInitialItems);
  
  const hasMore = attachments.length > maxInitialItems;
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const renderItem = ({ item }: { item: TaskAttachment }) => (
    <TaskAttachmentManager
      attachment={item}
      onView={onViewAttachment}
    />
  );
  
  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {title} ({attachments.length})
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border.light }]} />
        </View>
      )}
      
      <FlatList
        data={displayedAttachments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
      
      {hasMore && (
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={toggleExpand}
        >
          <Text style={[styles.toggleText, { color: colors.brand.primary }]}>
            {expanded ? 'Show Less' : `Show More (${attachments.length - maxInitialItems})`}
          </Text>
          <Icon 
            name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
            size={16} 
            color={colors.brand.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
}); 