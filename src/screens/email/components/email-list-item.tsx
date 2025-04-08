import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EmailData } from '../../../types/email';
import { COLORS } from '../../../theme/colors';

type EmailListItemProps = {
  email: EmailData;
  onPress: (emailId: string) => void;
};

export function EmailListItem({ email, onPress }: EmailListItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, email.isUnread && styles.unreadContainer]}
      onPress={() => onPress(email.id)}
    >
      <View style={styles.content}>
        <Text 
          style={[styles.from, email.isUnread && styles.unreadText]} 
          numberOfLines={1}
        >
          {email.from}
        </Text>
        <Text 
          style={[styles.subject, email.isUnread && styles.unreadText]} 
          numberOfLines={1}
        >
          {email.subject}
        </Text>
        <Text 
          style={styles.snippet} 
          numberOfLines={2}
        >
          {email.snippet}
        </Text>
        <Text style={styles.date}>
          {new Date(email.date).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background.primary,
  },
  unreadContainer: {
    backgroundColor: COLORS.background.secondary,
  },
  content: {
    flex: 1,
  },
  from: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: COLORS.text.secondary,
  },
  subject: {
    fontSize: 16,
    marginBottom: 4,
    color: COLORS.text.primary,
  },
  snippet: {
    fontSize: 14,
    marginBottom: 4,
    color: COLORS.text.tertiary,
  },
  date: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  unreadText: {
    fontWeight: '600',
    color: COLORS.text.primary,
  },
}); 