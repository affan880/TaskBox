import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
  const { colors, isDark } = useTheme();

  // Define styles using StyleSheet
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background.primary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 10 : 6,
      minHeight: Platform.OS === 'ios' ? 44 : 48,
      backgroundColor: colors.background.primary,
    },
    label: {
      width: 40,
      fontSize: Platform.OS === 'ios' ? 16 : 15,
      fontWeight: '500',
      color: colors.text.secondary,
      marginRight: Platform.OS === 'android' ? 8 : 0,
    },
    chipInputContainer: {
      flex: 1,
      minHeight: Platform.OS === 'ios' ? 40 : 44,
    },
    chipInput: {
      fontSize: Platform.OS === 'ios' ? 16 : 15,
      color: colors.text.primary,
      flex: 1,
      paddingVertical: Platform.OS === 'android' ? 8 : 0,
    },
    ccBccButton: {
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 4 : 8,
      marginLeft: 8,
    },
    ccBccButtonText: {
      color: colors.brand.primary,
      fontSize: Platform.OS === 'ios' ? 14 : 13,
      fontWeight: '500',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.light,
    },
    chipStyle: {
      backgroundColor: isDark ? `${colors.brand.primary}30` : `${colors.brand.primary}15`,
      marginVertical: Platform.OS === 'android' ? 2 : 0,
      borderRadius: Platform.OS === 'ios' ? 16 : 20,
    },
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
            autoFocus={false}
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