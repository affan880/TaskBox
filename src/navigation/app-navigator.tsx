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

import { useAuthStore } from '../store/auth-store';
import { AuthNavigator } from './auth-navigator';
import { ProfileScreen } from '../screens/profile/profile-screen';
import { ComposeScreen } from '../screens/email/compose-screen';
import { EmailScreen } from '../screens/email/email-screen';

// Define stack navigator types
export type RootStackParamList = {
  Main: undefined;
  Profile: undefined;
  Auth: undefined;
  Chat: undefined;
};

// Define tab navigator types
type MainTabParamList = {
  Inbox: undefined;
  Compose: undefined;
  Todo: undefined;
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
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = '';
            
            if (route.name === 'Inbox') {
              iconName = focused ? 'mail' : 'mail-outline';
            } else if (route.name === 'Compose') {
              iconName = 'create';
            } else if (route.name === 'Todo') {
              iconName = focused ? 'check-circle' : 'check-circle-outline';
            }
            
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#1976d2',
          tabBarInactiveTintColor: 'gray',
          tabBarLabelStyle: {
            fontSize: 12,
          },
          tabBarStyle: {
            height: 60,
            paddingBottom: 5,
          },
        })}
      >
        <Tab.Screen 
          name="Inbox" 
          component={EmailScreen} 
          options={{ 
            headerShown: false,
          }}
        />
        <Tab.Screen 
          name="Compose" 
          component={ComposeScreen} 
          options={{ 
            headerShown: false,
          }}
        />
        {/* <Tab.Screen 
          name="Todo" 
          component={TodoScreen} 
          options={{ 
            headerShown: false,
          }}
        /> */}
      </Tab.Navigator>
      
      <VoiceButton />
    </View>
  );
}

export function AppNavigator() {
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);
  const initialized = useAuthStore(state => state.initialized);

  // Show a loading spinner while checking authentication
  if (isLoading || !initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator} 
              options={({ navigation }) => ({
                title: 'TaskBox',
                headerRight: () => (
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('Chat')}
                      style={{ marginRight: 16 }}
                    >
                      <Icon name="chat" size={24} color="#1976d2" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('Profile')}
                      style={{ marginRight: 10 }}
                    >
                      <Icon name="account-circle" size={30} color="#1976d2" />
                    </TouchableOpacity>
                  </View>
                ),
              })}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
            />
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
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
}); 