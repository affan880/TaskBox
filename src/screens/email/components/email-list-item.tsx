import * as React from 'react';
import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EmailData } from '../../../types/email';

type EmailListItemProps = {
  email: EmailData;
  onPress: (emailId: string) => void;
};

export const EmailListItem = memo(function EmailListItem({
  email,
  onPress,
}: EmailListItemProps) {
  const date = new Date(email.date);
  const isToday = new Date().toDateString() === date.toDateString();
  
  const formattedDate = isToday
    ? date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });

  return (
    <TouchableOpacity
      style={[styles.container, email.isUnread && styles.unread]}
      onPress={() => onPress(email.id)}
    >
      <View style={styles.content}>
        <Text style={[styles.from, email.isUnread && styles.unreadText]} numberOfLines={1}>
          {email.from}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      
      <Text style={[styles.subject, email.isUnread && styles.unreadText]} numberOfLines={1}>
        {email.subject}
      </Text>
      
      <Text style={styles.preview} numberOfLines={2}>
        {email.snippet}
      </Text>
      
      {email.hasAttachments && (
        <View style={styles.attachmentIndicator}>
          <Text style={styles.attachmentText}>📎</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
  },
  unread: {
    backgroundColor: '#f8f9fa',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  from: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  subject: {
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  preview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  attachmentIndicator: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  attachmentText: {
    fontSize: 16,
  },
}); 