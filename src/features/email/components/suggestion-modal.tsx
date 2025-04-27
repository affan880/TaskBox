import * as React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Pressable, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions
} from 'react-native';
import { ScrollView as GestureHandlerScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { SuggestionChat } from './suggestion-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatMessage = {
  type: 'user' | 'assistant';
  message: string;
};

interface SuggestionModalProps {
  visible: boolean;
  onClose: () => void;
  generatedSubject: string | null;
  generatedBody: string | null;
  showGeneratedSubject: boolean;
  showGeneratedBody: boolean;
  onAcceptSubject: () => void;
  onRejectSubject: () => void;
  onAcceptBody: () => void;
  onRejectBody: () => void;
  chatHistory: ChatMessage[];
  chatMessage: string;
  setChatMessage: (value: string) => void;
  onSendChat: () => void;
  isGenerating: boolean;
}

export function SuggestionModal({
  visible,
  onClose,
  generatedSubject,
  generatedBody,
  showGeneratedSubject,
  showGeneratedBody,
  onAcceptSubject,
  onRejectSubject,
  onAcceptBody,
  onRejectBody,
  chatHistory,
  chatMessage,
  setChatMessage,
  onSendChat,
  isGenerating,
}: SuggestionModalProps): React.ReactElement {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const { height: screenHeight } = Dimensions.get('window');
  
  // Listen to keyboard events
  React.useEffect(() => {
    const keyboardWillShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardWillHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardDidShowListener = Keyboard.addListener(keyboardWillShow, () => {
      setKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener(keyboardWillHide, () => {
      setKeyboardVisible(false);
    });
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Calculate modal height based on keyboard state
  const modalHeight = React.useMemo(() => {
    const baseHeight = keyboardVisible ? '100%' : '80%';
    return baseHeight;
  }, [keyboardVisible]);

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      margin: 0,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: 'white',
      width: '100%',
      height: modalHeight,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden',
    },
    innerContent: {
      flex: 1,
      flexDirection: 'column',
    },
    modalCloseButton: {
      position: 'absolute',
      top: 10,
      right: 15,
      padding: 5,
      zIndex: 10,
    },
    suggestionsContainer: {
      flex: 1,
      maxHeight: screenHeight * 0.3, // Limit to 30% of screen height
    },
    chatContainer: {
      flex: 1, // Take remaining space
    },
    suggestionContainer: {
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#E8EAED',
    },
    suggestionLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text.secondary,
      marginBottom: 4,
    },
    generatedText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.primary,
      marginBottom: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
      gap: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    acceptButton: {
      backgroundColor: `${colors.brand.primary}10`,
    },
    rejectButton: {
      backgroundColor: colors.background.tertiary,
    },
    actionButtonText: {
      marginLeft: 4,
      fontSize: 13,
      fontWeight: '500',
    },
    acceptButtonText: {
      color: colors.brand.primary,
    },
    rejectButtonText: {
      color: colors.text.tertiary,
    },
    headerText: {
      padding: 10, 
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center',
    },
    emptyContainer: {
      padding: 16,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.text.secondary,
      fontSize: 14,
    },
  });

  const renderSuggestion = (
    type: 'subject' | 'body',
    content: string | null, 
    onAccept: () => void,
    onReject: () => void
  ) => {
    // Prevent rendering if content is not a valid string
    if (typeof content !== 'string' || !content.trim()) {
      return null;
    }
    
    return (
      <View style={styles.suggestionContainer}>
        <Text style={styles.suggestionLabel}>
          {`Suggested ${type === 'subject' ? 'Subject Line' : 'Message'}`}
        </Text>
        <Text style={styles.generatedText}>
          {content}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => {
              onAccept();
              // Modal stays open for chat
            }}
          >
            <Icon name="check" size={16} color={colors.brand.primary} />
            <Text style={[styles.actionButtonText, styles.acceptButtonText]}>
              Use
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => {
              onReject();
              // Modal stays open for chat
            }}
          >
            <Icon name="close" size={16} color={colors.text.tertiary} />
            <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        
        <KeyboardAvoidingView
          style={{ width: '100%' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 10 : 0}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={onClose}
            >
              <Icon name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
            
            <View style={styles.innerContent}>
              <Text style={styles.headerText}>Email Suggestions</Text>
              
              <View style={styles.suggestionsContainer}>
                <GestureHandlerScrollView
                  contentContainerStyle={{ paddingBottom: 10 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {showGeneratedSubject && typeof generatedSubject === 'string' && generatedSubject.trim()
                    ? renderSuggestion('subject', generatedSubject, onAcceptSubject, onRejectSubject)
                    : null
                  }
                  
                  {showGeneratedBody && typeof generatedBody === 'string' && generatedBody.trim()
                    ? renderSuggestion('body', generatedBody, onAcceptBody, onRejectBody)
                    : null
                  }
                  
                  {(!showGeneratedSubject && !showGeneratedBody) && (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No suggestions available</Text>
                    </View>
                  )}
                </GestureHandlerScrollView>
              </View>
              
              <View style={styles.chatContainer}>
                <SuggestionChat
                  chatHistory={chatHistory}
                  chatMessage={chatMessage}
                  setChatMessage={setChatMessage}
                  onSendChat={onSendChat}
                  isGenerating={isGenerating}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
} 