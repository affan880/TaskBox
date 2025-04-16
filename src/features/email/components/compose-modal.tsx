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
import { useTheme } from 'src/theme/theme-context';
import { Screen } from 'src/components/ui/screen';

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
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Screen style={[styles.container, { backgroundColor: '#ffffff' }]}>
        <View style={[
          styles.header, 
          { 
            backgroundColor: '#ffffff',
            borderBottomColor: 'rgba(120, 139, 255, 0.2)',
            borderBottomWidth: 1,
            shadowColor: 'rgba(0,0,0,0.1)', 
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 2
          }
        ]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            disabled={isSending}
          >
            <Text style={[
              styles.headerButtonText, 
              isSending && styles.disabledText
            ]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            New Message
          </Text>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSend}
            disabled={isSending}
          >
            <Text style={[
              styles.headerButtonText, 
              { 
                color: '#5c6ac4',
                fontWeight: '600'
              },
              isSending && styles.disabledText
            ]}>
              Send
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {isSending && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#5c6ac4" />
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
            placeholderTextColor="#718096"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Subject"
            value={subject}
            onChangeText={setSubject}
            editable={!isSending}
            placeholderTextColor="#718096"
          />
          
          <TextInput
            style={styles.bodyInput}
            placeholder="Message"
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
            editable={!isSending}
            placeholderTextColor="#718096"
          />
        </ScrollView>
      </Screen>
    </Modal>
    </Screen>
  );
}

ComposeEmailModal.displayName = 'ComposeEmailModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 139, 255, 0.2)',
    backgroundColor: '#ffffff',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#4a5568',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
  },
  disabledText: {
    color: '#718096',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 139, 255, 0.2)',
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#1a202c',
  },
  bodyInput: {
    flex: 1,
    height: 200,
    padding: 12,
    fontSize: 16,
    color: '#1a202c',
    backgroundColor: '#f1f5ff',
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