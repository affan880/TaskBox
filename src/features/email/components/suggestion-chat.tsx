import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Keyboard, 
  Platform, 
  Dimensions 
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';

type ChatMessage = {
  type: 'user' | 'assistant';
  message: string;
};

interface SuggestionChatProps {
  chatHistory: ChatMessage[];
  chatMessage: string;
  setChatMessage: (value: string) => void;
  onSendChat: () => void;
  isGenerating: boolean;
}

export function SuggestionChat({
  chatHistory,
  chatMessage,
  setChatMessage,
  onSendChat,
  isGenerating,
}: SuggestionChatProps): React.ReactElement {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const { height: screenHeight } = Dimensions.get('window');
  
  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Scroll to the end when keyboard shows
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatHistory.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    chatScrollView: {
      flex: 1,
    },
    chatContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    emptyChatContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      minHeight: 100,
    },
    emptyChatText: {
      color: colors.text.tertiary,
      fontSize: 14,
      fontStyle: 'italic',
    },
    chatMessageContainer: {
      marginVertical: 4,
    },
    chatMessage: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 16,
      marginVertical: 4,
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: '#2563EB',
      borderBottomRightRadius: 4,
    },
    assistantMessage: {
      alignSelf: 'flex-start',
      backgroundColor: '#F3F4F6',
      borderBottomLeftRadius: 4,
    },
    chatMessageText: {
      fontSize: 14,
      lineHeight: 20,
    },
    chatInputContainer: {
      flexDirection: 'row',
      padding: 10,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      backgroundColor: '#FFFFFF',
    },
    chatInput: {
      flex: 1,
      maxHeight: 100,
      backgroundColor: '#F8F9FA',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      marginRight: 8,
      fontSize: 16,
      color: colors.text.primary,
    },
    sendButton: {
      backgroundColor: colors.brand.primary,
      borderRadius: 20,
      width: 40,
      height: 40, 
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-end',
    },
  });

  // Render a chat message
  const renderChatMessage = ({ type, message }: ChatMessage) => {
    if (typeof message !== 'string') {
      console.warn('[renderChatMessage] Warning: Received non-string message:', message);
      return null;
    }
    
    return (
      <View style={[
        styles.chatMessage,
        type === 'user' ? styles.userMessage : styles.assistantMessage
      ]}>
        <Text style={[
          styles.chatMessageText,
          { color: type === 'user' ? '#FFFFFF' : colors.text.primary }
        ]}>
          {message}
        </Text>
      </View>
    );
  };
  
  const handleSend = () => {
    if (chatMessage.trim() && !isGenerating) {
      onSendChat();
      inputRef.current?.focus();
    }
  };

  const handleContentSizeChange = (event: any) => {
    const { height } = event.nativeEvent.contentSize;
    setInputHeight(Math.min(Math.max(40, height), 100));
  };

  return (
    <View style={styles.container}>
      {/* Chat messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScrollView}
        contentContainerStyle={[
          styles.chatContainer,
          chatHistory.length === 0 && { flex: 1, justifyContent: 'center' }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {chatHistory.length > 0 ? (
          chatHistory.map((msg, index) => (
            <View key={index} style={styles.chatMessageContainer}>
              {renderChatMessage(msg)}
            </View>
          ))
        ) : (
          <View style={styles.emptyChatContainer}>
            <Text style={styles.emptyChatText}>
              Ask for suggestions or enhancements
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Chat input */}
      <View style={styles.chatInputContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.chatInput, { height: inputHeight }]}
          value={chatMessage}
          onChangeText={setChatMessage}
          placeholder="Ask for enhancements..."
          placeholderTextColor={colors.text.tertiary}
          multiline
          maxLength={1000}
          returnKeyType="default"
          blurOnSubmit={false}
          onContentSizeChange={handleContentSizeChange}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={isGenerating || !chatMessage.trim()}
          activeOpacity={0.7}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
} 