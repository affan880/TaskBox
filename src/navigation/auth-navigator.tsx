import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@/features/auth/login-screen';
import { OnboardingScreen } from '@/features/auth/onboarding-screen';
import { TermsScreen } from '@/features/auth/terms-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/slices/auth-slice';
import { useEffect, useState } from 'react';

export type AuthStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  Terms: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { hasAcceptedTerms } = useAuthStore();

  useEffect(() => {
    AsyncStorage.getItem('alreadyLaunched').then(value => {
      if (value === null) {
        AsyncStorage.setItem('alreadyLaunched', 'true');
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    });
  }, []);

  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={isFirstLaunch ? 'Onboarding' : hasAcceptedTerms ? 'Login' : 'Terms'}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
    </Stack.Navigator>
  );
} 