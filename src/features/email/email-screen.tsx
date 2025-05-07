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
  LabelModal,
  SnoozeModal,
  CategoryFilterBar,
  ChatModal,
  FloatingChatButton,
} from './components';
import { useSharedValue } from 'react-native-reanimated';
import { useEmailStore } from '@/store/slices/email-slice';
import { storageConfig } from '@/lib/storage';

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

  // Handle category changes
  const handleCategoriesChange = useCallback(async (newCategories: string[]) => {
    try {
      // Ensure "All" category is included
      const categoriesWithAll = newCategories.includes(INITIAL_CATEGORY) 
        ? newCategories 
        : [INITIAL_CATEGORY, ...newCategories];
      
      setEmailCategories(categoriesWithAll);
      await storageConfig.setItem('email_categories', categoriesWithAll);
    } catch (error) {
      console.error('Error saving categories:', error);
      Alert.alert('Error', 'Failed to save categories. Please try again.');
    }
  }, []);

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

  const composeButtonTranslateY = useSharedValue(0);

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

  // Helper function to get emails for a specific category
  const getEmailsForCategory = useCallback((categoryName: string): EmailData[] => {
    // For 'All' category, return all emails regardless of search state
    if (categoryName.toLowerCase() === 'all') {
      return emails;
    }
    
    // If search is active, return search results
    if (searchQuery.trim().length > 0) {
      return searchResults || [];
    }
    
    // If we have categorized emails, use those for specific categories
    if (categorizedEmails) {
      // Find the actual category key by case-insensitive comparison
      const actualCategoryKey = Object.keys(categorizedEmails).find(
        key => key.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (actualCategoryKey) {
        const categoryEmails = categorizedEmails[actualCategoryKey];
        console.log('Category:', categoryName, 'Actual Key:', actualCategoryKey, 'Emails:', categoryEmails?.length || 0);
        return categoryEmails || [];
      }
    }
    
    // No categorized emails available, return empty array for non-All categories
    return [];
  }, [categorizedEmails, emails, searchQuery, searchResults]);

  // Get filtered emails based on selected category
  const filteredEmails = useMemo(() => {
    const result = getEmailsForCategory(selectedCategory);
    // console.log('Selected Category:', selectedCategory, 'Filtered Emails:', result.length);
    return result;
  }, [getEmailsForCategory, selectedCategory]);

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
      <View style={[styles.container, { backgroundColor: colors.background?.primary }]}>
        <EmailHeader
          insets={insets}
          screenTitle={screenTitle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={triggerImmediateSearch}
          onClearSearch={clearSearch}
          onSmartSort={handleSmartSort}
          isSmartSorting={isSmartSorting}
        />
        <CategoryFilterBar
          categories={emailCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
          isAnalyzing={isAnalyzing}
          isFirstLoad={!hasInitializedFromCache}
          onCategoriesChange={handleCategoriesChange}
        />
        <EmailList
          emails={filteredEmails}
          isLoading={isLoading}
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
        {/* <ComposeButton 
          onPress={() => navigation.navigate('Compose')} 
          composeTranslateY={useSharedValue(0)}
        /> */}
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
        <ChatModal
          visible={showChatModal}
          onClose={() => setShowChatModal(false)}
          onAction={(action) => {
            // Handle AI assistant actions
            console.log('AI Action:', action);
          }}
        />
        <FloatingChatButton
          onPress={() => setShowChatModal(true)}
          visible={selectedEmails.length > 0}
        />

        {/* Add Sort Complete Modal */}

        {
          showSortCompleteModal && (
        <View style={{width: '100%', height: '100%', position: 'absolute'}}>
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
          )
        }
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
}); 