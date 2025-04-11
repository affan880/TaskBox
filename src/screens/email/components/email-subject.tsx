// src/screens/email/components/email-subject.tsx
import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type EmailSubjectProps = {
  subject: string;
  isStarred: boolean;
  isDemo: boolean;
  gmailTheme: any; // TODO: Define stricter theme type
  onStarToggle: () => void;
};

export function EmailSubject({
  subject,
  isStarred,
  isDemo,
  gmailTheme,
  onStarToggle,
}: EmailSubjectProps): React.ReactElement {
  // Rule: Functional Component
  const isDark = gmailTheme === GMAIL_COLORS.dark; // Simple check

  return (
    <View style={styles.subjectContainer}>
      <Text style={[styles.emailSubject, { color: gmailTheme.text.primary }]}>
        {subject}
      </Text>

      <TouchableOpacity
        style={styles.starButton}
        onPress={onStarToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon
          name={isStarred ? "star" : "star-outline"}
          size={22}
          color={isStarred ? gmailTheme.label.flagged : gmailTheme.text.secondary}
        />
      </TouchableOpacity>

      {/* Rule: Conditional Rendering */}
      {isDemo && (
        <View style={[styles.demoChip, { backgroundColor: isDark ? '#454A64' : '#DADCE0' }]}>
          <Text style={[styles.demoChipText, { color: isDark ? '#ffffff' : '#5F6368' }]}>DEMO</Text>
        </View>
      )}
    </View>
  );
}

// Temporary GMAIL_COLORS reference
// TODO: Remove this
const GMAIL_COLORS = {
    dark: { /* ... */ text: { primary: '#E8EAED', secondary: '#9AA0A6' }, label: { flagged: '#FDD663' } },
    light: { /* ... */ text: { primary: '#202124', secondary: '#5F6368' }, label: { flagged: '#F29900' } }
};

// Rule: Styles grouped at the bottom
const styles = StyleSheet.create({
  subjectContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16, // Add bottom padding before sender info
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items start for wrapping subject text
    flexWrap: 'wrap', // Allow wrapping if subject is long
  },
  emailSubject: {
    fontSize: 20,
    fontWeight: '400',
    flex: 1, // Take available space
    marginRight: 8, // Space before star
    // Allow subject to wrap naturally
  },
  starButton: {
    padding: 4, // Smaller padding around star icon itself
    // Position will be handled by flexbox layout
  },
  demoChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8, // Space from star
    marginTop: 4, // Align with subject text if it wraps
    alignSelf: 'flex-start', // Align to start
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
});