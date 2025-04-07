/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import * as React from 'react';
import { StatusBar, AppState, AppStateStatus } from 'react-native';
import { AppNavigator } from './src/navigation/app-navigator';
import { useAuthStore } from './src/store/auth-store';

/**
 * TaskBox - A simple task management app with Firebase integration
 */
export default function App() {
  const initializeAuthListener = useAuthStore(state => state.initializeAuthListener);
  const appState = React.useRef(AppState.currentState);

  // Initialize Auth Listener directly
  React.useEffect(() => {
    console.log('Initializing auth listener');
    // Initialize the auth listener and get the cleanup function
    const unsubscribe = initializeAuthListener();
    
    // Clean up the listener when the component unmounts
    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, [initializeAuthListener]);

  // Set up app state change listener to refresh tokens when app comes to foreground
  React.useEffect(() => {
    // Handle app state changes to refresh tokens when app comes back to foreground
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground, refreshing auth token');
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </>
  );
}
