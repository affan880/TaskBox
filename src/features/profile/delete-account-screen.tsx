import * as React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/slices/auth-slice';
import { useTaskStore } from '@/store/slices/task-slice';
import { useProjectStore } from '@/store/slices/project-slice';
import { useEmailStore } from '@/store/slices/email-slice';
import { useEmailSummaryStore } from '@/lib/store/email-summary-store';
import { clearAllStorage } from '@/lib/storage/storage';
import { auth } from '@/lib/firebase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Main: undefined;
  Profile: undefined;
  Auth: undefined;
  UIShowcase: undefined;
  ThemeSettings: undefined;
  NotificationSettings: undefined;
  HelpSupport: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  About: undefined;
  DeleteAccount: undefined;
};

type DeleteAccountScreenProps = NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>;

export function DeleteAccountScreen({ navigation }: DeleteAccountScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
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
              setIsLoading(true);

              // Clear all storage
              await clearAllStorage();
              
              // Clear Zustand stores
              useTaskStore.getState().clear();
              useProjectStore.getState().clear();
              useEmailStore.getState().clear();
              useAuthStore.getState().clear();
              
              // Delete user from Firebase
              const user = auth.currentUser;
              if (user) {
                await user.delete();
              }

              // Navigate to sign in
              navigation.replace('Auth');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <LinearGradient
        colors={[colors.brand.primary, colors.brand.secondary]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Delete Account</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 20 }
        ]}
      >
        <View style={[styles.warningCard, { backgroundColor: colors.surface.primary }]}>
          <Icon name="alert-circle" size={48} color={colors.status.error} />
          <Text style={[styles.warningTitle, { color: colors.text.primary }]}>
            Warning: This action cannot be undone
          </Text>
          <Text style={[styles.warningText, { color: colors.text.secondary }]}>
            Deleting your account will permanently remove all your data, including:
          </Text>
          <View style={styles.warningList}>
            <View style={styles.warningItem}>
              <Icon name="check" size={20} color={colors.status.error} />
              <Text style={[styles.warningItemText, { color: colors.text.secondary }]}>
                All your tasks and projects
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Icon name="check" size={20} color={colors.status.error} />
              <Text style={[styles.warningItemText, { color: colors.text.secondary }]}>
                Email summaries and categories
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Icon name="check" size={20} color={colors.status.error} />
              <Text style={[styles.warningItemText, { color: colors.text.secondary }]}>
                App settings and preferences
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            variant="danger"
            onPress={handleDeleteAccount}
            style={styles.deleteButton}
          >
            Delete My Account
          </Button>
          <Button
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  warningCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningList: {
    width: '100%',
    gap: 12,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningItemText: {
    fontSize: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  deleteButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
}); 