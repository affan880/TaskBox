import React from 'react';
import { Modal, View, Text, Button, StyleSheet } from 'react-native';
import { useTheme } from 'src/theme/theme-context';

type SetReminderModalProps = {
  isVisible: boolean;
  onClose: () => void;
  suggestedText?: string; // Text from the detected intent
  suggestedDate?: string | null; // Optional date from intent
};

export function SetReminderModal({ 
  isVisible, 
  onClose, 
  suggestedText,
  suggestedDate
}: SetReminderModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.background.primary }]}>
          <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Set Reminder</Text>
          
          {suggestedText && (
            <Text style={[styles.suggestedText, { color: colors.text.secondary }]}>
              Suggested: {suggestedText}
            </Text>
          )}
          
          {suggestedDate && (
             <Text style={[styles.suggestedText, { color: colors.text.secondary }]}>
              Suggested Date: {new Date(suggestedDate).toLocaleString()}
            </Text>
          )}
          
          <Text style={{ color: colors.text.primary, marginBottom: 15 }}>
            (Reminder functionality not yet implemented)
          </Text>

          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={onClose} color={colors.text.secondary} />
            {/* Add a Confirm button later */}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Reverted styles
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  suggestedText: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
}); 