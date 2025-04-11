import * as React from 'react';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  RefreshControl, 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Text,
  Animated,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useEmailActions } from './hooks/use-email-actions';
import { useEmailAttachments, EmailWithAttachments } from './hooks/use-email-attachments';
import { ComposeEmailModal } from './components/compose-modal';
import { LabelModal } from './components/label-modal';
import { SnoozeModal } from './components/snooze-modal';
import { EmailListItem } from './components/email-list-item';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/theme-context';
import type { EmailData, Attachment } from '../../types/email';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SPACING, SHADOWS, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/theme';
import { getCurrentScreenTitle } from '../../utils/utils';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Define RootStackParamList for type safety
type RootStackParamList = {
  ReadEmail: { email: EmailData | EmailWithAttachments };
  Profile: undefined;
  // Add other screens as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define Props for each component
type EmailHeaderProps = {
  insets: { top: number; bottom: number; left: number; right: number };
  getCurrentScreenTitle: () => string;
  onProfilePress: () => void;
  colors: any;
};

type EmailListProps = {
  emails: EmailData[];
  refreshing: boolean;
  handleRefresh: () => void;
  handleOpenEmail: (emailId: string) => Promise<void>;
  handleLongPress: (emailId: string) => void;
  selectedEmails: string[];
  isMultiSelectMode: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  initialLoadComplete: boolean;
  handleLoadMore: () => void;
  colors: any;
};

type ComposeButtonProps = {
  composeTranslateY: Animated.AnimatedInterpolation<string | number>;
  onPress: () => void;
  colors: any;
};

export function EmailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();

  // Use email hooks
  const {
    emails, 
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasAuthFailed,
    initialLoadComplete,
    gmailError,
    handleRefresh,
    handleLoadMore,
    getEmailDetails, 
    archiveEmail,
    deleteEmail,
    markAsUnread,
    markAsRead, 
    applyLabel,
    removeLabel, 
    snoozeEmail,
    sendEmail,
    fetchAttachment,
  } = useEmailActions();

  // Debug log for emails and loading states
  useEffect(() => {
    console.log(`EmailScreen: emails=${emails.length}, isLoading=${isLoading}, initialLoadComplete=${initialLoadComplete}`);
  }, [emails, isLoading, initialLoadComplete]);

  // Use the email attachments hook
  const { 
    loadEmailWithAttachments,
    isLoadingAttachments,
    attachmentError
  } = useEmailAttachments();

  // Screen state for UI elements
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [selectedEmailIdForModal, setSelectedEmailIdForModal] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Animation for FAB
  const fabAnim = useRef(new Animated.Value(1)).current;
  const composeTranslateY = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0], 
  });

  // Get screen title using the utility
  const currentScreenName = route.name;
  const screenTitle = useMemo(() => getCurrentScreenTitle(currentScreenName), [currentScreenName]);

  // Define toggleEmailSelection first
  const toggleEmailSelection = useCallback((emailId: string) => {
    setSelectedEmails(prev => {
      const newSelection = prev.includes(emailId)
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId];

      if (newSelection.length === 0) {
        setIsMultiSelectMode(false);
      }
      return newSelection;
    });
  }, []); // No external dependencies, safe to define early

  // Updated handleOpenEmail using the custom hook
  const handleOpenEmail = useCallback(async (emailId: string) => {
    if (isMultiSelectMode) {
      toggleEmailSelection(emailId);
      return;
    }
    
    console.log(`EmailScreen: Opening email ${emailId}`);
    
    try {
      // Get basic email details
      const emailDetails = await getEmailDetails(emailId);
      
      if (emailDetails) {
        // If email has attachments, load them
        if (emailDetails.hasAttachments) {
          try {
            // Show loading indicator if needed
            const emailWithAttachments = await loadEmailWithAttachments(emailId, emailDetails);
            navigation.navigate('ReadEmail', { email: emailWithAttachments });
          } catch (error) {
            navigation.navigate('ReadEmail', { email: emailDetails });
          }
        } else {
          // No attachments, navigate with original email details
          navigation.navigate('ReadEmail', { email: emailDetails });
        }
      } else {
        Alert.alert('Error', 'Could not load this email. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while trying to open this email.');
    }
  }, [isMultiSelectMode, navigation, getEmailDetails, toggleEmailSelection, loadEmailWithAttachments]);

  // Simplified Apply Label handler
  const handleApplyLabel = useCallback(async (labelId: string) => {
    if (!selectedEmailIdForModal) return; 
    await applyLabel(selectedEmailIdForModal, [labelId]); 
    setShowLabelModal(false);
    setSelectedEmailIdForModal(null); // Reset selected ID
  }, [applyLabel, selectedEmailIdForModal]);

  // Simplified Snooze handler - Make async to match Promise<void> expectation
  const handleSnoozeEmail = useCallback(async (emailId: string, snoozeUntil: Date): Promise<void> => {
    if (!selectedEmailIdForModal || emailId !== selectedEmailIdForModal) return; // Check correct ID is being snoozed
    await snoozeEmail(emailId, snoozeUntil); // Delegate to hook
    setShowSnoozeModal(false);
    setSelectedEmailIdForModal(null); // Reset selected ID
  }, [snoozeEmail, selectedEmailIdForModal]);

  // Simplified Send handler
  const handleSendEmail = useCallback(async (to: string, subject: string, body: string) => {
    const success = await sendEmail(to, subject, body);
    if (success) {
      setShowComposeModal(false);
    } else {
      Alert.alert('Error', 'Failed to send email. Please try again.');
    }
  }, [sendEmail]);

  // Multi-select handlers
  const handleLongPress = useCallback((emailId: string) => {
    setIsMultiSelectMode(true);
    setSelectedEmails([emailId]);
  }, []);

  // Handle auth failure display
  useEffect(() => {
    if (hasAuthFailed) {
      Alert.alert(
        'Authentication Error',
        gmailError || 'Authentication failed. Please try again later.'
      );
    }
  }, [hasAuthFailed, gmailError]);

  const handleProfilePress = useCallback(() => {
    // @ts-ignore - navigation types may not be correctly set
    navigation.navigate('Profile');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <EmailHeader 
        insets={insets} 
        getCurrentScreenTitle={() => screenTitle} 
        onProfilePress={handleProfilePress}
        colors={colors}
      />
      
      <EmailList
        emails={emails}
        refreshing={isRefreshing}
        handleRefresh={handleRefresh}
        handleOpenEmail={handleOpenEmail}
        handleLongPress={handleLongPress}
        selectedEmails={selectedEmails}
        isMultiSelectMode={isMultiSelectMode}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        initialLoadComplete={initialLoadComplete}
        handleLoadMore={handleLoadMore}
        colors={colors}
      />
      
      <ComposeButton
        composeTranslateY={composeTranslateY}
        onPress={() => setShowComposeModal(true)}
        colors={colors}
      />
      
      {/* Modals */}
      <ComposeEmailModal
        visible={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSend={handleSendEmail}
      />
      
      <LabelModal
        visible={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        onSelectLabel={(labelId: string) => {
          if (selectedEmailIdForModal) return handleApplyLabel(labelId);
          return Promise.resolve();
        }}
      />
      
      <SnoozeModal
        visible={showSnoozeModal}
        onClose={() => { setShowSnoozeModal(false); setSelectedEmailIdForModal(null); }}
        onSelectSnoozeTime={(date: Date) => { // Pass the async handler
          if (selectedEmailIdForModal) return handleSnoozeEmail(selectedEmailIdForModal, date);
          // Return a resolved promise if no ID selected to match type
          return Promise.resolve(); 
        }}
      />
    </View>
  );
}

// Email Header Component
const EmailHeader = React.memo(({ insets, getCurrentScreenTitle, onProfilePress, colors }: EmailHeaderProps) => {
  return (
    <View 
      style={[
        styles.headerContainer,
        {
          paddingTop: insets.top,
          backgroundColor: '#ffffff',
          borderBottomColor: 'rgba(120, 139, 255, 0.2)',
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View 
            style={[
              styles.searchBar,
              { 
                flex: 1,
                backgroundColor: '#f1f5ff',
                borderWidth: 1,
                borderColor: 'rgba(120, 139, 255, 0.2)',
                marginRight: 8,
              }
            ]}
          >
            <Icon name="search" size={22} color={colors.brand.primary} style={styles.searchIcon} />
            <Text style={[styles.searchText, { color: colors.text.secondary }]}>
              Search in {getCurrentScreenTitle().toLowerCase()}...
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={() => {
                console.log('AI button pressed');
              }}
            >
              <Image 
                source={require('../../../assets/images/feather.png')}
                style={{ width: 24, height: 24, tintColor: colors.brand.primary }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={onProfilePress}
            >
              <View style={[styles.avatar, { backgroundColor: colors.brand.primary }]}>
                <Text style={styles.avatarText}>SA</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

// Email List Component
const EmailList = React.memo(({ 
  emails,
  refreshing,
  handleRefresh,
  handleOpenEmail,
  handleLongPress,
  selectedEmails,
  isMultiSelectMode,
  isLoading,
  isLoadingMore,
  initialLoadComplete,
  handleLoadMore,
  colors
}: EmailListProps) => {

  // Add debug logging for emails state
  console.log(`EmailList: Rendering with ${emails.length} emails, isLoading=${isLoading}, initialLoadComplete=${initialLoadComplete}`);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator size="small" color={colors.brand.primary} />
        <Text style={[styles.loadingMoreText, { color: colors.text.secondary }]}>
          Loading more emails...
        </Text>
      </View>
    );
  };

  // Modified loading condition - emails.length is checked as a fallback
  // Show loader when either: 
  // 1. We're loading and haven't completed initial load
  // 2. We're loading and have no emails yet
  if ((isLoading && !initialLoadComplete) || (isLoading && emails.length === 0)) {
    console.log('EmailList: Displaying loading indicator');
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary, marginTop: 10 }]}>
          Loading emails...
        </Text>
      </View>
    );
  }

  // Debug output for when we're rendering the actual list
  console.log(`EmailList: Rendering FlatList with ${emails.length} emails`);

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={emails}
      renderItem={({ item }) => {
        console.log(`EmailList: Rendering item ${item.id}`);
        return (
          <EmailListItem
            email={item}
            onPress={() => handleOpenEmail(item.id)}
            onLongPress={() => handleLongPress(item.id)}
            isSelected={selectedEmails.includes(item.id)}
            isSelectMode={isMultiSelectMode}
          />
        );
      }}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.brand.primary]}
          tintColor={colors.brand.primary}
        />
      }
      ListEmptyComponent={() => {
        console.log(`EmailList: Rendering empty component. isLoading=${isLoading}, initialLoadComplete=${initialLoadComplete}`);
        return (
          <View style={styles.emptyContainer}>
            <Icon name="inbox" size={64} color={colors.text.tertiary} />
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {isLoading ? 'Loading emails...' : 'No emails found'}
            </Text>
            {initialLoadComplete && !isLoading && (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleRefresh}
              >
                <Text style={{ color: colors.brand.primary }}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
      ListFooterComponent={renderFooter()}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
});

// Compose Button Component
const ComposeButton = React.memo(({ composeTranslateY, onPress, colors }: ComposeButtonProps) => {
  return (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          transform: [{ translateY: composeTranslateY }],
          bottom: Platform.OS === 'ios' ? 20 : 16,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.brand.primary }]}
        onPress={onPress}
        accessibilityLabel="Compose new email"
        accessibilityHint="Double tap to compose a new email"
      >
        <Icon name="edit" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 130, // Increase to prevent header from hiding content
    paddingBottom: 20, // Add bottom padding for better scroll experience
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: 100,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.md,
  },
  fabContainer: {
    position: 'absolute',
    right: SPACING.md,
    ...SHADOWS.lg,
    zIndex: 10, // Ensure FAB is above content
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.round / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#ffffff', 
    zIndex: 1000, // Ensure header is on top
    height: 'auto', // Let it size to content
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 139, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5, // Add elevation for Android
  },
  header: {
    width: '100%',
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiButton: {
    padding: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    height: 40,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  loaderFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  loadingMoreText: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  avatarContainer: {
    padding: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.round / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.md,
  },
  refreshButton: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#1A73E8', // Use hardcoded color instead of referencing colors
    borderRadius: BORDER_RADIUS.md,
  },
}); 