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
import { ToastProvider } from './src/components/ui/toast';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/theme-context';
import { ErrorBoundary } from './src/components/ui/error-boundary';

// Patch Error.stack to handle potential issues with the 'err' package
if (!('stack' in Error.prototype)) {
  Object.defineProperty(Error.prototype, 'stack', {
    configurable: true,
    get() {
      try {
        return this._stack || '';
      } catch (e) {
        return '';
      }
    },
    set(value) {
      this._stack = value;
    }
  });
}

/**
 * TaskBox - A simple task management app with Firebase integration
 */
export default function App() {
  const initializeAuthListener = useAuthStore(state => state.initializeAuthListener);
  const appState = React.useRef(AppState.currentState);

  // Initialize Auth Listener directly
  React.useEffect(() => {
    const unsubscribe = initializeAuthListener();
    
    // Clean up the listener when the component unmounts
    return () => {
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
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <StatusBar barStyle="dark-content" />
            <AppNavigator />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
