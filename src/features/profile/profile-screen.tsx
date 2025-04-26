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
        backgroundColor={colors.background.primary}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { 
          borderBottomColor: colors.border.light,
          backgroundColor: colors.background.primary,
          paddingTop: insets.top
        }]}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profile</Text>
          <View style={styles.headerActions}>
            <ThemeToggle size="md" />
            <TouchableOpacity 
              style={[styles.headerButton, { 
                backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary 
              }]}
              onPress={handleShareProfile}
            >
              <Icon name="share-variant" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Animatable.View 
          ref={profileRef}
          style={[
            styles.profileContainer, 
            { 
              borderBottomColor: colors.border.light,
              backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary,
              shadowColor: isDark ? colors.border.light : '#000',
              shadowOpacity: isDark ? 0.1 : 0.05,
            }
          ]}
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
              <View style={[
                styles.profileImagePlaceholder,
                { backgroundColor: isDark ? colors.surface.primary : colors.background.secondary }
              ]}>
                <Text style={[
                  styles.profileImagePlaceholderText,
                  { color: colors.text.secondary }
                ]}>
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <View style={[styles.editOverlay, { 
              backgroundColor: colors.brand.primary + '80',
              borderColor: isDark ? colors.surface.primary : 'white'
            }]}>
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

        <Animatable.View 
          ref={statsRef}
          style={styles.statsContainer}
        >
          <View style={[styles.statCard, { 
            backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary,
            shadowColor: isDark ? colors.border.light : '#000',
            shadowOpacity: isDark ? 0.1 : 0.05,
          }]}>
            <Icon name="check-circle" size={24} color={colors.status.success} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Completed Tasks</Text>
          </View>
          <View style={[styles.statCard, { 
            backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary,
            shadowColor: isDark ? colors.border.light : '#000',
            shadowOpacity: isDark ? 0.1 : 0.05,
          }]}>
            <Icon name="clock-outline" size={24} color={colors.brand.primary} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>5</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>In Progress</Text>
          </View>
          <View style={[styles.statCard, { 
            backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary,
            shadowColor: isDark ? colors.border.light : '#000',
            shadowOpacity: isDark ? 0.1 : 0.05,
          }]}>
            <Icon name="star" size={24} color={colors.status.warning} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>3</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Starred</Text>
          </View>
        </Animatable.View>

        <View style={[styles.optionsContainer, { 
          backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary,
          borderRadius: 12,
          marginHorizontal: 16,
          shadowColor: isDark ? colors.border.light : '#000',
          shadowOpacity: isDark ? 0.1 : 0.05,
        }]}>
          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: colors.border.light }]}
            onPress={() => handleNavigateToSettings('Settings')}
          >
            <Icon name="account-cog" size={24} color={colors.text.tertiary} style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: colors.text.primary }]}>Account Settings</Text>
            <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: colors.border.light }]}
            onPress={() => handleNavigateToSettings('Notifications')}
          >
            <Icon name="bell-outline" size={24} color={colors.text.tertiary} style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: colors.text.primary }]}>Notification Settings</Text>
            <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: colors.border.light }]}
            onPress={() => handleNavigateToSettings('Privacy')}
          >
            <Icon name="shield-outline" size={24} color={colors.text.tertiary} style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: colors.text.primary }]}>Privacy Settings</Text>
            <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: colors.border.light }]}
            onPress={() => handleNavigateToSettings('Help')}
          >
            <Icon name="help-circle-outline" size={24} color={colors.text.tertiary} style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: colors.text.primary }]}>Help & Support</Text>
            <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.option]}
            onPress={handleShowUIShowcase}
          >
            <Icon name="palette-outline" size={24} color={colors.brand.primary} style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: colors.text.primary }]}>UI Components Showcase</Text>
            <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileContainer: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    marginBottom: 8,
    borderRadius: 12,
    margin: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
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
  optionsContainer: {
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  option: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  footer: {
    padding: 16,
    marginTop: 'auto',
  },
  signOutButton: {
    width: '100%',
  },
}); 