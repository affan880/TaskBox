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
    <View style={[styles.senderContainer, { borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }]}>
      {/* Avatar */}
      <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#5E81AC' : gmailTheme.primary }]}>
        <Text style={styles.avatarText}>{senderInitial}</Text>
      </View>

      {/* Details */}
      <View style={styles.senderDetails}>
        {/* Collapsed Row */}
        <View style={styles.senderRow}>
          <Text style={[styles.senderName, { color: gmailTheme.text.primary }]} numberOfLines={1} ellipsizeMode="tail">
            {senderName}
          </Text>
          <Text style={[styles.dateText, { color: gmailTheme.text.secondary }]}>
            {formattedDate} {/* TODO: Better date formatting (e.g., time ago) */}
          </Text>
        </View>

        {/* Recipient Row with Expand Toggle */}
        <View style={styles.recipientRow}>
          <Text style={[styles.recipientText, { color: gmailTheme.text.secondary }]} numberOfLines={1}>
            to {toRecipient}
          </Text>
          <TouchableOpacity
            onPress={onToggleExpand}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={18}
              color={gmailTheme.text.secondary}
            />
          </TouchableOpacity>
        </View>

        {/* Expanded Details */}
        {/* Rule: Conditional Rendering */}
        {isExpanded && (
          <Animatable.View
            animation="fadeIn"
            duration={200}
            style={[styles.expandedHeader, { borderTopColor: gmailTheme.border }]}
          >
            <View style={styles.headerDetailRow}>
              <Text style={[styles.headerLabel, { color: gmailTheme.text.secondary }]}>From:</Text>
              <Text style={[styles.headerValue, { color: gmailTheme.text.primary }]} selectable>{senderName} &lt;{senderEmail}&gt;</Text>
            </View>
            <View style={styles.headerDetailRow}>
              <Text style={[styles.headerLabel, { color: gmailTheme.text.secondary }]}>To:</Text>
              <Text style={[styles.headerValue, { color: gmailTheme.text.primary }]} selectable>{toRecipient}</Text>
            </View>
            {/* Rule: Conditional Rendering */}
            {ccRecipients && (
              <View style={styles.headerDetailRow}>
                <Text style={[styles.headerLabel, { color: gmailTheme.text.secondary }]}>Cc:</Text>
                <Text style={[styles.headerValue, { color: gmailTheme.text.primary }]} selectable>{ccRecipients}</Text>
              </View>
            )}
            <View style={styles.headerDetailRow}>
              <Text style={[styles.headerLabel, { color: gmailTheme.text.secondary }]}>Date:</Text>
              <Text style={[styles.headerValue, { color: gmailTheme.text.primary }]} selectable>{formattedDate}</Text>
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
    borderBottomWidth: 1,
    // borderBottomColor set dynamically
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  senderDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  senderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1, // Allow name to shrink if date is long
    marginRight: 8,
  },
  dateText: {
    fontSize: 12, // Make date slightly smaller
    marginLeft: 'auto', // Push date to the right
    flexShrink: 0, // Prevent date from shrinking
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2, // Adjust vertical spacing
  },
  recipientText: {
    fontSize: 14,
    marginRight: 4, // Space before dropdown icon
    flexShrink: 1, // Allow recipient text to shrink
  },
  expandedHeader: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  headerDetailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  headerLabel: {
    fontSize: 14,
    width: 50, // Keep fixed width for alignment
    marginRight: 8, // Space between label and value
  },
  headerValue: {
    fontSize: 14,
    flex: 1, // Allow value to take remaining space
  },
});
