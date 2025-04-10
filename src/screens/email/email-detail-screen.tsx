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
import * as Animatable from 'react-native-animatable';
import { parseHtmlContent } from './utils/html-parser';
import { useTheme } from '../../theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { EmailData } from '../../types/email';
import RNBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import { ErrorBoundary } from '../../components/ui/error-boundary';
import { HtmlEmailRenderer } from './components/html-email-renderer';
import { AutoHeightWebView } from './components/auto-height-webview';

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

    // Function to render an attachment item
    const renderAttachmentItem = (attachment: Attachment, index: number) => {
      // Determine the icon to use based on file type
      const getFileIcon = () => {
        const type = attachment.type.toLowerCase();
        
        if (type === 'pdf') return 'picture-as-pdf';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(type)) return 'image';
        if (['doc', 'docx'].includes(type)) return 'description';
        if (['xls', 'xlsx', 'csv'].includes(type)) return 'table-chart';
        if (['ppt', 'pptx'].includes(type)) return 'slideshow';
        if (['zip', 'rar', '7z'].includes(type)) return 'folder-zip';
        if (['mp3', 'wav', 'ogg'].includes(type)) return 'audio-file';
        if (['mp4', 'mov', 'avi'].includes(type)) return 'video-file';
        
        return 'insert-drive-file';
      };
      
      const icon = getFileIcon();
      const progress = downloadProgress[attachment.id] || 0;
      const isDownloading = progress > 0 && progress < 100;
      
      // Check if this is an image that can be previewed
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(attachment.type.toLowerCase());
      const isPdf = attachment.type.toLowerCase() === 'pdf';
      const isPreviewable = isImage || isPdf;
      
      return (
        <Animatable.View
          animation="fadeIn"
          duration={300}
          delay={index * 50}
          style={[
            styles.attachmentCard,
            {
              backgroundColor: gmailTheme.attachment.background,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }
          ]}
        >
          <View style={styles.attachmentIconContainer}>
            <Icon name={icon} size={24} color={gmailTheme.primary} />
          </View>
          
          <TouchableOpacity
            style={styles.attachmentDetails}
            onPress={() => downloadAttachment(attachment)}
            disabled={isDownloading}
          >
            <Text style={[styles.attachmentName, { color: gmailTheme.text.primary }]} numberOfLines={1}>
              {attachment.name}
            </Text>
            
            <View style={styles.attachmentInfoRow}>
              <Text style={[styles.attachmentInfo, { color: gmailTheme.text.secondary }]}>
                {attachment.type.toUpperCase()} • {attachment.sizeDisplay}
              </Text>
              
              {isDownloading && (
                <Text style={[styles.downloadProgressText, { color: gmailTheme.primary }]}>
                  {progress}%
                </Text>
              )}
            </View>
            
            {isDownloading && (
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: gmailTheme.primary,
                      width: `${progress}%`
                    }
                  ]}
                />
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.attachmentActionButton,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              }
            ]}
            onPress={() => downloadAttachment(attachment)}
            disabled={isDownloading}
          >
            <Icon 
              name={isDownloading ? "close" : "download"} 
              size={20} 
              color={isDownloading ? "#F44336" : gmailTheme.primary} 
            />
          </TouchableOpacity>
        </Animatable.View>
      );
    };

    // Render a label chip for the email
    const renderLabelChip = (label: EmailLabel) => {
      const getLabelColor = () => {
        switch(label) {
          case 'important': return gmailTheme.label.important;
          case 'starred': return gmailTheme.label.flagged;
          case 'draft': return gmailTheme.label.draft;
          default: return gmailTheme.label.inbox;
        }
      };
      
      const getLabelName = (label: EmailLabel) => {
        switch(label) {
          case 'important': return 'Important';
          case 'inbox': return 'Inbox';
          case 'sent': return 'Sent';
          case 'draft': return 'Draft';
          case 'starred': return 'Starred';
          case 'spam': return 'Spam';
          case 'trash': return 'Trash';
          case 'snoozed': return 'Snoozed';
          case 'forum': return 'Forums';
          case 'updates': return 'Updates';
          case 'promotions': return 'Promotions';
          case 'social': return 'Social';
          default: {
            // Cast to string to ensure we can use string methods
            const labelStr = label as string;
            return labelStr.charAt(0).toUpperCase() + labelStr.slice(1);
          }
        }
      };
      
      return (
        <View 
          style={[
            styles.labelChip, 
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              borderLeftColor: getLabelColor(),
            }
          ]}
        >
          <Text style={[styles.labelText, {color: isDark ? gmailTheme.text.primary : gmailTheme.text.secondary}]}>
            {getLabelName(label)}
          </Text>
        </View>
      );
    };

    return (
      <ErrorBoundary>
        <View style={[styles.safeArea, { backgroundColor: gmailTheme.background }]}>
          {/* Gmail-style Header */}
          <RNAnimated.View style={[
            styles.gmailHeader,
            { 
              marginTop:40,
              // opacity: headerOpacity,
              // paddingTop: insets.top > 0 ? 0 : Platform.OS === 'android' ? StatusBar.currentHeight : 0,
              backgroundColor: gmailTheme.surface,
              borderBottomColor: gmailTheme.border,
            }
          ]}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
                disabled={isActionLoading}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Icon name="arrow-back" size={24} color={gmailTheme.text.secondary} />
              </TouchableOpacity>
              
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.headerIconButton}
                  disabled={isActionLoading}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                  <Icon name="archive" size={22} color={gmailTheme.text.secondary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.headerIconButton}
                  disabled={isActionLoading}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                  <Icon name="delete" size={22} color={gmailTheme.text.secondary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.headerIconButton}
                  disabled={isActionLoading}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                  <Icon name="mail-outline" size={22} color={gmailTheme.text.secondary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.headerIconButton}
                  disabled={isActionLoading}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                  <Icon name="more-vert" size={22} color={gmailTheme.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </RNAnimated.View>
          
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
                {/* Email Labels */}
                {emailLabels.length > 0 && (
                  <View style={styles.labelContainer}>
                    {emailLabels.map((label, index) => (
                      <Fragment key={`label-${index}`}>
                        {renderLabelChip(label)}
                      </Fragment>
                    ))}
                  </View>
                )}
                
                {/* Subject Line */}
                <View style={styles.subjectContainer}>
                  <Text style={[styles.emailSubject, {color: gmailTheme.text.primary}]}>
                    {currentEmail.subject}
                  </Text>
                  
                  {/* Star button */}
                  <TouchableOpacity
                    style={styles.starButton}
                    onPress={handleStarToggle}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  >
                    <Icon 
                      name={isStarred ? "star" : "star-outline"} 
                      size={22} 
                      color={isStarred ? gmailTheme.label.flagged : gmailTheme.text.secondary} 
                    />
                  </TouchableOpacity>
                  
                  {/* Demo label if needed */}
                  {isDemoEmail(currentEmail) && (
                    <View style={[styles.demoChip, {backgroundColor: isDark ? '#454A64' : '#DADCE0'}]}>
                      <Text style={[styles.demoChipText, {color: isDark ? '#ffffff' : '#5F6368'}]}>DEMO</Text>
                    </View>
                  )}
                </View>
                
                {/* Sender Info - Gmail Style */}
                <View style={styles.senderContainer}>
                  <View style={[styles.avatarCircle, {backgroundColor: isDark ? '#5E81AC' : gmailTheme.primary}]}>
                    <Text style={styles.avatarText}>{senderInitial}</Text>
                  </View>
                  
                  <View style={styles.senderDetails}>
                    <View style={styles.senderRow}>
                      <Text style={[styles.senderName, {color: gmailTheme.text.primary}]}>
                        {senderName}
                      </Text>
                      <Text style={[styles.dateText, {color: gmailTheme.text.secondary}]}>
                        {formattedDate}
                      </Text>
                    </View>
                    
                    <View style={styles.recipientRow}>
                      <Text 
                        style={[styles.recipientText, {color: gmailTheme.text.secondary}]} 
                        numberOfLines={1}
                      >
                        to me
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowFullHeader(!showFullHeader)}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                      >
                        <Icon 
                          name={showFullHeader ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                          size={18} 
                          color={gmailTheme.text.secondary} 
                        />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Expanded Header Details */}
                    {showFullHeader && (
                      <Animatable.View 
                        animation="fadeIn" 
                        duration={200} 
                        style={[styles.expandedHeader, {borderTopColor: gmailTheme.border}]}
                      >
                        <View style={styles.headerDetailRow}>
                          <Text style={[styles.headerLabel, {color: gmailTheme.text.secondary}]}>
                            From:
                          </Text>
                          <Text style={[styles.headerValue, {color: gmailTheme.text.primary}]}>
                            {senderName} &lt;{senderEmail}&gt;
                          </Text>
                        </View>
                        
                        <View style={styles.headerDetailRow}>
                          <Text style={[styles.headerLabel, {color: gmailTheme.text.secondary}]}>
                            To:
                          </Text>
                          <Text style={[styles.headerValue, {color: gmailTheme.text.primary}]}>
                            {currentEmail.to || 'me'}
                          </Text>
                        </View>
                        
                        {currentEmail.hasOwnProperty('cc') && (
                          <View style={styles.headerDetailRow}>
                            <Text style={[styles.headerLabel, {color: gmailTheme.text.secondary}]}>
                              Cc:
                            </Text>
                            <Text style={[styles.headerValue, {color: gmailTheme.text.primary}]}>
                              {(currentEmail as any).cc}
                            </Text>
                          </View>
                        )}
                        
                        <View style={styles.headerDetailRow}>
                          <Text style={[styles.headerLabel, {color: gmailTheme.text.secondary}]}>
                            Date:
                          </Text>
                          <Text style={[styles.headerValue, {color: gmailTheme.text.primary}]}>
                            {formattedDate}
                          </Text>
                        </View>
                      </Animatable.View>
                    )}
                  </View>
                </View>
                
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
                
                {/* Attachments - if any and not a demo email */}
                {!isDemoEmail(currentEmail) && currentEmail.hasAttachments && currentEmail.attachments && currentEmail.attachments.length > 0 && (
                  <View style={[styles.attachmentsSection, {borderTopColor: gmailTheme.border}]}>
                    <Text style={[styles.attachmentsHeading, {color: gmailTheme.text.primary}]}>
                      Attachments ({currentEmail.attachments.length})
                    </Text>
                    
                    {/* Render each attachment */}
                    {currentEmail.attachments.map((attachment, index) => (
                      <Fragment key={`attachment-${attachment.id}`}>
                        {renderAttachmentItem(attachment, index)}
                      </Fragment>
                    ))}
                  </View>
                )}
              </RNAnimated.View>
              
              {/* Gmail-style Reply Section */}
              <View style={[
                styles.replySection, 
                {
                  backgroundColor: gmailTheme.surface,
                  shadowColor: isDark ? '#000000' : '#00000030',
                }
              ]}>
                <TouchableOpacity
                  style={styles.replyButton}
                  disabled={isActionLoading}
                >
                  <Text style={[styles.replyText, {color: gmailTheme.text.secondary}]}>
                    Reply
                  </Text>
                  <Icon name="reply" size={20} color={gmailTheme.text.secondary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.replyButton}
                  disabled={isActionLoading}
                >
                  <Text style={[styles.replyText, {color: gmailTheme.text.secondary}]}>
                    Reply all
                  </Text>
                  <Icon name="reply-all" size={20} color={gmailTheme.text.secondary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.replyButton}
                  disabled={isActionLoading}
                >
                  <Text style={[styles.replyText, {color: gmailTheme.text.secondary}]}>
                    Forward
                  </Text>
                  <Icon name="forward" size={20} color={gmailTheme.text.secondary} />
                </TouchableOpacity>
              </View>
              
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
    // borderRadius: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    // shadowRadius: 3,
    elevation: 2,
  },
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingBottom: 0,
  },
  labelChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  subjectContainer: {
    padding: 16, 
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  emailSubject: {
    fontSize: 20,
    fontWeight: '400',
    flex: 1,
    paddingRight: 8,
  },
  starButton: {
    padding: 8,
    marginRight: 4,
  },
  demoChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  senderContainer: {
    padding: 16,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  senderDetails: {
    flex: 1,
    marginLeft: 12,
  },
  senderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 14,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  recipientText: {
    fontSize: 14,
    marginRight: 8,
  },
  expandedHeader: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  headerDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 14,
    width: 50,
  },
  headerValue: {
    fontSize: 14,
    flex: 1,
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
  attachmentsSection: {
    padding: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  attachmentsHeading: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  replySection: {
    margin: 8,
    marginTop: 16,
    marginBottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  replyText: {
    fontSize: 14,
    marginRight: 8,
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
    color: GMAIL_COLORS.light.primary,
    fontWeight: 'bold',
  },
  attachmentCard: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  attachmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  attachmentDetails: {
    flex: 1,
    marginLeft: 12,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  attachmentInfo: {
    fontSize: 12,
    color: '#666',
  },
  downloadProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  attachmentActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
