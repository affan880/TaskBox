/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import * as React from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/app-navigator';
import { initializeFirebase } from './src/config/firebase';
import { useAuthStore } from './src/store/auth-store';

/**
 * TaskBox - A simple task management app with Firebase integration
 */
export default function App() {
  const { initializeAuthListener } = useAuthStore.useActions();

  React.useEffect(() => {
    try {
      initializeFirebase();
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    }
  }, []);

  React.useEffect(() => {
    // Initialize the auth listener and get the cleanup function
    const unsubscribe = initializeAuthListener();
    
    // Clean up the listener when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [initializeAuthListener]);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </>
  );
}
