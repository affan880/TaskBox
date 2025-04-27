import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChipInput } from '@/components/ui/chip-input';
import { useTheme } from '@/theme/theme-context';

// Basic email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RecipientFieldsProps = {
  recipients: string[];
  setRecipients: (values: string[]) => void;
  ccRecipients: string[];
  setCcRecipients: (values: string[]) => void;
  bccRecipients: string[];
  setBccRecipients: (values: string[]) => void;
  showCcBcc: boolean;
  setShowCcBcc: (value: React.SetStateAction<boolean>) => void;
};

export function RecipientFields({
  recipients,
  setRecipients,
  ccRecipients,
  setCcRecipients,
  bccRecipients,
  setBccRecipients,
  showCcBcc,
  setShowCcBcc,
}: RecipientFieldsProps): React.ReactElement {
  const { colors } = useTheme();

  // Define styles using StyleSheet
  const styles = StyleSheet.create({
    container: {
      // No specific container styles needed, rows handle padding
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    label: {
      width: 40,
      fontSize: 16,
      fontWeight: '500',
      color: colors.text.secondary,
    },
    chipInputContainer: {
      flex: 1,
      minHeight: 40,
    },
    chipInput: {
      fontSize: 16,
      color: colors.text.primary,
      flex: 1,
    },
    ccBccButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginLeft: 8, // Add some spacing
    },
    ccBccButtonText: {
      color: colors.brand.primary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.light,
    },
    chipStyle: {
      backgroundColor: `${colors.brand.primary}20`,
    },
    // chipTextStyle prop removed earlier due to errors
  });

  const validateEmail = (email: string): boolean => {
    return emailRegex.test(email);
  };

  return (
    <View style={styles.container}>
      {/* To Field */}
      <View style={styles.row}>
        <Text style={styles.label}>To:</Text>
        <View style={styles.chipInputContainer}>
          <ChipInput
            values={recipients}
            onChangeValues={setRecipients}
            placeholder="Enter email addresses"
            inputStyle={styles.chipInput}
            chipStyle={styles.chipStyle}
            validate={validateEmail}
            autoFocus
          />
        </View>
        <TouchableOpacity
          style={styles.ccBccButton}
          onPress={() => setShowCcBcc((prev) => !prev)}
        >
          <Text style={styles.ccBccButtonText}>
            {showCcBcc ? 'Hide CC/BCC' : 'CC/BCC'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* CC and BCC fields (conditionally shown) */}
      {showCcBcc && (
        <>
          {/* Cc Field */}
          <View style={styles.row}>
            <Text style={styles.label}>Cc:</Text>
            <View style={styles.chipInputContainer}>
              <ChipInput
                values={ccRecipients}
                onChangeValues={setCcRecipients}
                placeholder="Carbon copy recipients"
                inputStyle={styles.chipInput}
                chipStyle={styles.chipStyle}
                validate={validateEmail}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Bcc Field */}
          <View style={styles.row}>
            <Text style={styles.label}>Bcc:</Text>
            <View style={styles.chipInputContainer}>
              <ChipInput
                values={bccRecipients}
                onChangeValues={setBccRecipients}
                placeholder="Blind carbon copy recipients"
                inputStyle={styles.chipInput}
                chipStyle={styles.chipStyle}
                validate={validateEmail}
              />
            </View>
          </View>

          <View style={styles.divider} />
        </>
      )}
    </View>
  );
} 