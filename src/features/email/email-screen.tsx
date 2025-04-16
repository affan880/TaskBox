import * as React from 'react';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  ActivityIndicator, 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Text,
  Animated,
  Platform,
  Alert,
  Image,
  ScrollView,
  TextStyle,
} from 'react-native';
import { useEmailActions } from './hooks/use-email-actions';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from 'src/theme/theme-context';
import type { EmailData } from 'src/types/email';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCurrentScreenTitle } from 'src/lib/utils/utils';
import { 
  EmailHeader,
  EmailList,
  ComposeButton,
  ComposeEmailModal,
  LabelModal,
  SnoozeModal,
  CategoryFilterBar,
} from './components';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAccessToken } from '@/lib/utils/email-attachments';
import { analyzeEmails } from '@/api/email-analysis-api';

// Define RootStackParamList for type safety
type RootStackParamList = {
  ReadEmail: { email: EmailData };
  Profile: undefined;
  MainTabs: { screen: string };
  // Add other screens as needed
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

  // Screen state for UI elements
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [selectedEmailIdForModal, setSelectedEmailIdForModal] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // --- State for Category Filter ---
  const [selectedCategory, setSelectedCategory] = useState<string>(
    emailCategories[0] // Default to the first category
  );

  // Animation for FAB
  const fabAnim = useRef(new Animated.Value(1)).current;
  const composeTranslateY = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0], 
  });

  // Get screen title using the utility
  const currentScreenName = route.name;
  const screenTitle = useMemo(() => getCurrentScreenTitle(currentScreenName), [currentScreenName]);

  // Store the direct API response
  const [apiCategorizedEmails, setApiCategorizedEmails] = useState<Record<string, any[]> | null>(null);
  
  // Store the processed full email objects by category
  const [categorizedEmailsFull, setCategorizedEmailsFull] = useState<CategorizedEmailsMap | null>(null);

  // Add a state for the smart sort analysis loading state
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Process API response to get full email objects
  const processEmailCategories = useCallback((categorizedEmailsResponse: Record<string, any[]>, allEmails: EmailData[]) => {
    const DEBUG = __DEV__ && false; // Set to true for verbose debugging
    
    if (DEBUG) {
      console.log('Processing categories with:', Object.keys(categorizedEmailsResponse));
      console.log('Total emails in app:', allEmails.length);
    }
    
    // Create a map of all emails with both id and threadId as keys for flexible lookup
    const emailMap = new Map<string, EmailData>();
    const threadMap = new Map<string, EmailData[]>();
    
    allEmails.forEach(email => {
      // Add to ID map
      emailMap.set(email.id, email);
      
      // Also map by threadId for fallback matching
      if (email.threadId) {
        if (!threadMap.has(email.threadId)) {
          threadMap.set(email.threadId, []);
        }
        threadMap.get(email.threadId)?.push(email);
      }
    });
    
    // Create a new object with the same categories but full email objects
    const processedCategories: CategorizedEmailsMap = {};
    
    // Process each category
    Object.keys(categorizedEmailsResponse).forEach(category => {
      const emailsInCategory = categorizedEmailsResponse[category];
      if (DEBUG) console.log(`Processing category ${category} with ${emailsInCategory.length} emails`);
      
      // Map each email to full objects or create placeholders
      const fullEmails: EmailData[] = emailsInCategory
        .map(emailData => {
          // The backend might use messageId field
          const messageId = emailData.messageId || emailData.id;
          const threadId = emailData.threadId;
          
          // First try direct ID match
          let matchedEmail = messageId ? emailMap.get(messageId) : null;
          
          // If no match by ID, try matching by threadId
          if (!matchedEmail && threadId) {
            const threadsEmails = threadMap.get(threadId);
            if (threadsEmails && threadsEmails.length > 0) {
              matchedEmail = threadsEmails[0];
              if (DEBUG) console.log(`Matched by threadId instead: ${threadId}`);
            }
          }
          
          // If still no match, create a new email object from the API data
          if (!matchedEmail) {
            if (DEBUG) console.log(`Creating placeholder email for: ${messageId}`);
            
            // Parse date properly - EmailData expects a string
            let dateStr: string;
            try {
              dateStr = emailData.date || new Date().toISOString();
            } catch (e) {
              dateStr = new Date().toISOString();
            }
            
            // Create a new EmailData object from the API response
            matchedEmail = {
              id: messageId || `temp-${Date.now()}-${Math.random()}`,
              threadId: threadId || messageId || '',
              snippet: emailData.body?.substring(0, 100) || '',
              subject: emailData.subject || 'No subject',
              from: emailData.from || 'Unknown sender',
              to: emailData.to || '',
              date: dateStr,
              body: emailData.body || '',
              isUnread: emailData.labelIds?.includes('UNREAD') || false,
              hasAttachments: false,
              labelIds: emailData.labelIds || [],
              internalDate: dateStr,
              attachments: [],
            };
          }
          
          return matchedEmail;
        })
        .filter((email): email is EmailData => email !== null && email !== undefined);
      
      if (DEBUG) console.log(`Created ${fullEmails.length} emails for category ${category}`);
      
      // Add the category with full email objects to the result
      processedCategories[category] = fullEmails;
    });
    
    return processedCategories;
  }, []);
  
  // Helper function to get emails for a specific category
  const getEmailsForCategory = useCallback((categoryName: string): EmailData[] => {
    if (!categorizedEmailsFull) {
      // No categorized emails available, fallback to default behavior
      return categoryName === 'All' ? emails : [];
    }
    
    if (categoryName === 'All') {
      // For 'All' category, combine all emails from all categories (avoiding duplicates)
      const allCategoryEmails = new Map<string, EmailData>();
      
      Object.values(categorizedEmailsFull).forEach(categoryEmails => {
        categoryEmails.forEach(email => {
          allCategoryEmails.set(email.id, email);
        });
      });
      
      return Array.from(allCategoryEmails.values());
    }
    
    // Return emails for the specified category, or empty array if not found
    return categorizedEmailsFull[categoryName] || [];
  }, [categorizedEmailsFull, emails]);

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
    
    console.log(`EmailScreen: Fetching details for email ${emailId} before navigating...`);
    
    try {
      // Remove the separate token call, let getEmailDetails handle it
      const emailDetails = await getEmailDetails(emailId);
      
      if (emailDetails) {
        console.log(`EmailScreen: Navigating to ReadEmail with email ${emailId}`);
        navigation.navigate('ReadEmail', { email: emailDetails });
      } else {
        console.log(`EmailScreen: getEmailDetails returned null for ${emailId}. Cannot navigate.`);
        Alert.alert('Error', 'Could not load email details. Please try again.');
      }
    } catch (error) {
      console.error("Error fetching email details:", error)
      Alert.alert('Error', 'An error occurred while loading the email.');
    }
  }, [isMultiSelectMode, navigation, getEmailDetails, toggleEmailSelection]);

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
    navigation.navigate('MainTabs', { screen: 'Following' });
  }, [navigation]);

  // Update the filteredEmails logic to use getEmailsForCategory helper
  const filteredEmails = useMemo(() => {
    // Only log in development and avoid excessive logging
    if (__DEV__ && selectedCategory !== 'All') {
      console.log(`Getting emails for category: ${selectedCategory}`);
      const result = getEmailsForCategory(selectedCategory);
      console.log(`Found ${result.length} emails for category ${selectedCategory}`);
      return result;
    }
    return getEmailsForCategory(selectedCategory);
  }, [selectedCategory, getEmailsForCategory]);

  // Update the handleSmartSort function to process categorized emails
  const handleSmartSort = useCallback(async () => {
    if (__DEV__) console.log(`Smart Sort triggered for category: ${selectedCategory}`);
    
    // Set the analyzing state to true to show a loading indicator
    setIsAnalyzing(true);
    
    try {
      // Define days and count based on the selected category
      let days: number | undefined;
      let count: number | undefined;
      
      // Call the API with category-specific parameters
      const analysisResult = await analyzeEmails();
      if (__DEV__) console.log('Email analysis completed');
      
      // Check if we have categorized emails
      if (analysisResult.categorizedEmails) {
        // Store the raw categorized emails from API
        setApiCategorizedEmails(analysisResult.categorizedEmails);
        
        // Process the response to get full email objects
        const processedCategories = processEmailCategories(analysisResult.categorizedEmails, emails);
        setCategorizedEmailsFull(processedCategories);
        
        // Find emails for the selected category
        const categoryEmails = processedCategories[selectedCategory] || [];
        
        if (categoryEmails.length > 0) {
          // Show success message with the count
          Alert.alert(
            'Smart Sort Complete', 
            `Found ${categoryEmails.length} emails in the "${selectedCategory}" category.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // No additional action needed, already on the selected category
                }
              }
            ]
          );
        } else {
          // No emails found for this category, but check if other categories have emails
          const categoriesWithEmails = Object.keys(processedCategories).filter(
            catName => processedCategories[catName]?.length > 0
          );
          
          if (categoriesWithEmails.length > 0) {
            // Suggest the first category that has emails
            const suggestedCategory = categoriesWithEmails[0];
            Alert.alert(
              'No Emails Found', 
              `No emails found in the "${selectedCategory}" category, but found ${processedCategories[suggestedCategory].length} emails in "${suggestedCategory}".`,
              [
                {
                  text: 'Switch to ' + suggestedCategory,
                  onPress: () => {
                    // Switch to the suggested category
                    setSelectedCategory(suggestedCategory);
                  }
                },
                {
                  text: 'Stay Here',
                  style: 'cancel'
                }
              ]
            );
          } else {
            // No emails found in any category
            Alert.alert(
              'No Emails Found', 
              `No emails found in any category.`
            );
          }
        }
      } else {
        // Handle case where no categorizedEmails were returned
        Alert.alert(
          'Smart Sort Complete', 
          `Analysis completed but no categorized emails were found.`
        );
      }
      
    } catch (error) {
      console.error('Error during email analysis:', error);
      Alert.alert(
        'Smart Sort Failed', 
        'There was a problem analyzing your emails. Please try again later.'
      );
    } finally {
      // Set the analyzing state back to false
      setIsAnalyzing(false);
    }
  }, [selectedCategory, emails, processEmailCategories, setSelectedCategory]);

  // Reset categorized emails when changing category
  useEffect(() => {
    // We don't need to reset categorizedEmailsFull here, as we're using getEmailsForCategory
    // to handle category selection. This way we keep the categorization data and just filter it.
  }, [selectedCategory]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background?.primary ?? '#ffffff' }]}>
      <EmailHeader 
        insets={insets} 
        screenTitle={screenTitle}
        onProfilePress={handleProfilePress}
      />
      
      {/* Use the new CategoryFilterBar component */}
      <CategoryFilterBar 
        categories={emailCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory} // Pass the state setter function
      />
        <EmailList
          emails={filteredEmails}
          refreshing={isRefreshing}
          handleRefresh={handleRefresh}
          handleOpenEmail={handleOpenEmail}
          handleLongPress={handleLongPress}
          selectedEmails={selectedEmails}
          isMultiSelectMode={isMultiSelectMode}
          isLoading={isLoading && !initialLoadComplete}
          isLoadingMore={isLoadingMore}
          initialLoadComplete={initialLoadComplete}
          handleLoadMore={handleLoadMore}
          selectedCategory={selectedCategory} // Pass the selected category
          onSmartSort={handleSmartSort} // Pass the Smart Sort handler
          isAnalyzing={isAnalyzing} // Pass the analyzing state to the EmailList
        />
      
      <ComposeButton
        composeTranslateY={composeTranslateY}
        onPress={() => setShowComposeModal(true)}
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
        onSelectSnoozeTime={(date: Date) => {
          if (selectedEmailIdForModal) return handleSnoozeEmail(selectedEmailIdForModal, date);
          return Promise.resolve();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff', // Handled by NativeWind className
  },
}); 