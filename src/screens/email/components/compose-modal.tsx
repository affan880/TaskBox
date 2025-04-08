import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../../../theme/colors';
import { Screen } from '../../../components/ui/screen';

type ComposeEmailModalProps = {
  visible: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => Promise<void>;
};

export function ComposeEmailModal({ visible, onClose, onSend }: ComposeEmailModalProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const toInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => toInputRef.current?.focus(), 100);
    } else {
      setTo('');
      setSubject('');
      setBody('');
      setIsSending(false);
    }
  }, [visible]);

  const handleSend = async () => {
    if (!to.trim()) {
      Alert.alert('Error', 'Please enter a recipient');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }

    setIsSending(true);
    try {
      await onSend(to.trim(), subject.trim(), body.trim());
    } catch (error) {
      Alert.alert('Error', 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Screen>
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (!isSending) onClose();
      }}
    >
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose}
            disabled={isSending}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Email</Text>
          <TouchableOpacity 
            onPress={handleSend}
            disabled={isSending}
            style={styles.headerButton}
          >
            <Text style={[
              styles.headerButtonText,
              isSending && styles.disabledText
            ]}>
              {isSending ? 'Sending...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {isSending && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.text.secondary} />
            </View>
          )}
          
          <TextInput
            ref={toInputRef}
            style={styles.input}
            placeholder="To"
            value={to}
            onChangeText={setTo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSending}
            placeholderTextColor={COLORS.text.tertiary}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Subject"
            value={subject}
            onChangeText={setSubject}
            editable={!isSending}
            placeholderTextColor={COLORS.text.tertiary}
          />
          
          <TextInput
            style={styles.bodyInput}
            placeholder="Message"
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
            editable={!isSending}
            placeholderTextColor={COLORS.text.tertiary}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background.secondary,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  disabledText: {
    color: COLORS.text.tertiary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  bodyInput: {
    flex: 1,
    height: 200,
    padding: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    textAlignVertical: 'top',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 