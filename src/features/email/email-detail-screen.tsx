import * as React from 'react';
import { Fragment, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Animated as RNAnimated,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme/theme-context';
import { EmailData, Attachment } from '@/types/email';
import RNBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import { toast } from '@/components/ui/toast';
import { useGmail } from '@/hooks/use-gmail';
import { useEmailStore } from '@/features/email/store/email-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

// Components
import { ErrorBoundary } from '../../components/ui/error-boundary';
import { AutoHeightWebView } from './components/auto-height-webview';
import { EmailDetailHeader } from './components/email-detail-header';
import { EmailSenderInfo } from './components/email-sender-info';
import { EmailSubject } from './components/email-subject';
import { EmailLabelChip } from './components/email-label-chip';
import { EmailReplyActions } from './components/email-reply-actions';
import { EmailAttachments } from './components/email-attachments';
import {
  SnoozeModal,
  ComposeModal,
  ScheduleMeetingModal,
  SetReminderModal,
  CreateTaskModal
} from './components';

// Hooks and API
import { useEmailActions } from './hooks/use-email-actions';
import { useEmailSummaryStore } from '@/lib/store/email-summary-store';
import { summarizeEmailContent, detectEmailIntent, EmailIntentResponse } from '@/api/email-analysis-api';

// Gmail-specific colors
const GMAIL_COLORS = {
  light: {
    primary: '#1A73E8',
    primaryDark: '#0F4DA7',
    secondary: '#5F6368',
    surface: '#FFFFFF',
    background: '#F2F2F6',
    backgroundSecondary: '#F1F3F4',
    border: '#DADCE0',
    text: {
      primary: '#202124',
      secondary: '#5F6368',
      tertiary: '#747775',
      inverse: '#FFFFFF',
    },
    chip: {
      background: '#E8F0FE',
      text: '#1967D2',
    },
    label: {
      inbox: '#0F5CDE',
      important: '#DB4437',
      flagged: '#F29900',
      draft: '#9AA0A6',
    },
    attachment: {
      background: '#F1F3F4',
      icon: '#5F6368',
    },
  },
  dark: {
    primary: '#8AB4F8',
    primaryDark: '#669DF6',
    secondary: '#9AA0A6',
    surface: '#2C2C2E',
    background: '#1C1C1E', 
    backgroundSecondary: '#242426',
    border: '#3C4043',
    text: {
      primary: '#E8EAED',
      secondary: '#9AA0A6',
      tertiary: '#757575',
      inverse: '#1F1F1F',
    },
    chip: {
      background: '#1F3449',
      text: '#8AB4F8',
    },
    label: {
      inbox: '#669DF6',
      important: '#F28B82',
      flagged: '#FDD663',
      draft: '#9AA0A6',
    },
    attachment: {
      background: '#2C2C2E',
      icon: '#9AA0A6',
    },
  }
};

type EmailLabel = 'important' | 'inbox' | 'sent' | 'draft' | 'starred' | 'spam' | 'trash' | 'snoozed' | 'forum' | 'updates' | 'promotions' | 'social';

function isDemoEmail(email: EmailData | null): boolean {
  if (!email) return false;
  return email.id.startsWith('demo-');
}

// Utility function to get labels from email
function getEmailLabels(email: EmailData & {
  isImportant?: boolean;
  isStarred?: boolean;
  attachments?: Array<any>;
} | null): EmailLabel[] {
  if (!email) return [];
  const labels: EmailLabel[] = [];
  
  // Add mock labels based on email properties or content
  if (email.isImportant) labels.push('important');
  if (email.isStarred) labels.push('starred');
  
  // Add additional labels based on the demo email pattern
  if (email.id.includes('inbox')) labels.push('inbox');
  if (email.id.includes('spam')) labels.push('spam');
  if (email.id.includes('draft')) labels.push('draft');
  if (email.id.includes('snoozed')) labels.push('snoozed');
  
  // Add a default label if none are set
  if (labels.length === 0) labels.push('inbox');
  
  return labels;
}

type EmailDetailParams = {
  ReadEmail: { 
    email: EmailData // Expect full EmailData with attachments array
  };
};

// Safely handle errors without relying on Error.stack
const safelyLogError = (error: any) => {
  try {
    console.error('Error in EmailDetailScreen:', error?.message || String(error));
  } catch (logError) {
    console.error('Failed to log error');
  }
};

// Local email summarization function as fallback when API is unavailable
function createLocalSummary(emailBody: string): { summary: string, html?: string } {
  // Simple approach - extract first few sentences
  const maxSummaryLength = 200;
  const strippedText = emailBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const summary = strippedText.length > maxSummaryLength
    ? strippedText.substring(0, maxSummaryLength) + '...'
    : strippedText;
  
  const html = `<html><body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 15px;">
    <h2 style="color: #1A73E8;">Email Preview</h2>
    <div><em>API is unavailable. Showing first part of email:</em></div>
    <div style="margin-top: 10px;">${summary}</div>
  </body></html>`;
  
  return { summary, html };
}

type ComposeMode = 'new' | 'reply' | 'reply-all' | 'forward';

const downloadAttachmentData = async (attachment: Attachment) => {
  const { currentEmail, fetchAttachment } = useGmail();
  
  if (!currentEmail) {
    toast.show({
      message: 'No email selected',
      type: 'error'
    });
    return;
  }

  try {
    const attachmentData = await fetchAttachment(
      currentEmail.id,
      attachment.id,
      attachment.filename,
      attachment.mimeType
    );
    
    if (!attachmentData?.data) {
      throw new Error('Failed to fetch attachment data');
    }

    // Get the downloads directory path
    const downloadPath = Platform.select({
      ios: RNBlobUtil.fs.dirs.DocumentDir,
      android: RNBlobUtil.fs.dirs.DownloadDir,
    });

    if (!downloadPath) {
      throw new Error('Could not determine downloads directory');
    }

    // Create the full file path
    const filePath = `${downloadPath}/${attachment.filename}`;

    // Write the file
    await RNBlobUtil.fs.writeFile(filePath, attachmentData.data.toString(), 'base64');

    // Open the file
    await FileViewer.open(filePath);

    toast.show({
      message: 'Attachment downloaded successfully',
      type: 'success'
    });
  } catch (error) {
    console.error('Error downloading attachment:', error);
    toast.show({
      message: 'Failed to download attachment. Please try again.',
      type: 'error'
    });
  }
};

// Update the ComposeModal interface
interface ComposeModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (email: { to: string; subject: string; body: string }) => void;
}

