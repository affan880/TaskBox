import * as React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  View, 
  StyleSheet, 
  Animated, 
  Modal, 
  Dimensions, 
  SafeAreaView,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme-context';
import { useAuthStore } from '../store/auth-store';
import { AuthNavigator } from './auth-navigator';
import { ProfileScreen } from '../screens/profile/profile-screen';
import { EmailDrawerNavigator } from './email-drawer-navigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UIShowcaseNavigator } from './ui-showcase-navigator';
import { TaskScreen } from '../screens/tasks/task-screen';
import { useUnreadEmailCount } from '../hooks/use-unread-email-count';
import { useNavigation, NavigationProp } from '@react-navigation/native';

// Define navigator types
export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
};

export type MainTabParamList = {
  Email: undefined;
  Tasks: undefined;
  Profile: undefined;
  UIShowcase: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Voice Recognition Button component
const VoiceButton = () => {
  const [isListening, setIsListening] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [recognizedText, setRecognizedText] = React.useState('');
  const animationValues = React.useRef<Animated.Value[]>([]);
  const numBars = 5;

  // Initialize animation values for each bar
  React.useEffect(() => {
    animationValues.current = Array(numBars).fill(0).map(() => new Animated.Value(0));
  }, []);


  return (
    <>
      <View style={styles.voiceContainer}>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            { backgroundColor: isListening ? '#e74c3c' : '#1976d2' }
          ]}
          // onPressIn={handlePressIn}
          // onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <Icon 
            name="mic" 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        // onRequestClose={handleCancelPress}
      >
        <StatusBar backgroundColor="rgba(94, 53, 177, 0.9)" barStyle="light-content" />
        <LinearGradient
          colors={['#9c27b0', '#673ab7', '#3f51b5']}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.modalBackground}
        >
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.waveContainer}>
              {animationValues.current.map((anim, index) => (
                <Animated.View
                  key={`bar-${index}`}
                  style={[
                    styles.waveBar,
                    {
                      transform: [
                        {
                          scaleY: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 1]
                          })
                        }
                      ],
                      opacity: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1]
                      }),
                      marginHorizontal: 3
                    }
                  ]}
                />
              ))}
            </View>
            
            <Text style={styles.listeningText}>{recognizedText}</Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={styles.modalButton}
                activeOpacity={0.7}
              >
                <View style={styles.innerModalButton} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </>
  );
};

function MainTabNavigator() {
  const { colors, isDark } = useTheme();
  const unreadCount = useUnreadEmailCount();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'help-circle-outline'; // Default icon

          if (route.name === 'Email') {
            iconName = focused ? 'email' : 'email-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'check-circle' : 'check-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account-circle' : 'account-circle-outline';
          } else if (route.name === 'UIShowcase') {
            iconName = focused ? 'palette' : 'palette-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.border.light,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Email" 
        component={EmailDrawerNavigator}
        options={{
          tabBarLabel: 'Email',
          tabBarAccessibilityLabel: 'Email tab',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.status.info,
          },
        }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TaskScreen}
        options={{
          tabBarLabel: 'Tasks',
          tabBarAccessibilityLabel: 'Tasks tab',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
      <Tab.Screen 
        name="UIShowcase" 
        component={UIShowcaseNavigator}
        options={{
          tabBarLabel: 'UI Components',
          tabBarAccessibilityLabel: 'UI Components showcase tab',
        }}
      />
    </Tab.Navigator>
  );
}

function NavigationRoot({ forceAuthScreen, onNavigated }: { forceAuthScreen?: boolean; onNavigated?: () => void }) {
  const { user, isLoading, initialized, setUser } = useAuthStore();
  const { colors } = useTheme();
  const didForceAuth = React.useRef(false);

  // Effect to handle force navigation to Auth screen
  React.useEffect(() => {
    // Only run this once per forceAuthScreen=true to prevent loops
    if (forceAuthScreen && user && !didForceAuth.current && onNavigated) {
      console.log('Forcing auth screen, setting user to null');
      didForceAuth.current = true;
      
      // Call onNavigated to reset the forceAuthScreen flag
      onNavigated();
      
      // Set user to null in the auth store instead of navigating directly
      setUser(null);
    } else if (!forceAuthScreen) {
      // Reset the ref when forceAuthScreen is set to false
      didForceAuth.current = false;
    }
  }, [forceAuthScreen, user, onNavigated, setUser]);

  if (isLoading || !initialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  // Simply render appropriate screen based on auth state
  // We don't need to check forceAuthScreen here anymore since we're handling it in the effect
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
        />
      )}
    </Stack.Navigator>
  );
}

export function AppNavigator({ forceAuthScreen, onNavigated }: { forceAuthScreen?: boolean; onNavigated?: () => void }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <NavigationRoot forceAuthScreen={forceAuthScreen} onNavigated={onNavigated} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  voiceContainer: {
    position: 'absolute',
    bottom: 65, // Position above the tab bar
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalBackground: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 50,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  waveBar: {
    width: 6,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  listeningText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '500',
    marginTop: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalButtonContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerModalButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1e0a36',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 