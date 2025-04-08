import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, View, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { useEmailActions } from './hooks/use-email-actions';
import { ComposeEmailModal } from './components/compose-modal';
import { ReadEmailModal } from './components/read-email-modal';
import { LabelModal } from './components/label-modal';
import { SnoozeModal } from './components/snooze-modal';
import { EmailListItem } from './components/email-list-item';
import type { EmailData } from '../../types/email';

export function EmailScreen() {
  const {
    isLoading,
    loadEmails,
    getEmailDetails,
    archiveEmail,
    deleteEmail,
    markAsUnread,
    applyLabel,
    snoozeEmail,
    sendEmail,
  } = useEmailActions();

  const [emails, setEmails] = useState<EmailData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<EmailData | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showReadModal, setShowReadModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  // Load emails on mount
  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fetchedEmails = await loadEmails();
      setEmails(fetchedEmails);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenEmail = async (emailId: string) => {
    const emailDetails = await getEmailDetails(emailId);
    if (emailDetails) {
      setCurrentEmail(emailDetails);
      setShowReadModal(true);
    }
  };

  const handleArchiveEmail = async (emailId: string) => {
    await archiveEmail(emailId);
    setEmails(prev => prev.filter(email => email.id !== emailId));
  };

  const handleDeleteEmail = async (emailId: string) => {
    await deleteEmail(emailId);
    setEmails(prev => prev.filter(email => email.id !== emailId));
  };

  const handleMarkAsUnread = async (emailId: string) => {
    await markAsUnread(emailId);
    setEmails(prev =>
      prev.map(email =>
        email.id === emailId ? { ...email, isUnread: true } : email
      )
    );
  };

  const handleApplyLabel = async (emailId: string, labelId: string) => {
    await applyLabel(emailId, labelId);
    setShowLabelModal(false);
  };

  const handleSnoozeEmail = async (emailId: string, snoozeUntil: Date) => {
    await snoozeEmail(emailId, snoozeUntil);
    setShowSnoozeModal(false);
    setEmails(prev => prev.filter(email => email.id !== emailId));
  };

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    await sendEmail(to, subject, body);
    setShowComposeModal(false);
    handleRefresh();
  };

  const renderEmailItem = useCallback(
    ({ item }: { item: EmailData }) => (
      <EmailListItem email={item} onPress={handleOpenEmail} />
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        <Text 
          style={styles.composeButton}
          onPress={() => setShowComposeModal(true)}
        >
          Compose
        </Text>
      </View>

      <FlatList
        data={emails}
        renderItem={renderEmailItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No emails found</Text>
            </View>
          )
        }
      />

      <ComposeEmailModal
        visible={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSend={handleSendEmail}
      />

      <ReadEmailModal
        visible={showReadModal}
        currentEmail={currentEmail}
        onClose={() => {
          setShowReadModal(false);
          setCurrentEmail(null);
        }}
        onArchive={handleArchiveEmail}
        onDelete={handleDeleteEmail}
        onLabel={async (emailId) => {
          setSelectedEmailId(emailId);
          setShowLabelModal(true);
        }}
        onSnooze={async (emailId) => {
          setSelectedEmailId(emailId);
          setShowSnoozeModal(true);
        }}
        onMarkAsUnread={handleMarkAsUnread}
      />

      <LabelModal
        visible={showLabelModal}
        onClose={() => {
          setShowLabelModal(false);
          setSelectedEmailId(null);
        }}
        onSelectLabel={async (labelId) => {
          if (selectedEmailId) {
            await handleApplyLabel(selectedEmailId, labelId);
          }
        }}
      />

      <SnoozeModal
        visible={showSnoozeModal}
        onClose={() => {
          setShowSnoozeModal(false);
          setSelectedEmailId(null);
        }}
        onSelectSnoozeTime={async (date) => {
          if (selectedEmailId) {
            await handleSnoozeEmail(selectedEmailId, date);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  composeButton: {
    color: '#0000ff',
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    color: '#666666',
  },
}); 