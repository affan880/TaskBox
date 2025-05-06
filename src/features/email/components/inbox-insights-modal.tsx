import * as React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { useSortBySender, Sender } from '@/hooks/use-sort-by-sender';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Props for the modal
export type InboxInsightsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function InboxInsightsModal({ visible, onClose }: InboxInsightsModalProps) {
  const { colors } = useTheme();
  const [selectedSender, setSelectedSender] = React.useState<Sender | null>(null);
  const { isLoading, error, senders, fetchSenders, fetchSenderEmails } = useSortBySender();

  React.useEffect(() => {
    if (visible) fetchSenders();
    else setSelectedSender(null);
  }, [visible, fetchSenders]);

  const handleSenderPress = (sender: Sender) => {
    setSelectedSender(sender);
    fetchSenderEmails(sender.email);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.flex1, { backgroundColor: colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border.light, backgroundColor: colors.background.primary }]}>
          <TouchableOpacity onPress={selectedSender ? () => setSelectedSender(null) : onClose} accessibilityLabel="Close insights">
            <Icon name={selectedSender ? 'arrow-left' : 'close'} size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {selectedSender ? selectedSender.email : 'Inbox Insights'}
          </Text>
        </View>
        {/* Content */}
        <View style={styles.flex1}>
          {isLoading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.brand.primary} />
            </View>
          )}
          {error && (
            <View style={[styles.centered, { paddingHorizontal: 32 }]}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => selectedSender ? fetchSenderEmails(selectedSender.email) : fetchSenders()} style={[styles.retryButton, { backgroundColor: colors.brand.primary }]}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {!isLoading && !error && !selectedSender && (
            <FlatList
              data={senders}
              keyExtractor={item => item.email}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.senderItem, { backgroundColor: colors.background.secondary }]}
                  onPress={() => handleSenderPress(item)}
                  accessibilityLabel={`View emails from ${item.email}`}
                >
                  <Icon name="account-circle" size={32} color={colors.brand.primary} style={styles.senderIcon} />
                  <View style={styles.flex1}>
                    <Text style={[styles.senderEmail, { color: colors.text.primary }]}>{item.email}</Text>
                    <Text style={styles.senderMeta}>{item.emailCount} emails • Last: {new Date(item.lastEmailDate).toLocaleDateString()}</Text>
                  </View>
                  <Icon name="chevron-right" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No senders found.</Text>}
            />
          )}
          {!isLoading && !error && selectedSender && (
            <FlatList
              data={selectedSender.emails}
              keyExtractor={item => item.messageId}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={[styles.emailItem, { backgroundColor: colors.background.primary }]}>
                  <Text style={[styles.emailSubject, { color: colors.text.primary }]}>{item.subject}</Text>
                  <Text style={styles.emailDate}>{new Date(item.date).toLocaleString()}</Text>
                  <Text style={styles.emailSnippet}>{item.snippet}</Text>
                  {item.hasAttachments && (
                    <View style={styles.attachmentRow}>
                      <Icon name="attachment" size={16} color={colors.brand.primary} />
                      <Text style={styles.attachmentText}>Attachment</Text>
                    </View>
                  )}
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No emails from this sender.</Text>}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  listContent: {
    padding: 16,
  },
  senderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
  },
  senderIcon: {
    marginRight: 12,
  },
  senderEmail: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  senderMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 32,
    fontSize: 15,
  },
  emailItem: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  emailSubject: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  emailDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  emailSnippet: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  attachmentText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
}); 