import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  Alert,
  ScrollView,
  Platform,
  Share,
  StatusBar,
  Dimensions,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/slices/auth-slice';
import { useTaskStore } from '@/store/slices/task-slice';
import { useProjectStore } from '@/store/slices/project-slice';
import { useEmailStore } from '@/store/slices/email-slice';
import { useEmailSummaryStore } from '@/lib/store/email-summary-store';
import { storageConfig, clearAllStorage } from '@/lib/storage/storage';
import { Screen } from '@/components/ui/screen';
import { useTheme } from '@/theme/theme-context';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteAccount } from '@/api/gmail-api';
import { auth } from '@/lib/firebase';

// Import types from app-navigator
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

type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);
  const { colors, isDark } = useTheme();
  const [showActions, setShowActions] = React.useState(false);
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  
  // Subscribe to task and project stores with selectors
  const tasks = useTaskStore(state => state.tasks);
  const projects = useProjectStore(state => state.projects);
  
  // Debug logs for tasks
  React.useEffect(() => {
    console.log('Tasks updated:', tasks);
  }, [tasks]);
  
  // Calculate task statistics with proper dependencies
  const taskStats = React.useMemo(() => {
    const completedTasks = tasks.filter(task => task.status === 'completed' || task.isCompleted).length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const todoTasks = tasks.filter(task => task.status === 'todo').length;
    
    const stats = {
      completed: completedTasks,
      inProgress: inProgressTasks,
      todo: todoTasks
    };
    
    console.log('Task stats calculated:', stats);
    return stats;
  }, [tasks]);
  
  // Animation refs
  const profileRef = React.useRef<Animatable.View & View>(null);
  const statsRef = React.useRef<Animatable.View & View>(null);
  
  // Animate components on mount
  React.useEffect(() => {
    if (profileRef.current) {
      profileRef.current.animate({
        0: { opacity: 0, translateY: -20 },
        1: { opacity: 1, translateY: 0 }
      }, 800);
    }
    if (statsRef.current) {
      statsRef.current.animate({
        0: { opacity: 0, translateY: 20 },
        1: { opacity: 1, translateY: 0 }
      }, 800, 200);
    }
  }, []);

  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      
      // Clear all storage
      await clearAllStorage();
      
      // Clear Zustand stores
      useTaskStore.getState().clear();
      useProjectStore.getState().clear();
      useEmailStore.getState().clear();
      useAuthStore.getState().clear();
      
      // Sign out using auth store
      await signOut();
      
      // Navigate to sign in
      navigation.replace('Auth');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditProfile = () => {
    toast.show({
      message: "Edit profile feature coming soon!",
      type: "info"
    });
  };
  
  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out TaskBox - Your Personal Task Manager!\n\nOrganize your tasks, track your progress, and boost your productivity with TaskBox.\n\nDownload now: https://taskbox.space`,
        title: 'TaskBox - Task Manager App',
      });
    } catch (error) {
      toast.show({
        message: "Failed to share app",
        type: "error"
      });
    }
  };
  
  const handleShowUIShowcase = () => {
    navigation.navigate('UIShowcase');
  };

  const handleNavigateToSettings = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://taskbox.space/Terms-of-Use.html');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://taskbox.space/Privacy-Policy.html');
  };

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
              // Get all store instances
              const taskStore = useTaskStore.getState();
              const projectStore = useProjectStore.getState();
              const emailStore = useEmailStore.getState();
              const emailSummaryStore = useEmailSummaryStore.getState();

              // Clear task store
              taskStore.tasks = [];
              taskStore.selectedTask = null;
              taskStore.isLoading = false;
              taskStore.initialized = false;
              taskStore.isUpdating = {};

              // Clear project store
              projectStore.projects = [];
              projectStore.selectedProjectId = null;

              // Clear email store and all related data
              emailStore.emails = [];
              emailStore.isLoading = false;
              emailStore.error = null;
              emailStore.filter = null;
              emailStore.selectedCategory = null;
              emailStore.categories = [];
              emailStore.priorityCount = {
                high: 0,
                medium: 0,
                low: 0,
              };

              // Clear email summary store
              emailSummaryStore.clearSummaries();

              // Clear all storage keys
              const allStorageKeys = [
                // Task related
                'task-storage',
                'task-cache',
                'task-metadata',
                
                // Project related
                'project-storage',
                'project-cache',
                'project-metadata',
                
                // Email related
                'email-storage',
                'email-summaries',
                'email_categories',
                'snoozed_emails',
                'email_priority',
                'email_filters',
                'email_settings',
                'email_sync_status',
                'email_cache',
                'email_metadata',
                'categorized_emails',
                'email_categories_cache',
                
                // Auth related
                'auth-storage',
                'auth-token',
                'auth-refresh-token',
                
                // App related
                'settings-storage',
                'theme-storage',
                'notification-storage',
                'user-preferences',
                'app-settings',
                'last-sync-time',
                'cached-data',
                'offline-data',
                'temp-storage',
                
                // Auto categorization
                'auto-categorization-cache',
                'auto-categorization-settings',
                'auto-categorization-metadata',
                'categorized_emails_cache',
                'email_category_counts',
                'last_email_analysis_time',
                '@email_categories',
                '@last_selected_category'
              ];

              // Remove all storage items
              for (const key of allStorageKeys) {
                await storageConfig.removeItem(key);
                await AsyncStorage.removeItem(key);
              }

              // Clear all AsyncStorage
              await AsyncStorage.clear();

              // Sign out user
              await signOut();
              console.log('[Profile] User signed out');
              
              // Show success message
              toast.show({
                message: "Account successfully deleted",
                type: "success"
              });

              // Navigation will be handled by auth state listener in app-navigator
            } catch (error: any) {
              console.error('[Profile] Error during account deletion:', error);
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again later.'
              );
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
      
      {/* Header with gradient background */}
      <LinearGradient
        colors={[colors.brand.primary, colors.brand.secondary]}
        style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerActions}>
            <ThemeToggle size="md" />
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleShareProfile}
            >
              <Icon name="share-variant" size={20} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <Animatable.View 
          ref={profileRef}
          style={[styles.profileContainer, { backgroundColor: colors.surface.primary, shadowColor: isDark ? '#000' : '#000' }]}
        >
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={handleEditProfile}
          >
            {user?.photoURL ? (
              <Image 
                source={{ uri: user.photoURL }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.surface.secondary }]}> 
                <Text style={[styles.profileImagePlaceholderText, { color: colors.text.secondary }]}> 
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <View style={[styles.editOverlay, { backgroundColor: colors.brand.primary, borderColor: colors.surface.primary }]}> 
              <Icon name="camera" size={24} color={colors.text.inverse} />
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.userName, { color: colors.text.primary }]}> 
            {user?.displayName || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.text.secondary }]}> 
            {user?.email || 'No email'}
          </Text>
        </Animatable.View>

        {/* Stats Section */}
        <Animatable.View 
          ref={statsRef}
          style={styles.statsContainer}
        >
          <View style={[styles.statCard, { backgroundColor: colors.surface.primary, shadowColor: isDark ? '#000' : '#000' }]}> 
            <Icon name="check-circle" size={24} color={colors.status.success} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {taskStats.completed}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface.primary, shadowColor: isDark ? '#000' : '#000' }]}> 
            <Icon name="clock-outline" size={24} color={colors.brand.primary} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {taskStats.inProgress}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>In Progress</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface.primary, shadowColor: isDark ? '#000' : '#000' }]}> 
            <Icon name="format-list-checks" size={24} color={colors.status.warning} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {taskStats.todo}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>To Do</Text>
          </View>
        </Animatable.View>

        {/* Settings Section */}
        <View style={styles.settingsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Settings</Text>
          
          <View style={[styles.settingsCard, { backgroundColor: colors.surface.primary, shadowColor: isDark ? '#000' : '#000' }]}> 
            <TouchableOpacity 
              style={[styles.settingItem]}
              onPress={() => handleNavigateToSettings('ThemeSettings')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.brand.primary + '20' }]}> 
                  <Icon name="palette" size={24} color={colors.brand.primary} />
                </View>
                <Text style={[styles.settingText, { color: colors.text.primary }]}>Appearance</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingItem]}
              onPress={() => handleNavigateToSettings('NotificationSettings')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.status.warning + '20' }]}> 
                  <Icon name="bell-outline" size={24} color={colors.status.warning} />
                </View>
                <Text style={[styles.settingText, { color: colors.text.primary }]}>Notifications</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: 24 }]}>Legal</Text>
          
          <View style={[styles.settingsCard, { backgroundColor: colors.surface.primary, shadowColor: isDark ? '#000' : '#000' }]}> 
            <TouchableOpacity 
              style={[styles.settingItem]}
              onPress={handleOpenTerms}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.status.success + '20' }]}> 
                  <Icon name="file-document-outline" size={24} color={colors.status.success} />
                </View>
                <Text style={[styles.settingText, { color: colors.text.primary }]}>Terms of Use</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingItem]}
              onPress={handleOpenPrivacy}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.status.success + '20' }]}> 
                  <Icon name="shield-outline" size={24} color={colors.status.success} />
                </View>
                <Text style={[styles.settingText, { color: colors.text.primary }]}>Privacy Policy</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: 24 }]}>Account</Text>
          
          <View style={[styles.settingsCard, { backgroundColor: colors.surface.primary, shadowColor: isDark ? '#000' : '#000' }]}> 
            <TouchableOpacity 
              style={[styles.settingItem]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.status.error + '20' }]}> 
                  <Icon name="account-remove-outline" size={24} color={colors.status.error} />
                </View>
                <Text style={[styles.settingText, { color: colors.status.error }]}>Delete Account</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.footer}>
          <Button
            variant="danger"
            onPress={handleSignOut}
            style={styles.signOutButton}
          >
            Sign Out
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
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
    marginTop: 100,
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  settingsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    marginTop: 20,
  },
  signOutButton: {
    width: '100%',
  },
}); 