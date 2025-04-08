import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

type ComposeEmailModalProps = {
  visible: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => Promise<void>;
};

export function ComposeEmailModal({ visible, onClose, onSend }: ComposeEmailModalProps) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const recipientInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    if (visible) {
      setTimeout(() => recipientInputRef.current?.focus(), 100);
    }

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setRecipient('');
      setSubject('');
      setMessageBody('');
      setIsLoading(false);
    }
  }, [visible]);

  const handleSend = async () => {
    if (!recipient.trim()) {
      Alert.alert('Error', 'Please enter a recipient email address');
      return;
    }
    
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject for your email');
      return;
    }
    
    if (!messageBody.trim()) {
      Alert.alert('Error', 'Please enter a message body');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSend(recipient.trim(), subject.trim(), messageBody.trim());
    } catch (error) {
      console.error('Failed to send email:', error);
      
      let errorMessage = 'Failed to send email. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes("Buffer")) {
          errorMessage = 'Email encoding error. Please try with a simpler message.';
        } else if (error.message.includes("network")) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes("401") || error.message.includes("403")) {
          errorMessage = 'Authentication error. Please sign in again.';
        }
      }
      
      Alert.alert('Error Sending Email', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (!isLoading) onClose();
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose}
              disabled={isLoading}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSend}
              disabled={isLoading}
              style={[styles.headerButton, styles.sendButton]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.headerButtonText, styles.sendButtonText]}>
                  Send
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <TextInput
              ref={recipientInputRef}
              style={styles.input}
              placeholder="To"
              value={recipient}
              onChangeText={setRecipient}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Subject"
              value={subject}
              onChangeText={setSubject}
              editable={!isLoading}
            />
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Message"
              value={messageBody}
              onChangeText={setMessageBody}
              multiline
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    paddingVertical: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  messageInput: {
    flex: 1,
    borderBottomWidth: 0,
    textAlignVertical: 'top',
  },
}); 