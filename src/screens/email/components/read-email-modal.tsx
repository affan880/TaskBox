import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  Modal,
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
  PermissionsAndroid,
  ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import RNBlobUtil, { ReactNativeBlobUtilConfig, FetchBlobResponse, AndroidApi } from 'react-native-blob-util';
import { parseHtmlContent } from '../utils/html-parser';
import { useTheme } from '../../../theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import Pdf from 'react-native-pdf';
import FileViewer from 'react-native-file-viewer';

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

type ReadEmailModalProps = {
  visible: boolean;
  currentEmail: EmailData | null;
  onClose: () => void;
  onArchive: (emailId: string) => Promise<void>;
  onDelete: (emailId: string) => Promise<void>;
  onLabel: (emailId: string) => Promise<void>;
  onSnooze: (emailId: string) => Promise<void>;
  onMarkAsUnread: (emailId: string) => Promise<void>;
  onReportSpam: (emailId: string) => Promise<void>;
  onMoveToInbox: (emailId: string) => Promise<void>;
  onStar: (emailId: string, starred: boolean) => Promise<void>;
  onReply?: (emailId: string, replyAll: boolean) => void;
  onForward?: (emailId: string) => void;
};

// Labels that might be in an email
type EmailLabel = 'important' | 'inbox' | 'sent' | 'draft' | 'starred' | 'spam' | 'trash' | 'snoozed' | 'forum' | 'updates' | 'promotions' | 'social';

// Define an interface for email attachments
interface Attachment {
  id: string;
  name: string;
  type: string; // File extension type (e.g., 'pdf', 'jpg')
  size: number;
  sizeDisplay: string;
  contentId?: string;
  contentType: string; // MIME type (e.g., 'application/pdf', 'image/jpeg')
  url?: string;
  data?: string;
  messageId?: string; // Gmail message ID containing this attachment
  attachmentId?: string; // The Gmail API attachment ID (same as id for compatibility)
}

// Extend EmailData type to include Gmail-specific properties
type EmailData = {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isStarred?: boolean;
  isImportant?: boolean;
  hasAttachments?: boolean;
  attachmentCount?: number;
  attachments?: Attachment[];
  // Gmail-specific fields
  gmailId?: string; // The Gmail API message ID
  gmailThreadId?: string; // The Gmail thread ID
  // Add other properties that might exist
  [key: string]: any;
};

// Add a function to check if the email is a demo email
function isDemoEmail(email: EmailData | null): boolean {
  if (!email) return false;
  return email.id.startsWith('demo-');
}

