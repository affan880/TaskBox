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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/auth-store';
import { Screen } from '../../components/ui/screen';
import { useTheme } from '../../theme/theme-context';
import { ThemeToggle } from '../../components/ui/theme-toggle';
import { FloatingActionButton } from '../../components/ui/floating-action-button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import { toast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

// Import types from app-navigator
type RootStackParamList = {
  Main: undefined;
  Profile: undefined;
  Auth: undefined;
  UIShowcase: undefined;
  Settings: undefined;
  Notifications: undefined;
  Privacy: undefined;
  Help: undefined;
};

type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);
  const { colors, isDark } = useTheme();
  const [showActions, setShowActions] = React.useState(false);
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  
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

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will handle by auth state listener in app-navigator
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
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
        message: `Check out my profile on TaskBox!`,
        url: 'https://taskbox.app/profile',
      });
    } catch (error) {
      toast.show({
        message: "Failed to share profile",
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
          { paddingBottom: insets.bottom + 20 }
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
            <Text style={[styles.statValue, { color: colors.text.primary }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface.primary, shadowColor: isDark ? '#000' : '#000' }]}> 
            <Icon name="clock-outline" size={24} color={colors.brand.primary} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>5</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>In Progress</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface.primary, shadowColor: isDark ? '#000' : '#000' }]}> 
            <Icon name="star" size={24} color={colors.status.warning} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>3</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Starred</Text>
          </View>
        </Animatable.View>

        {/* Settings Section */}
        <View style={styles.settingsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Settings</Text>
          
          <View style={[styles.settingsCard, { backgroundColor: colors.surface.primary, shadowColor: isDark ? '#000' : '#000' }]}> 
            <TouchableOpacity 
              style={[styles.settingItem]}
              onPress={() => handleNavigateToSettings('Settings')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.brand.primary + '20' }]}> 
                  <Icon name="account-cog" size={24} color={colors.brand.primary} />
                </View>
                <Text style={[styles.settingText, { color: colors.text.primary }]}>Account Settings</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingItem]}
              onPress={() => handleNavigateToSettings('Notifications')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.status.warning + '20' }]}> 
                  <Icon name="bell-outline" size={24} color={colors.status.warning} />
                </View>
                <Text style={[styles.settingText, { color: colors.text.primary }]}>Notifications</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingItem]}
              onPress={() => handleNavigateToSettings('Privacy')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.status.success + '20' }]}> 
                  <Icon name="shield-outline" size={24} color={colors.status.success} />
                </View>
                <Text style={[styles.settingText, { color: colors.text.primary }]}>Privacy</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingItem]}
              onPress={() => handleNavigateToSettings('Help')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.brand.secondary + '20' }]}> 
                  <Icon name="help-circle-outline" size={24} color={colors.brand.secondary} />
                </View>
                <Text style={[styles.settingText, { color: colors.text.primary }]}>Help & Support</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    marginTop: -40,
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