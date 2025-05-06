import * as React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TextInput,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_URL } from '@/lib/env/api-config';

// Add tone options
const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional', icon: 'business' },
  { id: 'friendly', label: 'Friendly', icon: 'mood' },
  { id: 'formal', label: 'Formal', icon: 'description' },
  { id: 'casual', label: 'Casual', icon: 'chat' },
] as const;

// Add quick suggestions
const QUICK_SUGGESTIONS = [
  { id: 'meeting', label: 'Schedule Meeting', prompt: 'Generate a meeting request email' },
  { id: 'followup', label: 'Follow Up', prompt: 'Write a follow-up email' },
  { id: 'thank', label: 'Thank You', prompt: 'Compose a thank you email' },
  { id: 'introduce', label: 'Introduction', prompt: 'Write an introduction email' },
  { id: 'deadline', label: 'Deadline Extension', prompt: 'Request a deadline extension' },
  { id: 'feedback', label: 'Request Feedback', prompt: 'Ask for feedback on a project/work' },
];

type Tone = typeof TONE_OPTIONS[number]['id'];

type GeneratedEmail = {
  subject: string;
  body: string;
};

type ChatMessage = {
  type: 'user' | 'assistant';
  message: string;
  generatedEmail?: GeneratedEmail;
  isLoading?: boolean;
  isError?: boolean;
};

type StreamingState = {
  streamedChunks: string;
  isStreaming: boolean;
  streamError: string | null;
  streamedSubject: string | null;
  streamedBody: string | null;
  conversationContext: string | null;
  revisionHistory: Array<{ subject: string; body: string; timestamp?: string }>;
};

interface SuggestionModalProps {
  visible: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  chatMessage: string;
  setChatMessage: (value: string) => void;
  onUseSuggestion?: (email: GeneratedEmail) => void;
  setSubject?: (value: string) => void;
  setBody?: (value: string) => void;
}