// Update the SnoozeModal interface
interface SnoozeModalProps {
  visible: boolean;
  onClose: () => void;
  onSnooze: (date: Date) => void;
}

export function EmailDetailScreen() {
  try {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<EmailDetailParams, 'ReadEmail'>>();
    const currentEmail = route.params?.email;
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);
    const { getSummary, setSummary } = useEmailSummaryStore();
    const {
      markAsRead,
      markAsUnread,
      archiveEmail,
      deleteEmail,
      // ... other existing actions ...
    } = useEmailActions();
    const { snoozeEmail } = useGmail();
    const { selectedEmails } = useEmailStore();
    
    // Show loading indicator if email data is not yet available
    if (!currentEmail) {
      return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: GMAIL_COLORS.light.background }]}>
          <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={GMAIL_COLORS.light.primary} />
            <Text style={{ marginTop: 10, color: GMAIL_COLORS.light.text.secondary }}>
              Loading Email...
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    // Gmail-specific colors based on theme
    const gmailTheme = isDark ? GMAIL_COLORS.dark : GMAIL_COLORS.light;
    
    // Animation values
    const headerOpacity = useRef(new RNAnimated.Value(0)).current;
    const contentTranslateY = useRef(new RNAnimated.Value(20)).current;
    const contentOpacity = useRef(new RNAnimated.Value(0)).current;
    
    // States
    const [scrollY, setScrollY] = useState(0);
    const [showFullHeader, setShowFullHeader] = useState(false);
    const [isStarred, setIsStarred] = useState(currentEmail?.isStarred || false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
    const [summaryHtml, setSummaryHtml] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [detectedIntentInfo, setDetectedIntentInfo] = useState<EmailIntentResponse | null>(null);
    
    // State needed for Snooze Modal
    const [selectedEmailIdForModal, setSelectedEmailIdForModal] = useState<string | null>(null);

    // Modal Visibility States
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [showSnoozeModal, setShowSnoozeModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [composeMode, setComposeMode] = useState<ComposeMode>('new');
    
    // Effect to reset summary state when the email changes
    useEffect(() => {
      console.log(`[EmailDetailScreen] Email changed to ${currentEmail?.id}, resetting summary state.`);
      setIsAnalyzing(false); // Stop any lingering loader from previous email
      setSummaryHtml(null); // Clear any previous summary
    }, [currentEmail?.id]); // Dependency: Run only when email ID changes

    // Extract sender information
    const senderName = currentEmail
      ? currentEmail.from.includes('<')
        ? currentEmail.from.split('<')[0].trim()
        : currentEmail.from
      : '';
      
    const senderEmail = currentEmail
      ? currentEmail.from.includes('<')
        ? currentEmail.from.split('<')[1].split('>')[0]
        : currentEmail.from
      : '';
      
    const senderInitial = senderName ? senderName[0].toUpperCase() : '';
    
    // Format date for display
    const formattedDate = currentEmail ? new Date(currentEmail.date).toLocaleString() : '';
    
    // Email body
    const emailBody = currentEmail ? currentEmail.body || '' : '';

    // Use attachments directly from props
    const emailLabels = currentEmail ? getEmailLabels(currentEmail) : [];
    const attachments = currentEmail?.attachments || [];

    // Get download function from useGmail
    const { downloadAttachmentData, fetchAttachment } = useGmail();

    // Handle scroll events
    const handleScroll = (event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      setScrollY(y);
      
      // Animate header opacity based on scroll position
      RNAnimated.timing(headerOpacity, {
        toValue: y > 60 ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    };

    // Start entrance animations
    useEffect(() => {
      RNAnimated.parallel([
        RNAnimated.timing(contentTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        RNAnimated.timing(contentOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);
    
    const analyzeEmailIntent = async () => {
      console.log('Analyzing email intent');
      // if (currentEmail?.id) {
        try {
          // Call the intent detection API
          const intentResult = await detectEmailIntent(currentEmail.id);
          console.log('Email intent analysis result:', intentResult);
          setDetectedIntentInfo(intentResult); // Store the result
          
          // Show toast if intent is actionable
        

        } catch (error) {
          // Silently log error but don't show to user as this is a background task
          console.error('Failed to analyze email intent:', error);
          setDetectedIntentInfo(null); // Clear previous intent on error`
        }
      // else {
      //   setDetectedIntentInfo(null); // Clear intent if no email ID
      // }
    };
    
    useEffect(() => {
      analyzeEmailIntent();
    }, []); // Removed showIntentToast from dependencies

    // --- Other Actions ---
    const handleStarToggle = async () => {
      setIsStarred(!isStarred);
      // TODO: Add API call to star/unstar
    };
    
    // Function to handle hyperlinks
    const handleLinkPress = (url: string) => {
      Alert.alert(
        "Open Link",
        `Would you like to open this link?\n\n${url}`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open", onPress: () => Linking.openURL(url) }
        ]
      );
    };
    
    // Function to open a file using the FileViewer
    const openFile = useCallback((filePath: string) => {
      const pathWithPrefix = Platform.OS === 'ios' ? `file://${filePath}` : filePath;
      console.log(`[EmailDetailScreen] Attempting to open file with path: ${pathWithPrefix}`);
      FileViewer.open(pathWithPrefix, { showOpenWithDialog: true })
        .then(() => {
          console.log('[EmailDetailScreen] File opened successfully');
        })
        .catch(error => {
          console.error('[EmailDetailScreen] Error opening file:', error);
          Alert.alert(
            'Error',
            'Could not open the file. The file format might not be supported on your device.',
            [{ text: 'OK' }]
          );
        });
    }, []);
    
    // Updated function to handle download and saving
    const handleDownloadAttachment = async (messageId: string, attachment: Attachment) => {
      try {
        const attachmentData = await fetchAttachment(messageId, attachment.id, attachment.filename, attachment.mimeType);
        if (!attachmentData?.data) {
          toast.show({
            message: 'Failed to download attachment',
            type: 'error'
          });
          return;
        }

        const filePath = `${RNBlobUtil.fs.dirs.DocumentDir}/${attachment.filename}`;
        await RNBlobUtil.fs.writeFile(filePath, attachmentData.data.toString(), 'base64');
        
        if (Platform.OS === 'ios') {
          await FileViewer.open(filePath);
        } else {
          await FileViewer.open(filePath, { showOpenWithDialog: true });
        }

        toast.show({
          message: 'Attachment downloaded successfully',
          type: 'success'
        });
      } catch (error) {
        console.error('Error downloading attachment:', error);
        toast.show({
          message: 'Failed to download attachment',
          type: 'error'
        });
      }
    };

    // Function to summarize the email using the API
    const summarizeEmail = async () => {
      try {
        // If we already have a summary displayed, toggle back to original content
        if (summaryHtml) {
          setSummaryHtml(null);
          return;
        }
        
        setIsAnalyzing(true);
        
        // Get email ID for cache key
        const emailId = currentEmail?.id;
        if (!emailId) {
          throw new Error('Email ID is missing');
        }
        
        // Try to get cached summary first
        const cachedSummary = getSummary(emailId);
        
        if (cachedSummary) {
          console.log('Using cached summary for email:', emailId);
          const formattedHtml = cachedSummary.html || `<html><body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 15px;">
            <h2 style="color: #1A73E8;">Email Summary</h2>
            <div>${cachedSummary.summary.replace(/\n/g, '<br>')}</div>
          </body></html>`;
          
          setSummaryHtml(formattedHtml);
          setIsAnalyzing(false);
        } else {
          // No cached summary, call the API
          console.log('Generating new summary for email:', emailId);
          try {
            const response = await summarizeEmailContent(currentEmail?.body || '');
            
            if (response && response.summary) {
              // Cache the summary for future use
              setSummary(emailId, response.summary, response.html);
              
              const formattedHtml = response.html || `<html><body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 15px;">
                <h2 style="color: #1A73E8;">Email Summary</h2>
                <div>${response.summary.replace(/\n/g, '<br>')}</div>
              </body></html>`;
              
              setSummaryHtml(formattedHtml);
            } else {
              throw new Error('Invalid API response');
            }
          } catch (apiError) {
            console.error('Error calling summary API:', apiError);
            
            // Show error dialog with retry option
            Alert.alert(
              'API Unavailable',
              'The summary service is currently offline. Would you like to use a local preview instead?',
              [
                { 
                  text: 'Cancel', 
                  style: 'cancel',
                  onPress: () => setIsAnalyzing(false)
                },
                { 
                  text: 'Use Preview', 
                  onPress: () => {
                    const localSummary = createLocalSummary(currentEmail?.body || '');
                    setSummary(emailId, `[LOCAL PREVIEW] ${localSummary.summary}`, localSummary.html);
                    setSummaryHtml(localSummary.html || null);
                    setIsAnalyzing(false);
                  }
                }
              ]
            );
          }
        }
      } catch (error) {
        console.error('Error summarizing email:', error);
        Alert.alert('Error', 'Failed to analyze email. Please try again.');
      } finally {
        // Always ensure the loader is turned off if this block is reached.
        // This covers successful API calls and non-API errors.
        // It's skipped if the API error Alert returns early.
        setIsAnalyzing(false);
      }
    };

    // Action handlers
    const handleMarkAsRead = useCallback(async () => {
      if (!currentEmail?.id) return;
      try {
        setIsActionLoading(true);
        await markAsRead(currentEmail.id);
      } catch (error) {
        console.error('Error marking email as read:', error);
        Alert.alert('Error', 'Failed to mark email as read');
      } finally {
        setIsActionLoading(false);
      }
    }, [currentEmail?.id, markAsRead]);

    const handleMarkAsUnread = useCallback(async () => {
      if (!currentEmail?.id) return;
      try {
        setIsActionLoading(true);
        await markAsUnread(currentEmail.id);
      } catch (error) {
        console.error('Error marking email as unread:', error);
        Alert.alert('Error', 'Failed to mark email as unread. Please try again.');
      } finally {
        setIsActionLoading(false);
      }
    }, [currentEmail?.id, markAsUnread]);

    const handleArchive = useCallback(async () => {
      if (!currentEmail?.id) return;
      try {
        setIsActionLoading(true);
        await archiveEmail(currentEmail.id);
        navigation.goBack();
      } catch (error) {
        console.error('Error archiving email:', error);
        Alert.alert('Error', 'Failed to archive email. Please try again.');
      } finally {
        setIsActionLoading(false);
      }
    }, [currentEmail?.id, archiveEmail, navigation]);

    const handleDelete = useCallback(async () => {
      if (!currentEmail?.id) return;
      Alert.alert(
        'Delete Email',
        'Are you sure you want to delete this email?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsActionLoading(true);
                await deleteEmail(currentEmail.id);
                navigation.goBack();
              } catch (error) {
                console.error('Error deleting email:', error);
                Alert.alert('Error', 'Failed to delete email. Please try again.');
              } finally {
                setIsActionLoading(false);
              }
            },
          },
        ]
      );
    }, [currentEmail?.id, deleteEmail, navigation]);

    const handleReportSpam = useCallback(async () => {
      if (!currentEmail?.id) return;
      Alert.alert(
        'Report Spam',
        'Are you sure you want to report this email as spam?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Report',
            onPress: async () => {
              try {
                setIsActionLoading(true);
                // TODO: Implement report spam functionality
                Alert.alert('Success', 'Email reported as spam successfully.');
              } catch (error) {
                console.error('Error reporting spam:', error);
                Alert.alert('Error', 'Failed to report email as spam. Please try again.');
              } finally {
                setIsActionLoading(false);
              }
            },
          },
        ]
      );
    }, [currentEmail?.id]);

    const handleMoveTo = useCallback(() => {
      // TODO: Implement move to folder functionality
      Alert.alert('Coming Soon', 'Move to folder functionality will be available soon.');
    }, []);

    const handleAddLabel = useCallback(() => {
      setShowLabelModal(true);
    }, []);

    // Update the handleSnooze function
    const handleSnooze = useCallback(async (date: Date) => {
      try {
        setIsActionLoading(true);
        if (!currentEmail?.id) {
          throw new Error('No email selected');
        }
        await snoozeEmail(currentEmail.id, date);
        toast.show({
          message: 'Email snoozed successfully',
          type: 'success'
        });
        navigation.goBack();
      } catch (error) {
        console.error('Error snoozing email:', error);
        toast.show({
          message: 'Failed to snooze email',
          type: 'error'
        });
      } finally {
        setIsActionLoading(false);
      }
    }, [currentEmail?.id, snoozeEmail, navigation]);

    const handleSnoozePress = useCallback(() => {
      setShowSnoozeModal(true);
    }, []);

    const handlePrint = useCallback(() => {
      // TODO: Implement print functionality
      Alert.alert('Coming Soon', 'Print functionality will be available soon.');
    }, []);

    const handleReply = useCallback(() => {
      setComposeMode('reply');
      setShowComposeModal(true);
    }, []);

    const handleReplyAll = useCallback(() => {
      setComposeMode('reply-all');
      setShowComposeModal(true);
    }, []);

    const handleForward = useCallback(() => {
      setComposeMode('forward');
      setShowComposeModal(true);
    }, []);

    const handleSendEmail = async (to: string, subject: string, body: string) => {
      const { sendEmail } = useGmail();
      try {
        await sendEmail(to, subject, body);
        setShowComposeModal(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to send email.');
      }
    };

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <ErrorBoundary>
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]}>
              <View style={[styles.container]}>
                <EmailDetailHeader
                  gmailTheme={gmailTheme}
                  isActionLoading={isActionLoading}
                  onGoBack={() => navigation.goBack()}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAsUnread={handleMarkAsUnread}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onReportSpam={handleReportSpam}
                  onMoveTo={handleMoveTo}
                  onAddLabel={handleAddLabel}
                  onSnooze={handleSnoozePress}
                  onPrint={handlePrint}
                  onForward={handleForward}
                  onReply={handleReply}
                  onReplyAll={handleReplyAll}
                  isUnread={currentEmail?.isUnread || false}
                />
                
                {/* Main Content */}
                <ScrollView
                  ref={scrollViewRef}
                  style={[
                    styles.scrollView, 
                    {
                      backgroundColor: gmailTheme.background,
                      ...Platform.select({
                        android: { elevation: 3 }
                      })
                    }
                  ]}
                  contentContainerStyle={[
                    styles.scrollContent,
                    {
                      ...Platform.select({
                        android: { paddingBottom: 20 }
                      })
                    }
                  ]}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {/* Action Loading Indicator */}
                  {isActionLoading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color={gmailTheme.primary} />
                    </View>
                  )}
                  
                  {/* Only show the email content if there's no error */}
                  <>
                    {/* Email Card - Gmail Style */}
                    <RNAnimated.View style={[
                      styles.emailCard,
                      {
                        opacity: contentOpacity,
                        transform: [{ translateY: contentTranslateY }],
                        backgroundColor: gmailTheme.surface,
                        shadowColor: isDark ? '#000000' : '#00000030',
                        ...Platform.select({
                          android: { elevation: 4 }
                        })
                      }
                    ]}>
                      {/* Email Labels - Replace with EmailLabelChip component */}
                      {emailLabels.length > 0 && (
                        <View style={styles.labelContainer}>
                          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                            {emailLabels.map((label, index) => (
                              <Fragment key={`label-${index}`}>
                                <EmailLabelChip 
                                  label={label}
                                  gmailTheme={gmailTheme}
                                />
                              </Fragment>
                            ))}
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.analyzeButton,
                              {
                                backgroundColor: isDark ? '#1A73E8' : '#E8F0FE',
                                borderColor: isDark ? '#8AB4F8' : '#1A73E8',
                              },
                            ]}
                            onPress={summarizeEmail}
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? (
                              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#1A73E8'} />
                            ) : (
                              <Text
                                style={[
                                  styles.analyzeButtonText,
                                  { color: isDark ? '#FFFFFF' : '#1A73E8' },
                                ]}
                              >
                                {summaryHtml ? '📄 Original' : '✨ Analyze'}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {/* Subject Line */}
                      <EmailSubject
                        subject={currentEmail?.subject || ''}
                        isStarred={isStarred}
                        isDemo={isDemoEmail(currentEmail)}
                        gmailTheme={gmailTheme}
                        onStarToggle={handleStarToggle}
                      />
                      
                      {/* Sender Info - Gmail Style */}
                      <EmailSenderInfo
                        senderInitial={senderInitial}
                        senderName={senderName}
                        senderEmail={senderEmail}
                        formattedDate={formattedDate}
                        toRecipient={currentEmail?.to || 'me'}
                        ccRecipients={currentEmail?.hasOwnProperty('cc') ? (currentEmail as any).cc : undefined}
                        isExpanded={showFullHeader}
                        onToggleExpand={() => setShowFullHeader(!showFullHeader)}
                        gmailTheme={gmailTheme}
                      />
                      
                      {/* Email Body - Gmail Style */}
                      <View style={[{
                        backgroundColor: gmailTheme.surface,
                        borderWidth: 0,
                        margin: 0,
                        overflow: 'hidden',
                        padding: 8,
                      }]}>
                        {summaryHtml && (
                          <View style={styles.summaryIndicator}>
                            <Text style={styles.summaryIndicatorText}>AI Summary</Text>
                            <TouchableOpacity
                              style={styles.viewOriginalButton}
                              onPress={() => setSummaryHtml(null)}
                            >
                              <Text style={styles.viewOriginalButtonText}>View Original</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        <AutoHeightWebView
                          html={summaryHtml || emailBody || '<div></div>'}
                        />
                      </View>
                      
                      {/* Replace attachment section with EmailAttachments component */}
                      {attachments.length > 0 && (
                        <EmailAttachments
                          attachments={attachments}
                          messageId={currentEmail?.id || ''}
                          downloadProgress={downloadProgress}
                          onDownloadPress={handleDownloadAttachment}
                          gmailTheme={gmailTheme}
                        />
                      )}
                    </RNAnimated.View>
                    
                    {/* Replace Gmail-style Reply Section with EmailReplyActions component */}
                    <EmailReplyActions
                      isActionLoading={isActionLoading}
                      gmailTheme={gmailTheme}
                      onReply={() => {
                        // TODO: Implement reply functionality
                        console.log('Reply pressed');
                      }}
                      onReplyAll={() => {
                        // TODO: Implement reply all functionality
                        console.log('Reply all pressed');
                      }}
                      onForward={() => {
                        // TODO: Implement forward functionality
                        console.log('Forward pressed');
                      }}
                    />
                    
                    {/* Bottom spacer */}
                    <View style={styles.bottomSpacer} />
                  </>
                </ScrollView>
                
                {/* Render Modals */}
                {currentEmail && (
                  <SnoozeModal
                    visible={showSnoozeModal}
                    onClose={() => setShowSnoozeModal(false)}
                    onSnooze={handleSnooze}
                  />
                )}
                
                {/* Use the reverted ComposeModal */}
                <ComposeModal
                  visible={showComposeModal}
                  onClose={() => setShowComposeModal(false)}
                  onSend={handleSendEmail}
                />
                
                <ScheduleMeetingModal 
                  isVisible={showScheduleModal}
                  onClose={() => setShowScheduleModal(false)}
                  suggestedText={detectedIntentInfo?.suggestedAction?.text}
                  // Add onSubmit prop later
                />
                
                <SetReminderModal 
                  isVisible={showReminderModal}
                  onClose={() => setShowReminderModal(false)}
                  suggestedText={detectedIntentInfo?.suggestedAction?.text}
                  suggestedDate={detectedIntentInfo?.suggestedAction?.dueDate}
                  // Add onSubmit prop later
                />
                
                <CreateTaskModal 
                  isVisible={showTaskModal}
                  onClose={() => setShowTaskModal(false)}
                  suggestedText={detectedIntentInfo?.suggestedAction?.text}
                  // Add onSubmit prop later
                />
              </View>
            </SafeAreaView>
          </ErrorBoundary>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    );
  } catch (error) {
    safelyLogError(error);
    return (
      <View style={[styles.safeArea, { backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: '#D93025', marginBottom: 12 }}>
          Something went wrong
        </Text>
        <Text style={{ fontSize: 14, color: '#5F6368', marginBottom: 20, textAlign: 'center' }}>
          There was a problem loading this email. Please try again later.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#1A73E8', padding: 12, borderRadius: 4 }}
          onPress={() => {
            const navigation = useNavigation();
            navigation.goBack();
          }}
        >
          <Text style={{ color: '#FFFFFF' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gmailHeader: {
    height: 56,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  emailCard: {
    margin: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingBottom: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailTextContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  plainTextParagraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  plainTextLine: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  paragraph: {
    marginBottom: 16,
  },
  bottomSpacer: {
    height: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  hyperlink: {
    fontWeight: 'bold',
  },
  summaryButton: {
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  magicButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#9370DB',
  },
  magicButtonText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontSize: 12,
  },
  summaryIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(26, 115, 232, 0.8)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIndicatorText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  viewOriginalButton: {
    marginLeft: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  viewOriginalButtonText: {
    color: '#1A73E8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  analyzeButton: {
    padding: 10,
    borderWidth: 2,
    borderColor: '#1A73E8',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
});
