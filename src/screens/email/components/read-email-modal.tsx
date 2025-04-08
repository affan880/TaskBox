import * as React from 'react';
import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { EmailData } from '../../../types/email';
import { parseHtmlContent } from '../utils/html-parser';
import { COLORS } from '../../../theme/colors';

type ReadEmailModalProps = {
  visible: boolean;
  currentEmail: EmailData | null;
  onClose: () => void;
  onArchive: (emailId: string) => Promise<void>;
  onDelete: (emailId: string) => Promise<void>;
  onLabel: (emailId: string, labelId: string) => Promise<void>;
  onSnooze: (emailId: string, date: Date) => Promise<void>;
  onMarkAsUnread: (emailId: string) => Promise<void>;
};

export function ReadEmailModal({
  visible,
  currentEmail,
  onClose,
  onArchive,
  onDelete,
  onLabel,
  onSnooze,
  onMarkAsUnread,
}: ReadEmailModalProps) {
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleAction = async (
    action: (emailId: string, ...args: any[]) => Promise<void>,
    ...args: any[]
  ) => {
    if (!currentEmail?.id || isActionLoading) return;

    setIsActionLoading(true);
    try {
      await action(currentEmail.id, ...args);
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!currentEmail) return null;

  const emailBody = currentEmail.body || '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (!isActionLoading) onClose();
      }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isActionLoading}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>Close</Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              {isActionLoading ? (
                <ActivityIndicator size="small" color={COLORS.text.secondary} />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleAction(onArchive)}
                  >
                    <Text style={styles.actionButtonText}>Archive</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleAction(onDelete)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButton]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleAction(onMarkAsUnread)}
                  >
                    <Text style={styles.actionButtonText}>Mark Unread</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <View style={styles.emailHeader}>
              <Text style={styles.subject}>{currentEmail.subject}</Text>
              <Text style={styles.from}>{currentEmail.from}</Text>
              <Text style={styles.date}>
                {new Date(currentEmail.date).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.body}>
              {parseHtmlContent(emailBody)}
            </Text>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background.secondary,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
  },
  actionButtonText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  deleteButton: {
    color: COLORS.error,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emailHeader: {
    marginBottom: 24,
    backgroundColor: COLORS.card.background,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.card.border,
  },
  subject: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text.primary,
  },
  from: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text.primary,
  },
}); 