export function SuggestionModal({
  visible,
  onClose,
  chatHistory: initialChatHistory, 
  chatMessage,
  setChatMessage,
  onUseSuggestion,
  setSubject,
  setBody,
}: SuggestionModalProps): React.ReactElement {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedTone, setSelectedTone] = React.useState<Tone>('professional');
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const inputRef = React.useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = React.useState(40);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamedChunks, setStreamedChunks] = React.useState('');
  const [currentSuggestion, setCurrentSuggestion] = React.useState<GeneratedEmail | null>(null);
  const [localChatHistory, setLocalChatHistory] = React.useState<ChatMessage[]>(initialChatHistory);
  const [revisionHistory, setRevisionHistory] = React.useState<Array<{ subject: string; body: string; timestamp?: string }>>([]);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [contentHeight, setContentHeight] = React.useState(0);
  const [scrollPosition, setScrollPosition] = React.useState(0);

  // Update localChatHistory when initialChatHistory changes
  React.useEffect(() => {
    if (initialChatHistory.length > 0) {
      setLocalChatHistory(prev => {
        // Only update if the new history is different
        const lastInitialMessage = initialChatHistory[initialChatHistory.length - 1];
        const lastPrevMessage = prev[prev.length - 1];
        
        if (!lastPrevMessage || lastPrevMessage.message !== lastInitialMessage.message) {
          return initialChatHistory;
        }
        return prev;
      });
    }
  }, [initialChatHistory]);

  // Handle keyboard show/hide with scroll position maintenance
  React.useEffect(() => {
    const keyboardWillShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardWillHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardDidShowListener = Keyboard.addListener(keyboardWillShow, (event) => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
      
      // Maintain scroll position when keyboard opens
      if (scrollViewRef.current && contentHeight > 0) {
        const newPosition = Math.max(0, contentHeight - event.endCoordinates.height);
        scrollViewRef.current.scrollTo({ y: newPosition, animated: false });
      }
    });
    
    const keyboardDidHideListener = Keyboard.addListener(keyboardWillHide, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      
      // Restore scroll position when keyboard hides
      if (scrollViewRef.current && scrollPosition > 0) {
        scrollViewRef.current.scrollTo({ y: scrollPosition, animated: false });
      }
    });
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [contentHeight, scrollPosition]);

  // Track scroll position
  const handleScroll = (event: any) => {
    setScrollPosition(event.nativeEvent.contentOffset.y);
  };

  // Track content size changes for ScrollView
  const handleScrollViewContentSizeChange = (width: number, height: number) => {
    setContentHeight(height);
  };

  // Track content size changes for TextInput
  const handleTextInputContentSizeChange = (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const { height } = event.nativeEvent.contentSize;
    setInputHeight(height);
  };

  const handleSend = () => {
    if (chatMessage.trim() && !isStreaming) {
      handleSendMessage();
    }
  };

  // Handle quick suggestion tap
  const handleQuickSuggestion = (prompt: string) => {
    setChatMessage(prompt);
    handleSendMessage(prompt, selectedTone);
  };

  // Modified handleSendMessage to handle all sending scenarios
  const handleSendMessage = async (message = chatMessage, tone = selectedTone) => {
    if (!message.trim() || isStreaming) return;

    try {
      setIsLoading(true);
      setIsStreaming(true);
      setStreamedChunks('');
      const userMessage = message.trim();
      setChatMessage('');

      // Keep existing chat history and add new message
      const updatedHistory: ChatMessage[] = [
        ...localChatHistory,
        { type: 'user', message: userMessage }
      ];
      setLocalChatHistory(updatedHistory);

      // Add loading message and scroll
      setLocalChatHistory(prev => {
        const newHistory: ChatMessage[] = [
          ...prev,
          { type: 'assistant', message: '...', isLoading: true }
        ];
        // Scroll after adding loading message
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return newHistory;
      });

      // Make API call with tone
      const response = await fetch(`${BASE_URL}/api/generate-email-with-revisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ 
          prompt: userMessage,
          context: updatedHistory.map(msg => msg.message).join('\n'),
          tone,
          isRevision: revisionHistory.length > 0,
          previousEmails: revisionHistory.length > 0 ? revisionHistory : undefined,
          revisionInstructions: revisionHistory.length > 0 ? userMessage : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove loading message
      setLocalChatHistory(prev => prev.filter(msg => !msg.isLoading));

      // Get the response text
      const text = await response.text();
      
      // Split the response into lines and process each SSE message
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            const data = JSON.parse(jsonStr);
            
            if (data.status === 'complete' && data.response) {
              const generatedEmail = {
                subject: data.response.subject,
                body: data.response.body
              };
              setCurrentSuggestion(generatedEmail);
              setRevisionHistory(prev => [
                ...prev,
                { subject: generatedEmail.subject, body: generatedEmail.body, timestamp: new Date().toISOString() }
              ]);
              
              // Update chat history with the complete response
              setLocalChatHistory(prev => [
                ...prev.filter(msg => !msg.isLoading), // Remove loading message
                {
                  type: 'assistant',
                  message: 'I have generated an email for you. Would you like to use it?',
                  generatedEmail
                }
              ]);
            } else if (data.content) {
              setStreamedChunks(prev => prev + data.content);
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err, 'Raw line:', line);
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sorry, there was an error processing your request. Please try again.';
      
      // Update chat history with error message
      setLocalChatHistory(prev => [
        ...prev.filter(msg => !msg.isLoading), // Remove loading message
        { 
          type: 'assistant', 
          message: errorMessage,
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamedChunks('');
      // Ensure we scroll to bottom after everything is done
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleUseSuggestion = () => {
    try {
      if (currentSuggestion) {
        // Update the input fields with the generated content
        if (setSubject) {
          setSubject(currentSuggestion.subject);
        }
        if (setBody) {
          setBody(currentSuggestion.body);
        }
        
        // Call the onUseSuggestion callback if provided
        if (onUseSuggestion) {
          onUseSuggestion(currentSuggestion);
        }
        
        // Close the modal
        onClose();
      }
    } catch (error) {
      console.error('Error using suggestion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sorry, there was an error using the suggestion.';
      setLocalChatHistory(prev => [
        ...prev,
        { 
          type: 'assistant', 
          message: errorMessage
        }
      ]);
    }
  };

  const handleSkipSuggestion = () => {
    try {
      setCurrentSuggestion(null);
      setLocalChatHistory(prev => [
        ...prev,
        { 
          type: 'assistant', 
          message: 'I understand. Let me know if you need any other help with your email.' 
        }
      ]);
    } catch (error) {
      console.error('Error skipping suggestion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sorry, there was an error skipping the suggestion.';
      setLocalChatHistory(prev => [
        ...prev,
        { 
          type: 'assistant', 
          message: errorMessage
        }
      ]);
    }
  };

  // Render tone selector
  const renderToneSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.toneContainer}
      contentContainerStyle={styles.toneContentContainer}
    >
      {TONE_OPTIONS.map((tone) => (
        <TouchableOpacity
          key={tone.id}
          style={[
            styles.toneChip,
            {
              backgroundColor: selectedTone === tone.id 
                ? `${colors.brand.primary}20`
                : isDark ? colors.background.secondary : colors.background.tertiary,
              borderColor: selectedTone === tone.id 
                ? colors.brand.primary
                : colors.border.light,
            },
          ]}
          onPress={() => setSelectedTone(tone.id)}
        >
          <Icon 
            name={tone.icon} 
            size={16} 
            color={selectedTone === tone.id ? colors.brand.primary : colors.text.secondary}
            style={styles.toneIcon}
          />
          <Text
            style={[
              styles.toneText,
              {
                color: selectedTone === tone.id 
                  ? colors.brand.primary 
                  : colors.text.secondary,
              },
            ]}
          >
            {tone.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render quick suggestions
  const renderQuickSuggestions = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.suggestionsContainer}
      contentContainerStyle={styles.suggestionsContentContainer}
    >
      {QUICK_SUGGESTIONS.map((suggestion) => (
        <TouchableOpacity
          key={suggestion.id}
          style={[
            styles.suggestionChip,
            {
              backgroundColor: isDark ? colors.background.secondary : colors.background.tertiary,
              borderColor: colors.border.light,
            },
          ]}
          onPress={() => handleQuickSuggestion(suggestion.prompt)}
        >
          <Text
            style={[
              styles.suggestionText,
              { color: colors.text.secondary },
            ]}
          >
            {suggestion.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render chat message with loading state
  const renderChatMessage = (message: ChatMessage, index: number) => (
    <View key={index} style={styles.chatMessageContainer}>
      <View
        style={[
          styles.chatMessage,
          message.type === 'user' 
            ? [styles.userMessage, { backgroundColor: colors.brand.primary }]
            : [styles.assistantMessage, { backgroundColor: isDark ? colors.background.secondary : '#F3F4F6' }],
        ]}
      >
        {message.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.brand.primary} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Generating response...
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.chatMessageText,
              message.type === 'user' 
                ? styles.userMessageText
                : [styles.assistantMessageText, { color: colors.text.primary }],
              message.isError && styles.errorMessageText,
            ]}
          >
            {message.message}
          </Text>
        )}
      </View>
      {message.generatedEmail && (
        <View style={[styles.suggestionContainer, {
          backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
          borderColor: colors.border.light
        }]}>
          <Text style={[styles.suggestionLabel, { color: colors.text.secondary }]}>Subject:</Text>
          <Text style={[styles.generatedText, { color: colors.text.primary }]}>{message.generatedEmail.subject}</Text>
          <Text style={[styles.suggestionLabel, { color: colors.text.secondary }]}>Body:</Text>
          <Text style={[styles.generatedText, { color: colors.text.primary }]}>{message.generatedEmail.body}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton, {
                backgroundColor: `${colors.brand.primary}20`
              }]}
              onPress={handleUseSuggestion}
            >
              <Icon name="check" size={16} color={colors.brand.primary} />
              <Text style={[styles.actionButtonText, { color: colors.brand.primary }]}>Use</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton, {
                backgroundColor: isDark ? colors.background.tertiary : colors.background.secondary
              }]}
              onPress={handleSkipSuggestion}
            >
              <Icon name="close" size={16} color={colors.text.tertiary} />
              <Text style={[styles.actionButtonText, { color: colors.text.tertiary }]}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    innerContent: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: insets.top,
      height: 56 + insets.top,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      backgroundColor: 'white',
    },
    backButton: {
      padding: 8,
    },
    headerText: {
      flex: 1, 
      color: colors.text.primary,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      marginRight: 40, // To center the text with back button on left
    },
    // Chat container
    contentContainer: {
      flex: 1,
    },
    chatScrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    // Message styles
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
    userMessageText: {
      color: '#FFFFFF',
    },
    assistantMessageText: {
      color: colors.text.primary,
    },
    // Empty state
    emptyChatContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      minHeight: 100,
    },
    emptyChatText: {
      color: colors.text.tertiary,
      fontSize: 16,
      fontStyle: 'italic',
    },
    // Suggestion styles
    suggestionContainer: {
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: '#E8EAED',
      alignSelf: 'flex-start',
      maxWidth: '90%',
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
    // Input styles - positioned at bottom
    inputContainer: {
      width: '100%',
      borderTopWidth: 1,
    },
    chatInputContainer: {
      flexDirection: 'row',
      padding: 10,
      paddingHorizontal: 16,
    },
    chatInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 8,
      fontSize: 15,
      color: colors.text.primary,
      borderWidth: 1,
      borderColor: colors.border.light,
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
    // Tone selector styles
    toneContainer: {
      maxHeight: 50,
      marginBottom: 8,
    },
    toneContentContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    toneChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
    },
    toneIcon: {
      marginRight: 6,
    },
    toneText: {
      fontSize: 13,
      fontWeight: '500',
    },
    // Quick suggestions styles
    suggestionsContainer: {
      maxHeight: 40,
      marginBottom: 16,
    },
    suggestionsContentContainer: {
      paddingHorizontal: 16,
      gap: 8,
    },
    suggestionChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
    },
    suggestionText: {
      fontSize: 13,
      fontWeight: '500',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    loadingText: {
      marginLeft: 8,
      fontSize: 14,
      fontStyle: 'italic',
    },
    errorMessageText: {
      color: '#DC2626',
    },
  });

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.background.primary }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background.primary }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            {/* Header */}
            <View style={[styles.headerContainer, { 
              borderBottomColor: colors.border.light,
              backgroundColor: colors.background.primary 
            }]}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Icon name="arrow-back" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.headerText, { color: colors.text.primary }]}>Email Suggestions</Text>
            </View>
            
            <View style={styles.innerContent}>
              <View style={styles.contentContainer}>
                {/* Tone selector */}
                {renderToneSelector()}
                
                {/* Quick suggestions */}
                {renderQuickSuggestions()}
                
                <ScrollView
                  ref={scrollViewRef}
                  style={[styles.chatScrollView, { backgroundColor: colors.background.primary }]}
                  contentContainerStyle={[
                    styles.scrollContent,
                    { 
                      paddingBottom: keyboardHeight > 0 ? keyboardHeight : 16,
                    }
                  ]}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={handleScrollViewContentSizeChange}
                  maintainVisibleContentPosition={{
                    minIndexForVisible: 0,
                    autoscrollToTopThreshold: 100,
                  }}
                >
                  {localChatHistory.map((message, index) => renderChatMessage(message, index))}
                  
                  {isStreaming && streamedChunks && (
                    <View style={styles.chatMessageContainer}>
                      <View style={[styles.chatMessage, styles.assistantMessage, {
                        backgroundColor: isDark ? colors.background.secondary : '#F3F4F6'
                      }]}>
                        <Text style={[styles.chatMessageText, styles.assistantMessageText, { color: colors.text.primary }]}>
                          {streamedChunks}
                          <Text style={{ color: colors.text.tertiary }}>▍</Text>
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
              
              {/* Input container */}
              <View style={[styles.inputContainer, {
                backgroundColor: colors.background.primary,
                borderTopColor: colors.border.light,
                paddingBottom: Platform.OS === 'ios' ? 15 : 16
              }]}>
                <View style={[styles.chatInputContainer, { backgroundColor: colors.background.primary }]}>
                  <TextInput
                    ref={inputRef}
                    style={[styles.chatInput, { 
                      height: inputHeight,
                      color: colors.text.primary,
                      backgroundColor: isDark ? colors.background.secondary : '#F8F9FA'
                    }]}
                    value={chatMessage}
                    onChangeText={setChatMessage}
                    placeholder="Ask for enhancements..."
                    placeholderTextColor={colors.text.tertiary}
                    multiline
                    maxLength={1000}
                    returnKeyType="default"
                    blurOnSubmit={false}
                    onContentSizeChange={handleTextInputContentSizeChange}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, {
                      backgroundColor: colors.brand.primary,
                      opacity: isLoading || !chatMessage.trim() ? 0.5 : 1
                    }]}
                    onPress={handleSend}
                    disabled={isLoading || !chatMessage.trim()}
                    activeOpacity={0.7}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Icon name="send" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
} 