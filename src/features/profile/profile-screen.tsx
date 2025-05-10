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

type SettingItem = {
  icon: string;
  color: string;
  label: string;
  onPress: () => void | Promise<void>;
  isDanger?: boolean;
};

type SettingSection = {
  title: string;
  items: SettingItem[];
};

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
        message: `Check out Plexar - Your Personal Task Manager!\n\nOrganize your tasks, track your progress, and boost your productivity with Plexar.\n\nDownload now: https://taskbox.space`,
        title: 'Plexar - Task Manager App',
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
    Linking.openURL('http://plexar.xyz/terms-of-use/');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('http://plexar.xyz/privacy-policy/');
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.header, { 
          backgroundColor: colors.brand.primary,
          transform: [{ rotate: '-1deg' }]
        }]}>
          <View style={styles.headerTop}>
            <Text style={[styles.headerTitle, { transform: [{ rotate: '1deg' }] }]}>Profile</Text>
            <View style={[styles.headerActions, { transform: [{ rotate: '1deg' }] }]}>
              <ThemeToggle size="md" />
              <TouchableOpacity 
                style={[styles.headerButton, { transform: [{ rotate: '2deg' }] }]}
                onPress={handleShareProfile}
              >
                <Icon name="share-variant" size={20} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Info */}
          <View style={[styles.profileInfo, { transform: [{ rotate: '1deg' }] }]}>
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
                  <Text style={[styles.profileImagePlaceholderText, { color: colors.text.inverse }]}> 
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
              <View style={[styles.editOverlay, { backgroundColor: colors.surface.primary }]}> 
                <Icon name="camera" size={20} color={colors.brand.primary} />
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {[
            { icon: "check-circle", color: colors.status.success, label: "Completed", value: taskStats.completed },
            { icon: "clock-outline", color: colors.brand.primary, label: "In Progress", value: taskStats.inProgress },
            { icon: "format-list-checks", color: colors.status.warning, label: "To Do", value: taskStats.todo }
          ].map((stat, index) => (
            <View 
              key={stat.label}
              style={[
                styles.statCard, 
                { 
                  backgroundColor: colors.surface.primary,
                  transform: [{ rotate: `${index % 2 === 0 ? '1deg' : '-1deg'}` }],
                  borderWidth: 3,
                  borderColor: '#000000',
                }
              ]}
            >
              <Icon name={stat.icon} size={24} color={stat.color} />
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Settings Sections */}
        {([
          {
            title: 'Settings',
            items: [
              { icon: 'palette', color: colors.brand.primary, label: 'Appearance', onPress: () => handleNavigateToSettings('ThemeSettings') },
              { icon: 'bell-outline', color: colors.status.warning, label: 'Notifications', onPress: () => handleNavigateToSettings('NotificationSettings') }
            ]
          },
          {
            title: 'Legal',
            items: [
              { icon: 'file-document-outline', color: colors.status.success, label: 'Terms of Use', onPress: handleOpenTerms },
              { icon: 'shield-outline', color: colors.status.success, label: 'Privacy Policy', onPress: handleOpenPrivacy }
            ]
          },
          {
            title: 'Account',
            items: [
              { icon: 'account-remove-outline', color: colors.status.error, label: 'Delete Account', onPress: handleDeleteAccount, isDanger: true }
            ]
          }
        ] as SettingSection[]).map((section, sectionIndex) => (
          <View key={section.title} style={styles.settingsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{section.title}</Text>
            <View 
              style={[
                styles.settingsCard, 
                { 
                  backgroundColor: colors.surface.primary,
                  transform: [{ rotate: sectionIndex % 2 === 0 ? '1deg' : '-1deg' }],
                  borderWidth: 3,
                  borderColor: '#000000',
                }
              ]}
            >
              {section.items.map((item, index) => (
                <TouchableOpacity 
                  key={item.label}
                  style={[
                    styles.settingItem,
                    index !== section.items.length - 1 && {
                      borderBottomWidth: 2,
                      borderBottomColor: '#000000',
                    }
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { 
                      backgroundColor: item.color + '20',
                      transform: [{ rotate: '-2deg' }],
                      borderWidth: 2,
                      borderColor: '#000000',
                    }]}> 
                      <Icon name={item.icon} size={24} color={item.color} />
                    </View>
                    <Text style={[
                      styles.settingText, 
                      { color: item.isDanger ? colors.status.error : colors.text.primary }
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.signOutButton,
              {
                backgroundColor: colors.status.error,
                transform: [{ rotate: '-1deg' }],
                borderWidth: 3,
                borderColor: '#000000',
              }
            ]}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : (StatusBar.currentHeight || 20) + 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 4,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
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
  profileInfo: {
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  settingsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingsCard: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 8,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    transform: [{ rotate: '1deg' }],
  },
}); 