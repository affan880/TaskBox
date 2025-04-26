import * as React from 'react';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useEmailActions } from './hooks/use-email-actions';
import { useAutoCategorization } from './hooks/use-auto-categorization';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from 'src/theme/theme-context';
import type { EmailData } from 'src/types/email';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCurrentScreenTitle } from 'src/lib/utils/utils';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { 
  EmailHeader,
  EmailList,
  ComposeButton,
  ComposeModal,
  LabelModal,
  SnoozeModal,
  CategoryFilterBar,
} from './components';
import { useSharedValue } from 'react-native-reanimated';
import { useEmailStore } from '@/store/email-store';

type RootStackParamList = {
  ReadEmail: { email: EmailData };
  Profile: undefined;
  MainTabs: { screen: string };
  Compose: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define categories
const emailCategories: string[] = [
  'All',
  'Follow-up',
  'Work',
  'Finance',
  'Health',
  'Events',
  'Promotions',
  'Social',
  'Spam',
];

// Type for categorized emails (full objects)
type CategorizedEmailsMap = Record<string, EmailData[]>;

// Update the SnoozeModal interface
interface SnoozeModalProps {
  visible: boolean;
  onClose: () => void;
  onSnooze: (date: Date) => void;
}

export function EmailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();
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
    searchQuery, 
    setSearchQuery, 
    searchResults,
    isSearching,
    triggerImmediateSearch,
    clearSearch,
  } = useEmailActions();

  const { sortEmails } = useEmailStore();

  // Screen state for UI elements
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [selectedEmailIdForModal, setSelectedEmailIdForModal] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');

  // --- State for Category Filter ---
  const [selectedCategory, setSelectedCategory] = useState<string>(

      
    emailCategories[0] // Default to the first category
  );

  // Add auto-categorization with the enhanced hook
  const {
    categorizedEmails,
    categoryCounts,
    isAnalyzing,
    lastAnalysisTime,
    forceAnalysis,
    hasInitializedFromCache
  } = useAutoCategorization(emails, {
    enabled: true,
    categories: emailCategories,
    pollingInterval: 60000, // 1 minute
    minimumTimeBetweenAnalysis: 300000, // 5 minutes
  });

  // Animation for FAB
  const fabAnim = useRef(new Animated.Value(1)).current;
  const composeButtonTranslateY = useSharedValue(0);

  // Get screen title using the utility
  const currentScreenName = route.name;
  const screenTitle = useMemo(() => getCurrentScreenTitle(currentScreenName), [currentScreenName]);

  // Replace direct API calls with cached categorization
  const handleSmartSort = React.useCallback(() => {
    forceAnalysis();
    sortEmails();
  }, [sortEmails]);

  // Helper function to get emails for a specific category
  const getEmailsForCategory = useCallback((categoryName: string): EmailData[] => {
    // For 'All' category or when search is active, use the original emails array
    if (categoryName === 'All' || searchQuery.trim().length > 0) {
      return emails;
    }
    
    // If we have categorized emails, use those for specific categories
    if (categorizedEmails) {
      // Return emails for the specified category, or empty array if not found
      return categorizedEmails[categoryName] || [];
    }
    
    // No categorized emails available, fallback to empty array for non-All categories
    return [];
  }, [categorizedEmails, emails, searchQuery]);

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
    
    try {
      const emailDetails = await getEmailDetails(emailId);
      console.log('emailDetails', emailDetails);
      if (emailDetails) {
        // Mark as read when opening email
        if (emailDetails.isUnread) {
          await markAsRead(emailId);
        }
        navigation.navigate('ReadEmail', { email: emailDetails });
      } else {
        Alert.alert('Error', 'Could not load email details. Please try again.');
      }
    } catch (error) {
      console.error("Error fetching email details:", error)
      Alert.alert('Error', 'An error occurred while loading the email.');
    }
  }, [isMultiSelectMode, navigation, getEmailDetails, markAsRead, toggleEmailSelection]);

  // Simplified Apply Label handler
  const handleApplyLabel = useCallback(async (labelId: string) => {
    if (!selectedEmailIdForModal) return; 
    await applyLabel(selectedEmailIdForModal, [labelId]); 
    setShowLabelModal(false);
    setSelectedEmailIdForModal(null); // Reset selected ID
  }, [applyLabel, selectedEmailIdForModal]);

  // Simplified Snooze handler
  const handleSnoozeEmail = useCallback(async (emailId: string, snoozeUntil: Date): Promise<void> => {
    if (!selectedEmailIdForModal || emailId !== selectedEmailIdForModal) return;
    await snoozeEmail(emailId, snoozeUntil);
    setShowSnoozeModal(false);
    setSelectedEmailIdForModal(null);
  }, [snoozeEmail, selectedEmailIdForModal]);

  // Simplified Send handler
  const handleSendEmail = useCallback(async (to: string, subject: string, body: string) => {
    const success = await sendEmail(to, subject, body);
    if (success) {
      setShowLabelModal(false);
    } else {
      Alert.alert('Error', 'Failed to send email. Please try again.');
    }
  }, [sendEmail]);

  // Multi-select handlers
  const handleLongPress = useCallback((emailId: string) => {
    setIsMultiSelectMode(true);
    setSelectedEmails([emailId]);
  }, []);

  const handleMarkAsRead = useCallback(async (emailIds: string[]) => {
    try {
      const promises = emailIds.map(id => markAsRead(id));
      await Promise.all(promises);
      setSelectedEmails([]);
      setIsMultiSelectMode(false);
    } catch (error) {
      console.error('Error marking emails as read:', error);
      Alert.alert('Error', 'Failed to mark emails as read. Please try again.');
    }
  }, [markAsRead]);

  const handleMarkAsUnread = useCallback(async (emailIds: string[]) => {
    try {
      const promises = emailIds.map(id => markAsUnread(id));
      await Promise.all(promises);
      setSelectedEmails([]);
      setIsMultiSelectMode(false);
    } catch (error) {
      console.error('Error marking emails as unread:', error);
      Alert.alert('Error', 'Failed to mark emails as unread. Please try again.');
    }
  }, [markAsUnread]);

  const handleDelete = useCallback(async (emailIds: string[]) => {
    Alert.alert(
      'Delete Emails',
      `Are you sure you want to delete ${emailIds.length} email${emailIds.length > 1 ? 's' : ''}?`,
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
              const promises = emailIds.map(id => deleteEmail(id));
              await Promise.all(promises);
              setSelectedEmails([]);
              setIsMultiSelectMode(false);
            } catch (error) {
              console.error('Error deleting emails:', error);
              Alert.alert('Error', 'Failed to delete emails. Please try again.');
            }
          },
        },
      ]
    );
  }, [deleteEmail]);

  const handleCloseMultiSelect = useCallback(() => {
    setSelectedEmails([]);
    setIsMultiSelectMode(false);
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
    navigation.navigate('Profile');
  }, [navigation]);

  // Update the filteredEmails logic to use getEmailsForCategory helper
  const filteredEmails = useMemo(() => {
    return getEmailsForCategory(selectedCategory);
  }, [selectedCategory, getEmailsForCategory]);

  // Update the search handler to only trigger on submission
  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      setSubmittedSearchQuery(searchQuery);
      triggerImmediateSearch();
    } else {
      setSubmittedSearchQuery('');
      clearSearch();
    }
  }, [searchQuery, triggerImmediateSearch, clearSearch, setSubmittedSearchQuery]);

  // Update the clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSubmittedSearchQuery('');
    clearSearch();
  }, [clearSearch, setSearchQuery, setSubmittedSearchQuery]);

  // Update the search input change handler
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    // Don't trigger search here, only update the input value
  }, [setSearchQuery]);

  // --- Determine which list to show --- 
  const isSearchActive = searchQuery.trim().length > 0;
  const emailsToShow = isSearchActive ? searchResults : filteredEmails;
  // Determine loading state based on whether search is active
  const showLoading = isSearchActive ? isSearching : (isLoading && !initialLoadComplete);

  const handleToggleRead = useCallback(async (emailId: string, isUnread: boolean) => {
    try {
      if (isUnread) {
        await markAsUnread(emailId);
      } else {
        await markAsRead(emailId);
      }
    } catch (error) {
      console.error('Error toggling read state:', error);
      Alert.alert('Error', 'Failed to update email status. Please try again.');
    }
  }, [markAsRead, markAsUnread]);

  return (
    <BottomSheetModalProvider>
      <View style={[styles.container, { backgroundColor: colors.background?.secondary ?? '#f7f8fa' }]}>
        <EmailHeader 
          insets={insets} 
          screenTitle={screenTitle}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          onClearSearch={handleClearSearch}
          onSmartSort={handleSmartSort}
        />
        
        {/* Enhanced CategoryFilterBar with counts */}
        <CategoryFilterBar 
          categories={emailCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
          isAnalyzing={isAnalyzing}
          isFirstLoad={!initialLoadComplete && !hasInitializedFromCache}
        />

        {/* Action Bar for Multi-select Mode */}
        {isMultiSelectMode && (
          <View style={[styles.actionBar, { 
            backgroundColor: colors.surface.primary,
            borderBottomColor: colors.border.light,
          }]}>
            <View style={styles.actionBarLeft}>
              <Text style={[styles.actionBarText, { color: colors.text.primary }]}>
                {selectedEmails.length} selected
              </Text>
            </View>
            <View style={styles.actionBarRight}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleMarkAsRead(selectedEmails)}
              >
                <Icon name="email-check" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleMarkAsUnread(selectedEmails)}
              >
                <Icon name="email-outline" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDelete(selectedEmails)}
              >
                <Icon name="delete" size={24} color={colors.status.error} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleCloseMultiSelect}
              >
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Simplified EmailList rendering logic */}
        <EmailList
          // Pass the correctly determined list and loading state
          emails={submittedSearchQuery ? searchResults : filteredEmails}
          isLoading={isSearching || (isLoading && !hasInitializedFromCache)}
          
          // Pass other props based on context (search vs normal)
          refreshing={isRefreshing}
          handleRefresh={handleRefresh}
          isLoadingMore={isLoadingMore}
          handleLoadMore={handleLoadMore}
          initialLoadComplete={initialLoadComplete || hasInitializedFromCache}

          // Common props
          handleOpenEmail={handleOpenEmail}
          handleLongPress={handleLongPress}
          selectedEmails={selectedEmails}
          isMultiSelectMode={isMultiSelectMode}
          selectedCategory={selectedCategory} 
          onSmartSort={handleSmartSort} 
          isAnalyzing={isAnalyzing} 
          // Add searchQuery to EmailList to handle "No results" message
          searchQuery={submittedSearchQuery}
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
          onDelete={handleDelete}
          onCloseMultiSelect={handleCloseMultiSelect}
          onToggleRead={handleToggleRead}
          autoCategorizationEnabled={true}
        />
        
        <ComposeButton
          composeTranslateY={composeButtonTranslateY}
          onPress={() => navigation.navigate('Compose')}
        />
        
        {/* Modals */}
        <LabelModal
          visible={showLabelModal}
          onClose={() => setShowLabelModal(false)}
          onSelectLabel={handleApplyLabel}
        />
        
        <SnoozeModal
          visible={showSnoozeModal}
          onClose={() => setShowSnoozeModal(false)}
          onSnooze={(date: Date) => {
            if (selectedEmailIdForModal) {
              handleSnoozeEmail(selectedEmailIdForModal, date);
            }
          }}
        />
      </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  actionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBarText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
}); 