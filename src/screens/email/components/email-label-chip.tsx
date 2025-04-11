// src/screens/email/components/email-label-chip.tsx
import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EmailLabel } from '../../../types/email'; // Assuming EmailLabel type is moved

type EmailLabelChipProps = {
  label: EmailLabel;
  gmailTheme: any; // TODO: Define stricter theme type
};

// Helper function to get display properties for a label
function getLabelProperties(label: EmailLabel, gmailTheme: any): { name: string; color: string } {
  // Rule: Function Purity
  const name = (() => {
    switch (label) {
      case 'important': return 'Important';
      case 'inbox': return 'Inbox';
      case 'sent': return 'Sent';
      case 'draft': return 'Draft';
      case 'starred': return 'Starred';
      case 'spam': return 'Spam';
      case 'trash': return 'Trash';
      case 'snoozed': return 'Snoozed';
      case 'forum': return 'Forums';
      case 'updates': return 'Updates';
      case 'promotions': return 'Promotions';
      case 'social': return 'Social';
      default:
        const labelStr = label as string;
        return labelStr.charAt(0).toUpperCase() + labelStr.slice(1);
    }
  })();

  const color = (() => {
    switch (label) {
      case 'important': return gmailTheme.label.important;
      case 'starred': return gmailTheme.label.flagged; // Assuming starred uses flagged color
      case 'draft': return gmailTheme.label.draft;
      default: return gmailTheme.label.inbox;
    }
  })();

  return { name, color };
}


export function EmailLabelChip({ label, gmailTheme }: EmailLabelChipProps): React.ReactElement {
  // Rule: Functional Component
  const { name, color } = getLabelProperties(label, gmailTheme);
  const isDark = gmailTheme === GMAIL_COLORS.dark; // Simple check based on object ref

  return (
    <View
      style={[
        styles.labelChip,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          borderLeftColor: color,
        }
      ]}
    >
      <Text style={[styles.labelText, { color: isDark ? gmailTheme.text.primary : gmailTheme.text.secondary }]}>
        {name}
      </Text>
    </View>
  );
}

// Temporary GMAIL_COLORS reference until theme is properly typed/passed
// TODO: Remove this when theme system is robust
const GMAIL_COLORS = {
    dark: { /* ... dark colors */
        text: { primary: '#E8EAED', secondary: '#9AA0A6' },
        label: { important: '#F28B82', flagged: '#FDD663', draft: '#9AA0A6', inbox: '#669DF6'}
    },
    light: { /* ... light colors */
        text: { primary: '#202124', secondary: '#5F6368' },
        label: { important: '#DB4437', flagged: '#F29900', draft: '#9AA0A6', inbox: '#0F5CDE'}
    }
};


// Rule: Styles grouped at the bottom
const styles = StyleSheet.create({
  labelChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
  },
});