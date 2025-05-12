import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';

type EmailSenderInfoProps = {
  senderInitial: string;
  senderName: string;
  senderEmail: string;
  formattedDate: string; // Consider passing Date object and formatting here/in util
  toRecipient: string; // e.g., "me" or actual recipients
  ccRecipients?: string; // Optional CC recipients
  isExpanded: boolean;
  onToggleExpand: () => void;
  gmailTheme: any; // TODO: Define stricter theme type
};

export function EmailSenderInfo({
  senderInitial,
  senderName,
  senderEmail,
  formattedDate,
  toRecipient,
  ccRecipients,
  isExpanded,
  onToggleExpand,
  gmailTheme,
}: EmailSenderInfoProps): React.ReactElement {
  // Rule: Functional Component
  const isDark = gmailTheme === GMAIL_COLORS.dark; // Simple check

  return (
    <View style={[
      styles.senderContainer,
      {
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        transform: [{ rotate: '0.5deg' }],
      }
    ]}>
      {/* Avatar */}
      <View style={[
        styles.avatarCircle,
        {
          backgroundColor: '#ff3333',
          borderColor: '#000000',
          transform: [{ rotate: '-1deg' }],
        }
      ]}>
        <Text style={styles.avatarText}>{senderInitial}</Text>
      </View>

      {/* Details */}
      <View style={styles.senderDetails}>
        {/* Collapsed Row */}
        <View style={styles.senderRow}>
          <Text style={styles.senderName} numberOfLines={1} ellipsizeMode="tail">
            {senderName}
          </Text>
          <Text style={styles.dateText}>
            {formattedDate}
          </Text>
        </View>

        {/* Recipient Row with Expand Toggle */}
        <View style={styles.recipientRow}>
          <Text style={styles.recipientText} numberOfLines={1}>
            to {toRecipient}
          </Text>
          <TouchableOpacity
            onPress={onToggleExpand}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.expandButton,
              {
                backgroundColor: '#ffde59',
                borderColor: '#000000',
                transform: [{ rotate: '-1deg' }],
              }
            ]}
          >
            <Icon
              name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={18}
              color="#000000"
            />
          </TouchableOpacity>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <Animatable.View
            animation="fadeIn"
            duration={200}
            style={[
              styles.expandedHeader,
              {
                backgroundColor: '#ffffff',
                borderColor: '#000000',
                transform: [{ rotate: '-0.5deg' }],
              }
            ]}
          >
            <View style={styles.headerDetailRow}>
              <Text style={styles.headerLabel}>From:</Text>
              <Text style={styles.headerValue} selectable>
                {senderName} &lt;{senderEmail}&gt;
              </Text>
            </View>
            <View style={styles.headerDetailRow}>
              <Text style={styles.headerLabel}>To:</Text>
              <Text style={styles.headerValue} selectable>
                {toRecipient}
              </Text>
            </View>
            {ccRecipients && (
              <View style={styles.headerDetailRow}>
                <Text style={styles.headerLabel}>Cc:</Text>
                <Text style={styles.headerValue} selectable>
                  {ccRecipients}
                </Text>
              </View>
            )}
            <View style={styles.headerDetailRow}>
              <Text style={styles.headerLabel}>Date:</Text>
              <Text style={styles.headerValue} selectable>
                {formattedDate}
              </Text>
            </View>
          </Animatable.View>
        )}
      </View>
    </View>
  );
}

// Temporary GMAIL_COLORS reference
// TODO: Remove this
const GMAIL_COLORS = {
    dark: { /* ... */ primary: '#8AB4F8', text: { primary: '#E8EAED', secondary: '#9AA0A6' }, border: '#3C4043' },
    light: { /* ... */ primary: '#1A73E8', text: { primary: '#202124', secondary: '#5F6368' }, border: '#DADCE0' }
};


// Rule: Styles grouped at the bottom
const styles = StyleSheet.create({
  senderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    borderWidth: 4,
    borderRadius: 0,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 4,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  senderDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  senderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    flexShrink: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  recipientText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginRight: 8,
    flexShrink: 1,
  },
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  expandedHeader: {
    marginTop: 12,
    padding: 12,
    borderWidth: 4,
    borderRadius: 0,
  },
  headerDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    width: 50,
    marginRight: 8,
  },
  headerValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    flex: 1,
  },
});
