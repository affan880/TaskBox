import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  View, 
  StyleSheet, 
  Animated, 
  Easing, 
  Modal, 
  Dimensions, 
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '../store/auth-store';
import { AuthNavigator } from './auth-navigator';
import { ProfileScreen } from '../screens/profile/profile-screen';
import { ComposeScreen } from '../screens/email/compose-screen';
import { EmailScreen } from '../screens/email/email-screen';
import { COLORS } from '../theme/colors';

// Define navigator types
export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
};

export type MainTabParamList = {
  Inbox: undefined;
  Profile: undefined;
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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = route.name === 'Inbox' 
            ? focused ? 'mail' : 'mail-outline'
            : focused ? 'person' : 'person-outline';
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.text.secondary,
        tabBarInactiveTintColor: COLORS.text.tertiary,
        tabBarStyle: {
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
          backgroundColor: COLORS.background.secondary,
          borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Inbox" 
        component={EmailScreen}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}

function NavigationRoot() {
  const { user, isLoading, initialized } = useAuthStore();

  if (isLoading || !initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.text.secondary} />
      </View>
    );
  }

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

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <NavigationRoot />
      </NavigationContainer>
    </SafeAreaProvider>
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
    backgroundColor: COLORS.background.primary,
  },
}); 