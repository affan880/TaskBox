import * as React from 'react';
import { Fragment, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
  Share,
  Image,
  Animated as RNAnimated,
  TextInput,
  Alert,
  Linking,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/theme-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { EmailData } from '../../types/email';
import RNBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import { ErrorBoundary } from '../../components/ui/error-boundary';
import { AutoHeightWebView } from './components/auto-height-webview';
import { EmailDetailHeader } from './components/email-detail-header';
import { EmailSenderInfo } from './components/email-sender-info';
import { EmailSubject } from './components/email-subject';
import { EmailLabelChip } from './components/email-label-chip';
import { EmailReplyActions } from './components/email-reply-actions';
import { EmailAttachments } from './components/email-attachments';

// Define an interface for email attachments
interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  sizeDisplay: string;
  contentId?: string;
  contentType: string;
  url?: string;
  data?: string;
  messageId?: string;
  attachmentId?: string;
}

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
  EmailDetail: { 
    email: EmailData & {
      isImportant?: boolean;
      isStarred?: boolean;
      attachments?: Attachment[];
    } 
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

export function EmailDetailScreen() {
  try {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<EmailDetailParams, 'EmailDetail'>>();
    const currentEmail = route.params?.email;
    const insets = useSafeAreaInsets();
    
    // Access theme and device info
    const { isDark } = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);
    
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

    // Email labels
    const emailLabels = currentEmail ? getEmailLabels(currentEmail) : [];

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

    const handleStarToggle = async () => {
      setIsStarred(!isStarred);
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
    const openFile = (filePath: string, contentType: string) => {
      FileViewer.open(filePath, { showOpenWithDialog: true })
        .then(() => {
          console.log('File opened successfully');
        })
        .catch(error => {
          console.error('Error opening file:', error);
          Alert.alert(
            'Error',
            'Could not open the file. The file format might not be supported on your device.',
            [{ text: 'OK' }]
          );
        });
    };
    
    // Function to download an attachment
    const downloadAttachment = async (attachment: Attachment) => {
      setIsActionLoading(true);
      setDownloadProgress(prev => ({ ...prev, [attachment.id]: 0 }));
      
      try {
        // Ensure directory exists
        const cacheDir = RNBlobUtil.fs.dirs.DocumentDir;
        const filePath = `${cacheDir}/${attachment.name}`;
        
        // Download the file if we have a URL
        if (attachment.url) {
          RNBlobUtil.config({
            fileCache: true,
            path: filePath,
            addAndroidDownloads: {
              useDownloadManager: true,
              notification: true,
              title: attachment.name,
              description: 'Downloading email attachment',
              mime: attachment.contentType,
            }
          })
          .fetch('GET', attachment.url)
          .progress((received, total) => {
            const percentage = Math.floor((Number(received) / Number(total)) * 100);
            setDownloadProgress(prev => ({ ...prev, [attachment.id]: percentage }));
          })
          .then(res => {
            console.log('File saved to:', res.path());
            setIsActionLoading(false);
            setDownloadProgress(prev => ({ ...prev, [attachment.id]: 100 }));
            
            Alert.alert(
              'Download Complete',
              'Would you like to open the downloaded file?',
              [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: () => openFile(res.path(), attachment.contentType) }
              ]
            );
          })
          .catch(error => {
            console.error('Download error:', error);
            setIsActionLoading(false);
            setDownloadProgress(prev => ({ ...prev, [attachment.id]: 0 }));
            
            Alert.alert(
              'Download Failed',
              'Could not download the file. Please try again later.',
              [{ text: 'OK' }]
            );
          });
        }
        // Use embedded data if available
        else if (attachment.data) {
          await RNBlobUtil.fs.writeFile(filePath, attachment.data, 'base64');
          
          setIsActionLoading(false);
          setDownloadProgress(prev => ({ ...prev, [attachment.id]: 100 }));
          
          Alert.alert(
            'File Ready',
            'Would you like to open the file?',
            [
              { text: 'No', style: 'cancel' },
              { text: 'Yes', onPress: () => openFile(filePath, attachment.contentType) }
            ]
          );
        }
        else {
          setIsActionLoading(false);
          Alert.alert(
            'Download Failed',
            'No file data available for download.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error handling attachment:', error);
        setIsActionLoading(false);
        setDownloadProgress(prev => ({ ...prev, [attachment.id]: 0 }));
        
        Alert.alert(
          'Error',
          'An error occurred while processing the attachment.',
          [{ text: 'OK' }]
        );
      }
    };
    
    // Function to render a clickable hyperlink
    const renderHyperlink = (text: string, url: string, key: string) => {
      return (
        <TouchableOpacity key={key} onPress={() => handleLinkPress(url)}>
          <Text style={[styles.hyperlink, { color: gmailTheme.primary }]}>
            {text}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <ErrorBoundary>
        <View style={[styles.safeArea, { backgroundColor: gmailTheme.background }]}>
          {/* Use EmailDetailHeader component */}
          <EmailDetailHeader
            gmailTheme={gmailTheme}
            isActionLoading={isActionLoading}
            onGoBack={() => navigation.goBack()}
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
                    {emailLabels.map((label, index) => (
                      <Fragment key={`label-${index}`}>
                        <EmailLabelChip 
                          label={label}
                          gmailTheme={gmailTheme}
                        />
                      </Fragment>
                    ))}
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
                  <AutoHeightWebView html={emailBody} />
                </View>
                
                {/* Replace attachment section with EmailAttachments component */}
                {!isDemoEmail(currentEmail) && currentEmail.hasAttachments && currentEmail.attachments && currentEmail.attachments.length > 0 && (
                  <EmailAttachments
                    attachments={currentEmail.attachments}
                    messageId={currentEmail.id}
                    downloadProgress={downloadProgress}
                    onDownloadPress={(messageId, attachment) => downloadAttachment(attachment)}
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
        </View>
      </ErrorBoundary>
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
  },
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingBottom: 0,
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
});
