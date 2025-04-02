import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth-store';
import { AuthNavigator } from './auth-navigator';
import { HomeScreen } from '../screens/home-screen';
import { EmailScreen } from '../screens/email/email-screen';

// Root navigation stack param list
export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Email: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const user = useAuthStore.useUser();
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is signed in
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Email" component={EmailScreen} />
          </>
        ) : (
          // User is not signed in
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 