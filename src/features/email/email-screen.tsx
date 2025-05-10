import * as React from 'react';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated,
  Alert,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useEmailActions } from './hooks/use-email-actions';
import { useAutoCategorization } from './hooks/use-auto-categorization';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme/theme-context';
import type { EmailData } from '@/types/email';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCurrentScreenTitle } from 'src/lib/utils/utils';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { 
  EmailHeader,
  EmailList,
  ComposeButton,
  LabelModal,
  SnoozeModal,
  CategoryFilterBar,
  ChatModal,
  FloatingChatButton,
} from './components';
import { useSharedValue } from 'react-native-reanimated';
import { useEmailStore } from '@/store/slices/email-slice';
import { storageConfig } from '@/lib/storage';
import { ComposeModal } from './components/compose-modal';

type RootStackParamList = {
  ReadEmail: { email: EmailData };
  Profile: undefined;
  MainTabs: { screen: string };
  Compose: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Initial category that will always be present
const INITIAL_CATEGORY = 'All';

export function EmailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();

  // --- State for Category Filter ---
  const [selectedCategory, setSelectedCategory] = useState<string>(INITIAL_CATEGORY);
  const [emailCategories, setEmailCategories] = useState<string[]>([INITIAL_CATEGORY]);

  // Load stored categories on mount
  useEffect(() => {
    const loadStoredCategories = async () => {
      try {
        const storedCategories = await storageConfig.getItem('email_categories');
        if (storedCategories && storedCategories.length > 0) {
          // Ensure "All" category is included
          const categoriesWithAll = storedCategories.includes(INITIAL_CATEGORY) 
            ? storedCategories 
            : [INITIAL_CATEGORY, ...storedCategories];
          setEmailCategories(categoriesWithAll);
        } else {
          // If no stored categories, initialize with just "All"
          setEmailCategories([INITIAL_CATEGORY]);
          await storageConfig.setItem('email_categories', [INITIAL_CATEGORY]);
        }
      } catch (error) {
        console.error('Error loading stored categories:', error);
        // Fallback to just "All" category if there's an error
        setEmailCategories([INITIAL_CATEGORY]);
      }
    };
    loadStoredCategories();
  }, []);

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
  const [showChatModal, setShowChatModal] = useState(false);
  const [isSmartSorting, setIsSmartSorting] = useState(false);
  const [showSortCompleteModal, setShowSortCompleteModal] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [isComposeModalVisible, setIsComposeModalVisible] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Animation values
  const composeTranslateY = useSharedValue(0);

  // Add refreshing state for the main ScrollView
  const [isMainRefreshing, setIsMainRefreshing] = React.useState(false);

  const handleMainRefresh = React.useCallback(async () => {
    setIsMainRefreshing(true);
    await handleRefresh();
    setIsMainRefreshing(false);
  }, [handleRefresh]);

  // Handle selecting a new category: clear search and then set category
  const handleSelectCategory = useCallback((newCategory: string) => {
    setSearchQuery(''); // Clear search input
    setSubmittedSearchQuery(''); // Clear submitted search query
    clearSearch(); // Clear search results and state in the hook
    setSelectedCategory(newCategory); // Set the newly selected category
  }, [setSearchQuery, setSubmittedSearchQuery, clearSearch, setSelectedCategory]);

  // Handle category changes (for managing the list of available categories)
  const handleCategoriesChange = useCallback(async (newCategories: string[]) => {
    try {
      const categoriesWithAll = newCategories.includes(INITIAL_CATEGORY)
        ? newCategories
        : [INITIAL_CATEGORY, ...newCategories];
      setEmailCategories(categoriesWithAll);
      await storageConfig.setItem('email_categories', categoriesWithAll);
    } catch (error) {
      console.error('Error saving categories:', error);
      Alert.alert('Error', 'Failed to save categories. Please try again.');
    }
  }, [setEmailCategories]);

  // Determine the effective loading state for the EmailList
  const effectiveIsLoading = useMemo(() => {
    // If a search has been submitted and is actively running, prioritize isSearching
    if (submittedSearchQuery.trim().length > 0 && isSearching) {
      return true;
    }
    // Otherwise, use the general isLoading state (for initial load, refresh, load more)
    return isLoading;
  }, [submittedSearchQuery, isSearching, isLoading]);

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
    categories: emailCategories.length > 0 ? emailCategories.filter(cat => cat !== INITIAL_CATEGORY) : ['Work', 'Finance', 'Promotions', 'Social', 'Spam'], // Provide default categories if none exist
    pollingInterval: 60000, // 1 minute
    minimumTimeBetweenAnalysis: 300000, // 5 minutes
  });

  // Get screen title using the utility
  const currentScreenName = route.name;
  const screenTitle = useMemo(() => getCurrentScreenTitle(currentScreenName), [currentScreenName]);

  // Replace direct API calls with cached categorization
  const handleSmartSort = React.useCallback(async () => {
    try {
      setIsSmartSorting(true);
      await forceAnalysis();
      await sortEmails();
      
      // Find the category with the most emails after sorting
      const categoryWithMostEmails = Object.entries(categoryCounts || {})
        .reduce((max, [category, count]) => {
          const currentCount = count || 0;
          return currentCount > (max.count || 0) 
            ? { category, count: currentCount }
            : max;
        }, { category: null as string | null, count: 0 });

      if (categoryWithMostEmails.category && categoryWithMostEmails.category !== selectedCategory) {
        setSuggestedCategory(categoryWithMostEmails.category);
        setShowSortCompleteModal(true);
      }
    } catch (error) {
      console.error('Error during smart sort:', error);
      Alert.alert('Error', 'Failed to sort emails. Please try again.');
    } finally {
      setIsSmartSorting(false);
    }
  }, [sortEmails, forceAnalysis, categoryCounts, selectedCategory]);

  // Add handler for category switch
  const handleSwitchCategory = useCallback(() => {
    if (suggestedCategory) {
      setSelectedCategory(suggestedCategory);
      setShowSortCompleteModal(false);
      setSuggestedCategory(null);
    }
  }, [suggestedCategory]);

  // Helper function to get emails for display based on category and search state
  const getEmailsForDisplay = useCallback((): EmailData[] => {
    // If a search query has been submitted and is active, always prioritize search results
    if (submittedSearchQuery.trim().length > 0) {
      // console.log(`[EmailScreen] Using search results for query: "${submittedSearchQuery}"`);
      return searchResults || [];
    }

    // If no active search, filter by selected category
    if (selectedCategory.toLowerCase() === 'all') {
      // console.log(`[EmailScreen] Using all emails for 'All' category`);
      return emails; // Use the main email list from useEmailActions
    }

    // Filter by a specific category using categorizedEmails
    if (categorizedEmails) {
      const actualCategoryKey = Object.keys(categorizedEmails).find(
        key => key.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (actualCategoryKey) {
        // console.log(`[EmailScreen] Using emails for category: ${actualCategoryKey}`);
        return categorizedEmails[actualCategoryKey] || [];
      }
    }

    // Fallback: No search, not 'All', or category not found
    // console.log(`[EmailScreen] No emails found for category: ${selectedCategory}`);
    return [];
  }, [submittedSearchQuery, searchResults, selectedCategory, emails, categorizedEmails]);

  // Get emails for display based on the refined logic
  const displayEmails = useMemo(() => {
    return getEmailsForDisplay();
  }, [getEmailsForDisplay]);

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

  
  // Update the search handler to set submitted query and trigger search
  const handleSearchSubmit = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    setSubmittedSearchQuery(trimmedQuery); // Set the state for display logic
    if (trimmedQuery) {
      triggerImmediateSearch(); // Call the hook function
    } else {
      clearSearch(); // Clear hook state if query is empty
    }
  }, [searchQuery, triggerImmediateSearch, clearSearch, setSubmittedSearchQuery]);

  // Update the clear search handler to clear submitted query
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSubmittedSearchQuery(''); // Clear the submitted query state
    clearSearch(); // Clear hook state (searchResults, etc.)
  }, [clearSearch, setSearchQuery, setSubmittedSearchQuery]);

  // Update the search input change handler
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    // Don't trigger search here, only update the input value
  }, [setSearchQuery]);

  
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

  // Add scroll handler for infinite scrolling
  const handleScroll = useCallback(async (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 50; // Load more when within 50 pixels of the bottom
    
    const isCloseToBottom = 
      layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && !isLoadingMore && !isRefreshing) {
      try {
        await handleLoadMore();
      } catch (error) {
        console.error('Error loading more emails:', error);
      }
    }
  }, [handleLoadMore, isLoadingMore, isRefreshing]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background?.primary }]}>
      <BottomSheetModalProvider>
        <ScrollView
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={isMainRefreshing}
              onRefresh={handleMainRefresh}
              colors={[colors.brand?.primary || '#6366f1']}
              tintColor={colors.brand?.primary || '#6366f1'}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16} // For smooth scroll event handling
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <EmailHeader
              insets={insets}
              screenTitle={screenTitle}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
              onClearSearch={handleClearSearch}
              onCompose={() => setIsComposeModalVisible(true)}
              onSmartSort={handleSmartSort}
              isSmartSorting={isSmartSorting}
            />
            <CategoryFilterBar
              categories={emailCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              categoryCounts={categoryCounts}
              isAnalyzing={isAnalyzing}
              isFirstLoad={!hasInitializedFromCache}
              onCategoriesChange={handleCategoriesChange}
            />
          </View>

          {/* Email List Section */}
          <View style={styles.emailListContainer}>
            <EmailList
              emails={displayEmails}
              isLoading={effectiveIsLoading}
              refreshing={isRefreshing}
              handleRefresh={handleRefresh}
              handleOpenEmail={handleOpenEmail}
              handleLongPress={handleLongPress}
              selectedEmails={selectedEmails}
              isMultiSelectMode={isMultiSelectMode}
              isLoadingMore={isLoadingMore}
              initialLoadComplete={hasInitializedFromCache}
              handleLoadMore={handleLoadMore}
              selectedCategory={selectedCategory}
              onSmartSort={handleSmartSort}
              isAnalyzing={isAnalyzing}
              searchQuery={searchQuery}
              onMarkAsRead={handleMarkAsRead}
              onMarkAsUnread={handleMarkAsUnread}
              onDelete={handleDelete}
              onCloseMultiSelect={handleCloseMultiSelect}
              onToggleRead={handleToggleRead}
              autoCategorizationEnabled={true}
            />
          </View>

          {/* Loading More Indicator */}
          {isLoadingMore && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={colors.brand?.primary} />
              <Text style={[styles.loadingMoreText, { color: colors.text?.secondary }]}>
                Loading more emails...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Floating Action Buttons */}
        {/* <View style={styles.floatingButtonsContainer}>
          <ComposeButton
            onPress={() => setIsComposeModalVisible(true)}
            composeTranslateY={composeTranslateY}
          />
          <FloatingChatButton
            onPress={() => setShowChatModal(true)}
            visible={selectedEmails.length > 0}
          />
        </View> */}

        {/* Modals */}
        <ComposeModal
          visible={isComposeModalVisible}
          onClose={() => setIsComposeModalVisible(false)}
          onSend={sendEmail}
        />

        {showSortCompleteModal && (
          <View style={styles.modalContainer}>
            <Modal
              visible={showSortCompleteModal}
              onRequestClose={() => setShowSortCompleteModal(false)}
              transparent
              animationType="fade"
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowSortCompleteModal(false)}
              >
                <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
                  <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                    Smart Sort Complete
                  </Text>
                  <Text style={[styles.modalText, { color: colors.text.secondary }]}>
                    Most of your emails have been categorized as "{suggestedCategory}". Would you like to switch to this category?
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: colors.brand.primary }]}
                      onPress={handleSwitchCategory}
                    >
                      <Text style={styles.modalButtonText}>Switch Category</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: colors.background.secondary }]}
                      onPress={() => setShowSortCompleteModal(false)}
                    >
                      <Text style={[styles.modalButtonText, { color: colors.text.primary }]}>Stay Here</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}

        <ChatModal
          visible={showChatModal}
          onClose={() => setShowChatModal(false)}
          onAction={(action) => {
            console.log('AI Action:', action);
          }}
        />
      </BottomSheetModalProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainScrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 10,
  },
  emailListContainer: {
    flex: 1,
    paddingTop: 16,
  },
  floatingButtonsContainer: {
    position: 'absolute',
    right: 16,
    bottom: Platform.select({ ios: 100, android: 90 }),
    zIndex: 5,
    transform: [{ rotate: '2deg' }],
  },
  modalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
  },
}); 