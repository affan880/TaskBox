import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { Text } from '@/components/ui';
import { EmailModal, EmailButton } from './shared';

type CreateTaskModalProps = {
  isVisible: boolean;
  onClose: () => void;
  suggestedText?: string;
  isLoading?: boolean;
  onCreateTask?: () => void;
};

export function CreateTaskModal({ 
  isVisible, 
  onClose, 
  suggestedText,
  isLoading,
  onCreateTask
}: CreateTaskModalProps) {
  const { colors } = useTheme();

  return (
    <EmailModal
      isVisible={isVisible}
      onClose={onClose}
      title="Create Task"
    >
      <View style={styles.content}>
        {suggestedText && (
          <Text style={[styles.suggestedText, { color: colors.textSecondary }]}>
            Suggested Task: {suggestedText}
          </Text>
        )}
        
        <Text style={[styles.infoText, { color: colors.text }]}>
          (Task creation functionality not yet implemented)
        </Text>

        <View style={styles.buttonContainer}>
          <EmailButton
            onPress={onClose}
            label="Cancel"
            variant="ghost"
            size="small"
          />
          <EmailButton
            onPress={onCreateTask || (() => {})}
            label={isLoading ? "Creating Task..." : "Create Task"}
            variant="primary"
            size="small"
            disabled={isLoading}
            loading={isLoading}
          />
        </View>
      </View>
    </EmailModal>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  suggestedText: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
}); 