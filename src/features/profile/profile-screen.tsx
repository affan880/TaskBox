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

// Import types from app-navigator
type RootStackParamList = {
  Main: undefined;
  Profile: undefined;
  Auth: undefined;
  UIShowcase: undefined;
};

type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);
  const { colors, isDark } = useTheme();
  const [showActions, setShowActions] = React.useState(false);
  
  // Animation refs
  const profileRef = React.useRef<Animatable.View & View>(null);
  
  // Animate profile on mount
  React.useEffect(() => {
    if (profileRef.current) {
      profileRef.current.animate({
        0: { opacity: 0, translateY: -20 },
        1: { opacity: 1, translateY: 0 }
      }, 800);
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
  
  const handleShareProfile = () => {
    toast.show({
      message: "Share profile feature coming soon!",
      type: "info"
    });
  };
  
  const handleShowUIShowcase = () => {
    navigation.navigate('UIShowcase');
  };

  return (
    <Screen scrollable={true}>
      <ScrollView>
      <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profile</Text>
        
        <ThemeToggle size="md" />
      </View>

      <Animatable.View 
        ref={profileRef}
        style={[
          styles.profileContainer, 
          { 
            borderBottomColor: colors.border.light,
            backgroundColor: colors.surface.primary
          }
        ]}
      >
        {user?.photoURL ? (
          <Image 
            source={{ uri: user.photoURL }} 
            style={styles.profileImage} 
          />
        ) : (
          <View style={[
            styles.profileImagePlaceholder,
            { backgroundColor: isDark ? colors.surface.secondary : colors.background.secondary }
          ]}>
            <Text style={[
              styles.profileImagePlaceholderText,
              { color: colors.text.secondary }
            ]}>
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
            </Text>
          </View>
        )}
        
        <Text style={[styles.userName, { color: colors.text.primary }]}>
          {user?.displayName || 'User'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.text.secondary }]}>
          {user?.email || 'No email'}
        </Text>
      </Animatable.View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: colors.border.light }]}
          onPress={() => toast.show({ message: "Account settings coming soon!", type: "info" })}
        >
          <Icon name="account-cog" size={24} color={colors.text.tertiary} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Account Settings</Text>
          <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: colors.border.light }]}
          onPress={() => toast.show({ message: "Notification settings coming soon!", type: "info" })}
        >
          <Icon name="bell-outline" size={24} color={colors.text.tertiary} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Notification Settings</Text>
          <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: colors.border.light }]}
          onPress={() => toast.show({ message: "Privacy settings coming soon!", type: "info" })}
        >
          <Icon name="shield-outline" size={24} color={colors.text.tertiary} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Privacy Settings</Text>
          <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: colors.border.light }]}
          onPress={() => toast.show({ message: "Help & support coming soon!", type: "info" })}
        >
          <Icon name="help-circle-outline" size={24} color={colors.text.tertiary} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Help & Support</Text>
          <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: colors.border.light }]}
          onPress={handleShowUIShowcase}
        >
          <Icon name="palette-outline" size={24} color={colors.brand.primary} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: colors.text.primary }]}>UI Components Showcase</Text>
          <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: colors.status.error }]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  profileContainer: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    marginBottom: 8,
    borderRadius: 8,
    margin: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImagePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  optionsContainer: {
    padding: 16,
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
    marginBottom: 35,
  },
  signOutButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 