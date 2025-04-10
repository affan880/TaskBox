import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { LoginScreen } from '../screens/auth/login-screen';
import { OnboardingScreen } from '../screens/auth/onboarding-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();
const ONBOARDING_COMPLETE = 'onboarding_complete';

export function AuthNavigator() {
  const [isFirstLaunch, setIsFirstLaunch] = React.useState<boolean | null>(null);
  
  React.useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_COMPLETE).then(value => {
      if (value === null) {
        setIsFirstLaunch(true);
        AsyncStorage.setItem(ONBOARDING_COMPLETE, 'true');
      } else {
        setIsFirstLaunch(false);
      }
    });
  }, []);

  if (isFirstLaunch === null) {
    // We haven't checked AsyncStorage yet
    return null;
  }
  
  return (
    <Stack.Navigator
      initialRouteName={isFirstLaunch ? 'Onboarding' : 'Login'}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
} 