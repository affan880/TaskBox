// src/screens/email/components/email-detail-header.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'src/theme/theme-context';
import { SPACING, TYPOGRAPHY } from '../../../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


type EmailDetailHeaderProps = {
  gmailTheme: any;
  isActionLoading: boolean;
  onGoBack: () => void;
  onMarkAsRead?: () => void;
  onMarkAsUnread?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onReportSpam?: () => void;
  onMoveTo?: () => void;
  onAddLabel?: () => void;
  onSnooze?: () => void;
  onPrint?: () => void;
  onForward?: () => void;
  onReply?: () => void;
  onReplyAll?: () => void;
  isUnread: boolean;
};

export function EmailDetailHeader({
  gmailTheme,
  isActionLoading,
  onGoBack,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onDelete,
  onReportSpam,
  onMoveTo,
  onAddLabel,
  onSnooze,
  onPrint,
  onForward,
  onReply,
  onReplyAll,
  isUnread,
}: EmailDetailHeaderProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleMorePress = () => {
    setShowMoreMenu(true);
  };

  const handleAction = (action?: () => void) => {
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.background?.primary }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onGoBack}
          disabled={isActionLoading}
        >
          <Icon name="arrow-back" size={24} color={gmailTheme.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: gmailTheme.surface }]}
            onPress={onArchive}
            disabled={isActionLoading}
          >
            <Icon name="archive" size={24} color={gmailTheme.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: gmailTheme.surface }]}
            onPress={onDelete}
            disabled={isActionLoading}
          >
            <Icon name="delete" size={24} color={gmailTheme.text.primary} />
          </TouchableOpacity>

        </View>
      </View>

      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: gmailTheme.surface }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction(isUnread ? onMarkAsRead : onMarkAsUnread)}
            >
              <Icon
                name={isUnread ? "mark-email-read" : "mark-email-unread"}
                size={24}
                color={gmailTheme.text.primary}
              />
              <Text style={[styles.menuItemText, { color: gmailTheme.text.primary }]}>
                {isUnread ? "Mark as read" : "Mark as unread"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction(onReplyAll)}
            >
              <Icon name="reply-all" size={24} color={gmailTheme.text.primary} />
              <Text style={[styles.menuItemText, { color: gmailTheme.text.primary }]}>
                Reply all
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction(onForward)}
            >
              <Icon name="forward" size={24} color={gmailTheme.text.primary} />
              <Text style={[styles.menuItemText, { color: gmailTheme.text.primary }]}>
                Forward
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction(onSnooze)}
            >
              <Icon name="schedule" size={24} color={gmailTheme.text.primary} />
              <Text style={[styles.menuItemText, { color: gmailTheme.text.primary }]}>
                Snooze
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction(onAddLabel)}
            >
              <Icon name="label" size={24} color={gmailTheme.text.primary} />
              <Text style={[styles.menuItemText, { color: gmailTheme.text.primary }]}>
                Add label
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction(onMoveTo)}
            >
              <Icon name="folder" size={24} color={gmailTheme.text.primary} />
              <Text style={[styles.menuItemText, { color: gmailTheme.text.primary }]}>
                Move to
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction(onReportSpam)}
            >
              <Icon name="report" size={24} color={gmailTheme.text.primary} />
              <Text style={[styles.menuItemText, { color: gmailTheme.text.primary }]}>
                Report spam
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction(onPrint)}
            >
              <Icon name="print" size={24} color={gmailTheme.text.primary} />
              <Text style={[styles.menuItemText, { color: gmailTheme.text.primary }]}>
                Print
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    borderBottomWidth: 3,
    borderBottomColor: '#e0e0e0',
    marginTop: Platform.OS === 'ios' ? 20 : 30,
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 8,
    marginBottom: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 2,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '2deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    // elevation: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    padding: 2,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    width: '80%',
    borderRadius: 12,
    borderWidth: 3,
    padding: 20,
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '1deg' }],
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});