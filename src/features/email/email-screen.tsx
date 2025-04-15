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
  SnoozeModal
} from './components';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Define RootStackParamList for type safety
type RootStackParamList = {
  ReadEmail: { email: EmailData };
  Profile: undefined;
  MainTabs: { screen: string };
  // Add other screens as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
    
    console.log(`EmailScreen: Fetching details for email ${emailId} before navigating...`);
    try {
      // Fetch full email details (now includes attachments metadata)
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

  return (
    <View style={styles.container}>
      <EmailHeader 
        insets={insets} 
        screenTitle={screenTitle}
        onProfilePress={handleProfilePress}
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
    backgroundColor: '#fff',
  },
}); 