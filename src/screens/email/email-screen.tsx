import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  RefreshControl, 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  Image,
  Platform,
  Alert,
  useWindowDimensions
} from 'react-native';
import { useEmailActions } from './hooks/use-email-actions';
import { ComposeEmailModal } from './components/compose-modal';
import { LabelModal } from './components/label-modal';
import { SnoozeModal } from './components/snooze-modal';
import { EmailListItem } from './components/email-list-item';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/theme-context';
import type { EmailData } from '../../types/email';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SPACING, SHADOWS, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/theme';
import { useAuthStore } from '../../store/auth-store';

// Define RootStackParamList for type safety
type RootStackParamList = {
  ReadEmail: { email: EmailData };
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
  const { width, height } = useWindowDimensions();
  const isTablet = width > 768;
  
  // Get auth state from the auth store
  const { initialized: authInitialized } = useAuthStore();
  
  const {
    isLoading,
    loadEmails,
    getEmailDetails,
    archiveEmail,
    deleteEmail,
    markAsUnread,
    applyLabel,
    snoozeEmail,
    sendEmail,
  } = useEmailActions();

  const [emails, setEmails] = useState<EmailData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<EmailData | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);

  const fabAnim = useRef(new Animated.Value(1)).current;
  const loadMoreTimeoutRef = useRef<number>(0);
  const composeTranslateY = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const currentScreenName = route.name;

  // Get current screen title
  const getCurrentScreenTitle = useCallback(() => {
    switch (currentScreenName) {
      case 'AllInbox': return 'All inbox';
      case 'Primary': return 'Primary';
      case 'Social': return 'Social';
      case 'Promotions': return 'Promotions';
      case 'Starred': return 'Starred';
      case 'Snoozed': return 'Snoozed';
      case 'Important': return 'Important';
      case 'Sent': return 'Sent';
      case 'Scheduled': return 'Scheduled';
      case 'Drafts': return 'Drafts';
      case 'Spam': return 'Spam';
      case 'Trash': return 'Trash';
      default: return 'Inbox';
    }
  }, [currentScreenName]);

  // Load emails after auth is initialized
  useEffect(() => {
    if (authInitialized) {
      console.log('Auth initialized, refreshing emails');
      handleRefresh();
    } else {
      console.log('Waiting for auth initialization before loading emails');
    }
  }, [authInitialized, currentScreenName]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    try {
      // We could filter emails by category based on the route name
      const fetchedEmails = await loadEmails();
      setEmails(fetchedEmails);
      setHasMoreEmails(fetchedEmails.length > 0);
    } finally {
      setRefreshing(false);
    }
  }, [loadEmails]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || refreshing || !hasMoreEmails) return;
    
    // Add a small debounce to prevent multiple calls
    const now = Date.now();
    if (loadMoreTimeoutRef.current && now - loadMoreTimeoutRef.current < 500) {
      return;
    }
    loadMoreTimeoutRef.current = now;
    
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      console.log('Loading more emails, page:', nextPage);
      const moreEmails = await loadEmails(nextPage);
      
      if (moreEmails.length === 0) {
        setHasMoreEmails(false);
      } else {
        setEmails(prev => [...prev, ...moreEmails]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more emails:', error);
    } finally {
      setIsLoadingMore(false);
      // Reset timeout after 1 second
      setTimeout(() => {
        loadMoreTimeoutRef.current = 0;
      }, 1000);
    }
  }, [isLoadingMore, refreshing, hasMoreEmails, page, loadEmails]);

  const handleOpenEmail = useCallback(async (emailId: string) => {
    if (isMultiSelectMode) {
      toggleEmailSelection(emailId);
      return;
    }

    try {
      // Create a loading state for this specific operation
      const loadingOpStarted = Date.now();
      setIsLoadingMore(true);
      
      // Get the email details
      const emailDetails = await getEmailDetails(emailId);
      
      // Only navigate if we actually have email details
      if (emailDetails) {
        // Set the current email (keeping this for backward compatibility)
        setCurrentEmail(emailDetails);
        
        // Navigate to the ReadEmail screen instead of showing modal
        navigation.navigate('ReadEmail', { email: emailDetails });
      } else {
        // Handle case where email details are null
        console.error('Failed to load email details. Email ID:', emailId);
        Alert.alert(
          'Error',
          'Could not load this email. Please try again.'
        );
      }
    } catch (error) {
      // Handle any errors that occurred
      console.error('Error opening email:', error);
      Alert.alert(
        'Error',
        'An error occurred while trying to open this email.'
      );
    } finally {
      // Always hide loading indicator with a slight delay to prevent flashing
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 300);
    }
  }, [isMultiSelectMode, getEmailDetails, navigation]);
  
  const handleApplyLabel = useCallback(async (emailId: string, labelId: string) => {
    await applyLabel(emailId, labelId);
    setShowLabelModal(false);
  }, [applyLabel]);

  const handleSnoozeEmail = useCallback(async (emailId: string, snoozeUntil: Date) => {
    await snoozeEmail(emailId, snoozeUntil);
    setShowSnoozeModal(false);
    setEmails(prev => prev.filter(email => email.id !== emailId));
  }, [snoozeEmail]);

  const handleSendEmail = useCallback(async (to: string, subject: string, body: string) => {
    await sendEmail(to, subject, body);
    setShowComposeModal(false);
    handleRefresh();
  }, [sendEmail, handleRefresh]);

  // Handle long press to start multi-select mode
  const handleLongPress = useCallback((emailId: string) => {
    setIsMultiSelectMode(true);
    setSelectedEmails([emailId]);
  }, []);

  // Toggle email selection in multi-select mode
  const toggleEmailSelection = useCallback((emailId: string) => {
    setSelectedEmails(prev => {
      if (prev.includes(emailId)) {
        const newSelection = prev.filter(id => id !== emailId);
        if (newSelection.length === 0) {
          setIsMultiSelectMode(false);
        }
        return newSelection;
      } else {
        return [...prev, emailId];
      }
    });
  }, []);

  const handleProfilePress = useCallback(() => {
    // @ts-ignore - navigation types may not be correctly set
    navigation.navigate('Profile');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <EmailHeader 
        insets={insets} 
        getCurrentScreenTitle={getCurrentScreenTitle} 
        onProfilePress={handleProfilePress}
        colors={colors}
      />
      
      <EmailList
        emails={emails}
        refreshing={refreshing}
        handleRefresh={handleRefresh}
        handleOpenEmail={handleOpenEmail}
        handleLongPress={handleLongPress}
        selectedEmails={selectedEmails}
        isMultiSelectMode={isMultiSelectMode}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
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
          if (selectedEmailId) return handleApplyLabel(selectedEmailId, labelId);
          return Promise.resolve();
        }}
      />
      
      <SnoozeModal
        visible={showSnoozeModal}
        onClose={() => setShowSnoozeModal(false)}
        onSelectSnoozeTime={(date: Date) => {
          if (selectedEmailId) return handleSnoozeEmail(selectedEmailId, date);
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
  handleLoadMore,
  colors
}: EmailListProps) => {

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

  // Check if we're still in initial loading state
  if (isLoading && emails.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary, marginTop: 10 }]}>
          Loading emails...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={emails}
      renderItem={({ item }) => (
        <EmailListItem
          email={item}
          onPress={() => handleOpenEmail(item.id)}
          onLongPress={() => handleLongPress(item.id)}
          isSelected={selectedEmails.includes(item.id)}
          isSelectMode={isMultiSelectMode}
        />
      )}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.brand.primary]}
          tintColor={colors.brand.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={64} color={colors.text.tertiary} />
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No emails found
          </Text>
        </View>
      }
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
}); 