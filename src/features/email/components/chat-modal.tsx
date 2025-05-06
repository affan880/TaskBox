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
  Alert,
  Dimensions,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat, ChatMessage } from '@/hooks/use-chat';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  onAction?: (action: string, metadata?: any) => void;
}

export function ChatModal({
  visible,
  onClose,
  onAction,
}: ChatModalProps): React.ReactElement {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [chatMessage, setChatMessage] = React.useState('');
  const { messages, isLoading, sendMessage } = useChat();
  const scrollViewRef = React.useRef<ScrollView>(null);
  
  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });

  // Reset animation when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
    } else {
      translateY.value = SCREEN_HEIGHT;
    }
  }, [visible]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
    })
    .onEnd(() => {
      if (translateY.value > SWIPE_THRESHOLD) {
        translateY.value = withSpring(SCREEN_HEIGHT, {
          damping: 20,
          stiffness: 90,
        }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleSend = async () => {
    if (!chatMessage.trim() || isLoading) return;

    try {
      const result = await sendMessage(chatMessage);
      setChatMessage('');
      
      // Handle specific actions based on intent
      if (result?.intent && onAction) {
        onAction(result.intent, result.metadata);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const renderEmailAnalysis = (analysis: any) => {
    if (!analysis?.categorizedEmails) return null;

    return (
      <View style={[styles.analysisContainer, { 
        backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
        borderColor: colors.border.light
      }]}>
        <Text style={[styles.analysisTitle, { color: colors.text.primary }]}>
          Email Analysis
        </Text>
        {Object.entries(analysis.categorizedEmails).map(([category, emails]) => (
          <View key={category} style={styles.categoryContainer}>
            <Text style={[styles.categoryTitle, { color: colors.text.primary }]}>
              {category}
            </Text>
            <Text style={[styles.categoryCount, { color: colors.text.secondary }]}>
              {Array.isArray(emails) ? emails.length : 0} emails
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderEmailIntent = (intent: any) => {
    if (!intent?.suggestedAction) return null;

    return (
      <View style={[styles.intentContainer, { 
        backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
        borderColor: colors.border.light
      }]}>
        <Text style={[styles.intentTitle, { color: colors.text.primary }]}>
          Suggested Action
        </Text>
        <Text style={[styles.intentText, { color: colors.text.secondary }]}>
          {intent.suggestedAction.text}
        </Text>
        {intent.suggestedAction.dueDate && (
          <Text style={[styles.dueDate, { color: colors.text.tertiary }]}>
            Due: {new Date(intent.suggestedAction.dueDate).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  const renderGeneratedEmail = (email: any) => {
    if (!email?.subject && !email?.body) return null;

    return (
      <View style={[styles.emailContainer, { 
        backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
        borderColor: colors.border.light
      }]}>
        <Text style={[styles.emailSubject, { color: colors.text.primary }]}>
          {email.subject}
        </Text>
        <Text style={[styles.emailBody, { color: colors.text.secondary }]}>
          {email.body}
        </Text>
      </View>
    );
  };

  const renderTaskDetails = (metadata: ChatMessage['metadata']) => {
    if (!metadata?.taskDetails) return null;

    const { title, description, priority } = metadata.taskDetails;
    const priorityColors = {
      low: colors.status.success,
      medium: colors.status.warning,
      high: colors.status.error,
    };

    return (
      <View style={[styles.taskContainer, { 
        backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
        borderColor: colors.border.light
      }]}>
        <View style={styles.taskHeader}>
          <Icon name="check-circle" size={20} color={colors.brand.primary} />
          <Text style={[styles.taskTitle, { color: colors.text.primary }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.taskDescription, { color: colors.text.secondary }]}>
          {description}
        </Text>
        <View style={styles.taskFooter}>
          <View style={[styles.priorityBadge, { 
            backgroundColor: priorityColors[priority] + '20'
          }]}>
            <Text style={[styles.priorityText, { color: priorityColors[priority] }]}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.brand.primary }]}
            onPress={() => onAction?.('create_task', metadata.taskDetails)}
          >
            <Text style={styles.createButtonText}>Create Task</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
              Thinking...
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
      {message.type === 'assistant' && message.metadata && (
        <>
          {message.metadata.emailAnalysis && renderEmailAnalysis(message.metadata.emailAnalysis)}
          {message.metadata.emailIntent && renderEmailIntent(message.metadata.emailIntent)}
          {message.metadata.generatedEmail && renderGeneratedEmail(message.metadata.generatedEmail)}
          {message.metadata.taskDetails && renderTaskDetails(message.metadata)}
        </>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      width: '100%',
      height: '95%',
    },
    modalContent: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      overflow: 'hidden',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    headerContainer: {
      borderBottomWidth: 1,
      paddingBottom: 12,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    dragIndicator: {
      width: 40,
      height: 4,
      backgroundColor: '#E0E0E0',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 12,
    },
    backButton: {
      marginRight: 16,
    },
    headerText: {
      fontSize: 18,
      fontWeight: '600',
    },
    innerContent: {
      flex: 1,
    },
    contentContainer: {
      flex: 1,
    },
    chatScrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    chatMessageContainer: {
      marginBottom: 16,
    },
    chatMessage: {
      padding: 12,
      borderRadius: 16,
      maxWidth: '80%',
    },
    userMessage: {
      alignSelf: 'flex-end',
    },
    assistantMessage: {
      alignSelf: 'flex-start',
    },
    chatMessageText: {
      fontSize: 15,
      lineHeight: 20,
    },
    userMessageText: {
      color: '#FFFFFF',
    },
    assistantMessageText: {
      color: '#000000',
    },
    errorMessageText: {
      color: colors.status.error,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    loadingText: {
      fontSize: 14,
    },
    inputContainer: {
      padding: 16,
      borderTopWidth: 1,
    },
    chatInputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    chatInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 20,
      fontSize: 15,
      borderWidth: 1,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    taskContainer: {
      marginTop: 8,
      marginBottom: 4,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      alignSelf: 'flex-start',
      maxWidth: '90%',
    },
    taskHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },
    taskDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },
    taskFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    priorityText: {
      fontSize: 12,
      fontWeight: '500',
    },
    createButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    createButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '500',
    },
    analysisContainer: {
      marginTop: 8,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      alignSelf: 'flex-start',
      maxWidth: '90%',
    },
    analysisTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    categoryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: '500',
    },
    categoryCount: {
      fontSize: 13,
    },
    intentContainer: {
      marginTop: 8,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      alignSelf: 'flex-start',
      maxWidth: '90%',
    },
    intentTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    intentText: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    dueDate: {
      fontSize: 12,
    },
    emailContainer: {
      marginTop: 8,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      alignSelf: 'flex-start',
      maxWidth: '90%',
    },
    emailSubject: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    emailBody: {
      fontSize: 14,
      lineHeight: 20,
    },
  });

  const modalContent = (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={styles.modalContainer}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.modalContent, animatedStyle]}>
              {/* Header with drag indicator */}
              <View style={[styles.headerContainer, { 
                borderBottomColor: colors.border.light,
                backgroundColor: colors.background.primary,
                paddingTop: insets.top,
              }]}>
                <View style={styles.dragIndicator} />
                <View style={styles.headerContent}>
                  <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.headerText, { color: colors.text.primary }]}>AI Assistant</Text>
                </View>
              </View>
              
              <View style={styles.innerContent}>
                <View style={styles.contentContainer}>
                  <ScrollView
                    ref={scrollViewRef}
                    style={[styles.chatScrollView, { backgroundColor: colors.background.primary }]}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    bounces={false}
                  >
                    {messages.map((message, index) => renderChatMessage(message, index))}
                  </ScrollView>
                </View>
                
                {/* Input container */}
                <View style={[styles.inputContainer, {
                  backgroundColor: colors.background.primary,
                  borderTopColor: colors.border.light,
                }]}>
                  <View style={[styles.chatInputContainer, { backgroundColor: colors.background.primary }]}>
                    <TextInput
                      style={[styles.chatInput, { 
                        color: colors.text.primary,
                        backgroundColor: isDark ? colors.background.secondary : '#F8F9FA',
                        borderColor: colors.border.light
                      }]}
                      value={chatMessage}
                      onChangeText={setChatMessage}
                      placeholder="Ask for help with your emails..."
                      placeholderTextColor={colors.text.tertiary}
                      multiline
                      maxLength={1000}
                      returnKeyType="default"
                      blurOnSubmit={false}
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
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </Modal>
  );

  // Platform-specific wrapper
  if (Platform.OS === 'android') {
    return (
      <View style={{ width: "100%", height: "100%", position: "absolute" }}>
        {modalContent}
      </View>
    );
  }

  return modalContent;
} 