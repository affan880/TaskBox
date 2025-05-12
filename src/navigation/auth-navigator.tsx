import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '@/features/auth/onboarding-screen';
import { LoginScreen } from '@/features/auth/login-screen';
import { TermsScreen } from '@/features/auth/terms-screen';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Terms: {
    onAccept?: () => Promise<void>;
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen 
        name="Terms" 
        component={TermsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}

export { Stack as AuthStack }; 