// Utility function to get labels from email
function getEmailLabels(email: EmailData | null): EmailLabel[] {
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

// Function to detect URLs in text
function detectUrls(text: string): { url: string, startIndex: number, endIndex: number }[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls: { url: string, startIndex: number, endIndex: number }[] = [];
  let match;
  
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push({
      url: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  return urls;
}

// Function to detect email addresses in text
function detectEmails(text: string): { email: string, startIndex: number, endIndex: number }[] {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g;
  const emails: { email: string, startIndex: number, endIndex: number }[] = [];
  let match;
  
  while ((match = emailRegex.exec(text)) !== null) {
    emails.push({
      email: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  return emails;
}

// Helper function to get file icon and color based on file type
function getFileTypeInfo(fileName: string): { icon: string; color: string } {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Document types
  if (['pdf'].includes(extension)) {
    return { icon: 'picture-as-pdf', color: '#F44336' };
  }
  
  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return { icon: 'image', color: '#4CAF50' };
  }
  
  // Spreadsheet types
  if (['xls', 'xlsx', 'csv', 'numbers', 'ods'].includes(extension)) {
    return { icon: 'table-chart', color: '#2196F3' };
  }
  
  // Presentation types
  if (['ppt', 'pptx', 'key', 'odp'].includes(extension)) {
    return { icon: 'slideshow', color: '#FF9800' };
  }
  
  // Archive types
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
    return { icon: 'folder-zip', color: '#9E9E9E' };
  }
  
  // Text/code types
  if (['txt', 'rtf', 'md', 'html', 'css', 'js', 'ts', 'json', 'xml'].includes(extension)) {
    return { icon: 'description', color: '#607D8B' };
  }
  
  // Audio types
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(extension)) {
    return { icon: 'audio-file', color: '#9C27B0' };
  }
  
  // Video types
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'].includes(extension)) {
    return { icon: 'video-file', color: '#E91E63' };
  }
  
  // Default
  return { icon: 'insert-drive-file', color: '#757575' };
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Component to render text with clickable links and email addresses
const LinkifiedText = ({ text, style }: { text: string, style?: any }) => {
  const { isDark } = useTheme();
  
  // Detect URLs and email addresses
  const urls = detectUrls(text);
  const emails = detectEmails(text);
  
  // Combine all detected entities and sort by start index
  const entities = [
    ...urls.map(u => ({ ...u, type: 'url' as const })),
    ...emails.map(e => ({ ...e, type: 'email' as const }))
  ].sort((a, b) => a.startIndex - b.startIndex);
  
  if (entities.length === 0) {
    // No links, return plain text
    return <Text style={style}>{text}</Text>;
  }
  
  // Build text parts with clickable links
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  entities.forEach((entity, index) => {
    // Add text before the entity
    if (entity.startIndex > lastIndex) {
      parts.push(
        <Text key={`plain-${index}`}>
          {text.substring(lastIndex, entity.startIndex)}
        </Text>
      );
    }
    
    // Add the clickable entity
    if (entity.type === 'url') {
      parts.push(
        <Text
          key={`url-${index}`}
          style={[styles.linkText, { color: isDark ? '#8ab4f8' : '#1a73e8' }]}
          onPress={() => Linking.openURL(entity.url)}
        >
          {entity.url}
        </Text>
      );
    } else if (entity.type === 'email') {
      parts.push(
        <Text
          key={`email-${index}`}
          style={[styles.linkText, { color: isDark ? '#8ab4f8' : '#1a73e8' }]}
          onPress={() => Linking.openURL(`mailto:${entity.email}`)}
        >
          {entity.email}
        </Text>
      );
    }
    
    lastIndex = entity.endIndex;
  });
  
  // Add any remaining text after the last entity
  if (lastIndex < text.length) {
    parts.push(
      <Text key="plain-last">
        {text.substring(lastIndex)}
      </Text>
    );
  }
  
  return <Text style={style}>{parts}</Text>;
};

export function ReadEmailModal({
  visible,
  currentEmail,
  onClose,
  onArchive,
  onDelete,
  onLabel,
  onSnooze,
  onMarkAsUnread,
  onReportSpam,
  onMoveToInbox,
  onStar,
  onReply,
  onForward,
}: ReadEmailModalProps) {
  console.log('ReadEmailModal rendered', currentEmail);
  // State for UI controls
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showFullHeader, setShowFullHeader] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isStarred, setIsStarred] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [replyMode, setReplyMode] = useState<'reply' | 'replyAll' | 'forward'>('reply');
  const [downloadProgress, setDownloadProgress] = useState<{[key: string]: number}>({});
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentViewingFile, setCurrentViewingFile] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false); // Add debug mode state at the component level
  
  // Access theme and device info
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const replyInputRef = useRef<TextInput>(null);
  
  // Gmail-specific colors based on theme
  const gmailTheme = isDark ? GMAIL_COLORS.dark : GMAIL_COLORS.light;
  
  // Animation values
  const headerOpacity = useRef(new RNAnimated.Value(1)).current; // Set opacity to always be 1
  const contentTranslateY = useRef(new RNAnimated.Value(20)).current;
  const contentOpacity = useRef(new RNAnimated.Value(0)).current;
  const actionMenuHeight = useRef(new RNAnimated.Value(0)).current;
  
  // Add error state to track issues
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Email labels
  const emailLabels = currentEmail ? getEmailLabels(currentEmail) : [];
  
  // Set initial starred state from email
  useEffect(() => {
    if (currentEmail) {
      setIsStarred(currentEmail.isStarred || false);
    }
  }, [currentEmail]);
  
  useEffect(() => {
    if (visible) {
      // Reset UI states
      setHasError(false);
      setErrorMessage('');
      setShowReplyBox(false);
      setShowActionMenu(false);
      setReplyText('');
      
      // Reset scroll position when email changes
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      
      // Start entrance animations
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
      
      // Validate email data
      if (!currentEmail) {
        setHasError(true);
        setErrorMessage('Email data is missing');
        console.error('ReadEmailModal: currentEmail is null');
      } else if (!currentEmail.id || !currentEmail.from || !currentEmail.subject) {
        setHasError(true);
        setErrorMessage('Email data is incomplete');
        console.error('ReadEmailModal: Email is missing required fields', currentEmail);
      }
    }
  }, [visible, currentEmail]);

  // Handle various email actions
  const handleAction = async (
    action: (emailId: string, ...args: any[]) => Promise<void>,
    ...args: any[]
  ) => {
    if (!currentEmail?.id || isActionLoading) return;

    setIsActionLoading(true);
    try {
      await action(currentEmail.id, ...args);
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Handle Star toggle
  const handleStarToggle = async () => {
    if (!currentEmail?.id || isActionLoading) return;
    
    const newStarredState = !isStarred;
    setIsStarred(newStarredState);
    
    try {
      await onStar(currentEmail.id, newStarredState);
    } catch (error) {
      // Revert UI state if action fails
      setIsStarred(!newStarredState);
      console.error('Star action failed:', error);
    }
  };
  
  // Handle scroll events - remove opacity animation
  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    setScrollY(y);
    // No header opacity animation as we want it fixed
  };
  
  // Handle reply action
  const handleReplyPress = (mode: 'reply' | 'replyAll' | 'forward') => {
    setReplyMode(mode);
    setShowReplyBox(true);
    
    // Focus the input after a short delay to ensure it's visible
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    }, 100);
  };
  
  // Handle sending a reply
  const handleSendReply = () => {
    if (!currentEmail || !replyText.trim()) return;
    
    // Call the appropriate handler
    if (replyMode === 'forward' && onForward) {
      onForward(currentEmail.id);
    } else if (onReply) {
      onReply(currentEmail.id, replyMode === 'replyAll');
    }
    
    // Reset UI state
    setShowReplyBox(false);
    setReplyText('');
    
    // Show confirmation
    Alert.alert('Message Sent', 'Your message has been sent successfully.');
  };
  
  // Share email content
  const shareEmail = async () => {
    if (!currentEmail) return;
    
    try {
      await Share.share({
        message: `${currentEmail.subject}\n\nFrom: ${currentEmail.from}\n\n${parseHtmlContent(currentEmail.body || '')}`,
        title: currentEmail.subject,
      });
    } catch (error) {
      console.error('Error sharing email:', error);
    }
  };
  
  // Toggle action menu
  const toggleActionMenu = () => {
    setShowActionMenu(!showActionMenu);
    
    // Animate menu height
    RNAnimated.timing(actionMenuHeight, {
      toValue: showActionMenu ? 0 : 280,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  // Format email address from string
  const formatEmailAddress = (emailStr: string) => {
    try {
      if (!emailStr) {
        console.warn('Empty email string provided to formatEmailAddress');
        return { name: '', email: 'unknown@example.com' };
      }
      
      // Extract name and email from format "Name <email@example.com>"
      const match = emailStr.match(/^(.*?)\s*<([^>]+)>$/);
      if (match) {
        const [_, name, email] = match;
        return { 
          name: name ? name.trim().replace(/"/g, '') : '', 
          email: email ? email.trim() : 'unknown@example.com' 
        };
      }
      return { name: '', email: emailStr.trim() || 'unknown@example.com' };
    } catch (error) {
      console.error('Error formatting email address:', error);
      return { name: '', email: 'unknown@example.com' };
    }
  };
  
  // Format date string for display
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) {
        console.warn('Empty date string provided to formatDate');
        return 'Unknown date';
      }
      
      const date = new Date(dateString);
      
      // Check if date is invalid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Unknown date';
      }
      
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  // Render plain text from HTML content with enhanced formatting
  const renderPlainTextContent = (htmlContent: string) => {
    if (!htmlContent) {
      return (
        <View style={styles.emptyContentContainer}>
          <Icon name="email" size={48} color={gmailTheme.text.tertiary} />
          <Text style={[styles.emptyContentText, {color: gmailTheme.text.secondary}]}>
            This email doesn't contain any content.
          </Text>
        </View>
      );
    }
    
    try {
      // Parse HTML to plain text with enhanced formatting
      const plainText = parseHtmlContent(htmlContent);
      
      // Split by paragraphs while preserving intended spacing
      const paragraphs = plainText
        .replace(/\n{3,}/g, '\n\n') // Normalize excessive newlines
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);
      
      const handleLongPress = () => {
        Alert.alert(
          'Text Options',
          'What would you like to do?',
          [
            { text: 'Copy All', onPress: () => {
              // In a real app, you would use Clipboard.setString(plainText)
              Alert.alert('Copied', 'Text copied to clipboard');
            }},
            { text: 'Share', onPress: () => shareEmail() },
            { text: 'View Original HTML', onPress: () => {
              Alert.alert('HTML Content', htmlContent.substring(0, 1000) + '...');
            }},
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      };
      
      return (
        <Pressable 
          style={styles.emailTextContent}
          onLongPress={handleLongPress}
          delayLongPress={500}
        >
          {paragraphs.map((paragraph, index) => {
            // Check if this is a list item
            const isList = paragraph.trim().startsWith('•') || 
                          paragraph.trim().startsWith('-') || 
                          /^\d+\./.test(paragraph.trim());
            
            // Check if this is a quote
            const isQuote = paragraph.trim().startsWith('>');
            
            // Check if this is a separator
            const isSeparator = paragraph.trim().startsWith('---') || 
                               paragraph.trim().startsWith('___') ||
                               paragraph.trim().startsWith('***');
            
            // Check if paragraph contains formatting indicators (**bold**, _italic_)
            const hasBold = paragraph.includes('**');
            const hasItalic = paragraph.includes('_');
            
            // Check if this is a code block (indented with 4 spaces or surrounded by ```)
            const isCode = paragraph.split('\n').every(line => line.startsWith('    ')) ||
                           paragraph.startsWith('```') && paragraph.endsWith('```');
            
            // Check if this is a table-like structure with multiple | characters
            const isTable = paragraph.includes('|') && 
                            paragraph.split('\n').filter(line => line.includes('|')).length > 1;
            
            // Handle separator lines
            if (isSeparator) {
              return (
                <View 
                  key={`separator-${index}`} 
                  style={[
                    styles.separator, 
                    {backgroundColor: gmailTheme.border}
                  ]} 
                />
              );
            }
            
            // Handle quoted text
            if (isQuote) {
              // Process the quote to remove the > prefix from each line
              const quoteContent = paragraph
                .split('\n')
                .map(line => line.replace(/^>\s*/, ''))
                .join('\n');
                
              return (
                <View 
                  key={`quote-${index}`}
                  style={[
                    styles.quotedText,
                    {borderLeftColor: gmailTheme.primary}
                  ]}
                >
                  <LinkifiedText
                    text={quoteContent}
                    style={[
                      styles.plainTextParagraph, 
                      {
                        color: gmailTheme.text.secondary,
                        fontStyle: 'italic',
                        marginBottom: 0
                      }
                    ]}
                  />
                </View>
              );
            }
            
            // Handle list items
            if (isList) {
              return (
                <LinkifiedText
                  key={`list-${index}`} 
                  text={paragraph}
                  style={[
                    styles.plainTextParagraph, 
                    styles.listItem,
                    {color: gmailTheme.text.primary}
                  ]}
                />
              );
            }
            
            // Handle code blocks
            if (isCode) {
              let codeContent = paragraph;
              
              // Remove surrounding ``` if present
              if (codeContent.startsWith('```') && codeContent.endsWith('```')) {
                codeContent = codeContent.substring(3, codeContent.length - 3).trim();
              }
              
              // Remove 4-space indentation from each line
              if (codeContent.split('\n').every(line => line.startsWith('    '))) {
                codeContent = codeContent
                  .split('\n')
                  .map(line => line.substring(4))
                  .join('\n');
              }
              
              return (
                <View 
                  key={`code-${index}`} 
                  style={[
                    styles.codeBlock,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      borderColor: gmailTheme.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.codeText,
                      {
                        color: gmailTheme.text.primary,
                        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                      }
                    ]}
                  >
                    {codeContent}
                  </Text>
                </View>
              );
            }
            
            // Handle table-like structures
            if (isTable) {
              const lines = paragraph.split('\n');
              const tableRows = lines.filter(line => line.includes('|'));
              
              return (
                <View 
                  key={`table-${index}`} 
                  style={[
                    styles.tableContainer,
                    {
                      borderColor: gmailTheme.border,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                    }
                  ]}
                >
                  {tableRows.map((row, rowIndex) => {
                    const cells = row
                      .split('|')
                      .filter(cell => cell.trim().length > 0)
                      .map(cell => cell.trim());
                    
                    const isHeader = rowIndex === 0 || row.includes('---');
                    
                    // Skip separator rows (e.g., |---|---|)
                    if (row.includes('---') && !row.match(/[a-zA-Z0-9]/)) {
                      return null;
                    }
                    
                    return (
                      <View 
                        key={`row-${rowIndex}`} 
                        style={[
                          styles.tableRow,
                          {
                            borderBottomColor: gmailTheme.border,
                            backgroundColor: isHeader && isDark ? 'rgba(255,255,255,0.1)' : 
                                            isHeader ? 'rgba(0,0,0,0.05)' : 'transparent'
                          }
                        ]}
                      >
                        {cells.map((cell, cellIndex) => (
                          <Text
                            key={`cell-${rowIndex}-${cellIndex}`}
                            style={[
                              styles.tableCell,
                              isHeader && styles.tableHeaderCell,
                              {
                                color: gmailTheme.text.primary,
                                borderRightColor: gmailTheme.border
                              }
                            ]}
                          >
                            {cell}
                          </Text>
                        ))}
                      </View>
                    );
                  })}
                </View>
              );
            }
            
            // Format the text if it contains markdown-like indicators
            if (hasBold || hasItalic) {
              // Simple regex-based formatting
              const formattedText = paragraph
                .replace(/\*\*(.*?)\*\*/g, '\\BOLD\\$1\\BOLD\\')
                .replace(/_(.*?)_/g, '\\ITALIC\\$1\\ITALIC\\');
              
              // Split the string by the markers
              const parts = formattedText.split(/\\(BOLD|ITALIC)\\/);
              
              return (
                <View key={`formatted-${index}`} style={styles.paragraph}>
                  <Text style={{color: gmailTheme.text.primary}}>
                    {parts.map((part, partIndex) => {
                      if (part === 'BOLD') {
                        return null; // Skip the markers
                      } else if (part === 'ITALIC') {
                        return null; // Skip the markers
                      } else if (partIndex > 0 && parts[partIndex - 1] === 'BOLD') {
                        return (
                          <Text 
                            key={`bold-${partIndex}`} 
                            style={{fontWeight: 'bold'}}
                          >
                            {part}
                          </Text>
                        );
                      } else if (partIndex > 0 && parts[partIndex - 1] === 'ITALIC') {
                        return (
                          <Text 
                            key={`italic-${partIndex}`} 
                            style={{fontStyle: 'italic'}}
                          >
                            {part}
                          </Text>
                        );
                      } else {
                    return (
                      <LinkifiedText
                            key={`regular-${partIndex}`}
                            text={part}
                            style={{}}
                          />
                        );
                      }
                    })}
                  </Text>
                </View>
              );
            }
            
            // Handle regular paragraphs
            return (
              <View key={`para-${index}`} style={styles.paragraph}>
                  <LinkifiedText
                  text={paragraph}
                    style={[
                    styles.plainTextParagraph, 
                      {color: gmailTheme.text.primary}
                    ]}
                  />
              </View>
            );
          })}
        </Pressable>
      );
    } catch (error) {
      console.error('Error rendering text content:', error);
      return (
        <View>
          <Text style={[styles.errorMessage, {color: gmailTheme.text.secondary}]}>
            Error rendering email content
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: gmailTheme.primary}]}
            onPress={() => {
              Alert.alert(
                'View Original HTML',
                'Would you like to view the original HTML?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'View HTML', 
                    onPress: () => {
                      // This would typically open a web view or show the raw HTML
                      Alert.alert('HTML Content', htmlContent.substring(0, 1000) + '...');
                    }
                  }
                ]
              );
            }}
          >
            <Text style={[styles.retryButtonText, {color: gmailTheme.text.inverse}]}>
              View Original Format
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
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

  // Constants for attachment handling
  const ATTACHMENT_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const AUTH_TOKEN_KEY = 'gmail_auth_token';
  const ATTACHMENT_CACHE_DIR = 'email_attachments';

  // Helper for managing auth tokens using secure storage
  const getAuthToken = async (): Promise<string | null> => {
    try {
      // In a real app, use a secure storage solution like react-native-mmkv or react-native-keychain
      // Example with react-native-keychain:
      // const credentials = await Keychain.getGenericPassword(AUTH_TOKEN_KEY);
      // return credentials ? credentials.password : null;
      
      // For demo purposes, return a placeholder
      return null; // Replace with actual token retrieval in production
    } catch (error: any) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  };

  // Function to prepare cache directory
  const prepareCacheDirectory = async (): Promise<string> => {
    const cacheBaseDir = RNBlobUtil.fs.dirs.CacheDir;
    const attachmentCacheDir = `${cacheBaseDir}/${ATTACHMENT_CACHE_DIR}`;
    
    // Check if directory exists, create if not
    const exists = await RNBlobUtil.fs.exists(attachmentCacheDir);
    if (!exists) {
      await RNBlobUtil.fs.mkdir(attachmentCacheDir);
      console.log('Created attachment cache directory');
    }
    
    return attachmentCacheDir;
  };

  // Function to clean up old cached attachments
  const cleanupOldAttachments = async (): Promise<void> => {
    try {
      const cacheDir = await prepareCacheDirectory();
      const now = Date.now();
      
      // List files in cache directory
      const files = await RNBlobUtil.fs.ls(cacheDir);
      
      // Check each file's last modified time
      for (const file of files) {
        const filePath = `${cacheDir}/${file}`;
        const stats = await RNBlobUtil.fs.stat(filePath);
        
        if (stats && stats.lastModified) {
          const fileAge = now - stats.lastModified;
          if (fileAge > ATTACHMENT_CACHE_EXPIRY) {
            await RNBlobUtil.fs.unlink(filePath);
            console.log(`Removed old cached attachment: ${file}`);
          }
        }
      }
    } catch (error: any) {
      console.error('Error cleaning up old attachments:', error);
      // Non-critical error, so just log and continue
    }
  };

  // Initialize the cache when component mounts
  useEffect(() => {
    // Clean up old attachments from cache
    cleanupOldAttachments().catch(error => 
      console.error('Failed to clean attachment cache:', error)
    );
  }, []);

  // Helper to generate cache key for an attachment
  const getAttachmentCacheKey = (messageId: string, attachmentId: string): string => {
    return `${messageId}_${attachmentId}`;
  };

  // Check if an attachment is already cached
  const isAttachmentCached = async (messageId: string, attachmentId: string, name: string): Promise<string | null> => {
    try {
      // Generate a consistent filename based on IDs
      const cacheKey = getAttachmentCacheKey(messageId, attachmentId);
      const cacheDir = await prepareCacheDirectory();
      
      // Check if file exists with messageId_attachmentId as base
      const possiblePaths = [
        `${cacheDir}/${cacheKey}`,
        `${cacheDir}/${cacheKey}_${name}`,
        `${cacheDir}/${name}`
      ];
      
      for (const path of possiblePaths) {
        const exists = await RNBlobUtil.fs.exists(path);
        if (exists) {
          console.log('Found cached attachment:', path);
          return path;
        }
      }
      
      return null;
    } catch (error: any) {
      console.error('Error checking attachment cache:', error);
      return null;
    }
  };

  // Enhanced Gmail API attachment fetch with caching and proper auth
  const fetchGmailAttachment = async (messageId: string, attachmentId: string, fileName: string): Promise<string | null> => {
    try {
      console.log(`Fetching Gmail attachment: messageId=${messageId}, attachmentId=${attachmentId}`);
      
      // First check if attachment is already cached
      const cachedFilePath = await isAttachmentCached(messageId, attachmentId, fileName);
      if (cachedFilePath) {
        console.log('Using cached attachment:', cachedFilePath);
        return cachedFilePath;
      }
      
      // Get auth token
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      
      // Prepare cache directory
      const cacheDir = await prepareCacheDirectory();
      const cacheKey = getAttachmentCacheKey(messageId, attachmentId);
      let tempFilePath = `${cacheDir}/${cacheKey}`;
      
      // If filename has an extension, add it to the cache file
      const extension = fileName.split('.').pop();
      if (extension && extension !== fileName) {
        tempFilePath = `${tempFilePath}.${extension}`;
      }
      
      // Fetch the attachment data
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gmail API error response:', errorText);
        
        // Handle specific error cases
        if (response.status === 401) {
          // Token expired or invalid
          throw new Error('Authentication token expired');
        } else if (response.status === 403) {
          throw new Error('No permission to access this attachment');
        } else if (response.status === 404) {
          throw new Error('Attachment not found');
        } else {
          throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
        }
      }

      // Parse the response
      const data = await response.json();
      
      if (!data || !data.data) {
        throw new Error('Invalid response from Gmail API: missing attachment data');
      }
      
      // Convert from base64url to base64
      const base64Data = data.data.replace(/-/g, '+').replace(/_/g, '/');
      
      // Save the file
      await RNBlobUtil.fs.writeFile(tempFilePath, base64Data, 'base64');
      console.log('Gmail attachment saved to cache:', tempFilePath);
      
      return tempFilePath;
    } catch (error: any) {
      // Handle different error types
      if (error.message?.includes('Authentication')) {
        // Auth errors - could trigger a re-auth flow here
        console.error('Authentication error fetching attachment:', error);
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please sign in again to access attachments.',
          [{ text: 'OK' }]
        );
      } else if (error.message?.includes('network')) {
        // Network errors
        console.error('Network error fetching attachment:', error);
        Alert.alert(
          'Network Error',
          'Could not connect to Gmail servers. Please check your internet connection.',
          [{ text: 'OK' }]
        );
      } else {
        // Other errors
        console.error('Error fetching Gmail attachment:', error);
      }
      
      return null;
    }
  };

  // Update the downloadAttachment function to use enhanced Gmail API
  const downloadAttachment = async (attachment: Attachment) => {
    try {
      // For Android, request permissions
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs access to your storage to download files",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is needed to download files');
          return;
        }
      }
      
      setIsActionLoading(true);
      
      // Initialize progress for this attachment
      setDownloadProgress(prev => ({...prev, [attachment.id]: 0}));
      
      // Check if this is a Gmail attachment with proper IDs
      if (attachment.messageId && attachment.id) {
        console.log('Downloading Gmail attachment:', attachment.name);
        try {
          // Set downloading progress to indicate we're starting
          setDownloadProgress(prev => ({...prev, [attachment.id]: 10}));
          
          // Fetch the attachment using enhanced Gmail API function
          const filePath = await fetchGmailAttachment(
            attachment.messageId, 
            attachment.id,
            attachment.name
          );
          
          if (!filePath) {
            throw new Error('Failed to download attachment from Gmail API');
          }
          
          // Set progress to indicate completion
          setDownloadProgress(prev => ({...prev, [attachment.id]: 100}));
          
          // Copy to download directory
          const downloadPath = Platform.OS === 'ios' 
            ? `${RNBlobUtil.fs.dirs.DocumentDir}/${attachment.name}`
            : `${RNBlobUtil.fs.dirs.DownloadDir}/${attachment.name}`;
          
          await RNBlobUtil.fs.cp(filePath, downloadPath);
          console.log('Gmail attachment copied to:', downloadPath);
      
      setIsActionLoading(false);
      
      // Show success message
      if (Platform.OS === 'android') {
        ToastAndroid.show(`${attachment.name} downloaded successfully`, ToastAndroid.LONG);
      } else {
        Alert.alert(
          'Download Complete',
          `${attachment.name} has been downloaded successfully.`,
          [
            { text: 'OK' },
            { 
              text: 'View File', 
                  onPress: () => openFile(downloadPath, attachment.contentType)
                }
              ]
            );
          }
          return;
        } catch (gmailError) {
          console.error('Error downloading Gmail attachment:', gmailError);
          // Fall back to URL method if available
          if (attachment.url) {
            console.log('Falling back to URL download method');
          } else {
            setIsActionLoading(false);
            setDownloadProgress(prev => ({...prev, [attachment.id]: 0}));
            Alert.alert(
              'Download Failed', 
              'Could not download attachment from Gmail. Please try again later.'
            );
            return;
          }
        }
      }
      
      // If we reach here, use URL method (either as fallback or primary method)
      if (!attachment.url) {
        setIsActionLoading(false);
        setDownloadProgress(prev => ({...prev, [attachment.id]: 0}));
        Alert.alert('Download Failed', 'No download URL available for this attachment.');
        return;
      }
      
      // Set up directory path based on platform
      const dirPath = Platform.OS === 'ios' 
        ? RNBlobUtil.fs.dirs.DocumentDir 
        : RNBlobUtil.fs.dirs.DownloadDir;
      
      // Start the download
      RNBlobUtil.config({
        path: `${dirPath}/${attachment.name}`,
        fileCache: true,
        addAndroidDownloads: Platform.OS === 'android' ? {
          useDownloadManager: true,
          notification: true,
          mime: attachment.contentType,
          title: attachment.name,
          description: 'File downloaded from email'
        } : undefined,
      })
      .fetch('GET', attachment.url, {
        // Add any necessary authentication headers for external URLs
      })
      .progress((received: string, total: string) => {
        const percentage = Math.floor((parseInt(received, 10) / parseInt(total, 10)) * 100);
        setDownloadProgress(prev => ({...prev, [attachment.id]: percentage}));
      })
      .then(res => {
        console.log('File saved to:', res.path());
        setIsActionLoading(false);
        setDownloadProgress(prev => ({...prev, [attachment.id]: 100}));
        
        // Show success message
        if (Platform.OS === 'android') {
          ToastAndroid.show(`${attachment.name} downloaded successfully`, ToastAndroid.LONG);
        } else {
          Alert.alert(
            'Download Complete',
            `${attachment.name} has been downloaded successfully.`,
            [
              { text: 'OK' },
              { 
                text: 'View File', 
                onPress: () => openFile(res.path(), attachment.contentType)
            }
          ]
        );
      }
      })
      .catch(error => {
        console.error('Download error:', error);
        setIsActionLoading(false);
        setDownloadProgress(prev => ({...prev, [attachment.id]: 0}));
        Alert.alert('Download Failed', 'Unable to download the attachment. Please try again later.');
      });
    } catch (error) {
      setIsActionLoading(false);
      setDownloadProgress(prev => ({...prev, [attachment.id]: 0}));
      console.error('Error downloading attachment:', error);
      Alert.alert('Download Failed', 'Unable to download the attachment. Please try again later.');
    }
  };

  // Update the previewAttachment function to use enhanced Gmail API
  const previewAttachment = async (attachment: Attachment) => {
    try {
      setIsActionLoading(true);
      console.log('Previewing attachment:', attachment.name, attachment.contentType);
      
      // Check if this is a Gmail attachment by looking for messageId and attachmentId
      if (attachment.messageId && attachment.id) {
        console.log('Using Gmail API to fetch attachment for preview');
        
        // Show indeterminate progress
        setDownloadProgress(prev => ({...prev, [attachment.id]: 10}));
        
        const filePath = await fetchGmailAttachment(
          attachment.messageId, 
          attachment.id,
          attachment.name
        );
        
        if (filePath) {
          // Clear progress indicator
          setDownloadProgress(prev => ({...prev, [attachment.id]: 100}));
          setIsActionLoading(false);
          
          // Open the file
          openFile(filePath, attachment.contentType);
          return;
        } else {
          // Gmail API failed, try fallback methods
          console.log('Gmail API fetch failed, trying fallbacks');
          
          // If no fallbacks available, show error
          if (!attachment.url && !attachment.data) {
            setIsActionLoading(false);
            setDownloadProgress(prev => ({...prev, [attachment.id]: 0}));
        Alert.alert(
              'Preview Failed',
              'Could not retrieve attachment from Gmail. Please try again later.',
          [
                { text: 'OK' },
                { text: 'Try Download', onPress: () => downloadAttachment(attachment) }
          ]
        );
        return;
          }
        }
      }
      
      // If we have embedded data, use it directly
      if (attachment.data) {
        console.log('Using embedded data for attachment preview');
        
        const tempDir = RNBlobUtil.fs.dirs.CacheDir;
        const tempFilePath = `${tempDir}/preview_${attachment.name}`;
        
        // Write the data to a file if it's base64 encoded
        await RNBlobUtil.fs.writeFile(tempFilePath, attachment.data, 'base64');
        console.log('Created preview file from embedded data at:', tempFilePath);
        
        setIsActionLoading(false);
        openFile(tempFilePath, attachment.contentType);
        return;
      }
      
      // Fall back to URL if available
      if (attachment.url) {
        console.log('Downloading attachment from URL for preview:', attachment.url);
        
        // Create a temporary file
        const tempDir = RNBlobUtil.fs.dirs.CacheDir;
        const tempFilePath = `${tempDir}/preview_${attachment.name}`;
        
        // Download file for preview
        RNBlobUtil.config({
          fileCache: true,
          path: tempFilePath,
        })
        .fetch('GET', attachment.url, {
          // Add any necessary authentication headers
        })
        .progress((received: string, total: string) => {
          const percentage = Math.floor((parseInt(received, 10) / parseInt(total, 10)) * 100);
          setDownloadProgress(prev => ({...prev, [attachment.id]: percentage}));
        })
        .then((res) => {
          console.log('File downloaded to:', res.path());
          setIsActionLoading(false);
          setDownloadProgress(prev => ({...prev, [attachment.id]: 100}));
          
          // Open the file with appropriate viewer
          openFile(res.path(), attachment.contentType);
        })
        .catch((err) => {
          console.error('Preview error:', err);
          setIsActionLoading(false);
          setDownloadProgress(prev => ({...prev, [attachment.id]: 0}));
          
        Alert.alert(
            'Preview Failed',
            'Could not download the file for preview. Would you like to try downloading it instead?',
          [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Download', onPress: () => downloadAttachment(attachment) }
          ]
        );
        });
        return;
      }
      
      // If we reach here, we have no way to get the attachment
      setIsActionLoading(false);
      Alert.alert(
        'Attachment Unavailable',
        'This attachment cannot be previewed as there is no data or download URL available.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error previewing attachment:', error);
      setIsActionLoading(false);
      setDownloadProgress(prev => ({...prev, [attachment.id]: 0}));
      Alert.alert(
        'Preview Failed', 
        'Unable to preview the attachment due to an error. Please try downloading it instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => downloadAttachment(attachment) }
        ]
      );
    }
  };

  // Enhanced error handling and file type checking for the openFile function
  const openFile = (filePath: string, contentType: string) => {
    console.log('Opening file:', { filePath, contentType });
    
    // Check if the file exists before opening
    RNBlobUtil.fs.exists(filePath)
      .then((exists) => {
        console.log(`File exists check: ${exists ? 'YES' : 'NO'}`);
        
        if (!exists) {
          console.error('File does not exist at path:', filePath);
          Alert.alert('Error', 'The file does not exist on the device.');
          return;
        }
        
        // Get file size to verify it's not empty
        return RNBlobUtil.fs.stat(filePath).then(stats => {
          if (stats.size === 0) {
            console.error('File exists but is empty:', filePath);
            Alert.alert('Error', 'The file appears to be empty or corrupted.');
            return;
          }
          
          // Extract the file extension to double-check content type
          const extension = filePath.split('.').pop()?.toLowerCase();
          
          // Validate content type
          let validatedContentType = contentType;
          if (!contentType || contentType === 'application/octet-stream') {
            // Try to infer content type from extension
            if (extension) {
              if (['pdf'].includes(extension)) {
                validatedContentType = 'application/pdf';
              } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                validatedContentType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
              } else if (['doc', 'docx'].includes(extension)) {
                validatedContentType = 'application/msword';
              } else if (['xls', 'xlsx'].includes(extension)) {
                validatedContentType = 'application/vnd.ms-excel';
              } else if (['ppt', 'pptx'].includes(extension)) {
                validatedContentType = 'application/vnd.ms-powerpoint';
              } else if (['txt'].includes(extension)) {
                validatedContentType = 'text/plain';
              }
            }
          }
          
          // Format path properly, ensuring file:// prefix for all platforms
          const formattedPath = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
          console.log('Setting current viewing file to:', formattedPath);
          
          if (extension === 'pdf' || validatedContentType.includes('pdf')) {
            console.log('Opening PDF document with in-app viewer');
          }
          
          // Use in-app viewer for all platforms
          setCurrentViewingFile(formattedPath);
          setViewerVisible(true);
        });
      })
      .catch((error) => {
        console.error('Error checking file existence:', error);
        Alert.alert('Error', 'Failed to verify if the file exists or is valid.');
      });
  };

  // Fix the debug options to use Gmail API instead of createDebugFile
  const renderAttachmentItem = (attachment: Attachment, index: number) => {
    const isDownloading = downloadProgress.hasOwnProperty(attachment.id);
    const progress = downloadProgress[attachment.id] || 0;
    
    // Get the file type information for the icon
    const fileInfo = getFileTypeInfo(attachment.name);
    
    // Check if attachment is already cached
    const isCached = false; // Normally would check if file is in cache
    
    const handleAttachmentPress = async () => {
      // Show action sheet for attachment
      Alert.alert(
        attachment.name,
        `Size: ${attachment.sizeDisplay}`,
        [
          {
            text: 'Preview',
            onPress: () => previewAttachment(attachment),
          },
          {
            text: 'Download',
            onPress: () => downloadAttachment(attachment),
          },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    };
    
    // For handling long press on attachment
    const handleAttachmentLongPress = () => {
      Alert.alert(
        'Attachment Options',
        attachment.name,
        [
          {
            text: 'Download',
            onPress: () => downloadAttachment(attachment)
          },
          {
            text: 'Copy Link',
            onPress: () => {
              /* Would implement copy to clipboard */
              Alert.alert('Link Copied', 'Attachment link copied to clipboard.');
            }
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    };
    
    return (
      <TouchableOpacity
        key={attachment.id}
        style={[
          styles.attachmentCard,
          { 
            backgroundColor: gmailTheme.attachment.background,
            borderColor: gmailTheme.border,
            width: '100%', // Make sure it spans full width
          }
        ]}
        onPress={handleAttachmentPress}
        onLongPress={handleAttachmentLongPress}
      >
        <View style={[
          styles.attachmentIconContainer,
          { backgroundColor: fileInfo.color + '20' /* 20% opacity */ }
        ]}>
          <Icon name={fileInfo.icon} size={24} color={fileInfo.color} />
        </View>
        
        <View style={styles.attachmentDetails}>
          <Text
            numberOfLines={1}
            ellipsizeMode="middle"
            style={[styles.attachmentName, { color: gmailTheme.text.primary }]}
          >
            {attachment.name}
          </Text>
          <Text style={[styles.attachmentMeta, { color: gmailTheme.text.secondary }]}>
            {attachment.sizeDisplay}
          </Text>
        </View>
        
        {isDownloading ? (
          <View style={styles.downloadingContainer}>
            <View style={styles.progressContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${progress}%`,
                    backgroundColor: gmailTheme.primary 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: gmailTheme.text.secondary }]}>
              {Math.round(progress)}%
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.attachmentAction}
            onPress={() => downloadAttachment(attachment)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Icon 
              name={isCached ? "visibility" : "file-download"} 
              size={20} 
              color={gmailTheme.primary}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (!currentEmail) return null;

  // Add a try-catch block to safely handle any errors in data extraction
  let emailBody = '';
  let senderName = '';
  let senderEmail = '';
  let formattedDate = '';
  let senderInitial = '';
  
  try {
    // Safely extract email properties with fallbacks
    emailBody = currentEmail.body || '';
    const emailAddressInfo = formatEmailAddress(currentEmail.from || '');
    senderName = emailAddressInfo.name || 'Unknown Sender';
    senderEmail = emailAddressInfo.email || 'unknown@example.com';
    formattedDate = formatDate(currentEmail.date || '');
    
    // Get sender initial for avatar with fallback
    senderInitial = senderName ? senderName.charAt(0).toUpperCase() : 
                  senderEmail ? senderEmail.charAt(0).toUpperCase() : '?';
  } catch (error) {
    console.error('Error processing email data:', error);
    setHasError(true);
    setErrorMessage('Error processing email data');
  }
  
  // Get related thread messages from currentEmail
  const getThreadMessages = () => {
    const messages = [];
    
    // If no email or email doesn't have a thread ID, return empty array
    if (!currentEmail || !currentEmail.gmailThreadId) {
      return messages;
    }
    
    // For demo purposes: If this is a demo email, create a simulated thread
    if (isDemoEmail(currentEmail)) {
      // Add simulated thread messages (usually would come from API)
      messages.push(currentEmail); // Current message is part of thread
      
      // Add a simulated earlier message in thread
      if (currentEmail.from && currentEmail.to) {
        const replyPrefix = currentEmail.subject.startsWith('Re:') ? '' : 'Re: ';
        
        // Create a simulated earlier message in the thread
        const earlierMessage = {
          ...currentEmail,
          id: `${currentEmail.id}-thread-1`,
          date: new Date(new Date(currentEmail.date).getTime() - 86400000).toISOString(), // 1 day earlier
          from: currentEmail.to,
          to: currentEmail.from,
          subject: replyPrefix + currentEmail.subject,
          body: `<p>Original message.</p><p>This is the previous email in the thread.</p>`,
          isStarred: false,
          attachments: currentEmail.attachments ? [] : undefined, // No attachments in the earlier message
        };
        
        messages.unshift(earlierMessage); // Add at beginning
      }
    }
    
    return messages;
  };
  
  // Get the status bar height with a fallback 
  const getStatusBarHeight = () => {
    // On iOS, use the insets.top which accounts for the status bar
    // On Android, use StatusBar.currentHeight with fallback
    return Platform.OS === 'ios' 
      ? Math.max(insets.top, 20) // Ensure minimum 20pt on iOS (older devices fallback)
      : StatusBar.currentHeight || 0;
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.safeArea, { backgroundColor: gmailTheme.background }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Gmail-style Header with proper status bar spacing */}
        <View style={[
          styles.gmailHeader,
          { 
            paddingTop: getStatusBarHeight(),
            height: 56 + getStatusBarHeight(), // Add status bar height to overall header height
            backgroundColor: gmailTheme.surface,
            borderBottomColor: gmailTheme.border,
            borderBottomWidth: 1,
            zIndex: 1000,
          }
        ]}>
          <View style={[styles.headerContent, { height: 56 }]}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onClose}
              disabled={isActionLoading}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            >
              <Icon name="arrow-back" size={24} color={gmailTheme.text.secondary} />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={() => handleAction(onArchive)}
                disabled={isActionLoading}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Icon name="archive" size={22} color={gmailTheme.text.secondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={() => handleAction(onDelete)}
                disabled={isActionLoading}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Icon name="delete" size={22} color={gmailTheme.text.secondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={() => handleAction(onMarkAsUnread)}
                disabled={isActionLoading}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Icon name="mail-outline" size={22} color={gmailTheme.text.secondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={toggleActionMenu}
                disabled={isActionLoading}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Icon name="more-vert" size={22} color={gmailTheme.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Action Menu Overlay */}
        {/* {showActionMenu && ( */}
          <Pressable 
            style={styles.actionMenuOverlay} 
            onPress={toggleActionMenu}
          >
            <RNAnimated.View 
              style={[
                styles.actionMenu,
                { 
                  height: actionMenuHeight,
                  backgroundColor: gmailTheme.surface,
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={() => {
                  toggleActionMenu();
                  handleAction(onReportSpam);
                }}
              >
                <Icon name="report" size={20} color={gmailTheme.text.secondary} />
                <Text style={[styles.actionMenuText, {color: gmailTheme.text.primary}]}>
                  Report spam
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={() => {
                  toggleActionMenu();
                  handleAction(onSnooze);
                }}
              >
                <Icon name="schedule" size={20} color={gmailTheme.text.secondary} />
                <Text style={[styles.actionMenuText, {color: gmailTheme.text.primary}]}>
                  Snooze
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={() => {
                  toggleActionMenu();
                  handleAction(onMoveToInbox);
                }}
              >
                <Icon name="inbox" size={20} color={gmailTheme.text.secondary} />
                <Text style={[styles.actionMenuText, {color: gmailTheme.text.primary}]}>
                  Move to inbox
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={() => {
                  toggleActionMenu();
                  handleAction(onLabel);
                }}
              >
                <Icon name="label" size={20} color={gmailTheme.text.secondary} />
                <Text style={[styles.actionMenuText, {color: gmailTheme.text.primary}]}>
                  Label as
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={() => {
                  toggleActionMenu();
                  // Additional action - print
                  Alert.alert('Print', 'Printing functionality would be implemented here.');
                }}
              >
                <Icon name="print" size={20} color={gmailTheme.text.secondary} />
                <Text style={[styles.actionMenuText, {color: gmailTheme.text.primary}]}>
                  Print
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={() => {
                  toggleActionMenu();
                  // Additional action - mark as not important
                  Alert.alert('Mark as not important', 'This action would mark the email as not important.');
                }}
              >
                <MCI name="arrow-down-bold" size={20} color={gmailTheme.text.secondary} />
                <Text style={[styles.actionMenuText, {color: gmailTheme.text.primary}]}>
                  Mark as not important
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={() => {
                  toggleActionMenu();
                  shareEmail();
                }}
              >
                <Icon name="share" size={20} color={gmailTheme.text.secondary} />
                <Text style={[styles.actionMenuText, {color: gmailTheme.text.primary}]}>
                  Share
                </Text>
              </TouchableOpacity>
            </RNAnimated.View>
          </Pressable>
        {/* )} */}
        
        {/* Main Content */}
        <ScrollView
          ref={scrollViewRef}
          style={[
            styles.scrollView, 
            {
              backgroundColor: gmailTheme.background,
              marginTop: 0,
            }
          ]}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: 56 + getStatusBarHeight(), // Use the same calculation as header height
              paddingBottom: insets.bottom + 24,
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
          
          {/* Error State Indicator */}
          {hasError && (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={48} color={isDark ? '#F28B82' : '#D93025'} />
              <Text style={[styles.errorTitle, {color: gmailTheme.text.primary}]}>
                Something went wrong
              </Text>
              <Text style={[styles.errorMessage, {color: gmailTheme.text.secondary}]}>
                {errorMessage || 'Unable to load this email.'}
              </Text>
              <TouchableOpacity 
                style={[styles.errorButton, {backgroundColor: gmailTheme.primary}]}
                onPress={onClose}
              >
                <Text style={[styles.errorButtonText, {color: isDark ? '#1F1F1F' : '#FFFFFF'}]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Only show the email content if there's no error */}
          {!hasError && (
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
                      <React.Fragment key={`label-${index}`}>
                        {renderLabelChip(label)}
                      </React.Fragment>
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
                <View style={styles.emailBodyContainer}>
                  {/* Thread messages display */}
                  {getThreadMessages().length > 1 ? (
                    <View style={styles.threadContainer}>
                      {getThreadMessages().map((message, index) => (
                        <View 
                          key={`thread-message-${message.id}`} 
                          style={[
                            styles.threadMessage,
                            index < getThreadMessages().length - 1 && styles.threadMessageDivider,
                            {borderBottomColor: gmailTheme.border}
                          ]}
                        >
                          <View style={styles.threadMessageHeader}>
                            <View style={[styles.avatarCircle, {
                              backgroundColor: isDark ? '#5E81AC' : gmailTheme.primary,
                              width: 28,
                              height: 28
                            }]}>
                              <Text style={[styles.avatarText, {fontSize: 14}]}>
                                {message.from.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            
                            <View style={styles.threadMessageSender}>
                              <Text style={[styles.threadSenderName, {color: gmailTheme.text.primary}]}>
                                {formatEmailAddress(message.from).name}
                              </Text>
                              <Text style={[styles.threadSenderDate, {color: gmailTheme.text.secondary}]}>
                                {formatDate(message.date)}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.threadMessageBody}>
                            {renderPlainTextContent(message.body)}
                          </View>

                          {/* Attachments for each message in thread */}
                          {message.hasAttachments && message.attachments && message.attachments.length > 0 && (
                            <View style={[styles.messageAttachmentsSection]}>
                              <Text style={[styles.attachmentsHeading, {color: gmailTheme.text.primary}]}>
                                Attachments ({message.attachments.length})
                              </Text>
                              
                              {/* Render each attachment */}
                              <View style={styles.attachmentsGrid}>
                                {message.attachments.map((attachment, idx) => (
                                  <React.Fragment key={`attachment-${message.id}-${attachment.id}`}>
                                    {renderAttachmentItem(attachment, idx)}
                                  </React.Fragment>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    renderPlainTextContent(emailBody)
                  )}
                </View>
                
                {/* Attachments - if any and not a demo email */}
                {!isDemoEmail(currentEmail) && currentEmail.hasAttachments && currentEmail.attachments && currentEmail.attachments.length > 0 && (
                  <View style={[styles.attachmentsSection, {borderTopColor: gmailTheme.border}]}>
                    <Text style={[styles.attachmentsHeading, {color: gmailTheme.text.primary}]}>
                      Attachments ({currentEmail.attachments.length})
                    </Text>
                    
                    {/* Render each attachment */}
                    {currentEmail.attachments.map((attachment, index) => (
                      <React.Fragment key={`attachment-${attachment.id}`}>
                        {renderAttachmentItem(attachment, index)}
                      </React.Fragment>
                    ))}
                  </View>
                )}
              </RNAnimated.View>
              
              {/* Gmail-style Reply Section */}
              {!showReplyBox ? (
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
                    onPress={() => handleReplyPress('reply')}
                  >
                    <Text style={[styles.replyText, {color: gmailTheme.text.secondary}]}>
                      Reply
                    </Text>
                    <Icon name="reply" size={20} color={gmailTheme.text.secondary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.replyButton}
                    disabled={isActionLoading}
                    onPress={() => handleReplyPress('replyAll')}
                  >
                    <Text style={[styles.replyText, {color: gmailTheme.text.secondary}]}>
                      Reply all
                    </Text>
                    <Icon name="reply-all" size={20} color={gmailTheme.text.secondary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.replyButton}
                    disabled={isActionLoading}
                    onPress={() => handleReplyPress('forward')}
                  >
                    <Text style={[styles.replyText, {color: gmailTheme.text.secondary}]}>
                      Forward
                    </Text>
                    <Icon name="forward" size={20} color={gmailTheme.text.secondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                // Reply composer
                <View style={[
                  styles.replyComposer,
                  {
                    backgroundColor: gmailTheme.surface,
                    shadowColor: isDark ? '#000000' : '#00000030',
                  }
                ]}>
                  <View style={styles.replyHeader}>
                    <Text style={[styles.replyHeaderText, {color: gmailTheme.text.primary}]}>
                      {replyMode === 'reply' ? 'Reply' : 
                       replyMode === 'replyAll' ? 'Reply All' : 'Forward'}
                    </Text>
                    <TouchableOpacity onPress={() => setShowReplyBox(false)}>
                      <Icon name="close" size={20} color={gmailTheme.text.secondary} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={[styles.replyTo, {borderBottomColor: gmailTheme.border}]}>
                    <Text style={[styles.replyToLabel, {color: gmailTheme.text.secondary}]}>
                      {replyMode === 'forward' ? 'To: ' : 'To: ' + senderName}
                    </Text>
                  </View>
                  
                  <TextInput
                    ref={replyInputRef}
                    style={[styles.replyInput, {color: gmailTheme.text.primary}]}
                    multiline
                    placeholder="Compose email"
                    placeholderTextColor={gmailTheme.text.tertiary}
                    value={replyText}
                    onChangeText={setReplyText}
                  />
                  
                  <View style={styles.replyActions}>
                    <View style={styles.replyFormatActions}>
                      <TouchableOpacity style={styles.formatButton}>
                        <Icon name="format-bold" size={20} color={gmailTheme.text.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.formatButton}>
                        <Icon name="format-italic" size={20} color={gmailTheme.text.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.formatButton}>
                        <Icon name="format-underlined" size={20} color={gmailTheme.text.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.formatButton}>
                        <Icon name="attach-file" size={20} color={gmailTheme.text.secondary} />
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        styles.sendButton, 
                        {
                          backgroundColor: replyText.trim() ? gmailTheme.primary : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          opacity: replyText.trim() ? 1 : 0.5
                        }
                      ]}
                      disabled={!replyText.trim()}
                      onPress={handleSendReply}
                    >
                      <Text style={[
                        styles.sendButtonText, 
                        {
                          color: replyText.trim() 
                            ? (isDark ? gmailTheme.text.inverse : '#FFFFFF')
                            : gmailTheme.text.secondary
                        }
                      ]}>
                        Send
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {/* Bottom spacer */}
              <View style={styles.bottomSpacer} />
            </>
          )}
        </ScrollView>
        
        
        {/* Document Viewer Modal for both iOS and Android */}
        <Modal
          visible={viewerVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setViewerVisible(false)}
        >
          <View style={{
            flex: 1, 
            backgroundColor: gmailTheme.background,
            ...Platform.select({
              android: { zIndex: 1000 }
            })
          }}>
            <SafeAreaView style={{flex: 1, backgroundColor: gmailTheme.background}}>
              <View style={styles.viewerHeader}>
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={() => setViewerVisible(false)}
                >
                  <Icon name="close" size={24} color={gmailTheme.text.primary} />
                </TouchableOpacity>
                <Text 
                  style={[styles.viewerTitle, {color: gmailTheme.text.primary}]}
                  numberOfLines={1}
                >
                  {currentViewingFile ? currentViewingFile.split('/').pop() : 'Document Viewer'}
                </Text>
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={() => {
                    if (currentViewingFile) {
                      Share.share({
                        url: currentViewingFile.startsWith('file://') ? currentViewingFile : `file://${currentViewingFile}`,
                        title: currentViewingFile.split('/').pop() || 'Document'
                      });
                    }
                  }}
                >
                  <Icon name="share" size={24} color={gmailTheme.text.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.viewerContainer}>
                {currentViewingFile && (
                  currentViewingFile.endsWith('.pdf') ? (
                    <View style={styles.pdfContainer}>
                      <Pdf
                        source={{ uri: currentViewingFile.startsWith('file://') ? currentViewingFile : `file://${currentViewingFile}` }}
                        onLoadComplete={(numberOfPages, filePath) => {
                          console.log(`PDF loaded: ${numberOfPages} pages from ${filePath}`);
                        }}
                        onPageChanged={(page, numberOfPages) => {
                          console.log(`Current page: ${page}/${numberOfPages}`);
                        }}
                        onError={(error) => {
                          console.error('PDF Error:', error);
                          Alert.alert('Error', 'Failed to load PDF file.');
                        }}
                        onPressLink={(uri) => {
                          Linking.openURL(uri);
                        }}
                        style={styles.pdf}
                      />
                    </View>
                  ) : currentViewingFile.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <Image
                      source={{uri: currentViewingFile.startsWith('file://') ? currentViewingFile : `file://${currentViewingFile}`}}
                      style={styles.fullImage}
                      resizeMode="contain"
                    />
                  ) : currentViewingFile.match(/\.(docx|doc|pptx|ppt|xlsx|xls|txt|md|csv)$/i) ? (
                    <View style={styles.documentContainer}>
                      <Icon 
                        name={getDocumentIcon(currentViewingFile)}
                        size={80}
                        color={getDocumentColor(currentViewingFile)}
                      />
                      <Text style={[styles.documentText, {color: gmailTheme.text.primary}]}>
                        {currentViewingFile.split('/').pop()}
                      </Text>
                      <TouchableOpacity
                        style={[styles.openButton, { backgroundColor: gmailTheme.primary }]}
                        onPress={() => {
                          // Open with external app
                          FileViewer.open(currentViewingFile, { showOpenWithDialog: true })
                            .catch((error) => {
                              console.error('Error opening file:', error);
                              Alert.alert('Error', 'Could not open file with external app');
                            });
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '500' }}>Open with External App</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.unsupportedFileContainer}>
                      <Icon name="insert-drive-file" size={80} color={gmailTheme.text.secondary} />
                      <Text style={{color: gmailTheme.text.primary, marginTop: 16, textAlign: 'center'}}>
                        This file type cannot be previewed directly.
                      </Text>
                      <TouchableOpacity
                        style={[styles.openButton, { backgroundColor: gmailTheme.primary, marginTop: 16 }]}
                        onPress={() => {
                          // Open with external app
                          FileViewer.open(currentViewingFile, { showOpenWithDialog: true })
                            .catch((error) => {
                              console.error('Error opening file:', error);
                              Alert.alert('Error', 'Could not open file with external app');
                            });
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '500' }}>Open with External App</Text>
                      </TouchableOpacity>
                    </View>
                  )
                )}
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gmailHeader: {
    height: 56,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
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
    paddingTop: 12,
    paddingBottom: 24,
  },
  emailCard: {
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
  emailBodyContainer: {
    padding: 16,
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
    borderTopWidth: 1,
  },
  attachmentsHeading: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    marginRight: 8,
    width: '48%', // Allow two attachments per row
  },
  attachmentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  attachmentMeta: {
    fontSize: 12,
  },
  attachmentAction: {
    padding: 8,
  },
  downloadProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginTop: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  replySection: {
    margin: 8,
    marginTop: 16,
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
    height: 40,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  quotedText: {
    paddingLeft: 12,
    borderLeftWidth: 3,
    marginVertical: 10,
    marginHorizontal: 4,
  },
  listItem: {
    paddingLeft: 8,
    marginBottom: 12,
    lineHeight: 24,
  },
  emptyContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyContentText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Action menu styles
  actionMenuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionMenu: {
    position: 'absolute',
    top: 56,
    right: 0,
    width: 250,
    borderBottomLeftRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    overflow: 'hidden',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionMenuText: {
    fontSize: 14,
    marginLeft: 16,
  },
  // Reply composer styles
  replyComposer: {
    margin: 8,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  replyHeaderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  replyTo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  replyToLabel: {
    fontSize: 14,
  },
  replyInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  replyFormatActions: {
    flexDirection: 'row',
  },
  formatButton: {
    padding: 8,
  },
  sendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  viewerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  shareButton: {
    padding: 8,
  },
  viewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unsupportedFileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  downloadingContainer: {
    alignItems: 'center',
  },
  progressContainer: {
    width: 48,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 10,
  },
  htmlContentContainer: {
    padding: 8,
    marginVertical: 8,
  },
  
  // Code block styles
  codeBlock: {
    padding: 12,
    borderRadius: 4,
    marginVertical: 8,
    borderWidth: 1,
    overflow: 'scroll',
  },
  codeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Table styles
  tableContainer: {
    borderWidth: 1,
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableCell: {
    padding: 8,
    flex: 1,
    borderRightWidth: 1,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: 'transparent',
  },
  fullImage: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: 'transparent',
  },
  documentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  documentText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  openButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  debugBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  debugBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  threadContainer: {
    width: '100%',
  },
  threadMessage: {
    paddingBottom: 16,
    marginBottom: 16,
  },
  threadMessageDivider: {
    borderBottomWidth: 1,
  },
  threadMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  threadMessageSender: {
    marginLeft: 10,
    flex: 1,
  },
  threadSenderName: {
    fontSize: 14,
    fontWeight: '500',
  },
  threadSenderDate: {
    fontSize: 12,
  },
  threadMessageBody: {
    paddingHorizontal: 4,
  },
  messageAttachmentsSection: {
    marginTop: 16,
    paddingTop: 8,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
}); 

// Add these helper functions before the component return statement

// Get the appropriate icon for document types
function getDocumentIcon(filePath: string): string {
  if (filePath.match(/\.(doc|docx)$/i)) {
    return 'description';
  } else if (filePath.match(/\.(xls|xlsx|csv)$/i)) {
    return 'table-chart';
  } else if (filePath.match(/\.(ppt|pptx)$/i)) {
    return 'slideshow';
  } else if (filePath.match(/\.(txt|md)$/i)) {
    return 'subject';
  } else {
    return 'insert-drive-file';
  }
}

// Get the appropriate color for document types
function getDocumentColor(filePath: string): string {
  if (filePath.match(/\.(doc|docx)$/i)) {
    return '#4285F4'; // Blue for Word
  } else if (filePath.match(/\.(xls|xlsx|csv)$/i)) {
    return '#0F9D58'; // Green for Excel
  } else if (filePath.match(/\.(ppt|pptx)$/i)) {
    return '#F4B400'; // Yellow for PowerPoint
  } else if (filePath.match(/\.(txt|md)$/i)) {
    return '#757575'; // Gray for text files
  } else {
    return '#9E9E9E'; // Gray for other files
  }
}